# Authentication Guards

## Overview

Route protection using 3 separate guard components and layout-level RBAC. Guards enforce authentication and role-based access control across route trees.

> **Important:** The specific auth method (httpOnly cookies, Bearer tokens, sessions) and role names come from your project's PRD. This guide covers the structural patterns only.

---

## Role Contract (CRITICAL)

Your auth system MUST be internally consistent about the type of `role` on the user object:

- **Either** role is always a `number` (recommended for numeric enums), OR
- role is always a `string` (recommended for string enums)

**Never mix.** The JWT payload, the `/auth/login` response, the `/users/me` response, and the frontend `AuthUser` type must all agree. If they don't, `allowedRoles.includes(user.role)` fails silently and guards become permissive — a low-privilege user ends up able to view admin pages because `"1" !== 1` (or vice versa).

Signs of role-type drift:
- UI login for one role redirects to `/` (generic home) instead of the role-specific home
- Chaos tests for role-gate protection fail intermittently
- Guards render a flash of admin content before redirecting

If you suspect drift in an existing project, the guards in this doc already normalize both sides via `String(...)` — but the better fix is at the backend JWT strategy. See `.claude/{$BACKEND}/guides/authentication-cookies.md` → "Role coercion".

---

## Guard Components

### 1. GuestGuard

Protects auth pages (login, signup) — redirects authenticated users to their home route.

Location: `~/components/guards/GuestGuard.tsx`

```typescript
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '~/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export function GuestGuard() {
  const { isAuthenticated, authChecked } = useAuth();

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
```

> GuestGuard renders `<Outlet />` (not `children`) because it is used as a **layout component** in the route config via `layout('pages/auth/layout.tsx', authRoutes)`.

### 2. AuthGuard

Protects private routes — redirects unauthenticated users to login. Use for one-off component-level checks when inline RBAC in the layout isn't sufficient.

Location: `~/components/guards/AuthGuard.tsx`

```typescript
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '~/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated, authChecked } = useAuth();

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
```

### 3. RoleGuard

Checks if user has one of the allowed roles — redirects to `/unauthorized` if not. Use for component-level role checks within a page.

Location: `~/components/guards/RoleGuard.tsx`

```typescript
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '~/hooks/useAuth';

interface RoleGuardProps {
  // Use a union of your project's Role enum values (numeric or string — be consistent)
  allowedRoles: Array<string | number>;
  children?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Normalize both sides to string so number-vs-string role contracts don't silently fail.
  // See "Role Contract" section above.
  const allowed = allowedRoles.map(String).includes(String(user.role));
  if (!allowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
```

---

## Guard Props Summary

| Guard | Props | Purpose |
|-------|-------|---------|
| `GuestGuard` | none (renders `<Outlet />`) | Auth pages only — redirects logged-in users |
| `AuthGuard` | `{ children?: ReactNode }` | Protected pages — redirects unauthenticated users |
| `RoleGuard` | `{ allowedRoles: string[], children?: ReactNode }` | Role-specific — redirects wrong role to `/unauthorized` |

---

## Layout-Level Protection Pattern (Recommended)

The recommended pattern is to **inline auth + RBAC checks directly in the layout component**, rather than wrapping layouts with guards. This gives the layout full control over loading states, redirects, and UI.

### Protected Layout with Inline RBAC

```typescript
// ~/components/layouts/ProtectedLayout.tsx
import { Outlet, Navigate, useLocation } from 'react-router';
import { useAuth } from '~/hooks/useAuth';
import { Sidebar } from '~/components/layout/Sidebar';
import Header from '~/components/layout/Header';
import { Loader2 } from 'lucide-react';

// RBAC route access map — populate from your PRD.
// Use your project's Role enum. Both sides are stringified at compare time to
// defend against number-vs-string drift between the JWT payload and the enum.
const routeAccess: Record<string, Array<string | number>> = {
  '/dashboard': ['admin', 'user'],
  '/users': ['admin'],
  '/items': ['admin', 'user'],
  '/settings': ['admin'],
  '/profile': ['admin', 'user'],
  // Add routes and allowed roles from your PRD
};

export default function ProtectedLayout() {
  const { isAuthenticated, authChecked, user } = useAuth();
  const location = useLocation();

  // 1. Loading state — prevent flash of wrong content
  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Auth check — redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. RBAC check — verify user role has access to current route.
  // Stringify both sides to avoid number-vs-string drift (see Role Contract).
  const currentPath = '/' + location.pathname.split('/').filter(Boolean)[0];
  const allowedRoles = routeAccess[currentPath];
  if (allowedRoles && !allowedRoles.map(String).includes(String(user.role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Render layout with protected content
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### Auth Layout (Guest-Only)

```typescript
// ~/pages/auth/layout.tsx
import { GuestGuard } from '~/components/guards/GuestGuard';

