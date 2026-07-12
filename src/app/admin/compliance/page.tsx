'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Shield, AlertTriangle, ClipboardCheck, Search,
  ChevronRight, Users, Truck, Store, Filter,
  CheckCircle, XCircle, Clock, ArrowUpDown,
} from 'lucide-react'
import type { ComplianceViolation, ComplianceScorecard } from '@/types/pickup-security'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

const MOCK_VIOLATIONS: ComplianceViolation[] = [
  {
    id: 'v1', subjectType: 'driver', subjectId: 'd1', violationType: 'late_delivery',
    orderId: 'o1', description: 'Delivery arrived 45 minutes late', severity: 'medium',
    status: 'open', scorePenalty: 5, evidenceUrls: [], createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z',
  },
  {
    id: 'v2', subjectType: 'driver', subjectId: 'd2', violationType: 'missing_item',
    orderId: 'o2', description: 'Customer reported missing item from order', severity: 'high',
    status: 'investigating', scorePenalty: 15, evidenceUrls: [], createdAt: '2024-06-14T14:00:00Z',
    updatedAt: '2024-06-14T14:00:00Z',
  },
  {
    id: 'v3', subjectType: 'vendor', subjectId: 'b1', violationType: 'safety_protocol_violation',
    orderId: 'o3', description: 'Food packaging not sealed properly', severity: 'critical',
    status: 'open', scorePenalty: 30, evidenceUrls: [], createdAt: '2024-06-13T09:00:00Z',
    updatedAt: '2024-06-13T09:00:00Z',
  },
]

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const STATUS_ICONS: Record<string, typeof AlertTriangle> = {
  open: AlertTriangle,
  investigating: Clock,
  resolved: CheckCircle,
  dismissed: XCircle,
  appealed: AlertTriangle,
}

export default function ComplianceDashboardPage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  const filtered = MOCK_VIOLATIONS.filter((v) => {
    if (filterType !== 'all' && v.subjectType !== filterType) return false
    if (search && !v.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <motion.div variants={ITEM} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary font-heading">Compliance Dashboard</h1>
            <p className="text-xs text-text-secondary">Monitor violations, scorecards, and theft prevention</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/compliance/theft"
            className="px-4 py-2 rounded-xl bg-surface border border-border text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
          >
            Theft Log
          </Link>
        </div>
      </motion.div>

      {/* Stats overview */}
      <motion.div variants={ITEM} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Open Violations', value: '12', icon: AlertTriangle, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
          { label: 'Investigating', value: '4', icon: Clock, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
          { label: 'Drivers on Probation', value: '3', icon: Users, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
          { label: 'Avg Compliance', value: '87%', icon: ClipboardCheck, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-surface border border-border p-4">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', stat.color)}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-text-primary">{stat.value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Subject type filter */}
      <motion.div variants={ITEM} className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All', icon: Filter },
          { key: 'driver', label: 'Drivers', icon: Truck },
          { key: 'vendor', label: 'Vendors', icon: Store },
          { key: 'business', label: 'Businesses', icon: Store },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
              filterType === f.key
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary',
            )}
          >
            <f.icon className="w-4 h-4" />
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div variants={ITEM} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search violations..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-amber-500 transition-colors"
        />
      </motion.div>

      {/* Violations list */}
      <motion.div variants={ITEM} className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-text-primary">Recent Violations</h2>
          <Link
            href="/admin/compliance/violations"
            className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary text-sm">No violations found</div>
        ) : (
          filtered.map((violation) => {
            const StatusIcon = STATUS_ICONS[violation.status] ?? AlertTriangle
            return (
              <div
                key={violation.id}
                className="rounded-2xl bg-surface border border-border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    violation.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30' :
                    violation.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900/30' :
                    'bg-amber-100 dark:bg-amber-900/30',
                  )}>
                    <StatusIcon className={cn(
                      'w-5 h-5',
                      violation.severity === 'critical' ? 'text-red-600' :
                      violation.severity === 'high' ? 'text-orange-600' :
                      'text-amber-600',
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-text-primary capitalize">
                        {violation.violationType.replace(/_/g, ' ')}
                      </span>
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-semibold',
                        SEVERITY_COLORS[violation.severity],
                      )}>
                        {violation.severity}
                      </span>
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-semibold capitalize',
                        violation.status === 'open' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        violation.status === 'investigating' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
                      )}>
                        {violation.status}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">{violation.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-text-tertiary">
                      <span className="capitalize">{violation.subjectType}</span>
                      <span>-{violation.scorePenalty} points</span>
                      <span>{new Date(violation.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0 mt-2" />
                </div>
              </div>
            )
          })
        )}
      </motion.div>
    </motion.div>
  )
}
