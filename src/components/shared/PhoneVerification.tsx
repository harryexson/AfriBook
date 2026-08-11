'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Phone, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react'

interface PhoneVerificationProps {
  phoneNumber: string
  onVerify: (code: string) => Promise<void>
  onResend: () => Promise<void>
  onBack?: () => void
  loading?: boolean
}

export default function PhoneVerification({ phoneNumber, onVerify, onResend, onBack, loading }: PhoneVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = [...code]
    pasted.split('').forEach((char, i) => {
      if (i < 6) newCode[i] = char
    })
    setCode(newCode)
    const nextIndex = Math.min(pasted.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleSubmit = async () => {
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError('Please enter the full 6-digit code')
      return
    }
    setError('')
    await onVerify(fullCode)
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await onResend()
      setCountdown(30)
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setResending(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      )}

      {/* Icon & header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25"
        >
          <Phone className="w-7 h-7 text-white" />
        </motion.div>
        <h2 className="text-xl font-bold text-text-primary font-heading">Verify your phone</h2>
        <p className="text-sm text-text-secondary mt-2">
          Enter the code sent to{' '}
          <span className="font-semibold text-text-primary">{phoneNumber}</span>
        </p>
      </div>

      {/* OTP input */}
      <div className="flex justify-center gap-2 sm:gap-3">
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            maxLength={1}
            className={cn(
              'w-11 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold text-text-primary',
              'rounded-xl bg-surface-secondary border-2 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-amber-500/30',
              error ? 'border-red-400 focus:border-red-500' : 'border-border focus:border-amber-500',
              digit ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-500/10' : ''
            )}
          />
        ))}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-500 text-center flex items-center justify-center gap-1"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Verify button */}
      <button
        onClick={handleSubmit}
        disabled={loading || code.some((d) => !d)}
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-sm transition-all',
          'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
          'hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25',
          'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
        )}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Verifying...
          </div>
        ) : (
          'Verify'
        )}
      </button>

      {/* Resend */}
      <div className="text-center">
        {countdown > 0 ? (
          <p className="text-xs text-text-tertiary">
            Resend code in <span className="font-semibold text-text-secondary">{countdown}s</span>
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', resending && 'animate-spin')} />
            Resend code
          </button>
        )}
      </div>
    </motion.div>
  )
}
