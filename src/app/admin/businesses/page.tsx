'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Business } from '@/types'
import AdminStatCard from '@/components/admin/StatCard'
import BusinessesTable from '@/components/admin/BusinessesTable'
import { Building2, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

export default function AdminBusinessesPage() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleVerify = (biz: Business) => {
    setToast({ type: 'success', message: `${biz.name} has been approved` })
    setTimeout(() => setToast(null), 3000)
  }

  const handleReject = (biz: Business) => {
    setToast({ type: 'error', message: `${biz.name} has been rejected` })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSuspend = (biz: Business) => {
    setToast({ type: 'success', message: `${biz.name} has been suspended` })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Business Management</h1>
        <p className="text-sm text-text-secondary mt-1">Review, verify, and manage all businesses on the platform.</p>
      </motion.div>

      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Total Businesses" value="7,070" icon={Building2} change={8.3} accent="bg-purple-500" />
        <AdminStatCard label="Active" value="6,234" icon={CheckCircle} change={6.1} accent="bg-emerald-500" />
        <AdminStatCard label="Pending Verification" value="836" icon={Clock} change={12.4} accent="bg-amber-500" />
        <AdminStatCard label="Suspended" value="124" icon={AlertTriangle} change={-2.3} accent="bg-red-500" />
      </motion.div>

      <motion.div variants={ITEM}>
        <BusinessesTable
          onVerify={handleVerify}
          onReject={handleReject}
          onSuspend={handleSuspend}
          onViewDetails={(b) => console.log('View details:', b.id)}
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
