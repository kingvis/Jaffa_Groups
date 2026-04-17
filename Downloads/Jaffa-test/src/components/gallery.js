/**
 * gallery.js — Full-screen modal gallery with 3-mode viewer
 *
 * Modes:
 *  "2d"           → image lightbox with prev/next
 *  "panorama360"  → Three.js sphere viewer (drag-to-look) + WebXR
 *  "gltf"         → Three.js model viewer (orbit) + WebXR
 *
 * WebXR: AR/VR buttons injected based on device capability.
 * Fallback 360° button always visible.
 */

import {
  detectXRCapabilities,
  injectXRButtons,
  createPanoramaViewer,
  createModelViewer,
} from '../../tools/vrManager.js'
import { loadGLTF, loadHDR } from '../../tools/loadAssets.js'
import { killAllScrollTriggers, initPortfolioReveal } from '../../tools/scrollAnimations.js'

let _modal        = null
let _viewer       = null
let _xrCaps       = { vr: false, ar: false }
let _currentItem  = null
let _currentIdx   = 0   // index within item.images for 2d mode
let _viewerDestroy= null

/** Initialize gallery — call once. Detects XR capabilities. */
export async function initGallery() {
  _modal = document.getElementById('galleryModal')
  _xrCaps = await detectXRCapabilities()

  document.getElementById('modalClose')?.addEventListener('click', closeGallery)
  document.getElementById('modalBackdrop')?.addEventListener('click', closeGallery)
  document.getElementById('modalPrev')?.addEventListener('click', () => navigate(-1))
  document.getElementById('modalNext')?.addEventListener('click', () => navigate(1))

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!_modal || _modal.hidden) return
    if (e.key === 'Escape')      closeGallery()
    if (e.key === 'ArrowLeft')   navigate(-1)
    if (e.key === 'ArrowRight')  navigate(1)
  })
}

/**
 * Open the gallery for a specific item.
 * @param {object} item — gallery.json entry
 */
export async function openGallery(item) {
  _currentItem = item
  _currentIdx  = 0

  const modal     = document.getElementById('galleryModal')
  const titleEl   = document.getElementById('modalTitle')
  const xrCtrl    = document.getElementById('xrControls')
  const viewer    = document.getElementById('modalViewer')
  const navEl     = document.querySelector('.modal__nav')

  modal.hidden = false
  modal.removeAttribute('hidden')
  titleEl.textContent = item.title
  document.body.style.overflow = 'hidden'

  // Kill scroll triggers while modal is open
  killAllScrollTriggers()

  // Inject XR buttons
  injectXRButtons(xrCtrl, null, _xrCaps, {
    onFallback: () => _show360Fallback(item),
  })

  // Render by type
  if (item.type === '2d') {
    navEl.style.display = ''
    await _render2D(viewer, item)
  } else if (item.type === 'panorama360') {
    navEl.style.display = 'none'
    await _renderPanorama(viewer, item)
  } else if (item.type === 'gltf') {
    navEl.style.display = 'none'
    await _renderGLTF(viewer, item)
  }
}

/** Close modal and clean up viewer. */
export function closeGallery() {
  const modal = document.getElementById('galleryModal')
  if (!modal) return

  modal.hidden = true
  document.body.style.overflow = ''

  if (_viewerDestroy) {
    _viewerDestroy()
    _viewerDestroy = null
  }

  document.getElementById('modalViewer').innerHTML = ''

  // Re-initialize scroll triggers
  setTimeout(() => initPortfolioReveal(), 50)
}

// ── 2D Image Lightbox ──────────────────────────────

async function _render2D(viewer, item) {
  const images = item.images || [item.thumbnailUrl]
  _updateCounter(images)

  viewer.innerHTML = ''
  const img = document.createElement('img')
  img.className = 'modal__viewer-img'
  img.alt = item.title
  img.src = images[_currentIdx] || item.thumbnailUrl
  img.onerror = () => { img.src = item.thumbnailUrl }
  viewer.appendChild(img)
}

function navigate(dir) {
  if (!_currentItem || _currentItem.type !== '2d') return
  const images = _currentItem.images || []
  if (images.length <= 1) return

  _currentIdx = (_currentIdx + dir + images.length) % images.length
  const img = document.querySelector('.modal__viewer-img')
  if (img) {
    img.style.opacity = '0'
    img.src = images[_currentIdx]
    img.onload = () => { img.style.opacity = '1'; img.style.transition = 'opacity 0.4s' }
    img.onerror = () => { img.src = _currentItem.thumbnailUrl; img.style.opacity = '1' }
  }
  _updateCounter(images)
}

function _updateCounter(images) {
  const counter = document.getElementById('modalCounter')
  if (counter) counter.textContent = `${_currentIdx + 1} / ${images.length}`
}

// ── 360° Panorama ──────────────────────────────────

async function _renderPanorama(viewer, item) {
  const { destroy } = await createPanoramaViewer(viewer, item.assetUrl)
  _viewerDestroy = destroy
}

async function _show360Fallback(item) {
  // For a 2D item, use the thumbnail as a "poor man" panorama placeholder
  const url = item.assetUrl || item.thumbnailUrl
  const viewer = document.getElementById('modalViewer')
  if (_viewerDestroy) _viewerDestroy()
  const { destroy } = await createPanoramaViewer(viewer, url)
  _viewerDestroy = destroy
}

// ── GLTF 3D Model ──────────────────────────────────

async function _renderGLTF(viewer, item) {
  let model, envMap

  try {
    model = await loadGLTF(item.assetUrl)
  } catch {
    // If no GLTF available, fall back to 360° panorama view
    console.warn('[gallery] GLTF not found — falling back to panorama view')
    await _renderPanorama(viewer, { ...item, assetUrl: item.thumbnailUrl })
    return
  }

  if (item.envMapUrl) {
    try {
      // Need a temporary renderer for PMREMGenerator — createModelViewer builds its own
      const tmp = document.createElement('canvas')
      const tmpRenderer = new (await import('three')).WebGLRenderer({ canvas: tmp })
      envMap = await loadHDR(item.envMapUrl, tmpRenderer)
      tmpRenderer.dispose()
    } catch {
      envMap = null
    }
  }

  const { destroy } = createModelViewer(viewer, model, envMap, item.cameraPosition)
  _viewerDestroy = destroy
}
