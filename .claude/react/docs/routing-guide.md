# Routing Guide

React Router 7 implementation with declarative routing and layout-based organization.

---

## React Router 7 Overview

The project uses **React Router 7** with:

- Declarative route configuration
- Layout-based route organization
- Server-side rendering (SSR) enabled
- Type-safe navigation

---

## Configuration Files

### Main Route Configuration

Location: `~/routes.ts`

```typescript
import { type RouteConfig, layout, index, route } from '@react-router/dev/routes';
import { authRoutes } from './routes/auth.routes';
import { protectedRoutes } from './routes/protected.routes';

export default [
  index('pages/redirect-home.tsx'),
  layout('pages/auth/layout.tsx', authRoutes),
  protectedRoutes,
  route('*', 'pages/not-found.tsx'),
] satisfies RouteConfig;
```

> **Note:** `protectedRoutes` is a single `RouteConfigEntry` (not spread), because it wraps all protected routes with a layout that includes auth + RBAC checks. Add additional route groups (e.g., public routes) as separate `layout()` entries as needed.

### React Router Configuration

Location: `frontend/react-router.config.ts`

```typescript
import type { Config } from '@react-router/dev/config';

export default {
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
} satisfies Config;
```

---

## Route Definitions

### Public Routes

Location: `~/routes/public.routes.ts`

```typescript
import { route, index } from '@react-router/dev/routes';

export const publicRoutes = [
  index('pages/home.tsx'),
  route('about', 'pages/public/about.tsx'),
];
```

### Auth Routes

Location: `~/routes/auth.routes.ts`

```typescript
import { route } from '@react-router/dev/routes';

export const authRoutes = [
  route('login', 'pages/auth/login.tsx'),
  route('forgot-password', 'pages/auth/forgot-password.tsx'),
];
```

### Protected Routes

Location: `~/routes/protected.routes.ts`

```typescript
import { type RouteConfigEntry, route, layout } from '@react-router/dev/routes';

export const protectedRoutes: RouteConfigEntry = layout('components/layouts/ProtectedLayout.tsx', [
  route('dashboard', 'pages/protected/dashboard.tsx'),
  route('users', 'pages/protected/users.tsx'),
  route('users/:id', 'pages/protected/user-detail.tsx'),
  route('items', 'pages/protected/items.tsx'),
  route('items/new', 'pages/protected/item-form.tsx', { id: 'item-create' }),
  route('items/:id', 'pages/protected/item-detail.tsx'),
  route('items/:id/edit', 'pages/protected/item-form.tsx', { id: 'item-edit' }),
  route('settings', 'pages/protected/settings.tsx'),
  route('profile', 'pages/protected/profile.tsx'),
  route('unauthorized', 'pages/unauthorized.tsx'),
  // Add routes from your PRD here
]);
```

> **Route IDs:** When multiple routes share the same component (e.g., create/edit forms), use the `{ id: 'unique-id' }` option to distinguish them. Access via `useMatches()` or route params.

---

## Route Helpers

### Available Functions

```typescript
import { type RouteConfig, type RouteConfigEntry, route, index, layout } from '@react-router/dev/routes';

// index - Home route for a path
index('pages/home.tsx')  // Renders at parent path

// route - Named route
route('about', 'pages/about.tsx')  // /about

// route - With unique ID (for shared components)
route('items/new', 'pages/protected/item-form.tsx', { id: 'item-create' })
route('items/:id/edit', 'pages/protected/item-form.tsx', { id: 'item-edit' })

// layout - Wraps child routes with a layout component
layout('pages/layout.tsx', childRoutes)
```

### Types

```typescript
// RouteConfig - Array of route entries (used for the default export)
export default [...] satisfies RouteConfig;

// RouteConfigEntry - Single route entry (used for grouped route objects)
export const protectedRoutes: RouteConfigEntry = layout('...', [...]);
```

### Route with Parameters

```typescript
// Dynamic route parameter
route('users/:id', 'pages/users/detail.tsx')  // /users/123

// Optional parameter
route('posts/:id?', 'pages/posts/index.tsx')  // /posts or /posts/123

// Catch-all
route('*', 'pages/not-found.tsx')  // Any unmatched route
```

---

## Layout Components

### Auth Layout (Guest-Only)

Location: `~/pages/auth/layout.tsx`

```typescript
import { GuestGuard } from '~/components/guards/GuestGuard';

export default function AuthLayout() {
  return <GuestGuard />;
}
```

> Auth layout delegates entirely to `GuestGuard`, which renders `<Outlet />` for unauthenticated users and redirects authenticated users to their home route.

### Protected Layout (Auth + RBAC)

Location: `~/components/layouts/ProtectedLayout.tsx`

