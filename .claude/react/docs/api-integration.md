# API Integration Guide

This guide covers patterns for mapping frontend screens to backend API endpoints and implementing data fetching.

> **For your project's actual API map**, see `.claude-project/docs/PROJECT_API_INTEGRATION.md` and `.claude-project/docs/PROJECT_API.md`.

## Table of Contents

- [Documenting API Integrations](#documenting-api-integrations)
- [Implementation Patterns](#implementation-patterns)
- [After Successful Integration](#after-successful-integration)

---

## Documenting API Integrations

Use this template structure to map screens to endpoints in your project's `PROJECT_API_INTEGRATION.md`:

### Route Group Summary

| Route Group | Screens | Total API Calls |
|-------------|---------|-----------------|
| Public/Auth | 3-5 | ~4 endpoints |
| Admin | varies | varies |
| User | varies | varies |

### Per-Screen Documentation

For each screen, document:

```markdown
### Screen Name (`/route-path`)
**Component:** `pages/section/screen-name.tsx`

| API | Method | Endpoint | Purpose |
|-----|--------|----------|---------|
| Feature | GET | `/resource` | Fetch data |
| Action | POST | `/resource` | Create item |
```

### Common/Shared APIs

Document endpoints used across multiple screens:

| API | Method | Endpoint | Used For |
|-----|--------|----------|----------|
| Check Session | GET | `/auth/check-session` | Validate auth on protected routes |
| Logout | POST | `/auth/logout` | User logout |
| Get Profile | GET | `/users/:id` | User profile pages |

---

## Implementation Patterns

### Creating an API Service

```typescript
// ~/services/httpServices/itemService.ts
import { get, post, patch, del } from '../httpMethods';
import type { Item, CreateItemDto } from '~/types/item';

export const itemService = {
  getAll: () =>
    get<Item[]>('/items'),

  getById: (id: string) =>
    get<Item>(`/items/${id}`),

  create: (data: CreateItemDto) =>
    post<Item>('/items', data),

  update: (id: string, data: Partial<Item>) =>
    patch<Item>(`/items/${id}`, data),

  delete: (id: string) =>
    del(`/items/${id}`),
};
```

### Creating a Redux Slice with Thunks

```typescript
// ~/redux/features/itemSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { itemService } from '~/services/httpServices/itemService';

export const fetchItems = createAsyncThunk(
  'items/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await itemService.getAll();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const itemSlice = createSlice({
  name: 'items',
  initialState: {
    items: [] as Item[],
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});
```

### Using in a Component

```typescript
// ~/pages/admin/items.tsx
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '~/redux/store/hooks';
import { fetchItems } from '~/redux/features/itemSlice';

export default function ItemList() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.items);

  useEffect(() => {
    dispatch(fetchItems());
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

---

## After Successful Integration

### Integration Verification Checklist

- [ ] API calls return expected data
- [ ] Loading states display correctly
- [ ] Error states are handled gracefully
- [ ] TypeScript types match API response
- [ ] Redux state updates properly
- [ ] Component renders data correctly
- [ ] No console errors or warnings

### Create Pull Request

When integration is complete and verified, create a PR to the dev branch:

```bash
# Check your changes
git status
git diff

# Stage and commit
git add .
git commit -m "feat: Integrate [feature] API endpoints"

# Push and create PR
git push -u origin HEAD
gh pr create --base dev --title "feat: [Feature] API integration" --body "$(cat <<'EOF'
## Summary
- Integrated [endpoint] API for [feature]
- Added Redux slice for state management
- Created HTTP service methods

## APIs Integrated
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/example | GET | Fetch data |

## Test Plan
- [ ] Verified API responses in Network tab
- [ ] Tested loading/error states
- [ ] Confirmed data displays correctly

---
Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

---

## MANDATORY: Type Safety Between Frontend & Backend

- Frontend DTO fields optional/required MUST match backend response actual shape
- Date/time handling MUST be consistent (ISO string format)
- Pagination request/response format MUST match
- Shared enums MUST be kept in sync — run `/sync-enums` after backend changes
- Field missing from API response = backend issue — do NOT use optional chaining as workaround
- API response types MUST NOT use `any` — define proper interfaces

## MANDATORY: Integration Checklist

Before marking any API integration complete:

- [ ] All form submissions call real API endpoints
- [ ] All list pages pass pagination params (`page`, `limit`)
- [ ] Search inputs debounced (300ms+)
- [ ] Filter values match backend enum values exactly
- [ ] Sort params match backend column names
- [ ] Loading state shown during ALL async operations
- [ ] Error state shown for API failures (with retry)
- [ ] Empty state shown for zero results
- [ ] Dropdown/select options come from API (not hardcoded)
- [ ] Modal create/edit/delete call real endpoints
- [ ] Dashboard stats come from API (not hardcoded)
- [ ] Success/error toast uses API response message

## Related Resources

- [Data Fetching Guide](data-fetching.md) — HttpService patterns
- [Common Patterns](common-patterns.md) — Redux and form patterns
- [Loading & Error States](loading-and-error-states.md) — State handling patterns
