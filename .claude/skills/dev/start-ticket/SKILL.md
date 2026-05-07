---
name: start-ticket
description: "TRIGGER when user pastes a pm.potentialai.com ticket URL. Full ticket lifecycle: create branch + worktree workspace, then finish by creating PR, monitoring CI, merging, and deploying."
argument-hint: "[--all | --manual] [<ticket-url>]"
---

# Start Ticket

## Overview

Full ticket lifecycle skill. When the user pastes a ticket URL from `pm.potentialai.com`, this skill:

1. Fetches ticket details from the production API
2. Creates a properly named branch + isolated git worktree
3. Plans and implements the fix/feature
4. Creates a PR, waits for Codex review, watches deploy

---

## Modes

This skill supports three modes controlled by flags:

### Default (no flag) — Single Ticket
```
/start-ticket https://pm.potentialai.com/projects/{projectId}/tickets/{ticketId}
```
Runs the full lifecycle for a single ticket: Phase A (workspace setup) → Phase B (implementation) → Phase C (PR + review + merge + deploy). Asks for merge confirmation before merging.

### `--all` — Batch Mode
```
/start-ticket --all https://pm.potentialai.com/projects/{projectId}/tickets
```
Requires a **project URL** (ending in `/tickets`). Fetches all open tickets for that project, then runs the full lifecycle for each one sequentially. Auto-merges each ticket if all 3 conditions pass: Codex ✅ PASS + no conflicts + CI ✅ all passed. If any condition fails, notifies the user and waits before continuing to the next ticket.

**How `--all` fetches tickets:**
```bash
PHC_API_URL="${PHC_API_URL:-https://pm.potentialai.com/api}"
# Extract projectId from the URL argument
PROJECT_ID="<extracted from url>"
# Authenticate first (same as Phase A Step 2)
# Then fetch open tickets for this project:
curl -s -b /tmp/phc-cookies.txt \
  "${PHC_API_URL}/projects/${PROJECT_ID}/tickets?status=OPEN&limit=50" \
  | node -e "
    const data = JSON.parse(require('fs').readFileSync(0,'utf8'));
    const tickets = data.data || data.tickets || data;
    tickets.forEach(t => console.log(t.id + '\t' + t.projectId + '\t' + t.ticketNumber + '\t' + t.title));
  "
```
For each ticket returned, construct the full ticket URL (`/projects/{projectId}/tickets/{ticketId}`) and run the full Phase A → B → C flow.

### `--manual` — Manual Handoff Mode
```
/start-ticket --manual https://pm.potentialai.com/projects/{projectId}/tickets/{ticketId}
```
Runs Phase A (full workspace setup: branch, worktree, deps, dev servers), then produces a detailed `IMPLEMENTATION_PLAN.md` and **stops**. No code is written, no PR is created — the developer implements it themselves. See the **Manual Mode** section below for full details.

---

**Announce at start:** "I'm using the start-ticket skill to set up a workspace for this ticket."

---

## Ticket Dashboard Sync

Every phase that changes ticket state MUST sync it back to the PHC dashboard. Each sync point below includes a **complete, self-contained bash script** — do NOT extract a shared function, because each Bash tool call runs in a separate shell.

### Status Lifecycle

| Trigger | New Status | Phase |
|---------|-----------|-------|
| Branch created | `IN_PROGRESS` | Phase A Step 5 |
| PR created | `IN_REVIEW` | Phase C Step 1 |
| PR merged | `RESOLVED` | Phase C Step 3c |

### PATCH Field Reference (`PATCH /api/tickets/{id}`)

| Field | Type | Example | When |
|-------|------|---------|------|
| `status` | string | `"IN_PROGRESS"`, `"IN_REVIEW"`, `"RESOLVED"` | Status transitions |
| `size` | int (1-9) | `3` | After planning |
| `linkedPrs` | array of objects | `[{"url":"...","title":"...","number":3,"state":"open"}]` | After PR creation |

### Sync Script Template

Every sync point uses this pattern. Replace `<PAYLOAD>` and `<DESCRIPTION>` with the specific values. `TICKET_UUID` comes from Phase A Step 3.

