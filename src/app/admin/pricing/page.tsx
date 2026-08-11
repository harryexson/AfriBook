'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId, type SubscriptionPlanConfig } from '@/types/events'
import AdminStatCard from '@/components/admin/StatCard'
import {
  Users, DollarSign, TrendingUp, Calendar, AlertTriangle,
  ArrowUpRight, Pencil, X, Check, Crown,
  Activity, Clock, Zap, BarChart3,
} from 'lucide-react'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

const PLAN_SUBSCRIBERS: Record<SubscriptionPlanId, number> = {
  free: 12400,
  starter: 3200,
  professional: 890,
  enterprise: 45,
}

const PLAN_REVENUE: Record<SubscriptionPlanId, number> = {
  free: 0,
  starter: 92800,
  professional: 88110,
  enterprise: 22455,
}

const PLAN_COLORS: Record<SubscriptionPlanId, string> = {
  free: 'bg-slate-100 dark:bg-slate-800',
  starter: 'bg-blue-100 dark:bg-blue-900/30',
  professional: 'bg-amber-100 dark:bg-amber-900/30',
  enterprise: 'bg-purple-100 dark:bg-purple-900/30',
}

const PLAN_ACCENT: Record<SubscriptionPlanId, string> = {
  free: 'text-slate-600 dark:text-slate-400',
  starter: 'text-blue-600 dark:text-blue-400',
  professional: 'text-amber-600 dark:text-amber-400',
  enterprise: 'text-purple-600 dark:text-purple-400',
}

interface ActivityLogEntry {
  id: string
  action: string
  details: string
  admin: string
  timestamp: string
  type: 'price_change' | 'feature_toggle' | 'plan_edit' | 'limit_update'
}

const ACTIVITY_LOG: ActivityLogEntry[] = [
  { id: 'a1', action: 'Price updated', details: 'Starter monthly price changed from $25 to $29', admin: 'Sarah M.', timestamp: '2026-07-12T14:30:00Z', type: 'price_change' },
  { id: 'a2', action: 'Feature enabled', details: 'Loyalty program enabled for Professional plan', admin: 'James K.', timestamp: '2026-07-12T11:15:00Z', type: 'feature_toggle' },
  { id: 'a3', action: 'Plan limits updated', details: 'Enterprise max tickets changed from 50K to unlimited', admin: 'Sarah M.', timestamp: '2026-07-11T16:45:00Z', type: 'limit_update' },
  { id: 'a4', action: 'Fee adjusted', details: 'Professional fee percent reduced from 5% to 4%', admin: 'Admin', timestamp: '2026-07-11T09:20:00Z', type: 'price_change' },
  { id: 'a5', action: 'Feature disabled', details: 'Crypto payments removed from Starter plan', admin: 'James K.', timestamp: '2026-07-10T13:00:00Z', type: 'feature_toggle' },
  { id: 'a6', action: 'Plan edited', details: 'Free plan max events increased from 2 to 3', admin: 'Sarah M.', timestamp: '2026-07-10T10:30:00Z', type: 'plan_edit' },
  { id: 'a7', action: 'Price updated', details: 'Enterprise yearly price changed from $4,500 to $4,990', admin: 'Admin', timestamp: '2026-07-09T15:00:00Z', type: 'price_change' },
  { id: 'a8', action: 'Feature toggled', details: 'Multi-currency support enabled across all paid plans', admin: 'James K.', timestamp: '2026-07-09T08:45:00Z', type: 'feature_toggle' },
]

const ACTIVITY_ICONS: Record<ActivityLogEntry['type'], typeof Clock> = {
  price_change: DollarSign,
  feature_toggle: Zap,
  plan_edit: Pencil,
  limit_update: BarChart3,
}

const ACTIVITY_COLORS: Record<ActivityLogEntry['type'], string> = {
  price_change: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
  feature_toggle: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  plan_edit: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  limit_update: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
}

