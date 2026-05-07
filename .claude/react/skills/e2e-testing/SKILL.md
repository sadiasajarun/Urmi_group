---
skill_name: e2e-testing
applies_to_local_project_only: true
auto_trigger_regex:
  [
    e2e test,
    playwright,
    end-to-end,
    generate test,
    integration test,
    create test,
    e2e fixtures,
    playwright fixtures,
    test fixtures,
    test data,
    page objects,
    page object pattern,
    POM,
  ]
tags: [e2e-testing, playwright, test-generation, react, fixtures, page-objects]
related_skills: [design-qa-figma, design-qa-html, fix-bug]
---

# E2E Testing for React/Playwright

**IMPORTANT: Use Playwright only. Do not use Cypress or other E2E frameworks.**

Comprehensive guide for end-to-end testing in React applications using Playwright, including test generation, fixtures, and page object patterns.

## ⚠️ Wait Pattern Anti-Patterns (Must Read)

Tests generated against SPAs fail silently when you pick the wrong wait primitive. The most common failure mode in CI is tests that pass locally but hang in CI because a browser event never fires.

| Pattern                                                                | Use                                                                    |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `page.waitForLoadState('load')`                                        | ❌ **Never.** Does not fire in SPAs that keep a WebSocket / SSE / dev-HMR socket open. |
| `page.waitForLoadState('domcontentloaded')`                            | ✅ Initial navigation only — waits for the HTML doc, not your app's data |
| `page.waitForLoadState('networkidle')`                                 | ✅ Data-fetch completion — flaky if WebSockets stay open; budget a short timeout with `.catch()` |
| `page.waitForSelector('[data-testid="..."]', { state: 'visible' })`    | ✅ **Best default** — waits for a specific UI condition                |
| `await expect(locator).toBeVisible({ timeout })`                       | ✅ Assertion-style readiness — prefer in tests over raw waits          |

**Rule of thumb:** prefer *locator readiness* over *global load states*. Waiting for a concrete `data-testid` (or semantic selector like `[role="main"]`) is deterministic; waiting for a browser event in an SPA is not.

> **Enforced by** `.claude/gates/no-bad-waits.sh <target_dir>` — a deterministic gate that greps every Playwright spec for `waitForLoadState('load')` and fails if any occurrence is found. Run it standalone (`bash .claude/gates/no-bad-waits.sh .`) or let the test-browser gate invoke it. See also RULE-T0 in `.claude/rules/phases/test-browser.rules.md`.

## Table of Contents

