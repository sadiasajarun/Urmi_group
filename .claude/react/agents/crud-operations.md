# CRUD Operations Pattern

## Overview

This guide defines the standard pattern for CRUD operations across all React apps (`frontend*/`, `dashboard*/`).

- **READ** (fetch/get): `createAsyncThunk` in service files — Redux manages loading/error/data
- **MUTATION** (create/update/delete): Direct service calls — `FormHandleState` for loading, `toast` for feedback
- **Exception**: Operations requiring optimistic Redux state with rollback (e.g., board DnD) may use `createAsyncThunk`

---

## FormHandleState

Defined in `types/form-handle.d.ts`:

```typescript
export interface FormHandleState {
  isLoading: boolean;
  loadingButtonType: string; // "create" | "edit" | "delete" | "archive" etc.
}
```

### Why loadingButtonType?

A page may have multiple visible action buttons (Create, Edit, Delete). Instead of separate `useState` for each, `loadingButtonType` tracks which button triggered the loading:

- Click "Create" → `loadingButtonType: "create"` → only Create button shows spinner
- Click "Edit" → `loadingButtonType: "edit"` → only Edit button shows spinner
- Click "Delete" → `loadingButtonType: "delete"` → only Delete button shows spinner

---

## Service File Pattern

Service files contain:
1. **Plain service object** — HTTP methods for ALL operations
2. **`createAsyncThunk`** — ONLY for read/fetch operations

```typescript
// services/projectService.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { HttpService } from './httpService';
import type { ThunkError } from '~/types/httpService';
import type { Project, CreateProjectRequest, ProjectQueryParams } from '~/types/project';

const http = new HttpService();

// 1. Service object — ALL operations as plain methods
export const projectService = {
  getAll: (params?: ProjectQueryParams) =>
    http.getPaginated<Project>('/projects', { params }),
  getById: (id: string) =>
    http.get<Project>(`/projects/${id}`),
  create: (data: CreateProjectRequest) =>
    http.post<Project>('/projects', data),
  update: (id: string, data: Partial<CreateProjectRequest>) =>
    http.patch<Project>(`/projects/${id}`, data),
  delete: (id: string) =>
    http.delete(`/projects/${id}`),
  bulkDelete: (ids: string[]) =>
    http.post('/projects/bulk-delete', { ids }),
  getClientProjects: () =>
    http.get<Project[]>('/projects/client'),
};

// 2. Thunks — ONLY for reads
export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async (params: ProjectQueryParams | undefined, { rejectWithValue }) => {
    try {
      return await projectService.getAll(params);
    } catch (error: unknown) {
      return rejectWithValue((error as ThunkError).message ?? 'Failed to fetch projects');
    }
  }
);

export const fetchClientProjects = createAsyncThunk(
  'projects/fetchClient',
  async (_, { rejectWithValue }) => {
    try {
      return await projectService.getClientProjects();
    } catch (error: unknown) {
      return rejectWithValue((error as ThunkError).message ?? 'Failed to fetch projects');
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await projectService.getById(id);
    } catch (error: unknown) {
      return rejectWithValue((error as ThunkError).message ?? 'Failed to fetch project');
    }
  }
);

// NO createAsyncThunk for create, update, delete
```

**Auth service example** — login/logout are mutations (plain methods), only `getMe` gets a thunk:

```typescript
// services/authService.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { HttpService } from './httpService';
import type { ThunkError } from '~/types/httpService';
import type { LoginRequest, LoginResponse, AuthUser, AuthState } from '~/types/auth';

const http = new HttpService();

// 1. Service object — ALL operations as plain methods
export const authService = {
  login: (data: LoginRequest) => http.post<LoginResponse>('/auth/login', data),
  logout: () => http.post<void>('/auth/logout', {}),
  getMe: () => http.get<AuthUser>('/auth/me'),
  refresh: () => http.post<void>('/auth/refresh', {}),
};

// 2. Thunks — ONLY for reads
export const getMeThunk = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getMe();
    } catch (error: unknown) {
      return rejectWithValue((error as ThunkError).message ?? 'Session expired');
    }
  },
  {
    condition: (_, { getState }) => {
      const { auth } = getState() as { auth: AuthState };
      if (auth.loading) return false;
    },
  }
);

// NO createAsyncThunk for login, logout
```