```bash
PHC_API_URL="${PHC_API_URL:-https://pm.potentialai.com/api}" && \
PHC_EMAIL="${PHC_EMAIL:-lukas@potentialai.com}" && \
TICKET_UUID="<ticket-uuid>" && \
if [ -z "$PHC_PASSWORD" ]; then
  echo "WARN: PHC_PASSWORD not set — skipping ticket sync"
else
  curl -s -c /tmp/phc-cookies.txt \
    -X POST "${PHC_API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${PHC_EMAIL}\",\"password\":\"${PHC_PASSWORD}\"}" > /dev/null 2>&1 && \
  SYNC_RESP=$(curl -s -w "\n%{http_code}" -b /tmp/phc-cookies.txt \
    -X PATCH "${PHC_API_URL}/tickets/${TICKET_UUID}" \
    -H "Content-Type: application/json" \
    -d '<PAYLOAD>') && \
  SYNC_CODE=$(echo "$SYNC_RESP" | tail -n1) && \
  if [ "$SYNC_CODE" -ge 200 ] && [ "$SYNC_CODE" -lt 300 ]; then
    echo "✓ Ticket synced: <DESCRIPTION>"
  else
    echo "WARN: Ticket sync failed (HTTP ${SYNC_CODE}) — continuing"
  fi
fi
```

### Error Policy

Dashboard sync is **never a gate**. If PATCH fails (auth error, network, unexpected 4xx/5xx), log a warning and continue. The ticket lifecycle must not block on dashboard metadata.

---

## Phase A: Setup Workspace

### Step 1: Parse Ticket URL

Extract IDs from the URL pattern: `https://pm.potentialai.com/projects/{projectId}/tickets/{ticketId}`

```
PROJECT_ID=<extracted>
TICKET_ID=<extracted>
```

If the URL doesn't match this pattern, ask the user for a valid ticket URL. STOP.

### Step 2: Authenticate with PHC API

```bash
PHC_API_URL="${PHC_API_URL:-https://pm.potentialai.com/api}" && \
PHC_EMAIL="${PHC_EMAIL:-lukas@potentialai.com}" && \
if [ -z "$PHC_PASSWORD" ]; then
  echo "ERROR: PHC_PASSWORD environment variable is not set."
  echo "Set it in .claude/settings.local.json under env, or export it in your shell."
  exit 1
fi && \
LOGIN_RESPONSE=$(curl -s -c /tmp/phc-cookies.txt \
  -X POST "${PHC_API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${PHC_EMAIL}\",\"password\":\"${PHC_PASSWORD}\"}") && \
if echo "$LOGIN_RESPONSE" | grep -q "Unauthorized\|Invalid"; then
  echo "ERROR: Login failed. Check PHC_EMAIL and PHC_PASSWORD."
  rm -f /tmp/phc-cookies.txt
  exit 1
fi && \
echo "Authenticated as ${PHC_EMAIL}"
```

### Step 3: Fetch Ticket and Project Data

```bash
PHC_API_URL="${PHC_API_URL:-https://pm.potentialai.com/api}" && \
TICKET_ID="<ticket-id>" && \
PROJECT_ID="<project-id>" && \
TICKET_JSON=$(curl -s -b /tmp/phc-cookies.txt "${PHC_API_URL}/tickets/${TICKET_ID}") && \
PROJECT_JSON=$(curl -s -b /tmp/phc-cookies.txt "${PHC_API_URL}/projects/${PROJECT_ID}") && \
node -e "
const t = ${TICKET_JSON};
const p = ${PROJECT_JSON};
console.log(JSON.stringify({
  ticketNumber: t.ticketNumber,
  title: t.title,
  category: t.category || 'GENERAL',
  priority: t.priority || 'MEDIUM',
  status: t.status || 'OPEN',
  assignee: t.assignee?.name || 'Unassigned',
  dueDate: t.dueDate || 'No due date',
  ticketPrefix: p.ticketPrefix || '',
  projectName: p.name || '',
  description: t.description || ''
}, null, 2));
"
```

### Step 4: Determine Branch Name

Rules:

- **Prefix**: `fix` if category is `BUG`, otherwise `feature`
- **Ticket ID**: `{ticketPrefix}-{ticketNumber zero-padded to 3}`
- **Slug**: title → lowercase → non-alphanumeric to hyphens → collapse multiple hyphens → trim → max 50 chars
- **Branch**: `{prefix}/{ticketId}-{slug}`
- **Worktree**: `.worktrees/{prefix}/{ticketId}`

### Step 5: Create Worktree

