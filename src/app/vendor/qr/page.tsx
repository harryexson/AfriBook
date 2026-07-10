'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { QRCodeSVG } from 'qrcode.react'
import {
  Download, Printer, QrCode, Copy, Check, Globe,
  Utensils, Scissors, ExternalLink, Palette,
} from 'lucide-react'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

const QR_TYPES = [
  { id: 'booking', label: 'Booking Page', icon: Scissors, description: 'QR code linking to your booking page', url: 'https://afribook.com/vendor/biz-001/book' },
  { id: 'menu', label: 'Table Ordering', icon: Utensils, description: 'QR code for table ordering', url: 'https://afribook.com/vendor/biz-001/menu' },
  { id: 'profile', label: 'Business Profile', icon: Globe, description: 'QR code for your business profile', url: 'https://afribook.com/vendor/biz-001' },
]

const QR_COLORS = [
  { fg: '#000000', bg: '#FFFFFF', label: 'Classic' },
  { fg: '#F59E0B', bg: '#FFFFFF', label: 'Amber' },
  { fg: '#1E1B2E', bg: '#FFFBEB', label: 'Dark' },
  { fg: '#10B981', bg: '#FFFFFF', label: 'Green' },
  { fg: '#8B5CF6', bg: '#FFFFFF', label: 'Purple' },
]

export default function QRPage() {
  const [selectedType, setSelectedType] = useState('booking')
  const [colorScheme, setColorScheme] = useState(0)
  const [copied, setCopied] = useState(false)

  const qrType = QR_TYPES.find((t) => t.id === selectedType)
  const colors = QR_COLORS[colorScheme]

  const downloadQR = useCallback((format: 'png' | 'svg') => {
    const svgEl = document.getElementById('qr-code-display')?.querySelector('svg')
    if (!svgEl) return

    if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svgEl)
      const blob = new Blob([svgData], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `afribook-qr-${selectedType}.svg`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const svgData = new XMLSerializer().serializeToString(svgEl)
      const canvas = document.createElement('canvas')
      canvas.width = 1024
      canvas.height = 1024
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const img = new Image()
      img.onload = () => {
        ctx.fillStyle = colors.bg
        ctx.fillRect(0, 0, 1024, 1024)
        ctx.drawImage(img, 112, 112, 800, 800)
        canvas.toBlob((blob) => {
          if (!blob) return
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `afribook-qr-${selectedType}.png`
          a.click()
          URL.revokeObjectURL(url)
        }, 'image/png')
      }
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    }
  }, [selectedType, colors.bg])

  const copyLink = () => {
    if (qrType) {
      navigator.clipboard.writeText(qrType.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const printQR = () => {
    const svgEl = document.getElementById('qr-code-display')?.querySelector('svg')
    if (!svgEl) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>Print QR Code</title></head><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;margin:0;">
        <div style="text-align:center;">
          <h1 style="font-size:24px;margin-bottom:8px;">AfriBook</h1>
          <p style="color:#6B7280;margin-bottom:24px;">${qrType?.label}</p>
          <div style="margin-bottom:24px;">${svgData}</div>
          <p style="color:#9CA3AF;font-size:12px;">Scan to ${qrType?.label.toLowerCase()}</p>
        </div>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6 max-w-4xl">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">QR Codes</h1>
        <p className="text-sm text-text-secondary mt-1">Generate and download QR codes for your business</p>
      </motion.div>

      {/* QR Type selector */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {QR_TYPES.map((type) => {
          const Icon = type.icon
          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={cn(
                'p-4 rounded-2xl border-2 text-left transition-all',
                selectedType === type.id
                  ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10'
                  : 'border-border hover:border-amber-200'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
                selectedType === type.id ? 'bg-amber-500 text-white' : 'bg-surface-secondary text-text-secondary'
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-text-primary">{type.label}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{type.description}</p>
            </button>
          )
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Preview */}
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-8">
          <div className="flex flex-col items-center">
            <div id="qr-code-display" className="p-6 rounded-2xl bg-white shadow-lg mb-6">
              <QRCodeSVG
                value={qrType?.url ?? ''}
                size={240}
                bgColor={colors.bg}
                fgColor={colors.fg}
                level="H"
                imageSettings={{
                  src: '',
                  height: 0,
                  width: 0,
                  excavate: false,
                }}
              />
            </div>
            <p className="text-sm text-text-secondary text-center mb-1">{qrType?.label}</p>
            <p className="text-xs text-text-tertiary text-center">{qrType?.url}</p>
          </div>

          <div className="flex items-center gap-2 mt-6">
            <button onClick={copyLink} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </motion.div>

        {/* Customization */}
        <motion.div variants={ITEM} className="space-y-6">
          {/* Color picker */}
          <div className="rounded-2xl bg-surface border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-semibold text-text-primary">Custom Branding</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {QR_COLORS.map((color, i) => (
                <button
                  key={i}
                  onClick={() => setColorScheme(i)}
                  className={cn(
                    'w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all',
                    colorScheme === i ? 'border-amber-500 scale-110' : 'border-border hover:border-amber-200'
                  )}
                  style={{ backgroundColor: color.bg }}
                >
                  <QrCode className="w-5 h-5" style={{ color: color.fg }} />
                </button>
              ))}
            </div>
          </div>

          {/* Download options */}
          <div className="rounded-2xl bg-surface border border-border p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Download</h3>
            <div className="space-y-2">
              <button
                onClick={() => downloadQR('png')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-surface-secondary transition-colors text-left"
              >
                <Download className="w-5 h-5 text-text-secondary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Download PNG</p>
                  <p className="text-xs text-text-tertiary">High resolution, 1024x1024px</p>
                </div>
              </button>
              <button
                onClick={() => downloadQR('svg')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-surface-secondary transition-colors text-left"
              >
                <Download className="w-5 h-5 text-text-secondary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Download SVG</p>
                  <p className="text-xs text-text-tertiary">Scalable vector format</p>
                </div>
              </button>
              <button
                onClick={printQR}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-surface-secondary transition-colors text-left"
              >
                <Printer className="w-5 h-5 text-text-secondary" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Print Poster</p>
                  <p className="text-xs text-text-tertiary">Print-ready layout for your venue</p>
                </div>
              </button>
            </div>
          </div>

          {/* URL display */}
          <div className="rounded-2xl bg-surface border border-border p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-2">QR Link</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-surface-secondary text-xs text-text-secondary font-mono truncate">
                {qrType?.url}
              </code>
              <a
                href={qrType?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-text-tertiary" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
