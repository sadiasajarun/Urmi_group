# claude-fullstack

AI-powered full-stack application pipeline. Two orchestrator versions with shared assets.

## Structure

```
claude-fullstack/
├── v1/                 # Legacy LLM-interpreted orchestrator
├── v2/                 # Production code-based orchestrator ← RECOMMENDED
├── blueprints/         # Shared phase blueprints (*.yaml = v1, *-2.yaml = v2)
├── gates/              # Shared quality gates
├── templates/          # Shared templates
├── commands/           # Other Claude Code slash commands
├── agents/             # Agent definitions
├── nestjs/             # NestJS-specific rules
├── react/              # React-specific rules
└── ...
```

## Quick Start

### v2 (Recommended)

```bash
# Dry run
node .claude/v2/orchestrator.js myproject --phase init --dry-run

# Real run with Claude Code
node .claude/v2/orchestrator.js myproject --run-all

# Real run with OpenCode (multi-model support)
AGENT_BACKEND=opencode node .claude/v2/orchestrator.js myproject --run-all
```

### v1 (Legacy)

```bash
claude --dangerously-skip-permissions -p "/fullstack --phase backend"
```

## v1 vs v2

| Aspect | v1 | v2 |
|--------|----|----|
| Orchestrator | LLM interprets 1000-line prompt | Node.js walks YAML deterministically |
| Trust | LLM can skip/lie about work | Hard verification (fs.existsSync) |
| Agentic nodes | Same context window | Isolated subprocess per node |
| Tool scoping | Advisory | Strict --disallowed-tools |
| Episode logging | None | JSONL for RL training |
| Multi-backend | No | Yes (Claude Code + OpenCode) |
| Model selection | N/A | Per-node via blueprint |

**Use v2 for production. Use v1 for quick experiments.**

## Pipeline Phases

```
init → spec → prd → (design ∥ database) → (user-stories ∥ backend) → frontend → integrate → test-api → test-browser → ship
```

## v1 Commands: `/fullstack`, `/fullstack-pm`, `/fullstack-dev`

The v1 orchestrator provides three slash commands. Pick one per project — **do not mix** them on the same project.

| Command | When to use | Scope |
|---|---|---|
| `/fullstack` | Run the entire pipeline with one command (legacy, unchanged) | All phases 0–10 |
| `/fullstack-pm` | PM team: drive spec → PRD → design prototypes, hand off to Dev | P1-spec, P2-prd, P3-design (new) |
| `/fullstack-dev` | Dev team: pick up PRD + approved HTML, build to ship | D1-init, D2-tech-spec, D3–D10 |

### PM → Dev Handoff Artifacts

`/fullstack-pm` produces exactly what `/fullstack-dev` needs:

1. `.claude-project/docs/PRD.md` — canonical PRD
2. `.claude-project/design/html/<role>/*.html` — approved HTML, organized by user role (e.g. `admin/`, `user/`)
3. `DESIGN_STATUS.md` with `approved: true`, `phase_complete: true`, and a PRD snapshot (hash, version, bundle hash)

### /fullstack-dev Entry Tiers

Before running any Dev phase, `/fullstack-dev` validates:

- **Tier 1** (required): PRD + HTML + approval signal (or `--trust-design` for external designer HTML)
- **Tier 2** (consistency): current PRD SHA256 matches `DESIGN_STATUS.prd_hash_at_generation`
  - Mismatch → hard-fail with guidance to run `/fullstack-pm --update --prd <path>`
  - Missing snapshot → warn unless `--accept-design-drift`
- **Tier 3** (role structure): `design/html/<role>/*.html` folders present (flat structure → warn; `--strict-roles` escalates to hard-fail)

### What /fullstack-dev Adds Beyond Legacy

- `.claude-project/design/design-intent.yaml` — machine-readable interpretation of HTML (endpoints, forms, realtime hints inferred by D1). Engineers may edit before D2 re-runs.
- `PROJECT_KNOWLEDGE.md`, `PROJECT_API.md`, `PROJECT_DATABASE.md` now include frontmatter with `prd_hash` + `intent_hash` — stale docs are detected automatically.
- `PROJECT_API.md` adds cross-reference sections: Screen → Endpoints, Endpoint → Screens, Role × Endpoint authz matrix.
- PM design HTML is organized by role folder rather than flat.

### Example Flows

```bash
# Greenfield PM → Dev
/fullstack-pm my-saas --run-all --skip-spec --prd input.md
# PAUSE at P3d — client picks variation, edits DESIGN_STATUS.md
/fullstack-pm my-saas --phase P3-design --resume
/fullstack-dev my-saas --run-all

# External PRD + external HTML (no PM run)
/fullstack-dev my-ext --trust-design --accept-design-drift --run-all

# PRD changed — update cycle
/fullstack-pm my-saas --update --prd docs/PRD_v2.md
/fullstack-dev my-saas   # D1 re-extracts intent, D2 regenerates docs, cascade to D4+

# Legacy full pipeline (unchanged)
/fullstack legacy-proj --run-all --skip-spec --prd input.md
```

### Do Not Mix Orchestrators on One Project

- Legacy `/fullstack` writes flat HTML and no PRD snapshot in `DESIGN_STATUS.md`.
- Neo `/fullstack-pm`+`/fullstack-dev` write role-folder HTML and extended snapshot.
- Mixing creates conflicting state. Pick one orchestration per project.
- `/fullstack-dev` will warn if it detects legacy artifacts on entry.

## Documentation

- [v1 README](v1/README.md)
- [v2 README](v2/README.md)
- [Pipeline Architecture](PIPELINE_ARCHITECTURE.md)
