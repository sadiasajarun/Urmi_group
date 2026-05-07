---
skill_name: design-qa-html
applies_to_local_project_only: true
auto_trigger_regex: [design qa, design-qa, pixel-perfect, qa report, visual comparison, html qa, html prototype, fidelity score, fidelity check]
tags: [qa, design-qa, html, pixel-perfect, fidelity]
related_skills: [html-to-react-converter, design-qa-figma]
description: Design QA skill for verifying React implementations against HTML prototypes. Calculates fidelity scores (0-100%) per screen and suggests prioritized fixes.
---

# Design QA Guide (HTML) with Fidelity Scoring

Verify implemented React screens against HTML prototypes with quantitative fidelity scoring.

> **HTML Prototypes**: Static HTML files serve as the source of truth for visual design.

---

## ⚠️ MANDATORY ARTIFACT OUTPUT (Gate Contract)

**This skill MUST write `{TARGET_DIR}/.claude-project/status/{project}/DESIGN_FIDELITY_REPORT.md`** every time it runs. The Phase 6 `frontend-gate.sh` parses this file — if it is missing or contains placeholder text, the gate FAILS. This enforces that the skill cannot be silently skipped.

### Required File Format

The report MUST contain these exact header lines (gate uses regex to parse):

```markdown
# Design Fidelity Report

- **project**: foreign-worker-platform
- **date**: 2026-04-15
- **screens_reviewed**: 58
- **avg_fidelity**: 0.42
- **min_fidelity**: 0.12

## Per-Page Scores

| page | react_path | score | rating | missing_critical |
|------|-----------|-------|--------|------------------|
| b-worker-home.html | frontend/src/pages/worker/WorkerHomePage.tsx | 0.28 | Major Revision | 5 sections, 12 SVG, 3 CTA buttons missing |
| admin-dashboard.html | frontend/src/pages/admin/AdminDashboardPage.tsx | 0.15 | Major Revision | 5 KPI cards, 3 charts, filter bar missing |
| login.html | frontend/src/pages/auth/LoginPage.tsx | 0.98 | Pixel Perfect | — |
...

## Summary

- Pages at >=0.95 (Pixel Perfect): {N}
- Pages 0.85 - 0.94 (Minor Issues): {N}
- Pages 0.70 - 0.84 (Needs Work): {N}
- Pages <0.70 (Major Revision): {N}

## Fix Suggestions (top priority)
[List Critical + High priority fixes per page]
```

### Parsing Rules (gate)

- `- **avg_fidelity**:` line → decimal 0.0~1.0 (or `avg_fidelity: 0.42` without bold asterisks — both accepted)
- `- **min_fidelity**:` line → decimal 0.0~1.0
- Pass threshold: `avg_fidelity >= 0.95 AND min_fidelity >= 0.85`
- Gate FAILS if: file missing / `TODO`, `{PROJECT_NAME}`, `YYYY-MM-DD`, `placeholder` strings found / scores below threshold

### Why This Is Mandatory

Previous pipeline runs skipped this skill and passed Phase 6 gate based on file-count heuristics. That allowed incomplete React pages (15-30% of HTML content) to progress to integrate/test-api, wasting 3 phases of effort. This artifact gate ensures the skill actually executes and produces real measurements every run.

---

## Fidelity Scoring System

### Category Weights

| Category | Weight | What's Measured |
|----------|--------|-----------------|
| **Layout Structure** | 25% | Component hierarchy, flex/grid patterns, alignment |
| **Spacing** | 20% | Padding, margin, gap values |
| **Typography** | 20% | Font size, weight, color, line-height |
| **Colors** | 15% | Background, text, border colors |
| **Visual Effects** | 10% | Border radius, shadows, opacity, transitions |
| **Components** | 10% | Element presence, icons, interactive states |

### Scoring Formula

```
Category Score = (matching_classes / total_classes_in_category) * 100

Overall Fidelity = sum(category_score * category_weight)
```

### Rating Thresholds

| Score | Rating | Action Required |
|-------|--------|-----------------|
| 95-100% | Pixel Perfect | Ready for release |
| 85-94% | Minor Issues | Fix before release |
| 70-84% | Needs Work | Review required |
| <70% | Major Revision | Significant rework needed |

---

## Required Tools

