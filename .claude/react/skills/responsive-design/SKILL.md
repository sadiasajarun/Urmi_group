---
skill_name: responsive-design
applies_to_local_project_only: true
auto_trigger_regex: [responsive, mobile responsive, tablet responsive, 반응형]
tags: [responsive, mobile, tablet, tailwind, css, frontend]
related_skills: [design-qa-figma]
---

# Responsive Design Skill

## 1. Overview

This skill implements mobile + tablet responsive styles for React + Tailwind CSS projects.

- **Single pass**: each screen gets BOTH mobile (base, sm:) AND tablet (md:, lg:) in one edit
- **NEVER** modify desktop styles (xl:, 2xl:)
- All components must remain visible -- only TRANSFORM layout for smaller screens
- No content hiding, no feature removal -- provide compact alternatives instead

## 2. Tailwind Breakpoints Reference

```
base:  0-639px     mobile (iPhone SE 375px ~ iPhone 14 Pro Max 430px)
sm:    640px+      large mobile / small tablet
md:    768px+      iPad Mini
lg:    1024px+     iPad Pro        <-- CAUTION: cascades into desktop unless xl: overrides
xl:    1280px+     desktop         <-- DO NOT MODIFY
2xl:   1480px+     large desktop   <-- DO NOT MODIFY
xs:    400px       <-- NEVER USE (causes device inconsistency between iPhone SE 375px and XR 414px)
```

## 3. Critical Rules

### Rule 1 - Feature Accessibility
NEVER hide CTA buttons with `hidden sm:block`. Provide compact alternatives (icon-only, smaller text).
Detection: `grep "hidden sm:block"` or `grep "hidden md:block"`.

### Rule 2 - Stacking Context
`overflow-hidden`, `overflow-clip`, `transform`, `filter` create new stacking contexts. Modal/sidebar overlays need z-index outside these containers. When sidebar opens, conditionally lower header z-index.

### Rule 3 - Overflow Clipping
`overflow-hidden` clips child elements with negative position (badges at `top-[-7px]`). Check all children before adding overflow-hidden.

### Rule 4 - Body Scroll Lock
Mobile overlays (sidebar, modal) MUST set `document.body.style.overflow = "hidden"`. Cleanup on close: `document.body.style.overflow = ""`. CRITICAL: Guard with `if (window.matchMedia("(min-width: 1280px)").matches) return;` — NEVER apply scroll lock unconditionally. Desktop push-style sidebars must NOT have scroll lock.

### Rule 5 - No xs: Breakpoint
NEVER use `xs:` classes. All phones (375-430px) must have identical layout at base styles.
Detection: `grep "\bxs:"`.

### Rule 6 - Touch Targets
44px minimum ONLY for standalone touch buttons (nav items, sidebar menu). Do NOT apply globally to Button base variant -- it breaks pagination, tags, inline buttons.

### Rule 7 - Parent-Child Coordination
When making children responsive, ALSO update parent container flex/grid direction.
Pattern: `flex flex-col md:flex-row` for horizontal layout on tablet+.

### Rule 8 - Visual Testing Required
CSS-only checks are insufficient. Must verify at:
- Phones: 375px, 414px, 430px
- Tablets: 768px, 820px, 1024px
- Check dynamic states: sidebar open, modal open, scroll state

### Rule 9 - Dropdown Viewport Overflow
Absolute-positioned dropdowns/popovers must stay within mobile viewport (375px). Replace large negative offsets (`-right-[114px]`) with smaller values. Use `max-w-[calc(100vw-32px)]` on mobile.

### Rule 10 - CVA Variant Override
When overriding CVA variants, check the ORIGINAL variant definition. Override ALL width properties together:
- Width: `!w-[X] !min-w-[X] !max-w-[X]`
- Height: `!h-[X] !min-h-[X] !max-h-[X]`

### Rule 11 - Mobile-First Sizing
Base values must be SMALLEST, increasing at larger breakpoints.
- CORRECT: `w-[32px] lg:w-[42px]`
- WRONG: `w-[42px] lg:w-[32px]`

