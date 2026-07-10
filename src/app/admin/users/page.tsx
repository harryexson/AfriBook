'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { User } from '@/types'
import { useAuthStore } from '@/stores/auth-store'
import AdminStatCard from '@/components/admin/StatCard'
import UsersTable from '@/components/admin/UsersTable'
import { Users, UserCheck, UserX, UserPlus } from 'lucide-react'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, startImpersonating } = useAuthStore()
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleImpersonate = (target: User) => {
    startImpersonating(target.role)
    setToast({ type: 'success', message: `Impersonating ${target.name} as ${target.role}` })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSuspend = (target: User) => {
    setToast({ type: 'success', message: `${target.name} has been suspended` })
    setTimeout(() => setToast(null), 3000)
  }

  const handleVerify = (target: User) => {
    setToast({ type: 'success', message: `${target.name} has been verified` })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">User Management</h1>
        <p className="text-sm text-text-secondary mt-1">Search, filter, and manage all platform users.</p>
      </motion.div>

      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Total Users" value="140,550" icon={Users} change={12.5} />
        <AdminStatCard label="Active Users" value="98,450" icon={UserCheck} change={8.2} accent="bg-emerald-500" />
        <AdminStatCard label="Suspended" value="1,234" icon={UserX} change={-3.1} accent="bg-red-500" />
        <AdminStatCard label="New This Week" value="2,145" icon={UserPlus} change={15.8} accent="bg-blue-500" />
      </motion.div>

      <motion.div variants={ITEM}>
        <UsersTable
          onImpersonate={handleImpersonate}
          onSuspend={handleSuspend}
          onVerify={handleVerify}
          onViewDetails={(u) => router.push(`/admin/users?userId=${u.id}`)}
        />
      </motion.div>

      {/* Toast notification */}
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
