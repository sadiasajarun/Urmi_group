# DESIGN_SYSTEM — Variation C: "Cinematic Mill"

**One-line positioning:** *A film about a factory.*

Dark navy as the dominant background. Heavy photography across every section — the homepage is a series of full-bleed cinematic frames intercut with cream callout cards. Type pairs Tiempos Headline (display) with IBM Plex Mono (caption uppercase) for a Sebastião Salgado documentary feel. Section transitions cross-fade like film cuts. Highest visual impact, highest implementation cost, highest dependence on real photography quality.

---

## Color Tokens

```css
/* Primary — deeper, more saturated indigo */
--color-urmi-blue:       #1B4F8E;
--color-urmi-blue-deep:  #0E2748;   /* dominant background — most of the page sits on this */
--color-urmi-blue-night: #061528;   /* deepest corners, footer */
--color-wave-blue:       #5BA0DE;   /* dramatic — used for hero accent only */
--color-wave-blue-bright:#8FCBFF;   /* one moment of glow per page */

/* Sustainability — moss green made richer for cinematic contrast */
--color-moss:            #4A7864;
--color-moss-deep:       #2D5044;

/* Cream callout cards — only relief from the dark dominance */
--color-cream:           #F5EFE3;
--color-cream-soft:      #EDE3D1;
--color-paper-text:      #2A1F12;   /* warm dark text on cream cards */
--color-night-text:      #E8EEF8;   /* light text on dark sections */

/* Brass accent — a single luxurious metallic touch (replaces amber) */
--color-brass:           #B8924E;
--color-brass-soft:      #D4B274;
```

Background dominance: `--color-urmi-blue-deep` 70% · `--color-cream` 25% (callout cards) · `--color-urmi-blue-night` 5% (CTA + footer)

## Typography

```
Display:  "Tiempos Headline" (or fallback "Playfair Display") — heavy, weights 500/600
Body:     "Inter" — weights 400/500 (heavier than A/B for legibility on dark bg)
Caption:  "IBM Plex Mono" — monospace, weight 500, tracked-out 0.15em — for stats, eyebrows, year markers
Bengali:  "Hind Siliguri" — bigger, heavier weight 600

Sizes:
  H1 (hero)       clamp(3.5rem, 8vw, 6.5rem)        line-height 1.05  white on dark
  H2 (section)    clamp(2.25rem, 5vw, 4rem)         line-height 1.1   alternating cream / night-text
  H3              clamp(1.5rem, 2.5vw, 2.25rem)
  Body            1.0625rem (17px)                  line-height 1.6  *heavier weight than A/B for dark legibility*
  Caption (mono)  0.6875rem (11px) · uppercase · tracking 0.15em
```

## Layout

- 12-column grid, max content width 1440px
- Section padding: `clamp(6rem, 12vw, 10rem)` (similar to A)
- Cream callout cards float on dark sections, framed by cinematic photography on either side
- Section dividers: **photographic transitions** — each section ends with a 30vh full-bleed image that runs into the next section (no rules, no clip-paths)

## Motion

- Reveal: scale 1.02 → 1, opacity 0 → 1, 1.2s ease-out-soft (slower, more dramatic)
- Section transitions: photographic cross-fade (each photo dissolves into the next)
- Parallax on hero photography: image translates at 0.7× scroll speed
- Subtle vertical scroll-progress indicator on the right edge in `brass` color
- Cinematic crossfade between IMPACT carousel images
- All gated on `prefers-reduced-motion`

## Hero

- Full viewport, full-bleed cinematic photograph (river at golden hour / cotton field — knowledge base §13 reference frames)
- **No video** — single still photograph for now (video can be added later as P3 evolves)
- Heavy dark gradient overlay: `bg-gradient-to-t from-urmi-blue-night via-urmi-blue-deep/80 to-urmi-blue-deep/30`
- Content (left-aligned, not centered) at 60% from top:
  1. Mono caption "ঊর্মি · URMI · EST. 1955" — `cream` color, mono, tracked-out
  2. H1 (white serif, 6.5rem) — "The wave that clothes the world."
  3. Single line subtext (`cream` italic Tiempos, 1.5rem) — "Forty years on the river. Sixteen thousand hands."
  4. Two CTAs side-by-side: filled `cream` button + ghost `wave-blue` outline
- Bottom-right: timestamp-style frame counter "01 / 12" in mono `brass`
- Top-right corner: a thin `brass` 1px frame inset 32px from edges (Aman-style cinematic frame)

## Section Treatments

