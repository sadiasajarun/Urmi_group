---
skill_name: e2e-test-generator
applies_to_local_project_only: false
auto_trigger_regex: [ralph e2e, generate e2e test, create e2e test]
tags: [e2e-testing, playwright, ralph-compatible]
related_skills: [e2e-testing]
---

# E2E Test Generator (Ralph Workflow)

**IMPORTANT: Use Playwright only. Do not use Cypress or other E2E frameworks.**

This skill generates Playwright E2E tests iteratively for Ralph workflow. It wraps the comprehensive patterns from `e2e-testing/SKILL.md`.

## Quick Reference

- **Status File**: `.claude-project/status/{project}/E2E_TEST_STATUS.md`
- **Test Directory**: `frontend/e2e/tests/`
- **Page Objects**: `frontend/e2e/page-objects/`
- **Fixtures**: `frontend/e2e/fixtures/`

---

## Workflow Modes

### Mode 1: Auto/Continuous (`--auto`)

**Recommended for comprehensive test generation.** Runs an infinite loop of discovery + implementation until all pages are covered and all tests pass.

```bash
/ralph e2e-tests frontend --auto
```

**Loop behavior:**
1. Discover new test cases from pages
2. Implement batch of pending tests (5 at a time)
3. Run tests to verify
4. Repeat until: no new discoveries AND no pending tests

### Mode 2: Discovery (`--discover`)

Scans the codebase and generates NEW test case entries in the status file.

```bash
/ralph e2e-tests frontend --discover
```

### Mode 3: Incremental (`--incremental`)

Implements tests for pending items already in the status file.

```bash
/ralph e2e-tests frontend --incremental
```

### Mode 4: Full (default)

Runs discovery once, then implements all pending tests.

```bash
/ralph e2e-tests frontend
```

---

## Auto Mode Loop (--auto)

When `--auto` flag is present, run continuous discovery + implementation:

```
LOOP:
  ┌─────────────────────────────────────────────────┐
  │  1. DISCOVER                                    │
  │     - Scan all pages in app/pages/**/*.tsx      │
  │     - Analyze for testable patterns             │
  │     - Add NEW test cases to status file         │
  │     - Output: "Discovered X new test cases"     │
  └─────────────────────────────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────┐
  │  2. CHECK PENDING                               │
  │     - Count items with :clipboard: status       │
  │     - If 0 pending → EXIT with success          │
  └─────────────────────────────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────┐
  │  3. IMPLEMENT BATCH                             │
  │     - Pick next 5 pending items                 │
  │     - For each: create page object + test file  │
  │     - Run test to verify                        │
  │     - Update status (pass/fail)                 │
  └─────────────────────────────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────┐
  │  4. PROGRESS REPORT                             │
  │     - Show: Completed X/Y (Z%)                  │
  │     - Show: Pass rate, failures                 │
  │     - Continue to next iteration                │
  └─────────────────────────────────────────────────┘
                         │
                         ▼
                    [LOOP BACK TO 1]
```

### Exit Conditions

The loop exits when ANY of these conditions are met:
1. **Complete**: No pending tests AND no new discoveries
2. **Max iterations**: Reached `--max-iterations` limit (default: 100)
3. **Blocked**: Same item fails 3 consecutive times

### Progress Output (every 5 items)

```
═══════════════════════════════════════════════
  E2E Test Generation Progress
═══════════════════════════════════════════════
  Iteration: 3

  Status:
  ├─ Completed: 25/88 (28%)
  ├─ Pending:   63
  ├─ Failed:    0
  └─ Blocked:   0

  This batch:
  ├─ ✓ settings-profile.spec.ts
  ├─ ✓ settings-password.spec.ts
  ├─ ✓ settings-notifications.spec.ts
  ├─ ✓ notifications-list.spec.ts
  └─ ✓ notifications-filter.spec.ts

  New discoveries this iteration: 2
═══════════════════════════════════════════════
```

### Completion Output

```
═══════════════════════════════════════════════
  E2E Test Generation Complete!
═══════════════════════════════════════════════
  Total iterations: 15
  Total tests: 88

  Results:
  ├─ ✓ Passed:  85
  ├─ ✗ Failed:  2
  └─ ⚠ Blocked: 1

  Coverage: 97%

  Failed tests require manual review:
  - documents-upload-modal.spec.ts (file input not accessible)
  - comment-delete.spec.ts (API returns 403)
═══════════════════════════════════════════════
```

