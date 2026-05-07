---
skill_name: html-to-react-converter
applies_to_local_project_only: true
auto_trigger_regex:
  [convert html, html to react, migrate html, static html, html prototype]
tags: [converters, html, react, migration]
related_skills: [figma-to-react-converter, design-qa-html]
---

# HTML to React Conversion Guide

Step-by-step guide for converting static HTML/Tailwind CSS templates into React components following your project's frontend patterns.

---

## When to Use This Guide

- Converting HTML mockups or prototypes to React components
- Migrating static pages to React
- Extracting reusable components from HTML templates
- Refactoring inline JavaScript to React hooks

---

## Step 0: Read HTML Source (MANDATORY — Before Any Conversion)

Before applying ANY conversion rules below, you MUST complete this step for EACH HTML file:

1. **Read the HTML file completely** using the Read tool — do NOT skim, grep, or summarize
2. **Extract and record** (write down explicitly, not just mentally):
   - All visible text strings — exact, character-for-character (page titles, headings, button labels, placeholders, link text)
   - All CSS values from `<style>` block — every padding, margin, border-radius, font-size, box-shadow, color
   - All interactive elements — forms (field names, types, placeholders), buttons (labels, types), toggles, checkboxes
   - **Commonly-missed elements** — check IF these exist in the HTML, and if so, include them:
     - Social/OAuth login buttons (if present)
     - Dividers/separators between sections (if present)
     - Password visibility toggles (if present)
     - Terms/privacy/consent checkboxes (if present)
     - Input prefix/suffix icons (if present)
     - Entrance animations and hover effects (if present)
3. **Verify completeness** — re-read the HTML to confirm nothing was missed

**When HTML does NOT exist**: Skip this step. Design from PROJECT_KNOWLEDGE.md and DESIGN_SYSTEM.md instead.

❌ PROHIBITED: Starting JSX conversion before completing this step
❌ PROHIBITED: Writing component structure from memory instead of from the HTML file
❌ PROHIBITED: Using approximate text (e.g., "Welcome back" when HTML says "Sign In")
❌ PROHIBITED: Using standard Tailwind classes when HTML has non-standard px values (use [Xpx] arbitrary values)
❌ PROHIBITED: Adding elements, features, or interactions that DO NOT exist in the HTML prototype

- If HTML has only grid view → do NOT add list view toggle
- If HTML has no search input → do NOT add search input
- If HTML shows a `<table>` → do NOT convert to card list — use `<table>`
- If HTML uses specific icon set (e.g., Iconify solar:\*) → use visually equivalent icons from project's icon library (e.g., lucide-react), matching the icon's meaning and size exactly
  ❌ PROHIBITED: "Improving" the HTML design — your job is CONVERSION, not REDESIGN

---

## Step 0.5: Emit Test Hooks (MANDATORY — RULE-F10)

After extracting HTML content, every **interactive** element in the React component MUST receive a stable `data-testid` attribute. HTML prototypes rarely include test hooks, but Playwright specs authored by the test phase depend on them. Omitting `data-testid` is the #1 cause of selector mismatches in the acceptance test phase.

### Naming convention

`data-testid="{page}-{element}[-{action}]"` — lowercase, kebab-case, derived from:

- `{page}` = page slug from the route (e.g. `login`, `admin-users`, `item-create`)
- `{element}` = role or purpose (e.g. `email-input`, `submit`, `filter-status`, `row`)
- `{action}` = optional, disambiguates multiple elements of the same type

### Required coverage

Every element matching any of these MUST carry a `data-testid`:

| Element                                    | Example                                                    |
| ------------------------------------------ | ---------------------------------------------------------- |
| `<input>` / `<textarea>` / `<select>`      | `data-testid="login-email"`                                |
| `<button>` / `<a>` acting as action        | `data-testid="login-submit"`, `data-testid="nav-logout"`   |
| Modal / dialog containers                  | `data-testid="confirm-modal"`                              |
| Modal triggers                             | `data-testid="users-delete-btn"`                    |
| List/table row root element                | `data-testid="users-row"`                           |
| Filter chips / tabs                        | `data-testid="users-filter-all"`                    |
| Status badges                              | `data-testid="status-badge"`                               |
| Empty-state + error-state placeholders     | `data-testid="users-empty"`                         |
| Language / theme switchers                 | `data-testid="lang-switcher"`                              |

