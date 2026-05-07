# Design Guide — Urmi Group Marketing Homepage

**Generated:** 2026-05-07 by `/fullstack-pm urmi --phase P3-design`
**Companion:** [Domain Research](./URMI_DomainResearch.md)
**Variations:** [`DESIGN_SYSTEM_A.md`](./DESIGN_SYSTEM_A.md) · [`DESIGN_SYSTEM_B.md`](./DESIGN_SYSTEM_B.md) · [`DESIGN_SYSTEM_C.md`](./DESIGN_SYSTEM_C.md)

---

## Hero positioning of each variation

### Variation A — "Editorial Wave" (steady iteration of the as-built)

> *The polished magazine cover of a sustainable industrial group.*

Closest to the current build. Mid-density layouts, grain-overlaid editorial photography, Playfair Display + Inter, blue-driven palette with sage accents in the sustainability section. Wave-curve clip-paths divide sections. Soft reveal + count-up animations. Hero is a full-bleed video with a deep blue overlay.

**Best for:** clients who liked the v2 direction and want polish, not reinvention. Lowest implementation risk because it matches the React build already in `src/`.

### Variation B — "Atelier" (sparse, museum-quality)

> *Loro Piana with a Bengali soul.*

Sparse. Whitespace as the dominant element. No hero video — the H1 itself is the hero, set in a heavy editorial serif at 7vw. Photography appears only where it earns its place (Pillars, Crafts), framed in thin dark lines. The Bengali wordmark is upgraded to first-class hero treatment. Sage and amber are dialed down; the page is mostly mist + ink + a single wave-blue accent line.

**Best for:** clients chasing a "quiet luxury" feel akin to Loro Piana, Cuyana, Aman. Reads as more bespoke; least like SaaS.

### Variation C — "Cinematic Mill" (deep, photographic, Brandix-tier)

> *A film about a factory.*

Dark navy as the dominant background. Heavy photography across every section — the homepage is a series of full-bleed cinematic frames intercut with cream callout cards. Type pairs Tiempos Headline (display) with IBM Plex Mono (caption uppercase) for a Sebastião Salgado documentary feel. Animations cross-fade like film cuts; section transitions use photographic dissolve, not wave-curve.

**Best for:** clients who said "Brandix" and meant it: dramatic, cinematic, scale-asserting. Highest implementation cost (more imagery, more motion), highest risk if photography isn't strong.

## What's the SAME across all three

These are locked — variations cannot diverge on these without re-opening v2 brand decisions:

- Brand blue `#1E5C9F` primary (sampled from logo)
- Bengali wordmark ঊর্মি appears in hero + footer
- Wave metaphor present in every section copy
- All 12 sections present, in the same order, with the same numbers
- "Six crafts" (not seven), "Four pillars" (not "Four waves"), "Years of craft" (not "Years on the river")
- Hand-drawn inline SVG icons only (no Lucide, no Heroicons)
- WCAG AA contrast, prefers-reduced-motion respected
- No exclamation marks, no banned vocabulary
- Newsletter signup is UI-only (no backend yet)

## What differs across the three

- **Color palette balance** — blue dominance is constant, but the *secondary* (sage / amber / mist) ratios change
- **Typography pairing** — display serif and body sans both differ
- **Imagery density** — A is mid, B is sparse, C is dense
- **Section divider language** — A uses wave-curve clip-paths, B uses thin rule lines, C uses photographic transitions
- **Hero treatment** — A has video + overlay, B has type-only, C has cinematic photography
- **Motion vocabulary** — A is soft reveals + count-up, B is type-only animations + restraint, C is film-style cross-fades

## Decision criteria for the client

When choosing A/B/C, weigh:

1. **Photography reality** — Variation C requires a serious photo budget (knowledge base §13: $3k–$8k half-day shoot). Variation B can ship with very little photography. Variation A is in between.
2. **Implementation effort** — Variation A is closest to what's already coded in `src/`. B and C require larger React refactors.
3. **Industry positioning** — Variation B will read as "luxury manufacturer" (good for premium European brands); Variation C reads as "industrial scale + craft" (good for mass-market activewear); Variation A is the diplomatic middle.
4. **Time-to-launch** — Variation A is fastest to ship (existing React build needs minor color tuning). B and C require fresh component work.

## Showcase entry point

After P3a–P3c, the user-facing entry point is:

```
.claude-project/design/variations/showcase-ALL.html
```

Open it in any browser to side-by-side compare A / B / C of the homepage hero + a representative interior section.

---

*Pick a variation by editing `DESIGN_STATUS.md` or by responding to the AskUserQuestion prompt at the end of P3c.*