| Tool | Purpose | Required |
|------|---------|----------|
| `Read` | Read HTML file content and extract CSS/Tailwind classes | **ALWAYS** |
| `Bash` with Playwright MCP | Take screenshots for visual comparison | **RECOMMENDED** |
| `Grep` | Search for specific CSS patterns across files | As needed |

---

## ⚠️ Before Taking a Screenshot (Critical)

Do **NOT** use `page.waitForLoadState('load')` before screenshots. Most SPAs keep long-lived network connections open (WebSockets, Vite HMR, polling) so the `load` event never fires and the test hangs for the full timeout.

Use one of these instead, in order of preference:

```ts
// A. Wait for the page's main content to be visible (preferred — deterministic)
await page.waitForSelector('main, [role="main"], [data-testid$="-root"]', {
  state: 'visible',
});

// B. Wait for network idle with a short budget (fallback)
await page
  .waitForLoadState('networkidle', { timeout: 5_000 })
  .catch(() => {
    /* sockets can legitimately stay open; continue */
  });

// C. Give fonts + images a last beat to settle before snapshotting
await page.waitForTimeout(300);
```

Same guidance applies to the HTML prototype side when opening via `file://` — prefer a locator wait over a global load event.

---

## Phase 1: Project Selection (REQUIRED)

Scan for frontend directories and ask user to select:

```bash
ls -d frontend* 2>/dev/null
```

Locate status file at: `.claude-project/status/{project-name}/SCREEN_IMPLEMENTATION_STATUS.md`

---

## Phase 2: Screen Selection

Select screens from status file, direct file paths, or by route.

---

## Phase 3: HTML Prototype Analysis

### Step 1: Read HTML File

### Step 2: Extract and Categorize Tailwind Classes

**Layout Classes**: `flex, flex-row, flex-col, grid, items-*, justify-*, w-*, h-*, max-w-*`

**Spacing Classes**: `p-*, px-*, py-*, m-*, mx-*, my-*, gap-*, space-*`

**Typography Classes**: `text-xs/sm/base/lg/xl/2xl, font-*, leading-*, tracking-*`

**Color Classes**: `bg-*, text-{color}-*, border-*, ring-*`

**Visual Effect Classes**: `rounded-*, shadow-*, opacity-*, transition-*, border-*`

**Components**: Elements (button, input, svg), states (hover:*, focus:*)

### Step 3: Create Class Inventory

```markdown
## HTML Class Inventory: {screen-name}

| Category | Classes | Count |
|----------|---------|-------|
| Layout | flex flex-col, items-center | 10 |
| Spacing | p-6, gap-4, px-4 py-2 | 8 |
| Typography | text-2xl font-bold | 6 |
| Colors | bg-blue-600, text-gray-700 | 8 |
| Visual Effects | rounded-lg shadow-sm | 5 |
| Components | button, input, icon | 6 |
```

---

## Phase 4: Implementation Review

Read React file and extract classes using same categorization.

---

## Phase 5: Fidelity Score Calculation

### Step 1: Compare Classes by Category

```markdown
## Category Comparison

### Layout
| HTML | React | Match |
|------|-------|-------|
| flex flex-col | flex flex-col | YES |
| items-center | items-start | NO |

**Layout Score**: 8/10 = **80%**
```

### Step 2: Calculate Overall Score

```markdown
| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Layout | 80% | 25% | 20.0% |
| Spacing | 62.5% | 20% | 12.5% |
| Typography | 100% | 20% | 20.0% |
| Colors | 87.5% | 15% | 13.1% |
| Visual Effects | 80% | 10% | 8.0% |
| Components | 83.3% | 10% | 8.3% |

**Overall Fidelity: 81.9%** (Needs Work)
```

---

## Phase 6: Fix Generation

### Fix Priority Levels

| Priority | Impact | Description |
|----------|--------|-------------|
| **Critical** | >5% | Layout breaks, missing components |
| **High** | 2-5% | Spacing mismatches, color errors |
| **Medium** | 1-2% | Typography differences |
| **Low** | <1% | Minor visual effects |

### Fix Format

```markdown
### Fix #1: Spacing - Container Padding
**Priority**: High | **Impact**: +2.5% fidelity
**Location**: `frontend/app/pages/dashboard.tsx:8`
**Current**: `className="p-4"`
**Expected**: `className="p-6"`
**Action**: Change padding from p-4 (16px) to p-6 (24px)
```

