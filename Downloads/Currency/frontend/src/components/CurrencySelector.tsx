import { motion } from 'framer-motion'
import type { CurrenciesMap } from '../types/currency'
import { CURRENCY_FLAGS } from '../types/currency'

interface Props {
  label: string
  value: string
  onChange: (code: string) => void
  currencies: CurrenciesMap
  excludeCode?: string
  accent: 'cyan' | 'purple'
  'data-testid'?: string
}

export default function CurrencySelector({
  label,
  value,
  onChange,
  currencies,
  excludeCode,
  accent,
  'data-testid': testId,
}: Props) {
  const options = Object.values(currencies).filter(
    (c) => c.currencyCode !== excludeCode,
  )

  const selected = value ? currencies[value] : null
  const borderClass = accent === 'cyan' ? 'glow-border-cyan' : 'glow-border-purple'

  return (
    <motion.div
      className="glass-card-inner p-5 flex flex-col gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Label */}
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: accent === 'cyan' ? '#00d4ff' : '#a855f7',
            boxShadow: `0 0 8px ${accent === 'cyan' ? '#00d4ff' : '#a855f7'}`,
          }}
        />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          {label}
        </span>
      </div>

      {/* Selected preview */}
      {selected ? (
        <div className="flex items-center gap-3 px-1">
          <span className="currency-flag">{CURRENCY_FLAGS[selected.currencyCode] ?? '🏳️'}</span>
          <div className="flex flex-col text-left leading-tight">
            <span className="font-semibold text-white text-sm">{selected.currencyName}</span>
            <span className="text-xs text-slate-400">{selected.countryName}</span>
          </div>
          <span className="badge-code ml-auto">{selected.currencyCode}</span>
        </div>
      ) : (
        <div className="px-1 text-slate-500 text-sm">Select a currency</div>
      )}

      {/* Dropdown */}
      <div className="relative">
        <select
          data-testid={testId}
          className={`currency-select ${accent === 'purple' ? 'currency-select-2' : ''} ${
            value ? borderClass : ''
          }`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        >
          <option value="">— Choose Currency —</option>
          {options.map((c) => (
            <option key={c.currencyCode} value={c.currencyCode}>
              {CURRENCY_FLAGS[c.currencyCode] ?? ''} {c.currencyCode} — {c.currencyName}
            </option>
          ))}
        </select>
        {/* Chevron icon */}
        <svg
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-50"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={accent === 'cyan' ? '#00d4ff' : '#a855f7'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </motion.div>
  )
}
