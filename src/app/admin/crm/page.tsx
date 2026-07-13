'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import AdminStatCard from '@/components/admin/StatCard'
import {
  Users, UserCheck, UserPlus, DollarSign, TrendingDown, Star,
  Download, Plus, Send, ChevronRight, Activity, AlertTriangle,
  Crown, Sparkles, Clock, ShoppingCart, Mail,
} from 'lucide-react'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

const SEGMENTS = [
  { name: 'VIP', description: 'Top 5% by lifetime value', count: 7028, color: 'bg-amber-500', icon: Crown, change: 3.2 },
  { name: 'High Value', description: '>$500 lifetime value', count: 14055, color: 'bg-emerald-500', icon: Star, change: 8.1 },
  { name: 'At Risk', description: 'No activity in 21+ days', count: 8433, color: 'bg-red-500', icon: AlertTriangle, change: -2.4 },
  { name: 'New', description: 'Joined within 30 days', count: 5622, color: 'bg-blue-500', icon: Sparkles, change: 15.3 },
  { name: 'Dormant', description: 'Inactive 60+ days', count: 3162, color: 'bg-text-tertiary', icon: Clock, change: -5.7 },
]

const ACTIVITY_FEED = [
  { id: '1', customer: 'Amina Diallo', action: 'placed an order', detail: 'Savannah Grille — Dinner for 2', time: '2 minutes ago', type: 'order' as const },
  { id: '2', customer: 'Kwame Asante', action: 'left a review', detail: '5 stars — "Absolutely amazing service!"', time: '8 minutes ago', type: 'review' as const },
  { id: '3', customer: 'Sarah O\'Brien', action: 'submitted a support ticket', detail: '#TKT-4821 — Billing inquiry', time: '15 minutes ago', type: 'support' as const },
  { id: '4', customer: 'Chidi Okafor', action: 'upgraded to Pro plan', detail: 'Monthly subscription — $29.99/mo', time: '22 minutes ago', type: 'upgrade' as const },
  { id: '5', customer: 'Fatima Hassan', action: 'referred a friend', detail: 'Referral code: FATI2024 — 3 new signups', time: '34 minutes ago', type: 'referral' as const },
  { id: '6', customer: 'James Mwangi', action: 'cancelled subscription', detail: 'Reason: Too expensive', time: '1 hour ago', type: 'churn' as const },
  { id: '7', customer: 'Ngozi Eze', action: 'placed an order', detail: 'Lagos Hair Studio — Full treatment', time: '1 hour ago', type: 'order' as const },
  { id: '8', customer: 'Ethan Brooks', action: 'verified email', detail: 'Account fully activated', time: '2 hours ago', type: 'signup' as const },
  { id: '9', customer: 'Aisha Mohammed', action: 'requested a refund', detail: '$45.00 — Order #ORD-7823', time: '3 hours ago', type: 'support' as const },
  { id: '10', customer: 'Tendai Moyo', action: 'placed an order', detail: 'Harare Fitness — Monthly pass', time: '4 hours ago', type: 'order' as const },
]

const ACTIVITY_ICONS: Record<string, typeof Users> = {
  order: ShoppingCart,
  review: Star,
  support: Mail,
  upgrade: TrendingDown,
  referral: Send,
  churn: AlertTriangle,
  signup: UserPlus,
}

const ACTIVITY_COLORS: Record<string, string> = {
  order: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  support: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  upgrade: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  referral: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  churn: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  signup: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
}

export default function AdminCRMPage() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Customer Relationship Management</h1>
        <p className="text-sm text-text-secondary mt-1">Monitor customer health, segments, and engagement across the platform.</p>
      </motion.div>

      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <AdminStatCard label="Total Customers" value="140,547" icon={Users} change={12.5} accent="bg-amber-500" />
        <AdminStatCard label="Active (30d)" value="98,383" icon={UserCheck} change={8.2} accent="bg-emerald-500" />
        <AdminStatCard label="New This Month" value="5,622" icon={UserPlus} change={15.3} accent="bg-blue-500" />
        <AdminStatCard label="Avg CLV" value="$347.80" icon={DollarSign} change={6.1} accent="bg-purple-500" />
        <AdminStatCard label="Churn Rate" value="3.2%" icon={TrendingDown} change={-0.8} accent="bg-red-500" />
        <AdminStatCard label="NPS Score" value="72" icon={Star} change={4.5} accent="bg-cyan-500" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={ITEM} className="lg:col-span-2 rounded-2xl bg-surface border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">Customer Segments</h3>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              <Plus className="w-4 h-4" /> Create Segment
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Segment</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Description</th>
                  <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Customers</th>
                  <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Trend</th>
                  <th className="text-right text-xs font-medium text-text-secondary uppercase tracking-wider pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {SEGMENTS.map((seg) => {
                  const Icon = seg.icon
                  return (
                    <tr key={seg.name} className="hover:bg-surface-secondary/50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', seg.color)}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-text-primary">{seg.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-sm text-text-secondary">{seg.description}</td>
                      <td className="py-3 pr-4 text-right text-sm font-semibold text-text-primary">{seg.count.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-right">
                        <span className={cn('text-xs font-semibold', seg.change >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                          {seg.change >= 0 ? '+' : ''}{seg.change}%
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button className="text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors inline-flex items-center gap-1">
                          View <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary font-heading">Recent Activity</h3>
            <Activity className="w-4 h-4 text-text-tertiary" />
          </div>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {ACTIVITY_FEED.map((item) => {
              const Icon = ACTIVITY_ICONS[item.type] || Users
              return (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-surface-secondary/50 hover:bg-surface-secondary transition-colors">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', ACTIVITY_COLORS[item.type])}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary">
                      <span className="font-medium">{item.customer}</span>{' '}
                      <span className="text-text-secondary">{item.action}</span>
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5 truncate">{item.detail}</p>
                    <p className="text-xs text-text-tertiary mt-1">{item.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <h3 className="text-lg font-semibold text-text-primary font-heading mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => showToast('Export started — check your email for the download link.')}
            className="flex items-center gap-3 p-4 rounded-xl bg-surface-secondary border border-border hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
              <Download className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-text-primary">Export Contacts</p>
              <p className="text-xs text-text-tertiary">Download CSV of all customers</p>
            </div>
          </button>
          <button
            onClick={() => showToast('Segment builder opened.')}
            className="flex items-center gap-3 p-4 rounded-xl bg-surface-secondary border border-border hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
              <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-text-primary">Create Segment</p>
              <p className="text-xs text-text-tertiary">Build a new customer segment</p>
            </div>
          </button>
          <button
            onClick={() => showToast('Campaign editor opened.')}
            className="flex items-center gap-3 p-4 rounded-xl bg-surface-secondary border border-border hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-text-primary">Send Campaign</p>
              <p className="text-xs text-text-tertiary">Launch email or push campaign</p>
            </div>
          </button>
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
