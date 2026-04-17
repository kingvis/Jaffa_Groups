/**
 * framerAnimations.js — Luxury 3D effects via Framer Motion (vanilla DOM API)
 *
 * Uses Framer Motion's framework-agnostic: animate, scroll, inView, stagger
 * Layered on top of GSAP (which handles loader + hero entrance).
 */

import { animate, scroll, inView, stagger } from 'framer-motion/dom'

/* ── Easing presets ─────────────────────────────────────── */
const EASE_LUXURY  = [0.16, 1, 0.3, 1]      // expo out — silky deceleration
const EASE_SPRING  = { type: 'spring', stiffness: 80, damping: 18 }
const EASE_SMOOTH  = [0.25, 0.46, 0.45, 0.94]

/* ─────────────────────────────────────────────────────────
   1. HERO — Scroll-linked parallax depth layers
────────────────────────────────────────────────────────── */
function initHeroParallax() {
  const hero = document.querySelector('.hero')
  const slides = document.querySelectorAll('.hero__slide')
  const badge  = document.querySelector('.hero__badge')
  const body   = document.querySelector('.hero__body')
  if (!hero) return

  // Background slides drift back (Z-axis depth illusion via scale + Y)
  scroll(
    animate(slides, { y: ['0%', '22%'], scale: [1, 1.06] }, { ease: 'linear' }),
    { target: hero, offset: ['start start', 'end start'] }
  )

  // Badge drifts slower (foreground layer)
  if (badge) {
    scroll(
      animate(badge, { y: [0, -60], opacity: [1, 0] }, { ease: 'linear' }),
      { target: hero, offset: ['start start', 'end start'] }
    )
  }

  // Hero body content rises slightly as you scroll away
  if (body) {
    scroll(
      animate(body, { y: [0, -40], opacity: [1, 0.4] }, { ease: 'linear' }),
      { target: hero, offset: ['start start', 'end start'] }
    )
  }
}

/* ─────────────────────────────────────────────────────────
   2. SECTION REVEALS — 3D perspective slide-in per element
────────────────────────────────────────────────────────── */
function initSectionReveals() {
  // Batch all [data-reveal] elements not yet animated
  const revealEls = document.querySelectorAll('[data-reveal]')

  revealEls.forEach((el, i) => {
    // Set initial 3D state via inline style
    el.style.willChange = 'transform, opacity'

    inView(
      el,
      () => {
        animate(
          el,
          {
            opacity: [0, 1],
            y:       [48, 0],
            rotateX: [-14, 0],
            scale:   [0.97, 1],
          },
          {
            duration: 0.9,
            ease: EASE_LUXURY,
            delay: (i % 4) * 0.07,  // subtle stagger based on DOM order
          }
        )
      },
      { margin: '-8% 0px' }  // trigger slightly before viewport edge
    )
  })
}

/* ─────────────────────────────────────────────────────────
   3. PORTFOLIO CARDS — Magnetic 3D tilt on hover
────────────────────────────────────────────────────────── */
function initCardTilt() {
  document.querySelectorAll('.portfolio-card').forEach(card => {
    card.style.transformStyle = 'preserve-3d'
    card.style.willChange = 'transform'

    card.addEventListener('mousemove', (e) => {
      const rect   = card.getBoundingClientRect()
      const cx     = rect.left + rect.width  / 2
      const cy     = rect.top  + rect.height / 2
      const dx     = (e.clientX - cx) / (rect.width  / 2)   // –1 … +1
      const dy     = (e.clientY - cy) / (rect.height / 2)   // –1 … +1

      animate(card, {
        rotateY:    dx * 9,
        rotateX:   -dy * 7,
        scale:      1.03,
        z:          30,
      }, { duration: 0.12, ease: 'linear' })
    })

    card.addEventListener('mouseleave', () => {
      animate(card, {
        rotateY: 0,
        rotateX: 0,
        scale:   1,
        z:       0,
      }, { duration: 0.65, ease: EASE_LUXURY })
    })
  })
}

