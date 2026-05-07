# DESIGN_STATUS — urmi

| Field | Value |
|---|---|
| Project | urmi |
| Owner | /fullstack-pm (PM track) |
| Last updated | 2026-05-08T18:08:52Z |
| Iteration | 6 (navbar — solid urmi-blue bg, white text, single-logo no wordmark) |

---

## Variation Selection (P3d)

```yaml
selected_variation: D
selected_variation_name: Cinematic Tide
approved: true
approved_at: 2026-05-07T16:20:04Z
approved_by: development-pipeline@riseuplabs.com
approval_method: AskUserQuestion in /fullstack-pm urmi --phase P3-design
approval_context: >
  User synthesized a fourth variation in response to A/B/C: "high cinematic
  but not dark navy blue dominant; soothing shade of green along with blue
  which represents sustainability and wave." Variation D was generated to
  match (DESIGN_SYSTEM_D.md) and explicitly locked in.
```

The chosen variation's design system is mirrored at `.claude-project/design/DESIGN_SYSTEM.md` (a copy of `DESIGN_SYSTEM_D.md`).

## Snapshot (P3g — used by /fullstack-dev Tier 2 verification)

```yaml
phase_complete: true
roles: [marketing]
prd_hash_at_generation: "85a98756f102a5135ec2f5173e24eb92d761ff14ba0d7f5897251fbae0e4f250"
prd_version: "v1"
html_bundle_hash: "2abeeda48af6e1810e3262a2f5dc419f7fcb422dc7b8e4623f89f26eda1a041e"
html_bundle_hash_at_approval: "82bcf59d436865c40be8b9a836a8be309e42c1fabda1bca31e99965e461caa0b"
generated_at: "2026-05-08T18:08:52Z"
```

### Iteration log

