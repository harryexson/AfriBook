'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'
import type { Country } from '@/types'
import AdminStatCard from '@/components/admin/StatCard'
import CountryEditor from '@/components/admin/CountryEditor'
import { Globe, DollarSign, Percent, TrendingUp } from 'lucide-react'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

type CountryRow = Country & { isActive: boolean }

export default function AdminCountriesPage() {
  const [countries, setCountries] = useState<CountryRow[] | null>(null)
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/countries')
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) { setError(data.error || 'Failed to load countries'); return }
        setCountries(data.countries)
        if (data.countries.length > 0) setSelectedCode(data.countries[0].code)
      })
      .catch(() => setError('Failed to load countries'))
      .finally(() => setLoading(false))
  }, [])

  const selected = useMemo(() => countries?.find((c) => c.code === selectedCode) ?? null, [countries, selectedCode])

  const stats = useMemo(() => {
    if (!countries || countries.length === 0) return null
    const active = countries.filter((c) => c.isActive)
    const avgFeeFloor = active.reduce((s, c) => s + c.minimumFeeFloor, 0) / active.length
    const avgTaxRate = active.reduce((s, c) => s + c.taxRate, 0) / active.length
    const currencyCounts = new Map<string, number>()
    for (const c of active) currencyCounts.set(c.currency.code, (currencyCounts.get(c.currency.code) ?? 0) + 1)
    const topCurrency = Array.from(currencyCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    return { activeCount: active.length, avgFeeFloor, avgTaxRate, topCurrency }
  }, [countries])

  const handleSave = async (country: Country) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/countries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: country.code,
          minimumFeeFloor: country.minimumFeeFloor,
          taxRate: country.taxRate,
          paymentMethods: country.paymentMethods,
          legalTerms: country.legalTerms,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Save failed')
      setCountries((prev) => prev?.map((c) => (c.code === country.code ? { ...c, ...data.country } : c)) ?? null)
      setToast({ message: `${country.name} configuration saved` })
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to save' })
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Country Configuration</h1>
        <p className="text-sm text-text-secondary mt-1">Manage country-specific settings, fees, taxes, and payment methods.</p>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </motion.div>

      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Active Countries" value={stats ? String(stats.activeCount) : '—'} icon={Globe} accent="bg-blue-500" />
        <AdminStatCard label="Avg Fee Floor (USD)" value={stats ? formatCurrency(stats.avgFeeFloor, 'USD') : '—'} icon={DollarSign} accent="bg-amber-500" />
        <AdminStatCard label="Avg Tax Rate" value={stats ? `${(stats.avgTaxRate * 100).toFixed(1)}%` : '—'} icon={Percent} accent="bg-purple-500" />
        <AdminStatCard label="Top Currency" value={stats?.topCurrency ?? '—'} icon={TrendingUp} accent="bg-emerald-500" />
      </motion.div>

      {countries && countries.length > 1 && (
        <motion.div variants={ITEM} className="flex flex-wrap gap-2">
          {countries.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelectedCode(c.code)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                c.code === selectedCode ? 'bg-amber-500 text-white border-amber-500' : 'bg-surface border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {c.name}
            </button>
          ))}
        </motion.div>
      )}

      <motion.div variants={ITEM}>
        {loading ? (
          <p className="text-sm text-text-tertiary">Loading countries…</p>
        ) : selected ? (
          <CountryEditor country={selected} onSave={handleSave} loading={saving} />
        ) : (
          <p className="text-sm text-text-tertiary">No countries configured in the database yet.</p>
        )}
      </motion.div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium bg-emerald-500 text-white"
        >
          {toast.message}
        </motion.div>
      )}
    </motion.div>
  )
}
