# Scoring Reference

Complete scoring methodology for the Project QA Audit skill.

---

## Category Weights

| # | Category | Weight | Rationale |
|---|----------|--------|-----------|
| 1 | Documentation Consistency | 8% | Maintainability concern; lower runtime impact |
| 2 | Backend API Contract Validation | 15% | Direct cause of runtime data bugs and crashes |
| 3 | Mock Data Validation | 10% | Indicates incomplete integration; affects data accuracy |
| 4 | API Integration Verification | 15% | Core functionality depends on complete API integration |
| 5 | Data Integrity Checks | 10% | Runtime stability and crash prevention |
| 6 | API Functionality | 12% | Correct API usage prevents silent failures |
| 7 | Build & Type Safety | 12% | Deployment blocker; catches errors at compile time |
| 8 | Routing Validation | 8% | User navigation correctness |
| 9 | Authentication & Authorization | 10% | Security-critical; protects user data |
| | **Total** | **100%** | |

---

## Overall Health Formula

```
Overall Health = sum(category_score_i × weight_i)
```

Expanded:

```
Health = (C1 × 0.08) + (C2 × 0.15) + (C3 × 0.10) + (C4 × 0.15) + (C5 × 0.10)
       + (C6 × 0.12) + (C7 × 0.12) + (C8 × 0.08) + (C9 × 0.10)
```

Where `C1` through `C9` are individual category scores (0-100%).

### When Categories Are Skipped

If a category is skipped (e.g., no documentation found for Category 1), redistribute its weight proportionally:

```
adjusted_weight_i = original_weight_i / (1 - sum_of_skipped_weights)
```

**Example**: If Category 1 (8%) is skipped:

```
remaining_weight = 1 - 0.08 = 0.92

C2 adjusted = 0.15 / 0.92 = 0.163
C3 adjusted = 0.10 / 0.92 = 0.109
C4 adjusted = 0.15 / 0.92 = 0.163
C5 adjusted = 0.10 / 0.92 = 0.109
C6 adjusted = 0.12 / 0.92 = 0.130
C7 adjusted = 0.12 / 0.92 = 0.130
C8 adjusted = 0.08 / 0.92 = 0.087
C9 adjusted = 0.10 / 0.92 = 0.109
                              -----
                              1.000 ✓
```

---

## Rating Thresholds

| Score Range | Rating | Badge | Action Required |
|-------------|--------|-------|-----------------|
| 95-100% | Healthy | :green_circle: | Production ready — no blocking issues |
| 85-94% | Minor Issues | :yellow_circle: | Fix before release — low-risk issues remain |
| 70-84% | Needs Attention | :orange_circle: | Review and fix — multiple areas need work |
| <70% | Critical | :red_circle: | Significant rework — major gaps or failures |

---

## Per-Category Scoring Rubrics

### Category 1: Documentation Consistency

```
score = (verified_items / total_documented_items) * 100
```

| Verified Items | Score |
|----------------|-------|
| All docs match code | 100% |
| 1-2 mismatches | 80% |
| 3-5 mismatches | 60% |
| 6-10 mismatches | 40% |
| 10+ mismatches | 20% |

### Category 2: Backend API Contract Validation

```
score = (matching_contracts / total_contracts) * 100
```

A contract passes when:
- All field names match (accounting for casing transforms)
- All field types align
- Nullability is consistent

Deductions per issue:
- Type mismatch: -15 points per endpoint
- Missing field: -10 points per field
- Nullability mismatch: -5 points per field

### Category 3: Mock Data Validation

```
score = ((total_data_sources - mock_violations) / total_data_sources) * 100
```

Where `mock_violations` = mock data used in production code when real API exists.

### Category 4: API Integration Verification

```
score = (integrated_endpoints / required_endpoints) * 100
```

Deductions:
- Missing core API: -20 points per endpoint
- Missing secondary API: -10 points per endpoint
- Missing parameters (search/pagination): -5 points per endpoint

### Category 5: Data Integrity Checks

```
score = ((total_data_access_points - unsafe_points) / total_data_access_points) * 100
```

