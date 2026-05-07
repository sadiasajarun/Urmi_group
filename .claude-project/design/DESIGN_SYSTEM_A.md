# DESIGN_SYSTEM — Variation A: "Editorial Wave"

**One-line positioning:** *The polished magazine cover of a sustainable industrial group.*

The closest variation to the as-built v2 React homepage. Mid-density editorial layouts, grain-overlaid photography, Playfair Display + Inter typography, blue-driven palette with sage anchoring the sustainability section.

---

## Color Tokens

```css
/* Primary — sampled from the logo */
--color-urmi-blue:       #1E5C9F;   /* H1, primary CTAs, brand blue */
--color-urmi-blue-deep:  #143F73;   /* hover, dark sections, footer */
--color-wave-blue:       #7BB6E8;   /* secondary accents, hover lines */
--color-wave-blue-soft:  #CFE4F5;   /* card hover bg, fallback gradient */

/* Secondary — sustainability section */
--color-sage:            #5B8C7E;
--color-sage-deep:       #3F6A5E;
--color-sage-soft:       #D6E4DF;

/* Neutrals */
--color-mist:            #F4F7FB;   /* page background — cool off-white */
--color-cloud:           #E6ECF2;   /* card surfaces, dividers */
--color-slate-text:      #4A5568;   /* body text */
--color-ink:             #0F1E33;   /* deep navy, high-contrast headings */
--color-white:           #FFFFFF;

/* Single warm accent */
--color-amber-accent:    #C8956D;   /* stat underlines, hover lines */
```

Background dominance: `--color-mist` 70% · sections alternate to `--color-white` and `--color-urmi-blue-deep` for rhythm.

## Typography

```
Display:  "Playfair Display" — serif, weights 400/500/600, regular italic
Body:     "Inter" — humanist sans, weights 300/400/500
Bengali:  "Hind Siliguri" — for ঊর্মি wordmark only

Sizes:
  H1 (hero)       clamp(2.75rem, 6.5vw, 5.25rem)   line-height 1.05
  H2 (section)    clamp(2rem, 4.5vw, 3.5rem)        line-height 1.15
  H3 (sub)        clamp(1.5rem, 2.5vw, 2.25rem)     line-height 1.2
  Body (lg)       1.125rem                          line-height 1.6
  Body            1rem                              line-height 1.7
  Caption         0.6875rem (11px) · uppercase · tracking 0.2em
```

## Layout

- 12-column grid, max content width 1440px
- Section padding: `clamp(5rem, 10vw, 9rem)` vertical
- Gutter: 24px on mobile, 32px tablet, 48px desktop
- Section dividers use **wave-curve clip-paths** (top of card / SVG between sections)

## Motion

- Reveal pattern: 24px Y translate, 800ms ease-out-soft, staggered 100–150ms
- Count-up: renders final value on first paint; animates last 30% (70% → 100%)
- Wave-rise: card clip-path animates from `inset(100% 0 0 0)` → `inset(0 0 0 0)` over 900ms
- Sustainability section: ripple ring borders animate continuously around the sage core
- All motion gates on `prefers-reduced-motion: reduce`

## Hero

- Full viewport (`min-h: 680px`)
- Background: `<video src="/hero.mp4">` autoplay-muted-loop · deep blue gradient fallback (`#143F73 → #1E5C9F → #4A6F8F`) always rendered behind so absence is graceful
- Reduced motion: video element removed, gradient remains
- Overlay: `bg-gradient-to-t from-urmi-blue-deep/85 via-urmi-blue-deep/40 to-urmi-blue-deep/30`
- Content: ঊর্মি wordmark (lg) → italic "(Urmi — the wave.)" → H1 → 1-paragraph subtext → 2 CTAs (filled white + ghost outline) → bottom-left scroll cue with pulsing line

## Section Treatments

| Section | Background | Notable element |
|---|---|---|
| Hero | Deep blue gradient + optional video | Pulsing scroll cue with white vertical line |
| Pillars | `mist` | Wave-clip-top cards with rise-in animation |
| By the Numbers | `urmi-blue-deep` | White serif numbers + amber underlines |
| Crafts | `mist` | Alternating row magazine, image left/right with bordered stat |
| Sustainability | `mist → sage-soft gradient` | Radial diagram, sage core, ripple borders |
| Products | `mist` | Asymmetric grid (2 hero + 4 medium with offset) |
| Impact | `mist` | Active large circular image + thumbnail row |
| Factories | `white` | Google Map (or SVG fallback) + factory data panel |
| Clients | `mist` | 6-col grid of logo+name cards |
| Awards | `white` | 4-col grid of square award visuals |
| CTA | `urmi-blue-deep` + photographic underlay 20% + SVG cloth-ripple | Filled white + 2 ghost CTAs |
| Footer | `urmi-blue-deep` | 3-col with Bengali wordmark + sitemap + newsletter |

## CTA System

- **Primary:** filled `white` background, `urmi-blue-deep` text, hover swaps to `wave-blue` background + white text. 32px horizontal padding, 14px vertical. Text is uppercase tracking-0.15em, 12-13px font.
- **Secondary:** ghost `border-white/80` with white text on dark sections; ghost `border-urmi-blue` with `urmi-blue` text on light. Hover fills background.
- **Tertiary (text-only):** `urmi-blue` color with right-arrow that translates 4px on hover. Uppercase 11-12px.

## Iconography

- Hand-drawn inline SVG only (per knowledge base hard rule)
- 12 icons in `~/components/ui/Icon.tsx`: arrow-right, arrow-down, menu, close, droplet, leaf, check, plus, mail, instagram, linkedin, facebook
- Stroke 1.5px, rounded line caps, no fills

## Imagery Treatment

- 3% warm-noise grain overlay on photographic sections (Pillars, Crafts)
- No drop shadows, no rounded corners on hero photography
- Hover scale: 1.04× over 700ms ease-out-soft
- Hover saturate: 0.85 on Products tiles
- Aspect ratios: 4:5 (portrait), 5:4 (hero tile), square (Awards, IMPACT thumbs)

## Accessibility

- WCAG AA contrast minimum on all text
- All buttons have aria-labels
- Logo image has alt="Urmi Group"
- All sections have `id` matching navbar links
- Keyboard nav for IMPACT carousel (left/right arrows)

---

## Implementation match with current React build

| Token / pattern | In `src/` today | Match status |
|---|---|---|
| Color tokens | `src/index.css @theme` | ✅ Exact match |
| Typography stack | `index.html` Google Fonts link | ✅ Exact match |
| Hero treatment | `Hero.tsx` | ✅ Match |
| Pillars wave-rise | `Pillars.tsx` | ✅ Match |
| ByTheNumbers count-up | `ByTheNumbers.tsx` + `CountUp.tsx` | ✅ Match (real numbers on first paint) |
| Crafts alternating rows | `Crafts.tsx` | ✅ Match |
| Sustainability radial | `Sustainability.tsx` | ✅ Match |
| Wave-clip-top CSS | `index.css .wave-clip-top` | ✅ Match |

**Variation A is essentially a documentation of the as-built homepage.** Selecting it requires the smallest implementation effort.