- [Quick Start](#quick-start)
- [Critical Testing Principles](#critical-testing-principles)
- [Test Infrastructure](#test-infrastructure)
- [Strict Assertion Patterns](#strict-assertion-patterns)
- [Page Objects](#page-objects)
- [Test Fixtures](#test-fixtures)
- [Autonomous Exploration Mode](#autonomous-exploration-mode)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
- [Reference Documentation](#reference-documentation)

---

## Quick Start

### Prerequisites

E2E tests run against the **real backend** (no mocking).

**Required:**

1. Backend server running: `cd backend && npm run start:dev`
2. Frontend dev server running: `cd frontend && npm run dev`
3. Test users seeded in database

### Run Tests

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- my-items.spec.ts

# Run with UI (watch mode)
npm run test:e2e:ui

# Run with browser visible
npm run test:e2e:headed
```

---

## Critical Testing Principles

### The Core Problem

Tests that pass but real pages fail. This happens when tests:

1. Only check visibility, not functionality
2. Silently swallow errors
3. Don't verify navigation destinations
4. Skip tests via conditional logic

### The Solution: Strict Browser-Based Testing

**Every test must:**

1. Test through the real UI (same path as users)
2. Fail explicitly when things don't work
3. Verify actual outcomes (not just "something appeared")
4. Test button clicks lead to expected destinations

---

## Test Infrastructure

### Directory Structure

```
frontend/e2e/
├── tests/                     # Test files by feature
│   ├── auth/
│   │   ├── login.spec.ts
│   │   ├── token-refresh.spec.ts
│   │   └── timing-issues.spec.ts
│   ├── dashboard/
│   │   ├── dashboard-home.spec.ts
│   │   └── my-items.spec.ts
│   ├── flows/
│   │   └── item-lifecycle.spec.ts
│   └── error-handling/
│       └── api-errors.spec.ts
├── page-objects/              # Page Object Models
│   ├── base.page.ts
│   └── dashboard/
├── fixtures/                  # Test fixtures
│   ├── auth.fixture.ts
│   └── base.fixture.ts
├── utils/                     # Test utilities
│   ├── strict-assertions.ts   # CRITICAL: Use these
│   ├── ui-auth-helpers.ts
│   ├── token-testing.ts
│   └── network-simulation.ts
├── global-setup.ts
└── global-teardown.ts
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/tests",

  // IMPORTANT: Disable parallel to avoid auth conflicts
  fullyParallel: false,
  workers: 1,

  // Global setup verifies environment before tests
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",

  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // Start both backend and frontend
  webServer: [
    {
      command: "cd ../backend && npm run start:dev",
      url: "http://localhost:3000/api",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: "npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
```

---

## Strict Assertion Patterns

### Pattern 1: Content OR Empty State (NEVER both or neither)

```typescript
// ❌ BAD - Silently passes if BOTH fail
await Promise.race([
  content.waitFor().catch(() => {}),
  emptyState.waitFor().catch(() => {}),
]);

// ✅ GOOD - Fails explicitly if neither appears
import { expectContentOrEmptyState } from "../utils/strict-assertions";

const result = await expectContentOrEmptyState(
  itemCards.first(),
  emptyStateMessage,
  15000,
);

if (result === "content") {
  // Verify content has actual data
  await expectContentLoaded(itemCards.first(), { notEmpty: true });
} else {
  // Verify empty state has proper messaging
  await expectContentLoaded(emptyStateMessage, { notEmpty: true });
}
```

### Pattern 2: Button Click with Destination Verification

```typescript
// ❌ BAD - Only checks visibility
await expect(button).toBeVisible();

// ✅ GOOD - Verifies full interaction flow
await expect(button).toBeVisible();
await expect(button).toBeEnabled();
await button.click();

// Verify navigation
await expect(page).toHaveURL(/\/expected-path/);

// Verify destination page is functional
await page.waitForLoadState("networkidle");
const form = page.locator('form, [data-testid="expected-form"]');
await expect(form).toBeVisible();
```

### Pattern 3: Form Save Verification

```typescript
// ❌ BAD - Only checks form value
await input.fill("new value");
await expect(input).toHaveValue("new value");

// ✅ GOOD - Verifies data persisted
await input.fill("new value");
await submitButton.click();

// Wait for save to complete
await page.waitForLoadState("networkidle");

// Verify by reloading
await page.reload();
await expect(input).toHaveValue("new value"); // Persisted!
```

### Pattern 4: No Conditional Test Skipping

```typescript
// ❌ BAD - Silently passes if no items
if (hasItems) {
  // test something
}

// ✅ GOOD - Fails if precondition not met
const result = await expectContentOrEmptyState(itemCards, emptyState);

// If you expect items to exist, assert it
expect(result).toBe("content");

// Or handle both cases explicitly
if (result === "content") {
  // Test with items
} else {
  // Test empty state behavior
}
```

### Pattern 5: Stats Must Show Real Numbers

```typescript
// ❌ BAD - Just checks visibility
await expect(statElement).toBeVisible();

// ✅ GOOD - Verifies actual data
import { expectStatLoaded } from "../utils/strict-assertions";

const value = await expectStatLoaded(statElement);
// value is a number, not '...' or 'Loading'
```

---

## Page Objects

### Base Page with Strict Helpers

```typescript
// e2e/page-objects/base.page.ts
import { Page, Locator, expect } from "@playwright/test";
import { expectContentOrEmptyState } from "../utils/strict-assertions";

export abstract class BasePage {
  constructor(protected readonly page: Page) {}
  abstract readonly url: string;

  async navigate(): Promise<void> {
    await this.page.goto(this.url);
    await this.page.waitForLoadState("networkidle");
  }

  // STRICT helper - fails if neither appears
  protected async waitForContentOrEmpty(
    contentLocator: Locator,
    emptyStateLocator: Locator,
  ): Promise<"content" | "empty"> {
    return expectContentOrEmptyState(contentLocator, emptyStateLocator, 15000);
  }
}
```

### Example Page Object

```typescript
// e2e/page-objects/dashboard/my-items.page.ts
import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

export class MyItemsPage extends BasePage {
  readonly url = "/dashboard/my-items";

  readonly itemCards: Locator;
  readonly emptyState: Locator;
  readonly continueEditButton: Locator;
  readonly newProposalButton: Locator;

  constructor(page: Page) {
    super(page);
    this.itemCards = page.locator('[data-testid="item-card"]');
    this.emptyState = page.locator("text=No items yet");
    this.continueEditButton = page.locator('button:has-text("Edit")');
    this.newProposalButton = page.locator('button:has-text("Create New")');
  }

  async waitForItems(): Promise<"content" | "empty"> {
    return this.waitForContentOrEmpty(this.itemCards.first(), this.emptyState);
  }

  async clickEdit(): Promise<void> {
    const btn = this.continueEditButton.first();
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
    await btn.click();
  }
}
```

---

## Test Fixtures

### UI-Based Authentication

```typescript
// e2e/fixtures/auth.fixture.ts
import { test as baseTest, Page, expect } from "@playwright/test";
import { loginViaUI, verifyAuthCookies } from "../utils/ui-auth-helpers";

export const testUsers = {
  user: {
    email: "user@example.com",
    password: "Password123!",
  },
  admin: {
    email: "admin@example.com",
    password: "Password123!",
  },
};

export const test = baseTest.extend({
  // IMPORTANT: Login via UI, NOT cookie injection
  loggedInPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Real UI login
    await loginViaUI(page, testUsers.user);

    // Verify cookies actually set
    await verifyAuthCookies(context);

    await use(page);
    await context.close();
  },
});
```

### Complete Test Example

```typescript
// e2e/tests/dashboard/my-items.spec.ts
import { test, expect } from "../../fixtures/auth.fixture";
import { MyItemsPage } from "../../page-objects/dashboard/my-items.page";
import {
  expectContentLoaded,
  expectDataLoaded,
  expectContentOrEmptyState,
} from "../../utils/strict-assertions";

test.describe("My Items - Edit Flow", () => {
  let myItemsPage: MyItemsPage;

  test.beforeEach(async ({ loggedInPage }) => {
    myItemsPage = new MyItemsPage(loggedInPage);
    await myItemsPage.navigate();

    // STRICT: Wait for data to load, fail if loading persists
    await expectDataLoaded(loggedInPage);
  });

  test("should navigate to edit page when clicking Edit", async ({
    loggedInPage: page,
  }) => {
    // Wait for content or empty state
    const result = await myItemsPage.waitForItems();

    if (result === "content") {
      // Click Edit
      await myItemsPage.clickEdit();

      // STRICT: Verify navigation to edit page
      await expect(page).toHaveURL(/\/dashboard\/items\/.*\/edit/, {
        timeout: 10000,
      });

      // STRICT: Verify edit form loads with data
      await page.waitForLoadState("networkidle");
      const titleInput = page.locator('input[name="title"]');
      await expect(titleInput).toBeVisible();

      // STRICT: Form must have pre-populated data
      const value = await titleInput.inputValue();
      expect(value.length).toBeGreaterThan(0);
    }
  });
});
```

---

## Autonomous Exploration Mode

An automated testing mode where an agent freely navigates the application, interacts with ALL features, documents bugs, and generates fix suggestions.

### When to Use

- **Discovery Testing**: Explore a new codebase to find issues
- **Regression Hunting**: Run after major changes to find broken flows
- **Smoke Testing**: Quick validation that core paths work
- **Coverage Gaps**: Find untested areas of the application
- **Fix Generation**: Automatically generate fixes for common issues (404s, missing routes)

### How It Works

1. **Navigate**: Agent visits pages using links, buttons, and known routes
2. **Interact**: Clicks ALL buttons, fills ALL forms, tests ALL functionality
3. **Detect**: Monitors for console errors, network failures, 404s, UI anomalies
4. **Document**: Records bugs with reproduction steps and screenshots
5. **Generate Fixes**: Creates fix suggestions for 404s, broken links, missing imports

### Quick Start

```typescript
// e2e/autonomous/exploration.spec.ts
import { test } from "../fixtures/auth.fixture";
import { ExplorationAgent } from "./exploration-agent";

test("autonomous exploration with fix generation", async ({ loggedInPage }) => {
  const agent = new ExplorationAgent(loggedInPage, {
    maxDuration: 5 * 60 * 1000, // 5 minutes
    maxActions: 100,
    screenshotOnBug: true,
    avoidDestructive: true,
    outputDir: "./exploration-reports",
    // Enable comprehensive testing
    testAllClickables: true, // Click EVERY clickable element
    testForms: true, // Test search, filter, forms
    testCRUD: false, // Create/delete with real data
    // Enable fix generation
    generateFixes: true,
    fixOutputDir: "./exploration-reports/auto-fixes",
  });

  const result = await agent.explore();
  await result.writeReport();

  console.log(`Bugs found: ${result.bugs.length}`);
  console.log(`Fixes generated: ${result.fixes.length}`);
});
```

### Run Commands

```bash
# Run autonomous exploration (all tests)
npm run e2e:explore

# Quick exploration (1 minute, 30 actions)
npm run e2e:explore:quick

# Public pages only (unauthenticated)
npm run e2e:explore:public

# Authenticated flows
npm run e2e:explore:auth

# With fix generation enabled
npm run e2e:explore:fix

# With CRUD testing (creates real data, then cleans up)
npm run e2e:explore:crud

# Run all exploration tests sequentially
npm run e2e:explore:all

# With browser visible
npm run e2e:explore:headed
```

### Configuration Options

| Option                    | Type      | Default                                          | Description                             |
| ------------------------- | --------- | ------------------------------------------------ | --------------------------------------- |
| `maxDuration`             | number    | 300000                                           | Max exploration time (ms)               |
| `maxActions`              | number    | 100                                              | Max interactions before stopping        |
| `avoidDestructive`        | boolean   | true                                             | Skip delete/logout actions              |
| `screenshotOnBug`         | boolean   | true                                             | Capture screenshot on bug               |
| `focusAreas`              | string[]  | []                                               | URL prefixes to prioritize              |
| `excludeAreas`            | string[]  | []                                               | URL prefixes to skip                    |
| **Comprehensive Testing** |           |                                                  |                                         |
| `testAllClickables`       | boolean   | true                                             | Click every button, link, tab           |
| `testForms`               | boolean   | true                                             | Test search, filter, form functionality |
| `testCRUD`                | boolean   | false                                            | Test create/delete with real data       |
| `cleanupTestData`         | boolean   | true                                             | Delete test data after exploration      |
| **Fix Generation**        |           |                                                  |                                         |
| `generateFixes`           | boolean   | false                                            | Generate fix suggestions for bugs       |
| `fixOutputDir`            | string    | auto-fixes                                       | Directory for generated fixes           |
| `fixTypes`                | FixType[] | ['missing-route', 'broken-link', 'missing-page'] | Types of fixes to generate              |

### Bug Detection

The agent detects:

- **Console Errors**: Uncaught exceptions, TypeErrors, ReferenceErrors
- **Network Failures**: 4xx/5xx API responses, timeouts
- **Broken Links**: 404s when clicking links (with clicked element context)
- **Loading Issues**: Stuck spinners, data never loads
- **Empty Content**: Neither content nor empty state appears
- **Navigation Failures**: Click doesn't lead to expected page
- **Form Errors**: Validation failures, submission errors

### Fix Generation

When `generateFixes: true`, the agent generates fix suggestions for:

| Bug Type                        | Fix Generated                          |
| ------------------------------- | -------------------------------------- |
| 404 Navigation                  | Route definition + page component stub |
| Broken Link                     | Corrected href or missing page         |
| Missing Import (ReferenceError) | Import statement suggestion            |

Fixes are written to `auto-fixes/` directory:

- `fixes-summary.md` - Human-readable summary with code snippets
- `fixes.json` - Structured data for programmatic access
- `fix-001-*.tsx` - Individual fix files

### Bug Report Output

Reports are written to `./exploration-reports/` as markdown:

```markdown
# Exploration Bug Report

**Date**: 2024-01-15
**Duration**: 4m 32s
**Pages Visited**: 12
**Bugs Found**: 3
**Fixes Generated**: 2

## Bug #1: broken_link

**Severity**: Major
**URL**: /dashboard/items
**HTTP Status**: 404
**Clicked Element**: Add Item
**Target URL**: /items/new

### Reproduction Steps

1. Navigate to /dashboard
2. Click "Items" link
3. Click "Add Item" button

### Screenshot

![bug-001](./screenshots/bug-001.png)

## Generated Fixes

### fix-001: Add missing route for /dashboard/items/new

**Type**: missing-route
**Priority**: high

Files to modify:

- ✏️ `app/routes/user.routes.ts`
- ➕ `app/pages/dashboard/items/new.tsx`

See `auto-fixes/fixes-summary.md` for full details.
```

### Status Document Integration

The agent automatically updates `.claude-project/status/frontend/E2E_QA_STATUS.md` with:

- Exploration session metrics (duration, pages, actions, bugs)
- Bug summary by severity
- Generated fixes list
- All pages covered across test runs

### Reference

See [resources/autonomous-exploration.md](./resources/autonomous-exploration.md) for:

- Complete implementation templates
- Navigation algorithm details
- Bug detection strategies
- Form filling patterns
- Fix generation logic

---

## Anti-Patterns to Avoid

### 1. Silent Error Swallowing

```typescript
// ❌ NEVER DO THIS
await Promise.race([
  element.waitFor().catch(() => {}), // Silent failure!
]);
```

### 2. Cookie Injection Instead of UI Login

```typescript
// ❌ BAD - Bypasses real auth flow
await context.addCookies([{ name: "token", value: "xyz" }]);

// ✅ GOOD - Tests real auth flow
await loginViaUI(page, credentials);
await verifyAuthCookies(context);
```

### 3. Visibility Without Functionality

```typescript
// ❌ BAD - Button might be broken
await expect(button).toBeVisible();

// ✅ GOOD - Tests actual functionality
await expect(button).toBeVisible();
await expect(button).toBeEnabled();
await button.click();
await expect(page).toHaveURL(/expected-destination/);
```

### 4. Conditional Test Skipping

```typescript
// ❌ BAD - Silently skips test
if (await element.isVisible()) {
  // test code
}

// ✅ GOOD - Explicit assertion
await expect(element).toBeVisible();
// test code
```

### 5. Direct API Calls in Tests

```typescript
// ❌ BAD - Bypasses frontend
const response = await fetch('/api/login', { ... });

// ✅ GOOD - Tests through UI
await page.goto('/login');
await page.fill('[name="email"]', email);
await page.click('button[type="submit"]');
```

---

## Verification Strategy

After writing/fixing a test:

1. **Run the test**: `npm run test:e2e:headed -- <file>`
2. **Break the feature**: Disable the onClick handler
3. **Verify test FAILS**: Previously passing test should now fail
4. **Restore the feature**: Re-enable the handler
5. **Verify test PASSES**: Test should pass again

If a test passes when the feature is broken, the test is worthless.

---

## Reference Documentation

### Utility Files

- `e2e/utils/strict-assertions.ts` - CRITICAL: Use these helpers
- `e2e/utils/ui-auth-helpers.ts` - UI-based login
- `e2e/utils/token-testing.ts` - Token expiry simulation
- `e2e/utils/network-simulation.ts` - Network condition mocking

### Official Documentation

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

---

**Line Count**: ~470 lines (under 500 limit)
