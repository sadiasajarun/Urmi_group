# Asset Replacement Registry

Every image, video, and logo on the homepage is listed here. Replace the placeholder paths with real Urmi-supplied assets when they arrive.

## Format

| File slot | Component | Status | What to replace it with |
|---|---|---|---|

## Logo

| Slot | Component | Status | Replacement |
|---|---|---|---|
| `/urmi-logo.png` | `Navbar`, `Footer`, `Factories` (HQ marker) | ✅ Real | The user-supplied logo. |

## Hero (Section 2)

| Slot | Component | Status | Replacement |
|---|---|---|---|
| `/hero.mp4` | `Hero` | ❌ MISSING | The 38-second timeline brand film per knowledge-base §8 (or any 8s wave/cotton/thread loop). MP4 H.264, ≤ 4 MB, autoplay-muted-loop. |
| `/hero-poster.jpg` | `Hero` (`<video>` poster + reduced-motion fallback) | ❌ MISSING | Single still from the hero film — golden-hour cinematic, ≤ 200 KB. |

> While both are absent, the hero falls back to a deep-blue gradient with grain. The site still renders correctly.

## Section 3 — Pillars (4 wave-edge cards)

| Slot | Component | Status | Replacement |
|---|---|---|---|
| `/img/waves/years.jpg` | `Pillars` Card 1 | ✅ Real | User-supplied. |
| `/img/waves/hands.jpg` | `Pillars` Card 2 | ✅ Real | User-supplied. |
| `/img/waves/full-green.jpg` | `Pillars` Card 3 | ✅ Real | User-supplied. |
| `/img/waves/global-brands.jpg` | `Pillars` Card 4 | ❌ PLACEHOLDER (Unsplash) | TODO: replace with editorial photo of a brand-wall or container ship — represents "30+ global brands trust us daily." Currently using `images.unsplash.com/photo-1586528116311-...` defined inline in `src/data/pillars.ts`. |

## Section 5 — Crafts (6 craft images)

| Slot | Component | Status | Replacement |
|---|---|---|---|
| `/img/crafts/garments.png` | `Crafts` row 1 | ✅ Real | User-supplied. |
| `/img/crafts/textile.png` | `Crafts` row 2 | ✅ Real | User-supplied. |
| `/img/crafts/printing.png` | `Crafts` row 3 | ✅ Real | User-supplied. |
| `/img/crafts/shipping.png` | `Crafts` row 4 | ✅ Real | User-supplied. |
| `/img/crafts/embroidery.png` | `Crafts` row 5 | ✅ Real | User-supplied. |
| `/img/crafts/washing.jpg` | `Crafts` row 6 | ✅ Real | User-supplied. |

## Section 7 — Products (6 product editorial photos)

All six entries in `src/data/products.ts` use Unsplash placeholders. Replace each `image` URL with a real Urmi product editorial shot.

| Slot | Status | Replacement |
|---|---|---|
| Active Wear | ❌ PLACEHOLDER | Editorial activewear photo (model in motion or flat-lay) |
| Evening Wear | ❌ PLACEHOLDER | Quiet-luxury evening piece |
| Night Wear | ❌ PLACEHOLDER | Sleepwear flat-lay or styled |
| Seamless Innerwear | ❌ PLACEHOLDER | Seamless innerwear close-up |
| Knitwear & Polos | ❌ PLACEHOLDER | Polo / pullover styled shot |
| Kidswear | ❌ PLACEHOLDER | Kidswear (faces obscured) |

## Section 8 — IMPACT (6 value photos)

| Slot | Status | Replacement |
|---|---|---|
| `/img/impact/integrity.png` | ✅ Real | User-supplied. |
| Mutual Trust (Unsplash inline) | ❌ PLACEHOLDER | Two hands meeting on cloth / handshake |
| Passion (Unsplash inline) | ❌ PLACEHOLDER | Designer at sketch table |
| Agility (Unsplash inline) | ❌ PLACEHOLDER | Pattern cutter mid-motion (motion-blurred) |
| Customer Focus (Unsplash inline) | ❌ PLACEHOLDER | Design meeting / fabric swatch board |
| Teamwork (Unsplash inline) | ❌ PLACEHOLDER | Factory floor wide shot (no faces) |

Edit `src/data/impactValues.ts` and replace the `image` URL for each placeholder. When you have the real PNGs, drop them into `public/img/impact/` (e.g. `mutual-trust.png`) and update the path.

## Section 9 — Factories (Google Map)

| Slot | Status | Replacement |
|---|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` env var | ❌ MISSING | Provide a Google Maps JS API key in `.env`. Section falls back to a styled SVG map until the key is supplied. See `.env.example`. |
| Factory coordinates in `src/data/factories.ts` | ⚠️ APPROXIMATE | Refine `position` for FTML, UGL, UHM with precise lat/lng once confirmed. |

## Section 10 — Clients (12+ client cards)

`src/data/clients.ts` has the 12 client names but no logo URLs — cards render branded monograms (e.g. "HM", "PM") instead of images. To swap in real logos:

1. Save each logo to `public/img/clients/<id>.svg` (or PNG)
2. In `src/data/clients.ts`, set the `logo` field for each entry, e.g. `logo: '/img/clients/h-and-m.svg'`

## Section 11 — Awards (8 award visuals)

`src/data/awards.ts` references `urmigroup.com/wp-content/uploads/2019/12/[1-8]-2-300x300.jpg`. The Awards component handles 404s gracefully (image hides itself). Once Urmi confirms the authoritative award list with titles and years, replace each entry's `image`, `title`, and `year`.

## Section 12 — CallToAction

| Slot | Status | Replacement |
|---|---|---|
| Background image (Unsplash inline in `CallToAction.tsx`) | ❌ PLACEHOLDER | Cinematic fabric-draping or wave-of-cloth photograph at low opacity. |

## Summary

| Status | Count |
|---|---|
| ✅ Real | 11 |
| ⚠️ Approximate | 1 (factory coordinates) |
| ❌ Missing/Placeholder | 25+ image slots, 1 video, 1 API key |

When all `❌` rows resolve, the homepage is shoot-ready.