```bash
BRANCH_PREFIX="<feature|fix>" && \
TICKET_TITLE="<title>" && \
SLUG=$(echo "$TICKET_TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | cut -c1-50) && \
PADDED_NUM=$(printf "%03d" "<ticketNumber>") && \
BRANCH_NAME="${BRANCH_PREFIX}/<prefix>-${PADDED_NUM}-${SLUG}" && \
echo "Branch: $BRANCH_NAME" && \
TICKET_ID_SHORT="<prefix>-${PADDED_NUM}" && \
WORKTREE_PATH="$(pwd)/.worktrees/${BRANCH_PREFIX}/${TICKET_ID_SHORT}" && \
echo "Worktree: $WORKTREE_PATH" && \

# Check if worktree already exists
for PREFIX_DIR in feature fix; do
  EXISTING_PATH="$(pwd)/.worktrees/${PREFIX_DIR}/${TICKET_ID_SHORT}"
  if [ -d "$EXISTING_PATH" ]; then
    echo "ERROR: Ticket ${TICKET_ID_SHORT} already has an active worktree at ${EXISTING_PATH}"
    exit 1
  fi
done && \

# Ensure .worktrees is gitignored
git check-ignore -q .worktrees 2>/dev/null || {
  echo ".worktrees/" >> .gitignore
  echo "Added .worktrees/ to .gitignore"
} && \

# Fetch latest dev
git fetch origin dev 2>/dev/null && \

# Create worktree
mkdir -p "$(dirname "$WORKTREE_PATH")" && \
git worktree add "$WORKTREE_PATH" -b "${BRANCH_NAME}" origin/dev && \
echo "Worktree created at ${WORKTREE_PATH}" && \

# Push branch
cd "$WORKTREE_PATH" && \
git push -u origin "${BRANCH_NAME}" && \
echo "Branch pushed to origin"
```

#### Sync: Branch created → `IN_PROGRESS`

Authenticate with PHC and PATCH the ticket status. Use the Sync Script Template from the "Ticket Dashboard Sync" section with:
- `<PAYLOAD>`: `{"status": "IN_PROGRESS"}`
- `<DESCRIPTION>`: `status → IN_PROGRESS`

### Step 5.5: Allocate Ports and Configure Worktree Environment

Each worktree gets unique dev server ports so multiple tickets can run simultaneously.

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)