export default function AdminPricingPage() {
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanId | null>(null)
  const [editForm, setEditForm] = useState<SubscriptionPlanConfig | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const planIds = Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlanId[]
  const totalSubscribers = useMemo(() => planIds.reduce((sum, id) => sum + PLAN_SUBSCRIBERS[id], 0), [planIds])
  const mrr = useMemo(() => planIds.reduce((sum, id) => sum + PLAN_REVENUE[id], 0), [planIds])
  const arr = mrr * 12

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const openEdit = (planId: SubscriptionPlanId) => {
    setEditingPlan(planId)
    setEditForm({ ...SUBSCRIPTION_PLANS[planId] })
  }

  const closeEdit = () => {
    setEditingPlan(null)
    setEditForm(null)
  }

  const saveEdit = () => {
    showToast(`Plan "${editingPlan}" updated successfully`)
    closeEdit()
  }

  const formatLimit = (value: number) => value === -1 ? 'Unlimited' : value.toLocaleString()

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Pricing & Subscriptions</h1>
        <p className="text-sm text-text-secondary mt-1">Manage subscription plans, pricing, and feature access across the platform.</p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <AdminStatCard label="Total Subscribers" value={totalSubscribers.toLocaleString()} icon={Users} change={8.2} changeLabel="vs last month" accent="bg-blue-500" />
        <AdminStatCard label="MRR" value={formatCurrency(mrr, 'USD')} icon={DollarSign} change={12.5} changeLabel="vs last month" accent="bg-emerald-500" />
        <AdminStatCard label="ARR" value={formatCurrency(arr, 'USD')} icon={TrendingUp} change={15.3} changeLabel="projected" accent="bg-amber-500" />
        <AdminStatCard label="Active Trials" value="342" icon={Calendar} change={-3.1} changeLabel="vs last month" accent="bg-purple-500" />
        <AdminStatCard label="Churn Rate" value="2.4%" icon={AlertTriangle} change={-0.8} changeLabel="vs last month" accent="bg-red-500" />
        <AdminStatCard label="Upgrade Rate" value="11.7%" icon={ArrowUpRight} change={2.4} changeLabel="vs last month" accent="bg-cyan-500" />
      </motion.div>

      {/* Plan comparison table */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary font-heading">Plan Comparison</h3>
              <p className="text-sm text-text-secondary mt-0.5">Overview of all subscription tiers and their configurations</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-text-tertiary font-medium w-40">Plan</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Monthly</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Yearly</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Fee %</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Fee Fixed</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Max Events</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Max Tickets</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Subscribers</th>
                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Revenue</th>
                <th className="px-4 py-3 text-center text-xs uppercase tracking-wider text-text-tertiary font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {planIds.map((planId) => {
                const plan = SUBSCRIPTION_PLANS[planId]
                return (
                  <tr key={planId} className="border-b border-border-light hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', PLAN_COLORS[planId])}>
                          {planId === 'enterprise' ? <Crown className={cn('w-4 h-4', PLAN_ACCENT[planId])} /> :
                           planId === 'professional' ? <Zap className={cn('w-4 h-4', PLAN_ACCENT[planId])} /> :
                           planId === 'starter' ? <TrendingUp className={cn('w-4 h-4', PLAN_ACCENT[planId])} /> :
                           <Users className={cn('w-4 h-4', PLAN_ACCENT[planId])} />}
                        </div>
                        <div>
                          <span className="font-semibold text-text-primary">{plan.name}</span>
                          {planId === 'professional' && (
                            <span className="ml-1.5 inline-flex px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-[10px] font-semibold text-amber-700 dark:text-amber-400">Popular</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-text-primary">
                      {plan.monthlyPrice === 0 ? 'Free' : formatCurrency(plan.monthlyPrice, 'USD')}
                    </td>
                    <td className="px-4 py-3 text-right text-text-secondary">
                      {plan.yearlyPrice === 0 ? 'Free' : formatCurrency(plan.yearlyPrice, 'USD')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-text-secondary">{plan.feePercent}%</td>
                    <td className="px-4 py-3 text-right font-mono text-text-secondary">{formatCurrency(plan.feeFixed, 'USD')}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">{formatLimit(plan.maxEvents)}</td>
                    <td className="px-4 py-3 text-right text-text-secondary">{formatLimit(plan.maxTicketsPerEvent)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-text-primary">{PLAN_SUBSCRIBERS[planId].toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {PLAN_REVENUE[planId] > 0 ? formatCurrency(PLAN_REVENUE[planId], 'USD') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openEdit(planId)}
                        className="p-1.5 rounded-lg hover:bg-surface-secondary text-text-tertiary hover:text-amber-500 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Features per plan + Activity log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Features breakdown */}
        <motion.div variants={ITEM} className="lg:col-span-2 rounded-2xl bg-surface border border-border p-6">
          <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Features by Plan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {planIds.map((planId) => {
              const plan = SUBSCRIPTION_PLANS[planId]
              return (
                <div key={planId} className="rounded-xl bg-surface-secondary border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', PLAN_COLORS[planId])}>
                      <span className={cn('text-xs font-bold', PLAN_ACCENT[planId])}>{plan.name[0]}</span>
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{plan.name}</span>
                    <span className="text-xs text-text-tertiary ml-auto">
                      {plan.monthlyPrice === 0 ? 'Free' : `${formatCurrency(plan.monthlyPrice, 'USD')}/mo`}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-text-secondary">
                        <Check className="h-3 w-3 mt-0.5 text-emerald-500 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Activity log */}
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">Recent Changes</h3>
            <Activity className="w-4 h-4 text-text-tertiary" />
          </div>
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {ACTIVITY_LOG.map((entry) => {
              const Icon = ACTIVITY_ICONS[entry.type]
              return (
                <div key={entry.id} className="flex gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', ACTIVITY_COLORS[entry.type])}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{entry.action}</p>
                    <p className="text-xs text-text-tertiary mt-0.5 truncate">{entry.details}</p>
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
      </div>

      {/* Edit plan modal */}
      <AnimatePresence>
        {editingPlan && editForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={closeEdit}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-[5%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50 focus:outline-none"
            >
              <div className="rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', PLAN_COLORS[editingPlan])}>
                      <Pencil className={cn('w-5 h-5', PLAN_ACCENT[editingPlan])} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">Edit {editForm.name} Plan</h3>
                      <p className="text-xs text-text-tertiary">Modify pricing, limits, and features</p>
                    </div>
                  </div>
                  <button onClick={closeEdit} className="p-2 rounded-lg hover:bg-surface-secondary text-text-tertiary transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {/* Pricing */}
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Pricing</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-text-tertiary mb-1">Monthly Price ($)</label>
                        <input
                          type="number"
                          value={editForm.monthlyPrice}
                          onChange={(e) => setEditForm({ ...editForm, monthlyPrice: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-tertiary mb-1">Yearly Price ($)</label>
                        <input
                          type="number"
                          value={editForm.yearlyPrice}
                          onChange={(e) => setEditForm({ ...editForm, yearlyPrice: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fees */}
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Platform Fees</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-text-tertiary mb-1">Fee Percentage (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.feePercent}
                          onChange={(e) => setEditForm({ ...editForm, feePercent: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-tertiary mb-1">Fixed Fee ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.feeFixed}
                          onChange={(e) => setEditForm({ ...editForm, feeFixed: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Limits */}
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Limits</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-text-tertiary mb-1">Max Events (-1 = unlimited)</label>
                        <input
                          type="number"
                          value={editForm.maxEvents}
                          onChange={(e) => setEditForm({ ...editForm, maxEvents: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-tertiary mb-1">Max Tickets/Event (-1 = unlimited)</label>
                        <input
                          type="number"
                          value={editForm.maxTicketsPerEvent}
                          onChange={(e) => setEditForm({ ...editForm, maxTicketsPerEvent: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-3">Features</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {editForm.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => {
                              const updated = [...editForm.features]
                              updated[idx] = e.target.value
                              setEditForm({ ...editForm, features: updated })
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          />
                          <button
                            onClick={() => {
                              const updated = editForm.features.filter((_, i) => i !== idx)
                              setEditForm({ ...editForm, features: updated })
                            }}
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-text-tertiary hover:text-red-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setEditForm({ ...editForm, features: [...editForm.features, 'New feature'] })}
                      className="mt-2 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      + Add feature
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                  <button
                    onClick={closeEdit}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
