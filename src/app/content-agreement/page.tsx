'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Globe, ArrowLeft, ChevronRight, AlertTriangle } from 'lucide-react'

const AGREEMENT_SECTIONS = [
  {
    num: 1,
    title: 'Customer Consent Required',
    text: 'I certify that I have obtained explicit written consent from every customer depicted in any photo, video, or image I upload to AfriBook. I understand that posting images of customers without their consent is a violation of their privacy rights and may result in legal action against me.',
  },
  {
    num: 2,
    title: 'Content Ownership',
    text: 'I confirm that I own all rights to the content I upload, or I have obtained proper licenses and permissions. I grant AfriBook a non-exclusive, royalty-free license to display, promote, and market this content across the platform and its social media channels.',
  },
  {
    num: 3,
    title: 'Before & After Content',
    text: 'I understand that before/after photos of customers require specific written consent from the customer acknowledging that their images will be used for marketing purposes.',
  },
  {
    num: 4,
    title: 'Liability & Responsibility',
    text: 'I accept full legal responsibility for all content I post on AfriBook. I understand that AfriBook, its owners, directors, employees, and affiliates are NOT responsible for, and cannot be held liable for, any claims, damages, losses, or legal actions arising from my content.',
  },
  {
    num: 5,
    title: 'Indemnification',
    text: 'I agree to indemnify, defend, and hold harmless AfriBook and its owners from any claims, liabilities, damages, or expenses arising from my content or my use of the platform.',
  },
  {
    num: 6,
    title: 'Content Standards',
    text: 'I agree that my content will not contain: nudity, violence, hate speech, misleading information, copyrighted material I don\'t own, or content that violates any applicable laws.',
  },
  {
    num: 7,
    title: 'Voluntary Posting',
    text: 'I understand that all content I post is voluntary and of my own free will. No one at AfriBook has compelled, forced, or coerced me to post any content.',
  },
  {
    num: 8,
    title: 'Right to Remove',
    text: 'I understand that AfriBook reserves the right to remove any content that violates these terms or community guidelines, without prior notice.',
  },
  {
    num: 9,
    title: 'No Warranty',
    text: 'I understand that AfriBook makes no guarantees about the results of posting content, including but not limited to customer acquisition, bookings, or revenue.',
  },
  {
    num: 10,
    title: 'Governing Law',
    text: 'This agreement is governed by the laws of the jurisdiction in which AfriBook operates.',
  },
]

export default function ContentAgreementPage() {
  const [activeSection, setActiveSection] = useState(1)

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-text-primary font-heading">AfriBook</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
          {/* Sidebar — Table of Contents */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
                Contents
              </p>
              {AGREEMENT_SECTIONS.map((section) => (
                <button
                  key={section.num}
                  onClick={() => {
                    setActiveSection(section.num)
                    document.getElementById(`section-${section.num}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    activeSection === section.num
                      ? 'bg-amber-50 text-amber-700 font-medium'
                      : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                  }`}
                >
                  <ChevronRight className="w-3 h-3 shrink-0" />
                  <span className="truncate">{section.num}. {section.title}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">Legal Document</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-heading">
                  Vendor Content Posting Agreement
                </h1>
                <div className="flex items-center gap-4 text-sm text-text-tertiary">
                  <span>Last updated: January 1, 2026</span>
                  <span className="w-1 h-1 rounded-full bg-text-tertiary" />
                  <span>Effective immediately upon acceptance</span>
                </div>
              </div>

              {/* Important notice */}
              <div className="p-5 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">Important Notice</p>
                    <p className="text-sm text-amber-700 mt-1">
                      This agreement is a legally binding document. By checking the acceptance boxes during
                      vendor onboarding, you acknowledge that you have read, understood, and agree to all
                      terms outlined below. If you do not agree, do not upload any content to AfriBook.
                    </p>
                  </div>
                </div>
              </div>

              {/* Agreement sections */}
              <div className="space-y-8">
                {AGREEMENT_SECTIONS.map((section) => (
                  <section
                    key={section.num}
                    id={`section-${section.num}`}
                    className="scroll-mt-24"
                  >
                    <div className="space-y-2">
                      <h2 className="text-lg font-bold text-text-primary">
                        <span className="text-amber-500 mr-2">{section.num}.</span>
                        {section.title}
                      </h2>
                      <p className="text-sm text-text-secondary leading-relaxed pl-7">
                        {section.text}
                      </p>
                    </div>
                  </section>
                ))}
              </div>

              {/* Footer note */}
              <div className="border-t border-border pt-8">
                <div className="flex items-start gap-3 p-5 rounded-xl bg-surface-secondary border border-border-light">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-text-primary">Questions about this agreement?</p>
                    <p className="text-sm text-text-secondary">
                      Contact us at{' '}
                      <a href="mailto:legal@afribook.com" className="text-amber-500 hover:underline">
                        legal@afribook.com
                      </a>{' '}
                      or visit our{' '}
                      <Link href="/help" className="text-amber-500 hover:underline">
                        support center
                      </Link>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Back to home */}
              <div className="text-center pb-8">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to home
                </Link>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  )
}