# 1. Read PM2 prefix from ecosystem.config.js
PREFIX=$(node -e "
  try {
    const cfg = require('${PROJECT_ROOT}/ecosystem.config.js');
    const name = (cfg.apps || [])[0]?.name || '';
    console.log(name.split('-')[0] || 'app');
  } catch(e) { console.log('app'); }
")

# 2. Read project base port from port-map.json
BASE_PORT=$(node -e "
  const fs = require('fs'), path = require('path');
  const mapPath = path.join('${PROJECT_ROOT}', '.claude', 'base', 'port-map.json');
  try {
    const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    const name = path.basename('${PROJECT_ROOT}');
    console.log(map.projects[name] || 3000);
  } catch(e) { console.log(3000); }
")

# 3. Allocate a port slot (1-8) via .worktrees/port-registry.json
PORTS_JSON=$(node -e "
  const fs = require('fs'), path = require('path');
  const regDir = path.join('${PROJECT_ROOT}', '.worktrees');
  if (!fs.existsSync(regDir)) fs.mkdirSync(regDir, { recursive: true });
  const regPath = path.join(regDir, 'port-registry.json');
  let reg = {};
  try { reg = JSON.parse(fs.readFileSync(regPath, 'utf8')); } catch(e) {}
  const used = new Set(Object.values(reg).map(v => v.slot));
  let slot = 0;
  for (let i = 1; i <= 8; i++) { if (!used.has(i)) { slot = i; break; } }
  if (!slot) { console.error('ERROR: max 8 worktrees exceeded'); process.exit(1); }
  const base = parseInt(${BASE_PORT});
  const entry = { slot, backendPort: base + slot * 10, frontendPort: base + slot * 10 + 1 };
  reg['${TICKET_ID_SHORT}'] = entry;
  fs.writeFileSync(regPath, JSON.stringify(reg, null, 2));
  console.log(JSON.stringify(entry));
")
BACKEND_PORT=$(echo "$PORTS_JSON" | node -e "const d=require('fs').readFileSync(0,'utf8');console.log(JSON.parse(d).backendPort)")
FRONTEND_PORT=$(echo "$PORTS_JSON" | node -e "const d=require('fs').readFileSync(0,'utf8');console.log(JSON.parse(d).frontendPort)")

# 4. Copy backend/.env from main project + override PORT
cp "${PROJECT_ROOT}/backend/.env" "${WORKTREE_PATH}/backend/.env" 2>/dev/null || true
sed -i '' "s/^PORT=.*/PORT=${BACKEND_PORT}/" "${WORKTREE_PATH}/backend/.env"

# 5. Create frontend/.env.local with API base URL
cat > "${WORKTREE_PATH}/frontend/.env.local" << EOF
VITE_API_BASE_URL=http://localhost:${BACKEND_PORT}/api
EOF

# 6. Temporarily patch vite proxy target in worktree (reverted before commit in Phase B)
sed -i '' "s|localhost:[0-9]*'|localhost:${BACKEND_PORT}'|" \
  "${WORKTREE_PATH}/frontend/vite.config.ts" 2>/dev/null || true

# 7. Temporarily add worktree frontend port to CORS (reverted before commit in Phase B)
sed -i '' "s|'http://localhost:[0-9]*'|&, 'http://localhost:${FRONTEND_PORT}'|" \
  "${WORKTREE_PATH}/backend/src/main.ts" 2>/dev/null || true

echo "Ports allocated: backend=${BACKEND_PORT}, frontend=${FRONTEND_PORT}"
```

> **Important:** Steps 6-7 are temporary worktree-only patches. They MUST be reverted before committing in Phase B Step 5 using `git checkout --`.

### Step 6: Install Dependencies

```bash
cd "$WORKTREE_PATH" && \
cd backend && npm install --legacy-peer-deps 2>&1 | tail -3 && cd .. && \
echo "--- Backend done ---" && \
cd frontend && npm install --legacy-peer-deps 2>&1 | tail -3 && cd .. && \
echo "--- Frontend done ---"
```

### Step 6.5: Start Dev Servers

Start backend and frontend via PM2 with unique process names per worktree.

```bash
cd "$WORKTREE_PATH"

# Backend (PORT is read from .env by dotenv)
cd backend && pm2 start npx \
  --name "${PREFIX}-${TICKET_ID_SHORT}-backend" \
  -- ts-node -r reflect-metadata src/main.ts
cd ..

# Frontend (--port CLI overrides vite.config.ts)
cd frontend && pm2 start npx \
  --name "${PREFIX}-${TICKET_ID_SHORT}-frontend" \
  -- vite --port ${FRONTEND_PORT}
cd ..

# Health check (max 5 attempts, 3s interval)
for i in {1..5}; do
  BE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${BACKEND_PORT}/api 2>/dev/null)
  FE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${FRONTEND_PORT} 2>/dev/null)
  if [ "$BE" != "000" ] && [ "$FE" = "200" ]; then
    echo "Servers healthy"
    break
  fi
  sleep 3
done
```

If health check fails, show `pm2 logs ${PREFIX}-${TICKET_ID_SHORT}-backend --lines 20` for debugging.

### Step 7: Report

Print summary:

```
══════════════════════════════════════════════════════════════
 ✅ Ticket Ready: {TICKET_ID_SHORT}
══════════════════════════════════════════════════════════════

 📋 Ticket
 ──────────────────────────────────────────────────────────
  Title:      {title}
  Category:   {category}
  Priority:   {priority}
  Assignee:   {assignee}
  Due:        {dueDate}
  Dashboard:  https://pm.potentialai.com/projects/{projectId}/tickets/{ticketId}

 🔧 Workspace
 ──────────────────────────────────────────────────────────
  Branch:     {branchName}
  Worktree:   {worktreePath}

 🌐 Dev Servers
 ──────────────────────────────────────────────────────────
  Frontend:   http://localhost:{FRONTEND_PORT}
  Backend:    http://localhost:{BACKEND_PORT}
  Swagger:    http://localhost:{BACKEND_PORT}/api/docs
  Status:     ✅ Running (or ❌ Failed — check pm2 logs)

 📝 Ticket Description
 ──────────────────────────────────────────────────────────
  {ticket description summary, 2-3 lines}

══════════════════════════════════════════════════════════════
 → Entering plan mode to investigate and design the implementation.
══════════════════════════════════════════════════════════════
```

**Phase A is complete.**

- If `--manual` flag was passed → go to **Manual Mode** section below.
- Otherwise → automatically enter plan mode:
  1. Call `EnterPlanMode`
  2. Explore the worktree codebase to understand the affected area
  3. Design the implementation plan based on the ticket description
  4. Present the plan via `ExitPlanMode` for user approval
  5. After approval, proceed to Phase B implementation

---

## Manual Mode (`--manual`)

When `--manual` is passed, Phase A runs exactly the same (workspace setup, branch, worktree, deps, dev servers). After Phase A completes, Claude produces an implementation plan but does **not** write any code. The developer implements the changes themselves.

### What happens

1. **Full Phase A** (Steps 1–7) executes normally — ticket fetch, branch, worktree, deps, servers
2. **Explore** — Read relevant files in the worktree to understand the affected area
3. **Plan** — Produce a detailed implementation plan covering:
   - Which files to modify and what to change in each
   - Suggested order of changes
   - Key code references (file paths, line numbers, function/class names)
   - Edge cases and gotchas to watch for
   - Any new files that need to be created
4. **Write plan** — Save the plan to `{WORKTREE_PATH}/IMPLEMENTATION_PLAN.md`
5. **Handoff** — Print the summary below and **stop**. No Phase B, no Phase C.

### Handoff summary

```
══════════════════════════════════════════════════════════════
 📋 Manual Mode: Implementation Plan Ready
══════════════════════════════════════════════════════════════

 Ticket:     {TICKET_ID_SHORT} — {title}
 Branch:     {branchName}
 Worktree:   {worktreePath}
 Plan:       {worktreePath}/IMPLEMENTATION_PLAN.md

 Dev Servers:
  Frontend:  http://localhost:{FRONTEND_PORT}
  Backend:   http://localhost:{BACKEND_PORT}
  Swagger:   http://localhost:{BACKEND_PORT}/api/docs

 Next steps (you):
  1. cd {worktreePath}
  2. Read IMPLEMENTATION_PLAN.md
  3. Implement the changes
  4. git add && git commit -m "{fix|feat}: {ticketPrefix}-{NNN} {description}"
  5. gh pr create --base dev

══════════════════════════════════════════════════════════════
```

### IMPLEMENTATION_PLAN.md format

The plan file should follow this structure:

```markdown
# {TICKET_ID_SHORT}: {title}

## Summary

Brief description of what this ticket requires and why.

## Affected Files

| File                  | Action | Description         |
| --------------------- | ------ | ------------------- |
| `path/to/file.ts`     | Modify | What to change      |
| `path/to/new-file.ts` | Create | What this file does |

## Implementation Steps

1. **Step name** — detailed description of what to do
   - File: `path/to/file.ts`
   - Key references: function/class names, line numbers
   - Code hint: brief description or pseudo-code

2. **Step name** — ...

## Edge Cases & Gotchas

- Things to watch out for
- Existing patterns to follow
- Related code that might be affected

## Testing

- How to verify the changes work
- Relevant existing tests to run
```

**Manual mode sync:** If Claude creates the PR on behalf of the developer in manual mode, authenticate with PHC and PATCH the ticket using the Sync Script Template with:
- `<PAYLOAD>`: `{"status": "IN_REVIEW", "linkedPrs": [{"url": "<PR_URL>", "title": "<PR_TITLE>", "number": <PR_NUMBER>, "state": "open"}]}`
- `<DESCRIPTION>`: `status → IN_REVIEW, PR #<PR_NUMBER> linked`

If the developer creates the PR themselves, remind them to update the ticket status on the dashboard.

**After printing the handoff summary, STOP. Do not proceed to Phase B or Phase C.**

---

## Phase B: Implementation

1. **Explore** — Read relevant files in the worktree to understand the codebase area affected by the ticket
2. **Plan** — Design the implementation approach, identify files to modify
3. **Estimate size and update ticket** — After the plan is drafted and before writing code, pick a size 1-9 (human-hours equivalent) based on the plan, then PATCH it back to the dashboard. See the **Size Estimation** section below.
4. **Implement** — Make the changes in the worktree
5. **Build check** — Run `npx tsc --noEmit` in both backend and frontend to verify compilation
6. **Revert temporary patches + Commit**:

```bash
cd "$WORKTREE_PATH"

# Revert temporary proxy/CORS patches from Step 5.5 (these must NOT be committed)
git checkout -- frontend/vite.config.ts 2>/dev/null || true
git checkout -- backend/src/main.ts 2>/dev/null || true

# Stage and commit actual changes only
git add <changed-files>
git commit -m "{fix|feat}: {ticketPrefix}-{NNN} {description}"
```

> **Critical:** Always revert `vite.config.ts` and `backend/src/main.ts` before committing. These files were temporarily patched in Step 5.5 for dev server port routing and must not be included in the PR.

---

## Size Estimation (run once after Phase B Step 2, before Step 4)

**Why:** Writes an objective effort estimate back to the ticket so the dashboard has size data without needing a human PM to fill it in (Zero-Human-Report principle).

**Scale — human-hours equivalent (NOT Claude wall-clock):**

The 1-9 number is how many hours a **human developer** would take to complete this ticket. Claude Code typically finishes in ~10-20% of that time, but the score must stay comparable to historical PM estimates so velocity data remains consistent.

> Note: the production UI placeholder shows a Fibonacci hint ("1, 2, 3, 5, 8, 13"). This skill uses a 1-9 linear human-hours scale per project convention. Both are valid `int >= 0` values the backend accepts; update this rubric if the project policy changes.

**Rubric:**

| Size | Human effort | Typical scope                                                              |
| ---- | ------------ | -------------------------------------------------------------------------- |
| 1    | <1h          | Trivial one-liner: typo, copy fix, single config value                     |
| 2    | ~2h          | Small isolated change in 1 file: rename, guard, simple validation          |
| 3    | ~3h          | Small multi-file change, no new logic: prop threading, minor refactor      |
| 4    | ~4h          | Standard bug fix with targeted debugging + test                            |
| 5    | ~5h          | Small feature: 1 new endpoint OR 1 new component end-to-end                |
| 6    | ~6h          | Medium feature: 1 endpoint + 1 component + 1 hook + types                  |
| 7    | ~7h          | Cross-cutting change touching 5+ files across backend + frontend           |
| 8    | ~8h          | Large feature: new module (entity + migration + service + controller + UI) |
| 9    | 9h+          | Architectural change, multi-day human work                                 |

**How to pick the number** — weigh from the drafted plan:

- Number of files you expect to edit
- Backend + frontend, or just one side
- Migrations / new entities needed
- Tests to write or update
- Debugging uncertainty (known root cause vs. needs investigation)

Pick one integer 1-9. If between two, round up. Do **not** re-estimate mid-implementation; if scope turns out drastically different, mention it to the user in a message — do not silently re-PATCH.

**Sync size to dashboard:**

Validate the size (1-9), then authenticate with PHC and PATCH the ticket. Use the Sync Script Template with:
- `<PAYLOAD>`: `{"size": <SIZE>}` (replace `<SIZE>` with the chosen integer)
- `<DESCRIPTION>`: `size → <SIZE>/9`

Before running, validate:

```bash
SIZE=<SIZE>
if [ "$SIZE" -lt 1 ] || [ "$SIZE" -gt 9 ]; then
  echo "ERROR: Size must be 1-9, got $SIZE"; exit 1
fi
```

**Report to user** alongside the plan summary:

```
Size estimate: <N>/9 (~<N>h human work)
Reasoning: <one-line justification — files touched, scope, uncertainty>
```

**Errors:**

| Error                   | Action                                                                |
| ----------------------- | --------------------------------------------------------------------- |
| `PHC_PASSWORD` missing  | Log warning, skip size write, continue — size is metadata, not a gate |
| PATCH returns non-2xx   | Log HTTP status + body, skip, continue                                |
| Chosen size outside 1-9 | Hard error — pick a valid integer                                     |

**Manual mode:** Run Size Estimation after writing `IMPLEMENTATION_PLAN.md` and before the handoff summary. Include the chosen size in the handoff output.

---

## Phase C: PR, Review, Merge, and Deploy

### Step 1: Create PR

Use `gh pr create --base dev` with ticket context in the body. Save the PR number and URL.

#### Sync: PR created → `IN_REVIEW` + link PR

Authenticate with PHC and PATCH the ticket. Use the Sync Script Template with:
- `<PAYLOAD>`: `{"status": "IN_REVIEW", "linkedPrs": [{"url": "<PR_URL>", "title": "<PR_TITLE>", "number": <PR_NUMBER>, "state": "open"}]}`
- `<DESCRIPTION>`: `status → IN_REVIEW, PR #<PR_NUMBER> linked`

Get the PR title first: `PR_TITLE=$(gh pr view "$PR_NUMBER" --json title -q '.title')`

### Step 2: Monitor CI and Codex Review (never skip)

#### 2a: Wait for CI checks

```bash
gh pr checks "$PR_NUMBER" --watch
```

#### 2b: Read Codex review comments (never skip — even in batch mode)

```bash
# Read all PR comments to find Codex review
gh pr view "$PR_NUMBER" --comments
```

Classify the Codex review result:

- ✅ **PASS** — no issues found → proceed to Step 3
- ⚠️ **NEEDS CHANGES** — non-critical issues → go to 2c
- 🚨 **CRITICAL** — blocking issues → go to 2c

#### 2c: Fix and re-review loop (repeat until PASS)

1. Analyze each issue Codex raised
2. Fix the code in the worktree
3. Revert temporary patches before committing: `git checkout -- frontend/vite.config.ts backend/src/main.ts`
4. Commit and push
5. Re-trigger Codex review: comment `@codex` on the PR
6. Go back to 2a (wait for CI + re-read Codex)

Repeat until Codex returns ✅ PASS with no warnings. Do not proceed to Step 3 until the review is clean.

### Step 3: Merge Approval (never skip, never bypass)

> **This step is mandatory.** Even in batch mode, all evidence must be collected and evaluated before merging.

#### 3a: Collect merge evidence (all items required)

```bash
# 1. Codex review result (from Step 2b above)

# 2. Conflict status (retry up to 3 times if UNKNOWN, 5s interval)
for i in 1 2 3; do
  MERGEABLE=$(gh pr view "$PR_NUMBER" --json mergeable -q '.mergeable')
  [ "$MERGEABLE" != "UNKNOWN" ] && break
  sleep 5
done

# 3. CI check results
gh pr checks "$PR_NUMBER"
```

#### 3b: Present evidence to user (never omit)

```
══════════════════════════════════════════════════
 Merge Approval: PR #${PR_NUMBER}
══════════════════════════════════════════════════

 Codex Review:  ✅ PASS (or ⚠️/🚨 + summary)
 Conflict:      ✅ No conflicts (or ❌ Conflicts detected)
 CI Checks:     ✅ All passed (or ❌ N failed)

 PR:            ${PR_URL}

══════════════════════════════════════════════════
 Proceed with merge? (yes/no)
```

#### 3c: Merge only on approval

- User says "yes" → merge
- Conflicts detected → guide user to resolve, then re-collect evidence
- Codex CRITICAL remaining → warn, but user can override

```bash
gh pr merge "$PR_NUMBER" --squash --delete-branch
```

#### Sync: PR merged → `RESOLVED`

Authenticate with PHC and PATCH the ticket. Use the Sync Script Template with:
- `<PAYLOAD>`: `{"status": "RESOLVED"}`
- `<DESCRIPTION>`: `status → RESOLVED`

If merge fails due to conflicts, resolve in worktree, push, and re-run Step 2 + Step 3.

**Batch mode:** Auto-merge ONLY if all 3 conditions pass (Codex PASS + no conflict + CI all pass). If any condition fails, notify user and wait.

### Step 4: Watch Deploy (until successful)

After merge, monitor the `Deploy Dev` workflow on `dev` **until it finishes with a `success` conclusion**. Back-to-back merges (especially in batch mode) cause GitHub to cancel in-flight deploys when a newer commit arrives — a `cancelled` run is NOT a failure, it's a signal that a newer run is underway. The loop below skips `cancelled` runs and keeps watching the latest dev-branch deploy run until it succeeds or a non-superseded failure occurs.

```bash
# Wait for a completed Deploy Dev run that isn't cancelled (superseded).
# Poll every 15s for up to ~10 minutes.
for attempt in $(seq 1 40); do
  READ=$(gh run list --workflow="Deploy Dev" --branch dev --limit 1 \
    --json databaseId,status,conclusion -q '.[0]')
  RUN_ID=$(echo "$READ" | node -e "const d=require('fs').readFileSync(0,'utf8');console.log(JSON.parse(d).databaseId||'')")
  STATUS=$(echo "$READ" | node -e "const d=require('fs').readFileSync(0,'utf8');console.log(JSON.parse(d).status||'')")
  CONCLUSION=$(echo "$READ" | node -e "const d=require('fs').readFileSync(0,'utf8');console.log(JSON.parse(d).conclusion||'')")

  if [ "$STATUS" = "completed" ]; then
    if [ "$CONCLUSION" = "success" ]; then
      echo "✓ Deploy succeeded (run $RUN_ID)"; break
    elif [ "$CONCLUSION" = "cancelled" ]; then
      echo "  run $RUN_ID cancelled (superseded) — waiting for newer run..."
      sleep 10
      continue
    else
      echo "✗ Deploy $CONCLUSION (run $RUN_ID) — see: gh run view $RUN_ID --web"
      exit 1
    fi
  fi

  # Still queued/in_progress — attach to it
  if [ -n "$RUN_ID" ]; then
    gh run watch "$RUN_ID" --exit-status 2>&1 | tail -5 || true
  else
    sleep 5
  fi
done
```

**Batch mode:** Run this watcher after each merge (simplest) OR once after the final merge of the batch (fastest). Either way, a `cancelled` conclusion between rapid merges must be treated as transient, not a failure. Report success only after a `success` conclusion on the most recent run.

### Step 5: Cleanup and Report

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "$PROJECT_ROOT")

