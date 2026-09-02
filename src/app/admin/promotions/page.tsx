'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import AdminStatCard from '@/components/admin/StatCard'
import {
  Megaphone, Tag, DollarSign, Percent, Trophy,
  Plus, Search, Filter, Download, Calendar,
  MousePointerClick, Eye, ShoppingCart,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

type CampaignType = 'promo_code' | 'banner' | 'email' | 'push' | 'social'
type CampaignStatus = 'active' | 'scheduled' | 'draft' | 'ended'

interface Campaign {
  id: string
  name: string
  code: string
  type: CampaignType
  status: CampaignStatus
  startDate: string
  endDate: string
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
}

const CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp_001', name: 'Welcome Offer', code: 'WELCOME20', type: 'promo_code', status: 'active',
    startDate: '2026-01-01', endDate: '2026-12-31', budget: 5000000, spent: 2340000,
    impressions: 89400, clicks: 12300, conversions: 4280, revenue: 18960000,
  },
  {
    id: 'cmp_002', name: 'Summer Sale Blitz', code: 'SUMMER_SALE', type: 'banner', status: 'active',
    startDate: '2026-06-01', endDate: '2026-08-31', budget: 8000000, spent: 4120000,
    impressions: 156000, clicks: 23400, conversions: 6120, revenue: 32400000,
  },
  {
    id: 'cmp_003', name: 'Refer a Friend', code: 'REFER_FRIEND', type: 'email', status: 'active',
    startDate: '2026-03-15', endDate: '2026-09-30', budget: 3000000, spent: 1450000,
    impressions: 45200, clicks: 8900, conversions: 2340, revenue: 11200000,
  },
  {
    id: 'cmp_004', name: 'Weekend Flash', code: 'WEEKEND15', type: 'push', status: 'active',
    startDate: '2026-04-01', endDate: '2026-12-31', budget: 2000000, spent: 980000,
    impressions: 67800, clicks: 15600, conversions: 3890, revenue: 14500000,
  },
  {
    id: 'cmp_005', name: 'Flash Sale Event', code: 'FLASH_SALE', type: 'social', status: 'scheduled',
    startDate: '2026-07-20', endDate: '2026-07-22', budget: 6000000, spent: 0,
    impressions: 0, clicks: 0, conversions: 0, revenue: 0,
  },
  {
    id: 'cmp_006', name: 'Black Friday Deals', code: 'BLACK_FRIDAY', type: 'banner', status: 'scheduled',
    startDate: '2026-11-27', endDate: '2026-11-30', budget: 12000000, spent: 0,
    impressions: 0, clicks: 0, conversions: 0, revenue: 0,
  },
  {
    id: 'cmp_007', name: 'New Year Celebration', code: 'NEW_YEAR', type: 'email', status: 'draft',
    startDate: '2026-12-28', endDate: '2027-01-05', budget: 4000000, spent: 0,
    impressions: 0, clicks: 0, conversions: 0, revenue: 0,
  },
  {
    id: 'cmp_008', name: 'Back to School', code: 'BACK_TO_SCHOOL', type: 'push', status: 'active',
    startDate: '2026-09-01', endDate: '2026-09-30', budget: 3500000, spent: 1780000,
    impressions: 52300, clicks: 9800, conversions: 2150, revenue: 9800000,
  },
  {
    id: 'cmp_009', name: 'Valentine Specials', code: 'VALENTINES', type: 'social', status: 'ended',
    startDate: '2026-02-01', endDate: '2026-02-14', budget: 2500000, spent: 2380000,
    impressions: 98700, clicks: 18900, conversions: 5430, revenue: 22100000,
  },
  {
    id: 'cmp_010', name: 'Independence Day', code: 'INDEPENDENCE_DAY', type: 'banner', status: 'active',
    startDate: '2026-07-01', endDate: '2026-07-10', budget: 5500000, spent: 3200000,
    impressions: 134500, clicks: 21200, conversions: 5890, revenue: 28700000,
  },
  {
    id: 'cmp_011', name: 'App Launch Promo', code: 'APP_LAUNCH', type: 'push', status: 'active',
    startDate: '2026-01-15', endDate: '2026-03-15', budget: 7000000, spent: 6850000,
    impressions: 210000, clicks: 45600, conversions: 12400, revenue: 56800000,
  },
]

const CAMPAIGN_PERFORMANCE = [
  { month: 'Jan', impressions: 42000, clicks: 8200, conversions: 2100 },
  { month: 'Feb', impressions: 58000, clicks: 11400, conversions: 3200 },
  { month: 'Mar', impressions: 71000, clicks: 14800, conversions: 4100 },
  { month: 'Apr', impressions: 65000, clicks: 13200, conversions: 3800 },
  { month: 'May', impressions: 82000, clicks: 17600, conversions: 5200 },
  { month: 'Jun', impressions: 95000, clicks: 21000, conversions: 6400 },
]

