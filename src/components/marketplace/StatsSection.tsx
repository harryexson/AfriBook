'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

interface Stat {
  value: string
  label: string
}

const STATS: Stat[] = [
  { value: '16+', label: 'Countries' },
  { value: '10K+', label: 'Businesses' },
  { value: '1M+', label: 'Bookings' },
  { value: '50K+', label: 'Products' },
]

export default function StatsSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative flex flex-col justify-between gap-8 bg-surface p-8 sm:p-10"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                  {stat.label}
                </span>
                <ArrowUpRight className="h-4 w-4 text-text-tertiary transition-all duration-300 group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <div className="font-mono text-5xl font-medium tracking-[-0.03em] text-text-primary sm:text-6xl">
                {stat.value}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
