'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import AdminStatCard from '@/components/admin/StatCard'
import {
  Tag, Percent, DollarSign, Users, TrendingUp, Shield,
  Plus, Search, Download, Copy, BarChart3, X, CheckCircle,
  Sparkles, Globe, ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

type DiscountType = 'percentage' | 'fixed' | 'free_delivery'
type CodeStatus = 'active' | 'expired' | 'disabled'

interface PromoCode {
  id: string
  code: string
  description: string
  discountType: DiscountType
  discountValue: number
  minOrder: number
  maxUses: number
  usedCount: number
  maxPerUser: number
  validFrom: string
  validUntil: string
  status: CodeStatus
  countries: string[]
  categories: string[]
  revenueImpact: number
  topUsers: { name: string; uses: number }[]
  dailyRedemptions: { date: string; count: number }[]
}

interface ApiPromoRow {
  id: string
  code: string
  description: string | null
  discount_type: string | null
  discount_value: number | null
  currency_code: string | null
  applies_to: string | null
  min_order_amount: number | null
  max_redemptions: number | null
  per_user_limit: number | null
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
}

function mapPromoCode(row: ApiPromoRow): PromoCode {
  const isExpired = !!row.expires_at && new Date(row.expires_at).getTime() < Date.now()
  const status: CodeStatus = isExpired ? 'expired' : row.is_active === false ? 'disabled' : 'active'
  const appliesTo = row.applies_to ?? 'all'
  return {
    id: row.id,
    code: row.code,
    description: row.description ?? '',
    discountType: (row.discount_type ?? 'percentage') as DiscountType,
    discountValue: row.discount_value ?? 0,
    minOrder: row.min_order_amount ?? 0,
    maxUses: row.max_redemptions ?? 0,
    usedCount: 0,
    maxPerUser: row.per_user_limit ?? 1,
    validFrom: row.starts_at ? row.starts_at.slice(0, 10) : '',
    validUntil: row.expires_at ? row.expires_at.slice(0, 10) : '',
    status,
    countries: appliesTo === 'all' ? ['All'] : [appliesTo],
    categories: [],
    revenueImpact: 0,
    topUsers: [],
    dailyRedemptions: [],
  }
}

const STATUS_STYLES: Record<CodeStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  expired: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  disabled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const COLORS = ['#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444']

export default function AdminPromoCodesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CodeStatus | 'all'>('all')
  const [expandedCode, setExpandedCode] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [newCode, setNewCode] = useState({
    code: '', description: '', discountType: 'percentage' as DiscountType,
    discountValue: 10, minOrder: 0, maxUses: 1000, maxPerUser: 1,
    validFrom: '', validUntil: '', countries: 'All', categories: 'All',
  })

  const [bulkPrefix, setBulkPrefix] = useState('')
  const [bulkCount, setBulkCount] = useState(10)
  const [bulkGenerated, setBulkGenerated] = useState<string[]>([])

  const loadCodes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: '1', limit: '100' })
    if (search) params.set('q', search)
    if (statusFilter === 'active') params.set('active', 'true')
    else if (statusFilter === 'disabled') params.set('active', 'false')
    try {
      const res = await fetch(`/api/admin/promos?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load promo codes')
      const json = await res.json()
      setCodes((json.data ?? []).map(mapPromoCode))
      setFetchError(null)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load promo codes')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    loadCodes()
  }, [loadCodes])

  const filtered = useMemo(() => {
    return codes.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (search && !c.code.toLowerCase().includes(search.toLowerCase()) && !c.description.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [codes, statusFilter, search])

  const totalRedemptions = codes.reduce((sum, c) => sum + c.usedCount, 0)
  const totalRevenueImpact = codes.reduce((sum, c) => sum + c.revenueImpact, 0)
  const activeCodes = codes.filter((c) => c.status === 'active').length
  const totalMaxUses = codes.reduce((sum, c) => sum + c.maxUses, 0)
  const avgRedemptionRate = totalMaxUses > 0 ? (totalRedemptions / totalMaxUses) * 100 : 0

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleBulkGenerate = () => {
    if (!bulkPrefix) return
    const codes = Array.from({ length: bulkCount }, (_, i) => {
      const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
      return `${bulkPrefix.toUpperCase()}_${suffix}`
    })
    setBulkGenerated(codes)
    setToast({ type: 'success', message: `${codes.length} promo codes generated` })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreate = async () => {
    if (!newCode.code) {
      setToast({ type: 'error', message: 'Promo code is required' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    try {
      const res = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.code,
          description: newCode.description || null,
          discountType: newCode.discountType,
          discountValue: newCode.discountValue,
          currencyCode: 'XAF',
          appliesTo: newCode.countries === 'All' ? 'all' : newCode.countries,
          minOrderAmount: newCode.minOrder,
          maxRedemptions: newCode.maxUses,
          perUserLimit: newCode.maxPerUser,
          startsAt: newCode.validFrom || null,
          expiresAt: newCode.validUntil || null,
          isActive: true,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error || 'Failed to create promo code')
      }
      setToast({ type: 'success', message: `Promo code "${newCode.code}" created successfully` })
      setShowCreateForm(false)
      setNewCode({ code: '', description: '', discountType: 'percentage', discountValue: 10, minOrder: 0, maxUses: 1000, maxPerUser: 1, validFrom: '', validUntil: '', countries: 'All', categories: 'All' })
      await loadCodes()
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to create promo code' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-heading">Promo Codes</h1>
            <p className="text-sm text-text-secondary mt-1">Create, manage, and track all promotional codes on the platform.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={() => { setShowCreateForm(!showCreateForm); setBulkGenerated([]) }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Promo Code
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Active Codes" value={String(activeCodes)} icon={Tag} change={10.2} accent="bg-amber-500" />
        <AdminStatCard label="Total Redemptions" value={totalRedemptions.toLocaleString()} icon={TrendingUp} change={18.4} accent="bg-emerald-500" />
        <AdminStatCard label="Revenue Impact" value={formatCurrency(totalRevenueImpact, 'XAF')} icon={DollarSign} change={26.7} accent="bg-purple-500" />
        <AdminStatCard label="Avg Redemption Rate" value={`${avgRedemptionRate.toFixed(1)}%`} icon={BarChart3} change={5.3} accent="bg-blue-500" />
      </motion.div>

      {/* Create form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-surface border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary font-heading">Create Promo Code</h3>
                <button onClick={() => setShowCreateForm(false)} className="p-1 rounded-lg hover:bg-surface-secondary transition-colors">
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Code *</label>
                  <input
                    type="text" value={newCode.code} placeholder="e.g. SUMMER20"
                    onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
                  <input
                    type="text" value={newCode.description} placeholder="e.g. Summer holiday special discount"
                    onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Discount Type</label>
                  <select
                    value={newCode.discountType}
                    onChange={(e) => setNewCode({ ...newCode, discountType: e.target.value as DiscountType })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  >
                    <option value="percentage">Percentage Off (%)</option>
                    <option value="fixed">Fixed Amount (XAF)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Discount Value</label>
                  <input
                    type="number" value={newCode.discountValue} min={0}
                    onChange={(e) => setNewCode({ ...newCode, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Min Order (XAF)</label>
                  <input
                    type="number" value={newCode.minOrder} min={0}
                    onChange={(e) => setNewCode({ ...newCode, minOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Max Total Uses</label>
                  <input
                    type="number" value={newCode.maxUses} min={1}
                    onChange={(e) => setNewCode({ ...newCode, maxUses: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Max Uses Per User</label>
                  <input
                    type="number" value={newCode.maxPerUser} min={1}
                    onChange={(e) => setNewCode({ ...newCode, maxPerUser: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Valid From</label>
                  <input
                    type="date" value={newCode.validFrom}
                    onChange={(e) => setNewCode({ ...newCode, validFrom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Valid Until</label>
                  <input
                    type="date" value={newCode.validUntil}
                    onChange={(e) => setNewCode({ ...newCode, validUntil: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Target Countries</label>
                  <select
                    value={newCode.countries}
                    onChange={(e) => setNewCode({ ...newCode, countries: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  >
                    <option value="All">All Countries</option>
                    <option value="CM">Cameroon</option>
                    <option value="NG">Nigeria</option>
                    <option value="KE">Kenya</option>
                    <option value="ZA">South Africa</option>
                    <option value="GH">Ghana</option>
                    <option value="TZ">Tanzania</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Applicable Categories</label>
                  <select
                    value={newCode.categories}
                    onChange={(e) => setNewCode({ ...newCode, categories: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  >
                    <option value="All">All Categories</option>
                    <option value="Food & Dining">Food &amp; Dining</option>
                    <option value="Salon & Beauty">Salon &amp; Beauty</option>
                    <option value="Fitness">Fitness &amp; Wellness</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Photography">Photography</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleCreate}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm"
                >
                  Create Promo Code
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-5 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk generate */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-text-primary font-heading">Bulk Generate Codes</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Prefix</label>
            <input
              type="text" value={bulkPrefix} placeholder="e.g. SUMMER"
              onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())}
              className="w-40 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Count</label>
            <input
              type="number" value={bulkCount} min={1} max={100}
              onChange={(e) => setBulkCount(Number(e.target.value))}
              className="w-24 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          <button
            onClick={handleBulkGenerate}
            className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm"
          >
            Generate
          </button>
        </div>
        {bulkGenerated.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-surface-secondary border border-border">
            <p className="text-xs font-medium text-text-secondary mb-2">Generated {bulkGenerated.length} codes:</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {bulkGenerated.map((code) => (
                <button
                  key={code}
                  onClick={() => handleCopy(code)}
                  className="px-2.5 py-1 rounded-lg bg-surface border border-border text-xs font-mono text-text-primary hover:border-amber-500/40 transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text" placeholder="Search codes or descriptions..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CodeStatus | 'all')}
            className="px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="disabled">Disabled</option>
          </select>
          <span className="text-xs text-text-tertiary">{filtered.length} codes</span>
        </div>
      </motion.div>

      {/* Promo codes table */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Code</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary hidden md:table-cell">Description</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Discount</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary hidden lg:table-cell">Min Order</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary">Usage</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary hidden xl:table-cell">Valid Period</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Status</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary hidden 2xl:table-cell">Countries</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-text-secondary">Loading promo codes...</span>
                    </div>
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-red-500">{fetchError}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-text-secondary">No promo codes found.</td>
                </tr>
              ) : filtered.map((code) => {
                const usagePct = code.maxUses > 0 ? (code.usedCount / code.maxUses) * 100 : 0
                const isExpanded = expandedCode === code.id
                return (
                  <>
                    <tr key={code.id} className="border-b border-border/50 hover:bg-surface-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-text-primary">{code.code}</span>
                          <button onClick={() => handleCopy(code.code)} className="p-0.5 rounded hover:bg-surface-secondary transition-colors">
                            {copiedCode === code.code ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-text-tertiary" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-text-secondary line-clamp-1">{code.description}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {code.discountType === 'percentage' ? (
                            <Percent className="w-3 h-3 text-amber-500" />
                          ) : (
                            <DollarSign className="w-3 h-3 text-amber-500" />
                          )}
                          <span className="text-sm font-medium text-text-primary">
                            {code.discountType === 'percentage' ? `${code.discountValue}%` : formatCurrency(code.discountValue, 'XAF')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <span className="text-xs text-text-secondary">
                          {code.minOrder > 0 ? formatCurrency(code.minOrder, 'XAF') : 'None'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-xs font-medium text-text-primary">{code.usedCount.toLocaleString()} / {code.maxUses.toLocaleString()}</p>
                        <div className="w-16 h-1.5 rounded-full bg-surface-secondary mt-1 ml-auto">
                          <div
                            className={cn('h-full rounded-full transition-all', usagePct > 80 ? 'bg-red-500' : usagePct > 50 ? 'bg-amber-500' : 'bg-emerald-500')}
                            style={{ width: `${Math.min(usagePct, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <p className="text-xs text-text-secondary">{code.validFrom}</p>
                        <p className="text-xs text-text-tertiary">to {code.validUntil}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_STYLES[code.status])}>
                          {code.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden 2xl:table-cell">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-text-tertiary" />
                          <span className="text-xs text-text-secondary">
                            {code.countries.includes('All') ? 'Global' : code.countries.join(', ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedCode(isExpanded ? null : code.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-amber-500 hover:bg-amber-500/10 transition-colors"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          Analytics
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${code.id}-analytics`}>
                        <td colSpan={9} className="p-4 bg-surface-secondary/30">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div>
                              <h4 className="text-sm font-semibold text-text-primary mb-2">Redemption Trend (7 days)</h4>
                              <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={code.dailyRedemptions}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px', fontSize: '12px' }} />
                                    <Line type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3, fill: '#F59E0B' }} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-text-primary mb-2">Top Users</h4>
                              <div className="space-y-2">
                                {code.topUsers.map((u, i) => (
                                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border/50">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600">
                                        {u.name[0]}
                                      </div>
                                      <span className="text-xs text-text-primary">{u.name}</span>
                                    </div>
                                    <span className="text-xs text-text-secondary">{u.uses} use{u.uses > 1 ? 's' : ''}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-text-primary mb-2">Revenue Impact</h4>
                              <div className="p-4 rounded-xl bg-surface border border-border/50 text-center">
                                <DollarSign className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-text-primary">{formatCurrency(code.revenueImpact, 'XAF')}</p>
                                <p className="text-xs text-text-secondary mt-1">Total revenue influenced</p>
                              </div>
                              <div className="mt-3 p-3 rounded-xl bg-surface border border-border/50">
                                <p className="text-xs text-text-secondary mb-1">Categories</p>
                                <div className="flex flex-wrap gap-1">
                                  {code.categories.map((cat) => (
                                    <span key={cat} className="px-2 py-0.5 rounded-full bg-surface-secondary text-xs text-text-secondary">{cat}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          )}
        >
          {toast.message}
        </motion.div>
      )}
    </motion.div>
  )
}
