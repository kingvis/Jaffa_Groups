/**
 * Frontend test suite — Currency Exchange Rate Monitor
 * Tests: 7 cases (positive + negative) using Vitest + React Testing Library
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import App from '../App'
import * as currencyApi from '../api/currency'
import type { CurrenciesMap, ExchangeRateResponse } from '../types/currency'

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('../api/currency')

const MOCK_CURRENCIES: CurrenciesMap = {
  INR: { countryName: 'India', currencyCode: 'INR', currencyName: 'Indian Rupees' },
  USD: { countryName: 'Usa', currencyCode: 'USD', currencyName: 'US Dollars' },
  CAD: { countryName: 'Canada', currencyCode: 'CAD', currencyName: 'Canadian Dollars' },
  EUR: { countryName: 'Europe', currencyCode: 'EUR', currencyName: 'European Dollars' },
  AUD: { countryName: 'Australia', currencyCode: 'AUD', currencyName: 'Australian Dollars' },
  AED: { countryName: 'Uae', currencyCode: 'AED', currencyName: 'UAE Dirham' },
}

const MOCK_RATE: ExchangeRateResponse = {
  fromCurrencyCode: 'USD',
  toCurrencyCode: 'INR',
  exchangeRate: '80.0800',
}

function renderApp() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(currencyApi.fetchCurrencies).mockResolvedValue(MOCK_CURRENCIES)
  vi.mocked(currencyApi.fetchExchangeRate).mockResolvedValue(MOCK_RATE)
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TC-UI-01: Currency dropdowns render', () => {
  it('renders both currency selectors after currencies load', async () => {
    renderApp()
    await waitFor(() => {
      expect(screen.getByTestId('currency1-select')).toBeInTheDocument()
      expect(screen.getByTestId('currency2-select')).toBeInTheDocument()
    })
  })
})

describe('TC-UI-02: Currency 1 removes from Currency 2', () => {
  it('selected Currency 1 option is excluded from Currency 2 dropdown', async () => {
    renderApp()
    const select1 = await screen.findByTestId('currency1-select')
    fireEvent.change(select1, { target: { value: 'USD' } })

    const select2 = screen.getByTestId('currency2-select')
    const options2 = Array.from(select2.querySelectorAll('option')).map((o) => o.value)
    expect(options2).not.toContain('USD')
    expect(options2).toContain('INR')
  })
})

describe('TC-UI-03: Submit button disabled until both selected', () => {
  it('get-rate button is disabled when only one currency is selected', async () => {
    renderApp()
    const select1 = await screen.findByTestId('currency1-select')
    fireEvent.change(select1, { target: { value: 'USD' } })

    const btn = screen.getByTestId('get-rate-button')
    expect(btn).toBeDisabled()
  })

  it('get-rate button is enabled when both currencies are selected', async () => {
    renderApp()
    const select1 = await screen.findByTestId('currency1-select')
    const select2 = screen.getByTestId('currency2-select')

    fireEvent.change(select1, { target: { value: 'USD' } })
    fireEvent.change(select2, { target: { value: 'INR' } })

    expect(screen.getByTestId('get-rate-button')).not.toBeDisabled()
  })
})

describe('TC-UI-04: Displays exchange rate on success', () => {
  it('shows rate-display component after successful API call', async () => {
    renderApp()
    const select1 = await screen.findByTestId('currency1-select')
    const select2 = screen.getByTestId('currency2-select')

    fireEvent.change(select1, { target: { value: 'USD' } })
    fireEvent.change(select2, { target: { value: 'INR' } })
    fireEvent.click(screen.getByTestId('get-rate-button'))

    await waitFor(() => {
      expect(screen.getByTestId('rate-display')).toBeInTheDocument()
    })
  })
})

describe('TC-UI-05: Shows error on API failure (negative)', () => {
  it('shows api-error element when fetchExchangeRate rejects', async () => {
    vi.mocked(currencyApi.fetchExchangeRate).mockRejectedValue(
      Object.assign(new Error('Request failed'), {
        response: { data: { detail: 'Unsupported currency code(s): XYZ' } },
      }),
    )
    renderApp()
    const select1 = await screen.findByTestId('currency1-select')
    const select2 = screen.getByTestId('currency2-select')

    fireEvent.change(select1, { target: { value: 'USD' } })
    fireEvent.change(select2, { target: { value: 'INR' } })
    fireEvent.click(screen.getByTestId('get-rate-button'))

    await waitFor(() => {
      expect(screen.getByTestId('api-error')).toBeInTheDocument()
    })
  })
})

describe('TC-UI-06: Swap button swaps currencies', () => {
  it('swaps currency1 and currency2 values on swap button click', async () => {
    renderApp()
    const select1 = await screen.findByTestId('currency1-select') as HTMLSelectElement
    const select2 = screen.getByTestId('currency2-select') as HTMLSelectElement

    fireEvent.change(select1, { target: { value: 'USD' } })
    fireEvent.change(select2, { target: { value: 'INR' } })

    fireEvent.click(screen.getByTestId('swap-button'))

    await waitFor(() => {
      expect(select1.value).toBe('INR')
      expect(select2.value).toBe('USD')
    })
  })
})

describe('TC-UI-07: Live clock renders', () => {
  it('renders the live clock timestamp element', async () => {
    renderApp()
    await waitFor(() => {
      expect(screen.getByTestId('live-clock')).toBeInTheDocument()
    })
  })
})
