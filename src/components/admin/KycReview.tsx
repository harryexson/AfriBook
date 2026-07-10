'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatDate, timeAgo } from '@/lib/utils'
import {
  ShieldCheck, CheckCircle, XCircle, AlertTriangle,
  Search, Download, ChevronDown, Eye, FileText,
  User, Building2, MessageSquare, Flag,
} from 'lucide-react'

type KycStatus = 'pending' | 'approved' | 'rejected' | 'flagged'
type KycType = 'individual' | 'business'

export interface KycDocument {
  id: string
  type: KycType
  userName: string
  userId: string
  documentType: string
  documentNumber: string
  status: KycStatus
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  notes?: string
  flags?: string[]
  imageUrl?: string
}

interface KycReviewProps {
  documents?: KycDocument[]
  loading?: boolean
  onApprove?: (doc: KycDocument) => void
  onReject?: (doc: KycDocument) => void
  onFlag?: (doc: KycDocument) => void
}

const STATUS_STYLES: Record<KycStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  flagged: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const MOCK_DOCS: KycDocument[] = [
  { id: 'kyc_1', type: 'individual', userName: 'Alice M.', userId: 'user_1', documentType: 'Passport', documentNumber: 'AB123456', status: 'pending', submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(), imageUrl: '' },
  { id: 'kyc_2', type: 'business', userName: 'Bob K.', userId: 'user_2', documentType: 'Business Registration', documentNumber: 'BR789012', status: 'pending', submittedAt: new Date(Date.now() - 5 * 86400000).toISOString(), imageUrl: '' },
  { id: 'kyc_3', type: 'individual', userName: 'Carol D.', userId: 'user_3', documentType: "Driver's License", documentNumber: 'DL345678', status: 'flagged', submittedAt: new Date(Date.now() - 7 * 86400000).toISOString(), flags: ['Name mismatch', 'Expired document'], imageUrl: '' },
  { id: 'kyc_4', type: 'business', userName: 'David N.', userId: 'user_4', documentType: 'Tax ID', documentNumber: 'TI901234', status: 'approved', submittedAt: new Date(Date.now() - 14 * 86400000).toISOString(), reviewedAt: new Date(Date.now() - 10 * 86400000).toISOString(), reviewedBy: 'admin_1', imageUrl: '' },
  { id: 'kyc_5', type: 'individual', userName: 'Eve T.', userId: 'user_5', documentType: 'National ID', documentNumber: 'ID567890', status: 'rejected', submittedAt: new Date(Date.now() - 10 * 86400000).toISOString(), reviewedAt: new Date(Date.now() - 8 * 86400000).toISOString(), reviewedBy: 'admin_2', notes: 'Document is illegible, please re-upload', imageUrl: '' },
]

