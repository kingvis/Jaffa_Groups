/**
 * main.js — Application entry point
 *
 * Boot sequence:
 *  1. Loader animates in
 *  2. Modules initialize in parallel
 *  3. Loader exits
 *  4. Hero entrance animation plays
 *  5. Scroll animations initialize
 *
 * Architecture: No global state. Each module is self-contained.
 */

import { initHero }             from './components/hero.js'
import { initGallery }          from './components/gallery.js'
import { initPortfolio }        from './components/portfolio.js'
import { initContact }          from './components/contact.js'
import {
  initScrollAnimations,
  playHeroEntrance,
  playLoaderExit,
  smoothScrollTo,
} from '../tools/scrollAnimations.js'
import { initFramerAnimations } from './framerAnimations.js'

// ── Boot ───────────────────────────────────────────

async function boot() {
  const loader = document.getElementById('loader')

  // Initialize non-visual modules in parallel
  await Promise.all([
    initGallery(),   // detects WebXR capabilities
    initContact(),   // injects contact form DOM
  ])

  // Initialize portfolio (fetches gallery.json)
  await initPortfolio()

  // Initialize hero Three.js canvas + image cycle
  initHero()

  // Wait for fonts + first frame
  await document.fonts.ready

  // Exit loader
  await playLoaderExit(loader)

  // Start scroll animations (GSAP ScrollTrigger)
  initScrollAnimations()

  // Hero entrance
  playHeroEntrance()

  // Framer Motion luxury 3D animations
  initFramerAnimations()

  // Nav mobile toggle
  _initMobileNav()

  // Theme toggle
  _initThemeToggle()

  // Smooth scroll for anchor links
  _initAnchorScroll()
}

// ── Theme Toggle ───────────────────────────────────

function _initThemeToggle() {
  const btn = document.getElementById('themeToggle')
  if (!btn) return
  btn.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light'
    const next = isLight ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('jaffa-theme', next)
  })
}

// ── Mobile Nav ─────────────────────────────────────

function _initMobileNav() {
  const toggle = document.getElementById('navToggle')
  const links  = document.getElementById('navLinks')
  if (!toggle || !links) return

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('nav__links--open')
    toggle.setAttribute('aria-expanded', String(isOpen))
    document.body.style.overflow = isOpen ? 'hidden' : ''
  })

  // Close on link click
  links.querySelectorAll('.nav__link').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('nav__links--open')
      toggle.setAttribute('aria-expanded', 'false')
      document.body.style.overflow = ''
    })
  })
}

// ── Anchor Smooth Scroll ───────────────────────────

function _initAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href')
      if (href === '#') return
      const target = document.querySelector(href)
      if (!target) return
      e.preventDefault()
      smoothScrollTo(target, -80) // offset for fixed nav
    })
  })
}

// ── Start ──────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
