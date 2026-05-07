# Authentication Patterns

## Overview

Authentication implementation varies by project. **Always consult your project's PRD** (`/.claude-project/prd/`) to determine which auth strategy to use. This guide covers common structural patterns that apply regardless of the auth method chosen.

---

## Auth Strategy Comparison

| Strategy | How It Works | Pros | Cons | Best For |
|----------|-------------|------|------|----------|
| **httpOnly Cookies** | Backend sets cookies; browser sends automatically | XSS-safe, no JS token handling | CSRF risk (mitigated with sameSite), requires `withCredentials: true` | Server-rendered apps, same-origin APIs |
| **Bearer Tokens** | Token stored in memory/localStorage, sent in Authorization header | Simple, works cross-origin | XSS risk if in localStorage, must manually attach to requests | SPAs with separate API servers |
| **Session-Based** | Server stores session, client sends session ID cookie | Simple server-side, easy to revoke | Requires server state, scaling challenges | Traditional web apps |
| **OAuth/SSO** | Redirect to identity provider, receive tokens | Delegated auth, social login | Complex flow, dependency on provider | Enterprise, social login |

> **PRD-driven decision:** Your project's PRD specifies which strategy to use. Do not default to any one method — implement what the PRD requires.

---

## Core Auth State Pattern

Regardless of auth strategy, the frontend needs to track authentication state. Two common approaches:

### Option A: Redux Auth Slice

```typescript
// ~/redux/features/authSlice.ts
import type { AuthState } from '~/types/auth';

// AuthState is defined in ~/types/auth.d.ts:
// export interface AuthState {
//   user: AuthUser | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;       // Starts as TRUE — prevents flash of login page
//   authChecked: boolean;     // Starts as FALSE — true after initial auth check completes
//   error: string | null;
// }

// Actions
loginStart()              // Set loading state
loginSuccess(user)        // Set authenticated user, authChecked: true
loginFailure(error)       // Clear auth, set error, authChecked: true
logout()                  // Clear all auth state (keeps authChecked)
setAuthChecked()          // Mark auth check as complete
clearError()              // Clear error message
```

### Option B: Auth Context

```typescript
// ~/contexts/AuthContext.tsx
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authChecked: boolean;
  error: string | null;
  login: (loginId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Validate session on mount
    api.post('/auth/refresh')
      .then(() => { /* restore user */ })
      .catch(() => { /* clear state */ })
      .finally(() => setAuthChecked(true));
  }, []);

  return <AuthContext.Provider value={{
    user, isAuthenticated: !!user, authChecked, /* ... */
  }}>{children}</AuthContext.Provider>;
}

// Hook for consuming auth state
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

### AuthUser Type

```typescript
interface AuthUser {
  id: string;
  username?: string;
  loginId?: string;
  name?: string;
  role: string;        // Project-specific roles from PRD
  email?: string;
  phone?: string;
}
```

**Why `isLoading: true` initially?**
- Prevents flash of login page while checking auth
- Shows loading spinner until session validation completes

**Why `authChecked`?**
- Distinguishes between "loading" and "not yet checked"
- Guards wait for `authChecked: true` before making routing decisions
- Prevents premature redirects during initial auth check

---

## Auth Initializer Pattern

On app load, validate the existing session with the backend:

```typescript
// ~/hooks/providers/AuthProvider.tsx

function AuthInitializer({ children }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    authService.checkSession()
      .then((response) => {
        if (response?.success && response?.data?.id) {
          const authUser = mapToAuthUser(response.data);
          dispatch(loginSuccess(authUser));
        } else {
          dispatch(setInitialized());
        }
      })
      .catch(() => {
        dispatch(setInitialized());
      });
  }, [dispatch]);

  return <>{children}</>;
}
```

**Purpose:**
- Runs once on app load
- Validates existing session with backend (via cookie, token, or session ID)
- Restores Redux auth state if valid
- Marks auth as initialized (success or failure)

---

## Login Flow Pattern

```typescript
const handleLogin = async (data: LoginFormData) => {
  setIsLoading(true);
  setLoginError(null);

  try {
    const response = await authService.login({
      username: data.username,
      password: data.password,
    });

    if (response.success && response.data) {
      // Map backend user to AuthUser format
      const authUser = mapToAuthUser(response.data.user);

      // Update Redux state
      dispatch(loginSuccess(authUser));

      // Redirect based on user role
      navigate(getHomeRouteForRole(authUser.role));
    }
  } catch (error) {
    const errorResponse = handleAxiosError(error);
    setLoginError(errorResponse.message);
  } finally {
    setIsLoading(false);
  }
};
```

**Key Points:**
- Use `mapToAuthUser()` utility for consistent user mapping
- Use `getHomeRouteForRole()` for role-based routing
- Error handling with user-friendly messages
- Token/cookie handling depends on your auth strategy (see strategy table above)

---

## Logout Flow Pattern

```typescript
const handleLogout = async () => {
  try {
    await authService.logout();
    dispatch(logout());
    navigate('/login');
  } catch (error) {
    console.error('Logout failed:', error);
    // Still clear local state even if API fails
    dispatch(logout());
    navigate('/login');
  }
};
```

**Logout Flow:**
1. Call `authService.logout()` — backend clears session/token/cookie
2. Dispatch `logout()` action — clear Redux state
3. Navigate to `/login`

---

## Route Protection Patterns

### Pattern 1: Auth Layout (GuestGuard — renders Outlet)

```typescript
// ~/pages/auth/layout.tsx
import { GuestGuard } from '~/components/guards/GuestGuard';

