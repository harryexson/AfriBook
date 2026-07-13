'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ChevronDown, ChevronUp, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContentConsentBannerProps {
  type: 'vendor' | 'customer'
  onAccept: () => void
  onCancel: () => void
  compact?: boolean
}

const VENDOR_LEGAL_TEXT = `1. Content Ownership & Rights
I confirm that I own all rights, titles, and interests in the photos, videos, and any other content I upload to AfriBook, or I have obtained proper written authorization from the rights holder to upload and display such content on the platform.

2. Customer Consent
I confirm that I have obtained explicit, informed, and voluntary consent from every customer or individual depicted in the content I upload. This includes consent for the content to be displayed on AfriBook's platform, website, mobile applications, and affiliated social media pages for promotional and marketing purposes.

3. Voluntary Posting
I understand that posting content on AfriBook is entirely voluntary and of my own free will. AfriBook does not require, coerce, or incentivize the posting of any content.

4. Liability & Indemnification
I accept full legal responsibility for all content I post on AfriBook. AfriBook, its owners, directors, employees, affiliates, partners, and agents are NOT responsible and CANNOT be held liable for any claims, damages, losses, expenses, or liabilities arising from my content. I agree to indemnify, defend, and hold harmless AfriBook from any and all claims, demands, actions, or proceedings brought by any third party in connection with my content.

5. No Claims Against Platform
I agree that I will NOT sue, bring legal action, or file any complaint against AfriBook, its owners, directors, employees, or affiliates for any content I post, or that others post, on the platform or its affiliated social media pages. I expressly waive any and all such claims.

6. Content Standards
I warrant that my content will not contain material that is inappropriate, illegal, defamatory, obscene, harassing, threatening, discriminatory, or otherwise in violation of any applicable law or regulation. AfriBook reserves the right to remove any content that violates these standards without notice.

7. License Grant
I grant AfriBook a non-exclusive, worldwide, royalty-free, perpetual, transferable, and sublicensable license to use, reproduce, display, distribute, modify, and promote my content across all AfriBook platforms, marketing materials, and social media channels.

8. right to Remove
I understand that AfriBook reserves the right to remove any content at its sole discretion, without prior notice or explanation, and that I will have no claim against the platform for such removal.

9. Updates to Terms
I acknowledge that these terms may be updated from time to time, and my continued use of the platform constitutes acceptance of any changes.`

const CUSTOMER_LEGAL_TEXT = `1. Content Ownership
I confirm that I own all rights to the photos and videos I upload, or I have proper authorization. I have the legal authority to grant the licenses described in this agreement.

2. Voluntary Posting
I understand that posting content on AfriBook is entirely voluntary and of my own free will. No one has asked, required, or coerced me to post this content.

3. Liability
I accept full legal responsibility for all content I post. AfriBook, its owners, directors, employees, and affiliates are NOT responsible and CANNOT be held liable for any claims, damages, or losses arising from my content. This includes but is not limited to defamation, privacy violations, intellectual property infringement, or any other legal claim.

4. No Claims Against Platform
I agree that I will NOT sue or bring legal action against AfriBook or its owners for any content I or others post on the platform or its social media pages. I expressly and irrevocably waive any and all such claims to the fullest extent permitted by law.

5. Indemnification
I agree to indemnify, defend, and hold harmless AfriBook, its owners, directors, employees, and affiliates from any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorney's fees) arising from my content or my breach of this agreement.

6. Consent for Others
If I post content featuring other people, I confirm I have their explicit, informed, and voluntary consent for the content to be displayed on AfriBook and its affiliated platforms for promotional purposes.

7. Content Standards
My content will not contain inappropriate, illegal, misleading, defamatory, obscene, harassing, threatening, or discriminatory material. I understand AfriBook may remove content that violates these standards.

8. License
I grant AfriBook a non-exclusive, royalty-free, worldwide, perpetual, and transferable license to display, reproduce, modify, distribute, and promote my content across all AfriBook platforms, marketing materials, and social media channels.`

export default function ContentConsentBanner({
  type,
  onAccept,
  onCancel,
  compact = false,
}: ContentConsentBannerProps) {
  const [expanded, setExpanded] = useState(!compact)
  const [check1, setCheck1] = useState(false)
  const [check2, setCheck2] = useState(false)

  const legalText = type === 'vendor' ? VENDOR_LEGAL_TEXT : CUSTOMER_LEGAL_TEXT
  const bothChecked = check1 && check2

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-amber-500/30 bg-amber-500/5 overflow-hidden"
    >
      <div className="flex items-center gap-3 p-4">
        <div className="p-2 rounded-xl bg-amber-500/10 shrink-0">
          <Shield className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-text-primary font-heading">
            Content Posting Agreement
          </h4>
          {compact && !expanded && (
            <p className="text-xs text-text-secondary mt-0.5 truncate">
              Please review and accept the content consent terms before posting.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg hover:bg-surface-secondary text-text-secondary transition-colors shrink-0"
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-4 pb-4 space-y-4">
              <div className="max-h-48 overflow-y-auto rounded-xl bg-surface-secondary border border-border p-4">
                <div className="space-y-3">
                  {legalText.split('\n\n').map((section, i) => {
                    const parts = section.split('\n')
                    const title = parts[0]
                    const body = parts.slice(1).join(' ')
                    return (
                      <div key={i}>
                        <p className="text-xs font-semibold text-text-primary">{title}</p>
                        {body && (
                          <p className="text-xs text-text-secondary leading-relaxed mt-0.5">
                            {body}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={check1}
                    onChange={(e) => setCheck1(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500/30 shrink-0"
                  />
                  <span className="text-xs text-text-primary leading-relaxed group-hover:text-amber-600 transition-colors">
                    {type === 'vendor'
                      ? 'I confirm I have obtained consent from all persons depicted in this content, and I have the legal authority to upload and display this content.'
                      : 'I confirm I have obtained consent from all persons depicted in this content'}
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={check2}
                    onChange={(e) => setCheck2(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border text-amber-500 focus:ring-amber-500/30 shrink-0"
                  />
                  <span className="text-xs text-text-primary leading-relaxed group-hover:text-amber-600 transition-colors">
                    I accept full legal responsibility for this content and release AfriBook from
                    any liability
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={onAccept}
                  disabled={!bothChecked}
                  className={cn(
                    'flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                    bothChecked
                      ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                      : 'bg-surface-tertiary text-text-tertiary cursor-not-allowed',
                  )}
                >
                  I Agree &amp; Post
                </motion.button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!expanded && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onAccept}
              disabled={!bothChecked}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                bothChecked
                  ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
                  : 'bg-surface-tertiary text-text-tertiary cursor-not-allowed',
              )}
            >
              I Agree &amp; Post
            </motion.button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
