'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Search, Filter, ChevronDown, ChevronUp, X, Download, Mail,
  Ban, Trash2, Phone, Globe, Calendar, DollarSign,
  ShoppingCart, Clock, ArrowUpDown, Eye,
} from 'lucide-react'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  country: string
  countryCode: string
  joinDate: string
  totalOrders: number
  lifetimeValue: number
  status: 'active' | 'inactive' | 'suspended'
  lastActive: string
  avatar: string
  orders: { id: string; date: string; amount: number; item: string }[]
  tickets: { id: string; subject: string; status: 'open' | 'resolved' | 'pending'; date: string }[]
  activity: { action: string; time: string; type: string }[]
  notes: string
}

interface ApiCustomer {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  country_code: string | null
  role: string | null
  is_verified: boolean
  kyc_status: string | null
  created_at: string
}

const LIMIT = 50

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function mapRow(row: ApiCustomer): Customer {
  const name = row.full_name || row.email
  return {
    id: row.id,
    name,
    email: row.email,
    phone: row.phone || '—',
    country: row.country_code || '—',
    countryCode: row.country_code || '',
    joinDate: row.created_at,
    totalOrders: 0,
    lifetimeValue: 0,
    status: row.is_verified ? 'active' : 'inactive',
    lastActive: row.created_at,
    avatar: initials(name),
    orders: [],
    tickets: [],
    activity: [],
    notes: '',
  }
}

const STATUSES: Customer['status'][] = ['active', 'inactive', 'suspended']

