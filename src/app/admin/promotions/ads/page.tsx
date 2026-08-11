'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import AdminStatCard from '@/components/admin/StatCard'
import {
  Image, Eye, MousePointerClick, TrendingUp, DollarSign,
  Plus, Search, Download, X, Globe, Calendar,
  Upload, ExternalLink,
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

type AdStatus = 'active' | 'paused' | 'scheduled' | 'ended'

interface AdCampaign {
  id: string
  name: string
  targetUrl: string
  targetPage: string
  gradient: string
  impressions: number
  clicks: number
  cost: number
  dailyBudget: number
  totalBudget: number
  status: AdStatus
  startDate: string
  endDate: string
  countries: string[]
  categories: string[]
  dailyData: { date: string; impressions: number; clicks: number }[]
}

interface ApiCampaignRow {
  id: string
  name: string
  status: string
  budget: number | null
  spent: number | null
  starts_at: string | null
  ends_at: string | null
  impressions: number | null
  clicks: number | null
  targeting: { countries?: string[]; categories?: string[] } | null
  metadata: Record<string, unknown> | null
}

function mapAdCampaign(row: ApiCampaignRow): AdCampaign {
  const raw = row.status ?? 'draft'
  let status: AdStatus
  if (raw === 'active') status = 'active'
  else if (raw === 'paused') status = 'paused'
  else if (raw === 'draft') status = 'scheduled'
  else status = 'ended'
  const targeting = row.targeting ?? {}
  const metadata = row.metadata ?? {}
  const countries = Array.isArray(targeting.countries) && targeting.countries.length > 0 ? targeting.countries : ['All']
  const categories = Array.isArray(targeting.categories) ? targeting.categories : []
  return {
    id: row.id,
    name: row.name ?? '',
    targetUrl: typeof metadata.targetUrl === 'string' ? metadata.targetUrl : '#',
    targetPage: typeof metadata.targetPage === 'string' ? metadata.targetPage : 'Campaign',
    gradient: typeof metadata.gradient === 'string' ? metadata.gradient : 'from-amber-500 via-orange-500 to-red-500',
    impressions: row.impressions ?? 0,
    clicks: row.clicks ?? 0,
    cost: row.spent ?? 0,
    dailyBudget: typeof metadata.dailyBudget === 'number' ? metadata.dailyBudget : 0,
    totalBudget: row.budget ?? 0,
    status,
    startDate: row.starts_at ? row.starts_at.slice(0, 10) : '',
    endDate: row.ends_at ? row.ends_at.slice(0, 10) : '',
    countries,
    categories,
    dailyData: Array.isArray(metadata.dailyData) ? metadata.dailyData as AdCampaign['dailyData'] : [],
  }
}

const STATUS_STYLES: Record<AdStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ended: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export default function AdminAdCampaignsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdStatus | 'all'>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [campaigns, setCampaigns] = useState<AdCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [newAd, setNewAd] = useState({
    name: '', targetUrl: '', targetPage: '', dailyBudget: 50000,
    totalBudget: 1000000, startDate: '', endDate: '', countries: 'All', categories: 'All',
  })

  const loadCampaigns = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: '1', limit: '100' })
    if (statusFilter === 'active') params.set('status', 'active')
    else if (statusFilter === 'paused') params.set('status', 'paused')
    else if (statusFilter === 'scheduled') params.set('status', 'draft')
    try {
      const res = await fetch(`/api/admin/ad-campaigns?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load campaigns')
      const json = await res.json()
      setCampaigns((json.data ?? []).map(mapAdCampaign))
      setFetchError(null)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadCampaigns()
  }, [loadCampaigns])

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.targetPage.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [campaigns, statusFilter, search])

  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0)
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)
  const totalCost = campaigns.reduce((sum, c) => sum + c.cost, 0)
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100) : 0
  const activeAds = campaigns.filter((c) => c.status === 'active').length

  const selectedData = campaigns.find((c) => c.id === selectedCampaign)

  const handleCreate = async () => {
    if (!newAd.name) {
      setToast({ type: 'error', message: 'Campaign name is required' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    try {
      const res = await fetch('/api/admin/ad-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAd.name,
          platform: 'meta',
          budget: newAd.totalBudget,
          spent: 0,
          currencyCode: 'XAF',
          startsAt: newAd.startDate || null,
          endsAt: newAd.endDate || null,
          targeting: {
            countries: newAd.countries === 'All' ? ['All'] : [newAd.countries],
            categories: newAd.categories === 'All' ? [] : [newAd.categories],
          },
          metadata: {
            dailyBudget: newAd.dailyBudget,
            targetUrl: newAd.targetUrl,
            targetPage: newAd.targetPage,
            gradient: 'from-amber-500 via-orange-500 to-red-500',
          },
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error || 'Failed to create campaign')
      }
      setToast({ type: 'success', message: `Ad campaign "${newAd.name}" created successfully` })
      setShowCreateForm(false)
      setNewAd({ name: '', targetUrl: '', targetPage: '', dailyBudget: 50000, totalBudget: 1000000, startDate: '', endDate: '', countries: 'All', categories: 'All' })
      await loadCampaigns()
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to create campaign' })
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-heading">Ad Campaigns</h1>
            <p className="text-sm text-text-secondary mt-1">Create and manage banner ad campaigns across the platform.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Ad Campaign
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <AdminStatCard label="Active Campaigns" value={String(activeAds)} icon={Image} change={15.3} accent="bg-amber-500" />
        <AdminStatCard label="Total Impressions" value={totalImpressions.toLocaleString()} icon={Eye} change={22.8} accent="bg-blue-500" />
        <AdminStatCard label="Total Clicks" value={totalClicks.toLocaleString()} icon={MousePointerClick} change={19.4} accent="bg-emerald-500" />
        <AdminStatCard label="Average CTR" value={`${avgCTR.toFixed(1)}%`} icon={TrendingUp} change={3.2} accent="bg-purple-500" />
        <AdminStatCard label="Total Ad Spend" value={formatCurrency(totalCost, 'XAF')} icon={DollarSign} change={28.6} accent="bg-rose-500" />
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
                <h3 className="text-lg font-semibold text-text-primary font-heading">Create Ad Campaign</h3>
                <button onClick={() => setShowCreateForm(false)} className="p-1 rounded-lg hover:bg-surface-secondary transition-colors">
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Campaign Name *</label>
                      <input
                        type="text" value={newAd.name} placeholder="e.g. Summer Homepage Banner"
                        onChange={(e) => setNewAd({ ...newAd, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Target Page</label>
                      <input
                        type="text" value={newAd.targetPage} placeholder="e.g. Homepage"
                        onChange={(e) => setNewAd({ ...newAd, targetPage: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Target URL</label>
                      <input
                        type="text" value={newAd.targetUrl} placeholder="e.g. /promotions"
                        onChange={(e) => setNewAd({ ...newAd, targetUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Daily Budget (XAF)</label>
                      <input
                        type="number" value={newAd.dailyBudget} min={0} step={10000}
                        onChange={(e) => setNewAd({ ...newAd, dailyBudget: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Total Budget (XAF)</label>
                      <input
                        type="number" value={newAd.totalBudget} min={0} step={100000}
                        onChange={(e) => setNewAd({ ...newAd, totalBudget: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Start Date</label>
                      <input
                        type="date" value={newAd.startDate}
                        onChange={(e) => setNewAd({ ...newAd, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">End Date</label>
                      <input
                        type="date" value={newAd.endDate}
                        onChange={(e) => setNewAd({ ...newAd, endDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Target Countries</label>
                      <select
                        value={newAd.countries}
                        onChange={(e) => setNewAd({ ...newAd, countries: e.target.value })}
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
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Target Categories</label>
                      <select
                        value={newAd.categories}
                        onChange={(e) => setNewAd({ ...newAd, categories: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      >
                        <option value="All">All Categories</option>
                        <option value="Food & Dining">Food &amp; Dining</option>
                        <option value="Salon & Beauty">Salon &amp; Beauty</option>
                        <option value="Fitness">Fitness &amp; Wellness</option>
                        <option value="Events">Events</option>
                        <option value="Business Services">Business Services</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Banner upload area */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Banner Creative</label>
                  <div className="w-full aspect-video rounded-xl border-2 border-dashed border-border hover:border-amber-500/40 bg-surface-secondary flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors">
                    <Upload className="w-8 h-8 text-text-tertiary" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-text-secondary">Click to upload</p>
                      <p className="text-xs text-text-tertiary mt-0.5">PNG, JPG, GIF up to 5MB</p>
                      <p className="text-xs text-text-tertiary">1200 x 628px recommended</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleCreate}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm"
                >
                  Create Campaign
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

      {/* Filters */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text" placeholder="Search campaigns..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AdStatus | 'all')}
            className="px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="scheduled">Scheduled</option>
            <option value="ended">Ended</option>
          </select>
          <span className="text-xs text-text-tertiary">{filtered.length} campaigns</span>
        </div>
      </motion.div>

      {/* Performance chart */}
      {selectedData && selectedData.dailyData.some((d) => d.impressions > 0) && (
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">
              {selectedData.name} — Performance
            </h3>
            <button onClick={() => setSelectedCampaign(null)} className="p-1 rounded-lg hover:bg-surface-secondary transition-colors">
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedData.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }} />
                <Legend />
                <Line type="monotone" dataKey="impressions" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4, fill: '#F59E0B' }} name="Impressions" />
                <Line type="monotone" dataKey="clicks" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 4, fill: '#8B5CF6' }} name="Clicks" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Campaign cards grid */}
      <motion.div variants={ITEM} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center gap-2 py-16">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-secondary">Loading campaigns...</span>
          </div>
        ) : fetchError ? (
          <div className="col-span-full py-16 text-center text-sm text-red-500">{fetchError}</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-sm text-text-secondary">No ad campaigns found.</div>
        ) : filtered.map((campaign) => {
          const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100) : 0
          const budgetPct = campaign.totalBudget > 0 ? (campaign.cost / campaign.totalBudget) * 100 : 0
          return (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'rounded-2xl bg-surface border border-border overflow-hidden hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-500/20 transition-all duration-300 cursor-pointer',
                selectedCampaign === campaign.id && 'ring-2 ring-amber-500/40'
              )}
              onClick={() => setSelectedCampaign(campaign.id)}
            >
              {/* Banner preview */}
              <div className={cn('h-28 bg-gradient-to-r', campaign.gradient, 'flex items-center justify-center relative')}>
                <Image className="w-10 h-10 text-white/30" />
                <div className="absolute top-2 right-2">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_STYLES[campaign.status])}>
                    {campaign.status}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{campaign.name}</h4>
                    <p className="text-xs text-text-tertiary mt-0.5">{campaign.targetPage}</p>
                  </div>
                  <button className="p-1 rounded-lg hover:bg-surface-secondary transition-colors">
                    <ExternalLink className="w-3.5 h-3.5 text-text-tertiary" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-lg font-bold text-text-primary">{campaign.impressions.toLocaleString()}</p>
                    <p className="text-xs text-text-tertiary">Impressions</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-text-primary">{campaign.clicks.toLocaleString()}</p>
                    <p className="text-xs text-text-tertiary">Clicks</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-500">{ctr.toFixed(1)}%</p>
                    <p className="text-xs text-text-tertiary">CTR</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-text-primary">{formatCurrency(campaign.cost, 'XAF')}</p>
                    <p className="text-xs text-text-tertiary">Cost</p>
                  </div>
                </div>

                {/* Budget bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary">Budget used</span>
                    <span className="text-xs text-text-tertiary">{budgetPct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-secondary">
                    <div
                      className={cn('h-full rounded-full transition-all', budgetPct > 90 ? 'bg-red-500' : budgetPct > 60 ? 'bg-amber-500' : 'bg-emerald-500')}
                      style={{ width: `${Math.min(budgetPct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Mini daily chart */}
                {campaign.dailyData.some((d) => d.impressions > 0) && (
                  <div className="mt-3 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={campaign.dailyData}>
                        <Line type="monotone" dataKey="impressions" stroke="#F59E0B" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Campaign detail table */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary font-heading">Campaign Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Campaign</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Status</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary">Impressions</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary">Clicks</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary">CTR</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary hidden md:table-cell">Daily Budget</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary hidden lg:table-cell">Total Budget</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary">Cost</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary hidden xl:table-cell">Dates</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary hidden 2xl:table-cell">Countries</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-text-secondary">Loading campaigns...</span>
                    </div>
                  </td>
                </tr>
              ) : fetchError ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-sm text-red-500">{fetchError}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-sm text-text-secondary">No ad campaigns found.</td>
                </tr>
              ) : filtered.map((c) => {
                const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100) : 0
                return (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-r flex items-center justify-center shrink-0', c.gradient)}>
                          <Image className="w-4 h-4 text-white/50" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{c.name}</p>
                          <p className="text-xs text-text-tertiary">{c.targetPage}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_STYLES[c.status])}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-medium text-text-primary">{c.impressions.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-medium text-text-primary">{c.clicks.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn('text-xs font-semibold', ctr >= 5 ? 'text-emerald-500' : ctr >= 3 ? 'text-amber-500' : 'text-text-secondary')}>
                        {ctr.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="text-xs text-text-primary">{formatCurrency(c.dailyBudget, 'XAF')}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-xs text-text-primary">{formatCurrency(c.totalBudget, 'XAF')}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-medium text-text-primary">{formatCurrency(c.cost, 'XAF')}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-text-tertiary" />
                        <span className="text-xs text-text-secondary">{c.startDate} — {c.endDate}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden 2xl:table-cell">
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-text-tertiary" />
                        <span className="text-xs text-text-secondary">
                          {c.countries.includes('All') ? 'Global' : c.countries.join(', ')}
                        </span>
                      </div>
                    </td>
                  </tr>
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
