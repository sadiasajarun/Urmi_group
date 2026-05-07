# Responsive Design Checklist Rules - Detailed Reference

This document is the detailed reference for all 14 responsive design rules used in the Ivory project. Each rule includes a problem description, detection grep pattern, fix template with before/after code, and related components.

Sourced from `frontend/RESPONSIVE_CHECKLIST.md` (translated from Korean).

---

## Rule 1: Feature Accessibility - "Hiding is not Solving"

### Problem

When mobile space is limited, using `hidden sm:block` to completely hide buttons. For example, a "New Order" button disappears on mobile, making a core feature inaccessible.

### Principles

- NEVER remove core feature buttons with `hidden`
- When space is insufficient, provide a compact version (icon-only, reduced text, FAB, etc.)
- `hidden` should only be used for purely supplementary elements (dividers, secondary text)

### Detection

```bash
grep -rn "hidden sm:block\|hidden md:block" frontend/app/
```

### Fix Template

**Before:**
```tsx
<div className="hidden sm:block">
  <Button>New Order</Button>
</div>
```

**After:**
```tsx
<Button className="!w-[36px] sm:!w-[135px]">
  <Icon />
  <span className="hidden sm:inline">New Order</span>
</Button>
```

### Checklist

- [ ] Are all CTA buttons accessible on mobile?
- [ ] Among elements hidden with `hidden sm:block`, are any functional elements?

### Related Components

- `layout.tsx` header buttons
- Any CTA buttons across the application

---

## Rule 2: CSS Stacking Context + z-index Collision

### Problem

`overflow-x-clip` creates a new stacking context, so a child's `z-index` cannot be compared with external elements. For example, a sidebar backdrop (`z-49`) cannot cover the header (`z-40`) when header is inside a stacking context.

### Principles

- `overflow-hidden`, `overflow-clip`, `transform`, `filter`, `will-change` all create new stacking contexts
- Minimize stacking contexts in layouts that have modal/sidebar overlays
- Conditionally lower header z-index when sidebar opens

### Detection

```bash
grep -rn "overflow-hidden\|overflow-clip\|overflow-x-clip" frontend/app/
```

Then check if containers with these properties have fixed/absolute child elements.

### Fix Template

**Before:**
```tsx
<header className="z-40">
```

**After:**
```tsx
<header className={sidebarOpen ? "z-[1] xl:z-40" : "z-40"}>
```

### Checklist

- [ ] When sidebar/modal opens, have you verified z-index of header and other fixed elements?
- [ ] Are there fixed/absolute elements inside containers with `overflow-hidden/clip`?

### Related Components

- `layout.tsx`
- `Sidebar.tsx`

---

## Rule 3: Overflow Clipping Children

### Problem

`overflow-hidden` clips notification badges that use negative positions (`top-[-7px] right-[-7px]`). The parent's overflow clips children with negative positioning.

### Principles

- Before adding `overflow-hidden` to a parent, check if any children extend beyond the parent boundary
- Badges, dropdowns, and tooltips are all affected by overflow
- Use `overflow-visible` if needed, or move the badge outside the overflow container

### Detection

```bash
grep -rn "overflow-hidden" frontend/app/
```

Then check children of matched containers for negative position values (e.g., `top-[-`, `right-[-`).

### Fix Template

**Before:**
```tsx
<div className="overflow-hidden">
  <div className="relative">
    <Bell />
    <span className="absolute top-[-7px] right-[-7px]">3</span>
  </div>
</div>
```

**After:**
```tsx
<div className="overflow-visible">
  <div className="relative">
    <Bell />
    <span className="absolute top-[-7px] right-[-7px]">3</span>
  </div>
</div>
```

### Checklist

- [ ] Are there elements with negative positions inside an `overflow-hidden` container?
- [ ] Do notification badges, dropdowns, and popovers display correctly?

### Related Components

- `NotificationPanel.tsx`
- Any component with badges

---

## Rule 4: Body Scroll Lock

### Problem

When a mobile sidebar is open, the background content still scrolls. Users can scroll content behind the overlay.

### Principles

- When mobile overlays (sidebar, modal) open, `document.body.style.overflow = "hidden"` is required
- Must restore on cleanup: `document.body.style.overflow = ""`
- On desktop (xl and above), sidebar uses push layout so scroll lock is unnecessary

### Detection

Check modal/sidebar components for the presence or absence of `document.body.style.overflow`:

```bash
grep -rn "document.body.style.overflow" frontend/app/
```

