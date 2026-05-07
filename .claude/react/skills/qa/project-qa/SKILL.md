---
skill_name: project-qa
applies_to_local_project_only: false
auto_trigger_regex: [project qa, full qa, api qa, integration qa, project audit, qa audit, health check, project health, qa report, validate project, qa testing]
tags: [qa, audit, api, integration, typescript, routing, auth, mock-data, health-score]
related_skills: [design-qa-figma, design-qa-html, api-integration, gap-finder, e2e-testing]
description: Comprehensive QA audit for React+API projects across 9 categories with weighted health scoring and fixing plans.
---

# Project QA Audit

Comprehensive quality audit for React projects integrated with a backend API. Analyzes 9 categories, calculates a weighted health score (0-100%), and produces an actionable fixing plan.

> **Scope**: Generic — works across any React + backend project. Paths are discovered dynamically, not hardcoded.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Audit Categories](#audit-categories)
3. [Health Score System](#health-score-system)
4. [Phase 1: Project Discovery](#phase-1-project-discovery)
5. [Phase 2: Inventory Building](#phase-2-inventory-building)
6. [Phase 3: Run Audits](#phase-3-run-audits)
7. [Phase 4: Score Calculation](#phase-4-score-calculation)
8. [Phase 5: Report Generation](#phase-5-report-generation)
9. [Phase 6: Fixing Plan](#phase-6-fixing-plan)
10. [Status Tracking](#status-tracking)
11. [Selective Auditing](#selective-auditing)
12. [References](#references)

---

## Quick Start

1. **Discover** — Scan project structure, detect stacks, locate docs/services/types/routes
2. **Audit** — Run all 9 audit categories (or selected ones)
3. **Report** — Generate health score, issue list, and fixing plan

---

## Audit Categories

| # | Category | Weight | What It Checks |
|---|----------|--------|----------------|
| 1 | Documentation Consistency | 8% | Docs vs actual implementation alignment |
| 2 | Backend API Contract Validation | 15% | Backend response shapes vs frontend types |
| 3 | Mock Data Validation | 10% | Mock/fake data usage when real API exists |
| 4 | API Integration Verification | 15% | Required APIs integrated in frontend |
| 5 | Data Integrity Checks | 10% | Null/undefined handling, object mismatches |
| 6 | API Functionality | 12% | GET/POST calls correctly implemented |
| 7 | Build & Type Safety | 12% | Build errors, TS errors, dependency issues |
| 8 | Routing Validation | 8% | Routes properly configured |
| 9 | Authentication & Authorization | 10% | Role-based routing, auth guards |

Total weights = 100%

---

## Health Score System

### Formula

```
Category Score = (passing_checks / total_checks_in_category) * 100

Overall Health = sum(category_score × category_weight)
```

### Rating Thresholds

| Score | Rating | Action Required |
|-------|--------|-----------------|
| 95-100% | Healthy | Production ready |
| 85-94% | Minor Issues | Fix before release |
| 70-84% | Needs Attention | Review and fix required |
| <70% | Critical | Significant rework needed |

> See [resources/scoring-reference.md](resources/scoring-reference.md) for detailed per-category rubrics.

---

## Phase 1: Project Discovery

Dynamically detect project structure — do NOT hardcode paths.

### 1.1 Detect Project Layout

```
Scan for:
├── package.json          → Detect React framework (CRA, Vite, Next.js, Remix)
├── CLAUDE.md             → Project conventions and structure hints
├── tsconfig.json         → TypeScript configuration
├── requirements.txt      → Django backend indicator
│   or package.json       → Node.js backend indicator (NestJS, Express)
└── docker-compose.yml    → Service orchestration
```

### 1.2 Locate Key Directories

Search for these directory patterns (adapt based on project):

| Purpose | Common Patterns |
|---------|----------------|
| **Services/API calls** | `services/`, `api/`, `lib/api/`, `hooks/use*` |
| **Type definitions** | `types/`, `interfaces/`, `*.d.ts`, `*.types.ts` |
| **Mock data** | `db/`, `mock/`, `__mocks__/`, `fixtures/`, `*mock*`, `*fake*` |
| **Route config** | `routes.ts`, `routes/`, `root.tsx` |
| **Pages/views** | `pages/`, `views/`, `screens/` |
| **State management** | `redux/`, `store/`, `context/`, `zustand/` |
| **Auth components** | `*ProtectedRoute*`, `*AuthGuard*`, `*RequireAuth*`, `*PrivateRoute*` |
| **Documentation** | `.claude-project/docs/`, `docs/`, `README.md` |

### 1.3 Detect Backend Framework

| Indicator | Framework | Response Shape Source |
|-----------|-----------|---------------------|
| `requirements.txt` + `manage.py` | Django | `serializers.py`, `views.py` |
| `package.json` with `@nestjs/core` | NestJS | DTOs, controllers |
| `package.json` with `express` | Express | Route handlers |
| No backend found | Skip Categories 1, 2 | Redistribute weights |

### 1.4 Detect Documentation

Search for project documentation files:

- `PROJECT_API.md` — API endpoint specs
- `PROJECT_DATABASE.md` — Schema/models
- `PROJECT_API_INTEGRATION.md` — Frontend-API mapping
- `PROJECT_KNOWLEDGE.md` — Architecture overview

If no documentation exists, skip Category 1 and redistribute its 8% weight proportionally.

---

## Phase 2: Inventory Building

Build cross-reference inventories before running audits.

### 2.1 Endpoint Inventory

From documentation (if exists):
- Parse `PROJECT_API.md` for all documented endpoints
- Extract: method, path, request/response shapes, auth requirements

From backend code:
- **Django**: Scan `urls.py` files for URL patterns, `views.py` for view classes, `serializers.py` for response shapes
- **NestJS**: Scan `*.controller.ts` for route decorators, `*.dto.ts` for shapes
- **Express**: Scan `router.*` files for route definitions

### 2.2 Service Inventory

Scan frontend service/API files:
- List all service methods with their HTTP method + endpoint
- Map service methods to the endpoints they call

### 2.3 Type Inventory

Scan frontend type definitions:
- List all API-related types/interfaces
- Map types to the endpoints they represent

### 2.4 Route Inventory

Scan route configuration:
- List all defined routes with their component references
- Identify which routes are public vs private/protected
- Identify auth guard usage

### 2.5 Mock Data Inventory

Scan for mock/fake data:
- List all mock data files
- Map which components import from mock data files
- Cross-reference with service inventory to detect overlap

---

## Phase 3: Run Audits

Execute each audit category using the inventories from Phase 2. Brief instructions below — see [resources/audit-procedures.md](resources/audit-procedures.md) for detailed procedures.

### Category 1: Documentation Consistency (8%)

- Compare documented endpoints vs actual backend URL patterns
- Compare documented models vs actual model/entity files
- Compare integration status docs vs actual service implementations
- **Severity**: High = undocumented production endpoints, Medium = documented but unimplemented

### Category 2: Backend API Contract Validation (15%)

- Extract response fields from backend serializers/DTOs
- Compare against frontend TypeScript type definitions
- Detect: field name mismatches (camelCase vs snake_case), missing fields, extra fields, type mismatches
- **Severity**: Critical = type mismatch causing runtime error, High = missing fields, Medium = extra unused fields

### Category 3: Mock Data Validation (10%)

- Find all mock data imports in components/pages
- Cross-reference: if a real API endpoint exists for that data, flag the mock usage
- If no API exists for the data, suggest creating a backend API in the fixing plan
- Detect hardcoded arrays/objects in components that should come from API
- **Severity**: High = mock data in production path, Medium = mock in dev-only path

### Category 4: API Integration Verification (15%)

- Compare required APIs (from docs or backend routes) with implemented service methods
- Flag endpoints that have no corresponding service method
- Flag components rendering data with no API call (relying on mock/hardcoded data)
- Cross-reference Redux/state slices with service methods
- **Severity**: Critical = missing core API integration, High = missing secondary integration

### Category 5: Data Integrity Checks (10%)

- Scan for `.map()`, `.filter()`, `.find()` on potentially null/undefined arrays
- Detect missing optional chaining (`data.field.subfield` without `?.`)
- Detect unsafe type assertions (`as any`, `as unknown as X`)
- Check for missing loading and error state handling in data-fetching components
- **Severity**: High = potential runtime crash, Medium = missing loading/error states

### Category 6: API Functionality (12%)

- Verify all API calls use try/catch or `.catch()` error handling
- Verify POST/PUT calls have properly typed request bodies
- Check for consistent use of API helper utilities (e.g., `handleApiResponse`/`handleApiError`)
- Verify pagination parameters are passed where API supports it
- Verify file upload calls use proper FormData construction
- **Severity**: High = missing error handling, Medium = missing pagination/typing

### Category 7: Build & Type Safety (12%)

- Run `npx tsc --noEmit` — capture and count errors
- Run build command (`npm run build` / `npx vite build`) — capture errors
- Count `any` type usage across codebase
- Count `@ts-ignore` and `@ts-expect-error` comments
- Check for circular dependency warnings
- **Severity**: Critical = build failure, High = type errors, Medium = `any` usage, Low = `@ts-ignore`

### Category 8: Routing Validation (8%)

- Cross-reference route config with page/component files
- Detect dead routes (pointing to non-existent components)
- Detect orphan pages (page files not in any route)
- Verify lazy loading consistency
- Verify 404/catch-all route exists
- **Severity**: High = dead routes, Medium = orphan pages, Low = missing lazy loading

### Category 9: Authentication & Authorization (10%)

- Identify auth guard/wrapper components
- Verify all private/protected routes use auth guards
- Verify role-based access: admin routes check admin role, etc.
- Check for unprotected API calls that should require auth headers
- Verify redirect behavior for unauthenticated users (login redirect)
- **Severity**: Critical = unprotected private routes, High = missing role checks, Medium = missing redirects

---

## Phase 4: Score Calculation

For each category:

1. Count total checks performed
2. Count passing checks
3. Calculate: `category_score = (passing / total) * 100`

Then calculate overall health:

```
overall_health = (cat1_score × 0.08) + (cat2_score × 0.15) + (cat3_score × 0.10)
               + (cat4_score × 0.15) + (cat5_score × 0.10) + (cat6_score × 0.12)
               + (cat7_score × 0.12) + (cat8_score × 0.08) + (cat9_score × 0.10)
```

If any category was skipped (e.g., no docs found), redistribute its weight proportionally:

```
adjusted_weight = original_weight / (1 - skipped_weight_sum)
```

Determine rating from thresholds table.

---

## Phase 5: Report Generation

Generate report at: `./dev/reports/project-qa-{YYYY-MM-DD}.md`

### Report Structure

```markdown
# Project QA Report

**Project**: {name}
**Date**: {YYYY-MM-DD}
**Overall Health**: {score}% ({rating})
**Categories Audited**: {count}/9

## Executive Summary
| # | Category | Score | Weight | Weighted | Issues |
|---|----------|-------|--------|----------|--------|
| 1 | Documentation Consistency | {x}% | 8% | {w}% | {n} |
| ... | ... | ... | ... | ... | ... |
| | **Overall** | | | **{score}%** | **{total}** |

## Category Details
### 1. Documentation Consistency ({score}%)
| # | Finding | Severity | File | Description |
...
(repeat for each category)

## Issue Registry
| # | Severity | Category | File:Line | Description | Root Cause |
...

## Fixing Plan
(see Phase 6)
```

> See [resources/report-templates.md](resources/report-templates.md) for full templates.

---

## Phase 6: Fixing Plan

Group all issues by severity and provide actionable fixes.

### Structure

```markdown
## Fixing Plan

### Critical (Fix Immediately)
1. **[Cat 9]** Unprotected admin route `/admin/settings`
   - File: `routes/admin.routes.ts:15`
   - Root Cause: Missing `AuthGuard` wrapper
   - Fix: Wrap route with `<ProtectedRoute role="admin">` component
   - Effort: Low

### High (Fix Before Release)
...

### Medium (Fix Soon)
...

### Low (Fix When Convenient)
...
```

Each fix entry includes:
- Category reference
- Affected file and line
- Root cause analysis
- Specific suggested fix
- Effort estimate (Low/Medium/High)

---

## Status Tracking

After each audit run, create/update: `.claude-project/status/frontend/PROJECT_QA_STATUS.md`

### Status File Contents

- Last run date and overall health score
- Score history table (track trends across runs)
- Current issues by severity
- Per-category scores with trend indicators
- Issues fixed since last run

> See [resources/report-templates.md](resources/report-templates.md) for the status file template.

---

## Selective Auditing

Run specific categories instead of the full audit:

```
# Run only API-related categories
project qa categories=2,4,6

# Run only build and type safety
project qa categories=7

# Run security-focused audit
project qa categories=9
```

When running selective audits:
- Only execute specified categories
- Calculate score using only selected category weights (re-normalized to 100%)
- Clearly indicate in report which categories were included/excluded

---

## References

### Resource Files

- [Audit Procedures](resources/audit-procedures.md) — Detailed step-by-step procedures for all 9 categories
- [Scoring Reference](resources/scoring-reference.md) — Weight rationale, per-category rubrics, worked examples
- [Report Templates](resources/report-templates.md) — Full report and status file templates

### Related Skills

- **design-qa-figma** — Visual fidelity against Figma designs
- **design-qa-html** — Visual fidelity against HTML prototypes
- **api-integration** — API service implementation patterns
- **gap-finder** — Multi-stack implementation gap detection
- **e2e-testing** — Playwright end-to-end test generation

### Documentation to Consult

- `PROJECT_API.md` — API endpoint specifications
- `PROJECT_DATABASE.md` — Database schema
- `PROJECT_API_INTEGRATION.md` — Frontend-API mapping status
- `PROJECT_KNOWLEDGE.md` — Architecture overview