---

## Slice File Pattern

Slices contain ONLY:
1. Imports of **fetch** thunks from service
2. Initial state
3. Sync reducers
4. `extraReducers` for **fetch** lifecycle only

```typescript
// redux/features/projectsSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import { fetchProjects, fetchClientProjects, fetchProjectById } from '~/services/projectService';
import type { ProjectsState } from '~/types/project';

const initialState: ProjectsState = {
  projects: [],
  total: 0,
  selectedProject: null,
  loading: false,
  error: null,
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearProjectError: (state) => { state.error = null; },
    setSelectedProject: (state, action) => { state.selectedProject = action.payload; },
    clearSelectedProject: (state) => { state.selectedProject = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetchProjects — admin paginated list
      .addCase(fetchProjects.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload.data;
        state.total = action.payload.total;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchClientProjects — client project list (non-paginated)
      .addCase(fetchClientProjects.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchClientProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
        state.total = action.payload.length;
      })
      .addCase(fetchClientProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchProjectById — detail view
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.selectedProject = action.payload;
      });
    // NO extraReducers for create/update/delete
  },
});
```

**Auth slice example** — sync reducers for mutation results, `extraReducers` only for the read thunk:

```typescript
// redux/features/authSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import { getMeThunk } from '~/services/authService';
import type { AuthState, AuthUser } from '~/types/auth';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  authChecked: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Sync reducers — components dispatch these after mutation success
    setUser: (state, action: { payload: AuthUser }) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.authChecked = true;
    },
    resetAuth: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // ONLY getMeThunk (read)
      .addCase(getMeThunk.pending, (state) => { state.loading = true; })
      .addCase(getMeThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.authChecked = true;
      })
      .addCase(getMeThunk.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.authChecked = true;
      });
    // NO extraReducers for login/logout
  },
});
```

---

## Component Mutation Pattern

### Step 1: Setup FormHandleState

```typescript
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { FormHandleState } from '~/types/form-handle';
import { projectService, fetchProjects } from '~/services/projectService';

const [formHandle, setFormHandle] = useState<FormHandleState>({
  isLoading: false,
  loadingButtonType: "create",
});
```

### Step 2: Create Operation (useCallback)

```typescript
const handleCreate = useCallback((data: CreateProjectRequest) => {
  setFormHandle(prev => ({ ...prev, isLoading: true, loadingButtonType: "create" }));

  projectService
    .create(data)
    .then(() => {
      dispatch(fetchProjects(currentParams)); // refetch list
      reset(); // reset form
      setShowCreateModal(false);
      toast.success("Project created successfully");
    })
    .catch((err) => {
      toast.error(err?.message || "Failed to create project");
    })
    .finally(() => {
      setFormHandle(prev => ({ ...prev, isLoading: false }));
    });
}, [dispatch, currentParams]);
```

### Step 3: Update Operation (useCallback)

```typescript
const handleUpdate = useCallback((id: string, data: Partial<CreateProjectRequest>) => {
  setFormHandle(prev => ({ ...prev, isLoading: true, loadingButtonType: "edit" }));

  projectService
    .update(id, data)
    .then(() => {
      dispatch(fetchProjects(currentParams)); // refetch list
      setShowEditModal(false);
      toast.success("Project updated successfully");
    })
    .catch((err) => {
      toast.error(err?.message || "Failed to update project");
    })
    .finally(() => {
      setFormHandle(prev => ({ ...prev, isLoading: false }));
    });
}, [dispatch, currentParams]);
```

### Step 4: Delete Operation (useCallback)

```typescript
const handleDelete = useCallback((id: string) => {
  setFormHandle(prev => ({ ...prev, isLoading: true, loadingButtonType: "delete" }));

  projectService
    .delete(id)
    .then(() => {
      dispatch(fetchProjects(currentParams)); // refetch list
      toast.success("Project deleted successfully");
    })
    .catch((err) => {
      toast.error(err?.message || "Failed to delete project");
    })
    .finally(() => {
      setFormHandle(prev => ({ ...prev, isLoading: false }));
    });
}, [dispatch, currentParams]);
```