### Fix Template

**Before:**
```tsx
// No scroll lock
const Sidebar = ({ isOpen }) => {
  return isOpen ? <div className="fixed inset-0">...</div> : null;
};
```

**After:**
```tsx
const Sidebar = ({ isOpen }) => {
  useEffect(() => {
    // CRITICAL: Skip scroll lock on desktop — sidebar uses push layout
    if (window.matchMedia("(min-width: 1280px)").matches) return;

    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return isOpen ? <div className="fixed inset-0">...</div> : null;
};
```

### Checklist

- [ ] Is body scroll lock applied when sidebar/modal opens?
- [ ] Is scroll lock released on close/unmount?
- [ ] Is scroll lock guarded with `matchMedia("(min-width: 1280px)")` to skip desktop?
- [ ] Does the useEffect have NO side-effects at desktop viewport?

### Related Components

- `Sidebar.tsx`
- `CenterModal.tsx`
- All modal components

---

## Rule 5: No xs:400px Breakpoint

### Problem

The `xs:400px` breakpoint sits between iPhone SE (375px) and iPhone XR (414px). This causes iPhone SE to show 1 column while iPhone XR shows 2 columns -- completely different layouts across phone models.

### Principles

- Guarantee the **same layout for all phones in the 375-430px range**
- Consider actual device distribution when creating custom breakpoints
- Use Tailwind's default breakpoints (`sm:640px`, `md:768px`) instead
- For grids: if 2 columns works on mobile, use `grid-cols-2` at base

### Detection

```bash
grep -rn "\bxs:" frontend/app/
```

### Fix Template

**Before:**
```tsx
<div className="grid grid-cols-1 xs:grid-cols-2">
```

**After:**
```tsx
<div className="grid grid-cols-2">
```

Same layout for all phones.

### Checklist

- [ ] Do iPhone SE (375px), iPhone XR (414px), and iPhone 14 Pro Max (430px) all show the same layout?
- [ ] Are there any `xs:` breakpoint usages? They should NEVER be used in components.

### Related Components

- `theme.css` defines `xs:400px` but it should NEVER be used in components

---

## Rule 6: Touch Target Size

### Problem

Adding `min-h-[44px]` to the Button component's base variant makes ALL buttons 44px tall, including pagination buttons and inline tags that should be small.

### Principles

- The 44px touch target applies only to **standalone touch buttons**
- Applying it globally (base variant) breaks pagination, tags, and other small buttons
- Apply individually to navigation items, sidebar menu items, etc.

### Detection

```bash
grep -rn "min-h-\[44px\]" frontend/app/components/atoms/Button.tsx
```

### Fix Template

**Before:**
```tsx
// In Button.tsx CVA variants
const buttonVariants = cva("min-h-[44px] ...", { ... });
```

**After:**
```tsx
// In Button.tsx CVA variants - no global min-h
const buttonVariants = cva("...", { ... });

// Apply 44px only to standalone nav/sidebar buttons
<Button className="min-h-[44px]">Sidebar Item</Button>
```

### Checklist

- [ ] Is `min-h-[44px]` applied globally, enlarging small buttons unintentionally?
- [ ] Are pagination, tag, and inline button sizes correct?

### Related Components

- `Button.tsx`
- `Sidebar.tsx` nav items

---

## Rule 7: Parent-Child Layout Coordination

### Problem

Only adding responsive classes to child components (stat cards, recent activity) without updating the parent container. The parent's `flex gap-4` has no `flex-col` so items remain horizontal on mobile.

### Principles

- Never modify only the child; **always check and update the parent container's flex/grid direction**
- Pattern: `flex` becomes `flex flex-col lg:flex-row` for mobile vertical, desktop horizontal

### Detection

Check parent containers whenever modifying child components:

```bash
grep -rn "flex gap" frontend/app/
```

Then verify each parent has responsive direction classes.

### Fix Template

**Before:**
```tsx
<div className="flex gap-4">
  <StatCard className="w-full sm:w-1/2" />
  <StatCard className="w-full sm:w-1/2" />
</div>
```

**After:**
```tsx
<div className="flex flex-col md:flex-row gap-4">
  <StatCard className="w-full md:w-1/2" />
  <StatCard className="w-full md:w-1/2" />
</div>
```

### Checklist

- [ ] When modifying child responsive classes, did you also update the parent's flex-direction/grid-cols?
- [ ] Are there width constraint conflicts between parent and child?

