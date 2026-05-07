# Authentication Architecture

## Overview

Common authentication architecture patterns for frontend applications. The specific auth strategy (cookies, tokens, sessions) should be determined by your project's PRD.

---

## Security Model

### Auth Strategy Comparison

| Storage Method | XSS Vulnerable | CSRF Vulnerable | Notes |
|----------------|----------------|-----------------|-------|
| localStorage | YES | No | Simple but risky — tokens accessible to JS |
| sessionStorage | YES | No | Cleared on tab close, still XSS-vulnerable |
| httpOnly Cookie | No | Possible (mitigated) | Secure — JS cannot access tokens |
| In-memory (variable) | No | No | Lost on refresh — must combine with refresh strategy |

### Common Cookie Configuration (when using httpOnly cookies)

```
httpOnly: true      # JavaScript cannot access
secure: true        # HTTPS only (production)
sameSite: 'strict'  # Or 'lax'/'none' depending on cross-origin needs
```

---

## Authentication Flow

### React Router 7 Framework Mode Flow

```
root.tsx (App shell)
    |
AuthProvider wraps entire app
    |
On mount: AuthInitializer validates session (cookie/token)
    |
Sets authChecked: true (success or failure)
    |
Route renders:
    ├── Auth pages → GuestGuard (renders <Outlet />) → redirects if authenticated
    └── Protected pages → ProtectedLayout (inline RBAC) → checks auth + role
```

### Login Flow

```
User submits credentials
    |
POST /auth/login (credentials)
    |
Backend validates → sets httpOnly cookie (or returns token)
    |
Frontend receives user data
    |
Update auth state: setUser(user) / dispatch(loginSuccess(user))
    |
Navigate to getHomeRouteForRole(user.role)
```

### App Load / Refresh Flow

```
App loads → AuthInitializer / AuthProvider runs
    |
Validate session: POST /auth/refresh (or GET /auth/profile)
    |
├── Valid → restore user state, set authChecked: true
└── Invalid → clear local state, set authChecked: true
    |
ProtectedLayout makes routing decisions (inline auth + RBAC check)
```

---

## Role-Based Access Control

### Pattern

| Role | Dashboard Route | Description |
|------|----------------|-------------|
| ADMIN | /admin | Administrative access |
| USER | /dashboard | Standard user access |
| *Your roles* | *Your routes* | *Defined in your PRD* |

### Route Protection

| Route Pattern | Guard | Behavior |
|---------------|-------|----------|
| `/`, `/login`, `/signup` | `guestOnly` | Redirect logged-in users to home |
| `/admin/*` | `requiredRole="admin"` | Require admin role |
| `/dashboard/*` | `requiredRole="user"` | Require user role |

> **Note:** Replace role names and routes with your project's actual roles from the PRD.

---

## Key Components

### 1. ProtectedLayout (Inline RBAC — Recommended)

Auth + RBAC checks are inline in the layout component. The layout itself acts as the guard:

```typescript
// ~/components/layouts/ProtectedLayout.tsx
const routeAccess: Record<string, string[]> = {
  '/dashboard': ['admin', 'user'],
  '/users': ['admin'],
  '/settings': ['admin'],
  // Populate from your PRD's role definitions
};

export default function ProtectedLayout() {
  const { isAuthenticated, authChecked, user } = useAuth();
  const location = useLocation();

  if (!authChecked) return <LoadingSpinner />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const currentPath = '/' + location.pathname.split('/').filter(Boolean)[0];
  const allowedRoles = routeAccess[currentPath];
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <div><Sidebar /><Outlet /></div>;
}
```

### 2. GuestGuard (Auth Pages)

Renders `<Outlet />` for unauthenticated users, redirects authenticated users:

```typescript
export function GuestGuard() {
  const { isAuthenticated, authChecked } = useAuth();
  if (!authChecked) return <LoadingSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
```

### 3. Auth State (Redux or Context)

```typescript
// AuthState is defined in ~/types/auth.d.ts and imported wherever needed:
// - Redux authSlice: import type { AuthState } from '~/types/auth';
// - AuthContext: import type { AuthState } from '~/types/auth';

// ~/types/auth.d.ts
export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authChecked: boolean;   // true after initial auth check completes
  error: string | null;
}
```

### 4. AuthInitializer / AuthProvider

Runs on app load to validate session with backend:

```typescript
// Context pattern — AuthProvider wraps app in root.tsx
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    api.post('/auth/refresh')
      .then(() => { /* restore user from storage/response */ })
      .catch(() => { /* clear state */ })
      .finally(() => setAuthChecked(true));
  }, []);

  return <AuthContext.Provider value={{ user, isAuthenticated: !!user, authChecked }}>
    {children}
  </AuthContext.Provider>;
}
```

### 5. Auth Utilities

```typescript
mapToAuthUser(backendUser)       // Map API user to AuthUser
getHomeRouteForRole(role)        // Get home route for role
hasRole(userRole, targetRole)    // Check if user has a specific role
```

### 6. Token Refresh with Axios Interceptor

```typescript
// 401 interceptor with refresh queue (prevents parallel refresh calls)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch {
        // Refresh failed — force logout
        localStorage.removeItem('hasSession');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
```

---

## Troubleshooting

### Flash of login page on protected routes
**Cause**: `isInitialized` not checked before routing
**Solution**: Ensure AuthGuard waits for `isInitialized: true`

### Infinite redirect loops
**Cause**: Redirect happening on every render
**Solution**: Check current path before redirecting

### Auth state not persisting
**Cause**: Session not being validated on app load
**Solution**: Ensure AuthInitializer runs and validates session with backend

### Role check failing
**Cause**: Backend returns role in unexpected format (string vs number)
**Solution**: Use a `hasRole()` utility that normalizes and compares

---

## Implementation Guides

For detailed implementation patterns, see:

- [Authentication Patterns](authentication.md) — Login/logout flows, auth state, 401 handling
- [Auth Guards](auth-guards.md) — Guard components, inline RBAC, guard decision matrix
- [Routing Guide](routing-guide.md) — Route configuration, layouts, navigation
- [Common Patterns](common-patterns.md) — Role-based rendering, useAuth hook
