/**
 * hero.js — Three.js ambient particle field + hero image cycle
 * Tuned for dark cinematic aesthetic (Glasshaven/Mairen inspired)
 */

import * as THREE from 'three'
import gsap from 'gsap'
import { initScene } from '../../tools/initScene.js'

const HERO_IMAGES_COUNT = 6
const CYCLE_MS   = 5500
const PARTICLE_N = 120

// Sparse gold/silver dust — premium feel
const PARTICLE_COLORS = [0xd4a017, 0xe8d56b, 0xf2f2f0, 0x8a9eae]

let _sceneCtx   = null
let _cycleTimer = null
let _currentIdx = 0
let _rafId      = null

export function initHero() {
  _initCanvas()
  _initImageCycle()
}

export function destroyHero() {
  if (_cycleTimer) clearInterval(_cycleTimer)
  if (_rafId)      cancelAnimationFrame(_rafId)
  if (_sceneCtx)   _sceneCtx.dispose()
  _sceneCtx = null
}

// ── Particle canvas ───────────────────────────────

function _initCanvas() {
  const canvas = document.getElementById('heroCanvas')
  if (!canvas) return

  canvas.width  = window.innerWidth
  canvas.height = window.innerHeight

  const ctx = initScene(canvas, { alpha: true, antialias: false })
  _sceneCtx = ctx
  const { scene, camera, renderer, clock } = ctx

  camera.position.z = 6

  // Geometry
  const positions = new Float32Array(PARTICLE_N * 3)
  const colors    = new Float32Array(PARTICLE_N * 3)
  const speeds    = new Float32Array(PARTICLE_N)
  const colorObjs = PARTICLE_COLORS.map(c => new THREE.Color(c))

  for (let i = 0; i < PARTICLE_N; i++) {
    // Spread across wide area
    positions[i*3+0] = (Math.random() - 0.5) * 22
    positions[i*3+1] = (Math.random() - 0.5) * 13
    positions[i*3+2] = (Math.random() - 0.5) * 6

    const col = colorObjs[Math.floor(Math.random() * colorObjs.length)]
    colors[i*3+0] = col.r
    colors[i*3+1] = col.g
    colors[i*3+2] = col.b

    speeds[i] = Math.random() * 0.25 + 0.04
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3))

  const mat = new THREE.PointsMaterial({
    size:           0.055,
    vertexColors:   true,
    transparent:    true,
    opacity:        0.4,
    sizeAttenuation: true,
    blending:       THREE.AdditiveBlending,
    depthWrite:     false,
  })

  const pts = new THREE.Points(geo, mat)
  scene.add(pts)

  // Mouse subtle parallax
  const mouse = { x: 0, y: 0 }
  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth  - 0.5) * 1.5
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 1.0
  })

  function animate() {
    _rafId = requestAnimationFrame(animate)
    const pos = geo.attributes.position.array

    for (let i = 0; i < PARTICLE_N; i++) {
      pos[i*3+1] += speeds[i] * 0.008
      if (pos[i*3+1] > 7) {
        pos[i*3+1] = -7
        pos[i*3+0] = (Math.random() - 0.5) * 22
      }
    }
    geo.attributes.position.needsUpdate = true

    const t = clock.getElapsedTime()
    pts.rotation.y =  t * 0.02 + mouse.x * 0.04
    pts.rotation.x = -t * 0.008 - mouse.y * 0.025

    renderer.render(scene, camera)
  }

  ctx._setAnimId(_rafId)
  animate()
}

// ── Image cycle ───────────────────────────────────

function _initImageCycle() {
  const slides = document.querySelectorAll('.hero__slide')
  if (!slides.length) return

  function next() {
    const prev = _currentIdx
    _currentIdx = (_currentIdx + 1) % slides.length

    gsap.to(slides[prev],           { opacity: 0, duration: 1.8, ease: 'power3.out' })
    gsap.fromTo(slides[_currentIdx],
      { opacity: 0, scale: 1.06 },
      { opacity: 1, scale: 1, duration: 1.8, ease: 'power3.out' }
    )
    slides[prev].classList.remove('hero__slide--active')
    slides[_currentIdx].classList.add('hero__slide--active')
  }

  _cycleTimer = setInterval(next, CYCLE_MS)
}