---

## Discovery Phase (--discover)

When `--discover` flag is present, perform test case discovery BEFORE processing:

### Step D1: Scan Pages

```bash
# Find all page components
Glob frontend/app/pages/**/*.tsx
```

### Step D2: Analyze Each Page

For each page file, read and identify:

1. **Form Elements**: `<form>`, `<input>`, `<select>`, `<textarea>`
2. **Buttons/Actions**: `<button>`, `onClick` handlers
3. **Navigation**: `<Link>`, `useNavigate`, route params
4. **State**: `useState`, loading states, error states
5. **API Calls**: `useQuery`, `useMutation`, fetch calls, thunks

### Step D3: Generate Test Case Entries

For each identified testable scenario, generate a status file entry:

| Pattern Found | Test Case Template |
|---------------|-------------------|
| Login form | `{page}-validation.spec.ts`, `{page}-success.spec.ts`, `{page}-error.spec.ts` |
| CRUD operations | `{page}-create.spec.ts`, `{page}-read.spec.ts`, `{page}-update.spec.ts`, `{page}-delete.spec.ts` |
| List with filters | `{page}-list.spec.ts`, `{page}-filter.spec.ts`, `{page}-pagination.spec.ts` |
| Modal/Dialog | `{page}-modal-open.spec.ts`, `{page}-modal-submit.spec.ts` |
| Toggle/Switch | `{page}-toggle.spec.ts` |
| File upload | `{page}-upload.spec.ts` |
| Tabs | `{page}-tabs.spec.ts` |

### Step D4: Check Existing Coverage

Before adding a test case:
1. Check if test file already exists in `e2e/tests/`
2. Check if item already in status file
3. Only add NEW test cases that don't exist

### Step D5: Update Status File

Add new entries to the appropriate category section:

```markdown
| {test-name}.spec.ts | {route} | :clipboard: | - | - | {auto-discovered description} |
```

Update the Quick Summary counts.

### Discovery Output

After discovery, output:
```
Discovery Complete
==================
Pages scanned: X
New test cases identified: Y
- Auth: +N tests
- Dashboard: +N tests
- ...

Status file updated: .claude-project/status/{project}/E2E_TEST_STATUS.md
```

---

## Per-Item Workflow (Implementation Phase)

For each item in the status file with `:clipboard:` (Pending) status:

### Step 1: Analyze the Route

```bash
# Read the page component to understand what to test
Read frontend/app/pages/{route}.tsx
```

Identify:
- Form elements and validations
- User interactions (clicks, inputs, selections)
- Navigation flows
- API calls and expected responses
- Success/error states

### Step 2: Check Page Object

```bash
# Check if page object exists
ls frontend/e2e/page-objects/{category}/{page}.page.ts
```

If missing, create following the pattern in `e2e-testing/SKILL.md`:

```typescript
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class {PageName}Page extends BasePage {
  readonly url = '/{route}';

  // Locators
  readonly someElement: Locator;

  constructor(page: Page) {
    super(page);
    this.someElement = page.locator('[data-testid="element"]');
  }

  // Actions
  async performAction(): Promise<void> {
    await this.someElement.click();
  }

  // Assertions
  async expectSomething(): Promise<void> {
    await expect(this.someElement).toBeVisible();
  }
}
```

### Step 3: Generate Test File

Create test file at `frontend/e2e/tests/{category}/{page}.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
// OR for authenticated pages:
import { test as authTest, expect } from '../../fixtures/auth.fixture';
import { {PageName}Page } from '../../page-objects/{category}/{page}.page';

test.describe('{Page Name} Page', () => {
  let page: {PageName}Page;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new {PageName}Page(playwrightPage);
    await page.navigate();
  });

  test.describe('UI Elements', () => {
    test('should display all required elements', async () => {
      // Test visibility of key elements
    });
  });

  test.describe('User Interactions', () => {
    test('should handle {interaction}', async () => {
      // Test user actions
    });
  });

  test.describe('Validation', () => {
    test('should show error for invalid input', async () => {
      // Test validation errors
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to {destination}', async ({ page: playwrightPage }) => {
      // Test navigation
    });
  });
});
```

### Step 4: Run Test