export default function KycReview({ documents, loading, onApprove, onReject, onFlag }: KycReviewProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<KycStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<KycType | 'all'>('all')
  const [selected, setSelected] = useState<KycDocument | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const data = documents ?? MOCK_DOCS

  const filtered = data.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    if (typeFilter !== 'all' && d.type !== typeFilter) return false
    if (search) return d.userName.toLowerCase().includes(search.toLowerCase()) || d.documentNumber.toLowerCase().includes(search.toLowerCase())
    return true
  })

  const handleAction = async (action: 'approve' | 'reject' | 'flag') => {
    if (!selected) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))
    if (action === 'approve') onApprove?.(selected)
    else if (action === 'reject') onReject?.(selected)
    else if (action === 'flag') onFlag?.(selected)
    setSubmitting(false)
    setSelected(null)
  }

  if (loading) {
    return <div className="rounded-2xl bg-surface border border-border p-6 animate-pulse space-y-4">
      <div className="w-48 h-6 rounded bg-surface-secondary" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-border-light">
          <div className="w-10 h-10 rounded-xl bg-surface-secondary" />
          <div className="flex-1"><div className="w-36 h-4 rounded bg-surface-secondary mb-1" /><div className="w-24 h-3 rounded bg-surface-secondary" /></div>
          <div className="w-16 h-6 rounded-full bg-surface-secondary" />
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
            <input type="text" placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as KycStatus | 'all')}
            className="px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="flagged">Flagged</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as KycType | 'all')}
            className="px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30">
            <option value="all">All Types</option>
            <option value="individual">Individual</option>
            <option value="business">Business</option>
          </select>
        </div>
      </div>

      <div className="divide-y divide-border-light">
        {filtered.length === 0 ? (
          <div className="px-4 py-16 text-center text-text-tertiary">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2" />
            <p>No documents to review</p>
          </div>
        ) : (
          filtered.map((doc, i) => (
            <motion.div key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className={cn(
                'flex items-start gap-4 p-4 hover:bg-surface-secondary transition-colors cursor-pointer',
                selected?.id === doc.id && 'bg-amber-50/50 dark:bg-amber-900/10'
              )}
              onClick={() => setSelected(selected?.id === doc.id ? null : doc)}>
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                doc.type === 'business' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
              )}>
                {doc.type === 'business' ? <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-text-primary text-sm">{doc.userName}</h4>
                  <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize', STATUS_STYLES[doc.status])}>
                    {doc.status}
                  </span>
                  {doc.flags && doc.flags.length > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      <Flag className="w-3 h-3" />
                      {doc.flags.length} flags
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {doc.documentType} &middot; {doc.documentNumber}
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">{timeAgo(doc.submittedAt)}</p>
              </div>
              <ChevronDown className={cn('w-4 h-4 text-text-tertiary mt-2 transition-transform shrink-0', selected?.id === doc.id && 'rotate-180')} />
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border">
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-secondary">
                <div className="flex-1">
                  <p className="text-xs text-text-tertiary">Document Type</p>
                  <p className="text-sm font-medium text-text-primary">{selected.documentType}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-text-tertiary">Document Number</p>
                  <p className="text-sm font-medium text-text-primary">{selected.documentNumber}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-text-tertiary">Submitted</p>
                  <p className="text-sm text-text-primary">{formatDate(selected.submittedAt, 'MMM d, yyyy')}</p>
                </div>
              </div>

              {selected.flags && selected.flags.length > 0 && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">Fraud Flags</span>
                  </div>
                  <ul className="space-y-1">
                    {selected.flags.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Document viewer placeholder */}
              <div className="aspect-[16/9] rounded-xl bg-surface-secondary border border-border flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-text-tertiary mx-auto mb-2" />
                  <p className="text-sm text-text-tertiary">Document Preview</p>
                  <p className="text-xs text-text-tertiary mt-1">Supported: PDF, JPG, PNG</p>
                </div>
              </div>

              <textarea
                placeholder="Verification notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
                rows={3}
              />

              {selected.status === 'pending' || selected.status === 'flagged' ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleAction('approve')} disabled={submitting}
                    className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                    {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve
                  </button>
                  <button onClick={() => handleAction('reject')} disabled={submitting}
                    className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 disabled:opacity-50 transition-colors">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button onClick={() => handleAction('flag')} disabled={submitting}
                    className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary font-medium text-sm hover:bg-surface-tertiary disabled:opacity-50 transition-colors">
                    <Flag className="w-4 h-4" /> Flag
                  </button>
                </div>
              ) : (
                <div className={cn(
                  'p-3 rounded-xl',
                  selected.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200' : 'bg-red-50 dark:bg-red-900/20 border border-red-200'
                )}>
                  <div className="flex items-center gap-2">
                    {selected.status === 'approved' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span className={cn('text-sm font-medium', selected.status === 'approved' ? 'text-emerald-700' : 'text-red-700')}>
                      {selected.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                    {selected.reviewedBy && <span className="text-xs text-text-tertiary">by {selected.reviewedBy}</span>}
                  </div>
                  {selected.notes && <p className="text-xs text-text-secondary mt-1">{selected.notes}</p>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
