# Urmi Group Homepage — Product Requirements Document (2026-05-07)

| Field | Value |
|---|---|
| Product | Urmi Group Marketing Homepage |
| Owner | Urmi Group / Riseup Labs |
| Status | v1 — homepage built, real assets pending |
| Source seed | [`.claude-project/status/urmi/seed-2026-05-07.yaml`](../status/urmi/seed-2026-05-07.yaml) |
| Source knowledge base | [`urmi-redesign-knowledge-base.md`](https://example.invalid/urmi-redesign-knowledge-base.md) (provided by client team, May 2026) |
| Code root | `d:\Urmi` |
| Date | 2026-05-07 |
| PRD type | Marketing site (B2B portfolio, no auth, no admin, no e-commerce) |

> This PRD was produced retrospectively by `/fullstack-pm --phase P2-prd` after the homepage was built. It documents the as-shipped behavior of the homepage and identifies the open items required to take the site from "complete code" to "shoot-ready production." Sections borrowed from the dev `generate-prd` template have been adapted to fit a marketing site (no admin dashboard section, no user-management module).

---

# Part 1: Basic Information

## Title

**Urmi Group — The wave that clothes the world.**

A single-page marketing homepage representing Urmi Group, one of Bangladesh's largest readymade garments manufacturers and the country's first Full-Green RMG group.

## Project Information

### Description

Urmi Group's existing site (`urmigroup.com`) felt generic to the client and lacked a distinct brand identity. This redesign anchors the entire homepage around Urmi's brand — anchored on the deep blue of the company logo and a wave metaphor (ঊর্মি = "wave") that ties together their river heritage, continuous improvement, and sustainable craft. The deliverable is a single-page scrolling React app that communicates four decades of craft, sustainability as the operating system (not a section), and the manufacturing capability that supports 30+ global apparel brands.

### Goals

1. **Brand-distinct first impression** — within three seconds, a visitor should understand this is sustainable, conscious manufacturing, not generic SaaS or fast-fashion.
2. **Wave + sustainability as the spine** — every section reinforces the ঊর্মি wave metaphor and the sustainability narrative without resorting to eco-cliché.
3. **B2B portfolio, not e-commerce** — communicate manufacturing capability and trust without prices, "Add to Cart," or buyer-acquisition tactics.
4. **Asset-replaceable** — every placeholder image is logged in `ASSETS.md` so swap-in is mechanical when real photography arrives.

### User Types

This is an unauthenticated marketing site. The "users" are visitors with three implicit roles:

- **Global Buyer (Primary)** — buyer at H&M / Decathlon / M&S / Puma / equivalents evaluating Urmi as a supplier. Lands on the page from a referral or search, scans the Crafts, Factories, Clients, and Sustainability sections, then taps "Become a Buyer" or "Visit a Factory" in the CTA.
- **Industry / Press / NGO** — sustainability journalist, BGMEA contact, or auditor researching Urmi's claims. Looks for Sustainability, Awards, and downloadable reports.
- **Prospective Colleague** — someone considering joining Urmi. Looks for the "Join the Team" CTA and culture cues (Pillars cards, IMPACT values).

There is **no Admin user type** for this homepage. The companion `/fullstack-dev` track may later add a CMS for content updates; that is out of scope for this PRD.

### User Relationships

N/A — the homepage is a one-way content surface. No user-to-user relationships exist.

### Project Type

- **Web (single-page scroll)** — Vite + React 19 + TypeScript + Tailwind CSS v4
- **No mobile-app variant** — the responsive web build covers all breakpoints (375 / 768 / 1024 / 1440)

## Terminology

| Term | Definition |
|------|------------|
| **Urmi (ঊর্মি)** | Bengali word meaning "wave." Brand-anchoring metaphor for continuous improvement and the river heritage of Urmi Group. |
| **Full-Green RMG** | A garments manufacturer whose facilities are certified green from input to output. Urmi is Bangladesh's first such group. |
| **RMG** | Readymade Garments — Bangladesh's largest export industry. |
| **ETP** | Effluent Treatment Plant. Urmi runs an anaerobic biological ETP at 4,000 m³/day with zero discharge. |
| **LEED** | Leadership in Energy and Environmental Design certification. Urmi's UHM facility is LEED-certified. |
| **UHM** | UHM Limited — Urmi's flagship green factory, JV with Toray Japan. Target of the Decarbonization 2030 commitment. |
| **FTML** | Fakhruddin Textile Mills Limited — Urmi's vertically integrated site (6,218 colleagues, 80,000 garments/day + dyeing + knitting + seamless). |
| **UGL** | Urmi Garments Limited — original 1984 garments unit, now a 1,710-colleague specialty wash facility. |
| **Decarbonization 2030** | Urmi's commitment to halve emissions by 2030. |
| **IMPACT** | Acronym for Urmi's 6 corporate values: Integrity, Mutual Trust, Passion for Excellence, Agility, Customer Focus, Teamwork. |
| **Pillars** | The 4-card opening section summarizing Urmi at a glance. (Renamed from "Four waves" to "Four pillars" per v2 user feedback.) |
| **Crafts** | Six manufacturing capabilities on the homepage. (Down from seven; Seamless moved off the homepage per v2 feedback.) |
| **Wave-rise animation** | Custom Framer Motion animation in the Pillars section: cards rise into place with their wave-shaped top edge clipping in over 800ms. |
| **Cotton / Silt / Indigo (legacy palette)** | Earth-tone palette from the original knowledge base. **Replaced** by the blue-primary palette below per v2 user feedback. |

## System Modules (Step-by-step Flows)

There are no transactional modules — the homepage has no auth, no submissions other than an optional newsletter email, and no state mutation. The sections below describe the **scroll experience** as a series of "modules" the visitor encounters.

### Module 1 — Land

1. Visitor opens the homepage at `/`
2. Hero renders: dark blue gradient background, ঊর্মি wordmark, italic "(Urmi — the wave.)", H1 "The wave that clothes the world.", and two CTAs (Discover Our Story, Partner With Us)
3. If `/hero.mp4` is present, it autoplays muted-loop behind the gradient; if absent, the gradient is the visual
4. `prefers-reduced-motion` users see a static `<img poster>` instead

### Module 2 — Scan four pillars

1. User scrolls past hero into the Pillars section
2. Four wave-edge cards rise into place, staggered 150ms apart, animated via Framer Motion `whileInView`
3. Each card renders one of: ৪০+ Years of craft, 16,800 Hands shaping every thread, Full Green factory group, 30+ Global brands

### Module 3 — Read by-the-numbers

1. User scrolls into the By the Numbers section (deep blue background)
2. Four large stats display: **44+** tons fabric daily, **2,50,000+** garments daily, **4,000+ m³** wastewater daily, **2030** decarbonization
3. Numbers render at their **final value on first paint**; scroll-into-view triggers a subtle count-up animation from 70% → 100% as enhancement only
4. Amber underlines draw under each number

### Module 4 — Browse crafts

1. User scrolls into the Crafts section
2. Six rows render in alternating image-left / image-right magazine layout, each fading in via `whileInView`
3. Order: Garments → Textile → Printing → Shipping → Embroidery → Washing
4. Each row has a hero image (user-supplied, full real assets), description, capability stat, and "See the process →" CTA

### Module 5 — Inspect sustainability

1. User scrolls into the Sustainability section (mist → sage gradient background)
2. A static radial diagram displays a sage core (containing the active commitment's name + description + icon) surrounded by 5 commitment cards (Zero-Discharge ETP, Full Green Factory, Decarbonization 2030, Circular Water, Certified/Audited/Accountable)
3. Clicking a commitment card swaps the core's content with a smooth Framer Motion AnimatePresence transition
4. Two CTA buttons sit below: "Read Sustainability Report" and "See Decarbonization 2030 Plan"

### Module 6 — Browse portfolio

1. User scrolls into the Products section
2. 6-tile asymmetric grid: 2 large hero tiles up top (Active Wear, Evening Wear), 4 medium tiles below with staggered vertical offsets (Night Wear, Seamless Innerwear, Knitwear & Polos, Kidswear)
3. Hover desaturates each image and reveals the tagline below the category name
4. CTA: "Open the Full Catalogue →"

### Module 7 — Cycle IMPACT values

1. User scrolls into the Impact section
2. A large active value renders (image + letter + name + description) alongside a thumbnail row of 6 values
3. Click or arrow-key navigation cycles through I-Integrity → M-Mutual Trust → P-Passion → A-Agility → C-Customer Focus → T-Teamwork
4. **No auto-cycle** — user must opt in to advance

### Module 8 — Locate factories

1. User scrolls into the Factories section
2. A Google Map (or styled SVG fallback if `VITE_GOOGLE_MAPS_API_KEY` is absent) renders centered on Bangladesh
3. The HQ marker uses the Urmi logo image; 3 factory pins (FTML, UGL, UHM) render with white-bordered blue Pin glyphs
4. Right-side data panel defaults to aggregate stats; clicking a pin animates the panel to that factory's specifics (manpower, capacity, certifications)

### Module 9 — Validate trust

1. User scrolls into the Clients section
2. A 6-column grid of 12 client cards renders, each with a logo image (or text monogram fallback) above the brand name
3. Hover lifts the card and tints its border to wave-blue

### Module 10 — Read recognition

1. User scrolls into the Awards section (white background)
2. A 4-column grid of 8 square award visuals renders, each with the award title and year below
3. Image errors hide gracefully (the `onError` handler removes the broken image element)

### Module 11 — Convert

1. User scrolls into the CTA section (deep blue, cloth-ripple SVG overlay)
2. Headline: "The next wave is waiting." + 3 CTA buttons: **Become a Buyer** (filled white) / **Join the Team** (ghost) / **Visit a Factory** (ghost)
3. All 3 CTAs link to `#connect` (currently same anchor — placeholder for future contact form integration)

### Module 12 — Footer + newsletter signup

1. Visitor reaches the footer (deep blue background)
2. 3-column layout: Bengali wordmark + tagline + Sam Tower address / Sitemap (matches navbar) / Newsletter signup form
3. Newsletter form: single email field + Subscribe button. On submit, captures the email locally and shows a thank-you message. **No backend integration yet** — emails are not stored anywhere; this is a placeholder for a future service.
4. Bottom row: copyright + 3 social icons (LinkedIn, Instagram, Facebook) + "Crafted on the Padma." italic line

## 3rd Party API List

| Service | Purpose | Status |
|---|---|---|
| **Google Maps JavaScript API** (`@vis.gl/react-google-maps`) | Renders the interactive Bangladesh map in the Factories section with HQ + 3 factory markers | ⚠️ **API key required** — site falls back to a styled SVG when `VITE_GOOGLE_MAPS_API_KEY` is absent. Documented in `.env.example`. |
| **Google Fonts** | Loads Playfair Display (serif), Inter (sans), Hind Siliguri (Bengali) | ✅ Wired via `<link>` in `index.html`. No API key needed. |
| **Newsletter provider** (Mailchimp / SendGrid / equivalent) | Persists newsletter signups | ❌ Not integrated. Form is a UI-only placeholder; emails are not captured. |
| **Hero video CDN** (e.g. Cloudflare Stream / Bunny / S3+CloudFront) | Serves `/hero.mp4` (38-second timeline brand film per knowledge base §8, or short loop) | ❌ Video file does not exist yet; site falls back to a deep blue gradient with grain. |

---

# Part 2: Site Architecture

## Page Map

The current build is a **single page** at `/` with deep-link anchors. The original brief envisioned a multi-page site (About, Craft, Portfolio, Sustainability, Career, Connect); the v2 user decision narrowed scope to the homepage only. Future iterations will add dedicated pages.

| Route / Anchor | Current behavior | Future behavior (out of scope) |
|---|---|---|
| `/` (root) | Renders the full single-page experience | Same |
| `/#home` | Scrolls to Hero | Same |
| `/#about` | Scrolls to Pillars + ByTheNumbers | Will become `/about` dedicated page |
| `/#craft` | Scrolls to Crafts | Will become `/craft` dedicated page |
| `/#portfolio` | Scrolls to Products + Impact | Will become `/portfolio` dedicated page |
| `/#sustainability` | Scrolls to Sustainability | Will become `/sustainability` dedicated page |
| `/#clients` | Scrolls to Clients + Awards | Will become `/clients` dedicated page |
| `/#connect` | Scrolls to CallToAction + Footer | Will become `/connect` (contact form, factory visit booking) |

## Navigation

**Navbar (sticky, transparent over hero, solid mist after 80px scroll):**

- Left: Urmi logo image (`/urmi-logo.png`)
- Right: Home · About · Craft · Portfolio · Sustainability · Clients · Connect
- Mobile: hamburger icon opens a right-side drawer with the same 7 links
- Hover state: wave-blue underline animates left-to-right (no underline animation when `prefers-reduced-motion`)

**Footer (consistent across every section as it appears at the bottom of the single page):**

- Sitemap matches the navbar links
- Newsletter form (email + Subscribe button)
- 3 social icons (LinkedIn, Instagram, Facebook) — placeholder URLs

## Page Architecture & Feature Specification — Homepage

### 1. Hero

| Aspect | Spec |
|---|---|
| Component | [`src/components/sections/Hero.tsx`](../../../src/components/sections/Hero.tsx) |
| Section ID | `#home` |
| Height | `100vh` minimum, with `min-h-[680px]` floor |
| Background | Optional `<video src="/hero.mp4">` autoplay-muted-loop; deep blue gradient fallback (`#143F73 → #1E5C9F → #4A6F8F`) always rendered behind the video so absence is graceful |
| Reduced motion | Video element is removed entirely; gradient remains |
| Content | Bengali wordmark (large) → italic "(Urmi — the wave.)" → H1 "The wave that clothes the world." → 1-paragraph subtext → 2 CTAs (Discover Our Story / Partner With Us) → bottom-left scroll cue with pulsing line |
| Animations | Framer Motion `Reveal` with staggered delays (0 / 100ms / 200ms / 300ms / 400ms) |

### 2. Pillars (Company at a Glance)

| Aspect | Spec |
|---|---|
| Component | [`src/components/sections/Pillars.tsx`](../../../src/components/sections/Pillars.tsx) |
| Section ID | `#about` |
| Headline | **"Four pillars. One promise."** *(replaces legacy "Four waves. One unbroken current.")* |
| Eyebrow | "COMPANY AT A GLANCE — ০১" (Bengali numeral) |
| Cards (4-up grid; 2x2 on tablet; 1-col on mobile) | (1) `years.jpg` — "৪০+ Years of craft" *(replaces legacy "Years on the river")*; (2) `hands.jpg` — "16,800 Hands shaping every thread"; (3) `full-green.jpg` — "Full Green / Bangladesh's first green factory group"; (4) `global-brands.jpg` (placeholder) — "30+ Global brands trust us daily" |
| Animation | Wave-rise: each card animates in with `clip-path: inset(100% 0 0 0) → inset(0 0 0 0)` over 900ms, staggered 150ms apart |
| Reduced motion | Cards render at end-state instantly |

### 3. By the Numbers

| Aspect | Spec |
|---|---|
| Component | [`src/components/sections/ByTheNumbers.tsx`](../../../src/components/sections/ByTheNumbers.tsx) |
| Background | `urmi-blue-deep` (#143F73), white text |
| Stats | 4-column grid; oversized serif numbers; amber underlines draw on view |
| Critical behavior | Numbers render their **real final value on first paint** (44+, 2,50,000+, 4,000+ m³, 2030). Count-up only animates the *last 30%* (70% → 100%) so a viewer who scrolls fast still sees real numbers, never `0`. This was a v2 fix from "currently shows 0." |
| Reduced motion | No animation — pure text + static underline |

### 4. Crafts

| Aspect | Spec |
|---|---|
| Component | [`src/components/sections/Crafts.tsx`](../../../src/components/sections/Crafts.tsx) |
| Section ID | `#craft` |
| Headline | **"Six crafts. One conscience."** *(reduced from legacy seven; Seamless removed)* |
| Layout | Alternating-row magazine layout (image-left / copy-right, then image-right / copy-left, repeating). Reference: kprmilllimited.com. |
| Crafts (in order) | Garments → Textile → Printing → Shipping → Embroidery → Washing |
| Per-row content | Hero image with overlay caption + craft name; description; capability stat with amber left border; "See the process →" CTA with arrow that translates on hover |
| Animation | Each row fades-in + slides-up via Framer Motion `whileInView` |

### 5. Sustainability

| Aspect | Spec |
|---|---|
| Component | [`src/components/sections/Sustainability.tsx`](../../../src/components/sections/Sustainability.tsx) |
| Section ID | `#sustainability` |
| Background | Linear gradient `mist → sage-tinted (#E8EFE9)` to differentiate from neighboring sections |
| Headline | **"Five commitments behind every responsible thread."** *(replaces legacy "Five innovations keeping our river running clean.")* |
| Layout | **Non-scroll radial diagram** (replaces legacy 500vh sticky-scroll). Center: sage circular core ~96 lg / 72 mobile holding the active point's name, description, icon, and stat or badge. Surround: 5 commitment cards in a 3-column grid (left col: 2 cards; center col: the core; right col: 3 cards). |
| Commitments | (1) Zero-Discharge ETP — 4,000 m³/day; (2) Full Green Factory — LEED Platinum; (3) Decarbonization 2030 — 50% target; (4) Circular Water — 100% returned; (5) Certified, Audited, Accountable |
| Interaction | Click a commitment card → core's content swaps via `AnimatePresence`; line stylings update |
| Decoration | Two animated `border` rings ripple outward continuously around the core (paused under reduced motion) |
| CTAs | "Read Sustainability Report" (ghost outline) / "See Decarbonization 2030 Plan" (filled sage) |

### 6. Products

| Aspect | Spec |
|---|---|
| Component | [`src/components/sections/Products.tsx`](../../../src/components/sections/Products.tsx) |
| Section ID | `#portfolio` |
| Headline | **"Garments worn from the gym to the gala — and to bed."** *(locked verbatim per user feedback)* |
| Layout | Asymmetric grid — top row: 2 hero tiles (5:4 aspect on desktop); bottom row: 4 medium tiles (4:5 aspect) with `:nth-child(even)` translated `+8` units on `lg:` breakpoint for staggered rhythm |
| Tiles | Active Wear (hero) · Evening Wear (hero) · Night Wear · Seamless Innerwear · Knitwear & Polos · Kidswear |
| Hover | Image desaturates 15%; tagline opacity transitions from 0 to 100; serif italic name slides up |
| CTA | "Open the Full Catalogue →" |

### 7. Impact

| Aspect | Spec |
|---|---|
| Component | [`src/components/sections/Impact.tsx`](../../../src/components/sections/Impact.tsx) |
| Background | `mist` |
| Headline | "Every wave leaves an IMPACT." |
| Layout | Two-column on `lg:` — left is a large circular image of the active value; right is the active value's letter + title + description. Below: a horizontal thumbnail row of all 6 values; the active thumb scales up to ~96/124 px while inactives stay ~56/64 px. |
| Values | I-Integrity · M-Mutual Trust · P-Passion for Excellence · A-Agility · C-Customer Focus · T-Teamwork |
| Interaction | Click a thumb to switch active; left/right arrow keys cycle when section has focus; **no auto-cycle** |
| Animations | `AnimatePresence` swap on active change |

### 8. Factories

| Aspect | Spec |
|---|---|
| Component | [`src/components/sections/Factories.tsx`](../../../src/components/sections/Factories.tsx) |
| Background | White |
| Headline | "Three rivers. Three factories. One standard." |
| Layout | 50/50 on `lg:` — left is the map; right is the data panel |
| Map (with API key) | `<APIProvider>` → `<Map mapId="urmi-factories-map">` centered on Dhaka with `defaultZoom: 9`, gesture-handling `cooperative`. Custom `<AdvancedMarker>` for HQ uses the Urmi logo image inside a white-bordered blue circle, with an "HQ" caption tag below it. Three factory `<AdvancedMarker>`s use `<Pin>` glyphs (`#1E5C9F` background, white border, white glyph) with the factory name caption below. Active factory marker scales 1.4× and uses `urmi-blue-deep` background. |
| Map (no API key) | `MapFallback` component renders a stylized SVG of Bangladesh's outline with two wavy river curves and 3 dotted lines connecting the HQ dot to each factory pin. Active pin enlarges from r=2 to r=3. |
| Data panel | Default state: aggregate stats (10,000 total colleagues, 166,920+ pieces/day combined) + 3 factory list buttons. Active state: factory's full name, description, manpower, capability list with check icons, certification chips, and a "← Back to overview" link. Animated transitions via `AnimatePresence`. |
| Factories | FTML (6,218 / Gazipur / 80k garments + 30t dye + 28t knit + 5k seamless / OEKO-TEX, ISO 14001, Child Care, Medical) · UGL (1,710 / Narayanganj / 26,920 pcs + acid + stone wash / OEKO-TEX, BSCI, Child Care, Medical) · UHM (2,070 / Mirpur / 60k pcs + LEED + 2030 decarb / LEED, OEKO-TEX, GOTS, Toray JV) |
| Coordinates | Approximate, not address-precise. Refine in `src/data/factories.ts` once authoritative addresses arrive. |

### 9. Clients

| Aspect | Spec |
|---|---|
| Component | [`src/components/sections/Clients.tsx`](../../../src/components/sections/Clients.tsx) |
| Section ID | `#clients` |
| Background | `mist` |
| Headline | "Trusted by the brands that set the standard." |
| Layout | 6-col grid on `xl:` (4-col on `lg:`, 3-col on `sm:`, 2-col on mobile). Each cell is a 4:3 aspect card with logo (or monogram fallback) on top + brand name below. |
| Hover | Card lifts `-translate-y-1`; border tints from `cloud` to `wave-blue`; logo desaturates from grayscale to color (where logo image exists); brand name color shifts to `urmi-blue-deep` |
| Clients | 12 entries in `src/data/clients.ts` — H&M, Puma, Decathlon, Marks & Spencer, Uniqlo, Gap, Tesco, Next, Kohl's, PVH, Lidl, Calvin Klein. Currently rendering text monograms (e.g. "HM", "PM") because real logos are not yet wired. |

### 10. Awards

| Aspect | Spec |
|---|---|
| Component | [`src/components/sections/Awards.tsx`](../../../src/components/sections/Awards.tsx) |
| Background | White |
| Headline | "Recognised by the industry." |
| Layout | 4-col grid on `lg:` (3-col on `md:`, 2-col on mobile). Each cell is a square aspect frame with the award image; below: title + year (year in amber). |
| Hover | Border transitions from `cloud` to `amber`; image scales `1.04` |
| Images | 8 placeholder URLs pointing at `urmigroup.com/wp-content/uploads/2019/12/[1-8]-2-300x300.jpg`. Image `onError` hides the broken image gracefully. Real awards list pending client confirmation. |

### 11. Call to Action

| Aspect | Spec |
|---|---|
| Component | [`src/components/sections/CallToAction.tsx`](../../../src/components/sections/CallToAction.tsx) |
| Section ID | `#connect` |
| Background | `urmi-blue-deep` with a placeholder editorial fabric photo at 20% opacity, layered SVG cloth-ripple curves at low opacities, and a final dark overlay |
| Eyebrow | "CARRY THE WAVE — ০৯" |
| Headline | "The next wave is waiting." |
| Subtext | "Whether you're a global buyer, a young designer, or a future colleague — there's a place for you here." |
| CTAs | (1) Become a Buyer (filled white, primary); (2) Join the Team (ghost outline); (3) Visit a Factory (ghost outline). All link to `#connect` placeholder. |

### 12. Footer

| Aspect | Spec |
|---|---|
| Component | [`src/components/layout/Footer.tsx`](../../../src/components/layout/Footer.tsx) |
| Background | `urmi-blue-deep`, white text |
| Layout | 3-column on `md:` |
| Column 1 | Bengali wordmark + "URMI GROUP" caps + 1-paragraph tagline + Sam Tower, Gulshan-1 address |
| Column 2 | "Sitemap" — 7 links matching the navbar |
| Column 3 | "Newsletter" — descriptive paragraph + email field + Subscribe button. On submit shows a "Thank you. We'll be in touch." confirmation. **No backend persistence.** |
| Bottom strip | © 2026 Urmi Group · 3 social icons (LinkedIn, Instagram, Facebook) · italic "Crafted on the Padma." |

---

# Part 3: Tech Stack & Engineering Standards

(Adapted from the dev `tech-stack.md` template — admin-dashboard sections omitted as not applicable.)

## Frontend

| Concern | Choice | Rationale |
|---|---|---|
| Build tool | **Vite 8** | Fast dev server, native ESM, built-in TypeScript support |
| Framework | **React 19** | Industry standard; hooks-first; Concurrent rendering benefits the count-up + reveal animations |
| Language | **TypeScript (strict)** with `verbatimModuleSyntax` and `noUnusedLocals` | Forces `import type` for type-only imports; surfaces dead code at build time |
| Styling | **Tailwind CSS v4** with `@theme` CSS-first tokens | No `tailwind.config.js` — palette and fonts live in `src/index.css`. Easier to ship custom colors than Tailwind 3. |
| Animation | **Framer Motion 12** | `whileInView`, `AnimatePresence`, scroll-linked `useScroll` cover all required animation patterns. No Lottie, no GSAP. |
| Maps | **`@vis.gl/react-google-maps`** | Modern React wrapper for the new Google Maps Advanced Markers API. SVG fallback when API key is absent. |
| Utility | **`clsx` + `tailwind-merge`** via `cn()` helper | Handles conditional class merging without bloat |
| Icons | **Hand-drawn inline SVG** in `src/components/ui/Icon.tsx` | Knowledge-base hard rule: no Lucide, no Heroicons. ~12 icons defined as a discriminated-union component. |
| Path alias | `~/` → `src/` | Wired in both `vite.config.ts` and `tsconfig.app.json paths` |

## Backend

**None.** The current site has no backend. Future requirements likely include:

- A newsletter signup endpoint (when the form should actually persist emails)
- A contact / inquiry form on the future `/connect` page
- A CMS for sustainability reports + news posts

These are **out of scope** for this PRD and would be added by `/fullstack-dev` when those pages enter scope.

## Hosting & Deployment

Not specified in this PRD. Static hosting recommended (Cloudflare Pages, Netlify, Vercel) given the build outputs to `dist/` as plain HTML/CSS/JS.

## Performance Targets

| Metric | Target | Notes |
|---|---|---|
| Lighthouse Performance (mobile) | ≥ 90 | Currently flagged: craft/impact PNGs are 2–3 MB; compress before production |
| Lighthouse Accessibility | 100 | All buttons have aria-labels; alt text on all images; reduced-motion respected |
| LCP | ≤ 2.5s | Hero image / video swap will be the LCP element |
| CLS | ≤ 0.1 | Aspect-ratio CSS prevents layout shift on image load |
| JS bundle (gzipped) | ≤ 150 KB | Currently ~134 KB gzipped (Framer Motion + Google Maps wrapper + React) |

## Code Quality Rules (enforced)

- No `console.log` in production code
- No `any` types — use `unknown` with type guards
- TypeScript `strict` mode on
- No commented-out code (Git is the history)
- No emojis in code or documentation unless explicitly requested
- All hand-drawn SVG icons go through `~/components/ui/Icon.tsx` — no inline `<svg>` outside that file (unless decorative + section-specific)
- `verbatimModuleSyntax` requires `import type` for type-only imports

---

# Additional Questions (Client Confirmation Required)

The following questions need client answers before the homepage can ship to production. Each has an associated impact and a fallback if no answer arrives.

## Required Clarifications

| # | Question | Context | Fallback if unanswered |
|:-:|:---------|:--------|:--------|
| 1 | **Hero video** — Will Urmi commission the 38-second timeline brand film described in the knowledge base §8, or a shorter wave/cotton/thread loop? When is delivery expected? | The hero currently falls back to a deep blue gradient. The video is the strongest brand-impression lever. | Ship without video; revisit when ready. |
| 2 | **Real photography** — Is there budget for a half-day editorial shoot in Bangladesh ($3k–$8k per knowledge-base §13)? | Products section (6 placeholders), Impact section (5 of 6 placeholders), CTA background (1 placeholder), Awards section (8 placeholders), Pillars section (1 of 4 placeholder) all need real photography. | Continue with curated Unsplash placeholders flagged in `ASSETS.md`. |
| 3 | **Authoritative client list** — Confirm the 12+ client brand names + permissions to display them with logos. | `src/data/clients.ts` has 12 placeholder names; logos are not wired (text monograms render). | Keep monograms; add a footnote in `ASSETS.md`. |
| 4 | **Authoritative awards list** — Confirm the 8 award titles + years + image rights. | `src/data/awards.ts` references `urmigroup.com/wp-content/uploads/2019/12/[1-8]-2-300x300.jpg`; titles are placeholder. | Pull display titles from urmigroup.com; flag for review. |
| 5 | **Google Maps API key** — Provide `VITE_GOOGLE_MAPS_API_KEY` for the Factories section. Also: confirm exact lat/lng for FTML, UGL, and UHM. | The map currently falls back to a stylized SVG. Coordinates are approximate. | Ship with SVG fallback; refine coordinates when key arrives. |
| 6 | **Newsletter integration** — Which provider (Mailchimp, ConvertKit, SendGrid, Postmark)? The form currently captures emails locally only. | Footer newsletter form exists; backend is missing. | Disable the form or label it "Coming soon." |

## Recommended Clarifications

| # | Question | Context | Default if unanswered |
|:-:|:---------|:--------|:--------|
| 1 | **Sustainability secondary color** — Is sage `#5B8C7E` the right shade for the sustainability section? | One-token swap if a different shade is preferred. | Keep sage. |
| 2 | **Warm accent** — Is amber `#C8956D` the right tone for stat underlines, or should we drop the warm accent entirely? | Used in 3 places (number underlines, craft-stat borders, award year color). | Keep amber. |
| 3 | **Bengali language toggle** — Should the site be available in Bengali in addition to English? | The wordmark is Bengali; the body copy is English. A full Bengali translation is a separate effort. | English-only with Bengali wordmark only. |
| 4 | **Section copy alternates** — Confirm the v2 replacements: "Four pillars. One promise.", "৪০+ Years of craft", "Five commitments behind every responsible thread." | Three locked-in copy choices from the v2 plan. | Keep the proposed copy. |
| 5 | **Client logos vs monograms** — Once logos are confirmed, drop them into `public/img/clients/` and reference them in `src/data/clients.ts`. | Currently text monograms render. | Continue with monograms. |
| 6 | **Future pages** — When should About / Sustainability / Portfolio / Career / Connect become dedicated routes? Will they re-use this homepage's components? | Currently anchor scrolls only. | Defer to a follow-up PRD. |

---

# Feature Change Log

## Version 1.0 — 2026-05-07

Initial PRD generated retrospectively after the homepage build via `/fullstack-pm --phase P2-prd`.

### v1.0 deltas vs the original knowledge base (May 2026)

| Change Type | Before (knowledge base) | After (v1.0 / as-built) | Source |
|:-----------|:-------|:------|:-------|
| **Palette replaced** | Earth tones — cotton (#F2EBDD), silt (#6B5B47), indigo (#1F2A44), moss (#4A5D3F), terracotta (#B5654A) | Blue-primary — urmi-blue (#1E5C9F), wave-blue (#7BB6E8), sage (#5B8C7E sustainability), mist (#F4F7FB bg), amber (#C8956D accent) | v2 user feedback (May 2026): "earth tone doesn't go with the urmi branding, primary color should be blue as logo" |
| **Navbar simplified** | About · Craft · Sustainability · Portfolio · Clients · Contact (6 links + Bengali + Latin wordmark) | Home · About · Craft · Portfolio · Sustainability · Clients · Connect (7 links + logo image only) | v2 user feedback |
| **Section 3 headline** | "Four waves. One unbroken current." | **"Four pillars. One promise."** | v2 user feedback: "replace the current word with something else" |
| **Section 3 stat 1** | "৪০+ Years on the river" | **"৪০+ Years of craft"** | v2 user feedback: "Replace the river word" |
| **Section 5 craft count** | 7 crafts (Seamless · Garments · Textile · Printing · Embroidery · Washing · Shipping) | **6 crafts** — Seamless removed (Garments · Textile · Printing · Shipping · Embroidery · Washing) | v2 user feedback |
| **Section 5 layout** | Horizontal-scroll snap (KPR-Mill horizontal) | Alternating-row magazine layout (KPR-Mill alternating) | v2 user feedback referencing kprmilllimited.com |
| **Section 6 layout** | 500vh sticky-scroll experience | Non-scroll radial diagram | v2 user feedback: "different visualization not scrollable" |
| **Section 6 headline** | "Five innovations keeping our river running clean." | **"Five commitments behind every responsible thread."** | v2 user feedback: "don't focus on river too much" |
| **Section 9 map** | Hand-drawn SVG of Bangladesh outline | Real Google Map (with SVG fallback) | v2 user feedback: "Need google map three points connecting to logo" |
| **Section 10 layout** | Auto-scrolling logo marquee (logos only) | Static 6-col grid of logo + brand-name pairs | v2 user feedback: "Client section is boring need their logo with the name" |
| **Section 4 numbers** | Animated count-up from 0 (showed 0 on first paint) | Always renders real value on first paint; count-up animates only the last 30% | v2 user feedback: "The number section appears 0 it should be + adding real numbers" |

### v1.0 known gaps (logged for future iterations)

- Hero video file `/hero.mp4` is missing; gradient fallback in place
- 19 image slots use Unsplash or `urmigroup.com` placeholders (see `ASSETS.md`)
- Newsletter form is UI-only (no backend integration)
- Google Maps API key not yet provisioned; SVG fallback active
- Factory coordinates are approximate, not address-precise
- Craft and IMPACT PNGs from the user folders are 2–3 MB each — should be compressed before production deploy

---

# Appendix A — Files of Record

| File | Purpose |
|---|---|
| [`d:\Urmi\src\App.tsx`](../../../src/App.tsx) | Composes the 12 homepage sections in order |
| [`d:\Urmi\src\index.css`](../../../src/index.css) | Tailwind v4 import + `@theme` brand tokens + grain + keyframes |
| [`d:\Urmi\ASSETS.md`](../../../ASSETS.md) | Authoritative TODO-replace registry for every placeholder image, video, and the Google Maps API key |
| [`d:\Urmi\.env.example`](../../../.env.example) | Documents `VITE_GOOGLE_MAPS_API_KEY` |
| [`d:\Urmi\.claude-project\status\urmi\seed-2026-05-07.yaml`](../status/urmi/seed-2026-05-07.yaml) | P1-spec seed — source of truth for goal / constraints / acceptance criteria |
| `d:\Urmi\.claude-project\prd\history\PRD_v1.{md,hash}` | Version-1 snapshot of this PRD |

---

*PRD v1.0 — 2026-05-07. The wave never stops.*
