# Variation Prompts — Urmi Group Homepage

Compact LLM-style prompts that capture the visual direction of each variation. Use these to brief designers, generate further pages in a chosen direction, or seed image-generation tools.

---

## Variation A — "Editorial Wave"

```
PROJECT — URMI HOMEPAGE V2 (Variation A: Editorial Wave)

Inherit brand system: urmi-blue #1E5C9F (primary), urmi-blue-deep #143F73,
wave-blue #7BB6E8, sage #5B8C7E (sustainability section only),
mist #F4F7FB (page bg), ink #0F1E33, amber #C8956D (single warm accent
for stat underlines).

Type: Playfair Display serif for display, Inter sans for body, Hind Siliguri
for Bengali wordmark. 12-col grid, 1440px max width, generous whitespace,
scroll-triggered reveals only.

NAVBAR — sticky, transparent over hero → solid mist on scroll past 80px.
  Left: Urmi logo image (40px tall).
  Right: Home · About · Craft · Portfolio · Sustainability · Clients · Connect.
  Hover: wave-blue underline animates left-to-right.

HERO — full viewport, dark blue gradient (#143F73 → #1E5C9F) with optional
video underlay; deep blue overlay; centered ঊর্মি wordmark (Hind Siliguri),
italic "(Urmi — the wave.)" caption, H1 "The wave that clothes the world."
in Playfair, two CTAs (filled white + ghost outline), bottom-left scroll cue
with pulsing white vertical line.

PILLARS — 4 wave-edge cards (clip-path top edge), full-bleed image with
mist info-band overlay at bottom 20%. Stagger-rise animation 150ms apart.
Cards: ৪০+ Years of craft / 16,800 Hands shaping every thread / Full Green
factory group / 30+ Global brands trust us daily.

NUMBERS — urmi-blue-deep background, Playfair serif numerals (clamp 5.5rem),
amber underlines draw on view. 44+ tons / 2,50,000+ garments / 4,000+ m³ /
2030. Numbers render real value on first paint; count-up animates last 30%.

CRAFTS — alternating-row magazine layout (image left/right). Each row:
hero photograph 60% width with overlay caption, copy 40% width with
description, amber-bordered stat, "See the process →" CTA. Six crafts
in order: Garments · Textile · Printing · Shipping · Embroidery · Washing.

SUSTAINABILITY — non-scroll radial diagram. Mist→sage-soft gradient bg.
Sage circular core (96 lg) with active commitment + icon. 5 surrounding
cards in 3-col grid: Zero-Discharge ETP (4,000 m³/day) · Full Green Factory
(LEED) · Decarbonization 2030 · Circular Water · Certified/Audited. Click
to swap core. Two ripple ring borders animate continuously around the core.

ALL OTHER SECTIONS — Products (asymmetric grid), Impact (manual carousel),
Factories (Google Map / SVG fallback), Clients (12-card grid), Awards
(4-col grid), CTA (urmi-blue-deep + cloth-ripple SVG), Footer.

GLOBAL — 600–900ms ease-out reveals; no auto-cycle; no Lucide; no
glassmorphism; no rounded image corners; no gradients except hero overlay
and sustainability mist→sage transition. 3% grain on photographic sections.
Reduced-motion media query disables all animation.

SUCCESS LOOK — clean magazine cover meets industrial portfolio. Polished
but not glossy. Professional, restrained, brand-distinct.
```

---

## Variation B — "Atelier"

