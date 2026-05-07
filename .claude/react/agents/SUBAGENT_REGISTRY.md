# React Agent Team Registry

Stack-specific agents for the React frontend, organized by team with invocation patterns.

---

## Organization

```
          project-coordinator (base)
                |
         frontend-developer (leader)
          /        |        \
   crud-ops   responsive   api-integration (base)
              design

   Quality Team (reports to quality-lead in base):
   - compliance-checker
   - gap-finder
   - frontend-error-fixer
   - design-qa-agent
```

---

## Team: Frontend (team-frontend)

### Leader: frontend-developer

**Specialty:** React Router 7, declarative routing, inline RBAC, component patterns, data fetching, form handling
**Model:** opus | **Type:** frontend

**Invocation:**
```
Task(
  subagent_type='frontend-developer',
  description='Implement [page/component]',
  prompt='Implement [component] following React Router 7 framework mode patterns. Read .claude/react/docs/file-organization.md and .claude/react/docs/best-practices.md first.'
)
```

### Members

#### crud-operations
**Specialty:** CRUD patterns with createAsyncThunk, FormHandleState, service layer
**Called by:** frontend-developer

```
Task(
  subagent_type='crud-operations',
  description='Implement CRUD for [module]',
  prompt='Team: team-frontend, Leader: frontend-developer. Implement CRUD operations for [module] using standard service/slice/mutation patterns.'
)
```

#### responsive-design-agent
**Specialty:** Mobile + tablet responsive styles, 19 critical rules, 2-tier learning system
**Called by:** frontend-developer

```
Task(
  subagent_type='responsive-design-agent',
  description='Add responsive styles to [page]',
  prompt='Team: team-frontend, Leader: frontend-developer. Add mobile+tablet responsive styles to [page] following .claude/react/skills/responsive-design/SKILL.md rules.'
)
```

---

## Quality Team Members (reports to quality-lead in base)

#### compliance-checker
**Specialty:** 11 mandatory React rule audits with auto-fix
**Called by:** quality-lead, frontend-developer

```
Task(
  subagent_type='compliance-checker',
  description='Audit React code compliance',
  prompt='Team: team-quality. Scan [SCAN_ROOT] for React compliance violations and auto-fix.'
)
```

#### gap-finder
**Specialty:** Design system compliance, missing icons/pages, UI states, accessibility, API integration gaps
**Called by:** quality-lead, base gap-finder

```
Task(
  subagent_type='gap-finder',
  description='Find React implementation gaps',
  prompt='Team: team-quality. Scan [SCAN_ROOT] for React-specific implementation gaps.'
)
```

#### frontend-error-fixer
**Specialty:** Build-time errors (TypeScript, bundling), runtime errors (React, browser console), network issues
**Called by:** quality-lead, frontend-developer

```
Task(
  subagent_type='frontend-error-fixer',
  description='Fix [error type] in [component]',
  prompt='Team: team-quality. Diagnose and fix the [error] using .claude/react/docs/ references.'
)
```

#### design-qa-agent
**Specialty:** Pixel-perfect Figma comparison using Figma MCP
**Called by:** quality-lead

```
Task(
  subagent_type='design-qa-agent',
  description='QA [screen] against Figma',
  prompt='Team: team-quality. Compare [screen] implementation with Figma design using MCP tools.'
)
```

---

## Framework Resources

When typed agents are invoked, they receive:
- **Guides**: `.claude/react/docs/`
- **Skills**: `.claude/react/skills/`
- **Knowledge**: `.claude/react/knowledge/`
- **Tools**: `.claude/react/tools/`
