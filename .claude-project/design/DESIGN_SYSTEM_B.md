# DESIGN_SYSTEM — Variation B: "Atelier"

**One-line positioning:** *Loro Piana with a Bengali soul.*

Sparse. Whitespace-as-luxury. The H1 itself is the hero — no video, no full-bleed photography in the opening fold. Photography appears only where it earns its place. The Bengali wordmark gets first-class hero treatment. Sage and amber accents are dialed back — the page is mostly mist, ink, and a single wave-blue accent line.

---

## Color Tokens

```css
/* Primary — slightly cooler, brighter cobalt */
--color-urmi-blue:       #2167B6;   /* slightly brighter than A's #1E5C9F */
--color-urmi-blue-deep:  #163E78;
--color-wave-blue:       #6FA9D9;
--color-wave-blue-soft:  #E2EEF8;   /* bigger, softer */

/* Sage de-emphasized — only the sustainability core uses it */
--color-sage:            #6E9B8E;   /* lighter, dustier */
--color-sage-deep:       #557969;

/* Neutrals dominate */
--color-mist:            #F8FAFC;   /* even lighter */
--color-cloud:           #ECEFF3;
--color-slate-text:      #586474;
--color-ink:             #0E1A2D;
--color-paper:           #FBFCFD;   /* near-white for hero / cards */

/* No warm accent — amber removed; replaced by ink hairlines */
--color-hairline:        #1E2A3F;   /* 1px solid for dividers + borders */
```

Background dominance: `--color-paper` 80% · `--color-mist` 15% · `--color-urmi-blue-deep` 5% (footer + 1 dramatic interlude).

## Typography

```
Display:  "Tiempos Headline" (or fallback "Playfair Display") — heavier serif, weights 400/500
Body:     "Söhne" (or fallback "Inter") — humanist sans, weights 300/400
Caption:  "Söhne" tracked-out 0.18em uppercase
Bengali:  "Hind Siliguri" — promoted from caption to display sizes (32–80px) for hero

Sizes:
  H1 (hero)       clamp(3rem, 9vw, 7.5rem)          line-height 1.0    very heavy
  H2 (section)    clamp(1.875rem, 4vw, 3.25rem)     line-height 1.2
  H3              clamp(1.25rem, 2vw, 1.875rem)     line-height 1.3
  Body            1rem (16px)                       line-height 1.7    *de-emphasized*
  Caption         0.6875rem (11px) · uppercase · tracking 0.18em

Hero Bengali wordmark: 4.5rem (72px) — promoted to first-class element, sits above the H1.
```

## Layout

- 12-column grid, **narrower max content width: 1280px**
- Section padding: `clamp(7rem, 14vw, 12rem)` vertical (1.4× more than A)
- Generous side gutters: 5vw minimum
- Section dividers: **single ink hairline** (1px) full-width — no wave-curves, no clip-paths
- More dead space at the top of every section: 6rem above the section H2

## Motion

