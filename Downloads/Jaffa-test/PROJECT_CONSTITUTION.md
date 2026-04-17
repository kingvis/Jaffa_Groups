# PROJECT CONSTITUTION — Jaffa Group
> Source of truth for brand, assets, architecture invariants, and AR/VR rules.
> Do not change this file without updating all dependent modules.

---

## Brand Identity

| Token | Value |
|---|---|
| **Brand Name** | Jaffa Group |
| **Tagline** | Where Architecture Meets Artistry |
| **Domain** | High-end residential construction & interior design |
| **Tone** | Premium, cinematic, editorial, confident |

---

## Color Tokens

| CSS Variable | Hex | Usage |
|---|---|---|
| `--color-bg-primary` | `#1B2431` | Page background, nav, hero |
| `--color-bg-secondary` | `#E8D56B` | Accent surfaces, highlights |
| `--color-accent` | `#D4A017` | Primary accent, borders, CTAs |
| `--color-dark-2` | `#2E3A4A` | Card backgrounds, panels |
| `--color-dark-3` | `#4A5C6E` | Subtle dividers |
| `--color-dark-4` | `#8A9EAE` | Muted text |
| `--color-light` | `#F2F2F0` | Body text, headings on dark |
| `--color-gold-deep` | `#C9A020` | Hover states, pressed CTAs |
| `--color-gold-dark` | `#8A7030` | Footer text, captions |

---

## Typography

**Primary Typeface:** Bambino (OTF)

| Weight | File | CSS font-weight |
|---|---|---|
| Thin | `Bambino Thin.otf` | 100 |
| Extra Light | `Bambino Extra Light.otf` | 200 |
| Light | `Bambino Light.otf` | 300 |
| Regular | `Bambino.otf` | 400 |
| Bold | `Bambino Bold.otf` | 700 |
| Black | `Bambino Black.otf` | 900 |

Fluid scale: `clamp(base, vw, max)` — never use fixed px for type on headings.

---

## Asset Paths (Dev Server — via Vite middleware plugin)

| Virtual Path | Physical Location |
|---|---|
| `/assets/fonts/*` | `fonts and logos-20260417T055848Z-3-001/fonts and logos/` |
| `/assets/logos/*` | `fonts and logos-20260417T055848Z-3-001/fonts and logos/` |
| `/assets/hero/*` | `Jaffa Group-20260417T055549Z-3-001/Jaffa Group/Hero Photos/` |
| `/assets/portfolio/*` | `Jaffa Group-20260417T055549Z-3-001/Jaffa Group/Jaffa Group Portfolo/` |
| `/assets/panoramas/*` | `public/assets/panoramas/` ← user to populate |
| `/assets/models/*` | `public/assets/models/` ← user to populate |
| `/assets/hdr/*` | `public/assets/hdr/` ← user to populate |

---

## Gallery Data Contract

```json
{
  "id": "string — kebab-case unique",
  "title": "string — display name",
  "category": "residential | commercial | architectural",
  "type": "2d | panorama360 | gltf",
  "images": ["array of image URLs — for type:2d"],
  "thumbnailUrl": "string — cover image URL",
  "assetUrl": "string — for panorama360 or gltf, the primary asset URL",
  "envMapUrl": "string — HDR path for gltf type",
  "cameraPosition": { "x": 0, "y": 1.6, "z": 3 },
  "tags": ["array of strings"]
}
```

---

## Three.js Material Presets

| Surface | roughness | metalness | clearcoat | transmission |
|---|---|---|---|---|
| Marble | 0.1 | 0.0 | 1.0 | 0.0 |
| Wood | 0.8 | 0.0 | 0.0 | 0.0 |
| Glass | 0.0 | 0.0 | 0.0 | 1.0 |
| Metal | 0.3 | 1.0 | 0.0 | 0.0 |
| Concrete | 0.9 | 0.0 | 0.0 | 0.0 |

---

## AR/VR Invariants

1. **Always detect capability before offering XR buttons** — use `navigator.xr.isSessionSupported()`.
2. **VR session type:** `immersive-vr` (headsets, Cardboard).
3. **AR session type:** `immersive-ar` (mobile camera overlay).
4. **Fallback:** In-browser 360° sphere viewer using `THREE.SphereGeometry` + equirectangular texture. Always available, no hardware required.
5. **Never block the page load** on WebXR — XR is progressive enhancement only.
6. **Dispose all Three.js resources** (geometry, material, texture, renderer) when the modal closes.

---

## GSAP Animation Rules

- All timelines use `power3.out` easing unless otherwise documented.
- All scroll triggers use `scrub: 1` for smooth tracking.
- Hero text reveal: stagger 0.1s, y: 60 → 0, opacity: 0 → 1.
- Section reveals: stagger 0.08s, y: 40 → 0, opacity: 0 → 1.
- Never use `snap` — it conflicts with parallax on mobile.
- Kill all ScrollTrigger instances on modal open/close to prevent jank.

---

## Performance Targets

| Metric | Target |
|---|---|
| WebGL FPS | 60fps on desktop, 30fps minimum on mobile |
| Texture budget | Max 4K per texture, compress to KTX2 for production |
| GLTF model size | < 5MB uncompressed |
| LCP | < 2.5s |
| Portfolio images | Lazy-loaded via IntersectionObserver |