### Related Components

- `OrdersManagement.tsx`
- `admin.tsx`
- `reports.tsx`

---

## Rule 8: Visual Testing Required

### Problem

Only verifying CSS changes via `grep` without actual browser rendering verification. Marking a task as complete just because `xs:` returns 0 matches.

### Principles

- **Visual verification at actual device sizes** is always required
- Use Chrome DevTools at specific viewport widths
- Test dynamic states: sidebar open, modal open, scroll state, notification badges

### Detection

N/A -- this is a process rule, not a code pattern.

### Required Viewports

| Width | Device |
|-------|--------|
| 375px | iPhone SE |
| 414px | iPhone XR |
| 430px | iPhone 14 Pro Max |
| 768px | iPad Mini |
| 820px | iPad Air |
| 1024px | iPad Pro |

### Dynamic States to Check

- [ ] Sidebar open state
- [ ] Modal open state
- [ ] Notification badges visible
- [ ] Scroll state (header shadow)

### Related Components

- All components being modified

---

## Rule 9: Dropdown/Popover Viewport Overflow

### Problem

A notification panel dropdown positioned with `absolute -right-[114px]` overflows the mobile viewport. On a 414px screen, the right side of the dropdown is clipped.

### Principles

- Absolute-positioned dropdowns/popovers must be **verified against the 375px mobile viewport**
- Desktop offset values must not be used as-is on mobile
- On mobile, reduce offsets or constrain with `max-w-[calc(100vw-32px)]`
- Always test with dropdown in the open state on mobile

### Detection

```bash
grep -rn "absolute.*-right-\[-\|absolute.*-left-\[-" frontend/app/
```

### Fix Template

**Before:**
```tsx
<div className="absolute -right-[114px] w-[450px]">
  {/* dropdown content */}
</div>
```

**After:**
```tsx
<div className="absolute -right-[20px] sm:-right-[114px] w-[calc(100vw-32px)] sm:w-[450px]">
  {/* dropdown content */}
</div>
```

### Checklist

- [ ] Do all dropdowns/popovers fit fully within a 375px viewport?
- [ ] Are right/left offsets of absolute/fixed positioned elements appropriate on mobile?
- [ ] Is there any clipped content when a dropdown is open?

### Related Components

- `NotificationPanel.tsx`
- All dropdown/popover components

---

## Rule 10: CVA Variant Override

### Problem

An `orderBtn` variant has `w-[118px]` set, but the override only adds `!min-w-[36px]`. Since `min-width` and `width` are different CSS properties, the actual rendered width remains 118px.

### Principles

- **Always read the original variant CSS** before overriding
- Override ALL three related properties: `w`, `min-w`, `max-w` to ensure the size actually changes
- Even with `!important`, the override only works on the **same property name**
- Read the variant file (Link.tsx, Button.tsx, etc.) first to understand which properties are applied

### Detection

When using a CVA component with `className` override, read the original variant definition:

```bash
grep -rn "variants" frontend/app/components/atoms/Link.tsx
grep -rn "variants" frontend/app/components/atoms/Button.tsx
```

### Fix Template

**Before:**
```tsx
<Link variant="orderBtn" className="!min-w-[36px]" />
{/* variant still applies w-[118px], so rendered width = 118px */}
```

**After:**
```tsx
<Link variant="orderBtn" className="!w-[36px] !min-w-[36px] !max-w-[36px]" />
{/* all three width properties overridden, rendered width = 36px */}
```

### Checklist

- [ ] When overriding a variant, did you read the original variant definition?
- [ ] Are there conflicting properties among `w`, `min-w`, `max-w`, `h`, `min-h`, `max-h`?

### Related Components

- `Link.tsx` `orderBtn` variant
- `Button.tsx` variants

---

## Rule 11: Mobile-First Sizing Direction

### Problem

Mobile values are larger than desktop values in the responsive chain. For example, a toggle switch is 40x22px on mobile but 32x16px on desktop -- the sizing direction is inverted.

### Principles

- Mobile-first: base is the smallest value, each breakpoint increases
- `w-[32px] lg:w-[42px]` (CORRECT) / `w-[42px] lg:w-[32px]` (WRONG)

### Detection

Compare pixel values across breakpoints in the same element:

```bash
grep -rn "w-\[.*\] lg:w-\[" frontend/app/
grep -rn "h-\[.*\] lg:h-\[" frontend/app/
```

Then manually verify that the base value is smaller than the breakpoint value.

