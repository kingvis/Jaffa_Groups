# Task Plan — Jaffa Group Frontend

## Phase 1 — Blueprint ✅ COMPLETE
- [x] Brand asset audit
- [x] Color palette confirmed from provided images
- [x] Discovery questions answered (gallery type, AR/VR mode, brand name, stack)
- [x] Gallery JSON schema defined
- [x] PROJECT_CONSTITUTION.md written

## Phase 2 — Link ✅ COMPLETE
- [x] Vite + Vanilla JS project initialized
- [x] three.js and gsap dependencies configured
- [x] Asset middleware plugin configured in vite.config.js
- [x] Directory structure created

## Phase 3 — Architect
- [x] tools/initScene.js (Three.js camera, renderer, lights, disposal)
- [x] tools/loadAssets.js (GLTF, texture, HDR loaders)
- [x] tools/vrManager.js (WebXR AR/VR/fallback)
- [x] tools/scrollAnimations.js (GSAP ScrollTrigger)
- [x] architecture/ SOPs

## Phase 4 — Stylize
- [x] Bambino @font-face (all 6 weights)
- [x] CSS custom properties from color tokens
- [x] Editorial CSS Grid (12-column asymmetric)
- [x] Fluid clamp() typography
- [x] Hero, portfolio, gallery, contact section styles

## Phase 5 — Trigger (QA)
- [ ] Run npm install & vite dev — verify WebGL cube renders
- [ ] Verify Bambino font loads from /assets/fonts/
- [ ] Verify hero images load from /assets/hero/
- [ ] Verify portfolio grid renders with actual images
- [ ] Test GSAP scroll reveals
- [ ] Test gallery modal (2D mode)
- [ ] Test 360° fallback viewer
- [ ] Test WebXR entry (AR/VR — requires mobile or headset)

## Backlog (user to provide assets)
- [ ] Add 360° equirectangular panorama JPGs → `public/assets/panoramas/`
- [ ] Add GLTF/GLB models → `public/assets/models/`
- [ ] Add HDR environment maps → `public/assets/hdr/`
- [ ] Update `src/data/gallery.json` with panorama360 and gltf entries
- [ ] Configure production build (rollupOptions to exclude raw asset dirs)
