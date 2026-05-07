# Global Responsive Design Pattern Library

Universal patterns for React + Tailwind CSS responsive design. These patterns apply to ANY project using Tailwind CSS mobile-first approach with standard breakpoints (base, sm:640, md:768, lg:1024, xl:1280, 2xl:1480+).

**This file is shared across all projects via the .claude submodule.**
**Project-specific patterns are stored separately in `.claude-project/learning/responsive-design/project-patterns.md`.**

---

## Anti-Patterns (Don't Do This)

<!-- Anti-patterns are added here when the same issue is recorded 3+ times in issue-log.md -->

### AP-001: Sub-12px base text with scaling chain
**Pattern**: `text-[10px]/[16px] sm:text-[11px]/[18px] lg:text-[12px]/[20px]`
**Fix**: `text-[12px]/[18px] sm:text-[12px]/[18px] lg:text-[12px]/[20px]`
**Why**: Base text below 12px is unreadable on mobile. The scaling chain looks intentional but the starting point is too small.

### AP-002: xs: breakpoint usage
**Pattern**: `xs:p-[12px]`, `xs:grid-cols-2`, `xs:w-[80px]` etc.
**Fix**: Remove xs: and either move value to base or sm: breakpoint.
**Why**: xs:400px creates inconsistent layouts between iPhone SE (375px) and iPhone XR (414px). All phones (375-430px) must share identical base layout.

### AP-003: Absolute dropdown/popover with large negative offset
**Pattern**: `absolute -right-[114px]` on dropdowns or popovers
**Fix**: Use `-right-[20px]` on base with `max-w-[calc(100vw-32px)]`
**Why**: Large negative offsets push dropdowns outside 375px viewport, causing horizontal scroll or clipping.

### AP-004: lg: cascade into desktop without xl: guard
**Pattern**: Adding `lg:flex-row`, `lg:pr-[350px]`, `lg:fixed`, `lg:right-[12px]` without corresponding xl: classes
**Fix**: Before adding ANY `lg:` class, verify that an `xl:` class already defines that CSS property. If not, add `xl:{original-desktop-value}` to preserve desktop rendering.
**Why**: lg: is 1024px+ which INCLUDES desktop (1280px) when no xl: override exists. This is the #1 cause of unintended desktop appearance changes. It can move elements, hide buttons, and break layouts at desktop viewport.

### AP-005: Base value replacement without xl: preservation
**Pattern**: Changing `p-[24px]` to `p-3 sm:p-4 md:p-5 lg:p-[24px]` without `xl:p-[24px]`
**Fix**: When replacing a base value with a responsive chain, always terminate with `xl:{original-value}`. The original base value was the desktop value.
**Why**: In Tailwind mobile-first, the base value applies at ALL breakpoints including desktop. Changing it without an xl: override silently changes desktop appearance.

### AP-006: Unconditional useEffect/JS without viewport guard
**Pattern**: `useEffect(() => { document.body.style.overflow = "hidden"; }, [isOpen])` without checking viewport
**Fix**: Add `if (window.matchMedia("(min-width: 1280px)").matches) return;` at start of useEffect
**Why**: Desktop sidebar is often push-style, not overlay. Unconditional scroll lock, body style changes, or DOM manipulation affects desktop behavior unexpectedly.

### AP-007: min-w exceeding mobile viewport at base
**Pattern**: `min-w-[534px]` or any `min-w-[Npx]` where N > 430px applied at base (no breakpoint prefix)
**Fix**: Move to `md:min-w-[534px]` so it only applies at tablet+ (768px+). On mobile, let the grid flow naturally within viewport.
**Why**: Any `min-w` > 430px at base will overflow iPhone viewport (375-430px) and cause asymmetric rendering, horizontal scroll, or content clipping.

### AP-008: Cross-page layout inconsistency for same component
**Pattern**: Same component rendered in different grid configurations across pages (e.g., `lg:grid-cols-2` on page A vs `grid-cols-2` on page B)
**Fix**: After making a component responsive, grep for ALL usages of that component and verify consistent grid/flex treatment across pages.
**Why**: Agent processes files independently. When the same component appears on multiple pages, users expect consistent mobile layout. Inconsistency confuses users.

