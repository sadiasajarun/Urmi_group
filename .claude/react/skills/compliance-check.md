# Frontend Compliance Check Skill

Ralph workflow skill for auditing React frontend pages and components against mandatory rules.

## Workflow: `rule-check-frontend`

This skill is executed by Ralph in an autonomous loop. Each iteration audits one frontend page or component group.

## Item Discovery

```bash
# Pages (one item per page file)
fd -e tsx frontend/app/pages/

# Component directories (one item per directory)
ls -d frontend/app/components/*/
```

## Per-Item Instructions

For each page/component file or directory:

1. **List files**: `fd -e tsx -e ts {target_path}`
2. **Run compliance checks** (from `.claude/react/agents/compliance-checker.md`):

### Quick Check Commands

```bash
# Rule 1 (CRITICAL): Forms must use React Hook Form + Zod
rg "<form" --glob '*.tsx' {target} -l | xargs rg -L "useForm"

# Rule 2 (HIGH): Component organization
rg "export function \w+Modal" --glob '*.tsx' {target} -l | rg -v "modals/"

# Rule 3 (HIGH): Typed props
rg "export function \w+\(props\)" --glob '*.tsx' {target}

# Rule 6 (HIGH): Hardcoded enum strings
rg "=== '[a-z]+'" --glob '*.{ts,tsx}' {target} | rg -v "enums/"

# Rule 7 (HIGH): Raw HTML elements
rg "<button " --glob '*.tsx' {target} | rg -v "Button"
rg "<input " --glob '*.tsx' {target} | rg -v "Input"
rg "<select " --glob '*.tsx' {target}
rg "<textarea " --glob '*.tsx' {target}

# Rule 8 (HIGH): Inline interfaces
rg "^(export )?interface \w+" --glob '*.tsx' {target}

# Rule 9 (MEDIUM): Deep relative imports
rg "from '\.\./\.\./\.\." --glob '*.{ts,tsx}' {target}

# Rule 10 (MEDIUM): Modal loading pattern
rg "useState.*submitting" --glob '*.tsx' {target}

# Rule 11 (MEDIUM): Utility conventions
rg "^function " --glob '*.ts' {target}

# Rule 12 (MEDIUM): Monolithic types file — index.ts should only contain re-exports
rg "^(export )?interface " --glob 'index.ts' frontend/app/types/

# Rule 13 (HIGH): React Router 7 — No react-router-dom imports
rg "from ['\"]react-router-dom" --glob '*.{ts,tsx}' {SCAN_ROOT}/app/

# Rule 14 (HIGH): React Router 7 — No JSX Route definitions
rg "<Route " --glob '*.tsx' {SCAN_ROOT}/app/
rg "BrowserRouter|createBrowserRouter" --glob '*.{ts,tsx}' {SCAN_ROOT}/app/

# Rule 15 (MEDIUM): Inline RBAC — No guard wrapping in layouts
rg "AuthGuard|RoleGuard|ProtectedRoute" --glob '*.tsx' {SCAN_ROOT}/app/pages/**/layout.tsx

# Rule 16 (HIGH): Route guard coverage — all protected routes have RBAC entry
rg "route\(" --glob '*.ts' {SCAN_ROOT}/app/routes/protected.routes.ts
rg "routeAccess" --glob '*.tsx' {SCAN_ROOT}/app/components/layouts/ProtectedLayout.tsx

# Rule 17 (MEDIUM): Auth state — must have authChecked flag
rg "authChecked" --glob '*.{ts,tsx}' {SCAN_ROOT}/app/contexts/ {SCAN_ROOT}/app/redux/features/
```

3. **Report violations** with file:line references
4. **Mark initial result**: PASS (0 Critical + 0 High) or FAIL

5. **Auto-fix violations** (if item is FAIL):
   - Read the auto-fix instructions from `.claude/react/agents/compliance-checker.md` (Auto-Fix Instructions section)
   - Read all affected files
   - Fix in priority order: CRITICAL → HIGH → MEDIUM
   - Apply the appropriate fix pattern for each rule violation found

6. **Verify fix** — Re-run the Quick Check Commands above for this item
   - If new violations appear from the fix, fix those too (max 2 retry rounds)
   - Run `npx tsc --noEmit` from the frontend directory to ensure no TypeScript errors

7. **Update final status**:
   - All Critical + High resolved → mark PASS
   - Some remain → mark FAIL with list of unfixable violations and reason
   - Add "Fixed: N violations" to Notes column

## Success Criteria Per Item

- 0 Critical violations
- 0 High violations
- Medium violations documented but don't block PASS
- All fixes verified with `npx tsc --noEmit`

## Rule Foundations

Rules are derived from these authoritative guides:

| Rule Area | Guide Reference |
|-----------|----------------|
| File organization | [file-organization.md](../docs/file-organization.md) |
| Best practices | [best-practices.md](../docs/best-practices.md) |
| Component patterns | [component-patterns.md](../docs/component-patterns.md) |
| Data fetching | [data-fetching.md](../docs/data-fetching.md) |
| API integration | [api-integration.md](../docs/api-integration.md) |
| TypeScript | [typescript-standards.md](../docs/typescript-standards.md) |
| Auth/Guards | [authentication.md](../docs/authentication.md) |
| Routing | [routing-guide.md](../docs/routing-guide.md) |
| Security | [security-best-practices.md](../docs/security-best-practices.md) |