### Fix Template

**Before:**
```tsx
<div className="w-[42px] h-[22px] lg:w-[32px] lg:h-[16px]">
{/* WRONG: mobile is larger than desktop */}
```

**After:**
```tsx
<div className="w-[32px] h-[16px] lg:w-[42px] lg:h-[22px]">
{/* CORRECT: mobile is smaller, desktop is larger */}
```

### Checklist

- [ ] Do all responsive values increase from small screen to large screen?

### Related Components

- `ToggleSwitch`
- Any component with responsive sizing

---

## Rule 12: Table Mobile Handling

### Problem

Grid-based tables use 11px text on mobile, severely degrading readability. Tables are also set to a fixed `min-w-[940px]` with no scroll wrapper, making them overflow on tablets.

### Principles

- Minimum mobile text size: 12px (never use 11px or smaller)
- Wrap tables in `overflow-x-auto` with responsive `min-w-[XXXpx]` for horizontal scrolling
- Maintain minimum padding on table rows even on mobile

### Detection

```bash
grep -rn "text-\[11px\]\|text-\[10px\]\|text-\[9px\]" frontend/app/
```

### Fix Template

**Before:**
```tsx
<div className="min-w-[940px]">
  <div className="text-[11px]">
    {/* table content */}
  </div>
</div>
```

**After:**
```tsx
<div className="overflow-x-auto">
  <div className="min-w-[700px] lg:min-w-[940px]">
    <div className="text-[12px]">
      {/* table content */}
    </div>
  </div>
</div>
```

### Checklist

- [ ] Is the table's base text size 12px or larger?
- [ ] Is horizontal scrolling available on mobile?
- [ ] **CRITICAL**: Does the `overflow-x-auto` element sit inside a CSS Grid or Flex item? If yes, add `min-w-0` to the grid/flex item ancestor. Without this, `min-width: auto` (CSS default) propagates the child's min-width upward, defeating the scroll container. (Rule 20 / AP-010)

### Related Components

- `AllFaq.tsx`
- `OrderInfoTable`
- All grid-based tables

---

## Rule 13: iPad (768-1024px) Responsive Gap

### Problem

Layouts only change at `xl:`, leaving iPad in the mobile layout with significant wasted space. The 768-1024px range (iPad Mini through iPad Pro) is missing responsive breakpoints.

### Principles

- **Add explicit `md:` (768px) and `lg:` (1024px) breakpoints to all layouts**
- If layout only changes at `xl:`, iPad gets the mobile view with wasted space
- Grid columns should scale progressively: mobile (2 cols) -> md (3 cols) -> lg (4 cols) -> xl (desktop)
- `flex-col lg:flex-row` should often be `flex-col md:flex-row` so horizontal layout starts at 768px
- Sidebar/panel max-width should scale in steps across md/lg/xl
- Table min-width should accommodate iPad without horizontal scrolling where possible

### Detection

```bash
grep -rn "xl:grid-cols\|xl:flex-row" frontend/app/
```

Check if matching files are missing `md:` or `lg:` equivalents.

### Known Patterns (from iPad fix history)

| File | Before | After |
|------|--------|-------|
| `admin.tsx` | `sm:grid-cols-2` -> `xl:grid-cols-5` | Added `md:grid-cols-3 lg:grid-cols-4` |
| `ProductStatCollection` | `md:grid-cols-2 xl:grid-cols-4` | `md:grid-cols-2 lg:grid-cols-4` |
| `UsersManagement` | `grid-cols-2 xl:grid-cols-3` | `sm:grid-cols-2 lg:grid-cols-3` |
| `reports.tsx` | `col-span-12` -> `lg:col-span-9` | `md:col-span-8 lg:col-span-9` |
| `payment.tsx` | `grid-cols-2 lg:grid-cols-3` | `grid-cols-2 md:grid-cols-3` |
| `OrderDetails` | 2-column only at `xl:` | Activated at `lg:` |
| `Messages` | `lg:max-w-[408px]` | `md:max-w-[300px] lg:max-w-[360px] xl:max-w-[408px]` |
| `AllFaq` table | `min-w-[940px]` fixed | `min-w-[700px] lg:min-w-[940px]` |

### Fix Template

**Before:**
```tsx
<div className="grid grid-cols-2 xl:grid-cols-5">
{/* Jumps from 2 columns directly to 5, iPad stuck at 2 */}
```

