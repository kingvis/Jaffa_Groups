import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCurrencies, useExchangeRateMutation } from './hooks/useExchangeRate'
import Background from './components/Background'
import CurrencySelector from './components/CurrencySelector'
import SwapButton from './components/SwapButton'
import RateDisplay from './components/RateDisplay'
import LiveClock from './components/LiveClock'

export default function App() {
  const [currency1, setCurrency1] = useState('')
  const [currency2, setCurrency2] = useState('')

  const { data: currencies, isLoading: loadingCurrencies, error: currenciesError } = useCurrencies()
  const mutation = useExchangeRateMutation()

  const canSubmit = Boolean(currency1 && currency2 && currency1 !== currency2)
  const sameSelected = Boolean(currency1 && currency2 && currency1 === currency2)

  function handleSwap() {
    setCurrency1(currency2)
    setCurrency2(currency1)
    mutation.reset()
  }

  function handleSubmit() {
    if (!canSubmit) return
    mutation.mutate({ from: currency1, to: currency2 })
  }

  function handleCurrency1Change(code: string) {
    setCurrency1(code)
    if (code === currency2) setCurrency2('')
    mutation.reset()
  }

  function handleCurrency2Change(code: string) {
    setCurrency2(code)
    mutation.reset()
  }

  const apiErrorMsg =
    mutation.error instanceof Error
      ? ((mutation.error as any)?.response?.data?.detail ?? mutation.error.message)
      : null

  return (
    <div className="relative min-h-screen flex flex-col">
      <Background />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(168,85,247,0.2))',
                border: '1px solid rgba(0,212,255,0.3)',
              }}
            >
              💱
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">CurrencyX</h1>
              <p className="text-slate-500 text-xs">Real-time Exchange Monitor</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <LiveClock />
          </motion.div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl flex flex-col gap-6">

            {/* Hero text */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <h2
                className="text-4xl sm:text-5xl font-extrabold mb-2"
                style={{
                  background: 'linear-gradient(135deg, #fff 0%, #00d4ff 50%, #a855f7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Exchange Rate
              </h2>
              <p className="text-slate-400 text-sm">
                Select two currencies to see the live exchange rate
              </p>
            </motion.div>

            {/* Converter card */}
            <motion.div
              className="glass-card p-6 flex flex-col gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {loadingCurrencies ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="spinner" />
                  <span className="text-slate-500 text-sm">Loading currencies…</span>
                </div>
              ) : currenciesError ? (
                <div className="error-box">
                  ⚠ Could not load currencies. Is the backend running on port 8000?
                </div>
              ) : currencies ? (
                <>
                  {/* Selectors row */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <CurrencySelector
                        label="Currency 1 (From)"
                        value={currency1}
                        onChange={handleCurrency1Change}
                        currencies={currencies}
                        accent="cyan"
                        data-testid="currency1-select"
                      />
                    </div>
                    <SwapButton onSwap={handleSwap} disabled={!currency1 && !currency2} />
                    <div className="flex-1">
                      <CurrencySelector
                        label="Currency 2 (To)"
                        value={currency2}
                        onChange={handleCurrency2Change}
                        currencies={currencies}
                        excludeCode={currency1}
                        accent="purple"
                        data-testid="currency2-select"
                      />
                    </div>
                  </div>

                  {/* Validation message */}
                  <AnimatePresence>
                    {sameSelected && (
                      <motion.div
                        className="error-box"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        data-testid="same-currency-error"
                      >
                        ⚠ Please select two different currencies.
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.button
                    className="btn-primary"
                    onClick={handleSubmit}
                    disabled={!canSubmit || mutation.isPending}
                    whileTap={canSubmit ? { scale: 0.98 } : {}}
                    data-testid="get-rate-button"
                  >
                    {mutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span
                          className="spinner"
                          style={{ width: 18, height: 18, borderWidth: 2 }}
                        />
                        Fetching Rate…
                      </span>
                    ) : (
                      'Get Exchange Rate →'
                    )}
                  </motion.button>
                </>
              ) : null}
            </motion.div>

            {/* Error from API call */}
            <AnimatePresence>
              {apiErrorMsg && (
                <motion.div
                  className="error-box"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  data-testid="api-error"
                >
                  ⚠ {apiErrorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rate result */}
            <AnimatePresence>
              {mutation.isSuccess && mutation.data && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <RateDisplay data={mutation.data} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Supported currencies footer strip */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-slate-600 text-xs mb-2 uppercase tracking-wider">
                Supported Currencies
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {['🇮🇳 INR', '🇺🇸 USD', '🇨🇦 CAD', '🇪🇺 EUR', '🇦🇺 AUD', '🇦🇪 AED'].map((item) => (
                  <span
                    key={item}
                    className="badge-code text-xs"
                    style={{
                      color: 'rgba(148,163,184,0.7)',
                      borderColor: 'rgba(148,163,184,0.15)',
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-4 text-slate-700 text-xs">
          MLCV-2026-6695 · Currency Exchange Rate Monitor · Built with Claude Code
        </footer>
      </div>
    </div>
  )
}
