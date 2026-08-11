'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import AdminStatCard from '@/components/admin/StatCard'
import {
  Flag, ToggleLeft, ToggleRight, Globe, Activity,
  Clock, Search, ChevronDown, EyeOff,
  CheckCircle, AlertTriangle, Target,
  Percent, MapPin, Check,
} from 'lucide-react'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

type FlagStatus = 'enabled' | 'disabled' | 'partial'

interface FeatureFlag {
  id: string
  name: string
  key: string
  description: string
  status: FlagStatus
  rolloutPercent: number
  targetCountries: string[]
  updatedAt: string
  updatedBy: string
}

const AFRICAN_COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'GH', name: 'Ghana' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'SN', name: 'Senegal' },
  { code: 'CI', name: 'Côte d\'Ivoire' },
  { code: 'EG', name: 'Egypt' },
  { code: 'MA', name: 'Morocco' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'MZ', name: 'Mozambique' },
]

const INITIAL_FLAGS: FeatureFlag[] = [
  { id: 'f1', name: 'Rides', key: 'rides_enabled', description: 'Enable ride-hailing and transport booking through the platform', status: 'enabled', rolloutPercent: 100, targetCountries: ['NG', 'KE', 'ZA', 'GH', 'CM', 'TZ', 'UG', 'RW', 'ET', 'SN', 'CI', 'EG', 'MA', 'DZ', 'MZ'], updatedAt: '2026-07-12T10:00:00Z', updatedBy: 'Sarah M.' },
  { id: 'f2', name: 'Food Delivery', key: 'food_delivery', description: 'Enable food ordering and delivery services from partnered restaurants', status: 'enabled', rolloutPercent: 85, targetCountries: ['NG', 'KE', 'ZA', 'GH', 'CM', 'TZ', 'UG', 'RW', 'ET', 'SN'], updatedAt: '2026-07-11T14:30:00Z', updatedBy: 'James K.' },
  { id: 'f3', name: 'Events v2', key: 'events_v2', description: 'Next-generation event creation with rich media, RSVPs, and calendar sync', status: 'partial', rolloutPercent: 40, targetCountries: ['NG', 'KE', 'ZA'], updatedAt: '2026-07-12T09:15:00Z', updatedBy: 'Sarah M.' },
  { id: 'f4', name: 'Live Chat', key: 'live_chat', description: 'Real-time chat between customers and businesses for instant support', status: 'partial', rolloutPercent: 25, targetCountries: ['NG', 'KE'], updatedAt: '2026-07-10T16:00:00Z', updatedBy: 'Admin' },
  { id: 'f5', name: 'AI Recommendations', key: 'ai_recommendations', description: 'Machine learning-powered personalized venue and event suggestions', status: 'partial', rolloutPercent: 15, targetCountries: ['NG'], updatedAt: '2026-07-12T08:45:00Z', updatedBy: 'James K.' },
  { id: 'f6', name: 'Multi-Currency', key: 'multi_currency', description: 'Accept and display prices in local African currencies with live FX rates', status: 'enabled', rolloutPercent: 100, targetCountries: ['NG', 'KE', 'ZA', 'GH', 'CM', 'TZ', 'UG', 'RW', 'ET', 'SN', 'CI', 'EG', 'MA', 'DZ', 'MZ'], updatedAt: '2026-07-09T12:00:00Z', updatedBy: 'Sarah M.' },
  { id: 'f7', name: 'Crypto Payments', key: 'crypto_payments', description: 'Accept Bitcoin, Ethereum, and stablecoins (USDC/USDT) for ticket purchases', status: 'disabled', rolloutPercent: 0, targetCountries: [], updatedAt: '2026-07-08T11:30:00Z', updatedBy: 'Admin' },
  { id: 'f8', name: 'Loyalty Program', key: 'loyalty_program', description: 'Points-based loyalty system with rewards, badges, and tier progression', status: 'partial', rolloutPercent: 35, targetCountries: ['NG', 'KE', 'ZA', 'GH'], updatedAt: '2026-07-11T10:00:00Z', updatedBy: 'James K.' },
  { id: 'f9', name: 'Group Booking', key: 'group_booking', description: 'Bulk ticket purchasing with group discounts and shared payment options', status: 'enabled', rolloutPercent: 70, targetCountries: ['NG', 'KE', 'ZA', 'GH', 'CM', 'TZ', 'UG', 'RW', 'ET', 'SN'], updatedAt: '2026-07-10T13:45:00Z', updatedBy: 'Sarah M.' },
  { id: 'f10', name: 'Vendor Analytics', key: 'vendor_analytics', description: 'Advanced dashboard with revenue trends, customer demographics, and insights', status: 'partial', rolloutPercent: 50, targetCountries: ['NG', 'KE', 'ZA', 'GH', 'CM'], updatedAt: '2026-07-11T09:30:00Z', updatedBy: 'Admin' },
  { id: 'f11', name: 'Mobile App', key: 'mobile_app', description: 'Native iOS and Android application with push notifications and offline mode', status: 'enabled', rolloutPercent: 100, targetCountries: ['NG', 'KE', 'ZA', 'GH', 'CM', 'TZ', 'UG', 'RW', 'ET', 'SN', 'CI', 'EG', 'MA', 'DZ', 'MZ'], updatedAt: '2026-07-12T07:00:00Z', updatedBy: 'Sarah M.' },
  { id: 'f12', name: 'Push Notifications', key: 'push_notifications', description: 'Real-time push notifications for bookings, promotions, and event reminders', status: 'enabled', rolloutPercent: 95, targetCountries: ['NG', 'KE', 'ZA', 'GH', 'CM', 'TZ', 'UG', 'RW', 'ET', 'SN', 'CI', 'EG'], updatedAt: '2026-07-10T15:00:00Z', updatedBy: 'James K.' },
  { id: 'f13', name: 'Social Login', key: 'social_login', description: 'Sign in with Google, Facebook, Apple, and Twitter/X accounts', status: 'enabled', rolloutPercent: 100, targetCountries: ['NG', 'KE', 'ZA', 'GH', 'CM', 'TZ', 'UG', 'RW', 'ET', 'SN', 'CI', 'EG', 'MA', 'DZ', 'MZ'], updatedAt: '2026-07-09T14:00:00Z', updatedBy: 'Admin' },
  { id: 'f14', name: 'Referral System', key: 'referral_system', description: 'Referral codes with reward tracking, commission payouts, and leaderboard', status: 'partial', rolloutPercent: 60, targetCountries: ['NG', 'KE', 'ZA', 'GH', 'CM', 'TZ'], updatedAt: '2026-07-11T11:15:00Z', updatedBy: 'Sarah M.' },
  { id: 'f15', name: 'Delivery Tracking', key: 'delivery_tracking', description: 'Real-time GPS tracking for food and goods deliveries with ETA updates', status: 'partial', rolloutPercent: 30, targetCountries: ['NG', 'KE'], updatedAt: '2026-07-12T11:45:00Z', updatedBy: 'James K.' },
]

