import axios from 'axios'
import type { CurrenciesMap, ExchangeRateResponse } from '../types/currency'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
})

export async function fetchCurrencies(): Promise<CurrenciesMap> {
  const { data } = await api.get<CurrenciesMap>('/currency')
  return data
}

export async function fetchExchangeRate(
  fromCur: string,
  toCur: string,
): Promise<ExchangeRateResponse> {
  const { data } = await api.get<ExchangeRateResponse>(
    `/exchange-rate/${fromCur}/${toCur}`,
  )
  return data
}