/* ─────────────────────────────────────────────────────────
   4. SERVICE CARDS — 3D lift + gold border sweep on hover
────────────────────────────────────────────────────────── */
function initServiceCardFx() {
  document.querySelectorAll('.service-card').forEach(card => {
    card.style.transformStyle = 'preserve-3d'
    card.style.willChange = 'transform'

    card.addEventListener('mouseenter', () => {
      animate(card, {
        y:     -8,
        scale: 1.02,
        rotateX: -3,
      }, { duration: 0.45, ease: EASE_LUXURY })
    })

    card.addEventListener('mouseleave', () => {
      animate(card, {
        y:     0,
        scale: 1,
        rotateX: 0,
      }, { duration: 0.55, ease: EASE_LUXURY })
    })
  })
}

/* ─────────────────────────────────────────────────────────
   5. ABOUT STATS — Count-up animation on inView
────────────────────────────────────────────────────────── */
function initStatCounters() {
  const numEls = document.querySelectorAll('.about__stat-num[data-counter]')
  if (!numEls.length) return

  numEls.forEach((numEl, i) => {
    // Read target from data-counter attribute (HTML starts at "0")
    const target = parseInt(numEl.dataset.counter, 10)
    if (!target) return

    let triggered = false

    inView(numEl, () => {
      if (triggered) return
      triggered = true

      // Stagger each counter slightly
      animate(0, target, {
        duration: 2.2,
        delay: i * 0.12,
        ease: [0.0, 0.0, 0.2, 1],
        onUpdate: (v) => { numEl.textContent = Math.round(v) },
      })
    }, { margin: '-5% 0px' })
  })
}

/* ─────────────────────────────────────────────────────────
   6. FEATURED SECTION — Horizontal 3D slide-in
────────────────────────────────────────────────────────── */
function initFeaturedReveal() {
  const img     = document.querySelector('.featured__image')
  const content = document.querySelector('.featured__content')
  if (!img || !content) return

  inView('.featured', () => {
    animate(img, {
      opacity:  [0, 1],
      x:        [-60, 0],
      rotateY:  [8, 0],
      scale:    [0.96, 1],
    }, { duration: 1.0, ease: EASE_LUXURY })

    animate(content, {
      opacity:  [0, 1],
      x:        [60, 0],
      rotateY:  [-8, 0],
      scale:    [0.96, 1],
    }, { duration: 1.0, ease: EASE_LUXURY, delay: 0.15 })
  }, { margin: '-5% 0px' })
}

/* ─────────────────────────────────────────────────────────
   7. PROCESS STEPS — Cascading 3D reveal
────────────────────────────────────────────────────────── */
function initProcessReveal() {
  const steps = document.querySelectorAll('.process__step')
  if (!steps.length) return

  inView('.process', () => {
    animate(steps, {
      opacity: [0, 1],
      y:       [24, 0],
      scale:   [0.9, 1],
    }, {
      duration: 0.55,
      ease: EASE_LUXURY,
      delay: stagger(0.08),
    })
  }, { margin: '-5% 0px' })
}

/* ─────────────────────────────────────────────────────────
   8. MARQUEE — Depth fade on scroll
────────────────────────────────────────────────────────── */
function initMarqueeDepth() {
  const marquee = document.querySelector('.marquee')
  if (!marquee) return

  scroll(
    animate(marquee, { scaleX: [0.97, 1], opacity: [0.6, 1] }, { ease: 'linear' }),
    { target: marquee, offset: ['start end', 'start center'] }
  )
}

/* ─────────────────────────────────────────────────────────
   9. ABOUT DREAM IMAGES — Floating depth parallax
────────────────────────────────────────────────────────── */
function initAboutImageDepth() {
  const left  = document.querySelector('.about__dream-img--left')
  const right = document.querySelector('.about__dream-img--right')
  const about = document.querySelector('.about')
  if (!left || !right || !about) return

  scroll(
    animate(left,  { y: [0, -30], rotateZ: [-0.5, 0.5] }, { ease: 'linear' }),
    { target: about, offset: ['start end', 'end start'] }
  )
  scroll(
    animate(right, { y: [0, 30],  rotateZ: [0.5, -0.5] }, { ease: 'linear' }),
    { target: about, offset: ['start end', 'end start'] }
  )
}

/* ─────────────────────────────────────────────────────────
   INIT — called from main.js after DOM is ready
────────────────────────────────────────────────────────── */
export function initFramerAnimations() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _run)
  } else {
    _run()
  }
}

function _run() {
  initHeroParallax()
  initSectionReveals()
  initCardTilt()
  initServiceCardFx()
  initStatCounters()
  initFeaturedReveal()
  initProcessReveal()
  initMarqueeDepth()
  initAboutImageDepth()
}
