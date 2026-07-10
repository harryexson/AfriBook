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
    title: 'Search & Discover',
    description: 'Browse thousands of services, products, and businesses across Africa. Filter by location, category, price, and ratings.',
  },
  {
    number: 2, icon: CreditCard,
    title: 'Book & Pay',
    description: 'Secure your booking or order with trusted local payment methods – M-Pesa, Paystack, Flutterwave, cards, and more.',
  },
  {
    number: 3, icon: Star,
    title: 'Enjoy & Review',
    description: 'Get your service or delivery, rate your experience, and help the community make better choices.',
  },
]

const VENDOR_STEPS: Step[] = [
  {
    number: 1, icon: Store,
    title: 'Create Your Store',
    description: 'Set up your business profile, add your services or products, and set your pricing in minutes.',
  },
  {
    number: 2, icon: BarChart3,
    title: 'Manage & Grow',
    description: 'Use our dashboard to manage bookings, track orders, analyse performance, and reach more customers.',
  },
  {
    number: 3, icon: Users,
    title: 'Get Paid',
    description: 'Receive payments securely through your preferred payout method. Weekly settlements with transparent fees.',
  },
]

export default function HowItWorks() {
  const [view, setView] = useState<ViewMode>('customer')

  const steps = view === 'customer' ? CUSTOMER_STEPS : VENDOR_STEPS

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary">
            How it works
          </h2>
          <p className="mt-3 text-text-secondary max-w-xl mx-auto">
            Whether you're a customer or a vendor, we make it simple
          </p>
        </motion.div>

        {/* Toggle */}
        <div className="flex items-center justify-center mb-12">
          <div className="inline-flex items-center p-1 rounded-xl bg-surface-secondary border border-border">
            {(['customer', 'vendor'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setView(mode)}
                className={cn(
                  'px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 capitalize',
                  view === mode
                    ? 'bg-white dark:bg-dark-100 text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {mode === 'vendor' && <Store className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
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
            className="grid md:grid-cols-3 gap-8 lg:gap-12"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 border-t-2 border-dashed border-border" />
                )}

                {/* Step number circle */}
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-500/10 mb-6">
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shadow-lg">
                    {step.number}
                  </div>
                  <step.icon className="w-10 h-10 text-amber-500" />
                </div>

                <h3 className="text-xl font-bold font-heading text-text-primary mb-3">
                  {step.title}
                </h3>
                <p className="text-text-secondary leading-relaxed max-w-sm mx-auto">
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
