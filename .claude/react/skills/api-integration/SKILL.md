---
skill_name: api-integration
applies_to_local_project_only: true
auto_trigger_regex: [api integration, integrate api, connect backend, implement service, api service, frontend api, backend integration, create service, httpService]
tags: [frontend, api, integration, react, services, typescript]
related_skills: [frontend-dev-guidelines, e2e-testing]
---

# API Integration Skill

Quick reference for integrating backend REST APIs into React frontend applications.

## When to Use

- Starting fresh API integration for a new feature
- Adding new endpoints to existing services
- Connecting frontend pages to backend APIs
- Creating TypeScript service wrappers for httpService

---

## Quick Start (3 Steps)

### 1. Read Documentation
- `.claude-project/docs/PROJECT_API.md` - Available backend endpoints
- `.claude-project/docs/PROJECT_KNOWLEDGE.md` - Product features and pages

### 2. Create Service File
```typescript
// frontend/app/services/featureService.ts
import { httpService } from './httpService';

export const featureService = {
  getAll: () => httpService.get('/features'),
  getById: (id: string) => httpService.get(`/features/${id}`),
  create: (data: CreateDto) => httpService.post('/features', data),
  update: (id: string, data: UpdateDto) => httpService.put(`/features/${id}`, data),
  delete: (id: string) => httpService.delete(`/features/${id}`)
};
```

### 3. Integrate in Component
```typescript
// frontend/app/pages/feature/list.tsx
import { featureService } from '~/services/featureService';

export default function FeatureList() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    featureService.getAll()
      .then(data => setFeatures(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{/* Render features */}</div>;
}
```

---

## Common Patterns

### GET Request (Fetch Data)
```typescript
const itemService = {
  getAll: (filters?: BrowseFilters) =>
    httpService.get<Item[]>('/items', { params: filters }),

  getById: (id: string) =>
    httpService.get<Item>(`/items/${id}`)
};
```

### POST Request (Create)
```typescript
const itemService = {
  create: (data: CreateItemDto) =>
    httpService.post<Item>('/items', data)
};
```

### PUT/PATCH Request (Update)
```typescript
const itemService = {
  update: (id: string, data: UpdateItemDto) =>
    httpService.put<Item>(`/items/${id}`, data)
};
```

### DELETE Request
```typescript
const itemService = {
  delete: (id: string) =>
    httpService.delete(`/items/${id}`)
};
```

### File Upload (FormData)
```typescript
const mediaService = {
  uploadImage: (itemId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return httpService.post(`/items/${itemId}/media/image`, formData);
  }
};
```

---

## Examples

### Example 1: Authentication Service
```typescript
// frontend/app/services/authService.ts
import { httpService } from './httpService';
import type { LoginDto, AuthResponse } from '~/types/auth.types';

export const authService = {
  login: (data: LoginDto) =>
    httpService.post<AuthResponse>('/auth/login', data),

  logout: () =>
    httpService.get('/auth/logout'),

  forgotPassword: (email: string) =>
    httpService.post('/auth/forgot-password', { email }),

  resetPassword: (data: ResetPasswordDto) =>
    httpService.post('/auth/reset-password', data)
};
```

### Example 2: CRUD Service with Filters
```typescript
// frontend/app/services/itemService.ts
export const itemService = {
  // Browse with filters
  getAll: (filters?: {
    category?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => httpService.get<Item[]>('/items', { params: filters }),

  // My items only
  getMyItems: () =>
    httpService.get<Item[]>('/items/my'),

  // Admin endpoints
  admin: {
    getPending: () =>
      httpService.get<Item[]>('/items/admin/pending'),

    approve: (id: string) =>
      httpService.patch(`/items/admin/${id}/approve`)
  }
};
```

---

## TypeScript Types

Create corresponding type files in `frontend/app/types/`:

```typescript
// frontend/app/types/item.types.ts
export interface Item {
  id: string;
  title: string;
  description: string;
  category: CategoryEnum;
  tags: string[];
  content: string;
  likeCount: number;
  commentCount: number;
  status: ItemStatusEnum;
  createdAt: string;
  updatedAt: string;
}

export enum ItemStatusEnum {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export interface CreateItemDto {
  title: string;
  description: string;
  category: CategoryEnum;
  tags: string[];
  content: string;
}
```

---

## Error Handling

The httpService already includes error handling, but you can add custom handling:

```typescript
try {
  const data = await itemService.create(formData);
  toast.success('Item created successfully');
  navigate(`/items/${data.id}`);
} catch (error) {
  // Error is already processed by errorHandler
  toast.error(error.message || 'Failed to create item');
}
```

---

## Testing

After creating services, test them:

```typescript
// Manual test in browser console
import { itemService } from '~/services/itemService';

// Test GET
const items = await itemService.getAll({ limit: 5 });
console.log(items);

// Test POST (if authenticated)
const newItem = await itemService.create({
  title: 'Test',
  description: 'Test description',
  // ... other fields
});
```

---

## Verification Checklist

- [ ] Service file created in `frontend/app/services/`
- [ ] TypeScript types defined in `frontend/app/types/`
- [ ] Service methods match backend API endpoints
- [ ] Endpoint URLs are correct (check PROJECT_API.md)
- [ ] Authentication required? Bearer token handled by httpService
- [ ] Error handling in place
- [ ] Loading states in components
- [ ] Success/error messages shown to user
- [ ] PROJECT_API_INTEGRATION.md updated with status

---

## Full Workflow

For comprehensive step-by-step workflow including:
- Documentation analysis
- API mapping to pages
- E2E test creation
- Updating integration docs

See: **`.claude/react/agents/frontend-developer.md`**

---

---

## MANDATORY: Data Fetching Architecture

All API calls MUST go through the HttpService wrapper — see [data-fetching.md](../../docs/data-fetching.md).

### Pagination

```typescript
// Always pass page + limit
const { data } = await httpService.get<PaginatedResponse<User>>('/users', {
  params: { page: 1, limit: 20 }
});
```

### Search Debounce

```typescript
// 300ms+ debounce on search inputs
const debouncedSearch = useDebounce(searchTerm, 300);
```

### Filter/Sort Matching

- Filter values MUST match backend enum values exactly (case-sensitive)
- Sort: `sortBy` = column name, `sortOrder` = `ASC` | `DESC`

### State Requirements

Every API-connected component MUST handle:
- Loading state (skeleton, not spinner)
- Error state (with retry button)
- Empty state (distinct from error)

See also:
- [data-fetching.md](../../docs/data-fetching.md) — HttpService architecture and patterns
- [tanstack-query.md](../../docs/tanstack-query.md) — Query hooks and cache invalidation
- [performance.md](../../docs/performance.md) — Debounce, memoization, optimization

## Related Resources

- [frontend-developer agent](../../agents/frontend-developer.md) - Complete workflow
- [PROJECT_API_INTEGRATION.md](../../../../.claude-project/docs/PROJECT_API_INTEGRATION.md) - Integration tracking
- [httpService.ts](../../../../frontend/app/services/httpService.ts) - Base HTTP client
- [e2e-testing skill](../e2e-testing/SKILL.md) - Playwright testing patterns
