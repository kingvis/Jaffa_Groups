/**
 * initScene.js — Three.js scene initialization & disposal
 * Deterministic: same inputs always produce same scene state.
 * Call initScene(canvas) → returns { scene, camera, renderer, dispose }
 */

import * as THREE from 'three'

/**
 * Create a fully configured Three.js scene.
 * @param {HTMLCanvasElement} canvas
 * @param {{ alpha?: boolean, antialias?: boolean }} options
 * @returns {{ scene, camera, renderer, clock, dispose }}
 */
export function initScene(canvas, options = {}) {
  const { alpha = true, antialias = true } = options

  // ── Renderer ─────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, alpha, antialias })
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.xr.enabled = true // WebXR

  // ── Scene ─────────────────────────────────────────
  const scene = new THREE.Scene()

  // ── Camera ────────────────────────────────────────
  const aspect = canvas.clientWidth / canvas.clientHeight
  const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000)
  camera.position.set(0, 0, 5)

  // ── Clock ─────────────────────────────────────────
  const clock = new THREE.Clock()

  // ── Resize handler ────────────────────────────────
  function onResize() {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', onResize)

  // ── Visibility pause ──────────────────────────────
  let animationId = null

  function pauseOnHidden() {
    if (document.hidden && animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }
  document.addEventListener('visibilitychange', pauseOnHidden)

  // ── Disposal ──────────────────────────────────────
  function dispose() {
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', pauseOnHidden)
    if (animationId) cancelAnimationFrame(animationId)

    // Dispose all scene children
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => disposeMaterial(m))
        } else {
          disposeMaterial(obj.material)
        }
      }
    })

    renderer.dispose()
    renderer.forceContextLoss()
  }

  return { scene, camera, renderer, clock, dispose, _setAnimId: (id) => { animationId = id } }
}

function disposeMaterial(mat) {
  mat.dispose()
  for (const key of Object.keys(mat)) {
    const val = mat[key]
    if (val && typeof val === 'object' && typeof val.dispose === 'function') {
      val.dispose()
    }
  }
}

/**
 * Standard lighting setup for interior scenes.
 * Returns the lights array for later adjustment.
 */
export function addInteriorLights(scene) {
  const lights = []

  // Ambient fill
  const ambient = new THREE.AmbientLight(0xfff5e0, 0.6)
  scene.add(ambient)
  lights.push(ambient)

  // Key light (warm directional)
  const key = new THREE.DirectionalLight(0xffe8b0, 2.0)
  key.position.set(5, 8, 5)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.near = 0.1
  key.shadow.camera.far = 50
  key.shadow.camera.left = -10
  key.shadow.camera.right = 10
  key.shadow.camera.top = 10
  key.shadow.camera.bottom = -10
  scene.add(key)
  lights.push(key)

  // Fill light (cool, opposite side)
  const fill = new THREE.DirectionalLight(0xc8d8e8, 0.5)
  fill.position.set(-5, 3, -3)
  scene.add(fill)
  lights.push(fill)

  // Rim light (gold accent)
  const rim = new THREE.PointLight(0xd4a017, 1.5, 20)
  rim.position.set(0, 4, -5)
  scene.add(rim)
  lights.push(rim)

  return lights
}

/**
 * Material presets per PROJECT_CONSTITUTION.md
 */
export const MaterialPresets = {
  marble: {
    roughness: 0.1,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  },
  wood: {
    roughness: 0.8,
    metalness: 0.0,
    envMapIntensity: 0.5,
  },
  glass: {
    roughness: 0.0,
    metalness: 0.0,
    transmission: 1.0,
    transparent: true,
    thickness: 0.5,
  },
  metal: {
    roughness: 0.3,
    metalness: 1.0,
  },
  concrete: {
    roughness: 0.9,
    metalness: 0.0,
  },
}