const TYPE_LABELS: Record<CampaignType, string> = {
  promo_code: 'Promo Code', banner: 'Banner', email: 'Email', push: 'Push', social: 'Social',
}
const TYPE_COLORS: Record<CampaignType, string> = {
  promo_code: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  banner: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  email: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  push: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  social: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
}
const STATUS_STYLES: Record<CampaignStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  ended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function AdminPromotionsPage() {
  const [typeFilter, setTypeFilter] = useState<CampaignType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Real data now for the top-line stats — the detailed table below still
  // uses the CAMPAIGNS mock, flagged separately (see comment on the table).
  const [promos, setPromos] = useState<import('@/lib/admin/analytics').PromoAnalytics[] | null>(null)
  const [ads, setAds] = useState<import('@/lib/admin/analytics').AdCampaignAnalytics[] | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/analytics/promotions').then((r) => r.json()),
      fetch('/api/admin/analytics/ads').then((r) => r.json()),
    ]).then(([promoData, adData]) => {
      if (promoData.success) setPromos(promoData.promos)
      if (adData.success) setAds(adData.campaigns)
    })
  }, [])

  const filtered = useMemo(() => {
    return CAMPAIGNS.filter((c) => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [typeFilter, statusFilter, search])

  // Real, computed from the two endpoints above. "Promo Revenue" from the
  // original mock had no faithful real analog — a redemption's discount is
  // a cost to the platform, not revenue — so it's relabeled "Discount
  // Given" rather than forcing a number into the wrong semantics.
  const activeAdCampaigns = ads?.filter((a) => a.status === 'active').length ?? 0
  const activePromoCodes = promos?.filter((p) => p.isActive).length ?? 0
  const totalPromoCodes = promos?.length ?? 0
  const redemptionsThisMonth = promos?.reduce((sum, p) => sum + p.redemptions, 0) ?? 0
  const totalDiscountGivenUSD = promos?.reduce((sum, p) => sum + p.totalDiscountUSD, 0) ?? 0
  const percentagePromos = promos?.filter((p) => p.discountType === 'percentage') ?? []
  const avgDiscount = percentagePromos.length
    ? Math.round((percentagePromos.reduce((s, p) => s + p.discountValue, 0) / percentagePromos.length) * 10) / 10
    : 0
  const topAdCampaign = ads?.length ? [...ads].sort((a, b) => b.conversions - a.conversions)[0] : null

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-heading">Advertising &amp; Promotions</h1>
            <p className="text-sm text-text-secondary mt-1">Manage campaigns, promo codes, and ad placements across the platform.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={() => setToast({ type: 'success', message: 'Campaign creation flow opened' })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Campaign
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats — real, from /api/admin/analytics/promotions and /ads.
          "Discount Given" replaces the old "Promo Revenue" label — a
          redemption's discount is a cost to the platform, not revenue, so
          the original mock number was measuring the wrong thing entirely,
          not just using fake data. */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <AdminStatCard label="Active Campaigns" value={String(activeAdCampaigns + activePromoCodes)} icon={Megaphone} accent="bg-amber-500" />
        <AdminStatCard label="Total Promo Codes" value={String(totalPromoCodes)} icon={Tag} accent="bg-blue-500" />
        <AdminStatCard label="Redemptions" value={redemptionsThisMonth.toLocaleString()} icon={ShoppingCart} accent="bg-emerald-500" />
        <AdminStatCard label="Discount Given (USD)" value={formatCurrency(totalDiscountGivenUSD, 'USD')} icon={DollarSign} accent="bg-purple-500" />
        <AdminStatCard label="Avg % Discount" value={percentagePromos.length ? `${avgDiscount}%` : '—'} icon={Percent} accent="bg-pink-500" />
        <AdminStatCard label="Top Ad Campaign" value={topAdCampaign?.name ?? '—'} icon={Trophy} accent="bg-orange-500" />
      </motion.div>

      {/* Performance chart */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Campaign Performance</h3>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={CAMPAIGN_PERFORMANCE}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px', fontSize: '13px' }} />
              <Legend />
              <Bar dataKey="impressions" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Impressions" />
              <Bar dataKey="clicks" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Clicks" />
              <Bar dataKey="conversions" fill="#10B981" radius={[6, 6, 0, 0]} name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-tertiary" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as CampaignType | 'all')}
              className="px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              <option value="all">All Types</option>
              <option value="promo_code">Promo Code</option>
              <option value="banner">Banner</option>
              <option value="email">Email</option>
              <option value="push">Push</option>
              <option value="social">Social</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | 'all')}
              className="px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="ended">Ended</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <Calendar className="w-3.5 h-3.5" />
            <span>{filtered.length} campaigns</span>
          </div>
        </div>
      </motion.div>

      {/* Campaign table — still the CAMPAIGNS mock below. Not wired for a
          real reason: this page's type filter (banner/email/push/social)
          doesn't match the real ad_campaigns.platform enum
          (google/meta/tiktok/linkedin/offline), and blends promo codes and
          ad campaigns into one fictional "Campaign" shape that neither
          real table actually has. Reconciling that needs a product call —
          should ad campaigns adopt banner/email/push/social categories, or
          should this table split into two real sections (promo codes,
          ad campaigns) like the underlying data actually is? Wiring this
          blind in either direction risks locking in the wrong model. */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Campaign</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Type</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Status</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary hidden lg:table-cell">Dates</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary">Budget</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary hidden md:table-cell">Spent</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary hidden lg:table-cell">Impressions</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary hidden xl:table-cell">Clicks</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary hidden xl:table-cell">Conversions</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary">ROI</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((campaign) => {
                const roi = campaign.spent > 0 ? ((campaign.revenue - campaign.spent) / campaign.spent) * 100 : 0
                const spendPct = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0
                return (
                  <tr key={campaign.id} className="border-b border-border/50 hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-text-primary">{campaign.name}</p>
                        <p className="text-xs text-text-tertiary mt-0.5 font-mono">{campaign.code}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', TYPE_COLORS[campaign.type])}>
                        {TYPE_LABELS[campaign.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_STYLES[campaign.status])}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs text-text-secondary">{campaign.startDate}</p>
                      <p className="text-xs text-text-tertiary">to {campaign.endDate}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-xs font-medium text-text-primary">{formatCurrency(Math.round((campaign.budget) / 620), 'USD')}</p>
                      <div className="w-16 h-1.5 rounded-full bg-surface-secondary mt-1 ml-auto">
                        <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${Math.min(spendPct, 100)}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <p className="text-xs font-medium text-text-primary">{formatCurrency(Math.round((campaign.spent) / 620), 'USD')}</p>
                      <p className="text-xs text-text-tertiary">{spendPct.toFixed(0)}%</p>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <div className="flex items-center justify-end gap-1">
                        <Eye className="w-3 h-3 text-text-tertiary" />
                        <span className="text-xs text-text-primary">{campaign.impressions.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right hidden xl:table-cell">
                      <div className="flex items-center justify-end gap-1">
                        <MousePointerClick className="w-3 h-3 text-text-tertiary" />
                        <span className="text-xs text-text-primary">{campaign.clicks.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right hidden xl:table-cell">
                      <div className="flex items-center justify-end gap-1">
                        <ShoppingCart className="w-3 h-3 text-text-tertiary" />
                        <span className="text-xs text-text-primary">{campaign.conversions.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn('text-xs font-semibold', roi >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                        {roi > 0 ? '+' : ''}{roi.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Budget breakdown */}
      <motion.div variants={ITEM} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Budget by Campaign</h3>
          <div className="space-y-3">
            {CAMPAIGNS.filter((c) => c.budget > 0).sort((a, b) => b.budget - a.budget).slice(0, 6).map((c) => {
              const pct = (c.spent / c.budget) * 100
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-primary font-medium">{c.name}</span>
                    <span className="text-xs text-text-secondary">{formatCurrency(Math.round((c.spent) / 620), 'USD')} / {formatCurrency(Math.round((c.budget) / 620), 'USD')}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-secondary">
                    <div
                      className={cn('h-full rounded-full transition-all', pct > 90 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500')}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Top Performers by ROI</h3>
          <div className="space-y-3">
            {CAMPAIGNS.filter((c) => c.spent > 0)
              .map((c) => ({ ...c, roi: ((c.revenue - c.spent) / c.spent) * 100 }))
              .sort((a, b) => b.roi - a.roi)
              .slice(0, 6)
              .map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary/50 border border-border/50">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{c.name}</p>
                    <p className="text-xs text-text-tertiary">{TYPE_LABELS[c.type]} &middot; {c.conversions.toLocaleString()} conversions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-500">+{c.roi.toFixed(0)}%</p>
                    <p className="text-xs text-text-tertiary">{formatCurrency(Math.round((c.revenue) / 620), 'USD')}</p>
                  </div>
                </div>
              ))}
          </div>
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
