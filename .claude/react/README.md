# Claude React

Claude Code configuration for React frontend development. This is a framework-specific submodule designed to be used alongside `claude-base` (shared/generic config).

## Agents (7)

| Agent | Model | Team | Description |
|-------|-------|------|-------------|
| **frontend-developer** | opus | team-frontend (leader) | React Router 7, declarative routing, RBAC, component patterns |
| **compliance-checker** | sonnet | team-quality | Audits 11 mandatory React rules with auto-fix |
| **gap-finder** | sonnet | team-quality | Design system compliance, missing pages, UI states, accessibility |
| **frontend-error-fixer** | sonnet | team-quality | Build-time and runtime error diagnosis |
| **design-qa-agent** | sonnet | team-quality | Pixel-perfect Figma comparison via MCP |
| **responsive-design-agent** | opus | team-frontend | Mobile + tablet responsive styles, 19 critical rules |
| **crud-operations** | sonnet | team-frontend | CRUD pattern guide (service/slice/mutation) |

## Guides (19)

| Guide | Description |
|-------|-------------|
| best-practices.md | Component patterns, utility rules, code quality mandates |
| file-organization.md | Directory structure, naming, barrel exports, import alias |
| component-patterns.md | CVA variants, shadcn/ui, lazy loading, mandatory async states |
| common-patterns.md | Redux slices, form patterns, React Hook Form + Zod |
| data-fetching.md | HttpService architecture, pagination, search debounce, filter/sort |
| api-integration.md | API wiring, type safety, integration checklist |
| authentication.md | Auth strategies, route protection, 401 handling, token storage |
| authentication-architecture.md | Auth system architecture overview |
| auth-guards.md | GuestGuard, ProtectedLayout, RBAC patterns |
| routing-guide.md | React Router 7 framework mode, route config |
| styling-guide.md | Tailwind CSS v4, cn() utility, responsive breakpoints |
| tanstack-query.md | Query hooks, cache invalidation, mutations |
| typescript-standards.md | Strict mode, no-any, import type, Zod inference |
| loading-and-error-states.md | Skeleton, error boundary, empty state patterns |
| performance.md | useMemo, useCallback, code splitting |
| browser-testing.md | Manual testing checklist |
| crud-operations.md | CRUD operations pattern reference |
| i18n-architecture.md | react-i18next setup, locale files, testing with i18n |
| security-best-practices.md | XSS prevention, token handling, CSRF, input validation |



## Skills (13)

| Skill | Trigger | Description |
|-------|---------|-------------|
| frontend-dev-guidelines | `frontend:` | React component patterns (agent reference) |
| api-integration | `integrate:` | Connect frontend to backend API |
| design-qa-figma | `qa:` | Figma vs implementation comparison |
| design-qa-html | `qa-html:` | HTML prototype vs implementation |
| frontend-e2e-testing | `e2e-fe:` | Playwright E2E test generation |
| e2e-test-generator | — | Ralph-triggered E2E test generation |
| figma-to-react-converter | `figma:` | Convert Figma designs to React |
| html-to-react-converter | `html2react:` | Convert HTML prototypes to React |
| dashboard-builder | `dash:` | Build admin dashboard pages |
| responsive-design | — | Mobile + tablet responsive styles |
| project-qa | `qa-project:` | Full QA audit (9 categories, health score) |
| code-quality | — | Organize frontend types and barrel exports |
| frontend-debugging | `debug-fe:` | Debug React and frontend errors |

## Other Contents

- **knowledge/** — Responsive design global patterns (anti-patterns, good patterns)
- **templates/** — Responsive design status template, screenshot config
- **tools/** — Responsive screenshot capture (Playwright-based)
- **examples/** — Complete working code examples

## Dependencies

**Required**: The `claude-base` submodule must be present at `.claude/base/` for full functionality. Some skill-rules and agent references use `../../base/` paths that resolve to the base submodule.

## Usage

```bash
git submodule add https://github.com/potentialInc/claude-react.git .claude/react
```

## Related Repos

- [claude-base](https://github.com/potentialInc/claude-base) - Shared/generic Claude Code config (REQUIRED)
- [claude-nestjs](https://github.com/potentialInc/claude-nestjs) - NestJS-specific Claude Code config
