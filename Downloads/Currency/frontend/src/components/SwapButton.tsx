import { useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  onSwap: () => void
  disabled?: boolean
}

export default function SwapButton({ onSwap, disabled }: Props) {
  const [rotating, setRotating] = useState(false)

  function handleClick() {
    if (disabled) return
    setRotating(true)
    onSwap()
    setTimeout(() => setRotating(false), 600)
  }

  return (
    <motion.button
      className="btn-swap"
      onClick={handleClick}
      disabled={disabled}
      title="Swap currencies"
      aria-label="Swap currencies"
      whileTap={{ scale: 0.9 }}
      data-testid="swap-button"
    >
      <motion.svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ rotate: rotating ? 180 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <path d="M7 16V4m0 0L3 8m4-4 4 4" />
        <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
      </motion.svg>
    </motion.button>
  )
}
