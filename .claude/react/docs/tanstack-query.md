# TanStack Query (React Query) Guide

> **DEPRECATED — DO NOT USE.** This project uses Redux async thunks for all data fetching. See `data-fetching.md` for the current pattern. TanStack Query (`@tanstack/react-query`) is NOT installed.
> - **READ operations**: `createAsyncThunk` in service files → `extraReducers` in Redux slices
> - **MUTATION operations**: Direct service calls with local `useState` for loading
> - **Components**: `useAppDispatch` + `useAppSelector` from `~/redux/store/hooks`

---

~~## Overview~~

~~TanStack Query manages **server state** (API data) separately from **client state** (Redux). It provides automatic caching, background refetching, request deduplication, and optimistic updates.~~

## Usage Restriction

> **IMPORTANT:** TanStack Query is only used for **public pages** (landing pages, public content).
> Dashboard and authentication pages use direct service calls with useState/useEffect pattern.

### When to Use TanStack Query
- Public landing pages
- Public content pages (blog, FAQ, etc.)
- Public product/menu listings

### When NOT to Use TanStack Query
- Dashboard pages (use direct service calls)
- Authentication pages (use Redux for auth state)
- Admin/protected pages (use direct service calls)

## Architecture

### Three-Layer Data Fetching

```
Component
    |
TanStack Query Hook (useProducts, useOrders, etc.)
    |
Domain Service (productService, orderService, etc.)
    |
httpService (Axios instance)
    |
API Server
```

**Layer Responsibilities:**
- **TanStack Query Hooks**: Server state management, caching, invalidation
- **Domain Services**: API endpoint definitions, request/response handling
- **httpService**: HTTP client, interceptors, error handling

## Configuration

### QueryClient Setup

**File:** `~/lib/queryClient.ts`

```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // Data fresh for 1 minute
      gcTime: 5 * 60 * 1000,       // Cache cleanup after 5 minutes
      retry: 2,                    // Retry failed requests twice
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  },
})
```

**Configuration Options:**
- `staleTime`: How long data is considered fresh (1 minute)
- `gcTime`: When to garbage collect inactive queries (5 minutes)
- `retry`: Number of automatic retries on failure (2 times)
- `refetchOnWindowFocus`: Disabled to prevent unnecessary requests

### Provider Setup

**File:** `~/hooks/providers/providers.tsx`

```typescript
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '~/lib/queryClient';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>{children}</Provider>
      </I18nextProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## Query Key Factory Pattern

Query keys use a **hierarchical factory pattern** for consistency and easy invalidation.

### Pattern Structure

```typescript
export const resourceKeys = {
  all: ['resource'] as const,
  lists: () => [...resourceKeys.all, 'list'] as const,
  list: (filters: string) => [...resourceKeys.lists(), filters] as const,
  details: () => [...resourceKeys.all, 'detail'] as const,
  detail: (id: number) => [...resourceKeys.details(), id] as const,
}
```

### Example: Product Query Keys

**File:** `~/services/httpServices/queries/useProducts.ts`

```typescript
export const productKeys = {
  all: ['products'] as const,
  featured: () => [...productKeys.all, 'featured'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  detail: (id: number) => [...productKeys.all, 'detail', id] as const,
};
```

**Benefits:**
- **Consistency**: All product queries start with `['products']`
- **Granular invalidation**: Can invalidate all products or just specific ones
- **Type safety**: `as const` ensures exact key matching

## Creating Query Hooks

### Basic Query Hook

```typescript
export function useFeaturedProducts() {
  return useQuery({
    queryKey: productKeys.featured(),
    queryFn: async () => {
      const response = await productService.getFeatured();
      return response.data || [];
    },
  });
}
```

### Query Hook with Parameters

```typescript
export function useProductDetail(id: number) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const response = await productService.getById(id);
      return response.data;
    },
    enabled: Boolean(id),  // Only fetch when id is provided
  });
}
```

### Query Hook with Date Range

```typescript
export function useOrderHistory(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [...orderKeys.history(), startDate, endDate],
    queryFn: async () => {
      const response = await orderService.getHistory(startDate, endDate);
      return response.data || [];
    },
  });
}
```

## Creating Mutation Hooks

Mutations modify server data. Always invalidate relevant queries after successful mutations.

### Create Mutation

```typescript
export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ItemCreateRequest) => {
      const response = await itemService.create(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all item queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}
```

### Update Mutation

```typescript
export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ItemUpdateRequest }) => {
      const response = await itemService.update(id.toString(), data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all item lists
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
      // Invalidate specific item detail
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(variables.id) });
    },
  });
}
```

### Delete Mutation

```typescript
export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await itemService.delete(id.toString());
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}
```

## Using Queries in Components

### Basic Usage

```typescript
import { useFeaturedProducts } from "~/services/httpServices"