- Reveal: 8px Y translate (vs A's 24px), 600ms ease-out-soft — gentler
- No count-up animation — numbers render statically
- No wave-rise animation — Pillars cards fade in with 200ms stagger
- Subtle horizontal hairline draws across Sustainability section dividers (300ms each)
- All motion remains gated on `prefers-reduced-motion: reduce`

## Hero

- **Type-driven, no video, no full-bleed photography**
- Full viewport, `bg-paper`
- Centered column, max-width 880px
- Stack:
  1. ঊর্মি wordmark (4.5rem Hind Siliguri, color `urmi-blue-deep`) — top-anchored
  2. Italic caption "(Urmi — the wave.)" — paper text on hairline-bordered chip
  3. H1 (Tiempos Headline / Playfair, 7.5rem max, color `ink`) — "The wave that clothes the world."
  4. 1-paragraph subtext (2 lines max), color `slate-text`
  5. Two text-only CTAs separated by a vertical hairline: "Discover Our Story | Partner With Us" — underlined on hover, no button shapes
- Bottom-left: small caption "Bangladesh's first Full-Green RMG group" — no scroll cue arrow
- Background decoration: a single hand-drawn wave-blue stroke SVG line drifting across the bottom 30% of the hero, 1px stroke, 30% opacity

## Section Treatments

| Section | Background | Notable element |
|---|---|---|
| Hero | `paper` | Type-driven; single thin wave-blue line at bottom |
| Pillars | `paper` | Cards become **borderless type+stat blocks** (no images) — image-free version. The 4 photographs from `/img/waves/` move to a follow-up "Faces of the work" section. |
| By the Numbers | `paper` | Static large numerals (no count-up). Single ink hairline above + below the row. |
| Faces of the work | `mist` | New: 4 large editorial photos (years/hands/full-green/global-brands) framed in 1px ink border, generous whitespace between. |
| Crafts | `paper` | Alternating rows but **lighter** — single small hero image per row (max 480px wide) with copy taking 60% width |
| Sustainability | `paper → mist gradient` | Same radial diagram structure but core is `paper` with sage hairline border (not solid sage fill); pillar cards are paper with sage left-rule |
| Products | `paper` | Symmetric 3×2 grid (not asymmetric); each tile is a paper card with single thumbnail + name |
| Impact | `mist` | Single large value displayed at a time; thumbnail row stays small |
| Factories | `paper` | Map placeholder is bordered with hairline. Data panel is type-driven (no chips). |
| Clients | `paper` | 6-col logo+name cards but **no hover lift** — static, restrained |
| Awards | `paper` | 4-col but each tile has more vertical space; year is in `urmi-blue` not amber |
| CTA | `urmi-blue-deep` (the only dark moment in the entire page) | All-white H1 + 3 underlined text-only CTAs separated by vertical hairlines |
| Footer | `urmi-blue-deep` | 3-col with **lots more** vertical breathing room than A |

## CTA System

- **Primary:** text + arrow only, no button shape. `urmi-blue` color, hover underlines from left in `wave-blue`. Same pattern across the site.
- **Secondary (CTA section only):** filled white on dark, no rounded corners, generous padding (40px horizontal, 18px vertical).

## Iconography

- Same hand-drawn SVG library, but stroke weight reduced to 1.25px (more delicate)
- Used very sparingly — most actions are text-only

## Imagery Treatment

- **No grain overlay** — paper-clean photography
- 1px ink hairline border on every photograph (Pillars/Crafts/Awards)
- No hover scale, no saturate — photos stay still
- Aspect ratio bias: portrait 4:5 dominates (no landscape heroes)

## Accessibility

- All-paper, ink-text body keeps contrast above 12:1 (well above WCAG AAA)
- Hairline dividers are 1px ink — risk of being visually hidden at zoom; supplement with section padding rhythm
- Bengali wordmark has aria-label="Urmi (the wave)"
- Type-only CTAs have visible focus ring (2px wave-blue) — critical since hover state is just an underline

---

## Implementation cost vs Variation A

| Aspect | Cost (1 = lowest, 5 = highest) |
|---|---|
| Color token swap | 2 (drop sage / amber to near-zero, add hairline) |
| Typography swap | 4 (requires Tiempos / Söhne licensing OR fallback to Playfair / Inter — needs decision) |
| Hero rebuild | 4 (no video; type-driven; new Bengali sizing) |
| Pillars image removal | 3 (split current Pillars into 2 sections: "Pillars" type-only + "Faces of the work" image) |
| Animation removal | 1 (drop count-up + wave-rise; simpler) |
| CTA system swap | 3 (text-only CTAs site-wide) |
| Total effort relative to A | ~3 weeks of frontend work for 1 mid-level engineer |

**Best for:** clients chasing "quiet luxury" who can defer photography while we ship the type-driven version.