type SortKey = keyof Customer
type SortDir = 'asc' | 'desc'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'bg-surface-secondary text-text-secondary',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const TICKET_STATUS: Record<string, string> = {
  open: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [clvMin, setClvMin] = useState('')
  const [clvMax, setClvMax] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [drawerCustomer, setDrawerCustomer] = useState<Customer | null>(null)
  const [drawerTab, setDrawerTab] = useState<'profile' | 'orders' | 'tickets' | 'activity' | 'notes'>('profile')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [customers, setCustomers] = useState<Customer[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (countryFilter) params.set('country', countryFilter)
      params.set('page', String(page))
      params.set('limit', String(LIMIT))
      const res = await fetch(`/api/admin/customers?${params.toString()}`)
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'Failed to load customers')
      setCustomers((body.data ?? []).map(mapRow))
      setCount(body.count ?? 0)
      setCountries((prev) => {
        const next = new Set(prev)
        ;(body.data ?? []).forEach((row: ApiCustomer) => {
          if (row.country_code) next.add(row.country_code)
        })
        return Array.from(next).sort()
      })
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [search, countryFilter, page])

  useEffect(() => {
    const t = setTimeout(() => loadCustomers(), 350)
    return () => clearTimeout(t)
  }, [loadCustomers])

  const totalPages = Math.max(1, Math.ceil(count / LIMIT))

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)))
    }
  }

  const filtered = useMemo(() => {
    let result = [...customers]

    if (statusFilter) result = result.filter((c) => c.status === statusFilter)
    if (dateFrom) result = result.filter((c) => c.joinDate >= dateFrom)
    if (dateTo) result = result.filter((c) => c.joinDate <= dateTo)
    if (clvMin) result = result.filter((c) => c.lifetimeValue >= parseFloat(clvMin))
    if (clvMax) result = result.filter((c) => c.lifetimeValue <= parseFloat(clvMax))

    result.sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })

    return result
  }, [customers, statusFilter, dateFrom, dateTo, clvMin, clvMax, sortKey, sortDir])

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-text-tertiary" />
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-amber-500" /> : <ChevronDown className="w-3 h-3 text-amber-500" />
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Customer List</h1>
        <p className="text-sm text-text-secondary mt-1">Manage, search, and segment your customer base.</p>
      </motion.div>

      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        {loadError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm flex items-center justify-between">
            <span>{loadError}</span>
            <button onClick={loadCustomers} className="text-xs font-medium underline">Retry</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                showFilters ? 'bg-amber-500 text-white border-amber-500' : 'bg-surface-secondary border-border text-text-secondary hover:text-text-primary'
              )}
            >
              <Filter className="w-4 h-4" /> Filters
              {(countryFilter || statusFilter || dateFrom || dateTo || clvMin || clvMax) && (
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
            <button
              onClick={() => showToast('Export started — check your email.')}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pb-4 border-b border-border">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Country</label>
                  <select
                    value={countryFilter}
                    onChange={(e) => { setCountryFilter(e.target.value); setPage(1) }}
                    className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="">All countries</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="">All statuses</option>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Joined from</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Joined to</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">CLV range ($)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={clvMin}
                      onChange={(e) => setClvMin(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={clvMax}
                      onChange={(e) => setClvMax(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3">
                <button
                  onClick={() => { setCountryFilter(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); setClvMin(''); setClvMax('') }}
                  className="text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors"
                >
                  Clear all filters
                </button>
                <span className="text-xs text-text-tertiary">{filtered.length} results</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-3 py-3 border-b border-border"
          >
            <span className="text-sm text-text-secondary">{selectedIds.size} selected</span>
            <button
              onClick={() => showToast(`Exported ${selectedIds.size} customers.`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <Download className="w-3 h-3" /> Export
            </button>
            <button
              onClick={() => showToast(`Email queued for ${selectedIds.size} customers.`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <Mail className="w-3 h-3" /> Send Email
            </button>
            <button
              onClick={() => showToast(`${selectedIds.size} customers suspended.`, 'error')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <Ban className="w-3 h-3" /> Suspend
            </button>
            <button
              onClick={() => showToast(`${selectedIds.size} customers deleted.`, 'error')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs font-medium text-red-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </motion.div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="pb-3 pr-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-border accent-amber-500"
                  />
                </th>
                {([
                  { key: 'name' as SortKey, label: 'Name' },
                  { key: 'email' as SortKey, label: 'Email' },
                  { key: 'phone' as SortKey, label: 'Phone' },
                  { key: 'country' as SortKey, label: 'Country' },
                  { key: 'joinDate' as SortKey, label: 'Join Date' },
                  { key: 'totalOrders' as SortKey, label: 'Orders' },
                  { key: 'lifetimeValue' as SortKey, label: 'CLV' },
                  { key: 'status' as SortKey, label: 'Status' },
                  { key: 'lastActive' as SortKey, label: 'Last Active' },
                ]).map(({ key, label }) => (
                  <th
                    key={key}
                    className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3 cursor-pointer select-none hover:text-text-primary transition-colors"
                    onClick={() => handleSort(key)}
                  >
                    <div className="flex items-center gap-1">
                      {label} <SortIcon col={key} />
                    </div>
                  </th>
                ))}
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-surface-secondary/50 transition-colors cursor-pointer"
                  onClick={() => { setDrawerCustomer(customer); setDrawerTab('profile') }}
                >
                  <td className="py-3 pr-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(customer.id)}
                      onChange={() => toggleSelect(customer.id)}
                      className="w-4 h-4 rounded border-border accent-amber-500"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {customer.avatar}
                      </div>
                      <span className="text-sm font-medium text-text-primary whitespace-nowrap">{customer.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-text-secondary whitespace-nowrap">{customer.email}</td>
                  <td className="py-3 pr-4 text-sm text-text-secondary whitespace-nowrap">{customer.phone}</td>
                  <td className="py-3 pr-4 text-sm text-text-secondary whitespace-nowrap">{customer.country}</td>
                  <td className="py-3 pr-4 text-sm text-text-secondary whitespace-nowrap">{new Date(customer.joinDate).toLocaleDateString()}</td>
                  <td className="py-3 pr-4 text-sm font-medium text-text-primary text-right">
                    {customer.totalOrders > 0 ? customer.totalOrders : '—'}
                  </td>
                  <td className="py-3 pr-4 text-sm font-semibold text-text-primary text-right">
                    {customer.lifetimeValue > 0 ? `$${customer.lifetimeValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_STYLES[customer.status])}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-sm text-text-secondary whitespace-nowrap">
                    {new Date(customer.lastActive).toLocaleDateString()}
                  </td>
                  <td className="py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setDrawerCustomer(customer); setDrawerTab('profile') }}
                      className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
                    >
                      <Eye className="w-4 h-4 text-text-tertiary" />
                    </button>
                  </td>
                </tr>
              ))}
              {loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-sm text-text-tertiary">
                    Loading customers…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-sm text-text-tertiary">
                    No customers match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <span className="text-xs text-text-tertiary">Showing {filtered.length} of {count.toLocaleString()} customers</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs text-text-tertiary">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {drawerCustomer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setDrawerCustomer(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-surface border-l border-border z-50 overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold">
                      {drawerCustomer.avatar}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-text-primary">{drawerCustomer.name}</h2>
                      <p className="text-sm text-text-secondary">{drawerCustomer.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDrawerCustomer(null)}
                    className="p-2 rounded-xl hover:bg-surface-secondary transition-colors"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                <div className="flex gap-1 bg-surface-secondary rounded-xl p-1 overflow-x-auto">
                  {(['profile', 'orders', 'tickets', 'activity', 'notes'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setDrawerTab(tab)}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                        drawerTab === tab ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                      )}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {drawerTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { icon: Phone, label: 'Phone', value: drawerCustomer.phone },
                        { icon: Globe, label: 'Country', value: drawerCustomer.country },
                        { icon: Calendar, label: 'Joined', value: new Date(drawerCustomer.joinDate).toLocaleDateString() },
                        { icon: DollarSign, label: 'Lifetime Value', value: drawerCustomer.lifetimeValue > 0 ? `$${drawerCustomer.lifetimeValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—' },
                        { icon: ShoppingCart, label: 'Total Orders', value: drawerCustomer.totalOrders > 0 ? drawerCustomer.totalOrders.toString() : '—' },
                        { icon: Clock, label: 'Last Active', value: new Date(drawerCustomer.lastActive).toLocaleDateString() },
                      ].map((item) => {
                        const Icon = item.icon
                        return (
                          <div key={item.label} className="p-3 rounded-xl bg-surface-secondary">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-3.5 h-3.5 text-text-tertiary" />
                              <span className="text-xs text-text-tertiary">{item.label}</span>
                            </div>
                            <p className="text-sm font-medium text-text-primary">{item.value}</p>
                          </div>
                        )
                      })}
                    </div>
                    <div className="p-3 rounded-xl bg-surface-secondary">
                      <span className="text-xs text-text-tertiary block mb-1">Status</span>
                      <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize', STATUS_STYLES[drawerCustomer.status])}>
                        {drawerCustomer.status}
                      </span>
                    </div>
                  </div>
                )}

                {drawerTab === 'orders' && (
                  <div className="space-y-3">
                    {drawerCustomer.orders.map((order) => (
                      <div key={order.id} className="p-4 rounded-xl bg-surface-secondary">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text-primary">{order.id}</span>
                          <span className="text-sm font-semibold text-text-primary">${order.amount.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-text-secondary">{order.item}</p>
                        <p className="text-xs text-text-tertiary mt-1">{new Date(order.date).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {drawerCustomer.orders.length === 0 && (
                      <p className="text-sm text-text-tertiary text-center py-8">No orders found.</p>
                    )}
                  </div>
                )}

                {drawerTab === 'tickets' && (
                  <div className="space-y-3">
                    {drawerCustomer.tickets.map((ticket) => (
                      <div key={ticket.id} className="p-4 rounded-xl bg-surface-secondary">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text-primary">{ticket.id}</span>
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', TICKET_STATUS[ticket.status])}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary">{ticket.subject}</p>
                        <p className="text-xs text-text-tertiary mt-1">{new Date(ticket.date).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {drawerCustomer.tickets.length === 0 && (
                      <p className="text-sm text-text-tertiary text-center py-8">No support tickets.</p>
                    )}
                  </div>
                )}

                {drawerTab === 'activity' && (
                  <div className="space-y-3">
                    {drawerCustomer.activity.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-secondary/50">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-text-primary">{item.action}</p>
                          <p className="text-xs text-text-tertiary mt-0.5">{new Date(item.time).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {drawerTab === 'notes' && (
                  <div className="p-4 rounded-xl bg-surface-secondary min-h-[200px]">
                    <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                      {drawerCustomer.notes || 'No notes for this customer.'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