| Iter | At | Hash | Change |
|---|---|---|---|
| 1 | 2026-05-07T16:20:04Z | `82bcf59d…` | Initial P3e role-folder generation (variation D, 12 sections, CSS gradients for imagery) |
| 2 | 2026-05-07T16:32:41Z | `1ed0423a…` | Crafts section restyled to KPR-Mill horizontal scroll-snap + real photography from `assets/crafts/` (6 user-supplied PNGs). Portfolio section restyled to Vivienne-Rose-inspired refined editorial (asymmetric hero diptych + 4-up restrained grid). PRD content unchanged → `prd_hash_at_generation` is stable. |
| 3 | 2026-05-07T16:45:54Z | `c5892f0f…` | Portfolio section v2 — replaces the diptych+grid with the actual Vivienne Rôse vocabulary captured from screenshots: 3D rotating square deck (active panel 1:1 + tilted siblings on each side), cardinal up/down/left/right nav, ocean-wave SVG frame (replacing Rôse's solid-red bezels), numbered family index `(01) Active (02) Evening …`, italic serif inline emphasis, mono campaign tags. Section background switches from paper to `urmi-blue-deep` for the dark deck-on-water effect. PRD unchanged. |
| 4 | 2026-05-07T17:35:17Z | `325c6cb1…` | Five-part overhaul addressing visibility + flow feedback. (a) **Navbar:** real transparent-bg logo PNG (`assets/urmi-logo-mark.png`) + serif italic "Urmi" wordmark + 3-column masthead layout (search·logo·primary nav). Frosted-paper backdrop is now ALWAYS visible (no more white-on-white at top of page). Hairline wave under the bar adds a fashion detail without grabbing attention. (b) **Hero:** two stacked `<video>` elements (`hero-part-1.mp4` + `hero-part-2.mp4`) with a JS controller that crossfades between them on `ended` so the two clips play as one continuous looping film. Soft sunlit gradient overlay (no dark navy) keeps the airy palette. Frame counter cycles "PART 1 / 2" ↔ "PART 2 / 2". (c) **Pillars:** wave-flow layout — 4 square cards offset along a sine pattern (`--rest-y` per card: 0px → 36px → 14px → 50px), wavy left-corner clip-path on every frame, IntersectionObserver triggers staggered wave-rise animation when section enters viewport. Real photography from `assets/waves/`. (d) **By the Numbers:** complete rebuild as a bento dashboard with 8 mixed-color tiles (wave-blue-soft, cream-with-portrait-image, tide, paper, tide-soft, urmi-blue-deep, paper, wave-blue-soft) at varied sizes; embeds the `hands.jpg` image as a portrait-style tile (replacing dashboard's Dean Ambrose); animated counters (real values on first paint, count-up enhancement); inline SVG line chart for decarbonization progress; mini progress bar; YoY trend chips. (e) **Section transitions:** 6 wave-shaped SVG dividers inserted at section boundaries (Hero→Pillars, Pillars→Numbers, Numbers→Crafts, Sustainability→Portfolio, Portfolio→Impact, Awards→CTA) — color-handoff transitions with double-wave paths for depth. PRD unchanged. |
| 5 | 2026-05-07T17:57:27Z | `b00f16a6…` | Two-section overhaul. (a) **Pillars** rebuilt to match Cozyspace inspiration: soft tide-mist rounded container ("pill"), centered fashion masthead header ("Four pillars, _crafted just for you._" + sage italic accent + green Book Now-style pill CTA), and a continuous right-to-left **marquee** of 4 image cards duplicated 2× for seamless loop. Each card has a curtain-style clip-path (rounded top + scooped bottom), per-card subtle rotation (-2.5° → -1° → 1° → 2.5°) creating the Cozyspace fan-tilt feel, and gradient/edge fades at the container edges. Pause-on-hover. (b) **Crafts** rebuilt as a workflow pipeline: 6 craft nodes in production sequence (Textile → Printing → Embroidery → Garments → Washing → Shipping) connected by a continuous **wavy SVG path** that snakes between them (innovation as a continuous wave). Three traveling pulse dots animate along the path with staggered 3s delays via SVG `<animateMotion>`. Mobile fallback: vertical stack with a vertical wavy connector + single traveling pulse. Closing innovation moment: concentric wave rings ripple outward around a paper-circle stamp reading "Innovation, continuous." with a closing CTA. PRD unchanged. |
| 6 | 2026-05-08T18:08:52Z | `2abeeda4…` | Navbar fixes: (a) **single logo** — removed the "Urmi" + "Est. 1955" serif wordmark that sat beside the logo image (was reading as a duplicate logo). The navbar now shows only the actual `urmi-logo-mark.png` centered, slightly larger (h-10 mobile / h-12 desktop). (b) **solid urmi-blue-deep background** replaces the frosted-paper backdrop. All nav text + the hamburger icon now use `paper` (white). Hover state shifts to `wave-blue`. Search icon stroke and hairline wave under the bar both updated for the dark base. The "Connect" pill CTA now uses a paper border (filled paper on hover, ink text). Active "home" indicator and primary nav are all paper-white — readable against any underlying hero frame. PRD unchanged. |

### Field semantics

- **`phase_complete: true`** — P3-design has fully finished (all sub-steps P3a/P3b/P3c/P3d/P3e/P3f/P3g are done).
- **`roles: [marketing]`** — exact folder name(s) under `design/html/`. Single role for this homepage-scope run; will expand to multiple roles when /fullstack-pm regenerates for additional pages.
- **`prd_hash_at_generation`** — SHA-256 of the canonical PRD's normalized content at the moment of P3g. /fullstack-dev's Tier 2 consistency check rehashes the current PRD and refuses to proceed if it differs (signals the PRD changed after the design was approved — re-run P3-design before /fullstack-dev).
- **`prd_version`** — corresponds to `prd/history/PRD_v1.{md,hash}` snapshot.
- **`html_bundle_hash`** — deterministic hash of all HTML in `design/html/**` (sorted file paths + contents). /fullstack-dev tracks this to detect manual edits to the design HTML between approval and ingestion.
- **`generated_at`** — ISO 8601 UTC timestamp of P3g completion.

## Output inventory

```
.claude-project/
  design/
    DESIGN_SYSTEM.md                            ← copy of DESIGN_SYSTEM_D.md
    DESIGN_SYSTEM_A.md                          ← variation A reference
    DESIGN_SYSTEM_B.md                          ← variation B reference
    DESIGN_SYSTEM_C.md                          ← variation C reference
    DESIGN_SYSTEM_D.md                          ← variation D — SELECTED
    URMI_DesignGuide.md
    URMI_DomainResearch.md
    URMI_VariationPrompts.md
    variations/
      A-home.page.html
      B-home.page.html
      C-home.page.html
      D-home.page.html
      showcase-ALL.html                         ← side-by-side comparison
    assets/
      urmi-logo-mark.png                        ← transparent-bg logo for navbar
      video/
        hero-part-1.mp4                         ← hero video, plays first (5.6 MB)
        hero-part-2.mp4                         ← hero video, plays second (4.0 MB)
      waves/
        years.jpg                               ← Pillar 01 — Years of craft
        hands.jpg                               ← Pillar 02 + Numbers bento portrait tile
        full-green.jpg                          ← Pillar 03 — Full Green factory group
      crafts/                                   ← 6 real craft photos (user-supplied)
        garments.png
        textile.png
        printing.png
        shipping.png
        embroidery.png
        washing.jpg
    html/
      marketing/
        home.page.html                          ← P3e role-folder output (iteration 4)
  status/
    urmi/
      seed-2026-05-07.yaml                      ← P1-spec seed
      PIPELINE_STATUS.md                        ← phase progress
      DESIGN_STATUS.md                          ← THIS FILE
      DESIGN_QA_STATUS.md                       ← P3f QA verdict (PASS, 0.94)
    .gate-proofs/
      P1-spec.proof
      P2-prd.proof
      P3-design.proof                           ← will be written by gate-runner
  prd/
    URMI_PRD.md                                 ← archive copy of PRD
    history/
      PRD_v1.md                                 ← versioned snapshot
      PRD_v1.hash
  docs/
    PRD.md                                      ← canonical PRD
```

## Handoff to /fullstack-dev

After P3g completes successfully (gate passes), `/fullstack-dev urmi --run-all` becomes runnable.

The Dev track will:
- **Tier 1 — File presence:** verify `docs/PRD.md`, `design/html/marketing/home.page.html`, and `DESIGN_STATUS.md` with `approved: true` all exist. ✅
- **Tier 2 — Hash consistency:** rehash the current PRD and compare to `prd_hash_at_generation`. If equal, design and PRD are coherent. ✅ (will pass on the first /fullstack-dev run since nothing has touched the PRD since P3g)
- **Tier 3 — Role folders:** verify each `roles[i]` is a folder under `design/html/` with at least one HTML file. ✅
- **D2-tech-spec onward:** derive `PROJECT_KNOWLEDGE.md`, `PROJECT_API.md`, `PROJECT_DATABASE.md` from this PRD (the marketing-site case will produce a small KNOWLEDGE doc and largely empty API/DATABASE docs since there is no backend yet).

## Notes

- The actual React build at `d:\Urmi\src\` was created **before** this PM track ran. Variation D's design language matches that build closely enough that the React code can be re-skinned to D's palette in 3–5 days (per DESIGN_SYSTEM_D §"Implementation cost"). If you want the React app to formally adopt Variation D, run `/fullstack-dev urmi --phase D6-frontend` after this PM track ends — the frontend phase reads `DESIGN_SYSTEM.md` and will surface drift between the approved design and the existing src/ tokens.
- Real photography is still pending. Both this PM design HTML and the React build use placeholders. ASSETS.md remains the authoritative TODO-replace registry.
