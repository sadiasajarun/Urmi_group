# Component Patterns

Modern component architecture using Shadcn/UI, Tailwind CSS, and TypeScript.

---

## Function Component Pattern (PREFERRED)

### Why Function Components

All components use function components with TypeScript for:

- Explicit type safety for props
- Consistent component signatures
- Clear prop interface documentation
- Better IDE autocomplete

### Basic Pattern

```typescript
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface MyComponentProps {
  /** User ID to display */
  userId: number;
  /** Optional callback when action occurs */
  onAction?: () => void;
}

export default function MyComponent({ userId, onAction }: MyComponentProps) {
  return (
    <div className="p-4">
      User: {userId}
      <Button onClick={onAction}>Action</Button>
    </div>
  );
}
```

**Key Points:**

- Props interface defined separately with JSDoc comments
- Destructure props in parameters
- Default export at bottom
- Use Tailwind classes for styling

---

## Shadcn/UI Component Usage

### Available Components

Shadcn/UI components are in `~/components/ui/`:

```typescript
// Buttons
import { Button, buttonVariants } from '~/components/ui/button';

// Forms
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';

// Cards
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
```

### Button Component

```typescript
import { Button } from '~/components/ui/button';

// Variants
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outlined</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// States
<Button disabled>Disabled</Button>
<Button className="w-full">Full Width</Button>
```

### Card Component

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

<Card className="w-full max-w-md">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

### Form Components (MANDATORY PATTERN — all forms must use this)

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

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
                <Input placeholder="Enter email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

---

## CVA (Class Variance Authority)

### What is CVA

CVA is used for component variants in Shadcn/UI. It creates type-safe variant props.

### Example from Button Component

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '~/lib/utils';

const buttonVariants = cva(
  // Base styles applied to all buttons
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
        outline: 'border bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3',
        lg: 'h-10 px-6',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// Usage in component
function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

---

## When to Add a Variant vs Use className (MANDATORY)

All reusable components must follow these rules:

1. **Every reusable component MUST accept a `className` prop** — this allows call-site-specific layout overrides
2. **Add a cva variant when:**
   - The style combination appears at 2+ call sites
   - It represents a semantic state (error, success, warning, loading, ghost, compact)
   - It changes the visual identity of the component (not just layout)
3. **Use `className` when:**
   - The override is context-specific and used at only 1 call site
   - It's a layout concern (width, height, padding offset, positioning)
   - It's a dynamic value passed from props (e.g., `className={style.text}`)

```typescript
// ✅ CORRECT — Semantic state as variant
<Input variant="error" />

// ✅ CORRECT — One-off layout as className
<Input className="pl-10" />

// ❌ WRONG — Duplicated error classes at call sites
<Input className="border-red-400 focus:ring-2 focus:ring-red-500/20" />

// ❌ WRONG — Creating a new component for a style difference
// Instead, add a variant to the existing component
```

---

## cn() Utility for Class Merging

### What is cn()

`cn()` combines `clsx` and `tailwind-merge` for conditional class merging:

```typescript
// ~/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Usage Examples

```typescript
import { cn } from '~/lib/utils';

// Conditional classes
<div className={cn(
  'p-4 bg-background',
  isActive && 'bg-primary text-primary-foreground',
  isDisabled && 'opacity-50 pointer-events-none'
)} />

// Merging with overrides
<Button className={cn(
  buttonVariants({ variant: 'default' }),
  'w-full' // Override width
)} />

// Array of conditions
<div className={cn([
  'base-class',
  condition1 && 'class-1',
  condition2 && 'class-2',
])} />
```

---

## asChild Pattern (Radix UI)

### What is asChild

The `asChild` prop allows composing components with custom elements:

```typescript
import { Button } from '~/components/ui/button';
import { Link } from 'react-router';

// Button as Link
<Button asChild>
  <Link to="/dashboard">Go to Dashboard</Link>
</Button>

// Button as anchor
<Button asChild variant="link">
  <a href="https://example.com">External Link</a>
</Button>
```

### How it Works

The Button uses Radix's `Slot` component:

```typescript
import { Slot } from '@radix-ui/react-slot';

function Button({ asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp {...props} />;
}
```

### IMPORTANT: asChild + Link Anti-Pattern

**NEVER use `asChild` with `Link` inside `DropdownMenuItem`:**

```typescript
// ❌ CAUSES VISUAL "BLINK" ON FIRST RENDER
<DropdownMenuItem asChild>
  <Link to={`/dashboard/users/${user.id}`}>
    <Eye className="mr-2 h-4 w-4" />
    View Details
  </Link>
</DropdownMenuItem>

// ✅ USE onClick with navigate() INSTEAD
<DropdownMenuItem onClick={() => navigate(`/dashboard/users/${user.id}`)}>
  <Eye className="mr-2 h-4 w-4" />
  View Details
</DropdownMenuItem>
```

**Better: Use the ActionMenu Component**

For table action menus, use the reusable `ActionMenu` component:

```typescript
import { ActionMenu } from '~/components/ui/action-menu';

<ActionMenu
  items={[
    {
      label: 'View Details',
      icon: <Eye className="mr-2 h-4 w-4" />,
      href: `/dashboard/users/${user.id}`,  // Uses navigate() internally
    },
    {
      label: 'Delete',
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      onClick: () => handleDelete(user.id),
      variant: 'destructive',
    },
  ]}
/>
```

---

## Component Structure Template

### Recommended Order

```typescript
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Link } from 'react-router';

// Redux
import { useAppDispatch, useAppSelector } from '~/redux/store/hooks';

// UI Components
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader } from '~/components/ui/card';

