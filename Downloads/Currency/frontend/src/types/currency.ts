export interface CurrencyInfo {
  countryName: string
  currencyCode: string
  currencyName: string
}

export interface CurrenciesMap {
  [code: string]: CurrencyInfo
}

export interface ExchangeRateResponse {
  fromCurrencyCode: string
  toCurrencyCode: string
  exchangeRate: string
}

export const CURRENCY_FLAGS: Record<string, string> = {
  INR: '🇮🇳',
  USD: '🇺🇸',
  CAD: '🇨🇦',
  EUR: '🇪🇺',
  AUD: '🇦🇺',
  AED: '🇦🇪',
}