### Step 5: Button Loading

```tsx
{/* Create button — only shows loading when loadingButtonType is "create" */}
<button
  disabled={formHandle.isLoading && formHandle.loadingButtonType === "create"}
>
  {formHandle.isLoading && formHandle.loadingButtonType === "create"
    ? "Creating..."
    : "Create"}
</button>

{/* Edit button — only shows loading when loadingButtonType is "edit" */}
<button
  disabled={formHandle.isLoading && formHandle.loadingButtonType === "edit"}
>
  {formHandle.isLoading && formHandle.loadingButtonType === "edit"
    ? "Saving..."
    : "Save Changes"}
</button>

{/* Delete button — only shows loading when loadingButtonType is "delete" */}
<button
  disabled={formHandle.isLoading && formHandle.loadingButtonType === "delete"}
>
  {formHandle.isLoading && formHandle.loadingButtonType === "delete"
    ? "Deleting..."
    : "Delete"}
</button>
```

### Auth Mutation Examples

**Login** — mutation with sync reducer dispatch (no list to refetch):

```typescript
const [formHandle, setFormHandle] = useState<FormHandleState>({
  isLoading: false,
  loadingButtonType: 'login',
});
const [loginError, setLoginError] = useState<string | null>(null);

const onSubmit = useCallback((data: LoginFormData) => {
  setLoginError(null);
  setFormHandle({ isLoading: true, loadingButtonType: 'login' });

  authService
    .login(data)
    .then((user) => {
      dispatch(setUser(user)); // sync reducer — no list to refetch
    })
    .catch((err) => {
      setLoginError(err?.message || 'Login failed');
      toast.error(err?.message || 'Login failed');
    })
    .finally(() => {
      setFormHandle(prev => ({ ...prev, isLoading: false }));
    });
}, [dispatch]);
```

**Logout** — mutation with state reset + navigate:

```typescript
const handleLogout = useCallback(() => {
  authService
    .logout()
    .then(() => {
      dispatch(resetAuth());
      navigate('/login', { replace: true });
    })
    .catch(() => {
      dispatch(resetAuth());
      navigate('/login', { replace: true });
    });
}, [dispatch, navigate]);
```

---

## Modal Loading Pattern

Modals MUST NOT manage their own mutation loading state. The parent component owns `formHandle` and passes `loading` as a prop.

### Modal Component

```tsx
// Props include loading from parent
interface CreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: FormData) => void;
  loading: boolean; // from parent's formHandle
}

export default function CreateModal({ open, onClose, onCreate, loading }: CreateModalProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ name }); // just call callback — NO setSubmitting
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <form onSubmit={handleSubmit}>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
        <button type="submit" disabled={loading || !name}>
          {loading ? <Spinner /> : "Create"}
        </button>
      </form>
    </Dialog>
  );
}
```

### Parent Component

```tsx
<CreateModal
  open={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  onCreate={handleCreate}
  loading={formHandle.isLoading && formHandle.loadingButtonType === "create"}
/>
```

### Key Rules
- Modal handles ONLY form state (field values, validation)
- Parent handles API call, loading, toast, refetch, and modal close
- `loading` prop disables submit button and shows spinner
- `loading` prop disables cancel button to prevent closing during mutation

---

## Exception: Optimistic Redux Updates

For operations that require optimistic state updates with rollback on failure (e.g., board drag-and-drop), `createAsyncThunk` is still appropriate:

```typescript
// boardService.ts — DnD operations keep thunks
export const moveTask = createAsyncThunk(
  'board/moveTask',
  async (data: MoveTaskData, { rejectWithValue }) => { ... }
);

// boardSlice.ts — optimistic reducers + extraReducers
reducers: {
  optimisticMoveTask: (state, action) => { /* instant UI update */ },
},
extraReducers: (builder) => {
  builder
    .addCase(moveTask.rejected, (state, action) => { /* rollback */ });
}
```

