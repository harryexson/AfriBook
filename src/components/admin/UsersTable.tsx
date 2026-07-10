'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatDate, timeAgo } from '@/lib/utils'
import type { User, UserRole } from '@/types'
import {
  Search, ChevronDown, Eye, Shield, Ban,
  CheckCircle, XCircle, Download, MoreHorizontal,
  Mail, Phone, Calendar, Clock, ExternalLink,
} from 'lucide-react'

type SortField = 'name' | 'email' | 'role' | 'countryCode' | 'createdAt' | 'lastLoginAt'
type SortDir = 'asc' | 'desc'

interface UsersTableProps {
  users?: User[]
  loading?: boolean
  onImpersonate?: (user: User) => void
  onSuspend?: (user: User) => void
  onVerify?: (user: User) => void
  onViewDetails?: (user: User) => void
}

const ROLE_BADGES: Record<UserRole, string> = {
  customer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  vendor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  driver: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  super_admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const MOCK_USERS: User[] = Array.from({ length: 25 }, (_, i) => ({
  id: `user_${i + 1}`,
  email: `user${i + 1}@example.com`,
  phone: `+237670000${String(i + 1).padStart(2, '0')}`,
  name: ['Alice M.', 'Bob K.', 'Carol D.', 'David N.', 'Eve T.', 'Frank W.', 'Grace L.', 'Henry O.', 'Ivy P.', 'Jack R.'][i % 10],
  role: (['customer', 'vendor', 'admin', 'driver'] as UserRole[])[i % 4],
  countryCode: ['CM', 'NG', 'KE', 'ZA', 'GH', 'TZ', 'RW', 'UG'][i % 8],
  languageCode: 'en',
  emailVerified: i % 5 !== 0,
  phoneVerified: i % 3 !== 0,
  twoFactorEnabled: i % 7 === 0,
  isActive: i % 8 !== 3,
  metadata: {},
  createdAt: new Date(Date.now() - Math.random() * 365 * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
  lastLoginAt: i % 4 !== 0 ? new Date(Date.now() - Math.random() * 30 * 86400000).toISOString() : undefined,
}))

export default function UsersTable({
  users, loading, onImpersonate, onSuspend, onVerify, onViewDetails,
}: UsersTableProps) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [page, setPage] = useState(0)
  const perPage = 10

  const data = users ?? MOCK_USERS

  const filtered = data
    .filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q)
      }
      return true
    })
    .sort((a, b) => {
      const aVal = a[sortField] ?? ''
      const bVal = b[sortField] ?? ''
      const cmp = String(aVal).localeCompare(String(bVal))
      return sortDir === 'asc' ? cmp : -cmp
    })

  const paged = filtered.slice(page * perPage, (page + 1) * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-surface border border-border p-6 animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-40 h-6 rounded bg-surface-secondary" />
          <div className="w-48 h-9 rounded-lg bg-surface-secondary" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-border-light">
            <div className="w-8 h-8 rounded-full bg-surface-secondary" />
            <div className="flex-1">
              <div className="w-32 h-4 rounded bg-surface-secondary mb-1" />
              <div className="w-24 h-3 rounded bg-surface-secondary" />
            </div>
            <div className="w-16 h-6 rounded-full bg-surface-secondary" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-surface border border-border">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-border">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value as UserRole | 'all'); setPage(0) }}
            className="px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
            <option value="driver">Driver</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {(['name', 'email', 'role', 'countryCode', 'createdAt', 'lastLoginAt'] as SortField[]).map((field) => (
                <th
                  key={field}
                  onClick={() => toggleSort(field)}
                  className={cn(
                    'px-4 py-3 text-left font-medium text-text-tertiary cursor-pointer hover:text-text-secondary transition-colors',
                    sortField === field && 'text-amber-600'
                  )}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs uppercase tracking-wider">{field === 'createdAt' ? 'Joined' : field === 'lastLoginAt' ? 'Last Login' : field}</span>
                    {sortField === field && <ChevronDown className={cn('w-3 h-3 transition-transform', sortDir === 'desc' && 'rotate-180')} />}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-text-tertiary">
                  <Search className="w-8 h-8 mx-auto mb-2" />
                  <p>No users found</p>
                </td>
              </tr>
            ) : (
              paged.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    'border-b border-border-light hover:bg-surface-secondary transition-colors cursor-pointer',
                    !u.isActive && 'opacity-60'
                  )}
                  onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{u.name}</p>
                        <p className="text-xs text-text-tertiary">{u.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize', ROLE_BADGES[u.role])}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{u.countryCode}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{formatDate(u.createdAt, 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'Never'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onViewDetails && (
                        <button onClick={(e) => { e.stopPropagation(); onViewDetails(u) }} className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors">
                          <Eye className="w-4 h-4 text-text-tertiary" />
                        </button>
                      )}
                      {onImpersonate && (
                        <button onClick={(e) => { e.stopPropagation(); onImpersonate(u) }} className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors" title="Impersonate">
                          <Shield className="w-4 h-4 text-text-tertiary" />
                        </button>
                      )}
                      {onSuspend && u.isActive && (
                        <button onClick={(e) => { e.stopPropagation(); onSuspend(u) }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Suspend">
                          <Ban className="w-4 h-4 text-text-tertiary hover:text-red-500" />
                        </button>
                      )}
                      {onVerify && !u.emailVerified && (
                        <button onClick={(e) => { e.stopPropagation(); onVerify(u) }} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" title="Verify">
                          <CheckCircle className="w-4 h-4 text-text-tertiary hover:text-emerald-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-text-tertiary">{filtered.length} total users</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  'w-7 h-7 rounded-lg text-xs font-medium transition-colors',
                  page === i ? 'bg-amber-500 text-white' : 'text-text-secondary hover:bg-surface-secondary'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedUser(null)} />
          <motion.div
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            className="fixed top-0 right-0 bottom-0 w-[360px] z-50 bg-surface border-l border-border overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{selectedUser.name}</h3>
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize mt-1', ROLE_BADGES[selectedUser.role])}>
                      {selectedUser.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-1 rounded-lg hover:bg-surface-secondary">
                  <XCircle className="w-5 h-5 text-text-tertiary" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary">
                  <Mail className="w-4 h-4 text-text-tertiary" />
                  <div>
                    <p className="text-xs text-text-tertiary">Email</p>
                    <p className="text-sm text-text-primary">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary">
                  <Phone className="w-4 h-4 text-text-tertiary" />
                  <div>
                    <p className="text-xs text-text-tertiary">Phone</p>
                    <p className="text-sm text-text-primary">{selectedUser.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary">
                  <Calendar className="w-4 h-4 text-text-tertiary" />
                  <div>
                    <p className="text-xs text-text-tertiary">Joined</p>
                    <p className="text-sm text-text-primary">{formatDate(selectedUser.createdAt, 'PPP')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary">
                  <Clock className="w-4 h-4 text-text-tertiary" />
                  <div>
                    <p className="text-xs text-text-tertiary">Last Login</p>
                    <p className="text-sm text-text-primary">{selectedUser.lastLoginAt ? timeAgo(selectedUser.lastLoginAt) : 'Never'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary">
                  <Shield className="w-4 h-4 text-text-tertiary" />
                  <div className="flex gap-3">
                    <div>
                      <p className="text-xs text-text-tertiary">2FA</p>
                      <p className={cn('text-sm font-medium', selectedUser.twoFactorEnabled ? 'text-emerald-600' : 'text-text-tertiary')}>
                        {selectedUser.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary">Verified</p>
                      <p className={cn('text-sm font-medium', selectedUser.emailVerified ? 'text-emerald-600' : 'text-red-500')}>
                        {selectedUser.emailVerified ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-6">
                {onImpersonate && (
                  <button onClick={() => { onImpersonate(selectedUser); setSelectedUser(null) }} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors">
                    <Shield className="w-4 h-4" /> Impersonate User
                  </button>
                )}
                {onViewDetails && (
                  <button onClick={() => { onViewDetails(selectedUser); setSelectedUser(null) }} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary font-medium text-sm hover:bg-surface-tertiary transition-colors">
                    <ExternalLink className="w-4 h-4" /> Full Profile
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
