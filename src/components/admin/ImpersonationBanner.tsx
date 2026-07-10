'use client'

import { motion } from 'framer-motion'
import { ShieldAlert, UserX } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

export default function ImpersonationBanner() {
  const { impersonating, originalRole, stopImpersonating, user } = useAuthStore()

  if (!impersonating || !user) return null

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-gradient-to-r from-amber-600 to-orange-600 text-white"
    >
      <div className="flex items-center justify-between px-4 lg:px-6 py-2 text-sm">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span className="font-medium">
            Impersonating <strong>{user.name}</strong> ({user.role})
          </span>
          {originalRole && (
            <span className="text-white/70 text-xs">Original role: {originalRole}</span>
          )}
        </div>
        <button
          onClick={stopImpersonating}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-xs font-medium"
        >
          <UserX className="w-3.5 h-3.5" />
          Stop Impersonating
        </button>
      </div>
    </motion.div>
  )
}