```bash
cd frontend && npx playwright test e2e/tests/{category}/{page}.spec.ts --project=chromium
```

### Step 5: Update Status File

Update the item in `.claude-project/status/{project}/E2E_TEST_STATUS.md`:

- If PASS: Change `:clipboard:` to `:white_check_mark:`, add date and "Pass"
- If FAIL: Change `:clipboard:` to `:x:`, add error notes
- If BLOCKED: Change to `:warning:`, add blocker reason

---

## Test Categories

### Auth Tests (unauthenticated)
- Use base `test` from `@playwright/test`
- Navigate directly to auth pages
- Test form validation, success/error states

### Dashboard Tests (authenticated)
- Use `authTest` from fixtures
- `loggedInPage` fixture provides authenticated browser
- Test CRUD operations, filters, navigation

### Flow Tests (end-to-end journeys)
- Combine multiple pages in sequence
- Test complete user journeys
- Clean up created data after tests

---

## Best Practices

1. **No API Mocking** - Tests run against real backend
2. **Page Object Pattern** - All selectors in page objects
3. **Stable Selectors** - Prefer `data-testid`, roles, labels
4. **Handle Empty States** - Use `Promise.race` for content/empty
5. **Clean Test Data** - Use unique identifiers, clean up after

---

## Reference Documentation

For detailed patterns, see:
- [E2E Testing SKILL](./e2e-testing/SKILL.md) - Full testing guide
- [Test Patterns](./e2e-testing/resources/test-patterns.md)
- [Page Object Templates](./e2e-testing/resources/page-object-templates.md)

---

## Ralph Integration

This skill is designed for `/ralph e2e-tests {project}` workflow:

```bash
# AUTO MODE: Continuous discovery + implementation loop (RECOMMENDED)
/ralph e2e-tests frontend --auto

# Discover new test cases only (updates status file)
/ralph e2e-tests frontend --discover

# Implement pending tests only (no discovery)
/ralph e2e-tests frontend --incremental

# Full workflow: discover once + implement all pending
/ralph e2e-tests frontend

# Run specific category
/ralph e2e-tests frontend --category auth

# Dry run (show what would happen)
/ralph e2e-tests frontend --dry-run
```

### Flag Combinations

| Flags | Behavior |
|-------|----------|
| `--auto` | **Continuous loop**: discover → implement → repeat until done |
| (none) | Discover once + implement all pending |
| `--discover` | Only discover and add new test cases to status file |
| `--incremental` | Only implement existing pending items (no discovery) |
| `--auto --category X` | Auto mode limited to specific category |
| `--category X` | Limit to specific category |
| `--dry-run` | Preview without executing |
| `--max-iterations N` | Limit iterations for `--auto` mode (default: 100) |

### Auto Mode Examples

```bash
# Run until all tests complete (up to 100 iterations)
/ralph e2e-tests frontend --auto

# Run auto mode for specific category only
/ralph e2e-tests frontend --auto --category settings

# Limit to 20 iterations
/ralph e2e-tests frontend --auto --max-iterations 20
```

---

## Enhanced Modes (Gap Analysis, Extended Coverage, Robustness)

### Mode 5: Gap Analysis (`--analyze-gaps`)

Performs deep gap analysis between page objects and test coverage.

```bash
/ralph e2e-tests frontend --analyze-gaps
```

### Mode 6: Extended Coverage (`--extended`)

Generates comprehensive scenarios including edge cases, security, accessibility, and performance tests.

```bash
/ralph e2e-tests frontend --extended
```

### Mode 7: Robustness Improvement (`--improve-robustness`)

Analyzes existing tests for flakiness and stability issues, then fixes them.

```bash
/ralph e2e-tests frontend --improve-robustness
```

### Mode 8: Full Enhancement (`--enhance`)

Runs all enhancement phases in a continuous loop: gap analysis → extended scenarios → robustness improvement.

```bash
/ralph e2e-tests frontend --enhance
```

---

## Gap Analysis Phase (`--analyze-gaps`)

When `--analyze-gaps` flag is present, perform deep coverage analysis:

### Step G1: Build Page Object Capability Map

For each page object in `frontend/e2e/page-objects/`:

```typescript
interface PageObjectCapability {
  pageObject: string;       // e.g., "LoginPage"
  route: string;            // e.g., "/login"
  locators: string[];       // All readonly locator declarations
  actions: string[];        // All async public methods
  assertions: string[];     // All expect* methods
}
```

**Algorithm:**
1. Parse each `.page.ts` file
2. Extract class definition and extends clause
3. Identify all `readonly` locator declarations
4. Extract all `async` methods as actions
5. Filter `expect*` methods as assertions

### Step G2: Build Test Coverage Map

For each test file in `frontend/e2e/tests/`:

```typescript
interface TestCoverageItem {
  testFile: string;
  pageObjectUsed: string;
  locatorsAccessed: string[];    // Locators used in tests
  actionsInvoked: string[];      // Page object methods called
  testCases: string[];           // test() titles
}
```

**Algorithm:**
1. Parse each `.spec.ts` file
2. Extract imported page objects
3. Track method invocations on page object instances
4. Extract `test.describe` and `test()` titles

### Step G3: Gap Detection

Compare capability map against coverage map:

```typescript
interface GapReport {
  untestedLocators: {
    pageObject: string;
    locator: string;
    reason: 'never_accessed' | 'partial_coverage';
  }[];
  untestedActions: {
    pageObject: string;
    action: string;
    recommendation: string;
  }[];
  missingScenarios: {
    pageObject: string;
    pattern: string;
    suggestedTest: string;
  }[];
  coverageScore: {
    locators: number;    // % of locators with tests
    actions: number;     // % of actions invoked
    overall: number;
  };
}
```

### Step G4: UI Pattern Detection

Analyze page components for untested UI patterns:

| Pattern | Detection Method | Expected Tests |
|---------|------------------|----------------|
| Form with validation | `<form>` + error state | validation-success, validation-error |
| List with pagination | `pagination` + API call | pagination-next, pagination-prev |
| Modal/Dialog | `Dialog`, `Modal` components | modal-open, modal-close, modal-submit |
| Tabs | `Tab`, `TabList` components | tab-switch, tab-content-load |
| Dropdown/Select | `Select`, `Dropdown` | dropdown-open, dropdown-select |
| Toast/Notification | `toast`, `notification` | toast-success, toast-error |
| Loading states | `isLoading`, `isPending` | loading-display, loading-complete |
| Empty states | `length === 0`, `!data` | empty-state-display |
| Infinite scroll | `IntersectionObserver` | scroll-load-more |
| Search/Filter | `filter`, `search` state | search-results, search-empty |

### Step G5: User Flow Coverage Analysis

Identify missing user flows:

| Flow Type | Steps to Check | Coverage Status |
|-----------|----------------|-----------------|
| Auth flows | Register → Verify → Login → Dashboard | Check each step |
| CRUD flows | Create → Read → Update → Delete | Check each operation |
| Navigation flows | Home → Detail → Back | Check transitions |
| Action flows | Browse → Vote → Save → Comment | Check interactions |
| Error recovery | Error → Retry → Success | Check recovery paths |

### Step G6: Generate Gap Report Output

```
═══════════════════════════════════════════════════
  Gap Analysis Report - {project}
═══════════════════════════════════════════════════

Coverage Score: {overall}%
├─ Locators:   {locators}%
├─ Actions:    {actions}%
└─ Assertions: {assertions}%

Untested Locators (Top 10):
├─ MyItemsPage.deleteButtons - never tested
├─ NewItemPage.tagInput - partial coverage
└─ ...

Untested Actions (Top 10):
├─ LoginPage.clearFields() - add to validation test
├─ MyItemsPage.deleteItem() - add delete test
└─ ...

Missing UI Pattern Tests:
├─ Dashboard: Toast notifications after actions
├─ NewItem: Character counter behavior
├─ MyItems: Empty state with CTA
└─ ...

Missing User Flows:
├─ Partial: Comment thread (reply missing)
├─ None: Password change flow
└─ ...

New Test Cases to Add: {count}
═══════════════════════════════════════════════════
```

After gap analysis, add discovered gaps to status file with `:clipboard:` status.

---

## Extended Coverage Phase (`--extended`)

When `--extended` flag is present, generate comprehensive test scenarios:

### Category E1: Edge Case Tests

For each page, generate tests for edge cases:

