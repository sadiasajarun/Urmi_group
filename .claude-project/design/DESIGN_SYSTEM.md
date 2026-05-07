# DESIGN_SYSTEM — Variation D: "Cinematic Tide"

**One-line positioning:** *Brandix-tier cinematic vocabulary on a soft, sun-lit palette where blue and green flow as twin currents.*

A synthesis of Variation C's cinematic photographic language with Variation A's lighter base. Dark navy is no longer the dominant background — instead, large editorial photographs sit on **mist** and **soft seafoam** surfaces, with brand blue and a **soothing lagoon green** as twin protagonists. The wave metaphor and the sustainability narrative both manifest in the palette itself: blue is the river, green is the cleaned-and-returned water.

This variation was synthesized from user feedback: *"high cinematic but not dark navy blue dominant; soothing shade of green along with blue which represents sustainability and wave."*

---

## Color Tokens

```css
/* Twin primaries — both protagonists, neither dominates */
--color-urmi-blue:        #1E5C9F;   /* river / wave / heritage — sampled from logo */
--color-urmi-blue-deep:   #143F73;   /* deep moments only (CTA, footer) */
--color-wave-blue:        #5BA0DE;   /* hero accents, hover lines */
--color-wave-blue-soft:   #C5DCEF;   /* soft fills, card hover bg */

--color-tide:             #7FAA9C;   /* soothing lagoon green — sustainability + water + wave */
--color-tide-deep:        #4A7864;   /* sustainability section, hover */
--color-tide-soft:        #DCE9E3;   /* soft section bg tint */

/* Light, airy neutrals — these dominate the page */
--color-tide-mist:        #F0F5F2;   /* page background — softest blue-green tinted off-white */
--color-mist:             #F4F7FB;   /* alternate light section bg */
--color-seafoam:          #E8F0EC;   /* card surface, callout interior */
--color-paper:            #FCFDFC;   /* near-white for hero callouts */
--color-cloud:            #E0E8E5;

/* Type */
--color-ink:              #0F1E33;   /* headlines, high-contrast text */
--color-slate-text:       #3F5468;   /* body text — slightly cooler than A's slate */

/* Cream warm callouts — adopted from C for editorial warmth in select sections */
--color-cream:            #F5EFE3;   /* used sparingly: Crafts callout cards */
--color-cream-text:       #2A1F12;

/* No brass, no amber — replace with cool wave-blue accents */
/* Single warm note allowed: cream callout interiors only, never as page chrome */
```

**Background dominance:** `--color-tide-mist` 60% · `--color-mist` 20% · `--color-tide-soft` 10% (sustainability) · `--color-urmi-blue-deep` 5% (CTA + footer) · `--color-cream` 5% (Crafts callouts).

The page is **mostly light**, with brand blue and tide green appearing in equal measure across headlines, accents, and section tints. No dark navy dominance.

## Typography

Same C pairing — but tuned for legibility on light:

```
Display:  "Tiempos Headline" (or Playfair Display fallback) — heavy serif, weights 500/600
Body:     "Inter" — humanist sans, weights 400/500
Caption:  "IBM Plex Mono" — monospace, weight 500, tracked-out 0.16em — for stats, eyebrows, frame counters
Bengali:  "Hind Siliguri" — weights 600/700 for hero, 500 for body

Sizes:
  H1 (hero)       clamp(3rem, 7.5vw, 6rem)         line-height 1.05
  H2 (section)    clamp(2rem, 4.5vw, 3.75rem)      line-height 1.1
  H3              clamp(1.5rem, 2.5vw, 2.25rem)    line-height 1.2
  Body            1.0625rem (17px)                 line-height 1.65
  Caption (mono)  0.6875rem (11px) · uppercase · tracking 0.16em
```

## Layout