```typescript
import { Outlet, Navigate, useLocation } from 'react-router';
import { useAuth } from '~/hooks/useAuth';
import { Sidebar } from '~/components/layout/Sidebar';
import Header from '~/components/layout/Header';
import { Loader2 } from 'lucide-react';

// RBAC route access map: define which roles can access which routes
// Populate from your PRD's role definitions
const routeAccess: Record<string, string[]> = {
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

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // RBAC check: verify user role has access to current route
  const currentPath = '/' + location.pathname.split('/').filter(Boolean)[0];
  const allowedRoles = routeAccess[currentPath];
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

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

> **Key pattern:** Auth check + RBAC check are **inline** in the layout component. No separate guard wrapper needed — the layout itself acts as the guard.

### Redirect Home Page

Location: `~/pages/redirect-home.tsx`

**SSR mode** (ssr: true):

```typescript
import { redirect } from 'react-router';
import type { Route } from './+types/redirect-home';

export function loader(_: Route.LoaderArgs) {
  return redirect('/login');
}

export default function RedirectHome() {
  return null;
}
```

> Uses React Router 7's `loader()` function for server-side redirect at the root path (`/`). Change the target to your project's default route.

**SPA mode** (ssr: false):

```typescript
import { Navigate } from 'react-router';
import { useAuth } from '~/hooks/useAuth';

export default function RedirectHome() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to role-specific home
  return <Navigate to={getHomeRouteForRole(user.role)} replace />;
}
```

> SPA mode does not support `loader()` exports. Use client-side `<Navigate>` instead.

---

## Navigation

### Link Component

```typescript
import { Link } from 'react-router';

// Basic link
<Link to="/about">About</Link>

// With classes
<Link to="/dashboard" className="text-primary hover:underline">
  Dashboard
</Link>

// External link (use anchor)
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  External
</a>
```

### Programmatic Navigation

```typescript
import { useNavigate } from 'react-router';

export default function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate to route
    navigate('/dashboard');

    // Navigate with replace (no history entry)
    navigate('/login', { replace: true });

    // Go back
    navigate(-1);
  };

  return <button onClick={handleClick}>Navigate</button>;
}
```

### Using Button with Link (asChild)

```typescript
import { Button } from '~/components/ui/button';
import { Link } from 'react-router';

<Button asChild>
  <Link to="/dashboard">Go to Dashboard</Link>
</Button>
```

---

## Route Parameters

### Accessing Parameters

```typescript
import { useParams } from 'react-router';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();

  return <div>User ID: {id}</div>;
}
```

### Search Parameters

```typescript
import { useSearchParams } from 'react-router';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const page = searchParams.get('page') || '1';

  const updateSearch = (newQuery: string) => {
    setSearchParams({ q: newQuery, page: '1' });
  };

  return (
    <input
      value={query}
      onChange={(e) => updateSearch(e.target.value)}
    />
  );
}
```

---

## Route Organization

### Adding a New Route to Protected Area

1. Add the route definition to `~/routes/protected.routes.ts`:

```typescript
// Add to the existing protectedRoutes layout array
route('reports', 'pages/protected/reports.tsx'),
route('reports/:id', 'pages/protected/report-detail.tsx'),
```

2. Create the page component:

```typescript
// ~/pages/protected/reports.tsx
export default function ReportsPage() {
  return <div>Reports</div>;
}
```

3. Add RBAC entry in `ProtectedLayout.tsx`:

```typescript
const routeAccess: Record<string, string[]> = {
  // ... existing routes
  '/reports': ['admin', 'manager'],
};
```

### Adding a New Route Group (e.g., Public Routes)

1. Create route definitions file:

```typescript
// ~/routes/public.routes.ts
import { route, index } from '@react-router/dev/routes';

export const publicRoutes = [
  index('pages/home.tsx'),
  route('about', 'pages/public/about.tsx'),
];
```

2. Add to main routes:

```typescript
// ~/routes.ts
import { publicRoutes } from './routes/public.routes';

export default [
  index('pages/redirect-home.tsx'),
  layout('pages/layout.tsx', publicRoutes),
  layout('pages/auth/layout.tsx', authRoutes),
  protectedRoutes,
] satisfies RouteConfig;
```

---

## Summary

**Routing Checklist:**

- ✅ Define routes in `routes/*.routes.ts` files
- ✅ Use `RouteConfigEntry` for protected route groups with `layout()` wrapper
- ✅ Use `route()` for named routes, `index()` for default routes
- ✅ Use route IDs (`{ id: 'name' }`) when sharing components across routes
- ✅ Use `redirect-home.tsx` with `loader()` (SSR) or `<Navigate>` (SPA) for root redirect
- ✅ Auth + RBAC checks inline in protected layout (not separate guard wrappers)
- ✅ `routeAccess` map for per-route role checking
- ✅ Auth layout delegates to `GuestGuard` for guest-only pages
- ✅ Use `Link` for navigation (not `<a>`)
- ✅ Use `useNavigate` for programmatic navigation
- ✅ Use `useParams` for route parameters
- ✅ Add route files to main `routes.ts`

**See Also:**

- [auth-guards.md](auth-guards.md) - Auth guard patterns
- [file-organization.md](file-organization.md) - Route file structure
- [common-patterns.md](common-patterns.md) - Auth patterns
- [complete-examples.md](complete-examples.md) - Full routing examples
