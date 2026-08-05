'use client'

import { motion, type Variants } from 'framer-motion'
import { Check } from 'lucide-react'
import PhoneMockup from '@/components/showcase/PhoneMockup'
import AppStoreBadges from '@/components/showcase/AppStoreBadges'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

export interface ShowcaseScreen {
  label: string
  node: React.ReactNode
  glow?: 'amber' | 'blue' | 'violet' | 'emerald' | 'rose' | 'none'
}

interface SuperAppShowcaseProps {
  eyebrow?: string
  title: React.ReactNode
  subtitle?: string
  bullets?: string[]
  screens: ShowcaseScreen[]
}

export default function SuperAppShowcase({
  eyebrow,
  title,
  subtitle,
  bullets,
  screens,
}: SuperAppShowcaseProps) {
  return (
    <section className="relative overflow-hidden bg-dark-600 py-20 sm:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(56rem_56rem_at_80%_-10%,rgba(245,158,11,0.12),transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(40rem_40rem_at_-10%_100%,rgba(14,12,18,0.6),transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto max-w-3xl text-center"
        >
          {eyebrow && (
            <motion.p
              variants={itemVariants}
              className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400"
            >
              {eyebrow}
            </motion.p>
          )}
          <motion.h2
            variants={itemVariants}
            className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl"
          >
            {title}
          </motion.h2>
          {subtitle && (
            <motion.p
              variants={itemVariants}
              className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/60"
            >
              {subtitle}
            </motion.p>
          )}
          {bullets && bullets.length > 0 && (
            <motion.ul variants={itemVariants} className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-2 text-sm text-white/80">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20">
                    <Check className="h-3 w-3 text-amber-400" />
                  </span>
                  {bullet}
                </li>
              ))}
            </motion.ul>
          )}
          <motion.div variants={itemVariants} className="mt-9 flex justify-center">
            <AppStoreBadges onDark showQr />
          </motion.div>
        </motion.div>

        {/* App wall */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="mt-16"
        >
          <div className="flex snap-x snap-mandatory gap-8 overflow-x-auto pb-6 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
            {screens.map((screen, i) => (
              <motion.div
                key={screen.label}
                variants={itemVariants}
                className={`shrink-0 snap-center ${i % 2 === 0 ? 'translate-y-6' : ''}`}
              >
                <PhoneMockup glow={screen.glow}>{screen.node}</PhoneMockup>
                <p className="mt-5 text-center text-sm font-semibold text-white/80">
                  {screen.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