### AP-009: flex justify-between header cramped on mobile
**Pattern**: `flex items-center justify-between` containing Title/h2 + legend/stats/controls side-by-side
**Fix**: `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0`
**Detection**: `grep -rn "flex.*justify-between"` → check if children include Title + multi-element data
**Why**: At 375px, title + legend/pagination/controls cannot fit horizontally. Must stack vertically on mobile. Common in: chart headers, pagination rows, section headers.

### AP-010: overflow-x-auto inside CSS Grid/Flex without min-w-0 on ancestor
**Pattern**: Adding `overflow-x-auto` + `min-w-[Npx]` to a child component that sits inside a CSS Grid or Flex item
**Fix**: Add `min-w-0` to the Grid/Flex item ancestor that contains the overflow-x-auto element
**Detection**: When adding `overflow-x-auto` + `min-w-[N]` to any component, trace the ancestor chain for grid/flex items.
**Why**: CSS Grid/Flex items have `min-width: auto` by default. The child's `min-w-[480px]` propagates upward through the grid item, expanding the entire parent grid beyond the viewport. `overflow-x-auto` only creates a scrollbar when the container width is constrained — grid item expansion removes that constraint. This is CSS spec behavior, not a Tailwind issue.

### AP-011: Multi-panel layout shown simultaneously on mobile
**Pattern**: 3-panel layout (sidebar list + main content + detail panel) all visible at base, each getting ~33% width on 375px
**Fix**: Mobile panel toggle — show list first, switch to main content on selection, hide detail panel. Add "Back" button to return to list. Use `hidden md:flex` / `flex` conditional on selection state.
**Detection**: Any page with 3+ side-by-side panels (flex-row or grid with 3+ columns). Common in: chat/messaging, email inbox, CRM detail views.
**Why**: Standard mobile UX for chat/messaging apps. Don't just shrink panels — toggle between them.

### AP-012: Fixed-height spacers not scaled for mobile
**Pattern**: `h-[63px]` or similar fixed-height empty divs used as spacers/dividers
**Fix**: `h-[32px] md:h-[63px]` — reduce spacer height on mobile where vertical space is precious
**Why**: Desktop spacers are designed for large viewports. On mobile (667px-812px height), every pixel of vertical space matters.

---

## Good Patterns (Do This)

### GP-001: Compact CTA on mobile with icon-only
**Pattern**: Override button variant width with `!w-[36px] !min-w-[36px] !max-w-[36px]` on base, restore at sm: with original widths. Hide text with `hidden sm:inline`.
**Why**: Must override all three width properties (w, min-w, max-w) when using CVA variants with fixed widths.

### GP-002: Progressive grid columns for tablet
**Pattern**: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4`
**Why**: Never jump from 1-2 columns directly to 4+ without md/lg intermediates. iPad Mini (768px) and iPad Pro (1024px) need dedicated column counts.

### GP-003: Body scroll lock with viewport guard
**Pattern**: `useEffect` checking `window.matchMedia("(min-width: 1280px)")` to only lock scroll on mobile/tablet.
**Why**: Desktop sidebar often uses push layout so scroll lock is unnecessary and breaks UX.

### GP-004: Mobile panel toggle for multi-panel layouts
**Pattern**: Use selection state to toggle panel visibility on mobile.
```
List:  ${selected ? "hidden md:flex" : "flex"} flex-col
Chat:  ${selected ? "flex" : "hidden md:flex"} flex-col
Back:  <button className="md:hidden" onClick={() => setSelected(null)}>Back</button>
```
**Why**: Standard pattern for chat, email, CRM — toggle panels instead of cramming them side-by-side.

### GP-005: Modal mobile margin
**Pattern**: `max-w-[calc(100vw-32px)] md:max-w-[710px]` for modals
**Why**: Provides 16px side margins on mobile instead of edge-to-edge rendering.

---

## Statistics

| Metric | Count |
|--------|-------|
| Anti-Patterns | 12 |
| Good Patterns | 5 |
| Last Updated | 2026-03-12 |
| Source Projects | 1 (ivory) |
