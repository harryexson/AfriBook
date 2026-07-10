'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Business, BusinessStatus } from '@/types'
import {
  Search, ChevronDown, Eye, CheckCircle, XCircle,
  Ban, Download, MoreHorizontal, Flag, SlidersHorizontal,
  Star, MapPin,
} from 'lucide-react'
import * as Switch from '@radix-ui/react-switch'

type SortField = 'name' | 'category' | 'countryCode' | 'status' | 'rating' | 'createdAt'
type SortDir = 'asc' | 'desc'

interface BusinessesTableProps {
  businesses?: Business[]
  loading?: boolean
  onVerify?: (business: Business) => void
  onReject?: (business: Business) => void
  onSuspend?: (business: Business) => void
  onViewDetails?: (business: Business) => void
}

const STATUS_STYLES: Record<BusinessStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending_verification: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

const CATEGORIES = ['Restaurant', 'Salon', 'Fitness', 'Consulting', 'Cleaning', 'Photography', 'Tutoring', 'Event Planning']
const COUNTRIES = ['CM', 'NG', 'KE', 'ZA', 'GH', 'TZ', 'RW', 'UG']

const MOCK_BIZ: Business[] = Array.from({ length: 20 }, (_, i) => ({
  id: `biz_${i + 1}`,
  name: ['Savannah Grille', 'Lagos Hair Studio', 'Nairobi Fit Hub', 'Cape Creative Co', 'Accra Eats', 'Dar Photo Studio', 'Kigali Cleaners', 'Kampala Tutoring'][i % 8],
  description: 'A great business serving the local community.',
  category: CATEGORIES[i % CATEGORIES.length],
  countryCode: COUNTRIES[i % COUNTRIES.length],
  ownerId: `user_${i + 1}`,
  address: { street: '123 Main St', city: 'City', state: 'State', postalCode: '00000', countryCode: COUNTRIES[i % COUNTRIES.length], formatted: '123 Main St' },
  location: { latitude: 0, longitude: 0 },
  contact: { phone: '+23767000000', email: `contact${i + 1}@example.com` },
  media: { galleryUrls: [] },
  hours: [],
  status: (['active', 'pending_verification', 'suspended', 'active'] as BusinessStatus[])[i % 4],
  rating: +(3 + Math.random() * 2).toFixed(1),
  reviewCount: Math.floor(Math.random() * 100),
  qrBookingUrl: '',
  tags: [],
  deliveryAvailable: i % 3 === 0,
  deliveryRadiusKm: 10,
  minimumOrder: 1000,
  commissionRate: 0.1,
  createdAt: new Date(Date.now() - Math.random() * 365 * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
}))

export default function BusinessesTable({
  businesses, loading, onVerify, onReject, onSuspend, onViewDetails,
}: BusinessesTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<BusinessStatus | 'all'>('all')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selected, setSelected] = useState<Business | null>(null)
  const [page, setPage] = useState(0)
  const perPage = 10

  const data = businesses ?? MOCK_BIZ

  const filtered = data
    .filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false
      if (countryFilter !== 'all' && b.countryCode !== countryFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q) || b.contact.email.includes(q)
      }
      return true
    })
    .sort((a, b) => {
      const aVal = a[sortField] ?? ''
      const bVal = b[sortField] ?? ''
      const cmp = typeof aVal === 'number' ? aVal - (bVal as number) : String(aVal).localeCompare(String(bVal))
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
          <div className="w-48 h-6 rounded bg-surface-secondary" />
          <div className="w-64 h-9 rounded-lg bg-surface-secondary" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b border-border-light">
            <div className="w-10 h-10 rounded-xl bg-surface-secondary" />
            <div className="flex-1">
              <div className="w-36 h-4 rounded bg-surface-secondary mb-1" />
              <div className="w-20 h-3 rounded bg-surface-secondary" />
            </div>
            <div className="w-20 h-6 rounded-full bg-surface-secondary" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-surface border border-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-border">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text" placeholder="Search businesses..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as BusinessStatus | 'all'); setPage(0) }}
            className="px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="pending_verification">Pending</option>
          </select>
          <select value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setPage(0) }}
            className="px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30">
            <option value="all">All Countries</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {(['name', 'category', 'countryCode', 'status', 'rating', 'createdAt'] as SortField[]).map((field) => (
                <th key={field} onClick={() => toggleSort(field)}
                  className={cn('px-4 py-3 text-left font-medium text-text-tertiary cursor-pointer hover:text-text-secondary transition-colors', sortField === field && 'text-amber-600')}>
                  <div className="flex items-center gap-1">
                    <span className="text-xs uppercase tracking-wider">{field === 'createdAt' ? 'Created' : field}</span>
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
                  <p>No businesses found</p>
                </td>
              </tr>
            ) : (
              paged.map((b, i) => (
                <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className={cn('border-b border-border-light hover:bg-surface-secondary transition-colors cursor-pointer', b.status === 'suspended' && 'opacity-60')}
                  onClick={() => setSelected(selected?.id === b.id ? null : b)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {b.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{b.name}</p>
                        <p className="text-xs text-text-tertiary">{b.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-text-secondary">{b.category}</span></td>
                  <td className="px-4 py-3 text-text-secondary">{b.countryCode}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize', STATUS_STYLES[b.status])}>
                      {b.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-text-secondary">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{b.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{formatDate(b.createdAt, 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onViewDetails && (
                        <button onClick={(e) => { e.stopPropagation(); onViewDetails(b) }} className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors">
                          <Eye className="w-4 h-4 text-text-tertiary" />
                        </button>
                      )}
                      {b.status === 'pending_verification' && onVerify && (
                        <button onClick={(e) => { e.stopPropagation(); onVerify(b) }} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" title="Verify">
                          <CheckCircle className="w-4 h-4 text-text-tertiary hover:text-emerald-500" />
                        </button>
                      )}
                      {b.status === 'pending_verification' && onReject && (
                        <button onClick={(e) => { e.stopPropagation(); onReject(b) }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Reject">
                          <XCircle className="w-4 h-4 text-text-tertiary hover:text-red-500" />
                        </button>
                      )}
                      {b.status === 'active' && onSuspend && (
                        <button onClick={(e) => { e.stopPropagation(); onSuspend(b) }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Suspend">
                          <Ban className="w-4 h-4 text-text-tertiary hover:text-red-500" />
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-text-tertiary">{filtered.length} total businesses</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className={cn('w-7 h-7 rounded-lg text-xs font-medium transition-colors', page === i ? 'bg-amber-500 text-white' : 'text-text-secondary hover:bg-surface-secondary')}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelected(null)} />
          <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
            className="fixed top-0 right-0 bottom-0 w-[400px] z-50 bg-surface border-l border-border overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                    {selected.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{selected.name}</h3>
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize', STATUS_STYLES[selected.status])}>
                      {selected.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-surface-secondary">
                  <XCircle className="w-5 h-5 text-text-tertiary" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-surface-secondary">
                    <p className="text-xs text-text-tertiary">Category</p>
                    <p className="text-sm font-medium text-text-primary">{selected.category}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-secondary">
                    <p className="text-xs text-text-tertiary">Country</p>
                    <p className="text-sm font-medium text-text-primary">{selected.countryCode}</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-surface-secondary">
                  <p className="text-xs text-text-tertiary">Contact</p>
                  <p className="text-sm text-text-primary">{selected.contact.email}</p>
                  <p className="text-sm text-text-primary">{selected.contact.phone}</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-secondary">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-text-tertiary" />
                    <p className="text-xs text-text-tertiary">Address</p>
                  </div>
                  <p className="text-sm text-text-primary">{selected.address.formatted}</p>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-secondary">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-medium text-text-primary">{selected.rating}</span>
                  <span className="text-xs text-text-tertiary">({selected.reviewCount} reviews)</span>
                </div>
              </div>

              {/* Feature flags */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-text-primary mb-3">Feature Flags</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Delivery Available', key: 'deliveryAvailable', value: selected.deliveryAvailable },
                    { label: 'Online Booking', key: 'onlineBooking', value: true },
                    { label: 'Reviews Enabled', key: 'reviewsEnabled', value: true },
                    { label: 'Promotions', key: 'promotions', value: false },
                  ].map((feat) => (
                    <div key={feat.key} className="flex items-center justify-between py-1">
                      <span className="text-sm text-text-secondary">{feat.label}</span>
                      <Switch.Root defaultChecked={feat.value}
                        className="w-9 h-5 rounded-full bg-surface-tertiary data-[state=checked]:bg-amber-500 relative outline-none transition-colors"
                      >
                        <Switch.Thumb className="block w-3.5 h-3.5 bg-white rounded-full shadow-sm translate-x-0.5 data-[state=checked]:translate-x-[18px] transition-transform" />
                      </Switch.Root>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-6">
                {selected.status === 'pending_verification' && onVerify && (
                  <button onClick={() => { onVerify(selected); setSelected(null) }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors">
                    <CheckCircle className="w-4 h-4" /> Approve Business
                  </button>
                )}
                {selected.status === 'active' && onSuspend && (
                  <button onClick={() => { onSuspend(selected); setSelected(null) }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors">
                    <Ban className="w-4 h-4" /> Suspend Business
                  </button>
                )}
                {onViewDetails && (
                  <button onClick={() => { onViewDetails(selected); setSelected(null) }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary font-medium text-sm hover:bg-surface-tertiary transition-colors">
                    <Eye className="w-4 h-4" /> Full Details
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