export default function AuthLayout() {
  return <GuestGuard />;
}
```

> Auth layout delegates entirely to `GuestGuard`, which handles loading, redirect, and renders `<Outlet />` for guest users.

**GuestGuard Implementation:**
```typescript
// ~/components/guards/GuestGuard.tsx
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '~/hooks/useAuth';

export function GuestGuard() {
  const { isAuthenticated, authChecked } = useAuth();
  if (!authChecked) return <LoadingSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
```

**Protection Logic:**
1. Not checked — show loading spinner
2. Authenticated — redirect to their home route
3. Not authenticated — render login/register pages via `<Outlet />`

### Pattern 2: Protected Layout (Inline RBAC — Recommended)

```typescript
// ~/components/layouts/ProtectedLayout.tsx
import { Outlet, Navigate, useLocation } from 'react-router';
import { useAuth } from '~/hooks/useAuth';

// RBAC route access map — populate from your PRD
const routeAccess: Record<string, string[]> = {
  '/dashboard': ['admin', 'user'],
  '/users': ['admin'],
  '/items': ['admin', 'user'],
  '/settings': ['admin'],
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

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto"><Outlet /></main>
    </div>
  );
}
```

> **Key pattern:** Auth check + RBAC check are **inline** in the layout component. No separate guard wrapper needed — the layout itself acts as the guard.

**Protection Logic:**
1. Not checked — show loading spinner
2. Not authenticated — redirect to /login
3. Wrong role — redirect to /unauthorized
4. Correct role — render protected content

---

## 401 Error Handling

### Axios Interceptor with Token Refresh (Recommended)

```typescript
// ~/services/api/axios.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,  // Required for httpOnly cookies
});

// 401 interceptor with single-retry refresh
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
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
```

### Simple 401 Handler (Fallback)

```typescript
// ~/utils/errorHandler.ts
export const handleUnauthorized = (): void => {
  const currentPath = window.location.pathname;
  const authPaths = ['/', '/login', '/signup', '/register', '/forgot-password'];

  if (!authPaths.some(path => currentPath === path || currentPath.startsWith('/signup/'))) {
    window.location.href = '/login';
  }
};
```

---

## Auth Utility Functions

```typescript
// ~/lib/utils/auth.ts

// Map backend user to AuthUser format
export function mapToAuthUser(backendUser: BackendUser): AuthUser {
  return {
    id: String(backendUser.id),
    username: backendUser.username,
    name: backendUser.fullName || backendUser.name,
    role: normalizeRole(backendUser.role),
    email: backendUser.email,
    phone: backendUser.phone,
  };
}

// Get home route for a given role
export function getHomeRouteForRole(role: string): string {
  // Define role-to-route mapping based on your project's PRD
  const routeMap: Record<string, string> = {
    admin: '/admin',
    user: '/dashboard',
    // Add your project's roles here
  };
  return routeMap[role] || '/';
}

// Check if user has a specific role
export function hasRole(userRole: string | number | undefined, targetRole: string): boolean {
  if (!userRole) return false;
  return String(userRole).toLowerCase() === targetRole.toLowerCase();
}
```

---

## Loading Spinner Component

```typescript
import { LoadingSpinner } from '~/components/ui/loading-spinner';

// Full-screen loading for route protection
<LoadingSpinner fullScreen text="Loading..." />

// Inline loading
<LoadingSpinner size="md" text="Processing..." />