### Rule 12 - Table Mobile
Minimum text 12px (never use 11px or below). Tables: `overflow-x-auto` wrapper + `min-w-[XXXpx]` for horizontal scroll. Reduce min-w at lg: for tablet.

### Rule 13 - iPad Breakpoints
EVERY grid/flex layout must have explicit md: AND lg: breakpoints. Don't jump from base to xl:.
- Grids: base(1-2col) -> md:(2-3col) -> lg:(3-4col) -> xl:(desktop)
- `flex-col -> flex-row` should transition at md: not lg: when space allows

### Rule 14 - Pattern Propagation
After fixing ANY pattern, IMMEDIATELY grep the entire codebase for the same pattern. Fix ALL occurrences, not just the current file.

### Rule 16 - Desktop Pixel-Identical Guarantee
At xl: (1280px+) viewport, the page must render PIXEL-IDENTICAL to before the agent touched it.
1. NEVER add lg: classes without verifying an xl: class already defines that CSS property.
   lg: styles cascade to 1024px+ INCLUDING desktop if no xl: overrides them.
   WRONG: Adding `lg:flex-row` when no `xl:flex-row` exists → changes desktop layout
   WRONG: Adding `lg:fixed lg:right-[12px]` → sidebar position changes at desktop
   RIGHT: Only add lg: when xl: already covers the same property, OR add xl: to preserve original
2. NEVER change base (unprefixed) values without adding xl: to preserve desktop.
   Original `p-[24px]` → changing to `p-3 sm:p-4 md:p-5` MUST include `xl:p-[24px]`
3. NEVER add useEffect/JS that runs at all viewports. Guard with `matchMedia('(min-width: 1280px)')`.
4. Before editing ANY element, record its desktop-effective classes. After editing, verify unchanged.

### Rule 19 - Section Header Stacking
`flex justify-between` with title + multi-child content (legend, stats, controls) MUST stack vertically on mobile.
Pattern: `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0`
Detection: grep current file for `flex.*justify-between`, check each for title+multi-child content.
At 375px, title + legend/stats CANNOT fit side-by-side.

### Rule 15 - Sidebar-Aware Breakpoints
Tailwind breakpoints are VIEWPORT-based, not container-based. If the project has a persistent sidebar (e.g., dashboard navigation), it reduces actual content width. When setting max-width or grid columns inside a sidebar layout:
- Measure the sidebar width from the layout file (commonly 240-300px)
- Subtract sidebar width + padding from viewport width to get actual content width
- At xl:, use max-width values accordingly smaller than you would without sidebar
- Grid columns: if parent flex-row splits content, calculate remaining width before choosing column count
- Example: if sidebar is ~280px, xl:1280px viewport → actual content ~960px

## 4. Per-Screen Workflow

### STEP 0: SETUP + LEARN (once per session start)

#### 0-A: Environment Setup (skip if already done this session)

1. **Screenshot tool dependencies**:
   - Check: `cd .claude/react/tools/responsive-screenshot && node -e "require('playwright')" 2>/dev/null`
   - If error (module not found): `cd .claude/react/tools/responsive-screenshot && npm install`
   - Check Chromium: `cd .claude/react/tools/responsive-screenshot && npx playwright install chromium`
   - NOTE: Do NOT use `ls` with `node_modules` path — bash security hooks may block it. Always use `node -e "require(...)"` to check.

2. **Project directories** (create if missing):
   - `mkdir -p .claude-project/learning/responsive-design`
   - `mkdir -p .claude-project/config`
   - `mkdir -p .claude-project/screenshots`

