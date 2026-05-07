# Common Patterns

Frequently used patterns for forms, authentication, Redux state, and other common UI elements.

---

## MANDATORY: React Hook Form + Zod + shadcn Form (ALL forms must use this)

> **Manual `useState` for form field values is FORBIDDEN. Always use `useForm` + `zodResolver` + shadcn `Form`/`FormField`/`FormItem`/`FormControl`/`FormMessage` components.**

### Form Schema with Zod

Location: `~/utils/validations/{feature}.ts`

```typescript
import * as z from 'zod';

// Define schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Infer TypeScript type from schema
export type LoginFormData = z.infer<typeof loginSchema>;

// Registration with confirmation
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
```

### Form Component Pattern

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { loginSchema, type LoginFormData } from '~/utils/validations/auth';

export default function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange', // Validate on change
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log('Form data:', data);
    // Handle submission
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
    </Form>
  );
}
```

---

## Redux Slice Pattern

### Creating a Slice

```typescript
// ~/redux/features/userSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchUsers, createUser } from '~/services/httpServices/userService';
import type { User, UserState } from '~/types/user';

const initialState: UserState = {
  users: [],
  currentUser: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Synchronous actions
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.currentUser = null;
      state.users = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Async thunk handling
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentUser, clearError, logout } = userSlice.actions;
export default userSlice.reducer;
```

### Adding to Root Reducer

```typescript
// ~/redux/store/rootReducer.ts
import { combineReducers } from '@reduxjs/toolkit';
import userReducer from '../features/userSlice';
import counterReducer from '../features/counterSlice';

const rootReducer = combineReducers({
  user: userReducer,
  counter: counterReducer,
});

export default rootReducer;
```

---

## Typed Redux Hooks

### Hook Definitions

Location: `~/redux/store/hooks.ts`

```typescript
import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Typed dispatch hook
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Typed selector hook
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Usage in Components

```typescript
import { useAppDispatch, useAppSelector } from '~/redux/store/hooks';
import { fetchUsers } from '~/services/httpServices/userService';
import { logout } from '~/redux/features/userSlice';

export default function UserPage() {
  const dispatch = useAppDispatch();

  // Selecting state
  const users = useAppSelector((state) => state.user.users);
  const loading = useAppSelector((state) => state.user.loading);
  const error = useAppSelector((state) => state.user.error);

  // Dispatching async thunk
  const handleFetch = () => {
    dispatch(fetchUsers());
  };

  // Dispatching sync action
  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    // ...
  );
}
```

---

## Authentication Pattern

For comprehensive authentication patterns including httpOnly cookies, route guards, and role-based access control, see the dedicated guides:

- **[authentication.md](./authentication.md)** — Complete auth patterns (Redux/Context, 401 interceptor)
- **[auth-guards.md](./auth-guards.md)** — Guard components, inline RBAC, decision matrix
- **[authentication-architecture.md](./authentication-architecture.md)** — Auth flow and architecture overview

### Quick Reference: useAuth Hook

```typescript
// Works with both Redux and Context implementations
const { user, isAuthenticated, authChecked, isLoading } = useAuth();

// Role-based conditional rendering
{user?.role === RoleEnum.ADMIN && <AdminSection />}
```

### Quick Reference: Cookie-Based Auth

```typescript
// Login — backend sets httpOnly cookie automatically
const handleLogin = async (credentials: LoginFormData) => {
  const response = await authService.login(credentials);
  if (response.success && response.data) {
    const authUser = mapToAuthUser(response.data.user);
    dispatch(loginSuccess(authUser));
    navigate(getHomeRouteForRole(authUser.role));
  }
};

// Logout — backend clears httpOnly cookie
const handleLogout = async () => {
  await authService.logout();
  dispatch(logout());
  navigate('/login');
};
```

### getHomeRouteForRole Utility

```typescript
// ~/lib/utils/auth.ts
export function getHomeRouteForRole(role: string): string {
  const routeMap: Record<string, string> = {
    admin: '/admin',
    user: '/dashboard',
    // Add your project's roles here
  };
  return routeMap[role] || '/';
}
```

### Protected Layout (Inline RBAC — Recommended)

