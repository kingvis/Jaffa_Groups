/**
 * contact.js — Contact section renderer
 * Injected into #contactInner. Matches luxury editorial CSS.
 */

export function initContact() {
  const container = document.getElementById('contactInner')
  if (!container) return

  container.innerHTML = `
    <div class="contact__info" data-reveal>
      <span class="section-label">05 / Contact</span>
      <h2 class="contact__heading">
        Let's Build<br>Something <em>Remarkable</em>
      </h2>
      <p class="contact__body">
        Whether you're envisioning a mountain estate, lakefront retreat, or a curated
        interior transformation — we'd love to hear about your vision.
        Every great home begins with a conversation.
      </p>
      <div class="contact__details">
        <div class="contact__detail">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>Park City, Utah</span>
        </div>
        <div class="contact__detail">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.4 11.5 19.79 19.79 0 01.34 2.84 2 2 0 012.33 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.4a16 16 0 006.72 6.72l.77-.77a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0121.28 17l-.36-.08z"/>
          </svg>
          <span>+1 (435) 555-0192</span>
        </div>
        <div class="contact__detail">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <span>hello@jaffagroup.com</span>
        </div>
      </div>
    </div>

    <form class="contact__form" id="contactForm" novalidate data-reveal>
      <div class="form-group">
        <label class="form-label" for="contactName">Full Name</label>
        <input class="form-input" type="text" id="contactName" name="name"
               placeholder="Your name" autocomplete="name" required />
      </div>
      <div class="form-group">
        <label class="form-label" for="contactEmail">Email Address</label>
        <input class="form-input" type="email" id="contactEmail" name="email"
               placeholder="your@email.com" autocomplete="email" required />
      </div>
      <div class="form-group">
        <label class="form-label" for="contactProject">Project Type</label>
        <input class="form-input" type="text" id="contactProject" name="project"
               placeholder="e.g. Mountain Estate, Interior Renovation" />
      </div>
      <div class="form-group">
        <label class="form-label" for="contactMessage">Your Vision</label>
        <textarea class="form-textarea" id="contactMessage" name="message"
                  placeholder="Tell us about your project, timeline, and budget..." rows="5" required></textarea>
      </div>
      <button type="submit" class="btn-pill">Send Message</button>
      <p class="form-status" id="formStatus" aria-live="polite"></p>
    </form>
  `

  _wireForm()
}

function _wireForm() {
  const form   = document.getElementById('contactForm')
  const status = document.getElementById('formStatus')
  if (!form) return

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = form.querySelector('button[type="submit"]')
    btn.disabled = true
    btn.textContent = 'Sending…'

    await new Promise(r => setTimeout(r, 1200))

    status.textContent = 'Thank you — we\'ll be in touch within 24 hours.'
    btn.textContent = 'Sent ✓'
    setTimeout(() => {
      btn.disabled = false
      btn.textContent = 'Send Message'
      status.textContent = ''
      form.reset()
    }, 4000)
  })
}
