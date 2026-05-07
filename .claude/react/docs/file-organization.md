# File Organization

Proper file and directory structure for maintainable, scalable frontend code.

---

## CRITICAL RULES CHECKLIST

Before implementing any feature, verify:

### Directory Structure

- [ ] Components placed in correct directory:
  - `components/ui/` - ONLY Shadcn/UI primitives (lowercase names)
  - `components/atoms/` - Custom reusable atomic components (PascalCase, non-Shadcn)
  - `components/modals/` - All modal/dialog overlay components (PascalCase, Modal suffix)
  - `components/shared/` - Feature-specific shared components (Navbar, Sidebar, Breadcrumb, PinMarker)
  - `components/layouts/` - Layout wrappers only
  - `components/guards/` - Route guards
  - `pages/` - Page components by route hierarchy
- [ ] Services organized properly:
  - `services/httpService.ts` - Axios orchestrator (do not modify)
  - `services/httpMethods/` - HTTP factories (do not modify)
  - `services/httpServices/` - Domain-specific services
  - `services/httpServices/` - Contains `createAsyncThunk` for READ ops + plain methods for mutations

### Naming Conventions

- [ ] Components use PascalCase: `UserCard.tsx`, `Button.tsx`
- [ ] Shadcn/UI components use lowercase: `button.tsx`, `card.tsx`
- [ ] Services use camelCase + Service: `userService.ts`
- [ ] Routes use kebab-case: `auth.routes.ts`
- [ ] Redux slices use camelCase + Slice: `userSlice.ts`

### Import Rules

- [ ] Using `~/` alias for all imports (not relative paths like `../../`)
- [ ] Import order follows standard:
  1. React and React-related
  2. Third-party libraries
  3. Redux hooks and actions
  4. Components
  5. Utilities
  6. Type imports (grouped)
  7. Relative imports (same feature only)
- [ ] All imports use single quotes (project standard)

### New Feature Requirements

When creating a new feature, you MUST create these files:

- [ ] `app/pages/{feature}/index.tsx` - Main page component
- [ ] `app/services/httpServices/{feature}Service.ts` - API service
- [ ] `app/services/httpServices/queries/use{Feature}.ts` - Query hooks (if public page)
- [ ] `app/redux/features/{feature}Slice.ts` - Redux slice (if needed)
- [ ] `app/types/{feature}.d.ts` - TypeScript types
- [ ] `app/routes/{feature}.routes.ts` - Route definitions
- [ ] `app/utils/validations/{feature}.ts` - Zod schemas (if forms needed)

Then update:

- [ ] `app/routes.ts` - Import and add new routes
- [ ] `app/redux/store/rootReducer.ts` - Add reducer (if using Redux)
- [ ] `app/services/httpServices/queries/index.ts` - Export query hooks (if created)

---

## PRE-IMPLEMENTATION VERIFICATION

Before writing ANY code, answer these questions:

**Component Placement:**

1. Is this a Shadcn/UI primitive? → Goes in `components/ui/` with lowercase name
2. Is this a modal/dialog overlay? → Goes in `components/modals/` with PascalCase and `Modal` suffix
3. Is this a small, reusable, non-Shadcn component (badge, spinner, card, dropdown)? → Goes in `components/atoms/` with PascalCase
4. Is this coupled to a specific layout area (navbar, sidebar, breadcrumb)? → Goes in `components/shared/`
5. Is this a layout wrapper? → Goes in `components/layouts/` with PascalCase
6. Is this a route guard? → Goes in `components/guards/` with PascalCase
7. Is this a page component? → Goes in `pages/{route-area}/` with PascalCase
8. **NEVER** define reusable components inline inside page files — extract to the correct folder

**Service Layer:**

1. Am I modifying httpService.ts? → STOP - Do not modify the orchestrator
2. Am I creating a new API service? → Goes in `services/httpServices/`
3. Is this for a public page? → Create query hook in `services/httpServices/queries/`
4. Does this need server-side data? → Use React Router server actions in `utils/actions/`

**Imports:**

1. Am I using relative paths like `../../../`? → STOP - Use `~/` alias instead
2. Are my imports organized by category? → Follow the import order standard
3. Am I using double quotes? → STOP - Use single quotes (project standard)

**New Feature:**

