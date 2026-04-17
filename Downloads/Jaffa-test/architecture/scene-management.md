# SOP: Three.js Scene Management

## Lifecycle Rules

1. **One renderer per canvas.** Never share a WebGLRenderer across canvases.
2. **Always call `dispose()`** on geometry, material, and texture when removing objects.
3. **Always call `renderer.dispose()`** when destroying a scene (e.g., modal close).
4. **Pause rendering** when `document.hidden === true` (visibilitychange event). Resume on focus.
5. **Cap pixel ratio:** `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`
6. **Never hold references** to geometries or materials outside of the scene graph.

## Camera Setup (Standard)
- `PerspectiveCamera(45, aspect, 0.1, 1000)` — 45° FOV for architectural shots
- Hero canvas: `camera.position.z = 8`
- Interior viewer: `camera.position` from `gallery.json.cameraPosition`
- Panorama viewer: `camera.position.set(0, 0, 0)` — always at origin inside sphere

## Memory Budget
| Asset | Max Size | Notes |
|---|---|---|
| Textures | 4096×4096 | Compress to KTX2 for production |
| GLTF models | 5 MB | Use Draco compression |
| Particle count | 200 | Per scene — more hurts mobile |
| HDR maps | 2K | 4K only if critical for reflections |

## Disposal Checklist (on modal close)
```js
scene.traverse(obj => {
  if (obj.geometry)  obj.geometry.dispose()
  if (obj.material)  disposeMaterial(obj.material)
})
renderer.dispose()
renderer.forceContextLoss()
```
`forceContextLoss()` is necessary when the canvas is removed from the DOM.

## Environment Maps
- Use `PMREMGenerator.fromEquirectangular()` for HDR processing
- Store the resulting texture as `scene.environment`
- Dispose the raw RGBELoader texture immediately after PMREM processing
- Dispose the PMREMGenerator after use (`pmrem.dispose()`)
