'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Key, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PickupVerificationProps {
  orderId: string
  onVerified: () => void
}

export default function PickupVerification({ orderId, onVerified }: PickupVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleDigitChange = (index: number, value: string) => {
    if (value && !/^[A-Za-z0-9]$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.toUpperCase()
    setCode(newCode)
    setError(null)

    if (value && index < 7) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backward' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleVerify = async () => {
    const fullCode = code.join('')
    if (fullCode.length < 8) {
      setError('Please enter the complete 8-character code')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const res = await fetch('/api/orders/pickup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, code: fullCode }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Verification failed')
      }

      setSuccess(true)
      setTimeout(onVerified, 1500)
    } catch (err: any) {
      setError(err.message)
      setCode(['', '', '', '', '', '', '', ''])
      document.getElementById('code-0')?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
          <Key className="w-7 h-7 text-amber-600" />
        </div>
        <h3 className="font-bold text-text-primary">Enter Pickup Code</h3>
        <p className="text-sm text-text-secondary mt-1">
          Ask the vendor for the 8-character pickup code
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Verified! Items confirmed.</p>
        </div>
      )}

      <div className="flex justify-center gap-2">
        {code.map((digit, i) => (
          <input
            key={i}
            id={`code-${i}`}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={success}
            className={cn(
              'w-10 h-12 text-center text-lg font-bold rounded-xl border transition-all',
              'bg-surface border-border text-text-primary',
              'focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none',
              error && 'border-red-300 bg-red-50 dark:bg-red-900/10',
              success && 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10',
            )}
          />
        ))}
      </div>

      <button
        onClick={handleVerify}
        disabled={isVerifying || success}
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-sm transition-all',
          'bg-gradient-to-r from-amber-500 to-amber-600 text-white',
          'shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {isVerifying ? 'Verifying...' : success ? 'Verified!' : 'Verify Pickup Code'}
      </button>
    </div>
  )
}
