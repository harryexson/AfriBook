'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  PenLine,
  Loader2,
  ShieldCheck,
  Clock,
  Mail,
} from 'lucide-react'
import { getAgreementBySlug } from '@/lib/legal-agreements'

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

interface SignedInfo {
  name: string
  date: string
}

interface LegalAgreementRendererProps {
  slug: string
  signable?: boolean
}

export default function LegalAgreementRenderer({
  slug,
  signable = false,
}: LegalAgreementRendererProps) {
  const [agree, setAgree] = useState(false)
  const [fullName, setFullName] = useState('')
  const [signing, setSigning] = useState(false)
  const [signedInfo, setSignedInfo] = useState<SignedInfo | null>(null)
  const [authRequired, setAuthRequired] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const doc = getAgreementBySlug(slug)
  if (!doc) return null

  const consentType = 'host_agreement'

  useEffect(() => {
    if (!signable) return
    let cancelled = false

    async function checkSigned() {
      try {
        const res = await fetch('/api/consents')
        if (!res.ok) {
          if (res.status === 401) setAuthRequired(true)
          return
        }
        const data = await res.json()
        const rows = Array.isArray(data.consents) ? data.consents : []
        const hostConsent = rows.find((c: { consent_type?: string }) => c.consent_type === consentType)
        if (hostConsent?.granted && !cancelled) {
          setSignedInfo({
            name: hostConsent.metadata?.fullName ?? '—',
            date: hostConsent.granted_at ? new Date(hostConsent.granted_at).toLocaleDateString() : '—',
          })
        }
      } catch {
        // ignore network errors; signing can still be attempted
      }
    }

    checkSigned()
    return () => {
      cancelled = true
    }
  }, [signable])

  const handleSign = useCallback(async () => {
    setErrorMsg(null)
    if (!agree) {
      setErrorMsg('Please tick the box to confirm you have read and agreed to the terms.')
      return
    }
    if (fullName.trim().length < 2) {
      setErrorMsg('Please type your full name as your digital signature.')
      return
    }

    setSigning(true)
    try {
      const res = await fetch('/api/consents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consents: [
            {
              consentType,
              granted: true,
              context: 'host-agreement-signature',
              consentVersion: doc.lastUpdated,
              metadata: {
                document: 'host-agreement',
                fullName: fullName.trim(),
                signatureType: 'typed',
              },
            },
          ],
        }),
      })

      if (res.status === 401) {
        setAuthRequired(true)
        setErrorMsg('You must be signed in to sign the agreement.')
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setErrorMsg(data?.error ?? 'Failed to record your signature. Please try again.')
        return
      }

      setSignedInfo({
        name: fullName.trim(),
        date: new Date().toLocaleDateString(),
      })
      setAgree(false)
      setFullName('')
    } catch {
      setErrorMsg('Network error. Please try again.')
    } finally {
      setSigning(false)
    }
  }, [agree, fullName, doc.lastUpdated])

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
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

      {/* Important notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5 }}
        className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 mb-10"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Important Notice</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              This is a legally binding document. {signable
                ? 'By signing below you confirm that you have read, understood and agree to all terms outlined, including the liability limits, waivers, hold-harmless provisions and compliance obligations. If you do not agree, do not list a property on AfriBook Stayscape.'
                : 'Please read this document carefully. Continued use of the relevant AfriBook service constitutes acceptance of these terms.'}
            </p>
          </div>
        </div>
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
          {signable && (
            <a
              href="#sign"
              className="text-sm text-amber-600 hover:text-amber-700 transition-colors py-1 font-medium"
            >
              Review &amp; Sign
            </a>
          )}
        </nav>
      </motion.div>

      {/* Content Sections */}
      <div className="space-y-12">
        {doc.sections.map((section, index) => (
          <motion.section
            key={section.id}
            custom={index}
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
              {section.content.map((block, bi) => (
                <div key={bi} className="space-y-3">
                  {block.heading && (
                    <h3 className="text-lg font-semibold text-text-primary font-heading">
                      {block.heading}
                    </h3>
                  )}
                  {block.body && <p>{block.body}</p>}
                  {block.list && block.list.length > 0 && (
                    <ul className="list-disc pl-6 space-y-2">
                      {block.list.map((item, li) => (
                        <li key={li}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {block.callout && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-sm text-amber-800 dark:text-amber-300">
                      {block.callout}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      {/* Review & Sign */}
      {signable && (
        <motion.section
          id="sign"
          initial={{ opacity: 0, y: 20 }}
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={sectionVariants}
          className="scroll-mt-24 mt-14"
        >
          <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl font-bold text-text-primary font-heading">Review &amp; Sign</h2>
            </div>
            <p className="text-sm text-text-secondary mb-6">
              {signedInfo
                ? 'You have signed this agreement. Your signature and acceptance date are recorded below.'
                : 'To complete your Host registration, review the terms above and sign this agreement. Signing is your legal acknowledgment of the terms and conditions.'}
            </p>

            {signedInfo ? (
              <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    Agreement signed
                  </p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                    Signed by <span className="font-semibold">{signedInfo.name}</span> on{' '}
                    {signedInfo.date}. Your signature is stored securely and can be viewed by our
                    compliance team.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {authRequired && (
                  <div className="p-4 rounded-xl bg-surface-secondary border border-border text-sm text-text-secondary mb-5">
                    You must be signed in to sign the agreement.{' '}
                    <Link href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
                      Sign in
                    </Link>{' '}
                    or{' '}
                    <Link href="/register" className="text-amber-600 hover:text-amber-700 font-medium">
                      create an account
                    </Link>{' '}
                    to record your signature.
                  </div>
                )}

                <div className="space-y-5">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm text-text-secondary">
                      I have read, understood, and agree to the{' '}
                      <span className="font-semibold text-text-primary">{doc.title}</span>, including
                      the service fees, cancellation policy, regulatory compliance obligations,
                      limitations of liability, waivers, and hold-harmless provisions.
                    </span>
                  </label>

                  <div>
                    <label
                      htmlFor="digital-signature"
                      className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-2"
                    >
                      Digital Signature (Type your full name)
                    </label>
                    <input
                      id="digital-signature"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Amina Okafor"
                      autoComplete="name"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-text-primary placeholder:text-text-tertiary transition-all"
                    />
                    <p className="text-xs text-text-tertiary mt-2">
                      Typing your name constitutes an electronic signature equivalent to a handwritten
                      signature. Your name, IP address and the date and time of signing will be
                      recorded.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    onClick={handleSign}
                    disabled={signing}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {signing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing...
                      </>
                    ) : (
                      <>
                        <PenLine className="w-4 h-4" />
                        Sign Agreement
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.section>
      )}

      {/* Contact */}
      <div className="border-t border-border pt-8 mt-12">
        <div className="flex items-start gap-3 p-5 rounded-xl bg-surface-secondary border border-border-light">
          <Mail className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-text-primary">Questions about this agreement?</p>
            <p className="text-sm text-text-secondary">
              Contact us at{' '}
              <a href="mailto:legal@afribook.app" className="text-amber-500 hover:underline">
                legal@afribook.app
              </a>{' '}
              or visit our{' '}
              <Link href="/support" className="text-amber-500 hover:underline">
                support center
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