# 1. Stop worktree PM2 processes
pm2 delete "${PREFIX}-${TICKET_ID_SHORT}-backend" 2>/dev/null || true
pm2 delete "${PREFIX}-${TICKET_ID_SHORT}-frontend" 2>/dev/null || true

# 2. Release port allocation
node -e "
  const fs = require('fs'), path = require('path');
  const regPath = path.join('${PROJECT_ROOT}', '.worktrees', 'port-registry.json');
  try {
    const reg = JSON.parse(fs.readFileSync(regPath, 'utf8'));
    delete reg['${TICKET_ID_SHORT}'];
    fs.writeFileSync(regPath, JSON.stringify(reg, null, 2));
  } catch(e) {}
"

# 3. Clean up PHC session cookies
rm -f /tmp/phc-cookies.txt

# 4. Remove worktree and local branch
cd "$PROJECT_ROOT"
git worktree remove "$WORKTREE_PATH" 2>/dev/null || true
git branch -d "${BRANCH_NAME}" 2>/dev/null || true

# 5. Pull latest changes to main project
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "dev" ]; then
  git pull origin dev
  echo "dev branch updated to latest"
else
  git fetch origin dev
  echo "Main is not on dev ($CURRENT_BRANCH). Fetched only."
fi
```

Show the change summary (`git diff --stat` from before merge) and final report:

```
══════════════════════════════════════════════════════════════
 ✅ Ticket Complete: {TICKET_ID_SHORT}
