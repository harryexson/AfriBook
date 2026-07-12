'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ChevronLeft, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import type { TheftPreventionLog } from '@/types/pickup-security'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  verified: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  discrepancy_found: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  resolved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  escalated: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

export default function TheftPage() {
  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/compliance" className="p-2 rounded-xl hover:bg-surface transition-colors">
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-600" />
          <h1 className="text-lg font-bold text-text-primary font-heading">Theft Prevention Log</h1>
        </div>
      </div>
      <p className="text-sm text-text-secondary">
        Three-way verification chain tracking: vendor pack, driver pickup, customer delivery confirmation with photo evidence.
      </p>
      <div className="rounded-2xl bg-surface border border-border p-8 text-center text-text-tertiary text-sm">
        Full theft prevention management interface. Extend with photo evidence viewer, discrepancy resolution workflow, and escalation handling.
      </div>
    </motion.div>
  )
}