### Fix Summary Table

```markdown
| Priority | Count | Total Impact |
|----------|-------|--------------|
| Critical | 1 | +1.7% |
| High | 3 | +7.5% |
| Medium | 1 | +1.9% |
| Low | 1 | +1.0% |

**Current Fidelity**: 81.9%
**Estimated Post-Fix Fidelity**: 94.0%
```

---

## Phase 7: Report Generation

```markdown
# Design QA Report - Fidelity Scores

**Project**: {project-name}
**Date**: {date}
**Screens Reviewed**: {count}

## Executive Summary

| Screen | Fidelity | Rating | Fixes |
|--------|----------|--------|-------|
| Dashboard | 81.9% | Needs Work | 6 |
| Login | 96.2% | Pixel Perfect | 1 |

## Screen: {name}

**Overall Fidelity**: 81.9% (Needs Work)

### Category Scores

| Category | Score | Status | Issues |
|----------|-------|--------|--------|
| Layout | 80% | FAIL | 1 |
| Spacing | 62.5% | FAIL | 2 |
| Typography | 100% | PASS | 0 |
| Colors | 87.5% | PASS | 1 |
| Visual Effects | 80% | PASS | 1 |
| Components | 83.3% | FAIL | 1 |

### Suggested Fixes (by priority)
[List all fixes with code snippets]

### Estimated Post-Fix Fidelity: 94.0%
```

---

## Quick QA Workflow

```
1. Discover Projects → ls -d frontend*
2. Select Project
3. Load Status File
4. Select Screen(s) OR "all" for full project QA
5. For each screen:
   a. Read HTML → Extract & categorize classes
   b. Read React → Extract & categorize classes
   c. Compare by category → Calculate scores
   d. Generate prioritized fixes
6. Calculate Project-Wide Fidelity (if multiple screens)
7. Generate Report with fidelity scores
8. Update Status File with scores
```

---

## All-Pages Fidelity Calculation

When running QA on multiple or all pages, calculate aggregate fidelity scores.

### Step 1: Collect Individual Screen Scores

After completing QA for each screen, compile results:

```markdown
## Individual Screen Scores

| Screen | Layout | Spacing | Typography | Colors | Effects | Components | Overall |
|--------|--------|---------|------------|--------|---------|------------|---------|
| Dashboard | 80% | 62.5% | 100% | 87.5% | 80% | 83.3% | 81.9% |
| Login | 100% | 95% | 100% | 90% | 100% | 100% | 96.2% |
| Settings | 75% | 80% | 85% | 95% | 90% | 80% | 82.5% |
| Profile | 90% | 85% | 95% | 100% | 85% | 90% | 90.8% |
```

### Step 2: Calculate Project-Wide Fidelity

**Simple Average Method** (equal weight per screen):
```
Project Fidelity = sum(screen_scores) / total_screens

Example: (81.9 + 96.2 + 82.5 + 90.8) / 4 = 87.9%
```

**Weighted Average Method** (weight by complexity/importance):
```markdown
| Screen | Fidelity | Weight | Weighted Score |
|--------|----------|--------|----------------|
| Dashboard | 81.9% | 30% | 24.57% |
| Login | 96.2% | 20% | 19.24% |
| Settings | 82.5% | 25% | 20.63% |
| Profile | 90.8% | 25% | 22.70% |

Project Fidelity: 87.1%
```

### Step 3: Category Breakdown (Project-Wide)

```markdown
## Project-Wide Category Scores

| Category | Average | Lowest Screen | Highest Screen |
|----------|---------|---------------|----------------|
| Layout | 86.3% | Settings (75%) | Login (100%) |
| Spacing | 80.6% | Dashboard (62.5%) | Login (95%) |
| Typography | 95.0% | Settings (85%) | Dashboard (100%) |
| Colors | 93.1% | Dashboard (87.5%) | Profile (100%) |
| Visual Effects | 88.8% | Dashboard (80%) | Login (100%) |
| Components | 88.3% | Settings (80%) | Login (100%) |

**Weakest Category**: Spacing (80.6%) - Priority for fixes
**Strongest Category**: Typography (95.0%)
```

