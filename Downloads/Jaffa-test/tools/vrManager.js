/**
 * vrManager.js — WebXR session management + in-browser 360° fallback
 *
 * Capability matrix:
 *  VR headset (Quest/Cardboard) → immersive-vr session
 *  Mobile AR (ARCore/Chrome)    → immersive-ar session
 *  Desktop / iOS               → in-browser 360° sphere viewer (fallback, always available)
 *
 * Per PROJECT_CONSTITUTION.md: Never block page load on XR.
 * XR is progressive enhancement.
 */

import * as THREE from 'three'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { loadPanorama } from './loadAssets.js'

// ── Capability detection ───────────────────────────

/** @returns {Promise<{ vr: boolean, ar: boolean }>} */
export async function detectXRCapabilities() {
  if (!navigator.xr) return { vr: false, ar: false }

  const [vr, ar] = await Promise.all([
    navigator.xr.isSessionSupported('immersive-vr').catch(() => false),
    navigator.xr.isSessionSupported('immersive-ar').catch(() => false),
  ])

  return { vr, ar }
}

// ── XR Button injection ────────────────────────────

/**
 * Populate the #xrControls element with appropriate buttons
 * based on device capability.
 *
 * @param {HTMLElement} container — #xrControls
 * @param {THREE.WebGLRenderer} renderer
 * @param {{ vr: boolean, ar: boolean }} caps
 * @param {{ onVR?: () => void, onAR?: () => void }} callbacks
 */
export function injectXRButtons(container, renderer, caps, callbacks = {}) {
  container.innerHTML = ''

  if (caps.vr) {
    const vrBtn = VRButton.createButton(renderer)
    vrBtn.className = 'xr-btn'
    vrBtn.textContent = 'Enter VR'
    container.appendChild(vrBtn)
    if (callbacks.onVR) vrBtn.addEventListener('click', callbacks.onVR)
  }

  if (caps.ar) {
    const arBtn = ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
    })
    arBtn.className = 'xr-btn'
    arBtn.textContent = 'Enter AR'
    container.appendChild(arBtn)
    if (callbacks.onAR) arBtn.addEventListener('click', callbacks.onAR)
  }

  // Always show the 360° fallback button (desktop-safe)
  const fallbackBtn = document.createElement('button')
  fallbackBtn.className = 'xr-btn'
  fallbackBtn.textContent = '360° View'
  fallbackBtn.addEventListener('click', callbacks.onFallback ?? (() => {}))
  container.appendChild(fallbackBtn)

  return { hasXR: caps.vr || caps.ar }
}

// ── 360° Panorama Sphere Viewer ────────────────────

/**
 * Create an in-browser 360° panorama viewer inside a container element.
 * Returns a { destroy } function to clean up.
 *
 * @param {HTMLElement} container
 * @param {string} panoramaUrl — equirectangular image URL
 * @returns {Promise<{ destroy: () => void }>}
 */
