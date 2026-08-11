'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { KycDocument as KycDoc } from '@/components/admin/KycReview'
import AdminStatCard from '@/components/admin/StatCard'
import KycReview from '@/components/admin/KycReview'
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

export default function AdminKycPage() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleApprove = (doc: KycDoc) => {
    setToast({ type: 'success', message: `${doc.userName}'s ${doc.documentType} approved` })
    setTimeout(() => setToast(null), 3000)
  }

  const handleReject = (doc: KycDoc) => {
    setToast({ type: 'error', message: `${doc.userName}'s ${doc.documentType} rejected` })
    setTimeout(() => setToast(null), 3000)
  }

  const handleFlag = (doc: KycDoc) => {
    setToast({ type: 'success', message: `${doc.userName}'s ${doc.documentType} flagged for review` })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">KYC / KYB Review</h1>
        <p className="text-sm text-text-secondary mt-1">Review and verify customer and business identity documents.</p>
      </motion.div>

      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Pending Review" value="24" icon={Clock} change={8.5} accent="bg-amber-500" />
        <AdminStatCard label="Approved Today" value="18" icon={CheckCircle} change={12.3} accent="bg-emerald-500" />
        <AdminStatCard label="Rejected Today" value="3" icon={XCircle} change={-25} accent="bg-red-500" />
        <AdminStatCard label="Flagged" value="7" icon={AlertTriangle} change={40} accent="bg-purple-500" />
      </motion.div>

      <motion.div variants={ITEM}>
        <KycReview
          onApprove={handleApprove}
          onReject={handleReject}
          onFlag={handleFlag}
        />
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