| Edge Case | Pattern | Test Template |
|-----------|---------|---------------|
| Empty state | List/table pages | Display when no data exists |
| Single item | List pages | Behavior with exactly 1 item |
| Boundary values | Number inputs | Min, max, min-1, max+1 |
| Long content | Text inputs | Max length + overflow |
| Special characters | Text inputs | Unicode, emojis, HTML entities |
| Rapid actions | Buttons | Double-click prevention |
| Network timeout | API calls | Timeout handling |
| Concurrent actions | Multiple ops | Race conditions |

**Test Template:**

```typescript
test.describe('{PageName} - Edge Cases', () => {
  test.describe('Empty States', () => {
    test('should display empty state message when no items', async () => {
      // Setup: Ensure no data exists
      // Action: Navigate to page
      // Assert: Empty state message visible
      // Assert: CTA to create first item visible
    });
  });

  test.describe('Boundary Values', () => {
    test('should accept minimum valid input', async () => {});
    test('should accept maximum valid input', async () => {});
    test('should reject below minimum', async () => {});
    test('should reject above maximum', async () => {});
  });

  test.describe('Error Recovery', () => {
    test('should allow retry after network failure', async () => {});
    test('should preserve form data after validation error', async () => {});
  });
});
```

### Category E2: Security Tests

Generate security-focused tests:

| Security Test | What to Test | How to Test |
|---------------|--------------|-------------|
| XSS Prevention | Script injection | Enter `<script>alert('xss')</script>` |
| HTML Injection | HTML rendering | Enter `<img src=x onerror=alert(1)>` |
| Input sanitization | All text inputs | Verify output is escaped |
| Auth bypass | Protected routes | Access without login |
| Session handling | Token expiry | Test expired session |

**Test Template:**

```typescript
test.describe('{PageName} - Security', () => {
  test.describe('XSS Prevention', () => {
    test('should sanitize script tags in input', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      await page.fill('[name="title"]', maliciousInput);
      await page.click('button[type="submit"]');

      // Verify script is not executed
      const displayed = await page.textContent('[data-testid="title"]');
      expect(displayed).not.toContain('<script>');
    });
  });

  test.describe('Input Sanitization', () => {
    const maliciousInputs = [
      '<img src=x onerror=alert(1)>',
      '"><script>alert(1)</script>',
      "'; DROP TABLE users; --",
    ];

    for (const input of maliciousInputs) {
      test(`should handle: ${input.substring(0, 20)}...`, async () => {
        // Test input is properly sanitized
      });
    }
  });
});
```

### Category E3: Accessibility Tests

Generate accessibility-focused tests:

| A11y Test | What to Test | Playwright Method |
|-----------|--------------|-------------------|
| Keyboard navigation | Tab order | `page.keyboard.press('Tab')` |
| Focus visible | Focus indicators | Check `:focus-visible` |
| ARIA labels | Screen readers | `page.getByRole()` |
| Form labels | Associated labels | `page.getByLabel()` |
| Heading hierarchy | H1-H6 order | Check structure |

**Test Template:**

```typescript
import AxeBuilder from '@axe-core/playwright';

test.describe('{PageName} - Accessibility', () => {
  test.describe('Keyboard Navigation', () => {
    test('should navigate with Tab key', async ({ page }) => {
      await page.goto('/{route}');

      const focusable = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const count = await page.locator(focusable).count();

      for (let i = 0; i < count; i++) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => document.activeElement?.tagName);
        expect(focused).toBeTruthy();
      }
    });

    test('should close modal with Escape', async ({ page }) => {
      await page.click('[data-testid="open-modal"]');
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });
  });

  test.describe('WCAG Compliance', () => {
    test('should have no accessibility violations', async ({ page }) => {
      await page.goto('/{route}');
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  });
});
```

### Category E4: Performance Tests

Generate performance-focused tests:

| Performance Test | Scenario | How to Test |
|------------------|----------|-------------|
| Large list | 100+ items | Measure render time |
| Slow network | 3G simulation | Use route delay |
| Image loading | Lazy loading | Verify placeholder |
| Infinite scroll | Multiple loads | Measure memory |

**Test Template:**