export async function createPanoramaViewer(container, panoramaUrl) {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'width:100%;height:100%;display:block;'
  container.innerHTML = ''
  container.appendChild(canvas)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(container.clientWidth, container.clientHeight, false)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 100)
  camera.position.set(0, 0, 0)

  // Sphere geometry (inward-facing)
  const geometry = new THREE.SphereGeometry(50, 60, 40)
  geometry.scale(-1, 1, 1) // flip normals inward

  // Load panorama texture
  let texture
  try {
    texture = await loadPanorama(panoramaUrl)
  } catch {
    // If panorama asset is missing, show a placeholder gradient sphere
    texture = null
    console.warn('[vrManager] Panorama not found — showing placeholder')
  }

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: texture ? 0xffffff : 0x1b2431,
  })

  const sphere = new THREE.Mesh(geometry, material)
  scene.add(sphere)

  // ── Drag-to-look controls ──────────────────────
  let isDragging = false
  let prevX = 0
  let prevY = 0
  let lon = 0   // horizontal rotation (degrees)
  let lat = 0   // vertical rotation (degrees)

  function onPointerDown(e) {
    isDragging = true
    prevX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    prevY = e.clientY ?? e.touches?.[0]?.clientY ?? 0
  }

  function onPointerMove(e) {
    if (!isDragging) return
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? prevX
    const y = e.clientY ?? e.touches?.[0]?.clientY ?? prevY
    lon -= (x - prevX) * 0.25
    lat += (y - prevY) * 0.25
    lat = Math.max(-85, Math.min(85, lat))
    prevX = x
    prevY = y
  }

  function onPointerUp() { isDragging = false }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('touchstart', onPointerDown, { passive: true })
  canvas.addEventListener('touchmove', onPointerMove, { passive: true })
  canvas.addEventListener('touchend', onPointerUp)

  // Gyroscope (mobile)
  let deviceOrientationHandler = null
  if (window.DeviceOrientationEvent) {
    deviceOrientationHandler = (e) => {
      if (isDragging) return
      lon = e.alpha ?? lon
      lat = Math.max(-85, Math.min(85, (e.beta ?? 0) - 90))
    }
    window.addEventListener('deviceorientation', deviceOrientationHandler)
  }

  // Resize
  function onResize() {
    const w = container.clientWidth
    const h = container.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', onResize)

  // Animation loop
  let animId
  const phi = { val: 0 }
  const theta = { val: 0 }

  function animate() {
    animId = requestAnimationFrame(animate)

    phi.val = THREE.MathUtils.degToRad(90 - lat)
    theta.val = THREE.MathUtils.degToRad(lon)

    camera.target = new THREE.Vector3(
      500 * Math.sin(phi.val) * Math.cos(theta.val),
      500 * Math.cos(phi.val),
      500 * Math.sin(phi.val) * Math.sin(theta.val)
    )
    camera.lookAt(camera.target)

    renderer.render(scene, camera)
  }
  animate()

  function destroy() {
    cancelAnimationFrame(animId)
    window.removeEventListener('resize', onResize)
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('touchstart', onPointerDown)
    canvas.removeEventListener('touchmove', onPointerMove)
    canvas.removeEventListener('touchend', onPointerUp)
    if (deviceOrientationHandler) window.removeEventListener('deviceorientation', deviceOrientationHandler)
    geometry.dispose()
    material.dispose()
    if (texture) texture.dispose()
    renderer.dispose()
  }

  return { destroy }
}

// ── GLTF Model Viewer ──────────────────────────────

/**
 * Create a Three.js GLTF model viewer inside a container.
 * @param {HTMLElement} container
 * @param {THREE.Group} model — already-loaded GLTF scene
 * @param {THREE.Texture|null} envMap — PMREMGenerator-processed HDR or null
 * @param {{ x: number, y: number, z: number }} cameraPos
 * @returns {{ destroy: () => void }}
 */
export function createModelViewer(container, model, envMap, cameraPos = { x: 0, y: 1.6, z: 3 }) {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'width:100%;height:100%;display:block;'
  container.innerHTML = ''
  container.appendChild(canvas)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(container.clientWidth, container.clientHeight, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  if (envMap) {
    scene.environment = envMap
    scene.background = envMap
  } else {
    scene.background = new THREE.Color(0x1b2431)
  }

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.01, 1000)
  camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z)

  // Lights
  const ambient = new THREE.AmbientLight(0xfff5e0, 0.8)
  scene.add(ambient)
  const key = new THREE.DirectionalLight(0xffe8b0, 2)
  key.position.set(5, 8, 5)
  key.castShadow = true
  scene.add(key)

  scene.add(model)

  // Center model
  const box = new THREE.Box3().setFromObject(model)
  const center = box.getCenter(new THREE.Vector3())
  model.position.sub(center)

  // Orbit on drag
  let isDragging = false
  let prevX = 0
  let spherical = { theta: 0, phi: Math.PI / 3 }
  const radius = camera.position.distanceTo(center)

  canvas.addEventListener('pointerdown', (e) => { isDragging = true; prevX = e.clientX })
  canvas.addEventListener('pointermove', (e) => {
    if (!isDragging) return
    spherical.theta -= (e.clientX - prevX) * 0.005
    prevX = e.clientX
  })
  canvas.addEventListener('pointerup', () => { isDragging = false })

  function onResize() {
    renderer.setSize(container.clientWidth, container.clientHeight, false)
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', onResize)

  let animId
  function animate() {
    animId = requestAnimationFrame(animate)
    if (!isDragging) spherical.theta += 0.003 // slow auto-rotate

    camera.position.set(
      radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
      radius * Math.cos(spherical.phi),
      radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
    )
    camera.lookAt(0, 0, 0)
    renderer.render(scene, camera)
  }
  animate()

  function destroy() {
    cancelAnimationFrame(animId)
    window.removeEventListener('resize', onResize)
    renderer.dispose()
  }

  return { destroy }
}