**Use createAsyncThunk for mutations ONLY when:**
- The UI must update instantly before API response (optimistic update)
- Failure requires rolling back Redux state to previous value
- Multiple slices need to react to the same mutation lifecycle

---

## Refetch Pattern

After a successful mutation, refetch the list data using the existing fetch thunk:

```typescript
// After create/update/delete success:
dispatch(fetchProjects({ page, limit: pageSize, search, status }));
```

This ensures the Redux store stays in sync with the server without manually managing state updates for mutations.

---

## Per-Item Loading Pattern

When mutations target a single item within a list (e.g., an inline status dropdown, a row-level delete), use `useState<string | null>` tracking the ID of the item being mutated instead of `FormHandleState`.

### When to use

Use `updatingItemId` (or a domain-specific name like `updatingPinId`) instead of `FormHandleState` when:
- The mutation is triggered from a list row (not from a modal form)
- Multiple rows are independently actionable (each row has its own button/dropdown)
- You need a spinner or disabled state on only the row being mutated

### Implementation

```typescript
const [updatingPinId, setUpdatingPinId] = useState<string | null>(null);

const handleStatusChange = useCallback(
  (pinId: string, newStatus: PinStatus) => {
    setUpdatingPinId(pinId);
    feedbackService
      .updatePinStatus(pinId, newStatus)
      .then(() => {
        toast.success('Status updated');
        refetch(); // or dispatch a sync reducer
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to update status';
        toast.error(message);
      })
      .finally(() => setUpdatingPinId(null));
  },
  [refetch]
);
```

### Binding to the row

```tsx
{items.map((item) => (
  <StatusDropdown
    key={item.id}
    status={item.status}
    loading={updatingPinId === item.id}
    onChange={(newStatus) => handleStatusChange(item.id, newStatus)}
  />
))}
```

The `loading` prop drives the disabled state and inline spinner within the row's control. Other rows remain fully interactive.

### Comparison to FormHandleState

| Scenario | Use |
|---|---|
| Page has Create/Edit/Delete buttons in a modal | `FormHandleState` + `loadingButtonType` |
| List rows each have inline action (status change, row delete) | `updatingItemId: string \| null` |

---

## Direct State Update Pattern

When the mutation response IS the data you need — or when you want instant UI feedback without a round-trip refetch — dispatch sync reducers instead.

### When to use

- **Create**: API returns the new entity — `dispatch(addItem(newEntity))` appends it to the list
- **Edit**: API confirms success — `dispatch(updateItem({ id, changes }))` patches the item in-place
- **Delete**: API confirms success — `dispatch(removeItem(id))` splices it from the list

### Slice sync reducers (feedbackSlice example)

```typescript
// redux/features/feedbackSlice.ts
reducers: {
  addPin: (state, action) => { state.pins.push(action.payload); },
  updatePinComment: (state, action: { payload: { commentId: string; content: string } }) => {
    const pin = state.pins.find((p) => p.comment?.id === action.payload.commentId);
    if (pin?.comment) { pin.comment.content = action.payload.content; }
  },
  removePin: (state, action: { payload: string }) => {
    state.pins = state.pins.filter((p) => p.id !== action.payload);
  },
},
```

### Component usage

```typescript
// Create — API returns new pin, dispatch directly
feedbackService
  .createPin(screenshotId, data)
  .then((newPin) => {
    dispatch(addPin(newPin));
    toast.success('Feedback saved!');
  })

// Edit — update in-place
feedbackService
  .editComment(commentId, newContent)
  .then(() => {
    dispatch(updatePinComment({ commentId, content: newContent }));
    toast.success('Comment updated');
  })

// Delete — remove from list
feedbackService
  .deletePin(pinId)
  .then(() => {
    dispatch(removePin(pinId));
    toast.success('Comment deleted');
  })
```

### When to refetch instead

Use `dispatch(fetchThunk(params))` when:
- The mutation affects list ordering, pagination counts, or fields not in the response
- Server-side computed fields need to be re-read (e.g., `total`, sort position)
- You cannot reconstruct the updated state from the mutation payload alone
