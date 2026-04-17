/**
 * loadAssets.js — Promise-based asset loaders for Three.js
 * All loaders return Promises. Use LoadingManager for batch progress.
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

// ── Loading Manager (shared) ───────────────────────
const manager = new THREE.LoadingManager()
let _onProgress = null

manager.onProgress = (url, loaded, total) => {
  const pct = Math.round((loaded / total) * 100)
  if (_onProgress) _onProgress(pct, url)
}

manager.onError = (url) => {
  console.warn(`[loadAssets] Failed to load: ${url}`)
}

/** Register a global progress callback */
export function onLoadProgress(cb) {
  _onProgress = cb
}

// ── Loaders (singletons) ───────────────────────────
let _gltfLoader = null
let _rgbeLoader = null
let _textureLoader = null

function getGLTFLoader() {
  if (!_gltfLoader) _gltfLoader = new GLTFLoader(manager)
  return _gltfLoader
}

function getRGBELoader() {
  if (!_rgbeLoader) _rgbeLoader = new RGBELoader(manager)
  return _rgbeLoader
}

function getTextureLoader() {
  if (!_textureLoader) _textureLoader = new THREE.TextureLoader(manager)
  return _textureLoader
}

// ── Public API ─────────────────────────────────────

/**
 * Load a GLTF/GLB model.
 * @param {string} url
 * @returns {Promise<THREE.Group>} The loaded scene root
 */
export function loadGLTF(url) {
  return new Promise((resolve, reject) => {
    getGLTFLoader().load(
      url,
      (gltf) => resolve(gltf.scene),
      undefined,
      (err) => reject(new Error(`GLTF load failed: ${url} — ${err.message}`))
    )
  })
}

/**
 * Load an HDR environment map and return a PMREMGenerator texture.
 * Requires a renderer to be passed in (for PMREMGenerator).
 * @param {string} url
 * @param {THREE.WebGLRenderer} renderer
 * @returns {Promise<THREE.Texture>}
 */
export function loadHDR(url, renderer) {
  return new Promise((resolve, reject) => {
    const pmrem = new THREE.PMREMGenerator(renderer)
    pmrem.compileEquirectangularShader()

    getRGBELoader().load(
      url,
      (texture) => {
        const envMap = pmrem.fromEquirectangular(texture).texture
        texture.dispose()
        pmrem.dispose()
        resolve(envMap)
      },
      undefined,
      (err) => reject(new Error(`HDR load failed: ${url} — ${err.message}`))
    )
  })
}

/**
 * Load a standard texture.
 * @param {string} url
 * @param {{ colorSpace?: THREE.ColorSpace }} options
 * @returns {Promise<THREE.Texture>}
 */
export function loadTexture(url, options = {}) {
  return new Promise((resolve, reject) => {
    getTextureLoader().load(
      url,
      (texture) => {
        texture.colorSpace = options.colorSpace ?? THREE.SRGBColorSpace
        resolve(texture)
      },
      undefined,
      (err) => reject(new Error(`Texture load failed: ${url} — ${err.message}`))
    )
  })
}

/**
 * Load a 360° equirectangular panorama for the sphere viewer.
 * Returns a ready-to-use THREE.Texture with correct wrapping.
 * @param {string} url
 * @returns {Promise<THREE.Texture>}
 */
export function loadPanorama(url) {
  return loadTexture(url, { colorSpace: THREE.SRGBColorSpace }).then((texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping
    texture.wrapS = THREE.RepeatWrapping
    texture.repeat.x = -1 // mirror so the panorama faces inward
    return texture
  })
}

/**
 * Batch load multiple textures and return them keyed by name.
 * @param {Record<string, string>} urlMap — { name: url }
 * @returns {Promise<Record<string, THREE.Texture>>}
 */
export async function loadTextureMap(urlMap) {
  const entries = Object.entries(urlMap)
  const results = await Promise.all(entries.map(([, url]) => loadTexture(url)))
  return Object.fromEntries(entries.map(([name], i) => [name, results[i]]))
}

/**
 * Dispose a texture or array of textures safely.
 */
export function disposeTextures(...textures) {
  for (const t of textures.flat()) {
    if (t && typeof t.dispose === 'function') t.dispose()
  }
}