export function FeaturedProducts() {
  const { data, isLoading, error } = useFeaturedProducts();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <h2>Featured Products</h2>
      <p>Showing {data.length} items</p>
    </div>
  );
}
```

### Multiple Queries

```typescript
import {
  useUserStats,
  useRecentActivity,
  useUpcomingEvents
} from "~/services/httpServices"

export function UserDashboard() {
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();
  const { data: events, isLoading: eventsLoading } = useUpcomingEvents();

  const isLoading = statsLoading || activityLoading || eventsLoading;

  if (isLoading) return <LoadingOverlay />;

  return (
    <>
      <StatsCard stats={stats} />
      <ActivityCard activity={activity} />
      <EventsCard events={events} />
    </>
  );
}
```

### Conditional Queries

```typescript
export function ProductDetailPage() {
  const { id } = useParams();

  // Only fetch when id is available
  const { data, isLoading } = useProductDetail(Number(id) || 0);

  if (!id) return <p>Please select a product</p>;
  if (isLoading) return <LoadingSkeleton />;

  return <ProductDetail data={data} />;
}
```

## Using Mutations in Components

### Create Example

```typescript
import { useCreateItem } from "~/services/httpServices"

export function CreateItemForm() {
  const createItem = useCreateItem();

  const handleSubmit = async (formData: ItemCreateRequest) => {
    try {
      await createItem.mutateAsync(formData);
      toast.success('Item created!');
    } catch (error) {
      toast.error('Failed to create item');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button
        type="submit"
        disabled={createItem.isPending}
      >
        {createItem.isPending ? 'Creating...' : 'Create Item'}
      </button>
    </form>
  );
}
```

### Update Example

```typescript
import { useUpdateItem } from "~/services/httpServices"

export function EditItemForm({ itemId }: { itemId: number }) {
  const updateItem = useUpdateItem();

  const handleUpdate = async (data: ItemUpdateRequest) => {
    try {
      await updateItem.mutateAsync({ id: itemId, data });
      toast.success('Item updated!');
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  return (
    <form onSubmit={handleUpdate}>
      {/* form fields */}
      <button disabled={updateItem.isPending}>
        Update
      </button>
    </form>
  );
}
```

## File Organization

### Query Hooks Directory

All TanStack Query hooks live in `~/services/httpServices/queries/`:

```
~/services/httpServices/
├── queries/
│   ├── index.ts              # Barrel export
│   ├── useProducts.ts        # Product queries
│   ├── useOrders.ts          # Order queries & mutations
│   └── useCategories.ts      # Category queries
├── productService.ts         # Axios service
├── orderService.ts           # Axios service
└── categoryService.ts        # Axios service
```

### Creating New Query Hook File

**Template:** `~/services/httpServices/queries/useWidgets.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { widgetService } from '../widgetService';
import type { Widget, WidgetCreateRequest } from '~/types';

// 1. Define query keys
export const widgetKeys = {
  all: ['widgets'] as const,
  lists: () => [...widgetKeys.all, 'list'] as const,
  details: () => [...widgetKeys.all, 'detail'] as const,
  detail: (id: number) => [...widgetKeys.details(), id] as const,
};

// 2. Query hooks
export function useWidgets() {
  return useQuery({
    queryKey: widgetKeys.lists(),
    queryFn: async () => {
      const response = await widgetService.getAll();
      return response.data;
    },
  });
}

export function useWidget(id: number) {
  return useQuery({
    queryKey: widgetKeys.detail(id),
    queryFn: async () => {
      const response = await widgetService.getById(id);
      return response.data;
    },
    enabled: Boolean(id),
  });
}

// 3. Mutation hooks
export function useCreateWidget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: WidgetCreateRequest) => {
      const response = await widgetService.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: widgetKeys.all });
    },
  });
}

