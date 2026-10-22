'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

/** Small one-time entrances retain the reading order without delaying input. */
export default function EditorialMotion({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return <motion.div className={className} initial={false} whileInView={reduce ? {} : { opacity: [0.7, 1], y: [8, 0] }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>
}
