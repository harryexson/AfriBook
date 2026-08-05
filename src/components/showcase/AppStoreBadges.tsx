'use client'

import { QrCode } from 'lucide-react'
import { cn } from '@/lib/utils'

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
    </svg>
  )
}

interface AppStoreBadgesProps {
  className?: string
  onDark?: boolean
  showQr?: boolean
}

export default function AppStoreBadges({
  className,
  onDark = true,
  showQr = false,
}: AppStoreBadgesProps) {
  const pillClass = cn(
    'flex items-center gap-3 rounded-xl px-5 py-3 text-left transition-colors cursor-pointer',
    onDark
      ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
      : 'bg-dark-300 text-white hover:bg-dark-400'
  )

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row', className)}>
      <a href="#" className={pillClass}>
        <AppleIcon className="h-6 w-6" />
        <div>
          <p className="text-[10px] leading-tight opacity-70">Download on the</p>
          <p className="text-sm font-semibold leading-tight">App Store</p>
        </div>
      </a>
      <a href="#" className={pillClass}>
        <PlayIcon className="h-6 w-6" />
        <div>
          <p className="text-[10px] leading-tight opacity-70">Get it on</p>
          <p className="text-sm font-semibold leading-tight">Google Play</p>
        </div>
      </a>
      {showQr && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl border px-4 py-3',
            onDark ? 'border-white/15 bg-white/5' : 'border-border bg-surface-secondary'
          )}
        >
          <QrCode
            className={cn('h-7 w-7', onDark ? 'text-white/70' : 'text-text-tertiary')}
          />
          <div>
            <p className={cn('text-xs font-semibold', onDark ? 'text-white' : 'text-text-primary')}>
              Scan to download
            </p>
            <p
              className={cn(
                'text-[10px]',
                onDark ? 'text-white/50' : 'text-text-secondary'
              )}
            >
              Camera → QR code
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