**After:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
{/* Progressive: 2 -> 3 -> 4 -> 5 columns */}
```

**Key pattern -- flex direction:**

```tsx
{/* Before */}
<div className="flex flex-col lg:flex-row">

{/* After */}
<div className="flex flex-col md:flex-row">
```

### Checklist

- [ ] Do all grids have `md:` or `lg:` breakpoint values?
- [ ] At iPad Pro (1024px), do grids with 2+ columns use an appropriate column count?
- [ ] In 12-column layouts, are `col-span` values properly split at `md:`?
- [ ] Are sidebar/panel `max-width` values appropriate at `md:` and `lg:`?
- [ ] If `flex-col lg:flex-row` exists, should it be `flex-col md:flex-row`?
- [ ] At 768px, 820px, and 1024px, is there excessive empty space?

### Related Components

- `admin.tsx`
- `OrdersManagement.tsx`
- `UsersManagement.tsx`
- `reports.tsx`
- `Messages.tsx`
- `payment.tsx`

---

## Rule 14: Pattern Propagation

### Problem

Fixing one instance of a problem without searching for the same pattern elsewhere in the codebase. For example, fixing the "New Order" button's `hidden sm:block` but not searching for other buttons with the same pattern. Or fixing a dropdown position without checking other dropdowns.

### Principles

- **After fixing any issue, immediately grep the entire codebase for the same pattern**
- Fixed `hidden sm:block` -> search for all other instances
- Fixed dropdown offset -> search for similar offsets
- Found a variant override problem -> check all other usages of the same variant

### Detection

N/A -- this is a process rule, not a code pattern.

### Fix Template (Search Commands)

After fixing `hidden sm:block`:
```bash
grep -rn "hidden sm:block" frontend/app/
```

After fixing a dropdown offset:
```bash
grep -rn "right-\[" frontend/app/
```

After fixing `lg:flex-row` to `md:flex-row`:
```bash
grep -rn "lg:flex-row" frontend/app/
```

After fixing a variant override:
```bash
grep -rn "variant=\"orderBtn\"" frontend/app/
```

### Checklist

- [ ] After fixing an issue, did you search the entire project for the same pattern?
- [ ] Among the search results, did you fix all other instances with the same problem?

### Related Components

- All components -- this rule applies universally after every fix

---

## Rule 15: Sidebar-Aware Breakpoints

### Problem

Tailwind breakpoints are VIEWPORT-based, not container-based. Dashboard pages have a sidebar (~280px) that reduces actual content width. Setting max-width or grid columns without accounting for sidebar leads to cramped layouts.

### Principles

- xl:1280px viewport → actual content ~960px (subtract sidebar ~280px + padding)
- At xl:, use max-width values ~150px smaller than you would without sidebar
- Grid columns: calculate remaining width after sidebar before choosing column count

### Detection

Check elements inside sidebar layouts for max-width values:

```bash
grep -rn "xl:max-w-\[" frontend/app/pages/dashboard/
```

### Fix Template

**Before:**
```tsx
<section className="xl:max-w-[534px]">
```

**After:**
```tsx
<section className="xl:max-w-[380px] 2xl:max-w-[534px]">
```

### Checklist

- [ ] Are max-width values appropriate when sidebar is open at xl: viewport?
- [ ] Did you account for sidebar width (~280px) when setting xl: constraints?

### Related Components

- `OrdersManagement.tsx`
- All dashboard pages with sidebar

---

## Rule 16: Desktop Pixel-Identical Guarantee

### Problem

Adding lg: classes (1024px+) that cascade into desktop viewport (1280px+), or changing base values that alter how CSS resolves at desktop. Even though xl:/2xl: classes are preserved, the desktop visual output changes because lg: styles apply at 1024px+ including 1280px when no xl: override exists.

This caused: sidebar toggle position changing, Log Out button disappearing, padding/spacing differences at desktop.

### Principles

- At xl: (1280px+), the page must render PIXEL-IDENTICAL to before the agent touched it
- lg: classes CASCADE into desktop unless xl: overrides the same CSS property
- Changing base values changes desktop if no xl: override exists for that property
- JavaScript (useEffect, event listeners) runs at ALL viewports unless explicitly guarded
- Prefer md: over lg: where possible — md: is farther from desktop territory

### Detection

For each edit, compare the "desktop-effective" styles before and after:
1. List all classes that apply at 1280px: base + sm: + md: + lg: + xl:
2. If ANY class in that resolved set changed, desktop appearance changed
3. Check for new lg: classes where no xl: equivalent exists

```bash
# Find lg: classes that may lack xl: counterparts
grep -rn "lg:" frontend/app/ | grep -v "xl:"
```

### Fix Template

**WRONG — lg: cascading into desktop:**
```tsx
{/* Original */}
<div className="flex-row p-[24px]">