```
PROJECT — URMI HOMEPAGE (Variation B: Atelier)

Inherit blue palette but DIAL DOWN sage and amber to near-zero. Primary:
urmi-blue #2167B6 (slightly brighter cobalt), deep #163E78. Background:
paper #FBFCFD (warm-leaning near-white) and mist #F8FAFC. Text: ink
#0E1A2D for headlines, slate-text #586474 for body. NO warm accent —
dividers are 1px ink hairlines.

Type: Tiempos Headline (or Playfair) heavy serif for display, Söhne (or
Inter) sans for body, Hind Siliguri PROMOTED to display sizes (4.5rem)
for hero wordmark. 1280px max content width (NARROWER than A). Section
padding clamp(7rem, 14vw, 12rem) — 1.4× more whitespace than A.

NAVBAR — same 7 items, but text-only nav links with no underline animation;
hover changes color to wave-blue. Mobile drawer is paper-themed.

HERO — TYPE-DRIVEN. No video, no full-bleed photography. Centered column
880px max. Stack:
  1. ঊর্মι wordmark in Hind Siliguri 4.5rem urmi-blue-deep (top)
  2. Italic "(Urmi — the wave.)" caption sitting in a hairline-bordered chip
  3. H1 in Tiempos 7.5rem ink "The wave that clothes the world."
  4. Subtext (2 lines) slate-text
  5. Two text-only CTAs separated by vertical hairline:
     "Discover Our Story | Partner With Us" — underline-on-hover only
  6. Single 1px wave-blue hand-drawn wave SVG drifting across bottom 30%
No buttons, no overlay, no scroll cue arrow.

PILLARS — borderless type+stat blocks (no images in this section).
4 cards become large numerals + caption only. The 4 photographs from
/img/waves/ relocate to a NEW "Faces of the work" section right below
Pillars, with 1px ink-bordered photo frames and very generous whitespace.

NUMBERS — paper background. Static numerals (no count-up animation).
Single ink hairline above + below the row.

CRAFTS — alternating rows but lighter — single small hero image per row
(max 480px wide) with copy taking 60% width. 1px ink borders around each
photograph. No grain overlay. No hover scale.

SUSTAINABILITY — same radial diagram structure but core is paper with
sage hairline border (not solid sage fill). Pillar cards are paper with
sage left-rule. Bigger gap between cards.

ALL OTHER SECTIONS — kept structurally similar to A but stripped of
ornament: no hover lifts on Clients, no photographic underlay on CTA
(just urmi-blue-deep + 1px brass frame inset), Products grid becomes
symmetric 3×2 (not asymmetric).

CTA — text+arrow only, no button shape. urmi-blue color, hover underlines
in wave-blue. Used everywhere across the site. The CTA SECTION uses filled
white-on-dark for the only "real button" moments.

GLOBAL — 8px Y reveals (gentler than A), 600ms ease-out. No count-up.
No wave-rise. No grain. 1px ink hairline section dividers.

SUCCESS LOOK — Loro Piana / Cuyana / Aman. Whitespace-as-luxury.
Quiet, museum-considered. Bengali wordmark is the visual hero.
```

---

## Variation C — "Cinematic Mill"

