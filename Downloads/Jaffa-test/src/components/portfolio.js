/**
 * portfolio.js — Property grid with lazy loading, filtering, and gallery integration
 *
 * Loads gallery.json, renders cards into #portfolioGrid,
 * wires filter buttons, lazy-loads images, and
 * opens gallery.js modal on card click.
 */

import { openGallery } from './gallery.js'
import { initPortfolioReveal } from '../../tools/scrollAnimations.js'

const PAGE_SIZE = 12  // cards per "load more" batch

let _allItems     = []
let _filteredItems = []
let _displayedCount = 0
let _activeFilter = 'all'

/** Load gallery.json and render the initial grid. */
export async function initPortfolio() {
  try {
    const res  = await fetch('/data/gallery.json')
    const data = await res.json()
    _allItems  = data.gallery || []
  } catch (err) {
    console.error('[portfolio] Failed to load gallery.json', err)
    return
  }

  _wireFilters()
  _applyFilter('all')
  _wireLoadMore()
}

// ── Filtering ──────────────────────────────────────

function _wireFilters() {
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('filter-btn--active')
        b.setAttribute('aria-selected', 'false')
      })
      btn.classList.add('filter-btn--active')
      btn.setAttribute('aria-selected', 'true')
      _applyFilter(btn.dataset.filter)
    })
  })
}

function _applyFilter(filter) {
  _activeFilter = filter
  _filteredItems = filter === 'all'
    ? _allItems.filter(i => i.type !== 'panorama360' && i.type !== 'gltf' || _allItems.indexOf(i) < 24)
    : _allItems.filter(i => i.tags?.includes(filter))

  _displayedCount = 0
  const grid = document.getElementById('portfolioGrid')
  if (grid) grid.innerHTML = ''

  _loadMoreCards()
  setTimeout(() => initPortfolioReveal(), 100)
}

// ── Card rendering ─────────────────────────────────

function _loadMoreCards() {
  const grid = document.getElementById('portfolioGrid')
  if (!grid) return

  const nextBatch = _filteredItems.slice(_displayedCount, _displayedCount + PAGE_SIZE)
  nextBatch.forEach(item => {
    const card = _createCard(item)
    grid.appendChild(card)
  })

  _displayedCount += nextBatch.length

  // Hide load more if exhausted
  const loadMoreBtn = document.getElementById('loadMoreBtn')
  if (loadMoreBtn) {
    loadMoreBtn.parentElement.style.display =
      _displayedCount >= _filteredItems.length ? 'none' : ''
  }
}

function _createCard(item) {
  const card = document.createElement('article')
  card.className = 'portfolio-card'
  card.setAttribute('role', 'listitem')
  card.setAttribute('tabindex', '0')
  card.setAttribute('aria-label', `View ${item.title}`)

  const typeBadge = item.type !== '2d'
    ? `<span class="portfolio-card__type-badge">${item.type === 'panorama360' ? '360°' : '3D'}</span>`
    : ''

  card.innerHTML = `
    <img
      class="portfolio-card__img"
      src="${item.thumbnailUrl}"
      alt="${item.title}"
      loading="lazy"
    />
    ${typeBadge}
    <div class="portfolio-card__overlay">
      <h3 class="portfolio-card__title">${item.title}</h3>
      <p class="portfolio-card__meta">${_formatCategory(item.category)} · ${_formatTags(item.tags)}</p>
    </div>
  `

  card.addEventListener('click', () => openGallery(item))
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openGallery(item)
    }
  })

  return card
}

function _formatCategory(cat) {
  if (!cat) return ''
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}

function _formatTags(tags) {
  if (!tags?.length) return ''
  return tags.slice(0, 2).map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')
}

// ── Load More ──────────────────────────────────────

function _wireLoadMore() {
  const btn = document.getElementById('loadMoreBtn')
  if (!btn) return

  btn.addEventListener('click', () => {
    _loadMoreCards()
    setTimeout(() => initPortfolioReveal(), 100)
  })
}