interface FlagLogEntry {
  id: string
  flagName: string
  action: string
  details: string
  admin: string
  timestamp: string
  type: 'status_change' | 'rollout_update' | 'country_update' | 'flag_created'
}

const FLAG_LOG: FlagLogEntry[] = [
  { id: 'fl1', flagName: 'events_v2', action: 'Rollout increased', details: 'Events v2 rollout increased from 25% to 40% in Kenya, Nigeria, South Africa', admin: 'Sarah M.', timestamp: '2026-07-12T09:15:00Z', type: 'rollout_update' },
  { id: 'fl2', flagName: 'ai_recommendations', action: 'Countries updated', details: 'AI Recommendations restricted to Nigeria only for beta testing', admin: 'James K.', timestamp: '2026-07-12T08:45:00Z', type: 'country_update' },
  { id: 'fl3', flagName: 'delivery_tracking', action: 'Rollout increased', details: 'Delivery Tracking rollout increased from 20% to 30% in Kenya and Nigeria', admin: 'James K.', timestamp: '2026-07-12T11:45:00Z', type: 'rollout_update' },
  { id: 'fl4', flagName: 'food_delivery', action: 'Rollout increased', details: 'Food Delivery rollout increased from 75% to 85% across 10 countries', admin: 'Sarah M.', timestamp: '2026-07-11T14:30:00Z', type: 'rollout_update' },
  { id: 'fl5', flagName: 'crypto_payments', action: 'Flag disabled', details: 'Crypto Payments disabled platform-wide due to regulatory review', admin: 'Admin', timestamp: '2026-07-08T11:30:00Z', type: 'status_change' },
  { id: 'fl6', flagName: 'loyalty_program', action: 'Countries updated', details: 'Loyalty Program expanded to include Ghana and Cameroon', admin: 'James K.', timestamp: '2026-07-11T10:00:00Z', type: 'country_update' },
  { id: 'fl7', flagName: 'live_chat', action: 'Rollout increased', details: 'Live Chat rollout increased from 15% to 25% in Kenya and Nigeria', admin: 'Admin', timestamp: '2026-07-10T16:00:00Z', type: 'rollout_update' },
  { id: 'fl8', flagName: 'referral_system', action: 'Rollout increased', details: 'Referral System rollout increased from 45% to 60% in 6 countries', admin: 'Sarah M.', timestamp: '2026-07-11T11:15:00Z', type: 'rollout_update' },
]