### Not required

Purely decorative elements (dividers, icons inside buttons, static headings) do NOT need `data-testid`. Prefer accessible-name-based selectors for those.

### Example

```tsx
// ❌ No test hooks — tests will have to rely on brittle text selectors
<input type="email" placeholder="Email" {...field} />
<button type="submit">Log in</button>

// ✅ Stable test hooks
<input data-testid="login-email" type="email" placeholder="Email" {...field} />
<button data-testid="login-submit" type="submit">Log in</button>
```

❌ PROHIBITED: Shipping a page with zero `data-testid` attributes on interactive elements.
❌ PROHIBITED: Reusing the same `data-testid` for different elements on the same page.

---

## Quick Conversion Reference

| HTML Pattern                              | React Equivalent                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| `class="..."`                             | `className="..."`                                                         |
| `for="inputId"`                           | `htmlFor="inputId"`                                                       |
| `onclick="fn()"`                          | `onClick={handleFn}`                                                      |
| `onchange="fn()"`                         | `onChange={handleChange}`                                                 |
| `<a href="./page.html">`                  | `<Link to="/page">`                                                       |
| `id="modal" class="hidden"`               | `{isOpen && <Modal />}`                                                   |
| Inline `<script>` functions               | React hooks (`useState`, `useCallback`)                                   |
| `document.getElementById()`               | `useRef()` or state                                                       |
| `window.location.href = ...`              | `useNavigate()` hook                                                      |
| `<input value="...">` (static)            | Controlled input with `useState`                                          |
| Iconify `<iconify-icon icon="solar:...">` | Equivalent `lucide-react` icon with same `width`/`height`                 |
| `width="24" height="24"` on icons         | `className="w-6 h-6"` (24px = w-6 h-6) or `className="w-[24px] h-[24px]"` |
| `width="20" height="20"` on icons         | `className="w-5 h-5"` (20px = w-5 h-5)                                    |
| `width="16" height="16"` on icons         | `className="w-4 h-4"` (16px = w-4 h-4)                                    |
| `width="12" height="12"` on icons         | `className="w-3 h-3"` (12px = w-3 h-3)                                    |

---

## Component Extraction Strategy

### Step 1: Identify Reusable Patterns

Look for repeating HTML structures:

```html
<!-- Repeating card pattern in HTML -->
<div class="bg-white rounded-xl p-4 shadow-sm">
  <h3 class="font-medium">Title 1</h3>
  <p class="text-neutral-500">Description 1</p>
</div>
<div class="bg-white rounded-xl p-4 shadow-sm">
  <h3 class="font-medium">Title 2</h3>
  <p class="text-neutral-500">Description 2</p>
</div>
```

Extract to component:

```tsx
interface CardProps {
  title: string;
  description: string;
}

function Card({ title, description }: CardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="font-medium">{title}</h3>
      <p className="text-neutral-500">{description}</p>
    </div>
  );
}

// Usage
<Card title="Title 1" description="Description 1" />
<Card title="Title 2" description="Description 2" />
```

### Step 2: Identify Layout Components

Wrap page structure in layout components:

```tsx
// Layout component extracted from repeating page wrapper
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-neutral-50 shadow-xl overflow-hidden relative flex flex-col pb-28">
      <Header />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <BottomNavigation />
    </div>
  );
}
```

### Step 3: Identify Stateful Components

Any element with JavaScript interaction becomes stateful:

- Toggle visibility → `useState<boolean>`
- Form inputs → `useState` or React Hook Form
- Lists with selection → `useState<string | null>`
- Counters/timers → `useState<number>`

---

## Before/After Examples

### Example 1: Toggle Visibility (Calendar)

**HTML with inline JavaScript:**

