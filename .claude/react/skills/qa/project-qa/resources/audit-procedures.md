# Audit Procedures Reference

Detailed step-by-step procedures for each of the 9 QA audit categories. This document supplements the main [SKILL.md](../SKILL.md) with granular instructions.

---

## Category 1: Documentation Consistency (Weight: 8%)

### Purpose
Verify that project documentation accurately reflects the current implementation.

### Prerequisites
- Documentation files exist (e.g., `PROJECT_API.md`, `PROJECT_DATABASE.md`, `PROJECT_API_INTEGRATION.md`)
- If no documentation files found, **skip this category** and redistribute weight

### Procedure

#### 1.1 API Documentation vs Backend Routes

1. Parse `PROJECT_API.md` (or equivalent) to extract all documented endpoints
2. Scan backend route/URL files:
   - **Django**: All `urls.py` files → extract URL patterns
   - **NestJS**: All `*.controller.ts` files → extract `@Get()`, `@Post()`, etc. decorators
   - **Express**: All router files → extract `router.get()`, `router.post()`, etc.
3. Cross-reference:
   - **Documented but not implemented** → Issue (Medium severity)
   - **Implemented but not documented** → Issue (High severity for production endpoints)

#### 1.2 Database Documentation vs Models

1. Parse `PROJECT_DATABASE.md` (or equivalent) for documented models/entities
2. Scan actual model files:
   - **Django**: All `models.py` files
   - **NestJS/TypeORM**: All `*.entity.ts` files
   - **Prisma**: `schema.prisma`
