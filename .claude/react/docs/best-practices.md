# Frontend Best Practices

## React Component Best Practices

### Component File Organization

```typescript
// GOOD: Component with typed props, hooks at top
interface ButtonProps {
    variant?: 'primary' | 'outline';
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
}

export function Button({ variant = 'primary', children, onClick, disabled }: ButtonProps) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = () => {
        if (onClick) onClick();
    };

    return (
        <button
            className={cn(
                'px-4 py-2 rounded-md',
                variant === 'primary' && 'bg-blue-500 text-white',
                variant === 'outline' && 'border border-gray-300',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={handleClick}
            disabled={disabled || isLoading}
        >
            {children}
        </button>
    );
}

// BAD: Untyped props, inline styles, logic in JSX
export function Button(props) {
    return (
        <button style={{ padding: '10px' }} onClick={() => props.onClick && props.onClick()}>
            {props.children}
        </button>
    );
}
```

### Component Organization Pattern

```
components/
├── ui/          # Shadcn/UI primitives (lowercase)
├── atoms/       # Custom reusable atomic components (PascalCase)
├── modals/      # Modal/dialog overlays (PascalCase, Modal suffix)
├── shared/      # Feature-specific shared components (Navbar, Sidebar, Breadcrumb)
├── layouts/     # Layout wrappers
└── guards/      # Route guards
```

### Component Categorization Decision Tree

Before creating a component, answer:
1. Is it a Shadcn primitive? → `ui/` (lowercase file name)
2. Is it a modal or dialog overlay? → `modals/` (PascalCase, `Modal` suffix)
3. Is it small, reusable, and decoupled from any specific page or layout? → `atoms/`
4. Is it tightly coupled to a specific layout section (nav, sidebar, breadcrumb)? → `shared/`
5. Is it a page layout wrapper? → `layouts/`
6. Is it a route access gate? → `guards/`

### Inline Component Rule
Never define reusable sub-components as local named functions at the bottom of a page file.
- If it has its own props interface → extract to the correct folder
- If it uses `forwardRef` → extract to `atoms/` or `modals/`
- If it contains its own `useState` or `useEffect` → strong signal to extract

---

## State Management Patterns

### When to Use Each State Type

| State Type | Use Case | Example |
|------------|----------|---------|
| **Local State** (`useState`) | UI-only state, form inputs, mutation loading | Modal open/close, input values, submitting flag |
| **Redux** (READ thunks) | All server state + global app state | User list, projects, tasks, auth, app settings |
| **Redux** (sync reducers) | Auth state, optimistic updates | loginSuccess, logout, markOneRead |
| **URL State** | Shareable/bookmarkable state | Filters, pagination, search |

> **Do NOT use TanStack Query.** All data fetching uses Redux async thunks (`createAsyncThunk` in service files). Mutations use direct service calls with local `useState` for loading.

### Redux Toolkit Slice Pattern

```typescript
// GOOD: Typed slice with initial state
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, AuthUser } from '@/types/redux/auth';

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },
        loginSuccess: (state, action: PayloadAction<AuthUser>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.isLoading = false;
        },
        loginFailure: (state, action: PayloadAction<string>) => {
            state.isLoading = false;
            state.error = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
        },
    },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
```

### React Query Key Factory Pattern

```typescript
// GOOD: Centralized query key factory
export const authKeys = {
    all: ['auth'] as const,
    user: () => [...authKeys.all, 'user'] as const,
    session: () => [...authKeys.all, 'session'] as const,
};

export const userKeys = {
    all: ['users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
    details: () => [...userKeys.all, 'detail'] as const,
    detail: (id: string) => [...userKeys.details(), id] as const,
};

// Usage in hooks
export function useUser(id: string) {
    return useQuery({
        queryKey: userKeys.detail(id),
        queryFn: () => userService.getById(id),
    });
}
```

### React Query with Mutations

```typescript
// GOOD: Mutation with cache invalidation
export function useLogin() {
    const queryClient = useQueryClient();
    const dispatch = useAppDispatch();

    return useMutation({
        mutationFn: (data: LoginRequest) => authService.login(data),
        onSuccess: (response) => {
            dispatch(loginSuccess(response.data.user));
            queryClient.invalidateQueries({ queryKey: authKeys.all });
        },
        onError: (error) => {
            dispatch(loginFailure(error.message));
        },
    });
}
```

---