export function useUpdateWidget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Widget> }) => {
      const response = await widgetService.update(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: widgetKeys.all });
      queryClient.invalidateQueries({ queryKey: widgetKeys.detail(variables.id) });
    },
  });
}
```

**Don't forget to export from** `~/services/httpServices/queries/index.ts`:

```typescript
export * from './useWidgets';
```

## Best Practices

### 1. Always Use Query Key Factory

**Bad:**
```typescript
useQuery({
  queryKey: ['products', 'featured'],  // Inconsistent, hard to invalidate
  queryFn: fetchProducts,
})
```

**Good:**
```typescript
useQuery({
  queryKey: productKeys.featured(),  // Consistent, easy to invalidate
  queryFn: fetchProducts,
})
```

### 2. Invalidate Queries After Mutations

**Bad:**
```typescript
useMutation({
  mutationFn: createItem,
  // No invalidation — UI shows stale data!
})
```

**Good:**
```typescript
useMutation({
  mutationFn: createItem,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: itemKeys.all });
  },
})
```

### 3. Use Conditional Queries

**Bad:**
```typescript
// Fetches even when id is undefined!
const { data } = useQuery({
  queryKey: ['user', id],
  queryFn: () => fetchUser(id),
})
```

**Good:**
```typescript
const { data } = useQuery({
  queryKey: ['user', id],
  queryFn: () => fetchUser(id),
  enabled: Boolean(id),  // Only fetch when id exists
})
```

### 4. Handle Loading and Error States

**Bad:**
```typescript
const { data } = useQuery({ /* ... */ });
return <div>{data.name}</div>;  // Crashes when loading or error!
```

**Good:**
```typescript
const { data, isLoading, error } = useQuery({ /* ... */ });

if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorMessage error={error} />;

return <div>{data.name}</div>;
```

### 5. Wrap Services, Don't Duplicate Logic

**Bad:**
```typescript
// Duplicating axios logic in query hook
export function useProducts() {
  return useQuery({
    queryKey: productKeys.all,
    queryFn: async () => {
      const response = await axios.get('/api/products');  // Don't do this!
      return response.data;
    },
  });
}
```

**Good:**
```typescript
// Wrapping existing service
export function useProducts() {
  return useQuery({
    queryKey: productKeys.all,
    queryFn: async () => {
      const response = await productService.getAll();  // Use service layer
      return response.data;
    },
  });
}
```

## When to Use TanStack Query vs Redux

### Use TanStack Query For:
- API data fetching (server state)
- Data that needs caching
- Data that needs background refetching
- Paginated or infinite scroll data
- Data shared across multiple components

### Use Redux For:
- Global UI state (modals, sidebars, theme)
- User preferences and settings
- Authentication state (current user, tokens)
- Form state across multiple steps
- Client-side computed state

### Example Architecture:

```typescript
// TanStack Query: Fetch items from API
const { data: items } = useItems();

// Redux: Track which item is selected
const selectedItemId = useAppSelector(state => state.ui.selectedItemId);
const dispatch = useAppDispatch();

// Find selected item from TanStack Query data
const selectedItem = items?.find(item => item.id === selectedItemId);

// Update Redux when user selects an item
const handleSelect = (id: number) => {
  dispatch(setSelectedItemId(id));
};
```

## Debugging

### React Query Devtools

Devtools are automatically enabled in development:

```typescript
<ReactQueryDevtools initialIsOpen={false} />
```

**Features:**
- View all active queries and their states
- See query keys and cached data
- Manually trigger refetch or invalidation
- Monitor network requests
- Debug stale/fresh data status

**Access:** Click the React Query icon in bottom-right corner during development

### Common Issues

**Issue 1: Data not updating after mutation**
- Solution: Invalidate queries in `onSuccess`

**Issue 2: Queries refetching too often**
- Solution: Increase `staleTime` in QueryClient config

**Issue 3: Queries not running**
- Solution: Check `enabled` option, ensure it's not set to `false`

**Issue 4: TypeScript errors with query data**
- Solution: Specify generic types: `useQuery<MyDataType>(...)`

## Migration Guide

### Converting Axios Call to TanStack Query

**Before (Direct Axios):**
```typescript
export function ItemList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await itemService.getAll();
        setItems(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{/* render items */}</div>;
}
```

**After (TanStack Query):**

1. Create query hook in `~/services/httpServices/queries/useItems.ts`:

```typescript
export function useItems() {
  return useQuery({
    queryKey: itemKeys.lists(),
    queryFn: async () => {
      const response = await itemService.getAll();
      return response.data;
    },
  });
}
```

2. Use in component:

```typescript
import { useItems } from "~/services/httpServices"

export function ItemList() {
  const { data: items = [], isLoading } = useItems();

  if (isLoading) return <LoadingSkeleton />;
  return <div>{/* render items */}</div>;
}
```

**Benefits:**
- Automatic caching
- Background refetching
- Request deduplication
- Less boilerplate code
- Better TypeScript support

## Summary

TanStack Query provides:
- **Automatic Caching**: Data cached for 1 minute (configurable)
- **Background Updates**: Stale data refetched in background
- **Request Deduplication**: Multiple components calling same query only triggers one request
- **Optimistic Updates**: Update UI before server response
- **DevTools**: Built-in debugging tools
- **Type Safety**: Full TypeScript support

**Next Steps:**
- Review existing query hooks in `~/services/httpServices/queries/`
- Use query key factories for all new queries
- Always invalidate after mutations
- Check React Query Devtools during development
