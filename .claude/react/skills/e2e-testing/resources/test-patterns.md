# Test Patterns by Page Type

Complete test pattern templates for different page types.

## Table of Contents

- [Form Page Tests](#form-page-tests)
- [List Page Tests](#list-page-tests)
- [Detail Page Tests](#detail-page-tests)
- [Multi-Step Flow Tests](#multi-step-flow-tests)

---

## Form Page Tests

For login, signup, create/edit forms:

```typescript
test.describe('[FormPage] Tests', () => {
  test.describe('Page Load', () => {
    test('should display form elements', async () => {
      // Assert all form inputs are visible
      // Assert submit button is visible
      // Assert form title/heading is correct
    });
  });

  test.describe('Form Validation', () => {
    test('should show error for empty required fields', async () => {
      // Submit without filling required fields
      // Assert validation errors appear
    });

    test('should show error for invalid format', async () => {
      // Fill with invalid format (email, phone, etc.)
      // Assert format validation errors
    });

    test('should show error for password mismatch', async () => {
      // For signup forms with confirm password
    });
  });

  test.describe('Successful Submission', () => {
    test('should submit form with valid data', async () => {
      // Fill all fields with valid data
      // Submit form
      // Assert redirect or success message
    });
  });

  test.describe('Error Handling', () => {
    test('should display error for invalid credentials', async () => {
      // Use real invalid credentials to trigger error
      await loginPage.login('invaliduser', 'wrongpassword');
      // Assert error message displayed
      await expect(page.getByText(/invalid credentials|login failed/i)).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to related pages', async () => {
      // Click links (register, forgot password, etc.)
      // Assert navigation works
    });
  });
});
```

---

## List Page Tests

For users, items, messages:

```typescript
test.describe('[ListPage] Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate before accessing protected pages
    await authenticateAsAdmin(page);
  });

  test.describe('Page Load', () => {
    test('should display page header', async () => {
      // Assert title, count, breadcrumbs
    });

    test('should display list items', async ({ page }) => {
      // Assert list is populated
      const count = await page.locator('[data-testid="list-item"]').count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Search/Filter', () => {
    test('should filter items by search query', async () => {
      // Enter search term
      // Assert filtered results
    });

    test('should show empty state for no results', async () => {
      // Search for non-existent term
      // Assert empty state message
    });

    test('should clear search and show all items', async () => {
      // Search, then clear
      // Assert all items visible again
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to detail page on item click', async ({ page }) => {
      // Click on list item
      await page.waitForURL(/\/detail\/\d+/);
    });
  });

  test.describe('Actions', () => {
    test('should handle delete action', async () => {
      // If list has delete functionality
    });

    test('should handle bulk actions', async () => {
      // If list has bulk selection
    });
  });
});
```

---

## Detail Page Tests

For item detail pages:

```typescript
test.describe('[DetailPage] Tests', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateAsUser(page);
    // Navigate to specific detail page
    await page.goto('/items/1');
  });

  test.describe('Page Load', () => {
    test('should display item details', async () => {
      // Assert title, description, metadata
    });

    test('should display related sections', async () => {
      // Assert related data sections (history, progress, etc.)
    });
  });

  test.describe('Actions', () => {
    test('should handle primary action', async () => {
      // Click main action button
      // Assert result
    });

    test('should handle edit action', async () => {
      // If editable
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to list', async ({ page }) => {
      await page.getByRole('button', { name: /back/i }).click();
      await page.waitForURL('/items');
    });
  });
});
```

---

## Multi-Step Flow Tests

For signup with OTP, wizards:

```typescript
test.describe('[MultiStepFlow] Tests', () => {
  test.describe('Step 1: Form Input', () => {
    test('should validate and proceed to step 2', async () => {
      // Fill step 1 fields
      // Submit
      // Assert step 2 is visible
    });
  });

  test.describe('Step 2: OTP Verification', () => {
    test('should send OTP and show input', async () => {
      // Complete step 1
      // Assert OTP input appears
      // Assert countdown timer visible
    });

    test('should verify valid OTP', async () => {
      // Enter valid OTP
      // Submit
      // Assert proceed to step 3
    });

    test('should allow OTP resend after countdown', async () => {
      // Wait for countdown
      // Assert resend button enabled
    });
  });

  test.describe('Step 3: Completion', () => {
    test('should complete registration and redirect', async () => {
      // Complete all steps
      // Assert redirect to dashboard
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid OTP', async () => {
      // Enter invalid OTP
      // Assert error message
    });

    test('should handle expired OTP', async () => {
      // Test expired OTP scenario
    });
  });
});
```

---

## Complete Example: Login Page Tests

```typescript
// frontend/test/tests/auth/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/auth/login.page';

test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test.describe('Page Load', () => {
    test('should display login form', async () => {
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.signInButton).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('should show error for empty email', async () => {
      await loginPage.passwordInput.fill('password123');
      await loginPage.signInButton.click();
      await loginPage.expectEmailError();
    });
  });

  test.describe('Successful Login', () => {
    test('should redirect to dashboard on valid credentials', async ({ page }) => {
      await loginPage.login('user@example.com', 'Password123!');
      await page.waitForURL('/dashboard');
    });
  });
});
```

---

## Complete Example: List Page Tests

```typescript
// frontend/test/tests/admin/users.spec.ts
import { test, expect } from '@playwright/test';
import { UsersPage } from '../../pages/admin/users.page';
import { authenticateAsAdmin } from '../../fixtures/auth.fixture';

test.describe('Users List Page', () => {
  let usersPage: UsersPage;

  test.beforeEach(async ({ page }) => {
    await authenticateAsAdmin(page);
    usersPage = new UsersPage(page);
    await usersPage.navigate();
  });

  test('should display user list', async () => {
    await expect(usersPage.title).toBeVisible();
    const count = await usersPage.getUserCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should filter users by name', async () => {
    await usersPage.searchUser('John');
    await usersPage.expectUserVisible('John');
  });

  test('should navigate to user detail', async ({ page }) => {
    await usersPage.clickUser('John');
    await page.waitForURL(/\/admin\/users\/[\w-]+/);
  });
});
```