| Section | Background | Notable element |
|---|---|---|
| Hero | Photographic + dark gradient overlay | Brass corner frame; mono caption; left-aligned content |
| Pillars | `urmi-blue-deep` | 4 cards become **dark cream callouts on full-bleed photo strip** — photos run continuously horizontally behind, callout cards float on top with cream backgrounds |
| By the Numbers | `urmi-blue-night` (deepest) | Mono captions + Tiempos numerals + brass underlines (replaces amber) |
| Crafts | Alternating: photo full-bleed / cream callout | Each craft is a 1-page-tall photographic moment; cream callout overlays bottom-left with name, stat, and "See the process →" CTA |
| Sustainability | `urmi-blue-deep → moss-deep gradient` | Radial diagram on dark — sage core has bright glow ring; commitment cards are dark-on-dark with cream stat highlights |
| Products | Diagonal split — `cream` triangle + `urmi-blue-deep` triangle | 6-tile asymmetric grid spans the diagonal |
| Impact | `urmi-blue-deep` | Active value occupies 90% of viewport width as a cinematic photographic frame; thumbnail row at bottom is small mono-captioned |
| Factories | Cream | Map zoomed deeper, marker pins are brass-colored. Right panel is mono-captioned. |
| Clients | `urmi-blue-deep` | Logos shown in single white-on-dark mono row, 6 visible at a time, smooth horizontal hover scroll (not autoscroll) |
| Awards | Cream | 4-col grid; each award is a film-still-style square with brass-edged frame |
| CTA | `urmi-blue-night` (deepest) + brass 1px frame | H1 in cream serif, 3 CTAs side-by-side: filled cream + 2 ghost brass |
| Footer | `urmi-blue-night` | Same as A but with mono caption styling |

## CTA System

- **Primary:** filled `cream` background, `urmi-blue-night` text, hover swaps to `brass` background. 36px horizontal padding, 16px vertical. Mono uppercase 11-12px.
- **Secondary:** `cream` ghost outline (border-cream/80) with cream text. Hover fills with cream + dark text.
- **Brass-accent CTA:** rare, used only for "Sustainability Report Download" — `brass` filled with night text, only ever used once.

## Iconography

- Same hand-drawn SVG library
- Stroke weight 1.5px on dark backgrounds (slightly heavier for legibility)
- Brass tint allowed on accent icons in CTA section

## Imagery Treatment

- 5% warm grain overlay (heavier than A's 3%)
- Photography is the primary load — every section requires real editorial shots
- Aspect ratios: 16:9 cinematic (hero, sustainability, IMPACT) · 5:4 (Crafts) · square (Awards, IMPACT thumbs)
- Photo treatment: warm earth-tone color grading (Sebastião Salgado meets Munem Wasif per knowledge base §13)
- No saturated colors in photographs — all images pass through a warm desaturate filter

## Accessibility

- Most text sits on dark backgrounds — contrast must be verified against `--color-night-text` minimum (16:1 with `urmi-blue-deep` ✓)
- Cream callout text uses `paper-text` (warm dark) which gives 14:1 against cream ✓
- Brass on dark: 8:1 ✓ — passes AA at 18pt
- Cinematic motion: many users will trigger `prefers-reduced-motion` — fallback to static photographs is critical
- Hero parallax: parallax must disable under reduced motion

---

## Implementation cost vs Variation A

| Aspect | Cost |
|---|---|
| Color token rebuild | 4 (introduces cream/brass/night layers) |
| Typography swap | 4 (Tiempos + IBM Plex Mono — Plex Mono is open-source via Google Fonts ✓; Tiempos requires license) |
| Hero rebuild | 5 (cinematic photo + brass frame + mono caption — no overlap with current React) |
| Photographic dependency | 5 (every section needs a real shot — placeholder Unsplash will look weak; this is the variation that most needs the photo budget from KB §13) |
| Section reordering / new layouts | 5 (Pillars-as-photo-strip + Products-diagonal are net-new components) |
| Animation rebuild | 4 (parallax + cross-fade transitions are not in current build) |
| Total effort relative to A | ~6–8 weeks of frontend + photography work |

## Risk profile

- **Highest reward, highest risk.** If real photography lands at the Salgado / Wasif quality bar, this variation is unforgettable. If it doesn't, the page will read as "tried hard, fell short."
- **Lock decision before shoot:** committing to C means committing to the photography spend up-front. If that budget is uncertain, choose A or B.

**Best for:** clients who said "Brandix" and meant it: cinematic, scale-asserting, premium European-buyer-targeted. Not the right call if hero photography won't be ready by ship date.