// Utilities
import { cn } from '~/lib/utils';

// Types
import type { User } from '~/types/user';

// 1. PROPS INTERFACE (with JSDoc)
interface MyComponentProps {
  /** The ID of the entity to display */
  entityId: number;
  /** Optional callback when action completes */
  onComplete?: () => void;
  /** Display mode */
  mode?: 'view' | 'edit';
}

// 2. COMPONENT DEFINITION
export default function MyComponent({
  entityId,
  onComplete,
  mode = 'view',
}: MyComponentProps) {
  // 3. HOOKS (in this order)
  // - Redux hooks
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.currentUser);
  const loading = useAppSelector((state) => state.user.loading);

  // - Local state
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(mode === 'edit');

  // - Memoized values
  const filteredData = useMemo(() => {
    return data.filter((item) => item.active);
  }, [data]);

  // - Effects
  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, []);

  // 4. EVENT HANDLERS (with useCallback for passed handlers)
  const handleItemSelect = useCallback((itemId: string) => {
    setSelectedItem(itemId);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      // Save logic
      onComplete?.();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  }, [onComplete]);

  // 5. RENDER
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h2 className="text-xl font-bold">My Component</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={cn('text-muted-foreground', loading && 'opacity-50')}>
          {user?.email}
        </p>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Loading...' : 'Save'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## Component Separation

### When to Split Components

**Split into multiple components when:**

- Component exceeds 200 lines
- Multiple distinct responsibilities
- Reusable sections
- Complex nested JSX

**Example:**

```typescript
// ❌ AVOID - Monolithic
function MassivePage() {
  // 500+ lines
  // Header logic
  // Form logic
  // Table logic
  // Modal logic
}

// ✅ PREFERRED - Modular
function Page() {
  return (
    <div className="space-y-6">
      <PageHeader />
      <SearchForm onSearch={handleSearch} />
      <DataTable data={filteredData} />
      <ActionModal open={isOpen} onClose={handleClose} />
    </div>
  );
}
```

### When to Keep Together

**Keep in same file when:**

- Component < 100 lines
- Tightly coupled logic
- Not reusable elsewhere
- Simple presentation component

---

## Lazy Loading Pattern

### When to Lazy Load

Lazy load components that are:

- Heavy (DataGrid, charts, rich text editors)
- Route-level components
- Modal/dialog content (not shown initially)
- Below-the-fold content

### How to Lazy Load

```typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy component
const HeavyEditor = lazy(() => import('./HeavyEditor'));

// Usage with Suspense
function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyEditor />
    </Suspense>
  );
}
```

---

## Component Communication

### Props Down, Events Up

```typescript
// Parent
function Parent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <Child
      data={data} // Props down
      onSelect={setSelectedId} // Events up
    />
  );
}

// Child
interface ChildProps {
  data: Data[];
  onSelect: (id: string) => void;
}

export default function Child({ data, onSelect }: ChildProps) {
  return (
    <ul>
      {data.map((item) => (
        <li key={item.id} onClick={() => onSelect(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```

### Using Redux for Shared State

```typescript
// When state needs to be shared across components
import { useAppDispatch, useAppSelector } from '~/redux/store/hooks';
import { selectItem } from '~/redux/features/itemSlice';

function Child() {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((state) => state.item.selectedId);

  const handleSelect = (id: string) => {
    dispatch(selectItem(id));
  };

  return <div onClick={() => handleSelect('123')}>Select</div>;
}
```

---

## Summary

**Modern Component Recipe:**

1. Function components with TypeScript props interface
2. Shadcn/UI components from `~/components/ui/`
3. `cn()` utility for conditional classes
4. Tailwind CSS for styling
5. `useAppSelector` and `useAppDispatch` for Redux
6. Event handlers with `useCallback` when passed to children
7. Default export at bottom

---

## MANDATORY: Async State Handling

Every component that fetches data MUST handle all three states:

```typescript
// MANDATORY: Loading state
if (isLoading) return <LoadingSkeleton />;

// MANDATORY: Error state
if (error) return <ErrorState message={error.message} onRetry={refetch} />;

// MANDATORY: Empty state (distinct from error)
if (!data?.length) return <EmptyState title="No items found" />;

// Happy path
return <DataList items={data} />;
```

**Rules:**
- Loading skeleton (not spinner) for initial data loads
- Error state with retry button for API failures
- Empty state for zero results (NOT the same component as error)
- Error boundaries wrapping route-level components for uncaught errors

## MANDATORY: No Business Logic in Components

Components must only handle rendering and event delegation:

```typescript
// BAD: Business logic in component
const filteredUsers = users.filter(u => u.role === 'admin' && u.isActive);
const sortedUsers = filteredUsers.sort((a, b) => a.name.localeCompare(b.name));

// GOOD: Logic in selector/utility
const activeAdmins = useAppSelector(selectActiveAdmins);
```

**See Also:**

- [styling-guide.md](styling-guide.md) - Tailwind CSS patterns
- [common-patterns.md](common-patterns.md) - Form patterns
- [complete-examples.md](complete-examples.md) - Full working examples