### Step 4: Generate All-Pages Report

```markdown
# Design QA Report - All Pages Summary

**Project**: {project-name}
**Date**: {date}
**Total Screens**: {count}

## Project-Wide Fidelity

| Metric | Score | Rating |
|--------|-------|--------|
| **Overall Fidelity** | 87.9% | Minor Issues |
| Highest Screen | Login (96.2%) | Pixel Perfect |
| Lowest Screen | Dashboard (81.9%) | Needs Work |

## Rating Distribution

| Rating | Count | Percentage |
|--------|-------|------------|
| Pixel Perfect (95-100%) | 1 | 25% |
| Minor Issues (85-94%) | 1 | 25% |
| Needs Work (70-84%) | 2 | 50% |
| Major Revision (<70%) | 0 | 0% |

## Category Health

| Category | Project Avg | Status | Action |
|----------|-------------|--------|--------|
| Layout | 86.3% | PASS | - |
| Spacing | 80.6% | FAIL | Priority fixes needed |
| Typography | 95.0% | PASS | - |
| Colors | 93.1% | PASS | - |
| Visual Effects | 88.8% | PASS | - |
| Components | 88.3% | PASS | - |

## Priority Fix Queue (All Screens)

| Priority | Screen | Fix | Impact |
|----------|--------|-----|--------|
| Critical | Dashboard | Container spacing | +2.5% |
| Critical | Settings | Layout alignment | +2.0% |
| High | Dashboard | Gap values | +1.5% |
| High | Settings | Component padding | +1.2% |

**Estimated Post-Fix Project Fidelity**: 94.5%

## Screen-by-Screen Summary

| Screen | Route | Fidelity | Rating | Fixes Needed |
|--------|-------|----------|--------|--------------|
| Dashboard | /dashboard | 81.9% | Needs Work | 6 |
| Login | /login | 96.2% | Pixel Perfect | 1 |
| Settings | /settings | 82.5% | Needs Work | 5 |
| Profile | /profile | 90.8% | Minor Issues | 3 |
```

### All-Pages QA Command

When user requests "QA all pages" or "full project QA":

1. **Scan HTML Prototypes**:
   ```bash
   ls html/{project}/*.html
   ```

2. **Match to Implementations**:
   Cross-reference with status file to find corresponding React files.

3. **Batch Process**:
   For each HTML/React pair, run full fidelity calculation.

4. **Aggregate Results**:
   Calculate project-wide scores using formulas above.

5. **Generate Consolidated Report**:
   Single report with all screens and project summary

---

## Common Discrepancy Patterns

### Spacing (High Impact: ~2.5% each)
| HTML | Common Mistake |
|------|----------------|
| `p-6` | `p-4` |
| `gap-4` | `gap-2` |

### Typography (Medium Impact: ~1.7% each)
| HTML | Common Mistake |
|------|----------------|
| `text-2xl` | `text-xl` |
| `font-semibold` | `font-medium` |

### Colors (Medium Impact: ~1.9% each)
| HTML | Common Mistake |
|------|----------------|
| `bg-blue-600` | `bg-blue-500` |
| `bg-gray-50` | `bg-gray-100` |

### Visual Effects (Low Impact: ~1.0% each)
| HTML | Common Mistake |
|------|----------------|
| `rounded-lg` | `rounded-md` |
| `shadow-sm` | `shadow` |

---

## Status File Integration

Update `SCREEN_IMPLEMENTATION_STATUS.md` after QA:

```markdown
| Screen | Route | Status | Fidelity | Last QA |
| Dashboard | /dashboard | In Progress | 81.9% (Needs Work) | 2024-01-15 |
| Login | /login | Complete | 96.2% (Pixel Perfect) | 2024-01-15 |
```

---

## QA Session Checklist

- [ ] HTML prototype file read
- [ ] Classes extracted and categorized
- [ ] React implementation file read
- [ ] React classes extracted and categorized
- [ ] Category scores calculated
- [ ] Overall fidelity score calculated
- [ ] Discrepancies listed with line numbers
- [ ] Fixes generated with priority and impact
- [ ] Post-fix fidelity estimated
- [ ] Status file updated

---

## See Also

- [Design QA (Figma)](./design-qa-figma.md)
- [HTML to React Converter](../convert-html-to-react.md)