1. Have I created ALL 7 required file types? → See "New Feature Requirements" checklist
2. Have I updated the 3 integration points? → routes.ts, rootReducer.ts, queries/index.ts
3. Does the feature name match across all files? → Verify consistent naming

---

## Directory Structure

> **Note:** React Router 7 framework mode uses `app/` as the default directory (not `src/`). This is configured in `react-router.config.ts` via `appDirectory: "app"`.

```
app/                              # React Router 7 app directory (NOT src/)
├── components/
│   ├── ui/                       # Shadcn/UI primitives (lowercase)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── form.tsx
│   ├── atoms/                    # Custom reusable atomic components (PascalCase)
│   │   ├── StatusBadge.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   └── FeedbackCard.tsx
│   ├── modals/                   # Modal/dialog overlay components (PascalCase)
│   │   ├── ConfirmModal.tsx
│   │   └── ViewReplyModal.tsx
│   ├── shared/                   # Feature-specific shared components
│   │   ├── AdminSidebar.tsx
│   │   ├── ClientNavbar.tsx
│   │   └── Breadcrumb.tsx
│   ├── layouts/                  # Layout wrappers
│   │   └── ProtectedLayout.tsx   # Inline auth + RBAC (recommended pattern)
│   └── guards/                   # Route guards
│       ├── GuestGuard.tsx        # Auth pages — renders <Outlet /> for guests
│       ├── AuthGuard.tsx         # One-off auth check (optional)
│       └── RoleGuard.tsx         # One-off role check (optional)
├── contexts/                     # React Context providers
│   └── AuthContext.tsx           # Auth state + useAuth() hook
├── enums/                        # Enum definitions
│   ├── role.enum.ts              # Synced from backend
│   ├── sort-order.enum.ts        # Frontend-only
│   └── index.ts                  # Barrel export
├── hooks/                        # Custom hooks
│   ├── useAuth.ts                # Auth state hook (or re-export from contexts/)
│   └── providers/                # Context providers
│       └── providers.tsx         # Redux provider setup
├── lib/                          # Utilities
│   └── utils.ts                  # cn() utility
├── pages/                        # Page components
│   ├── redirect-home.tsx         # Root redirect (SPA: <Navigate>, SSR: loader)
│   ├── not-found.tsx             # 404 catch-all page
│   ├── unauthorized.tsx          # 403 unauthorized page
│   ├── auth/                     # Auth pages (wrapped by GuestGuard layout)
│   │   ├── layout.tsx            # Delegates to <GuestGuard />
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   └── protected/                # Protected pages (wrapped by ProtectedLayout)
│       ├── dashboard.tsx
│       ├── users.tsx
│       └── settings.tsx
├── redux/                        # State management (if using Redux)
│   ├── features/                 # Redux slices
│   │   ├── authSlice.ts          # Auth state (alternative to AuthContext)
│   │   └── userSlice.ts
│   └── store/                    # Store configuration
│       ├── store.ts
│       ├── rootReducer.ts
│       └── hooks.ts              # useAppDispatch, useAppSelector
├── routes/                       # Route definitions (declarative config)
│   ├── auth.routes.ts            # Auth routes (login, register)
│   └── protected.routes.ts       # Protected routes (RouteConfigEntry)
├── services/                     # API services
│   ├── api/                      # Axios instance and config
│   │   └── axios.ts              # Axios with interceptors (401 refresh)
│   ├── httpService.ts            # Axios orchestrator (legacy)
│   ├── httpMethods/              # HTTP method factories
│   │   ├── index.ts
│   │   ├── get.ts
│   │   ├── post.ts
│   │   └── responseInterceptor.ts
│   └── httpServices/             # Domain-specific services
│       ├── *Service.ts           # Domain services with createAsyncThunk for READ ops
│       │   └── index.ts
│       ├── authService.ts
│       ├── userService.ts
│       └── itemService.ts
├── styles/                       # CSS files
│   └── app.css                   # Tailwind + theme variables
├── types/                        # TypeScript types
│   ├── user.d.ts
│   └── httpService.d.ts
├── utils/                        # Utility functions
│   ├── errorHandler.ts
│   ├── actions/                  # Server actions (SSR mode only)
│   └── validations/              # Zod schemas
│       └── auth.ts
├── root.tsx                      # App root (replaces main.tsx + index.html + App.tsx)
└── routes.ts                     # Main route config (declarative, no JSX <Route>)

# Project root files (outside app/)
├── react-router.config.ts        # RR7 config (ssr: true/false, appDirectory)
├── vite.config.ts                # Vite config with @react-router/dev/vite plugin
├── tsconfig.json                 # TypeScript config (includes .react-router/types)
└── .react-router/                # Auto-generated types (gitignored)
    └── types/
```