{/* Agent adds lg: without xl: guard */}
<div className="flex-col lg:flex-row p-3 sm:p-4 md:p-5 lg:p-[24px]">
{/* At 1280px: lg:flex-row and lg:p-[24px] apply — MIGHT be identical, but risky */}
```

**WRONG — base value change without xl: preservation:**
```tsx
{/* Original: p-[24px] applied at ALL sizes including desktop */}
<div className="p-[24px] xl:flex-row">

{/* Agent changes base without xl: for padding */}
<div className="p-3 sm:p-4 md:p-5 xl:flex-row">
{/* At 1280px: md:p-5 (20px) applies — desktop padding changed from 24px to 20px! VIOLATION */}
```

**CORRECT:**
```tsx
{/* Original: p-[24px] applied at ALL sizes */}
<div className="p-[24px] xl:flex-row">

{/* Agent preserves desktop value with xl: */}
<div className="p-3 sm:p-4 md:p-5 xl:p-[24px] xl:flex-row">
{/* At 1280px: xl:p-[24px] applies. Desktop unchanged. CORRECT */}
```

**WRONG — unconditional useEffect:**
```tsx
useEffect(() => {
  if (isOpen) document.body.style.overflow = "hidden";
  return () => { document.body.style.overflow = ""; };
}, [isOpen]);
```

**CORRECT — viewport-guarded useEffect:**
```tsx
useEffect(() => {
  if (window.matchMedia("(min-width: 1280px)").matches) return;
  if (isOpen) document.body.style.overflow = "hidden";
  return () => { document.body.style.overflow = ""; };
}, [isOpen]);
```

### Checklist

- [ ] For every new lg: class, does an xl: class already define the same CSS property?
- [ ] For every base value changed, is the original value preserved at xl:?
- [ ] Are all useEffect/JS side-effects guarded with viewport check for 1280px+?
- [ ] At 1280px viewport width, would the rendered output be visually different?

### Related Components

- ALL components — this rule applies to every edit

---

## Rule 19: Horizontal Header Stacking on Mobile

### Problem

`flex justify-between` headers with a title on one side and legend/data on the other are too wide for 375px mobile viewport. The content gets cramped, text overlaps, or elements get pushed out of view. Common in chart headers (title + legend), stats sections (title + values), and section headers (title + controls).

### Principles

- Any `flex justify-between` containing Title/h2 + data children (legend, stats, amounts) MUST stack vertically on mobile
- At 375px viewport minus padding (~32px), only ~343px is available — not enough for "Title text" + "Legend $xxx" side by side
- Apply `flex-col sm:flex-row` so stacking happens below 640px
- Add `gap-2 sm:gap-0` for spacing when stacked

### Detection

```bash
grep -rn "flex.*justify-between" frontend/app/
```

Then check each match: does the element contain both a Title/heading AND data/legend/stats children? If yes, it needs `flex-col sm:flex-row`.

### Fix Template

**Before:**
```tsx
<div className="flex items-center justify-between">
  <Title as="h2" variant="sectionTitle">Total revenue last 1year</Title>
  <div className="flex items-center gap-4">
    <span>Total sales $351</span>
    <span>Net sales $66</span>
  </div>
</div>
```

**After:**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
  <Title as="h2" variant="sectionTitle">Total revenue last 1year</Title>
  <div className="flex items-center gap-4">
    <span>Total sales $351</span>
    <span>Net sales $66</span>
  </div>
</div>
```

### Checklist

- [ ] Do all `flex justify-between` headers with title + data fit within 375px?
- [ ] Is `flex-col sm:flex-row` applied to headers where children total width > ~300px?
- [ ] Chart legend areas — do they stack on mobile?
- [ ] Stats/summary bars — do title + values stack on mobile?

### Related Components

- `TodayReportChart.tsx` (legend items)
- `YearlyChart.tsx` (sidebar legends)
- `OrderTypesChart.tsx` (9 legend items)
- `MonthlyStatistics.tsx` (stats header)
- `admin.tsx` (3 chart headers)
- `PaymentManagement.tsx` (revenue chart header)
- All section headers with title + action/data