══════════════════════════════════════════════════════════════

 📋 Summary
 ──────────────────────────────────────────────────────────
  Title:      {title}
  PR:         {PR_URL}

 📊 Review Results
 ──────────────────────────────────────────────────────────
  Codex:      ✅ PASS
  Conflict:   ✅ None
  CI:         ✅ All passed

 🚀 Deploy
 ──────────────────────────────────────────────────────────
  Status:     ✅ Success (or ❌ Failed — {run link})

 📝 Changes (git diff --stat)
 ──────────────────────────────────────────────────────────
  N files changed (+XX, -YY)
  {file list}

 🔄 Post-merge
 ──────────────────────────────────────────────────────────
  Pull:       ✅ dev up to date
  Cleanup:    ✅ Worktree / branch / PM2 cleaned up

══════════════════════════════════════════════════════════════
```

---

## Team Setup

Each developer must configure their own credentials before using this skill.

### 1. Create local settings file

Create `.claude/settings.local.json` in the project root (this file is gitignored and never committed):

```json
{
  "env": {
    "PHC_EMAIL": "your-name@potentialai.com",
    "PHC_PASSWORD": "your-password"
  }
}
```

### 2. Verify access

```bash
curl -s -X POST https://pm.potentialai.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-name@potentialai.com","password":"your-password"}'
```

A successful response returns user data with a 200 status.

### 3. Optional: Custom API URL

If targeting a non-production environment, also set:

```json
{
  "env": {
    "PHC_API_URL": "http://localhost:3000/api",
    "PHC_EMAIL": "your-name@potentialai.com",
    "PHC_PASSWORD": "your-password"
  }
}
```

---

## Error Handling

- **Login fails**: Check `PHC_EMAIL` and `PHC_PASSWORD` env vars. They should be in `.claude/settings.local.json` under `env`.
- **Ticket not found**: Verify the URL is correct and the ticket exists.
- **Worktree already exists**: Report the existing path. User can `cd` to it or remove it first.
- **Build fails**: Fix the issues before committing.
- **Conflicts**: Pull latest dev, resolve, commit, push, re-check.
- **Codex review rejects**: Address the feedback, push, and wait for re-review.
- **Deploy fails**: Report the failure with a link to the run.

## Environment Variables

| Variable       | Default                          | Source                        |
| -------------- | -------------------------------- | ----------------------------- |
| `PHC_API_URL`  | `https://pm.potentialai.com/api` | `.claude/settings.local.json` |
| `PHC_EMAIL`    | `lukas@potentialai.com`          | `.claude/settings.local.json` |
| `PHC_PASSWORD` | (required)                       | `.claude/settings.local.json` |