---

## Folder Purposes

### components/

Reusable components organized by type:

```
components/
├── ui/                  # Shadcn/UI primitives (lowercase names)
├── atoms/               # Custom reusable atomic components (PascalCase)
├── modals/              # Modal/dialog overlay components (PascalCase, Modal suffix)
├── shared/              # Feature-specific shared components (Navbar, Sidebar, Breadcrumb)
├── layouts/             # Layout wrappers
└── guards/              # Route guards
```

**Rules:**

- `ui/` — Shadcn/UI primitives only (lowercase filenames)
- `atoms/` — Small, reusable custom components not from Shadcn (badges, spinners, dropdowns, cards)
- `modals/` — All modal/dialog overlay components (use `Modal` suffix in name)
- `shared/` — Components coupled to a specific layout area (navbar, sidebar, breadcrumb, pin marker)
- `layouts/` — Page layout wrappers
- `guards/` — Route access guards
- **NEVER** define reusable sub-components inline inside page files — extract to the correct folder

---

### pages/

Page components organized by route area:

```
pages/
├── layout.tsx           # Main layout wrapper
├── auth/                # Authentication-related pages
│   ├── layout.tsx       # Auth-specific layout
│   ├── login.tsx
│   └── register.tsx
└── public/              # Public pages
    ├── home.tsx
    └── about.tsx
```

**Rules:**

- Each page is a default export
- Layout files wrap child routes
- Organize by route hierarchy

---

### redux/

Redux state management:

```
redux/
├── features/            # Redux slices by domain
│   ├── userSlice.ts
│   └── counterSlice.ts
└── store/               # Store configuration
    ├── store.ts         # Store setup
    ├── rootReducer.ts   # Combined reducers
    └── hooks.ts         # Typed hooks (useAppDispatch, useAppSelector)
```

**Rules:**

- One slice per domain/feature
- Async thunks defined in service files, not slices
- Always use typed hooks from `store/hooks.ts`

---

### services/

API services and HTTP client:

```
services/
├── httpService.ts         # Axios orchestrator
├── httpMethods/           # HTTP method factories
│   ├── index.ts           # Export all methods
│   ├── get.ts             # GET factory
│   ├── post.ts            # POST factory
│   ├── put.ts             # PUT factory
│   ├── delete.ts          # DELETE factory
│   ├── patch.ts           # PATCH factory
│   ├── requestInterceptor.ts   # Request interceptor
│   └── responseInterceptor.ts  # Response interceptor
└── httpServices/          # Domain-specific services
    ├── *Service.ts        # Domain services with createAsyncThunk for READ ops
    │   ├── index.ts
    │   └── usePublicCategories.ts
    ├── authService.ts
    ├── userService.ts
    └── itemService.ts
```

**Rules:**

- `httpService.ts` is the Axios orchestrator with interceptors
- `httpMethods/` contains factory functions for each HTTP method
- `httpServices/` contains domain-specific API services
- Each service file contains `createAsyncThunk` exports for READ operations and plain methods for mutations
- Feature services use `httpService` for all requests

---

### types/

TypeScript type definitions organized by domain:

```
types/
├── {domain}.d.ts        # One file per domain (e.g., user.d.ts, animal.d.ts)
├── common.d.ts          # Shared utility types (e.g., PaginatedResponse)
├── components.d.ts      # Shared component prop interfaces
├── layout.d.ts          # Layout component prop interfaces
├── httpService.d.ts     # API response/error types
└── index.ts             # Barrel re-export (all domain files)
```

**Rules:**

