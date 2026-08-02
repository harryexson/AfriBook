'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Globe, Copy, Check, ExternalLink, Loader2, ShieldCheck,
  RefreshCw, Sparkles, Lock, Zap, QrCode,
} from 'lucide-react'
import { domainStatusLabel } from '@/lib/domains/subdomain'
import type { BusinessDomain } from '@/types'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function DomainPage() {
  const [domain, setDomain] = useState<BusinessDomain | null>(null)
  const [loading, setLoading] = useState(true)
  const [provisioning, setProvisioning] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDomain = useCallback(async () => {
    try {
      const res = await fetch('/api/vendor/domain')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load domain')
      setDomain(data.domain ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load domain')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDomain()
  }, [loadDomain])

  const provision = async () => {
    setProvisioning(true)
    setError(null)
    try {
      const res = await fetch('/api/vendor/domain', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to provision domain')
      setDomain(data.domain)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to provision domain')
    } finally {
      setProvisioning(false)
    }
  }

  const regenerate = async () => {
    setRegenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/vendor/domain', { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to regenerate domain')
      setDomain(data.domain)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate domain')
    } finally {
      setRegenerating(false)
    }
  }

  const copyUrl = () => {
    if (domain) {
      navigator.clipboard.writeText(`https://${domain.fullDomain}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  if (loading) {
    return (
      <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6 max-w-4xl">
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6 max-w-4xl">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Your Domain</h1>
        <p className="text-sm text-text-secondary mt-1">Get a free web address for your business hosted by AfriBook.</p>
      </motion.div>

      {error && (
        <motion.div variants={ITEM} className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
          {error}
        </motion.div>
      )}

      {!domain ? (
        <>
          {/* Claim CTA */}
          <motion.div variants={ITEM} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-8 text-white">
            <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold font-heading">Claim your free domain</h2>
              <p className="text-sm text-amber-50 mt-1 max-w-lg">
                Every AfriBook business gets a free <code className="font-mono text-white/90">business.afribook.xyz</code> subdomain
                with free HTTPS — no registrar, no DNS setup, no cost.
              </p>
              <button
                onClick={provision}
                disabled={provisioning}
                className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-amber-700 text-sm font-semibold hover:bg-amber-50 disabled:opacity-60 transition-colors"
              >
                {provisioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {provisioning ? 'Provisioning…' : 'Claim Free Domain'}
              </button>
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Lock, title: 'Free HTTPS', desc: 'Wildcard TLS certificate included' },
              { icon: Zap, title: 'Instant setup', desc: 'Goes live as soon as you claim it' },
              { icon: QrCode, title: 'QR-ready', desc: 'Print it on menus, cards & posters' },
            ].map((b) => (
              <div key={b.title} className="rounded-2xl bg-surface border border-border p-5">
                <b.icon className="w-5 h-5 text-amber-500 mb-3" />
                <p className="text-sm font-semibold text-text-primary">{b.title}</p>
                <p className="text-xs text-text-secondary mt-1">{b.desc}</p>
              </div>
            ))}
          </motion.div>
        </>
      ) : (
        <>
          {/* Domain card */}
          <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">Your free domain</p>
                <p className="text-2xl font-bold font-heading text-text-primary mt-1 break-all">
                  {domain.subdomain}.<span className="text-amber-500">{domain.rootDomain}</span>
                </p>
              </div>
              <span className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0',
                domain.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
              )}>
                {domain.status === 'active' ? <ShieldCheck className="w-3.5 h-3.5" /> : null}
                {domainStatusLabel(domain.status)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={copyUrl}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <a
                href={`https://${domain.fullDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Visit Your Page
              </a>
            </div>

            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
              <Lock className="w-4 h-4 shrink-0" />
              This address is served over HTTPS with a free wildcard TLS certificate — your customers always get a secure connection.
            </div>
          </motion.div>

          {/* Manage */}
          <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6 space-y-5">
            <h2 className="text-lg font-semibold text-text-primary font-heading">Manage Domain</h2>
            <button
              onClick={regenerate}
              disabled={regenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary disabled:opacity-50 transition-colors"
            >
              {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {regenerating ? 'Regenerating…' : 'Regenerate Address'}
            </button>
            <p className="text-xs text-text-tertiary">
              Regenerating replaces this address with a fresh one based on your current business name. The old address will stop working.
            </p>
          </motion.div>

          {/* Info */}
          <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6 space-y-4">
            <h2 className="text-lg font-semibold text-text-primary font-heading">About your domain</h2>
            <div className="space-y-3 text-sm text-text-secondary">
              <p><span className="font-medium text-text-primary">DNS records:</span> your zone is managed automatically by AfriBook — no action needed.</p>
              <p><span className="font-medium text-text-primary">Upgrades:</span> bring your own <code className="text-amber-500 font-mono">.com</code> or other custom domain later from Business Profile.</p>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
