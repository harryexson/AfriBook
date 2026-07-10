'use client'

import { motion } from 'framer-motion'
import { Globe, Smartphone, MapPin, Bell, QrCode } from 'lucide-react'
import { cn } from '@/lib/utils'

const FEATURES = [
  { icon: Smartphone, title: 'Book on the go', description: 'Reserve services and order products from anywhere' },
  { icon: MapPin, title: 'Real-time tracking', description: 'Track your rides, deliveries, and service providers live' },
  { icon: Bell, title: 'Push notifications', description: 'Get instant updates on bookings, orders, and promotions' },
]

export default function DownloadApp() {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative">
              {/* Phone frame */}
              <div className="w-[280px] h-[560px] rounded-[3rem] bg-dark-300 border-4 border-dark-100 shadow-2xl relative overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-dark-100 rounded-b-2xl z-10" />
                {/* Screen */}
                <div className="absolute inset-0 m-1.5 rounded-[2.5rem] bg-gradient-to-b from-amber-500 to-dark-300 overflow-hidden">
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                    <Globe className="w-12 h-12 text-white/80 mb-4" />
                    <p className="text-white text-center text-lg font-bold font-heading">AfriBook</p>
                    <p className="text-white/60 text-center text-xs mt-2">Your all-in-one app</p>
                    <div className="mt-6 space-y-2 w-full px-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-3 rounded-full bg-white/10" style={{ width: `${60 + i * 10}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-4 -right-4 bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg"
              >
                #1 in Africa
              </motion.div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary mb-4">
              Get the AfriBook app
            </h2>
            <p className="text-text-secondary mb-8 max-w-md">
              Download the app to book services, order products, request rides, and track everything in real time.
            </p>

            {/* Features */}
            <div className="space-y-5 mb-8">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{feature.title}</p>
                    <p className="text-sm text-text-secondary">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Download buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <a
                href="#"
                className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-dark-300 dark:bg-dark-100 text-white hover:bg-dark-400 transition-colors"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                <div>
                  <p className="text-xs text-white/60">Download on the</p>
                  <p className="text-sm font-semibold">App Store</p>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-dark-300 dark:bg-dark-100 text-white hover:bg-dark-400 transition-colors"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
                <div>
                  <p className="text-xs text-white/60">Get it on</p>
                  <p className="text-sm font-semibold">Google Play</p>
                </div>
              </a>
            </div>

            {/* QR code placeholder */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-secondary border border-border">
              <div className="w-16 h-16 rounded-lg bg-white dark:bg-dark-100 flex items-center justify-center border border-border">
                <QrCode className="w-8 h-8 text-text-tertiary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Scan to download</p>
                <p className="text-xs text-text-secondary">Point your camera at the QR code</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