export default function AuthLayout() {
  return <GuestGuard />;
}
```

> The auth layout delegates entirely to `GuestGuard`, which handles loading, redirect, and renders `<Outlet />` for guest users.

---

## Guard Decision Matrix

| Route Type | Protection Method | `!authChecked` | `!isAuthenticated` | Wrong Role |
|------------|-------------------|----------------|--------------------|-----------|
| Public (/, /about) | None | N/A | N/A | N/A |
| Auth (/login, /signup) | `GuestGuard` in auth layout | Spinner | Allow | N/A |
| Protected (/dashboard/*) | Inline in `ProtectedLayout` | Spinner | → /login | → /unauthorized |

---

## Auth State Hook

Guards depend on a `useAuth()` hook that abstracts the auth state source (Redux or Context):

```typescript
// ~/hooks/useAuth.ts
import type { AuthState } from '~/types/auth';

// Implementation: connect to your auth store (Redux or Context)
export function useAuth(): AuthState {
  // Option A: Redux
  // const { user, isAuthenticated, authChecked } = useSelector((state: RootState) => state.auth);

  // Option B: Context
  // const { user, isAuthenticated, authChecked } = useContext(AuthContext);

  return { user, isAuthenticated, authChecked };
}
```

### Key State Flags

- **authChecked**: Set to `true` after initial auth check completes (success or failure). Prevents premature redirects.
- **isAuthenticated**: `true` when user is logged in
- **user**: Contains user object with `role` field for RBAC

---

## When to Use Standalone Guards vs Inline Layout

| Scenario | Approach |
|----------|----------|
| Entire route group needs auth + RBAC | **Inline in layout** (recommended) |
| Auth pages (login, signup) | **GuestGuard** as layout |
| One-off route needing extra role check | **RoleGuard** wrapping page content |
| Component-level permission check | **RoleGuard** wrapping specific UI section |

---

## Best Practices

### DO

- Use inline auth + RBAC checks in layout components (single responsibility)
- Show loading spinner during auth check (prevent flash of content)
- Use `replace: true` on `<Navigate>` to prevent back-button issues
- Check auth BEFORE checking role
- Use the `authChecked` flag to prevent premature redirects
- Define `routeAccess` map from your PRD's role definitions

### DON'T

- Guard every individual page component separately
- Skip loading state (causes flash of wrong content)
- Redirect without `replace` (creates broken history)
- Check role without checking authentication first
- Hardcode role names — derive from your project's PRD/enums

---

## Implementation Checklist

When implementing auth guards:

1. [ ] `useAuth()` hook created (connecting to Redux or Context)
2. [ ] `GuestGuard` component created (renders `<Outlet />`)
3. [ ] `AuthGuard` component created (for one-off use)
4. [ ] `RoleGuard` component created (for one-off use)
5. [ ] `ProtectedLayout` has inline auth + RBAC with `routeAccess` map
6. [ ] Auth layout uses `<GuestGuard />` as its content
7. [ ] `authChecked` flag set after initial auth check
8. [ ] Loading spinner shown during auth check
9. [ ] Redirects use `replace: true`
10. [ ] `/unauthorized` page exists for role mismatch

---

## Related Files

- [routing-guide.md](./routing-guide.md) — Route configuration patterns
- [authentication-architecture.md](./authentication-architecture.md) — Auth flow and state management
- [file-organization.md](./file-organization.md) — Directory structure
- `~/components/guards/GuestGuard.tsx` — Guest guard (renders Outlet)
- `~/components/guards/AuthGuard.tsx` — Auth guard
- `~/components/guards/RoleGuard.tsx` — Role guard
- `~/components/layouts/ProtectedLayout.tsx` — Protected layout with inline RBAC
- `~/hooks/useAuth.ts` — Auth state hook