3. **Screenshot config** (`.claude-project/config/screenshot-config.json`):
   - If exists → skip
   - If missing → **ALWAYS ask user for credentials first, then generate**:
     a. Scan project route files to detect pages and auth patterns
     b. Find port from `.env` or project config, auto-detect baseUrl by trying `curl` on IPv4 and IPv6 (up to 3 retries)
     c. **Ask user** (MANDATORY — never skip, never auto-fill from CLAUDE.md):
        - Login credentials (username/password)
        - Login page input selectors (e.g., `#username`, `input[name='email']`)
        - If auto-detected baseUrl failed, ask for the running app URL
     d. Read template: `.claude/react/templates/screenshot-config.template.json`
     e. Generate config with user-provided credentials + auto-detected/confirmed baseUrl + discovered routes
     f. Write to `.claude-project/config/screenshot-config.json`

4. **Status file** (`.claude-project/plans/{project}/responsive-design-status.md`):
   - If exists → skip
   - If missing → copy from `.claude/react/templates/responsive-design-status.template.md`

#### 0-B: Learn

- Read `.claude/react/knowledge/responsive-design/global-patterns.md` → universal anti-patterns and good patterns
- Read `.claude-project/learning/responsive-design/pattern-library.md` → project-specific patterns
- Read `.claude-project/learning/responsive-design/issue-log.md` → review recent issues
- Check `Proposed Rules` section in pattern-library.md for any ACCEPTED rules
- Prioritize items from "Needs Manual Review" if retrying
- **Apply BOTH global and project patterns proactively** during implementation (don't wait for hooks to block)

### STEP 1: LOAD
- Read target file completely
- Identify parent container (layout file or parent component)
- Read parent to understand flex/grid context

### STEP 2: ANALYZE
- Extract all Tailwind classes, categorize by breakpoint
- **Third-party component scan**: Check file imports for these libraries:
  - Charts: `recharts`, `chart.js`, `@nivo`, `apexcharts`, `victory`
  - Maps: `@react-google-maps`, `react-leaflet`, `mapbox-gl`
  - Editors: `@tiptap`, `draft-js`, `slate`, `@ckeditor`, `react-quill`
  - Tables: `@tanstack/react-table` (custom render cells only)
  - Date pickers: `react-datepicker`, `@mui/x-date-pickers`
  - If third-party found → you MUST still implement a mobile-friendly alternative layout:
    - Layout libraries (Allotment, react-grid-layout): conditional render — mobile uses tabs/accordion/stacked, desktop keeps the library
    - Charts (Recharts, Chart.js): responsive wrapper required, simplify legend/axis on mobile
    - Maps: responsive container, simplified controls on mobile
    - Editors: responsive container width
  - Internal props/config → flag as "Needs Manual Review" AFTER implementing the layout alternative
  - NEVER mark a page as "Pass" if you only touched the header and skipped the body due to third-party
- Check each rule for violations
- Assess mobile coverage: are base + sm: styles adequate?
- Assess tablet coverage: do md: + lg: breakpoints exist?

### STEP 3: IMPLEMENT MOBILE (base + sm:)
- Ensure consistent 375-430px layout (no xs: usage)
- flex containers: `flex-col` at base where needed
- CTA buttons: compact alternatives if hidden on mobile (Rule 1)
- Touch targets: 44px for nav/standalone buttons (Rule 6)
- Dropdowns: reposition within 375px viewport (Rule 9)
- Text: minimum 12px (Rule 12)
- Tables: `overflow-x-auto` wrapper (Rule 12)
- Overlays: body scroll lock (Rule 4)
- Padding/gap: scale down for mobile. If original base value applies at desktop,
  PRESERVE it at xl:. Example: original `p-[24px]` → `p-3 sm:p-4 md:p-5 xl:p-[24px]`
  The xl: value MUST match the original to maintain pixel-identical desktop rendering (Rule 16).
- Section/chart headers: any `flex justify-between` with title + data/legend children
  → MUST add `flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0` (Rule 19)
  → grep current file for `flex.*justify-between`, check each for title+multi-child content
  → At 375px, title + legend/stats CANNOT fit side-by-side

### STEP 4: IMPLEMENT TABLET (md: + lg:)
- BEFORE adding any lg: class, verify that an xl: class already defines the same CSS property.
  If no xl: exists, the lg: value WILL cascade into desktop (Rule 16).
  In that case, add `xl:{original-desktop-value}` alongside the lg: addition.
  Prefer md: over lg: where possible — md: doesn't cascade as far into desktop territory.
- Add explicit md: breakpoint for iPad Mini (768px)
- Add explicit lg: breakpoint for iPad Pro (1024px)
- Grids: progressive column increase (Rule 13)
- Flex: transition to row at md: where space allows (Rule 13)
- Panels/sidebars: md: max-width values (Rule 13)
- Tables: lg: min-width adjustment (Rule 13)

### STEP 5: VERIFY
- Diff check: no xl: or 2xl: classes removed
- Diff check: no new lg: classes without xl: counterpart for same CSS property (Rule 16)
- Diff check: no base values changed without xl: preservation (Rule 16)
- Diff check: no useEffect/JS side-effects without viewport guard for 1280px+ (Rule 16)
- Mental render check: at 1280px wide, would the output be ANY different from before?
- No xs: classes added
- Text sizes >= 12px
- Mobile-first order (small -> large) (Rule 11)
- CVA overrides complete (Rule 10)
- Parent-child layout coordinated (Rule 7)

### STEP 6: PROPAGATE (Rule 14)
- For each fixed pattern, grep codebase for same pattern
- Record findings in Notes column of status file

### STEP 7: SCREENSHOT QA (requires dev server running)
Screenshot config should already exist from STEP 0-A setup.
If dev server is accessible:
1. Identify which page(s) were modified in this round
2. Run: `node .claude/react/tools/responsive-screenshot/capture.js --page {page-name} --viewport mobile`
3. Run: `node .claude/react/tools/responsive-screenshot/capture.js --page {page-name} --viewport tablet`
4. Read each captured screenshot with the Read tool
5. Check for:
   - Content overflowing viewport (horizontal scroll indicators)
   - Text overlapping or being clipped
   - Elements pushed outside visible area
   - Excessive whitespace or cramped layouts
   - Broken alignment or asymmetric grids
   - Buttons/links too small for touch (< 44px)

6. **Pass/Fail judgment** — apply these criteria consistently:

| Check | FAIL (must fix) | PASS (acceptable) |
|-------|-----------------|-------------------|
| Horizontal overflow | Content extends beyond viewport, causes horizontal scroll | Only intentional `overflow-x-auto` tables scroll horizontally |
| Text overlap | Text elements overlap each other | No overlap anywhere |
| Text clipping | Text cut off by container boundary | Natural line wrapping is fine |
| Touch targets | CTA buttons or nav items < 44px tap area | Inline links, pagination, tags can be < 44px |
| Empty space | > 50% of viewport width is empty on one side | Balanced margins and padding |
| Element visibility | Functional element pushed outside viewport | Intentional `hidden md:flex` with mobile alternative UI |
| Image/icon sizing | Single icon/image occupies > 50% of viewport width | Proportionally scaled down from desktop |

If dev server is not running, skip this step and note "Visual QA: skipped (dev server not running)" in status.

### STEP 8: FIX VISUAL
If STEP 7 found issues:
1. Fix the CSS/layout issues identified from screenshots
2. Re-capture the specific page to verify the fix
3. If fix introduces new issues, iterate (max 3 rounds)
4. Log any new patterns discovered to appropriate pattern file:
   - Universal pattern → `.claude/react/knowledge/responsive-design/global-patterns.md`
   - Project-specific → `.claude-project/learning/responsive-design/pattern-library.md`

### STEP 9: UPDATE STATUS
- Set Mobile Status: pass or fail (with reason)
- Set Tablet Status: pass or fail (with reason)
- Set Visual QA: pass, fail, or skipped (with reason)
- Overall: pass only when Mobile AND Tablet AND Visual QA all pass (or Visual QA skipped)
- Update Rules Checked column
- Every 5 items: update Execution Log with round number and completion %

### STEP 9.5: LEARN-UPDATE (every 5 items)
- Record any new patterns discovered this round
- **Universal patterns** (no file paths/component names) → `.claude/react/knowledge/responsive-design/global-patterns.md`
- **Project-specific patterns** → `.claude-project/learning/responsive-design/pattern-library.md`
- If same issue occurred 3+ times → add as Anti-Pattern
- If a successful fix was applied to 5+ files → add as Good Pattern
- If an Anti-Pattern has 5+ occurrences → propose as new Rule in `Proposed Rules` section
- Update Statistics in both issue-log.md and pattern-library.md

## 5. Status File Interaction

```
Status file:  .claude-project/plans/{project}/responsive-design-status.md
Template:     .claude/react/templates/responsive-design-status.template.md (skeleton only)
```

**Creating**: If no status file exists, create one at `.claude-project/plans/{project}/responsive-design-status.md` by:
1. Loading the skeleton template from `.claude/react/templates/responsive-design-status.template.md`
2. Scanning the project's frontend files (pages, components, modals, tables, etc.)
3. Populating item tracking tables with discovered files, categorized by priority

**Reading**: Parse Item Tracking tables to find next Pending item.

**Writing**: Update Mobile/Tablet/Overall columns, Last Run, Rules Checked, Notes.

**Summary**: Recalculate Quick Summary totals after each update.

**Completion**: Both-pass count / Total = percentage.

## 6. Completion Criteria

```
COMPLETE when:
- ALL items have Overall = pass or needs-review
- ZERO items with Pending or In Progress status
- Items failing 3 times -> move to Needs Manual Review
- Output: <promise>RESPONSIVE_DESIGN_COMPLETE</promise>
```

## 7. Error Handling

| Scenario | Action |
|---|---|
| Hook BLOCK (exit 2) | Read error message, fix violation, retry edit |
| 3 consecutive failures on same item | Add to Needs Manual Review, skip to next |
| Complex CVA chains spanning multiple files | Mark for manual review |
| Dynamic class generation (cn() + runtime conditions) | Mark for manual review |

## 8. Self-Learning System (2-Tier)

The agent improves across sessions via a 2-tier persistent knowledge system:

**Tier 1 - Global (shared across all projects via .claude submodule):**
```
Global patterns:     .claude/react/knowledge/responsive-design/global-patterns.md
```
- Universal CSS/Tailwind patterns (no project-specific file paths or component names)
- AP-001~012: xs: prohibition, lg: cascade, min-w overflow, etc.
- GP-001~005: icon-only CTA, progressive grid, modal margins, etc.
- Updated when universal patterns are discovered in any project

**Tier 2 - Project-specific (per-project in .claude-project/):**
```
Project patterns:    .claude-project/learning/responsive-design/pattern-library.md
Issue log:           .claude-project/learning/responsive-design/issue-log.md
```
- Patterns tied to specific components, layouts, or architecture
- PAP-001~N: project-specific anti-patterns with file references
- Issue log with session history and hook block records

**Hooks:**
- **PostToolUse**: responsive-validation-guard.ts blocks violations in real-time, logs to issue-log.md
- **Stop**: responsive-learning-logger.ts writes session summary, routes patterns to global or project tier
- **Pattern promotion**: Universal patterns discovered in project tier get promoted to global tier

## 9. Reference

```
Detailed rules:       .claude/react/skills/responsive-design/resources/checklist-rules.md
Screen registry guide: .claude/react/skills/responsive-design/resources/screen-registry.md
Screenshot tool:      .claude/react/tools/responsive-screenshot/capture.js
Global patterns:      .claude/react/knowledge/responsive-design/global-patterns.md
Screen inventory:     .claude-project/plans/{project}/screen-registry.md (project-specific)
Status file:          .claude-project/plans/{project}/responsive-design-status.md (project-specific)
Issue log:            .claude-project/learning/responsive-design/issue-log.md
Project patterns:     .claude-project/learning/responsive-design/pattern-library.md
Screenshot config:    .claude-project/config/screenshot-config.json (project-specific)
```
