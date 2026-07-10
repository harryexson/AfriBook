'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Globe, Building2, CalendarCheck, Package, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Stat {
  value: string
  label: string
  suffix: string
  icon: React.ComponentType<{ className?: string }>
}

const STATS: Stat[] = [
  { value: '16', label: 'Countries', suffix: '+', icon: Globe },
  { value: '10', label: 'Businesses', suffix: 'K+', icon: Building2 },
  { value: '1', label: 'Bookings', suffix: 'M+', icon: CalendarCheck },
  { value: '50', label: 'Products', suffix: 'K+', icon: Package },
]

function AnimatedCounter({ value, suffix, label, icon: Icon }: Stat) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <div ref={ref} className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/10 mb-4">
        <Icon className="w-8 h-8 text-amber-500" />
      </div>
      <div className="text-4xl sm:text-5xl font-bold font-heading text-text-primary">
        {isInView ? (
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {value}{suffix}
          </motion.span>
        ) : (
          '0'
        )}
      </div>
      <p className="text-text-secondary mt-2 font-medium">{label}</p>
    </div>
  )
}

export default function StatsSection() {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-dark-200 dark:to-dark-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-semibold mb-4">
            <TrendingUp className="w-4 h-4" />
            Our reach is growing
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary">
            Trusted across the continent
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {STATS.map((stat) => (
            <AnimatedCounter key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  )
}
