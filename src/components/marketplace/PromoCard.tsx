'use client'

import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PromoConfig {
  title: string
  desc: string
  code?: string
  gradient: string
}

export default function PromoCard({ promo }: { promo: PromoConfig }) {
  const [copied, setCopied] = useState(false)

  const handleClaim = useCallback(() => {
    if (!promo.code) return
    navigator.clipboard.writeText(promo.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [promo.code])

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-br text-white',
        promo.gradient
      )}
    >
      <div className="relative z-10">
        {promo.code && (
          <span className="inline-block px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-sm text-xs font-mono font-bold tracking-wider mb-3">
            {promo.code}
          </span>
        )}
        <h3 className="text-xl font-bold">{promo.title}</h3>
        <p className="text-white/80 mt-1 text-sm">{promo.desc}</p>
        <button
          onClick={handleClaim}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white text-sm font-semibold hover:bg-white/30 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy code
            </>
          )}
        </button>
      </div>
      <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-white/5" />
    </div>
  )
}
