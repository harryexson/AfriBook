'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
}

const POLICIES: PolicyDocument[] = [
  {
    id: 'tos',
    title: 'Terms of Service',
    slug: '/terms',
    description: 'General terms governing use of the AfriBook platform across all markets.',
    lastUpdated: '2025-07-01',
    effectiveDate: '2025-07-01',
    status: 'published',
    version: '2.1',
    author: 'Legal Team',
    sections: 15,
    wordCount: 4200,
    languages: ['en', 'fr', 'sw'],
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    slug: '/privacy',
    description: 'How AfriBook collects, uses, and protects user data across 16+ African countries.',
    lastUpdated: '2025-07-01',
    effectiveDate: '2025-07-01',
    status: 'published',
    version: '3.0',
    author: 'Legal Team',
    sections: 14,
    wordCount: 5100,
    languages: ['en', 'fr'],
  },
  {
    id: 'cookies',
    title: 'Cookie Policy',
    slug: '/cookies',
    description: 'Detailed information on cookies, tracking technologies, and user preferences.',
    lastUpdated: '2025-07-01',
    effectiveDate: '2025-07-01',
    status: 'published',
    version: '1.2',
    author: 'Legal Team',
    sections: 12,
    wordCount: 3400,
    languages: ['en'],
  },
  {
    id: 'seller-terms',
    title: 'Seller Terms & Conditions',
    slug: '/seller-terms',
    description: 'Terms governing sellers and service providers on the AfriBook marketplace.',
    lastUpdated: '2025-07-01',
    effectiveDate: '2025-07-01',
    status: 'published',
    version: '1.0',
    author: 'Legal Team',
    sections: 15,
    wordCount: 4800,
    languages: ['en', 'fr'],
  },
  {
    id: 'refund',
    title: 'Refund Policy',
    slug: '/refund-policy',
    description: 'Refund eligibility, timeframes, and dispute resolution for marketplace transactions.',
    lastUpdated: '2025-07-01',
    effectiveDate: '2025-07-01',
    status: 'published',
    version: '1.1',
    author: 'Legal Team',
    sections: 12,
    wordCount: 3900,
    languages: ['en', 'fr', 'sw', 'ha'],
  },
  {
    id: 'vendor-guidelines',
    title: 'Vendor Guidelines',
    slug: '/legal/vendor',
    description: 'Operational standards, fulfilment requirements, and quality benchmarks for vendors.',
    lastUpdated: '2025-06-15',
    effectiveDate: '2025-06-15',
    status: 'published',
    version: '2.0',
    author: 'Operations',
    sections: 10,
    wordCount: 3100,
    languages: ['en'],
  },
  {
    id: 'community',
    title: 'Community Guidelines',
    slug: '/legal/guidelines',
    description: 'Content standards, behaviour expectations, and enforcement actions for the community.',
    lastUpdated: '2025-06-01',
    effectiveDate: '2025-06-01',
    status: 'draft',
    version: '0.9',
    author: 'Trust & Safety',
    sections: 8,
    wordCount: 2800,
    languages: ['en'],
  },
  {
    id: 'data-protection',
    title: 'Data Protection Addendum',
    slug: '#',
    description: 'Supplementary data protection terms for GDPR/NDPR compliance across jurisdictions.',
    lastUpdated: '2025-05-20',
    effectiveDate: '2025-08-01',
    status: 'draft',
    version: '0.5',
    author: 'Legal Team',
    sections: 11,
    wordCount: 4600,
    languages: ['en', 'fr'],
  },
]

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

const VERSION_HISTORY: Record<string, VersionHistory[]> = {
  tos: [
    { version: '2.1', date: '2025-07-01', author: 'Legal Team', changes: 'Updated fee structure and seller obligations sections.' },
    { version: '2.0', date: '2025-04-15', author: 'Legal Team', changes: 'Major revision for multi-market expansion (16+ countries).' },
    { version: '1.3', date: '2025-01-10', author: 'Legal Team', changes: 'Added dispute resolution and arbitration clause.' },
    { version: '1.2', date: '2024-10-01', author: 'Legal Team', changes: 'Updated privacy section for NDPR compliance.' },
  ],
  privacy: [
    { version: '3.0', date: '2025-07-01', author: 'Legal Team', changes: 'Comprehensive rewrite for multi-jurisdiction data protection compliance.' },
    { version: '2.1', date: '2025-03-01', author: 'Legal Team', changes: 'Added data retention schedules and user rights section.' },
    { version: '2.0', date: '2024-09-15', author: 'Legal Team', changes: 'Added cookie consent and cross-border transfer provisions.' },
  ],
  cookies: [
    { version: '1.2', date: '2025-07-01', author: 'Legal Team', changes: 'Updated cookie inventory and added analytics cookies table.' },
    { version: '1.1', date: '2025-02-01', author: 'Legal Team', changes: 'Added consent management and opt-out instructions.' },
  ],
  'seller-terms': [
    { version: '1.0', date: '2025-07-01', author: 'Legal Team', changes: 'Initial publication of seller-specific terms and conditions.' },
  ],
  refund: [
    { version: '1.1', date: '2025-07-01', author: 'Legal Team', changes: 'Expanded coverage for services, deliveries, and ride-sharing.' },
    { version: '1.0', date: '2025-05-01', author: 'Legal Team', changes: 'Initial publication of marketplace refund policy.' },
  ],
  'vendor-guidelines': [
    { version: '2.0', date: '2025-06-15', author: 'Operations', changes: 'Major update with quality benchmarks and fulfilment SLAs.' },
    { version: '1.0', date: '2025-01-15', author: 'Operations', changes: 'Initial publication.' },
  ],
  community: [
    { version: '0.9', date: '2025-06-01', author: 'Trust & Safety', changes: 'Draft under review — content standards and enforcement framework.' },
  ],
  'data-protection': [
    { version: '0.5', date: '2025-05-20', author: 'Legal Team', changes: 'Draft in progress — NDPR and GDPR supplementary terms.' },
  ],
}

export default function AdminLegalPage() {
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<PolicyStatus | 'all'>('all')

  const filtered = POLICIES.filter(
    (p) => filterStatus === 'all' || p.status === filterStatus,
  )

  const selectedDoc = selectedPolicy ? POLICIES.find((p) => p.id === selectedPolicy) : null
  const selectedHistory = selectedPolicy ? VERSION_HISTORY[selectedPolicy] ?? [] : []

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
          { label: 'Published', value: POLICIES.filter((p) => p.status === 'published').length, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Drafts', value: POLICIES.filter((p) => p.status === 'draft').length, icon: Edit3, color: 'text-amber-500' },
          { label: 'Languages', value: [...new Set(POLICIES.flatMap((p) => p.languages))].length, icon: Globe, color: 'text-blue-500' },
          { label: 'Total Words', value: POLICIES.reduce((sum, p) => sum + p.wordCount, 0).toLocaleString(), icon: BookOpen, color: 'text-purple-500' },
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
          {filtered.map((policy) => {
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
          })}
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
                      href={selectedDoc.slug}
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
                  <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
                    <RefreshCw className="w-3 h-3" />
                    Publish
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
    </motion.div>
  )
}
