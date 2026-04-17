# Findings — Jaffa Group Frontend

## Asset Inventory (Confirmed on Disk)

### Images
- 696 property JPGs across ~37 property folders (434 MB total)
- 7 hero WEBP images (showcase 2–7 + T 2)
- Featured images in portfolio root (deer valley, federal heights, quarry mountain, etc.)
- PrintSize-01 through PrintSize-57 JPGs in portfolio root

### Fonts
- Bambino font family: 12 OTF files (regular, bold, black, thin, light, extra-light + italics)

### Missing (user must provide)
- 360° equirectangular panorama images
- GLTF/GLB 3D architectural models
- HDR environment maps (.hdr)

---

## Technical Constraints

### WebGL
- WebGL 2.0 supported in all modern browsers (Chrome 56+, Firefox 51+, Safari 15+)
- THREE.WebGLRenderer with `antialias: true` adds ~10% GPU overhead — acceptable for desktop
- PMREMGenerator for HDR environment maps requires WebGL 2.0
- Use `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` — never allow >2x on mobile

### WebXR
- `immersive-vr` support: Chrome Android 79+, Meta Browser, Oculus Browser
- `immersive-ar` support: Chrome Android 81+ (requires ARCore)
- iOS Safari: WebXR not supported as of 2025 — 360° fallback viewer is the iOS path
- Always check `navigator.xr` exists before calling `isSessionSupported`

### GSAP
- ScrollTrigger requires `gsap.registerPlugin(ScrollTrigger)` before use
- Do NOT mix `scroll-behavior: smooth` CSS with GSAP ScrollTrigger — conflicts
- Kill all ScrollTrigger instances before destroying a section to prevent memory leaks
- `scrub: 1` provides best parallax feel; `scrub: true` is instant (no lerp)

### Asset Loading
- Large images (4K property photos) can block the main thread — use Web Workers or progressive loading
- Three.js TextureLoader is synchronous on the render thread — prefer LoadingManager with callbacks
- GLTF models: use Draco compression for production (draco_decoder.wasm)

### Performance
- 60fps target with Three.js background scene + CSS animations
- Disable Three.js scene rendering when tab is not visible (visibilitychange event)
- Use `IntersectionObserver` for portfolio image lazy loading (threshold: 0.1)
- Dispose Three.js geometry + material + texture on modal close (prevent VRAM leak)

---

## Windows-Specific Notes
- Asset paths served via Vite middleware plugin (see vite.config.js)
- Junction points approach was not available (requires admin rights in bash context)
- Vite middleware intercepts `/assets/fonts/`, `/assets/hero/`, `/assets/portfolio/` and serves from actual directories
- File names contain spaces — use `decodeURIComponent()` in middleware, `encodeURI()` in JS fetch calls