// Sizes: 'sm' | 'md' | 'lg'
```

---

## TypeScript Types

### AuthUser

```typescript
export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: string;         // Role values come from your project's PRD
  email?: string;
  phone?: string;
}
```

### AuthState

```typescript
// Defined in ~/types/auth.d.ts — import where needed
import type { AuthState } from '~/types/auth';

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}
```

### API Response Types

```typescript
// Generic — adapt to your project's API response format
interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string | number;
      fullName: string;
      email: string;
      role: string | number;
    };
    // Additional fields depend on auth strategy:
    // token?: string;        // Bearer token strategy
    // refreshToken?: string; // If using refresh tokens
    // (httpOnly cookies are set by backend, not in response body)
  };
}
```

---

## Best Practices

### DO

1. **Consult your PRD** for which auth strategy to implement
2. **Check auth in layouts** — protect entire route groups
3. **Show loading states** — prevent flashes and improve UX
4. **Handle role mismatches** — redirect to correct dashboard
5. **Use auth utility functions** — consistent user mapping and role checks
6. **Validate session on load** — restore auth state automatically
7. **Clear state on logout** — prevent stale state

### DON'T

1. **DON'T assume an auth method** — let the PRD decide
2. **DON'T check auth per-page** — use layout-level guards
3. **DON'T forget loading states** — causes bad UX
4. **DON'T skip role validation** — security risk
5. **DON'T redirect in loops** — check current path first
6. **DON'T use `any` types** — use AuthUser, AuthState types
7. **DON'T hardcode role names in the guard** — use `requiredRole` prop with project-specific values

---

## Testing Checklist

After implementing authentication:

- [ ] Logged-in users cannot access `/login`, `/register`, etc.
- [ ] Non-logged-in users cannot access protected routes
- [ ] Users are redirected to their correct home route after login
- [ ] Page refresh maintains auth state
- [ ] Logout clears session and redirects to login
- [ ] Loading spinner shows during auth check
- [ ] 401 errors trigger redirect to login
- [ ] Role mismatches redirect to correct dashboard
- [ ] Auth check runs only once on app load

---

## Common Issues & Solutions

### Issue: Flash of login page on protected routes
**Solution**: Start with `isLoading: true` in authSlice initial state.

### Issue: Infinite redirect loops
**Solution**: Check current path before redirecting in `handleUnauthorized()`.

### Issue: Auth state not persisting on refresh
**Solution**: Ensure session validation runs on app load (AuthInitializer pattern).

### Issue: User sees protected content before redirect
**Solution**: Use loading spinner in layouts while checking auth.

### Issue: Role check failing
**Solution**: Backend may return role as string or number — handle both in `hasRole()`.

---

## Role-Based Conditional Rendering

```typescript
// Show/hide UI based on user role
const { user } = useAuth();

return (
  <nav>
    {user?.role === RoleEnum.ADMIN && (
      <NavLink to="/admin/users">User Management</NavLink>
    )}
    <NavLink to="/profile">Profile</NavLink>
  </nav>
);
```

---

## Related Files

| File | Purpose |
|------|---------|
| `~/redux/features/authSlice.ts` | Redux auth state (Option A) |
| `~/contexts/AuthContext.tsx` | Auth context + useAuth hook (Option B) |
| `~/components/layouts/ProtectedLayout.tsx` | Inline RBAC layout |
| `~/components/guards/GuestGuard.tsx` | Guest guard (renders Outlet) |
| `~/lib/utils/auth.ts` | Auth utility functions |
| `~/services/api/axios.ts` | Axios instance with 401 interceptor |
| `~/utils/errorHandler.ts` | 401 handling |
| [auth-guards.md](./auth-guards.md) | Guard components and decision matrix |
| [routing-guide.md](./routing-guide.md) | Route configuration patterns |

---

---

## MANDATORY: Token Storage Rules

- **Access tokens**: Store in memory (React state/context) — NEVER localStorage/sessionStorage
- **Refresh tokens**: httpOnly cookies ONLY (set by backend, not accessible to JS)
- **`withCredentials: true`**: MANDATORY on all axios instances for cookie-based auth
- **CSRF protection**: Use `SameSite=Strict` cookies (configured by backend)

```typescript
// MANDATORY: axios instance config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // REQUIRED for httpOnly cookie auth
});
```

### 401 Handling

- On 401 response: attempt token refresh ONCE via refresh endpoint
- On refresh failure: clear auth state immediately, redirect to login
- Use `_isRetry` flag to prevent infinite refresh loops

```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._isRetry) {
      error.config._isRetry = true;
      try {
        await api.post('/auth/refresh');
        return api(error.config);
      } catch {
        store.dispatch(logout());
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

## Further Reading

- [HTTP Service Architecture](./data-fetching.md#http-service-architecture)
- [Redux Patterns](./common-patterns.md#redux-slice-patterns)
- [Routing Guide](./routing-guide.md)