```typescript
test.describe('{PageName} - Performance', () => {
  test.describe('Large Data Sets', () => {
    test('should handle 100+ items', async ({ page }) => {
      await page.goto('/{route}?limit=100');

      const startTime = Date.now();
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000);
      const items = await page.locator('[data-testid="item"]').count();
      expect(items).toBeGreaterThanOrEqual(50);
    });
  });

  test.describe('Slow Network', () => {
    test('should show loading state on slow network', async ({ page }) => {
      await page.route('**/api/**', async route => {
        await new Promise(r => setTimeout(r, 2000));
        await route.continue();
      });

      await page.goto('/{route}');
      await expect(page.locator('[data-testid="loading"]')).toBeVisible();
      await expect(page.locator('[data-testid="content"]')).toBeVisible({ timeout: 10000 });
    });
  });
});
```

---

## Robustness Improvement Phase (`--improve-robustness`)

When `--improve-robustness` flag is present, analyze and fix test stability:

### Step R1: Analyze Test History

Track test results across runs:

```typescript
interface TestRunHistory {
  testFile: string;
  runs: { date: string; result: 'pass' | 'fail'; error?: string }[];
  flakyScore: number;  // 0-100, higher = more flaky
}
```

**Flaky Detection:**
```
flakyScore = (pass_fail_alternations / total_runs) * 100
if (error includes 'timeout') → add 30 to flakyScore
if (error includes 'selector') → add 20 to flakyScore
```

### Step R2: Detect Flaky Patterns

| Pattern | Detection | Fix |
|---------|-----------|-----|
| Race condition | `click()` without wait | Add explicit wait |
| Timing issue | Fixed timeout values | Use dynamic waits |
| Selector instability | Class-based selectors | Use data-testid |
| Network race | API not awaited | Add waitForResponse |
| Animation | Click during animation | Wait for animation |

**Detection Algorithm:**

```typescript
function detectFlakyPatterns(testCode: string): FlakyPattern[] {
  const patterns = [];

  // Missing waits after clicks
  if (/\.click\(\)(?!.*await)/.test(testCode)) {
    patterns.push({ type: 'race_condition', fix: 'Add await or waitFor' });
  }

  // Class-based selectors
  if (/locator\(['"]\.[\w-]+['"]\)/.test(testCode)) {
    patterns.push({ type: 'selector_instability', fix: 'Use data-testid' });
  }

  // Hardcoded timeouts
  if (/timeout:\s*\d{4,}/.test(testCode)) {
    patterns.push({ type: 'timing_issue', fix: 'Use waitForSelector' });
  }

  return patterns;
}
```

### Step R3: Selector Stability Analysis

| Selector Type | Stability | Example |
|---------------|-----------|---------|
| `data-testid` | High | `[data-testid="submit"]` |
| `role` | High | `getByRole('button')` |
| `label` | High | `getByLabel('Email')` |
| `text` | Medium | `getByText('Submit')` |
| `class` | Low | `.btn-primary` |
| `xpath` | Low | `//div/button` |

**Improvement Recommendations:**

```typescript
// Before: Fragile selector
const button = page.locator('.btn-primary');

// After: Stable selector
const button = page.getByRole('button', { name: 'Submit' });
// OR
const button = page.locator('[data-testid="submit-button"]');
```

### Step R4: Missing Assertions Detection

| Issue | Detection | Improvement |
|-------|-----------|-------------|
| No assertions | Test without `expect()` | Add assertions |
| Only visibility | Only `toBeVisible()` | Add content checks |
| No error check | Happy path only | Add error assertions |
| No navigation | After click/submit | Add URL assertion |

### Step R5: Generate Robustness Report

```
═══════════════════════════════════════════════════
  Robustness Analysis Report - {project}
═══════════════════════════════════════════════════

Flaky Tests Detected: {count}
├─ my-items.spec.ts - Score: 65 (timing)
├─ login.spec.ts - Score: 40 (selector)
└─ ...

Selector Stability Issues: {count}
├─ 15 class-based → should use data-testid
├─ 8 tag selectors → should use roles
└─ ...

Assertion Gaps: {count}
├─ dashboard.spec.ts - Missing navigation checks
├─ new-item.spec.ts - Missing error assertions
└─ ...

Auto-Fix Applied: {count}
Priority Fixes Remaining: {count}
═══════════════════════════════════════════════════
```

### Step R6: Auto-Fix Generation

Generate and apply fixes:

```typescript
// Before: Race condition
await loginPage.submit();
expect(page.url()).toContain('/dashboard');

// After: Proper wait
await loginPage.submit();
await page.waitForURL('/dashboard', { timeout: 10000 });
expect(page).toHaveURL('/dashboard');
```

---

## Enhanced Auto Loop (`--enhance`)

When `--enhance` flag is present, run comprehensive enhancement loop:

```
ENHANCED AUTO MODE LOOP:

  ┌─────────────────────────────────────────────────┐
  │  1. GAP ANALYSIS                                │
  │     - Build capability map from page objects    │
  │     - Build coverage map from test files        │
  │     - Detect untested locators/actions          │
  │     - Identify missing UI patterns              │
  │     - Output gap report                         │
  └─────────────────────────────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────┐
  │  2. DISCOVER EXTENDED SCENARIOS                 │
  │     - Generate edge case tests                  │
  │     - Generate security tests                   │
  │     - Generate accessibility tests              │
  │     - Generate performance tests                │
  │     - Add to status file                        │
  └─────────────────────────────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────┐
  │  3. ROBUSTNESS CHECK                            │
  │     - Analyze existing tests for flakiness      │
  │     - Check selector stability                  │
  │     - Verify assertion completeness             │
  │     - Generate improvement tasks                │
  └─────────────────────────────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────┐
  │  4. PRIORITIZE WORK                             │
  │     - Robustness fixes (highest priority)       │
  │     - Gap-filling tests                         │
  │     - New scenario implementation               │
  │     - Pick batch of 5 items                     │
  └─────────────────────────────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────┐
  │  5. IMPLEMENT BATCH                             │
  │     - Create/update page objects                │
  │     - Create/update test files                  │
  │     - Apply robustness fixes                    │
  │     - Run tests to verify                       │
  └─────────────────────────────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────┐
  │  6. ANALYZE RESULTS                             │
  │     - If pass: mark complete                    │
  │     - If flaky: analyze and retry               │
  │     - If fail: root cause analysis              │
  │     - Update scores and status                  │
  └─────────────────────────────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────┐
  │  7. PROGRESS REPORT                             │
  │     - Coverage depth by category                │
  │     - Robustness scores                         │
  │     - Gap closure rate                          │
  └─────────────────────────────────────────────────┘
                         │
                         ▼
                    [LOOP BACK TO 1]
```

### Enhanced Exit Conditions

Loop exits when ANY condition is met:
1. **Complete**: All gaps filled AND all tests passing AND robustness score > 85%
2. **Max iterations**: Reached `--max-iterations` limit
3. **Blocked**: All remaining items need manual review

### Enhanced Progress Output

```
═══════════════════════════════════════════════════
  E2E Enhancement Progress - Iteration 5
═══════════════════════════════════════════════════

Coverage Depth:
├─ Basic:       78/78 (100%)
├─ Edge Cases:  45/120 (38%)
├─ Security:    12/40 (30%)
├─ A11y:        8/40 (20%)
└─ Performance: 0/20 (0%)

Robustness Scores:
├─ Flaky Score:        15 (target: <20)
├─ Selector Stability: 85%
└─ Assertion Coverage: 72%

This Batch:
├─ ✓ Fixed: login.spec.ts race condition
├─ ✓ Added: my-items-empty-state.spec.ts
├─ ✓ Added: new-item-xss.spec.ts
└─ → In Progress: settings-keyboard.spec.ts

Gaps Remaining: 83 scenarios
═══════════════════════════════════════════════════
```

### Enhanced Flag Combinations

| Flags | Behavior |
|-------|----------|
| `--enhance` | Full loop: gaps → extended → robustness → implement |
| `--enhance --category X` | Full loop for specific category only |
| `--analyze-gaps` | Gap analysis only, add to status file |
| `--extended` | Generate extended scenarios only |
| `--improve-robustness` | Fix existing tests only |
| `--enhance --max-iterations 20` | Limit enhancement iterations |

### Enhanced Examples

```bash
# Full enhancement loop (recommended)
/ralph e2e-tests frontend --enhance

# Gap analysis only
/ralph e2e-tests frontend --analyze-gaps

# Extended scenarios for auth only
/ralph e2e-tests frontend --extended --category auth

# Fix flaky tests
/ralph e2e-tests frontend --improve-robustness

# Limited enhancement run
/ralph e2e-tests frontend --enhance --max-iterations 10
```
