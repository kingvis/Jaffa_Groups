/**
 * scrollAnimations.js — GSAP ScrollTrigger definitions
 *
 * All timelines use power3.out per PROJECT_CONSTITUTION.md.
 * All ScrollTrigger instances are tracked for clean disposal.
 * Call initScrollAnimations() after DOM is ready.
 */

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger.js'

gsap.registerPlugin(ScrollTrigger)

// Track all created ScrollTrigger instances for disposal
const _triggers = []

/**
 * Kill all managed scroll triggers. Call when navigating away
 * or before re-initializing to prevent jank.
 */
export function killAllScrollTriggers() {
  _triggers.forEach(t => t.kill())
  _triggers.length = 0
}

// ── Helpers ────────────────────────────────────────

function track(trigger) {
  _triggers.push(trigger)
  return trigger
}

function revealFrom(el, from = {}, to = {}, triggerEl = el, start = 'top 85%') {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: triggerEl,
      start,
      toggleActions: 'play none none none',
      onToggle: (st) => track(st),
    },
  })
  tl.fromTo(el, { opacity: 0, y: 40, ...from }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', ...to })
  return tl
}

// ── Public API ─────────────────────────────────────

/**
 * Initialize GSAP scroll animations.
 * NOTE: [data-reveal] reveals, hero parallax, and counters
 * are handled by Framer Motion (framerAnimations.js).
 * GSAP handles: nav scroll class, portfolio card entrance.
 */
export function initScrollAnimations() {
  initNavScroll()
  initPortfolioReveal()
}

/**
 * Animate all [data-reveal] elements into view on scroll.
 */
export function initSectionReveals() {
  const elements = document.querySelectorAll('[data-reveal]')
  elements.forEach((el, i) => {
    const delay = (i % 4) * 0.08  // stagger within each viewport
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
    })
    tl.fromTo(el,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.9, delay, ease: 'power3.out' }
    )
    track(tl.scrollTrigger)
  })
}

/**
 * Animated counter for [data-counter] elements.
 * E.g. <span data-counter="150">0</span>
 */
export function initCounters() {
  document.querySelectorAll('[data-counter]').forEach((el) => {
    const target = parseInt(el.dataset.counter, 10)
    const trigger = track(ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to({ val: 0 }, {
          val: target,
          duration: 2,
          ease: 'power3.out',
          onUpdate() {
            el.textContent = Math.round(this.targets()[0].val)
          },
        })
      },
    }))
  })
}

/**
 * Subtle parallax on the hero images on scroll.
 */
export function initHeroParallax() {
  const heroImages = document.querySelector('.hero__images')
  const heroContent = document.querySelector('.hero__body')
  const heroScroll = document.querySelector('.hero__scroll-cue')

  if (heroImages) {
    track(gsap.to(heroImages, {
      y: '20%',
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
    }).scrollTrigger)
  }

  if (heroContent) {
    track(gsap.to(heroContent, {
      opacity: 0,
      y: -60,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: '40% top',
        scrub: 1,
      },
    }).scrollTrigger)
  }

  if (heroScroll) {
    track(gsap.to(heroScroll, {
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: '15% top',
        scrub: true,
      },
    }).scrollTrigger)
  }
}

/**
 * Change nav background on scroll.
 */
export function initNavScroll() {
  const nav = document.getElementById('nav')
  if (!nav) return

  track(ScrollTrigger.create({
    start: 'top -60px',
    onUpdate: (self) => {
      if (self.progress > 0) {
        nav.classList.add('nav--scrolled')
      } else {
        nav.classList.remove('nav--scrolled')
      }
    },
  }))
}

/**
 * Staggered reveal for portfolio grid cards.
 * Call this after portfolio cards are injected into the DOM.
 */
export function initPortfolioReveal() {
  const cards = document.querySelectorAll('.portfolio-card')
  if (!cards.length) return

  cards.forEach((card) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: 'top 90%',
        toggleActions: 'play none none none',
      },
    })
    tl.fromTo(card,
      { opacity: 0, scale: 0.97 },
      { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' }
    )
    track(tl.scrollTrigger)
  })
}

/**
 * Hero entry animation — runs once on page load (not scroll-triggered).
 * @returns {gsap.core.Timeline}
 */
export function playHeroEntrance() {
  const tl = gsap.timeline({ delay: 0.3 })

  tl.fromTo('.hero__meta',
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
  )
  .fromTo('.hero__title-word',
    { opacity: 0, y: 80 },
    { opacity: 1, y: 0, duration: 1.1, stagger: 0.14, ease: 'power3.out' },
    '-=0.3'
  )
  .fromTo('.hero__foot',
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
    '-=0.5'
  )
  .fromTo('.hero__badge',
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
    '-=0.5'
  )
  .fromTo('.hero__scroll-cue',
    { opacity: 0 },
    { opacity: 1, duration: 0.6, ease: 'power3.out' },
    '-=0.3'
  )

  return tl
}

/**
 * Loader exit animation.
 * @param {HTMLElement} loaderEl
 * @returns {Promise<void>}
 */
export function playLoaderExit(loaderEl) {
  return new Promise((resolve) => {
    gsap.to(loaderEl, {
      opacity: 0,
      duration: 0.6,
      ease: 'power3.out',
      onComplete: () => {
        loaderEl.hidden = true
        resolve()
      },
    })
  })
}

/**
 * Smooth scroll to a target element.
 */
export function smoothScrollTo(target, offset = 0) {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY + offset
  window.scrollTo({ top, behavior: 'smooth' })
}