const LOG_COLORS: Record<FlagLogEntry['type'], string> = {
  status_change: 'bg-red-100 dark:bg-red-900/30 text-red-600',
  rollout_update: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  country_update: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  flag_created: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
}

const LOG_ICONS: Record<FlagLogEntry['type'], typeof Clock> = {
  status_change: ToggleLeft,
  rollout_update: Percent,
  country_update: MapPin,
  flag_created: Flag,
}

const STATUS_CONFIG: Record<FlagStatus, { label: string; bg: string; text: string; icon: typeof CheckCircle }> = {
  enabled: { label: 'Enabled', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle },
  disabled: { label: 'Disabled', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: EyeOff },
  partial: { label: 'Partial', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: AlertTriangle },
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>(INITIAL_FLAGS)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FlagStatus | 'all'>('all')
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const filteredFlags = useMemo(() => {
    return flags.filter((f) => {
      if (statusFilter !== 'all' && f.status !== statusFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return f.name.toLowerCase().includes(q) || f.key.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
      }
      return true
    })
  }, [flags, statusFilter, searchQuery])

  const enabledCount = flags.filter((f) => f.status === 'enabled').length
  const partialCount = flags.filter((f) => f.status === 'partial').length
  const disabledCount = flags.filter((f) => f.status === 'disabled').length

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const toggleFlag = (flagId: string) => {
    setFlags((prev) =>
      prev.map((f) => {
        if (f.id !== flagId) return f
        const nextStatus: FlagStatus = f.status === 'disabled' ? 'enabled' : f.status === 'enabled' ? 'disabled' : 'disabled'
        return { ...f, status: nextStatus, rolloutPercent: nextStatus === 'enabled' ? 100 : nextStatus === 'disabled' ? 0 : f.rolloutPercent }
      })
    )
    const flag = flags.find((f) => f.id === flagId)
    showToast(`"${flag?.name}" ${flag?.status === 'disabled' ? 'enabled' : 'disabled'}`)
  }

  const updateRollout = (flagId: string, percent: number) => {
    setFlags((prev) =>
      prev.map((f) => {
        if (f.id !== flagId) return f
        const newStatus: FlagStatus = percent === 0 ? 'disabled' : percent === 100 ? 'enabled' : 'partial'
        return { ...f, rolloutPercent: percent, status: newStatus }
      })
    )
  }

  const toggleCountry = (flagId: string, countryCode: string) => {
    setFlags((prev) =>
      prev.map((f) => {
        if (f.id !== flagId) return f
        const hasCountry = f.targetCountries.includes(codeToCountryCode(countryCode))
        return {
          ...f,
          targetCountries: hasCountry
            ? f.targetCountries.filter((c) => c !== countryCode)
            : [...f.targetCountries, countryCode],
        }
      })
    )
  }

  function codeToCountryCode(code: string) {
    return code
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Feature Flags</h1>
        <p className="text-sm text-text-secondary mt-1">Control feature rollouts, targeting, and A/B experiments across the platform.</p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Total Flags" value={flags.length.toString()} icon={Flag} accent="bg-amber-500" />
        <AdminStatCard label="Enabled" value={enabledCount.toString()} icon={CheckCircle} accent="bg-emerald-500" />
        <AdminStatCard label="Partial Rollout" value={partialCount.toString()} icon={AlertTriangle} accent="bg-blue-500" />
        <AdminStatCard label="Disabled" value={disabledCount.toString()} icon={EyeOff} accent="bg-red-500" />
      </motion.div>

      {/* Flags table */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">Feature Flags</h3>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search flags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as FlagStatus | 'all')}
                  className="appearance-none px-3 py-2 pr-8 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="enabled">Enabled</option>
                  <option value="partial">Partial</option>
                  <option value="disabled">Disabled</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium">Flag</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium">Key</th>
                <th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-text-tertiary font-medium">Status</th>
                <th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-text-tertiary font-medium w-48">Rollout</th>
                <th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-text-tertiary font-medium">Countries</th>
                <th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-text-tertiary font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlags.map((flag) => {
                const statusCfg = STATUS_CONFIG[flag.status]
                const StatusIcon = statusCfg.icon
                const isExpanded = expandedFlag === flag.id
                return (
                  <>
                    <tr key={flag.id} className="border-b border-border-light hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-sm font-semibold text-text-primary">{flag.name}</span>
                          <br />
                          <span className="text-[11px] text-text-tertiary line-clamp-1">{flag.description}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono px-2 py-1 rounded-md bg-surface-secondary text-text-secondary">{flag.key}</code>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold', statusCfg.bg, statusCfg.text)}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={flag.rolloutPercent}
                            onChange={(e) => updateRollout(flag.id, Number(e.target.value))}
                            className="flex-1 h-1.5 rounded-full appearance-none bg-surface-secondary cursor-pointer accent-amber-500"
                          />
                          <span className="text-xs font-mono font-semibold text-text-primary w-10 text-right">{flag.rolloutPercent}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setExpandedFlag(isExpanded ? null : flag.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-secondary border border-border text-xs text-text-secondary hover:text-text-primary transition-colors"
                        >
                          <Globe className="w-3 h-3" />
                          {flag.targetCountries.length}
                          <ChevronDown className={cn('w-3 h-3 transition-transform', isExpanded && 'rotate-180')} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => toggleFlag(flag.id)}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              flag.status === 'disabled'
                                ? 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600'
                                : 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600'
                            )}
                            title={flag.status === 'disabled' ? 'Enable' : 'Disable'}
                          >
                            {flag.status === 'disabled' ? <ToggleLeft className="w-5 h-5" /> : <ToggleRight className="w-5 h-5" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded country targeting */}
                    <AnimatePresence>
                      {isExpanded && (
                        <tr key={`${flag.id}-expanded`}>
                          <td colSpan={6} className="p-0">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 py-4 bg-surface-secondary/30 border-b border-border">
                                <p className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-1.5">
                                  <Target className="w-3.5 h-3.5 text-amber-500" />
                                  Country Targeting — {flag.name}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {AFRICAN_COUNTRIES.map((country) => {
                                    const isActive = flag.targetCountries.includes(country.code)
                                    return (
                                      <button
                                        key={country.code}
                                        onClick={() => toggleCountry(flag.id, country.code)}
                                        className={cn(
                                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                                          isActive
                                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                            : 'bg-surface border-border text-text-tertiary hover:text-text-secondary hover:border-text-tertiary'
                                        )}
                                      >
                                        {isActive && <Check className="w-3 h-3" />}
                                        {country.name}
                                      </button>
                                    )
                                  })}
                                </div>
                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                                  <span className="text-[11px] text-text-tertiary">
                                    {flag.targetCountries.length} of {AFRICAN_COUNTRIES.length} countries targeted
                                  </span>
                                  <span className="text-[11px] text-text-tertiary">·</span>
                                  <span className="text-[11px] text-text-tertiary">
                                    Updated {new Date(flag.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} by {flag.updatedBy}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredFlags.length === 0 && (
          <div className="p-12 text-center">
            <Flag className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-secondary">No feature flags match your filters</p>
          </div>
        )}
      </motion.div>

      {/* Activity log */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary font-heading">Recent Flag Changes</h3>
          <Activity className="w-4 h-4 text-text-tertiary" />
        </div>
        <div className="space-y-3">
          {FLAG_LOG.map((entry) => {
            const Icon = LOG_ICONS[entry.type]
            return (
              <div key={entry.id} className="flex gap-3 items-start">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', LOG_COLORS[entry.type])}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">
                    <span className="font-semibold">{entry.flagName}</span>
                    <span className="text-text-tertiary mx-1">·</span>
                    <span className="text-text-secondary">{entry.action}</span>
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">{entry.details}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-text-tertiary">{entry.admin}</span>
                    <span className="text-[10px] text-text-tertiary">·</span>
                    <span className="text-[10px] text-text-tertiary">
                      {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
              toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            )}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