## Form Handling — MANDATORY: React Hook Form + Zod + shadcn Form

> **ALL forms MUST use this pattern. Manual `useState` for form fields is FORBIDDEN.**

### Zod Schema Definition

```typescript
// GOOD: Schema with custom error messages
import { z } from 'zod';

export const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Schema with cross-field validation
export const registerSchema = z
    .object({
        username: z.string().min(3, 'Username must be at least 3 characters'),
        email: z.string().email('Invalid email address').optional(),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });
```

### Form Component Pattern (MANDATORY)

```typescript
// GOOD: Form with React Hook Form + Zod + shadcn Form components
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '~/utils/validations/auth';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';

export function LoginForm() {
    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { username: '', password: '' },
    });

    const onSubmit = (data: LoginFormData) => { /* ... */ };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField control={form.control} name="username" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl><Input placeholder="Username" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" placeholder="Password" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit">Login</Button>
            </form>
        </Form>
    );
}
```

---

## Tailwind CSS + Shadcn/UI Patterns

### Class Composition with cn()

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Usage
<div className={cn(
    'flex items-center gap-2',
    isActive && 'bg-blue-100',
    disabled && 'opacity-50 cursor-not-allowed'
)} />
```

### Component Variants with cva

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
    {
        variants: {
            variant: {
                primary: 'bg-primary text-white hover:bg-primary/90',
                outline: 'border border-input bg-background hover:bg-accent',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
            },
            size: {
                sm: 'h-8 px-3 text-sm',
                md: 'h-10 px-4',
                lg: 'h-12 px-6 text-lg',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
    children: React.ReactNode;
}

export function Button({ variant, size, children }: ButtonProps) {
    return <button className={buttonVariants({ variant, size })}>{children}</button>;
}
```

> **Variant-First Rule (MANDATORY):** All reusable components MUST use cva variants for visual differences that appear across call sites. The `className` prop is for call-site-local overrides only (width, height, spacing, positioning). Never copy-paste a group of Tailwind classes across multiple call sites — extract it as a variant. Every reusable component MUST accept a `className` prop.

### Responsive Design

```typescript
// Mobile-first responsive pattern
<div className="
    grid grid-cols-1          /* Mobile: 1 column */
    sm:grid-cols-2            /* Tablet: 2 columns */
    lg:grid-cols-3            /* Desktop: 3 columns */
    gap-4
">
    {items.map(item => <Card key={item.id} {...item} />)}
</div>

// Hide/show based on screen size
<nav className="hidden md:flex">Desktop nav</nav>
<nav className="flex md:hidden">Mobile nav</nav>
```

---

## Socket.IO Frontend Patterns

### Frontend Socket Service Pattern

```typescript
// GOOD: Singleton service with typed events
class ChatSocketService {
    private socket: Socket | null = null;

    connect(): Socket {
        if (this.socket?.connected) return this.socket;

        this.socket = io('/chat', {
            withCredentials: true,  // Send cookies
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
        });

        return this.socket;
    }

    onNewMessage(callback: (event: NewMessageEvent) => void): void {
        this.socket?.on('message:new', callback);
    }

    offNewMessage(): void {
        this.socket?.off('message:new');
    }
}

export const chatSocketService = new ChatSocketService();
```

### React Hook Pattern for Socket Rooms

```typescript
// GOOD: Hook with proper cleanup and React Query integration
export function useChatRoomSocket({ roomId, enabled = true }) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!enabled || !chatSocketService.isConnected()) return;

        chatSocketService.joinRoom(roomId);

        const handleNewMessage = (event: NewMessageEvent) => {
            if (event.roomId !== roomId) return;

            // Update React Query cache directly for instant UI update
            queryClient.setQueryData<ChatMessage[]>(
                chatKeys.messages(roomId),
                (old = []) => [...old, event.message]
            );
        };

        chatSocketService.onNewMessage(handleNewMessage);

        return () => {
            chatSocketService.offNewMessage();
            chatSocketService.leaveRoom(roomId);
        };
    }, [roomId, enabled, queryClient]);
}
```

---

## Related Guides

For more detailed patterns, see:
- [Component Patterns](component-patterns.md) - Detailed component structure
- [Data Fetching](data-fetching.md) - API integration patterns
- [TanStack Query](tanstack-query.md) - Query patterns
- [TypeScript Standards](typescript-standards.md) - Type safety guidelines
- [Authentication Architecture](authentication-architecture.md) - Auth flow details

