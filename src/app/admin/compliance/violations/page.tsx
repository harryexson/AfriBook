'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

export default function ViolationsPage() {
  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/compliance" className="p-2 rounded-xl hover:bg-surface transition-colors">
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <h1 className="text-lg font-bold text-text-primary font-heading">All Violations</h1>
      </div>
      <p className="text-sm text-text-secondary">Full compliance violations list with management actions.</p>
      <div className="rounded-2xl bg-surface border border-border p-8 text-center text-text-tertiary text-sm">
        Full violations management interface. Extend with pagination, bulk actions, and detailed resolution workflow.
      </div>
    </motion.div>
  )
}