```typescript
// ~/components/layouts/ProtectedLayout.tsx
const routeAccess: Record<string, string[]> = {
  '/dashboard': ['admin', 'user'],
  '/users': ['admin'],
  // Populate from your PRD
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

  return <div className="flex h-screen"><Sidebar /><Outlet /></div>;
}
```

> **Key pattern:** Auth + RBAC checks are **inline** in the layout. No separate guard wrapper needed.

### Role-Based Conditional Rendering

```typescript
const { user } = useAuth();

// Show admin-only navigation items
{user?.role === RoleEnum.ADMIN && (
  <NavLink to="/admin/users">User Management</NavLink>
)}

// Show different content by role
{user?.role === RoleEnum.ADMIN ? <AdminDashboard /> : <UserDashboard />}
```

---

## Server Actions with useActionState

### Server Action Definition

Location: `~/utils/actions/auth.ts`

```typescript
'use server';

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validate
  if (!email || !password) {
    return { error: JSON.stringify({ email: 'Email is required' }) };
  }

  try {
    // Call API
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return { error: 'Invalid credentials' };
    }

    return { message: 'Login successful' };
  } catch (error) {
    return { error: 'An error occurred' };
  }
}
```

### Using useActionState

```typescript
import { useEffect } from 'react';
import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { loginAction } from '~/utils/actions/auth';
import { loginSchema, type LoginFormData } from '~/utils/validations/auth';

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Handle server-side errors
  useEffect(() => {
    if (state?.error) {
      const errors = JSON.parse(state.error);
      Object.keys(errors).forEach((key) => {
        form.setError(key as keyof LoginFormData, {
          message: errors[key],
        });
      });
    }
  }, [state, form]);

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
        {/* Form fields */}

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state?.message && (
          <p className="text-sm text-green-600">{state.message}</p>
        )}

        <Button type="submit">Sign In</Button>
      </form>
    </Form>
  );
}
```

---

## Conditional Rendering Patterns

### Loading State

```typescript
const { loading, error, data } = useAppSelector((state) => state.feature);

if (loading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage error={error} />;
}

if (!data || data.length === 0) {
  return <EmptyState message="No items found" />;
}

return <DataList data={data} />;
```

### Auth-Based Rendering

```typescript
const { user, isAuthenticated } = useAuth();

return (
  <nav>
    {isAuthenticated ? (
      <>
        <span>Welcome, {user?.name}</span>
        <Button onClick={handleLogout}>Logout</Button>
      </>
    ) : (
      <Button asChild>
        <Link to="/login">Login</Link>
      </Button>
    )}
  </nav>
);
```

### Role-Based Rendering

```typescript
const { user } = useAuth();

return (
  <div>
    {/* Show admin-only sections */}
    {user?.role === RoleEnum.ADMIN && (
      <section>
        <h2>Admin Controls</h2>
        <Button onClick={handleDeleteAll}>Delete All</Button>
      </section>
    )}

    {/* Role-specific form fields */}
    {user?.role === RoleEnum.ADMIN && (
      <FormField name="status" control={form.control} render={({ field }) => (
        <FormItem>
          <FormLabel>Status</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            {/* admin-only status options */}
          </Select>
        </FormItem>
      )} />
    )}
  </div>
);
```

---

## Summary

**Common Patterns Checklist:**

- ✅ Use React Hook Form + Zod for form validation
- ✅ Define Zod schemas in `utils/validations/`
- ✅ Create Redux slices in `redux/features/`
- ✅ Use `useAppDispatch` and `useAppSelector` hooks
- ✅ Use httpOnly cookies for auth (or Context/Redux for auth state)
- ✅ Use inline RBAC in ProtectedLayout for route protection
- ✅ Use `useAuth()` hook for auth state access
- ✅ Handle loading, error, and empty states
- ✅ Use `ActionMenu` component for table action menus (avoid `asChild` + `Link` in dropdowns)

**See Also:**

- [data-fetching.md](data-fetching.md) - API service patterns
- [loading-and-error-states.md](loading-and-error-states.md) - Error handling
- [complete-examples.md](complete-examples.md) - Full working examples
