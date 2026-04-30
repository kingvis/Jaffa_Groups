import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ExchangeRateResponse } from '../types/currency'
import { CURRENCY_FLAGS } from '../types/currency'

interface Props {
  data: ExchangeRateResponse
  amount?: number
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    const initial = 0

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(initial + (target - initial) * eased)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])

  return value
}

export default function RateDisplay({ data, amount = 1 }: Props) {
  const unitRate = parseFloat(data.exchangeRate)
  const converted = unitRate * amount
  const inverseConverted = (1 / unitRate) * amount
  const animatedConverted = useCountUp(converted)

  const fromFlag = CURRENCY_FLAGS[data.fromCurrencyCode] ?? '🏳️'
  const toFlag   = CURRENCY_FLAGS[data.toCurrencyCode]   ?? '🏳️'

  const displayConverted = animatedConverted.toFixed(converted < 1 ? 6 : 4)
  const displayAmount = amount % 1 === 0 ? amount.toFixed(0) : amount.toPrecision(6).replace(/\.?0+$/, '')

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={data.fromCurrencyCode + data.toCurrencyCode + data.exchangeRate + amount}
        className="glass-card p-6 flex flex-col gap-5"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        data-testid="rate-display"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
            Exchange Rate
          </span>
          <span className="badge-code">LIVE CALC</span>
        </div>

        {/* Primary conversion */}
        <div className="flex flex-col items-center gap-2 py-2">
          <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
            <span className="text-2xl">{fromFlag}</span>
            <span className="text-slate-400">{displayAmount} {data.fromCurrencyCode}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            <span className="text-2xl">{toFlag}</span>
          </div>

          <motion.div
            className="rate-value"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {displayConverted}
          </motion.div>

          <span className="text-slate-400 text-sm font-medium tracking-wide">
            {data.toCurrencyCode}
          </span>
        </div>

        {/* Unit rate chip */}
        <div className="flex justify-center">
          <span
            className="badge-code text-xs px-3 py-1"
            style={{ color: 'rgba(0,212,255,0.7)', borderColor: 'rgba(0,212,255,0.2)' }}
          >
            1 {data.fromCurrencyCode} = {unitRate.toFixed(unitRate < 1 ? 6 : 4)} {data.toCurrencyCode}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700/50" />

        {/* Inverse conversion */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
            Inverse
          </span>
          <div className="glass-card-inner px-4 py-3 flex items-center justify-between">
            <span className="text-slate-300 text-sm">
              {toFlag} {displayAmount} {data.toCurrencyCode}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            <span className="font-bold text-purple-300">
              {inverseConverted.toFixed(inverseConverted < 1 ? 6 : 4)} {data.fromCurrencyCode}
            </span>
          </div>
        </div>

        {/* Note */}
        <p className="text-xs text-slate-600 text-center">
          Rates calculated from stored data. Inverse & cross-rates computed in real-time.
        </p>
      </motion.div>
    </AnimatePresence>
  )
}