- Use `.d.ts` extension for type-only files
- One `.d.ts` file per domain — group entity + related props together
- Barrel `index.ts` re-exports all domain files for `~/types` imports
- Cross-domain imports use relative paths (e.g., `import type { User } from './user'`)
- No monolithic type files — keep `index.ts` as re-exports only
- **Redux `*State` interfaces MUST be in `~/types/{domain}.d.ts`** — NEVER declare inline in slice files
- **Domain types (entities, rows, summaries) MUST be in `~/types/{domain}.d.ts`** — NEVER declare inline in components/pages
- **API request/response types (query params, create/update payloads, dashboard DTOs) MUST be in `~/types/{domain}.d.ts`** — NEVER declare inline in service files (`services/httpServices/`)
- **Only component Props interfaces and local UI unions (`FilterType`, `SortType`) may stay inline** in component files

---

### utils/

Utility functions:

```
utils/
├── errorHandler.ts      # HTTP error handling
├── actions/             # React Router server actions
│   └── auth.ts
└── validations/         # Zod validation schemas
    └── auth.ts
```

**Rules:**

- Pure utility functions (no React hooks)
- Validation schemas use Zod
- Server actions for form submissions

---

### enums/

Enum definitions synced from backend and frontend-only enums:

```
enums/
├── role.enum.ts             # Synced from backend
├── pin-status.enum.ts       # Synced from backend
├── screen-status.enum.ts    # Synced from backend
├── sort-order.enum.ts       # Frontend-only
└── index.ts                 # Barrel export
```

**Rules:**

- Backend enums are mirrored exactly from `backend/src/shared/enums/`
- Frontend-only enums for UI-specific values also live here
- All enums use PascalCase with `Enum` suffix
- File names use kebab-case with `.enum.ts` extension
- Barrel `index.ts` re-exports all enums
- Import via `~/enums` (not individual files)
- Run `/sync-enums` when backend adds/modifies enums
- When enum values change, update ALL references (comparisons, Record keys, option values, useState defaults, function arguments, JSX attributes)

---

### hooks/

Custom React hooks:

```
hooks/
└── providers/           # Context providers
    └── providers.tsx    # Redux provider setup
```

**Rules:**

- Custom hooks that use React hooks
- Provider setup for context

---

### routes/

Route configuration files (React Router 7 declarative config):

```
routes/
├── auth.routes.ts           # Auth routes (login, register, forgot-password)
├── protected.routes.ts      # Protected routes (RouteConfigEntry with layout wrapper)
└── public.routes.ts         # Public routes (optional)
```

**Rules:**

- Separate files for route groups
- Use `route()`, `layout()`, `index()` from `@react-router/dev/routes`
- Protected routes use `RouteConfigEntry` type (single layout wrapper)
- Auth routes are an array (wrapped by auth layout in `routes.ts`)
- All imported into main `routes.ts`

**Route Config Pattern:**

```typescript
// ~/routes/protected.routes.ts
import { type RouteConfigEntry, route, layout } from "@react-router/dev/routes";

export const protectedRoutes: RouteConfigEntry = layout(
  "components/layouts/ProtectedLayout.tsx",
  [
    route("dashboard", "pages/protected/dashboard.tsx"),
    route("users", "pages/protected/users.tsx"),
    route("unauthorized", "pages/unauthorized.tsx"),
  ],
);
```

---

## Import Alias

The project uses `~/` as an alias for the `/app/` directory:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "~/*": ["./app/*"]
    }
  }
}
```

**Examples:**

```typescript
// ✅ Correct - using alias
import { Button } from "~/components/ui/button";
import { useAppDispatch } from "~/redux/store/hooks";
import type { User } from "~/types/user";

