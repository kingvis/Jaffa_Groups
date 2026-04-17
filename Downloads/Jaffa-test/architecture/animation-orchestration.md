# SOP: Animation Orchestration (GSAP + Three.js)

## Easing Standard
All animations use `power3.out` unless a specific physical quality requires otherwise.
- Reveals / entrances: `power3.out`
- Parallax scrub: `ease: 'none'` (linear tracking)
- Counter animations: `power3.out`
- Loader exit: `power3.out`
- **Never:** `bounce`, `elastic` — these break the premium tone

## GSAP Plugin Registration
```js
import { ScrollTrigger } from 'gsap/ScrollTrigger.js'
gsap.registerPlugin(ScrollTrigger)
```
Register once at module level. Do not register inside functions.

## ScrollTrigger Lifecycle
- Track all created triggers in `_triggers[]`
- Call `killAllScrollTriggers()` before opening the gallery modal
- Re-initialize `initPortfolioReveal()` after modal closes
- Never mix CSS `scroll-behavior: smooth` with GSAP ScrollTrigger

## GSAP ↔ Three.js Integration
GSAP animates DOM elements and camera properties, Three.js handles the render loop.

To animate a Three.js camera via GSAP:
```js
gsap.to(camera.position, {
  z: 3,
  duration: 1.5,
  ease: 'power3.out',
  onUpdate: () => renderer.render(scene, camera)
})
```
Alternatively, store the target in a GSAP-animated proxy object and read it inside `requestAnimationFrame`.

## Animation Boot Sequence
```
boot()
  └─ playLoaderExit()      ← fade out loader overlay
       └─ playHeroEntrance() ← stagger eyebrow → title words → tagline → CTA
            └─ initScrollAnimations()
                 ├─ initHeroParallax()     ← hero images drift on scroll
                 ├─ initSectionReveals()   ← [data-reveal] elements
                 ├─ initCounters()         ← numeric counters on enter
                 ├─ initNavScroll()        ← nav bg on scroll
                 └─ initPortfolioReveal()  ← card scale-in
```

## Atomic Timelines
Each animation is an atomic `gsap.timeline()`. Never chain across module boundaries.
Timelines returned from functions are the caller's responsibility to kill.

## Z-index and Canvas Layering
```
Three.js canvas:  z-index: 0   (--z-canvas)
Hero images:      z-index: 1
Gradient overlay: z-index: 2
DOM content:      z-index: 10  (--z-content)
Navigation:       z-index: 100 (--z-nav)
Modal:            z-index: 200 (--z-modal)
Loader:           z-index: 300 (--z-loader)
```
The Three.js canvas is always behind DOM content. The modal canvas fills the modal panel, not the full viewport.
