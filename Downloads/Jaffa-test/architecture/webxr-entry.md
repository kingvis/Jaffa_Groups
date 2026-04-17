# SOP: WebXR Entry Flow

## Capability Detection (always async)
```js
const caps = await detectXRCapabilities()
// → { vr: boolean, ar: boolean }
```
Run once on `initGallery()`. Cache the result for the session.

## Button Injection (in modal header)
```
detectXRCapabilities()
  ├─ caps.vr === true  → inject "Enter VR"  button (Three.js VRButton)
  ├─ caps.ar === true  → inject "Enter AR"  button (Three.js ARButton)
  └─ always            → inject "360° View" button (fallback sphere viewer)
```
The fallback is always present. Never hide it based on XR availability.

## Session Flow

### VR (immersive-vr)
1. User clicks "Enter VR"
2. `VRButton.createButton(renderer)` requests `immersive-vr` session
3. `renderer.xr.enabled = true` (set in initScene.js)
4. The render loop automatically hands off to the XR session frame loop
5. On session end: Three.js restores the standard render loop

### AR (immersive-ar)
1. User clicks "Enter AR"
2. `ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] })`
3. Device camera + AR overlay become active
4. Three.js renders over the camera feed at 60fps

### 360° Fallback (in-browser)
1. User clicks "360° View" (or no XR is available)
2. `createPanoramaViewer(container, url)` initializes
3. `THREE.SphereGeometry` with `geometry.scale(-1, 1, 1)` (normals inward)
4. Drag-to-look via `pointerdown/move/up` events
5. `DeviceOrientationEvent` for gyro on mobile (if permission granted)
6. No headset required; works on all platforms including iOS

## Platform Notes
| Platform | VR | AR | 360° Fallback |
|---|---|---|---|
| Chrome Android | ✅ (ARCore) | ✅ | ✅ |
| Meta Browser / Quest | ✅ | ❌ | ✅ |
| Chrome Desktop | ❌ | ❌ | ✅ |
| Safari iOS | ❌ | ❌ | ✅ |
| Firefox Desktop | Experimental | ❌ | ✅ |

## Repair Loop (if XR fails)
1. Inspect browser console for `XRSession` errors
2. Common issues:
   - `NotSupportedError`: device lacks ARCore / WebXR — show fallback silently
   - `SecurityError`: non-HTTPS context — must serve over HTTPS for AR/VR
   - Missing `requiredFeatures`: remove `hit-test` from ARButton options
3. Patch: catch the error in `createButton`, disable the button, leave fallback visible
4. Never let XR errors surface to the user as uncaught exceptions

## Disposal (on modal close)
- `renderer.xr.enabled = false`
- End any active XR session: `renderer.xr.getSession()?.end()`
- Call the viewer `destroy()` function (cancels requestAnimationFrame, disposes geometry/material/texture/renderer)
