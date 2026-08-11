'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronLeft, Package } from 'lucide-react'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
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
