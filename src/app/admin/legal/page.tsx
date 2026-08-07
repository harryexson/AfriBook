'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  FileText, Shield, Eye, Edit3, CheckCircle, Clock,
  ChevronRight, Globe, Users, BookOpen, AlertTriangle,
  Download, RefreshCw, ExternalLink,
} from 'lucide-react'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

type PolicyStatus = 'published' | 'draft' | 'archived'

interface PolicyDocument {
  id: string
  title: string
  slug: string
  description: string
  lastUpdated: string
  effectiveDate: string
  status: PolicyStatus
  version: string
  author: string
  sections: number
  wordCount: number
  languages: string[]
  content: string | null
}

interface ApiLegalDoc {
  id: string
  slug: string
  title: string
  version: string
  status: string
  effective_date: string | null
  last_updated: string | null
  author: string | null
  content: string | null
  languages: unknown
  sections: number | null
  word_count: number | null
}

const STATUS_CONFIG: Record<PolicyStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  published: { label: 'Published', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle },
  draft: { label: 'Draft', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Edit3 },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: Clock },
}

interface VersionHistory {
  version: string
  date: string
  author: string
  changes: string
}

const deriveDescription = (content: string | null): string => {
  if (!content) return ''
  const line = content
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0 && !l.startsWith('#'))
  if (!line) return ''
  return line.replace(/[*_`>]/g, '').trim().slice(0, 120)
}

const mapDocument = (d: ApiLegalDoc): PolicyDocument => ({
  id: d.id,
  title: d.title,
  slug: d.slug,
  description: deriveDescription(d.content),
  lastUpdated: d.last_updated ?? '',
  effectiveDate: d.effective_date ?? '',
  status: d.status as PolicyStatus,
  version: d.version,
  author: d.author ?? '',
  sections: d.sections ?? 0,
  wordCount: d.word_count ?? 0,
  languages: Array.isArray(d.languages) ? d.languages.map(String) : ['en'],
  content: d.content,
})

export default function AdminLegalPage() {
  const [documents, setDocuments] = useState<PolicyDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<PolicyStatus | 'all'>('all')
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleAction = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/legal-docs?limit=100', { cache: 'no-store' })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error ?? 'Failed to load documents')
      }
      const json = await res.json()
      setDocuments((json.data as ApiLegalDoc[]).map(mapDocument))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const handlePublish = async (doc: PolicyDocument) => {
    setPublishingId(doc.id)
    try {
      const res = await fetch(`/api/admin/legal-docs/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error ?? 'Failed to publish document')
      }
      const json = await res.json()
      const updated = mapDocument(json.data as ApiLegalDoc)
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
      handleAction(`"${updated.title}" published`)
    } catch (e) {
      handleAction(e instanceof Error ? e.message : 'Failed to publish document', 'error')
    } finally {
      setPublishingId(null)
    }
  }

  const filtered = documents.filter(
    (p) => filterStatus === 'all' || p.status === filterStatus,
  )

  const selectedDoc = selectedPolicy ? documents.find((p) => p.id === selectedPolicy) ?? null : null
  const selectedHistory = selectedDoc
    ? documents
        .filter((d) => d.slug === selectedDoc.slug)
        .map((d) => ({
          version: d.version,
          date: d.lastUpdated || d.effectiveDate || '',
          author: d.author || 'Legal Team',
          changes: d.description || 'Document version in the registry.',
        }))
        .sort((a, b) => b.version.localeCompare(a.version))
    : []

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <motion.div variants={ITEM} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <FileText className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary font-heading">Legal Documents</h1>
            <p className="text-xs text-text-secondary">Manage policies, terms, and compliance documents</p>
          </div>
        </div>
        <button className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors flex items-center gap-2">
          <FileText className="w-4 h-4" />
          New Document
        </button>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Published', value: documents.filter((p) => p.status === 'published').length, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Drafts', value: documents.filter((p) => p.status === 'draft').length, icon: Edit3, color: 'text-amber-500' },
          { label: 'Languages', value: [...new Set(documents.flatMap((p) => p.languages))].length, icon: Globe, color: 'text-blue-500' },
          { label: 'Total Words', value: documents.reduce((sum, p) => sum + p.wordCount, 0).toLocaleString(), icon: BookOpen, color: 'text-purple-500' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-2xl bg-surface border border-border flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-surface-secondary')}>
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-secondary">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={ITEM} className="flex items-center gap-2">
        {(['all', 'published', 'draft', 'archived'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium transition-colors',
              filterStatus === status
                ? 'bg-amber-500 text-white'
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary',
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policy List */}
        <motion.div variants={ITEM} className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-surface border border-border">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-text-secondary mt-3">Loading documents...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-surface border border-border">
              <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
              <p className="text-sm font-medium text-text-primary">Failed to load documents</p>
              <p className="text-xs text-text-secondary mt-1">{error}</p>
              <button
                onClick={loadDocuments}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-surface border border-border">
              <FileText className="w-10 h-10 text-text-tertiary mb-3" />
              <p className="text-sm font-medium text-text-primary">No documents found</p>
              <p className="text-xs text-text-secondary mt-1">Try adjusting your filters.</p>
            </div>
          ) : (
            filtered.map((policy) => {
              const statusConf = STATUS_CONFIG[policy.status]
              const StatusIcon = statusConf.icon
              return (
                <button
                  key={policy.id}
                  onClick={() => setSelectedPolicy(policy.id)}
                  className={cn(
                    'w-full text-left p-4 rounded-2xl border transition-all duration-200',
                    selectedPolicy === policy.id
                      ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-500/30 shadow-lg shadow-amber-500/5'
                      : 'bg-surface border-border hover:border-amber-500/20 hover:shadow-md',
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-text-primary truncate">{policy.title}</h3>
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1', statusConf.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConf.label}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-1">{policy.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-text-tertiary">
                        <span>v{policy.version}</span>
                        <span>•</span>
                        <span>{policy.sections} sections</span>
                        <span>•</span>
                        <span>{policy.wordCount.toLocaleString()} words</span>
                        <span>•</span>
                        <span>{policy.languages.length} language{policy.languages.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0 mt-1" />
                  </div>
                </button>
              )
            })
          )}
        </motion.div>

        {/* Detail Panel */}
        <motion.div variants={ITEM} className="lg:col-span-1">
          {selectedDoc ? (
            <div className="sticky top-20 space-y-4">
              <div className="p-5 rounded-2xl bg-surface border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text-primary">{selectedDoc.title}</h3>
                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', STATUS_CONFIG[selectedDoc.status].color)}>
                    {STATUS_CONFIG[selectedDoc.status].label}
                  </span>
                </div>

                <p className="text-xs text-text-secondary">{selectedDoc.description}</p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-text-tertiary mb-0.5">Version</p>
                    <p className="font-medium text-text-primary">v{selectedDoc.version}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary mb-0.5">Last Updated</p>
                    <p className="font-medium text-text-primary">{selectedDoc.lastUpdated}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary mb-0.5">Effective Date</p>
                    <p className="font-medium text-text-primary">{selectedDoc.effectiveDate}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary mb-0.5">Author</p>
                    <p className="font-medium text-text-primary">{selectedDoc.author}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-text-tertiary mb-1.5">Languages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoc.languages.map((lang) => (
                      <span key={lang} className="px-2 py-0.5 rounded-lg bg-surface-secondary border border-border text-[10px] font-medium text-text-secondary uppercase">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedDoc.slug !== '#' && (
                    <Link
                      href={`/legal/${selectedDoc.slug}`}
                      target="_blank"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Live
                    </Link>
                  )}
                  <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors">
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
                    <Download className="w-3 h-3" />
                    Export PDF
                  </button>
                  <button
                    onClick={() => handlePublish(selectedDoc)}
                    disabled={selectedDoc.status === 'published' || publishingId === selectedDoc.id}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium transition-colors',
                      selectedDoc.status === 'published'
                        ? 'text-text-tertiary cursor-not-allowed'
                        : 'text-text-secondary hover:text-text-primary',
                    )}
                  >
                    <RefreshCw className={cn('w-3 h-3', publishingId === selectedDoc.id && 'animate-spin')} />
                    {selectedDoc.status === 'published' ? 'Published' : 'Publish'}
                  </button>
                </div>
              </div>

              {/* Version History */}
              <div className="p-5 rounded-2xl bg-surface border border-border space-y-3">
                <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Version History</h4>
                <div className="space-y-3">
                  {selectedHistory.map((entry) => (
                    <div key={entry.version} className="relative pl-4 border-l-2 border-border">
                      <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-amber-500" />
                      <p className="text-xs font-medium text-text-primary">v{entry.version}</p>
                      <p className="text-[10px] text-text-tertiary">{entry.date} • {entry.author}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{entry.changes}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="sticky top-20 p-8 rounded-2xl bg-surface border border-border text-center">
              <FileText className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">Select a document to view details and version history.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(
              'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
              toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white',
            )}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