```html
<button onclick="toggleCalendar()">View All</button>
<div id="calendar-collapsed" class="flex flex-col">
  <!-- Collapsed calendar content -->
</div>
<div id="calendar-expanded" class="hidden flex-col">
  <!-- Expanded calendar content -->
</div>

<script>
  function toggleCalendar() {
    const collapsed = document.getElementById("calendar-collapsed");
    const expanded = document.getElementById("calendar-expanded");
    collapsed.classList.toggle("hidden");
    expanded.classList.toggle("hidden");
  }
</script>
```

**React conversion:**

```tsx
import { useState } from "react";
import { Button } from "~/components/ui/button";

function Calendar() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <Button variant="ghost" onClick={() => setIsExpanded(!isExpanded)}>
        View All
      </Button>

      {isExpanded ? (
        <div className="flex flex-col">{/* Expanded calendar content */}</div>
      ) : (
        <div className="flex flex-col">{/* Collapsed calendar content */}</div>
      )}
    </>
  );
}
```

### Example 2: Navigation Links

**HTML:**

```html
<a href="./user/home.html" class="text-primary-600 hover:text-primary-700">
  Go to Home
</a>
```

**React with React Router:**

```tsx
import { Link } from "react-router";

<Link to="/user/home" className="text-primary-600 hover:text-primary-700">
  Go to Home
</Link>;
```

**Programmatic navigation:**

```tsx
import { useNavigate } from "react-router";

function LoginButton() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // After successful login
    navigate("/user/home");
  };

  return <Button onClick={handleLogin}>Login</Button>;
}
```

### Example 3: Form Inputs

**HTML form:**

```html
<form onsubmit="handleSubmit(event)">
  <input
    type="email"
    id="email"
    required
    placeholder="Email"
    class="w-full px-4 py-3 rounded-xl border"
  />
  <input
    type="password"
    id="password"
    required
    placeholder="Password"
    class="w-full px-4 py-3 rounded-xl border"
  />
  <button type="submit">Sign In</button>
</form>

<script>
  function handleSubmit(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    // Handle login...
  }
</script>
```

**React with React Hook Form + Zod:**

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    // Handle login with validated data
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Email"
                  className="w-full px-4 py-3 rounded-xl border"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Password"
                  className="w-full px-4 py-3 rounded-xl border"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>
    </Form>
  );
}
```

### Example 4: Dropdown Menu Toggle

**HTML:**

```html
<button onclick="toggleMenu()">
  <svg><!-- menu icon --></svg>
</button>
<div
  id="dropdown-menu"
  class="hidden absolute right-0 mt-2 bg-white rounded-xl shadow-lg"
>
  <a href="#">Option 1</a>
  <a href="#">Option 2</a>
</div>

<script>
  function toggleMenu() {
    document.getElementById("dropdown-menu").classList.toggle("hidden");
  }
</script>
```

**React conversion:**

```tsx
import { useState, useRef, useEffect } from "react";

function DropdownMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button onClick={() => setIsOpen(!isOpen)}>
        <MenuIcon />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-lg">
          <button onClick={() => setIsOpen(false)}>Option 1</button>
          <button onClick={() => setIsOpen(false)}>Option 2</button>
        </div>
      )}
    </div>
  );
}
```

---

## Step-by-Step Conversion Checklist

### Phase 1: Analysis

- [ ] Read through the entire HTML file
- [ ] Identify all `<script>` blocks and inline event handlers
- [ ] List all interactive elements (buttons, forms, toggles)
- [ ] Identify repeating patterns that should be components
- [ ] Note any external CSS files or inline styles

### Phase 2: Structure

- [ ] Create component file with TypeScript
- [ ] Define props interface with JSDoc comments
- [ ] Convert `class` to `className` throughout
- [ ] Convert `for` to `htmlFor` on labels
- [ ] Remove all `id` attributes used only for JS selection

### Phase 3: Interactivity

- [ ] Convert inline `onclick` to `onClick` handlers
- [ ] Replace DOM manipulation with `useState`
- [ ] Convert `window.location.href` to `useNavigate()`
- [ ] Replace `<a href>` with `<Link to>`

### Phase 4: Forms

- [ ] Set up React Hook Form with `useForm`
- [ ] Create Zod schema for validation
- [ ] Convert inputs to controlled components
- [ ] Add `FormField` wrappers with error messages

### Phase 5: Styling

- [ ] Keep Tailwind classes as-is (they work in React)
- [ ] Use `cn()` utility for conditional classes
- [ ] Replace `hidden` class toggling with conditional rendering

### Phase 6: Route Wiring (MANDATORY — After All Pages Converted)

After converting all HTML pages to React components, split routes into separate files:

1. **Create `app/routes/auth.routes.ts`** — guest-only routes (login, signup, forgot-password)
   - Export as `authRoutes` array
   - Use `route()` from `@react-router/dev/routes`

2. **Create `app/routes/protected.routes.ts`** — authenticated user routes
   - Export as `protectedRoutes: RouteConfigEntry`
   - Wrap with `layout('components/layouts/ProtectedLayout.tsx', [...])`

3. **Create `app/routes/admin.routes.ts`** (if admin pages exist)
   - Export as `adminRoutes: RouteConfigEntry`
   - Wrap with `layout('components/layouts/AdminLayout.tsx', [...])`

4. **Update `app/routes.ts`** — import and assemble only
   - Import route groups from `./routes/*.routes.ts`
   - NO inline route definitions — routes.ts is an aggregator only

❌ PROHIBITED: Defining all routes inline in routes.ts
❌ PROHIBITED: Leaving the routes/ folder empty

Refer to `.claude/react/docs/routing-guide.md` for exact patterns.

---

## Common Patterns

### DO: Use Conditional Rendering

```tsx
// Good - React way
{
  isVisible && <Modal />;
}

// Good - ternary for either/or
{
  isExpanded ? <ExpandedView /> : <CollapsedView />;
}
```

### DON'T: Manipulate DOM Directly

```tsx
// Bad - DOM manipulation
document.getElementById("modal").classList.remove("hidden");

// Good - React state
setIsModalOpen(true);
```

### DO: Use Typed Event Handlers

```tsx
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
  // Handle click
};
```

### DON'T: Use Inline Functions for Complex Logic

```tsx
// Bad - complex inline
<button
  onClick={() => {
    validateForm();
    submitData();
    navigate("/success");
  }}
>
  Submit
</button>;

// Good - extracted handler
const handleSubmit = useCallback(() => {
  validateForm();
  submitData();
  navigate("/success");
}, [validateForm, submitData, navigate]);

<button onClick={handleSubmit}>Submit</button>;
```

### DO: Emit `data-testid` on every interactive element

See Step 0.5 above. Convention: `{page}-{element}[-{action}]`. Omitting test hooks is the #1 cause of acceptance-test selector mismatches.

### DO: Extract Repeated JSX

```tsx
// If you copy-paste more than twice, make a component
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

{
  days.map((day, index) => <DayCell key={index} label={day} />);
}
```

---

## Integration with Workflow

This skill is one step in the fullstack pipeline. After conversion:

1. **frontend-developer agent** takes over for feature implementation
2. **api-integration skill** wires components to backend
3. **compliance-checker agent** audits the result

**CRITICAL**: During conversion, also handle:

- Mock data detection — replace any hardcoded arrays with API placeholders
- i18n setup — if project requires react-i18next, wrap visible strings in `t()`

## See Also

- [frontend-developer agent](../../agents/frontend-developer.md) - Feature implementation after conversion
- [Component Patterns](../../docs/component-patterns.md) - React component architecture
- [Routing Guide](../../docs/routing-guide.md) - React Router 7 patterns
- [Common Patterns](../../docs/common-patterns.md) - Forms with React Hook Form + Zod
- [Styling Guide](../../docs/styling-guide.md) - Tailwind CSS usage
- [TypeScript Standards](../../docs/typescript-standards.md) - Type definitions
