import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: {
    template: '%s | AfriBook Legal',
    default: 'AfriBook Legal',
  },
}

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Top bar */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-text-primary font-heading">
                AfriBook
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-text-tertiary">
              &copy; {new Date().getFullYear()} AfriBook. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-text-tertiary">
              <Link href="/legal/terms" className="hover:text-text-secondary transition-colors">
                Terms
              </Link>
              <Link href="/legal/privacy" className="hover:text-text-secondary transition-colors">
                Privacy
              </Link>
              <Link href="/legal/cookies" className="hover:text-text-secondary transition-colors">
                Cookies
              </Link>
              <Link href="/legal/vendor" className="hover:text-text-secondary transition-colors">
                Vendor
              </Link>
              <Link href="/legal/guidelines" className="hover:text-text-secondary transition-colors">
                Guidelines
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
