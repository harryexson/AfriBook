'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { AlertTriangle, Clock, FileText } from 'lucide-react'
import type { AgreementDoc } from '@/lib/legal-agreements'

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

interface NavLink {
  title: string
  href: string
}

export default function LegalAgreementView({
  doc,
  prev,
  next,
}: {
  doc: AgreementDoc
  prev?: NavLink
  next?: NavLink
}) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Legal</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-heading">
              {doc.title}
            </h1>
          </div>
        </div>
        <p className="text-sm text-text-secondary max-w-2xl">{doc.subtitle}</p>
        <div className="flex items-center gap-4 text-sm text-text-secondary mt-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>Last updated: {doc.lastUpdated}</span>
          </div>
          <span className="text-text-tertiary">|</span>
          <span>Effective: {doc.effectiveDate}</span>
        </div>
      </motion.div>

      {/* Intro */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5 }}
        className="mb-10 prose prose-sm max-w-none text-text-secondary space-y-4"
      >
        {doc.intro.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </motion.div>

      {/* Table of Contents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mb-12 p-6 rounded-2xl bg-surface border border-border"
      >
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
          Table of Contents
        </h2>
        <nav className="grid sm:grid-cols-2 gap-2">
          {doc.sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="text-sm text-text-secondary hover:text-amber-600 transition-colors py-1"
            >
              {section.title}
            </a>
          ))}
        </nav>
      </motion.div>

      {/* Content Sections */}
      <div className="space-y-12">
        {doc.sections.map((section, i) => (
          <motion.section
            key={section.id}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={sectionVariants}
            id={section.id}
            className="scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-4">
              <section.icon className="w-5 h-5 text-amber-500 shrink-0" />
              <h2 className="text-2xl font-bold text-text-primary font-heading">{section.title}</h2>
            </div>
            <div className="prose prose-sm max-w-none text-text-secondary space-y-4">
              {section.content.map((block, j) => (
                <div key={j}>
                  {block.callout ? (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-text-primary leading-relaxed">{block.callout}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {block.heading && (
                        <h3 className="text-lg font-semibold text-text-primary font-heading">
                          {block.heading}
                        </h3>
                      )}
                      {block.body && <p>{block.body}</p>}
                      {block.list && (
                        <ul className="list-disc pl-6 space-y-2">
                          {block.list.map((item, k) => (
                            <li key={k}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      {/* Navigation */}
      <div className="mt-16 pt-8 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {prev ? (
            <Link
              href={prev.href}
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              &larr; {prev.title}
            </Link>
          ) : (
            <Link
              href="/vendor/legal"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              &larr; Legal Center
            </Link>
          )}
          {next ? (
            <Link
              href={next.href}
              className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
            >
              {next.title} &rarr;
            </Link>
          ) : (
            <Link
              href="/vendor/legal"
              className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
            >
              Legal Center &rarr;
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