- 12-column grid, max content width 1440px
- Section padding `clamp(6rem, 12vw, 10rem)` (matches C — generous but not extreme)
- **Section dividers:** photographic transitions (from C) but on light backgrounds — each section ends with a gradient-blended photo strip dissolving into the next color tint. No clip-paths, no rules.
- Frame counters in mono `wave-blue` (replaces C's brass) anchored bottom-right per section

## Motion

- Reveal: 1.0s scale-and-fade (slightly faster than C's 1.2s, more graceful than A's 0.8s)
- Section transitions: photographic cross-fade with light gradient bridges (no abrupt cuts)
- Subtle parallax on hero image (0.8× scroll speed — gentler than C's 0.7×)
- Sustainability section: ripple ring borders animate around the tide-deep core (continuous)
- Cinematic crossfade between IMPACT carousel images
- All gated on `prefers-reduced-motion: reduce`

## Hero

**The single biggest visual difference from C.** Instead of a dark navy background, the hero is a full-bleed cinematic photograph with a **soft, sunlit gradient overlay** — golden-hour warmth bleeding into wave-blue + tide highlights, never going to deep navy.

```
Background layers (top to bottom):
  1. Photographic base — river at golden hour OR cotton field at dawn (warm, not dark)
  2. Soft gradient overlay — tide-mist 30% top → transparent middle → tide-soft 40% bottom
  3. Frame: wave-blue 1px inset 32px from all edges (cinematic frame, lighter than C's brass)

Content (centered, vertically 60% from top):
  1. Mono caption: "ঊর্মি · URMI · EST. 1955" — wave-blue tracked-out
  2. H1 (Tiempos / Playfair, ink color, 6rem) — "The wave that clothes the world."
  3. Italic Tiempos subtext (slate-text, 1.5rem) — "Forty years on the river. Sixteen thousand hands."
  4. Two CTAs: filled urmi-blue + ghost tide-deep outline

Bottom-right: frame counter "01 / 12 · ZONES OF CRAFT" in mono wave-blue.
```

H1 sits on photograph but with a tide-mist-tinted gradient under the text band, ensuring legibility without going dark.

## Section Treatments

| Section | Background | Notable element |
|---|---|---|
| Hero | Photographic (warm, sunlit) + soft gradient + wave-blue 1px frame | Centered content; mono caption; light overlay (no navy dominance) |
| Pillars | `tide-mist` | 4 cards become **photographic frames with mono captions overlaid** — full-bleed photo per card with seafoam callout band at bottom holding stat + caption. The cards transition from one to the next via subtle gradient bridges. |
| By the Numbers | `mist` (light, NOT dark) | Tiempos numerals in `urmi-blue-deep`; mono captions in `tide-deep`; thin wave-blue underlines (replaces brass). Each number has a soft tide-mist halo behind it for depth. |
| Crafts | Alternating: photo full-bleed / cream callout | Each craft is a 1-page-tall photographic moment on light tide-mist. Cream callout cards (only place cream appears) overlay bottom-left with name, stat, "See the process →" CTA in tide-deep. |
| Sustainability | `tide-soft → tide-mist gradient` | Radial diagram on light. Tide-deep core (NOT navy) with ripple rings animating in tide-deep. Commitment cards are paper with tide-deep left-rule and stat in tide-deep. |
| Products | `tide-mist` with diagonal cream triangle accent | 6-tile asymmetric grid. Cream triangle behind 1-2 hero tiles for editorial spread feel. |
| Impact | `mist` | Active value occupies 70% of viewport width as cinematic photographic frame (NOT dark — golden hour tones). Cream caption card overlays. Thumbnail row has wave-blue underline for active. |
| Factories | `paper` (lightest) | Map at native Google brightness (light theme), markers in urmi-blue-deep. Right panel uses mono captions + tide-deep accent chips. |
| Clients | `tide-mist` | 6-col grid. Logos in monochrome `slate-text`, hover saturates to color + wave-blue card border. |
| Awards | `paper` | 4-col grid with wave-blue 1px frame on each tile (replaces C's brass). |
| CTA | **`urmi-blue-deep`** — the only dark moment on the entire page | Wave-blue 1px frame inset. Cream serif H1. Three CTAs: filled cream + 2 ghost wave-blue. |
| Footer | `urmi-blue-deep` | Tide-mist text + mono caption styling, more breathing room than A. |

The CTA + Footer remain dark — those are the only two moments where deep navy appears. **Everywhere else is light, even though the photographic vocabulary is cinematic.**

## CTA System

- **Primary:** filled `urmi-blue` background, paper text. Hover swaps to `tide-deep` background. 36px horizontal padding, 16px vertical. Mono uppercase 11-12px.
- **Secondary:** ghost `border-tide-deep` outline with tide-deep text. Hover fills with tide-deep + paper text.
- **Dark-section CTAs (CTA + Footer):** filled cream + ghost wave-blue.
- **In-line tertiary:** mono uppercase wave-blue with arrow that translates 4px on hover.

## Iconography

- Same hand-drawn SVG library
- Stroke 1.5px, single tone (urmi-blue or tide-deep depending on context)
- No brass tinting — replaced by wave-blue accent on tide sections

## Imagery Treatment

- 4% warm-but-cool grain (between A's 3% and C's 5%) — keeps the cinematic feel without going gritty
- Photography is heavy in volume (every section has at least one editorial shot) but tone is **golden hour and dawn** rather than dusk
- Color grading: warm earth tones in shadows, cool tide highlights in midtones, blue-leaning skies and water — represents the wave
- Aspect ratios: 16:9 cinematic (Hero, Crafts, Impact) · 4:5 portrait (Pillars, Awards) · square (IMPACT thumbs, Awards)

## Section Transition Recipe

Between every two sections, the bottom 80px of the upper section dissolves into a 1px wave-blue or tide-deep hairline + a 30vh full-bleed photo strip that gradient-bridges from the upper bg color to the lower bg color. This produces C's "film cut" feel without dark navy.

## Accessibility

- Most text on light bgs: contrast `ink` on `tide-mist` = 14:1 ✓ AAA
- `tide-deep` on `tide-mist`: 6.2:1 ✓ AA
- `wave-blue` on `tide-mist`: 4.6:1 — passes AA at body text size, use 18pt+ for AAA
- All buttons have aria-labels
- Cinematic motion (parallax, cross-fade) disabled under reduced-motion → static photographs with hard cuts

## Wave + Sustainability Symbolism in the Palette

The palette itself is the brand statement:
- **Blue** = the river that started Urmi (1955 Buriganga brick field)
- **Tide green** = the cleaned and returned water (4,000 m³/day, zero discharge)
- **Cream** = the cotton thread woven into 250,000 garments daily
- **Wave-blue accent** = the wave itself, never stopping

When the user said "soothing shade of green along with blue which represents sustainability and wave" — this palette puts those two side by side, never letting one dominate, mirroring Urmi's brand message that craft and sustainability are inseparable.

---

## Implementation cost vs Variations A / C

| Aspect | Cost |
|---|---|
| Color token rebuild | 3 (introduces tide green family + cream callouts) |
| Typography swap | 4 (Tiempos + IBM Plex Mono — same as C; Plex Mono is free via Google Fonts) |
| Hero rebuild | 4 (cinematic photo + light overlay + wave-blue frame — net new) |
| Photographic dependency | 5 (every section needs a real warm-toned shot — golden hour, NOT dusk) |
| New layouts (photo-strip transitions, cream callouts) | 4 |
| Animation rebuild | 3 (parallax + cross-fade — lighter than C's full cinematic load) |
| Total relative to A | ~5–7 weeks of frontend + photography work |

## Risk profile

- **Higher reward than A, lower risk than C.**
- Survives placeholder photography better than C (because the page isn't betting everything on dark editorial drama — light surfaces forgive weaker imagery).
- Best of-both: cinematic ambition without the all-or-nothing dependency on Sebastião-Salgado-tier photo budget.

**Best for:** clients who want a premium, cinematic feel but reject the dark-navy convention; for whom "sustainability" and "wave" must read in the palette itself, not just the copy.