---

## Playwright E2E Testing

### Page Object Model Pattern

```typescript
// test/page-objects/login.page.ts
import { Locator, Page } from '@playwright/test';

export class LoginPage {
    readonly page: Page;
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly submitButton: Locator;
    readonly errorMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        this.usernameInput = page.getByTestId('username-input');
        this.passwordInput = page.getByTestId('password-input');
        this.submitButton = page.getByRole('button', { name: /login/i });
        this.errorMessage = page.getByRole('alert');
    }

    async goto() {
        await this.page.goto('/auth/login');
    }

    async login(username: string, password: string) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }

    async expectErrorMessage(message: string) {
        await expect(this.errorMessage).toContainText(message);
    }
}
```

### Custom Test Fixtures

```typescript
// test/fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../page-objects/login.page';

type AuthFixtures = {
    loginPage: LoginPage;
    login: (username: string, password: string) => Promise<void>;
};

export const test = base.extend<AuthFixtures>({
    loginPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await use(loginPage);
    },
    login: async ({ page }, use) => {
        const loginFn = async (username: string, password: string) => {
            const loginPage = new LoginPage(page);
            await loginPage.goto();
            await loginPage.login(username, password);
            await page.waitForURL('/dashboard');
        };
        await use(loginFn);
    },
});

export { expect } from '@playwright/test';
```

### Test Structure

```typescript
// test/tests/auth/login.spec.ts
import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Login Page', () => {
    test.beforeEach(async ({ loginPage }) => {
        await loginPage.goto();
    });

    test('should display login form', async ({ loginPage }) => {
        await expect(loginPage.usernameInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.submitButton).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ loginPage }) => {
        await loginPage.login('invalid', 'wrong');
        await loginPage.expectErrorMessage('Invalid credentials');
    });

    test('should redirect to dashboard on success', async ({ page, login }) => {
        await login('admin@example.com', 'Password123!');
        await expect(page).toHaveURL('/dashboard');
    });
});
```

---

## MANDATORY Rules (from Base Architecture)

### Utility Function Rules

- **Arrow function syntax only**: `export const fn = (...): ReturnType => { ... }` — NEVER `function` declarations
- **Location**: All utility functions MUST live in `app/utils/` organized by domain:
  - `utils/formatting.ts` — Date/time, number, string formatting
  - `utils/badges.ts` — CSS class mapping for badges, status indicators
  - `utils/avatar.ts` — Avatar color generation, initials extraction
  - `utils/pagination.ts` — Page number calculation, pagination helpers
  - `utils/csv.ts` — CSV export/download utilities
  - `utils/dates.ts` — Date arithmetic, trend calculations
- **Never inline**: Helper functions that are NOT React components or hooks MUST NOT be defined inside page/component files
- **Named exports only**: Use `export const`, never `export default` for utility functions
- **Deduplication**: If utility is needed in multiple files, extract to `utils/` — never copy-paste

### Service & Slice Pattern

- `createAsyncThunk` MUST NOT appear in slice files (`redux/features/*Slice.ts`)
- All thunks live in service files (`services/httpServices/*Service.ts`)
- Slice files only contain: thunk imports, initial state, sync reducers, `extraReducers`
- Consumer pages/components import thunks from service files, not slice files

### Type Organization

- ALL interfaces and types defined in `types/*.d.ts` — NONE inline in components, pages, hooks, or utils
- Component `*Props` interfaces in domain type file or `types/components.d.ts`
- Types imported with `import type` syntax
- No duplicate type names across files

### Code Quality Mandates

- **No `any` type** — use specific types or `unknown` with type guards
- **No `console.log`** in production code — use proper logger
- **No hardcoded mock data** arrays in production components
- **No placeholder data** (John Doe, lorem ipsum, test@example.com)
- **No commented-out code** — delete it, git has history
- **Components < 300 lines** (excluding imports/exports) — split if larger
- **Nesting depth < 5 levels** — extract sub-components if deeper
- **httpService wrapper required** — no raw axios/fetch calls in components or slices
- **No direct API calls** in components or Redux slices — always go through service layer

### Import Order

1. React / React Router
2. External libraries (Redux, Zod, etc.)
3. Internal aliases (`~/components`, `~/services`, etc.)
4. Relative imports
5. Type imports (with `import type`)
6. Styles