```
PROJECT — URMI HOMEPAGE (Variation C: Cinematic Mill)

DARK NAVY DOMINATES. Primary: urmi-blue-deep #0E2748 (70% of page sits
on this), urmi-blue-night #061528 (CTA + footer). Cream callouts: cream
#F5EFE3 with paper-text #2A1F12. Single luxury accent: brass #B8924E
(replaces amber). Sustainability: moss #4A7864 (slightly richer than
sage A/B for cinematic contrast). Text on dark: night-text #E8EEF8.

Type: Tiempos Headline (or Playfair) heavy serif for display, Inter
medium-weight for body legibility on dark, IBM Plex Mono tracked-out
0.15em for ALL captions, eyebrows, year markers, stats. Hind Siliguri
heavier weight 600 for Bengali.

NAVBAR — sticky, transparent over hero → urmi-blue-deep solid background
on scroll. Logo + 7 nav items. Caption-style hover with mono accent.

HERO — FULL-BLEED CINEMATIC PHOTOGRAPH (river at golden hour OR cotton
field — Munem Wasif / Sebastião Salgado tone). Heavy dark gradient:
urmi-blue-night → urmi-blue-deep/80 → urmi-blue-deep/30. Brass 1px
frame inset 32px from all edges (Aman-style cinematic frame). Content
LEFT-ALIGNED at 60% from top:
  1. Mono caption: "ঊর্মি · URMI · EST. 1955" — cream tracked-out
  2. H1 white serif 6.5rem "The wave that clothes the world."
  3. Italic Tiempos cream "Forty years on the river. Sixteen thousand hands."
  4. Two CTAs: filled cream + ghost wave-blue outline
Bottom-right: timestamp-style frame counter "01 / 12" in mono brass.

PILLARS — cards become DARK CREAM CALLOUTS ON FULL-BLEED PHOTO STRIP.
4 photographs run continuously horizontally behind, callout cards float
on top with cream backgrounds (each 320px wide), stat in Tiempos +
caption in mono. Photographs are heavily warm-graded.

NUMBERS — urmi-blue-night (deepest background). Mono uppercase eyebrow
captions. Tiempos numerals in cream. Brass underlines (no amber).
Ripple animation behind each numeral: subtle expanding circle in
wave-blue 10% opacity.

CRAFTS — each craft is a 1-page-tall photographic moment (full-bleed,
warm-graded, 16:9). Cream callout overlays bottom-left at 480px wide
with name (Tiempos), description (Inter), brass-bordered stat,
"See the process →" CTA. Section transitions are PHOTOGRAPHIC CROSS-FADES
(no clip-paths, no rules) — each photo dissolves into the next.

SUSTAINABILITY — urmi-blue-deep → moss-deep gradient. Same radial
diagram structure but core has BRIGHT GLOW RING in wave-blue-bright
#8FCBFF — single moment of brightness on the entire page. Commitment
cards are dark-on-dark with cream stat highlights and brass icons.

PRODUCTS — DIAGONAL split: cream triangle (top-left) + urmi-blue-deep
triangle (bottom-right). 6-tile asymmetric grid spans the diagonal.
Each tile is a film-still-style frame with brass border.

IMPACT — active value occupies 90% of viewport width as cinematic
photographic frame with cream caption card overlaid. Thumbnail row at
bottom is small with mono captions only.

FACTORIES — cream background interlude. Map zoomed deeper, markers are
BRASS pins (not blue Pin glyphs). Right data panel uses mono captions.

CLIENTS — urmi-blue-deep. Logos in single white-on-dark mono row, 6
visible at a time, smooth horizontal hover-scroll (NOT autoscroll).
Brass underline draws on hover.

AWARDS — cream interlude. 4-col grid; each award is film-still square
with brass-edged frame.

CTA — urmi-blue-night (deepest). Brass 1px frame inset. H1 cream serif
6.5rem. Three CTAs side-by-side: filled cream + 2 ghost brass.

FOOTER — urmi-blue-night, mono caption styling everywhere, more vertical
breathing room than A.

GLOBAL — 1.2s scale-and-fade reveals (slower, more dramatic). Photographic
cross-fade between sections. Parallax on hero (image translates at 0.7×
scroll speed) — disabled under reduced-motion. 5% grain on all photography
(heavier than A). Vertical scroll-progress indicator on right edge in brass.

SUCCESS LOOK — A documentary about a Bangladeshi factory, in full-page
glossy magazine form. Brandix ambition, Salgado photography, Aman framing.
The riskiest and most rewarding option.
```

---

## How these prompts get used

- After the user picks a variation in P3d, `DESIGN_SYSTEM.md` is set to a copy of the chosen `_X.md` file
- Designers / engineers reference the chosen variation's prompt block when generating additional pages
- `/fullstack-dev` reads `DESIGN_SYSTEM.md` during D6-frontend to enforce token consistency
- These prompts are also useful for AI image generation: paste the relevant variation block into Midjourney / Flux Pro / Ideogram with `[hero photograph]`, `[craft hero — embroidery]`, etc. as the section anchor