Where `unsafe_points` = null-unsafe array operations + unguarded nested access + unsafe assertions.

### Category 6: API Functionality

```
score = (correct_api_implementations / total_api_calls) * 100
```

An API call is correct when:
- Has try/catch or .catch() error handling
- Error handler is not empty
- Request body is typed (for POST/PUT/PATCH)
- Uses project's API utility functions

### Category 7: Build & Type Safety

Composite score:

```
score = (tsc_score × 0.40) + (build_score × 0.30) + (any_score × 0.20) + (suppression_score × 0.10)
```

**TSC sub-score:**

| TS Errors | Score |
|-----------|-------|
| 0 | 100% |
| 1-5 | 80% |
| 6-15 | 60% |
| 16-30 | 40% |
| 31+ | 20% |

**Build sub-score:**

| Result | Score |
|--------|-------|
| Build succeeds | 100% |
| Build fails with warnings only | 80% |
| Build fails | 0% |

**Any usage sub-score:**

| Count | Score |
|-------|-------|
| 0 | 100% |
| 1-5 | 90% |
| 6-15 | 70% |
| 16-30 | 50% |
| 31+ | 30% |

**Suppression sub-score:**

| Count | Score |
|-------|-------|
| 0 | 100% |
| 1-3 | 80% |
| 4-10 | 60% |
| 11+ | 40% |

### Category 8: Routing Validation

```
score = ((valid_routes / total_routes) + (routed_pages / total_pages)) / 2 * 100
```

Where:
- `valid_routes` = routes with existing component files
- `routed_pages` = page files referenced in at least one route

### Category 9: Authentication & Authorization

Composite score:

```
score = (route_protection × 0.50) + (role_checks × 0.30) + (redirects × 0.20)
```

**Route protection sub-score:**

```
route_protection = (protected_private_routes / total_private_routes) * 100
```

**Role checks sub-score:**

```
role_checks = (correctly_role_checked / total_role_specific_routes) * 100
```

**Redirects sub-score:**

```
redirects = (correct_redirects / expected_redirects) * 100
```

---

## Worked Example

Suppose a project audit produces these category scores:

| # | Category | Score | Weight | Weighted |
|---|----------|-------|--------|----------|
| 1 | Documentation Consistency | 80% | 8% | 6.4% |
| 2 | Backend API Contract | 70% | 15% | 10.5% |
| 3 | Mock Data Validation | 90% | 10% | 9.0% |
| 4 | API Integration | 75% | 15% | 11.25% |
| 5 | Data Integrity | 85% | 10% | 8.5% |
| 6 | API Functionality | 80% | 12% | 9.6% |
| 7 | Build & Type Safety | 95% | 12% | 11.4% |
| 8 | Routing Validation | 100% | 8% | 8.0% |
| 9 | Auth & Authorization | 90% | 10% | 9.0% |
| | **Overall** | | | **83.65%** |

**Rating**: 83.65% → **Needs Attention** :orange_circle:

**Weakest categories** (focus fixes here):
1. Backend API Contract (70%) — weight 15% → highest impact if improved
2. API Integration (75%) — weight 15% → second highest impact

**Improvement projection**: Fixing API contracts to 90% and integration to 90% would yield:
- New weighted: 6.4 + 13.5 + 9.0 + 13.5 + 8.5 + 9.6 + 11.4 + 8.0 + 9.0 = **88.9%**
- New rating: **Minor Issues** :yellow_circle:

---

## Selective Audit Scoring

When running only selected categories, normalize weights to 100%:

**Example**: Running only categories 2, 4, 7 (weights: 15%, 15%, 12%):

```
total_selected_weight = 0.15 + 0.15 + 0.12 = 0.42

C2 normalized = 0.15 / 0.42 = 0.357
C4 normalized = 0.15 / 0.42 = 0.357
C7 normalized = 0.12 / 0.42 = 0.286
                                -----
                                1.000 ✓
```

The report should clearly indicate:
- Which categories were included
- That the score represents a partial audit
- Recommendation to run full audit for complete health assessment
