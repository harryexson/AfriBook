'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CreditCard, Star, Store, BarChart3, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

type ViewMode = 'customer' | 'vendor'

interface Step {
  number: number
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

const CUSTOMER_STEPS: Step[] = [
  {
    number: 1, icon: Search,
    title: 'Search & discover',
    description: 'Browse thousands of services, products, and businesses across Africa. Filter by location, category, price, and ratings.',
  },
  {
    number: 2, icon: CreditCard,
    title: 'Book & pay',
    description: 'Secure your booking or order with trusted local payment methods – M-Pesa, Paystack, Flutterwave, cards, and more.',
  },
  {
    number: 3, icon: Star,
    title: 'Enjoy & review',
    description: 'Get your service or delivery, rate your experience, and help the community make better choices.',
  },
]

const VENDOR_STEPS: Step[] = [
  {
    number: 1, icon: Store,
    title: 'Create your store',
    description: 'Set up your business profile, add your services or products, and set your pricing in minutes.',
  },
  {
    number: 2, icon: BarChart3,
    title: 'Manage & grow',
    description: 'Use our dashboard to manage bookings, track orders, analyse performance, and reach more customers.',
  },
  {
    number: 3, icon: Users,
    title: 'Get paid',
    description: 'Receive payments securely through your preferred payout method. Weekly settlements with transparent fees.',
  },
]

export default function HowItWorks() {
  const [view, setView] = useState<ViewMode>('customer')

  const steps = view === 'customer' ? CUSTOMER_STEPS : VENDOR_STEPS

  return (
    <section className="border-y border-border bg-surface-secondary py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
              Simple by design
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-text-primary sm:text-4xl">
              How it works
            </h2>
          </div>
          <p className="max-w-md text-text-secondary sm:text-right">
            Whether you&apos;re a customer or a vendor, we make it simple.
          </p>
        </motion.div>

        {/* Toggle */}
        <div className="mb-12">
          <div className="inline-flex items-center rounded-full border border-border bg-surface p-1">
            {(['customer', 'vendor'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={cn(
                  'rounded-full px-6 py-2.5 text-sm font-semibold capitalize transition-all duration-200',
                  view === mode
                    ? 'bg-amber-500 text-amber-950 shadow-md'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {mode === 'vendor' && <Store className="mr-1.5 -mt-0.5 inline h-4 w-4" />}
                For {mode}s
              </button>
            ))}
          </div>
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid gap-4 md:grid-cols-3 lg:gap-6"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative rounded-2xl border border-border bg-surface p-8"
              >
                <span className="absolute right-6 top-6 font-mono text-sm font-medium text-text-tertiary">
                  {String(step.number).padStart(2, '0')}
                </span>

                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <step.icon className="h-6 w-6" />
                </div>

                <h3 className="mb-2 text-lg font-semibold tracking-[-0.01em] text-text-primary">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