3. Cross-reference:
   - **Documented model not in code** → Issue (Medium)
   - **Model in code not documented** → Issue (Low)
   - **Field mismatches** (documented fields don't match actual fields) → Issue (High)

#### 1.3 Integration Status vs Reality

1. Parse `PROJECT_API_INTEGRATION.md` (or equivalent) for integration status claims
2. Verify each "completed" integration actually has:
   - A service method that calls the endpoint
   - A component that uses the service
   - Proper type definitions
3. Flag false "completed" status → Issue (High)

### Scoring

```
score = (verified_items / total_documented_items) * 100
```

### Severity Guide

| Finding | Severity |
|---------|----------|
| Production endpoint not in docs | High |
| Documented endpoint not implemented | Medium |
| False integration status | High |
| Model field mismatch in docs | High |
| Undocumented model | Low |

---

## Category 2: Backend API Contract Validation (Weight: 15%)

### Purpose
Ensure frontend TypeScript types match actual backend response shapes.

### Procedure

#### 2.1 Extract Backend Response Shapes

**Django:**
1. Find all serializer classes in `serializers.py` files
2. For each serializer, extract:
   - Field names and types (`CharField`, `IntegerField`, `SerializerMethodField`, etc.)
   - Nested serializers (indicates nested object response)
   - `read_only_fields`, `write_only_fields`
   - `Meta.fields` list

**NestJS:**
1. Find all DTO classes in `*.dto.ts` files
2. Extract decorated properties with types
3. Check response interceptors/transformers

**Express:**
1. Find route handlers and trace `res.json()` calls
2. Extract the shape of objects passed to response

#### 2.2 Extract Frontend Type Definitions

1. Scan `types/`, `interfaces/`, `*.d.ts`, `*.types.ts` files
2. For each type/interface related to API data:
   - Extract property names and types
   - Note optional vs required properties

#### 2.3 Cross-Reference Comparison

For each endpoint with both backend shape and frontend type:

1. **Field name matching**
   - Compare field names accounting for casing transforms
   - Backend `snake_case` should map to frontend `camelCase` (if using a transformer)
   - If no transformer: field names should match exactly
   - Missing field in frontend type → Issue (High)
   - Extra field in frontend type not from backend → Issue (Medium)

2. **Type matching**
   - Backend `CharField` → Frontend `string`
   - Backend `IntegerField` → Frontend `number`
   - Backend `BooleanField` → Frontend `boolean`
   - Backend `DateTimeField` → Frontend `string` or `Date`
   - Backend `DecimalField` → Frontend `number` or `string`
   - Backend `JSONField` → Frontend specific type (not `any`)
   - Backend nested serializer → Frontend nested interface
   - Mismatch → Issue (Critical if causes runtime error, High otherwise)

3. **Nullability matching**
   - Backend `null=True` / `required=False` → Frontend property should be optional (`?:`) or union with `null`
   - Missing nullability → Issue (High — causes "Cannot read property of null" errors)

### Scoring

```
score = (matching_contracts / total_contracts) * 100
```

A contract passes if: all fields match names, types align, nullability is consistent.

### Severity Guide

| Finding | Severity |
|---------|----------|
| Type mismatch causing runtime error | Critical |
| Missing field in frontend type | High |
| Missing nullability handling | High |
| Extra unused field in frontend type | Medium |
| Casing mismatch without transformer | Medium |

---

## Category 3: Mock Data Validation (Weight: 10%)

### Purpose
Detect mock/fake data usage in production code paths when real APIs exist.

### Procedure

#### 3.1 Identify Mock Data Sources

Scan for files matching these patterns:
- `**/db/**`, `**/mock/**`, `**/mocks/**`, `**/__mocks__/**`
- `**/fixtures/**`, `**/seed/**`, `**/fake/**`
- Files named `*mock*`, `*fake*`, `*seed*`, `*stub*`, `*dummy*`

#### 3.2 Trace Mock Data Usage

For each mock data file found:
1. Search for imports of this file across the codebase
2. Classify each import location:
   - **Production component/page** → Flag (High severity)
   - **Test file** (`*.test.*`, `*.spec.*`) → OK, skip
   - **Storybook file** (`*.stories.*`) → OK, skip
   - **Development-only file** → Flag (Medium severity)

#### 3.3 Cross-Reference with Real APIs

For each mock data file used in production code:
1. Determine what data entity it represents (e.g., `userMock` → User data)
2. Check if a corresponding API endpoint exists:
   - **API exists** → Issue: "Mock data used when real API available" (High)
   - **API does not exist** → Issue: "No backend API for this data" (Medium) + suggest API creation in fixing plan

#### 3.4 Detect Inline Hardcoded Data

Search components for patterns indicating hardcoded data:
- Large array literals (>3 items) assigned to state or rendered directly
- Objects with realistic-looking data (names, emails, URLs) not from props or API
- `useState` initialized with mock-like objects

### Scoring

```
score = ((total_data_sources - mock_issues) / total_data_sources) * 100
```

### Severity Guide

| Finding | Severity |
|---------|----------|
| Mock data imported in production component with real API available | High |
| No backend API exists for data rendered in component | Medium |
| Mock data used only in dev-only paths | Medium |
| Hardcoded data arrays in components | Medium |
| Mock data in test/storybook files | OK (not an issue) |

---

## Category 4: API Integration Verification (Weight: 15%)

### Purpose
Verify all required API endpoints are properly integrated in the frontend.

### Procedure

#### 4.1 Build Required API List

Sources (in priority order):
1. `PROJECT_API_INTEGRATION.md` → explicit mapping of pages to required APIs
2. `PROJECT_API.md` → all documented endpoints
3. Backend route scan → all available endpoints

#### 4.2 Build Implemented API List

Scan frontend service files:
1. Find all service objects/modules
2. For each service, extract:
   - Method name
   - HTTP method (GET, POST, PUT, PATCH, DELETE)
   - Endpoint URL being called
3. Map service methods to the required API list

#### 4.3 Detect Missing Integrations

Compare required vs implemented:
- **Required endpoint with no service method** → Issue (Critical for core features, High for secondary)
- **Service method exists but not used in any component** → Issue (Medium — dead code)
- **Component renders data but has no API call and no service import** → Issue (High)

#### 4.4 Verify Redux/State Integration

If project uses Redux or similar state management:
1. Check that service methods are called via async thunks/actions
2. Verify thunks are dispatched in components
3. Verify state selectors are used to access fetched data
4. Flag direct service calls in components that bypass state management → Issue (Medium)

#### 4.5 Verify Request Parameters

For each implemented API call:
- **Search/filter endpoints**: Verify search, filter, and sort params are passed
- **Paginated endpoints**: Verify page/limit params are passed
- **Detail endpoints**: Verify ID parameter is passed correctly
- Missing parameters → Issue (High for pagination/search, Medium for optional filters)

### Scoring

```
score = (integrated_endpoints / required_endpoints) * 100
```

### Severity Guide

| Finding | Severity |
|---------|----------|
| Core API endpoint not integrated | Critical |
| Secondary API endpoint not integrated | High |
| Missing pagination/search params | High |
| Service method exists but unused | Medium |
| Direct service call bypassing state management | Medium |

---

## Category 5: Data Integrity Checks (Weight: 10%)

### Purpose
Detect potential runtime errors from improper data handling.

### Procedure

#### 5.1 Array Operation Safety

Search for array methods on potentially null/undefined variables:

```typescript
// UNSAFE patterns to detect:
data.map(...)           // data could be undefined
items.filter(...)       // items could be null
results.find(...)       // results could be undefined
list.forEach(...)       // list could be null
array.length            // array could be undefined

// SAFE patterns (not issues):
data?.map(...)          // optional chaining
(data || []).map(...)   // fallback
data && data.map(...)   // guard check
```

Grep patterns to search:
- `\w+\.map\(` — then check if variable is from API response or state (likely nullable)
- `\w+\.filter\(` — same check
- `\w+\.length` — in conditional rendering without guard

#### 5.2 Nested Property Access

Search for deep property access without optional chaining:

```typescript
// UNSAFE:
user.profile.avatar.url      // any level could be null
order.items[0].name           // items could be empty

// SAFE:
user?.profile?.avatar?.url
order.items?.[0]?.name
```

Focus on data from:
- API responses (props from parent, Redux state, hook returns)
- URL parameters
- Form state after submission

#### 5.3 Type Assertion Safety

Search for unsafe type assertions:

```typescript
// Flag these:
data as any
data as unknown as TargetType    // double assertion
(data as SomeType).property      // assertion + immediate access
```

#### 5.4 Loading & Error State Handling

For each component that fetches data:
1. Verify it handles the loading state (shows spinner/skeleton)
2. Verify it handles the error state (shows error message)
3. Verify it handles the empty state (shows empty message)

Check patterns:
- Redux: `loading`, `error`, `data` from slice state
- React Query: `isLoading`, `isError`, `data`
- useState + useEffect: loading state variable exists

### Scoring

```
score = ((total_checks - integrity_issues) / total_checks) * 100
```

### Severity Guide

| Finding | Severity |
|---------|----------|
| Array method on potentially null API response data | High |
| Deep property access without optional chaining on API data | High |
| `as any` type assertion | Medium |
| Double type assertion (`as unknown as X`) | High |
| Missing loading state in data-fetching component | Medium |
| Missing error state in data-fetching component | Medium |
| Missing empty state handling | Low |

---

## Category 6: API Functionality (Weight: 12%)

### Purpose
Verify API calls are correctly implemented with proper error handling and typing.

### Procedure

#### 6.1 Error Handling Verification

For each API call in service files:
1. Verify wrapped in try/catch or has `.catch()` handler
2. Verify error is passed to error handling utility (e.g., `handleApiError`)
3. Verify error does not silently fail (empty catch block)

```typescript
// GOOD:
try {
  const response = await httpService.get(URL);
  return handleApiResponse(response);
} catch (error) {
  handleApiError(error);
}

// BAD:
const response = await httpService.get(URL);  // no error handling
return response.data;

// BAD:
try { ... } catch (error) { }  // silent catch
```

#### 6.2 Request Body Typing

For POST/PUT/PATCH calls:
1. Verify request body has a TypeScript type/interface
2. Verify the type matches what the backend expects
3. Flag untyped request bodies → Issue (Medium)

#### 6.3 Response Handling

For all API calls:
1. Verify response is processed through a consistent utility (e.g., `handleApiResponse`)
2. Verify response type matches the generic parameter of the HTTP call
3. Flag direct `response.data` access without utility → Issue (Low if utility exists in project)

#### 6.4 File Upload Verification

For endpoints that handle file uploads:
1. Verify `FormData` is used correctly
2. Verify proper `Content-Type` header (multipart/form-data)
3. Verify file size/type validation exists on frontend

#### 6.5 Pagination Support

For list endpoints:
1. Verify pagination parameters are accepted (page, limit/pageSize)
2. Verify pagination response is properly handled (total, hasMore, nextPage)
3. Flag list endpoints without pagination → Issue (Medium)

### Scoring

```
score = ((correct_api_calls / total_api_calls) * 100
```

### Severity Guide

| Finding | Severity |
|---------|----------|
| API call with no error handling | High |
| Silent catch block (empty catch) | High |
| Untyped request body | Medium |
| Missing pagination on list endpoint | Medium |
| Direct response.data without utility | Low |
| Missing file validation on upload | Medium |

---

## Category 7: Build & Type Safety (Weight: 12%)

### Purpose
Verify the project builds successfully and maintains type safety.

### Procedure

#### 7.1 TypeScript Compilation

Run: `npx tsc --noEmit`

1. Capture all errors
2. Group by error code (TS2322, TS2339, etc.)
3. Count total errors
4. Classify:
   - 0 errors → Score: 100%
   - 1-5 errors → Score: 80%
   - 6-15 errors → Score: 60%
   - 16-30 errors → Score: 40%
   - 31+ errors → Score: 20%

#### 7.2 Build Verification

Run the project build command:
- **Vite**: `npx vite build`
- **CRA**: `npx react-scripts build`
- **Next.js**: `npx next build`

1. Capture exit code and error output
2. Build succeeds → Pass
3. Build fails → Issue (Critical)

#### 7.3 `any` Type Usage

Search for `any` type across the codebase:

```
Grep pattern: ": any" or "as any" or "<any>"
Exclude: node_modules, *.test.*, *.spec.*, *.d.ts (from external libs)
```

Classify:
- 0 occurrences → Score: 100%
- 1-5 → Score: 90%
- 6-15 → Score: 70%
- 16-30 → Score: 50%
- 31+ → Score: 30%

#### 7.4 Suppression Comments

Count `@ts-ignore` and `@ts-expect-error` comments:
- Each occurrence → Issue (Low severity)
- Report total count and file locations

#### 7.5 Dependency Health

Check for:
- Peer dependency warnings (`npm ls 2>&1 | grep "peer dep"`)
- Deprecated packages (`npm outdated`)
- Missing dependencies (imported but not in package.json)

### Scoring

```
score = weighted_average(
  tsc_score × 0.40,
  build_score × 0.30,
  any_score × 0.20,
  suppression_score × 0.10
)
```

### Severity Guide

| Finding | Severity |
|---------|----------|
| Build failure | Critical |
| TypeScript compilation error | High |
| `any` type usage | Medium |
| `@ts-ignore` / `@ts-expect-error` | Low |
| Peer dependency warnings | Low |
| Deprecated packages | Low |

---

## Category 8: Routing Validation (Weight: 8%)

### Purpose
Verify routes are properly configured and all pages are reachable.

### Procedure

#### 8.1 Route-Component Cross-Reference

1. Parse route configuration file(s) to extract all defined routes
2. For each route, verify the referenced component file exists
3. **Dead route** (component doesn't exist) → Issue (High)

#### 8.2 Orphan Page Detection

1. List all page/view component files
2. Check each against the route configuration
3. **Orphan page** (not referenced in any route) → Issue (Medium)

#### 8.3 Lazy Loading Consistency

1. Check if project uses lazy loading for routes
2. If some routes use lazy loading and others don't, flag inconsistency → Issue (Low)
3. Large page components without lazy loading → Issue (Low)

#### 8.4 Catch-All Route

1. Verify a 404/not-found/catch-all route exists
2. Missing catch-all → Issue (Medium)

#### 8.5 Route Hierarchy

1. Verify nested routes have proper parent layouts
2. Check for duplicate route paths → Issue (High)
3. Verify route params are used in components (`:id` param → component uses `useParams`)

### Scoring

```
score = ((valid_routes / total_routes) + (routed_pages / total_pages)) / 2 * 100
```

### Severity Guide

| Finding | Severity |
|---------|----------|
| Dead route (missing component) | High |
| Duplicate route path | High |
| Orphan page (unreachable) | Medium |
| Missing 404/catch-all route | Medium |
| Inconsistent lazy loading | Low |
| Unused route params | Low |

---

## Category 9: Authentication & Authorization (Weight: 10%)

### Purpose
Verify role-based access control and authentication guards are properly implemented.

### Procedure

#### 9.1 Identify Auth Infrastructure

Search for auth-related components:
- `ProtectedRoute`, `PrivateRoute`, `AuthGuard`, `RequireAuth`, `withAuth`
- Auth context/provider components
- Auth hooks (`useAuth`, `useUser`, `useSession`)

If no auth infrastructure found → Note in report, score N/A (redistribute weight)

#### 9.2 Route Protection Audit

For each route in the configuration:
1. Classify as public or private (based on path, naming, or wrapping)
2. Verify private routes are wrapped with auth guard
3. **Unprotected private route** → Issue (Critical)

Common private route indicators:
- Paths containing: `/dashboard`, `/admin`, `/settings`, `/account`, `/profile` (when editing)
- Routes under `/private/`, `/app/`, `/portal/`
- Routes requiring user data to render

#### 9.3 Role-Based Access

If the application has multiple user roles:
1. Identify role-specific routes (admin routes, expert routes, collector routes, etc.)
2. Verify each role-specific route checks for the correct role
3. **Missing role check on role-specific route** → Issue (High)
4. Check if role data is available in auth context/state

#### 9.4 API Call Auth Headers

1. Verify HTTP client is configured with auth headers/cookies
2. Check for API calls that should require auth but don't include credentials
3. Verify token refresh/interceptor mechanism exists
4. **Unprotected API call to authenticated endpoint** → Issue (High)

#### 9.5 Redirect Behavior

1. Verify unauthenticated users are redirected to login
2. Verify authenticated users are redirected away from login/register pages
3. Verify role-mismatched users are redirected appropriately
4. **Missing login redirect** → Issue (High)
5. **No redirect from login when authenticated** → Issue (Low)

### Scoring

```
score = (protected_routes / routes_needing_protection) * 100
```

Adjusted for role checks:

```
role_score = (correctly_role_checked / total_role_specific_routes) * 100
final_score = (route_score × 0.5) + (role_score × 0.3) + (redirect_score × 0.2)
```

### Severity Guide

| Finding | Severity |
|---------|----------|
| Unprotected private route | Critical |
| Missing role check on admin route | High |
| Missing login redirect for unauth users | High |
| Unprotected API call to auth endpoint | High |
| No redirect from login when authenticated | Low |
| Missing auth infrastructure entirely | Note (not scored) |
