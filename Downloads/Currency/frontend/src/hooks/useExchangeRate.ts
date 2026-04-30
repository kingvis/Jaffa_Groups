import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchCurrencies, fetchExchangeRate } from '../api/currency'
import type { ExchangeRateResponse } from '../types/currency'

export function useCurrencies() {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: fetchCurrencies,
    staleTime: Infinity,
  })
}

export function useExchangeRateMutation() {
  return useMutation<ExchangeRateResponse, Error, { from: string; to: string }>({
    mutationFn: ({ from, to }) => fetchExchangeRate(from, to),
  })
}