// ❌ Avoid - relative paths for distant imports
import { Button } from "../../../components/ui/button";
```

---

## File Naming Conventions

| Type         | Convention          | Example                      |
| ------------ | ------------------- | ---------------------------- |
| Components   | PascalCase          | `Button.tsx`, `UserCard.tsx` |
| Shadcn/UI    | lowercase           | `button.tsx`, `card.tsx`     |
| Redux slices | camelCase + Slice   | `userSlice.ts`               |
| Services     | camelCase + Service | `userService.ts`             |
| Types        | camelCase           | `user.d.ts`                  |
| Utils        | camelCase           | `errorHandler.ts`            |
| Routes       | kebab-case          | `auth.routes.ts`             |
| Validations  | camelCase           | `auth.ts`                    |

---

## Creating a New Feature - MANDATORY CHECKLIST

When adding a new feature (e.g., "posts"), you MUST create these files in this order:

### PHASE 1: Type Definitions

```
app/types/
└── post.d.ts              # TypeScript types
```

**Verify:** Types exported and available for import

### PHASE 2: API Service Layer

```
app/services/httpServices/
├── postService.ts         # API service using httpService
└── postService.ts         # createAsyncThunk for fetchPosts + plain methods for create/update/delete
```

**Verify:** Service uses httpService methods, not raw axios

### PHASE 3: State Management (If Needed)

```
app/redux/features/
└── postSlice.ts           # Redux slice (if global state needed)
```

**Verify:** Slice uses types from step 1, async logic in service layer

### PHASE 4: Pages & Routes

```
app/pages/posts/
├── index.tsx              # Main page component
app/routes/
└── post.routes.ts         # Route definitions
```

**Verify:** Page uses proper imports with `~/` alias

### PHASE 5: Validation (If Forms)

```
app/utils/validations/
└── post.ts                # Zod schemas (if forms needed)
```

**Verify:** Schemas match type definitions

### PHASE 6: Integration (CRITICAL - DO NOT SKIP)

Update these files:

```
✓ app/routes.ts
  - Import: import { postRoutes } from './routes/post.routes';
  - Add to routes array

✓ app/redux/store/rootReducer.ts (if using Redux)
  - Import: import postReducer from '../features/postSlice';
  - Add to combineReducers: post: postReducer

✓ app/services/httpServices/queries/index.ts (if created queries)
  - Export: export * from './usePosts';
```

### VERIFICATION BEFORE COMMIT

Run these checks:

- [ ] All 7 file types created (or explicitly decided not needed)
- [ ] All 3 integration points updated
- [ ] All imports use `~/` alias
- [ ] All naming conventions followed
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Build succeeds: `npm run build`

**FAILURE TO FOLLOW THIS CHECKLIST WILL RESULT IN BROKEN IMPORTS AND TYPE ERRORS.**

---

## Import Organization

### Import Order (Recommended)

```typescript
// 1. React and React-related
import { useState, useCallback, useMemo } from "react";

// 2. Third-party libraries
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";

// 3. Redux hooks and actions
import { useAppDispatch, useAppSelector } from "~/redux/store/hooks";
import { someAction } from "~/redux/features/someSlice";

// 3.5 Enums
import { RolesEnum, PinStatusEnum } from "~/enums";

// 4. Components
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

// 5. Utilities
import { cn } from "~/lib/utils";
import { httpService } from "~/services/httpService";

// 6. Type imports (grouped)
import type { User } from "~/types/user";
import type { Post } from "~/types/post";

// 7. Relative imports (same feature)
import { MySubComponent } from "./MySubComponent";
```

**Use single quotes** for all imports (project standard)

---

## Summary

| Directory                 | Purpose                                                                  |
| ------------------------- | ------------------------------------------------------------------------ |
| `components/ui/`          | Shadcn/UI primitives (lowercase)                                         |
| `components/atoms/`       | Custom reusable atomic components (badges, spinners, small interactives) |
| `components/modals/`      | Modal/dialog overlay components                                          |
| `components/shared/`      | Feature-specific shared components (Navbar, Sidebar, Breadcrumb)         |
| `components/layouts/`     | Layout wrappers                                                          |
| `components/guards/`      | Route guards                                                             |
| `pages/`                  | Page components by route                                                 |
| `redux/features/`         | Redux slices                                                             |
| `redux/store/`            | Store configuration                                                      |
| `services/httpService.ts` | Axios orchestrator                                                       |
| `services/httpMethods/`   | HTTP method factories                                                    |
| `services/httpServices/`  | Domain-specific API services                                             |
| `redux/features/`         | Redux slices with extraReducers for thunks                               |
| `types/`                  | TypeScript types                                                         |
| `enums/`                  | Enum definitions (synced from backend + frontend-only)                   |
| `utils/`                  | Utility functions                                                        |
| `utils/validations/`      | Zod schemas                                                              |
| `routes/`                 | Route definitions                                                        |
| `hooks/`                  | Custom hooks                                                             |
| `lib/`                    | Utility libraries (`cn()`)                                               |
| `styles/`                 | CSS files                                                                |

---

## Related Resources

- [Component Patterns](component-patterns.md) - How to structure components
- [Data Fetching](data-fetching.md) - Service layer patterns
- [Routing Guide](routing-guide.md) - Route organization
