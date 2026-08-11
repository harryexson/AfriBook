'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatDate, timeAgo } from '@/lib/utils'
import type { AuditLog, UserRole } from '@/types'
import {
  Search, Clock,
  Shield, User, Building2, CreditCard, Settings,
  Globe, AlertTriangle,
} from 'lucide-react'

interface AuditLogViewerProps {
  logs?: AuditLog[]
  loading?: boolean
}

const ACTION_ICONS: Record<string, typeof Shield> = {
  user: User,
  business: Building2,
  payment: CreditCard,
  setting: Settings,
  country: Globe,
  dispute: AlertTriangle,
  default: Shield,
}

const MOCK_LOGS: AuditLog[] = Array.from({ length: 50 }, (_, i) => ({
  id: `log_${i + 1}`,
  actorId: i % 2 === 0 ? 'admin_1' : 'admin_2',
  actorRole: (['super_admin', 'admin', 'moderator', 'finance'] as UserRole[])[i % 4],
  action: ['user.suspend', 'business.verify', 'payment.refund', 'settings.update', 'country.edit', 'dispute.resolve', 'user.impersonate', 'kyc.approve'][i % 8],
  resource: ['user', 'business', 'payment', 'setting', 'country', 'dispute', 'kyc'][i % 7],
  resourceId: `res_${Math.floor(i / 2)}`,
  before: {},
  after: {},
  ipAddress: `192.168.${Math.floor(i / 10)}.${i}`,
  userAgent: 'Mozilla/5.0',
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
}))

export default function AuditLogViewer({ logs, loading }: AuditLogViewerProps) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const perPage = 15

  const data = logs ?? MOCK_LOGS
  const actions = [...new Set(data.map((l) => l.action))]

  const filtered = data.filter((l) => {
    if (actionFilter !== 'all' && l.action !== actionFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return l.actorId.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.resourceId.toLowerCase().includes(q)
    }
    return true
  })

  const paged = filtered.slice(page * perPage, (page + 1) * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  if (loading) {
    return <div className="rounded-2xl bg-surface border border-border p-6 animate-pulse space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="w-8 h-8 rounded-lg bg-surface-secondary" />
          <div className="flex-1"><div className="w-48 h-3 rounded bg-surface-secondary mb-1" /><div className="w-24 h-3 rounded bg-surface-secondary" /></div>
        </div>
      ))}
    </div>
  }

  return (
    <div className="rounded-2xl bg-surface border border-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-border">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input type="text" placeholder="Search audit logs..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
          </div>
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(0) }}
            className="px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30">
            <option value="all">All Actions</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <Clock className="w-3.5 h-3.5" />
          {filtered.length} entries
        </div>
      </div>

      <div className="divide-y divide-border-light">
        {paged.length === 0 ? (
          <div className="px-4 py-16 text-center text-text-tertiary">
            <Search className="w-8 h-8 mx-auto mb-2" /><p>No audit logs found</p>
          </div>
        ) : (
          paged.map((log) => {
            const Icon = ACTION_ICONS[log.resource] ?? ACTION_ICONS.default
            const isExpanded = expandedId === log.id
            return (
              <div key={log.id}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="flex items-start gap-3 p-4 hover:bg-surface-secondary transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-text-tertiary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-text-primary">{log.action.replace('.', ' / ')}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-tertiary text-text-tertiary font-mono">{log.actorRole}</span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      by <span className="font-medium text-text-secondary">{log.actorId}</span>
                      {' on '}<span className="font-mono">{log.resourceId.slice(0, 12)}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-text-tertiary">{timeAgo(log.createdAt)}</p>
                    <p className="text-[10px] text-text-tertiary mt-0.5">{formatDate(log.createdAt, 'MMM d, HH:mm')}</p>
                  </div>
                </div>

                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    className="overflow-hidden bg-surface-secondary">
                    <div className="px-4 pb-4 pt-2 space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-surface"><span className="text-text-tertiary">Actor: </span><span className="text-text-primary">{log.actorId}</span></div>
                        <div className="p-2 rounded-lg bg-surface"><span className="text-text-tertiary">Role: </span><span className="text-text-primary">{log.actorRole}</span></div>
                        <div className="p-2 rounded-lg bg-surface"><span className="text-text-tertiary">Resource: </span><span className="text-text-primary">{log.resource}</span></div>
                        <div className="p-2 rounded-lg bg-surface"><span className="text-text-tertiary">Resource ID: </span><span className="text-text-primary font-mono">{log.resourceId}</span></div>
                        {log.ipAddress && <div className="p-2 rounded-lg bg-surface"><span className="text-text-tertiary">IP: </span><span className="text-text-primary font-mono">{log.ipAddress}</span></div>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-text-tertiary">{filtered.length} total entries</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={cn('w-7 h-7 rounded-lg text-xs font-medium transition-colors', page === i ? 'bg-amber-500 text-white' : 'text-text-secondary hover:bg-surface-secondary')}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
