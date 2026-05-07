# Screen Registry Guide

> This file explains how to create a project-specific screen registry.
> The actual screen registry is generated per-project at `.claude-project/plans/{project}/screen-registry.md`.

---

## How to Generate

When the responsive-design agent starts on a new project, it should:

1. Scan the project's frontend directory for `.tsx` / `.jsx` / `.vue` files
2. Categorize them by type:
   - **Layout**: Files named `layout.tsx` or wrapping route groups
   - **Components (CVA)**: Files using `cva()` for variant styling
   - **Components (Atoms)**: Small reusable UI components (Button, Card, Modal, Dropdown, etc.)
   - **Pages**: Route-level page components
   - **Tables**: Components with `<table>` or table-related naming
   - **Modals**: Components with "Modal" or "Dialog" in name
   - **Sub-components**: Remaining components used within pages
3. Assign priority:
   - Priority 1: Layout (affects all children)
   - Priority 2: Critical shared components (CVA atoms, Sidebar, Header)
   - Priority 3: Pages
   - Priority 4+: Sub-components, Tables, Modals (by project complexity)
4. Write the registry to `.claude-project/plans/{project}/screen-registry.md`

## Output Format

```markdown
# Screen Registry - {PROJECT_NAME}

## Priority N: {Category} ({count} files)

| Item | File Path |
|------|-----------|
| ComponentName | `path/to/file.tsx` |
```

## Storage Location

```
Project-specific:  .claude-project/plans/{project}/screen-registry.md
```
