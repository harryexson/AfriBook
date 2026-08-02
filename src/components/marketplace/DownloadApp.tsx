'use client'

import { motion } from 'framer-motion'
import { Globe, Smartphone, MapPin, Bell, QrCode, ArrowUpRight } from 'lucide-react'

const FEATURES = [
  { icon: Smartphone, title: 'Book on the go', description: 'Reserve services and order products from anywhere' },
  { icon: MapPin, title: 'Real-time tracking', description: 'Track your rides, deliveries, and service providers live' },
  { icon: Bell, title: 'Push notifications', description: 'Get instant updates on bookings, orders, and promotions' },
]

export default function DownloadApp() {
  return (
    <section className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center lg:justify-start"
          >
            <div className="relative">
              {/* Phone frame */}
              <div className="relative h-[560px] w-[280px] overflow-hidden rounded-[3rem] border border-white/10 bg-dark-300 shadow-2xl">
                {/* Notch */}
                <div className="absolute left-1/2 top-0 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-dark-100" />
                {/* Screen */}
                <div className="absolute inset-0 m-1.5 overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-dark-200 to-dark-500">
                  <div className="flex h-full flex-col p-6 pt-12">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-gold">
                        <Globe className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-white">AfriBook</span>
                    </div>

                    <div className="mt-8">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-400">
                        Good evening
                      </p>
                      <p className="mt-1 text-xl font-semibold text-white">
                        What do you need today?
                      </p>
                    </div>

                    {/* Search pill */}
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                      <span className="text-xs text-white/40">Search services, products, rides...</span>
                    </div>

                    {/* Category row */}
                    <div className="mt-5 space-y-2.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`h-9 w-9 shrink-0 rounded-lg ${i % 2 ? 'bg-amber-500/20' : 'bg-white/10'}`} />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-2.5 rounded-full bg-white/15" style={{ width: `${65 + i * 10}%` }} />
                            <div className="h-2 rounded-full bg-white/10" style={{ width: `${40 + i * 8}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-auto flex items-center justify-between rounded-xl bg-gradient-gold px-4 py-3">
                      <div>
                        <p className="text-[10px] font-medium text-amber-100">Your ride arrives in</p>
                        <p className="text-sm font-bold text-white">12 min</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating rating card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute -right-10 bottom-16 hidden rounded-2xl border border-border bg-surface p-4 shadow-xl sm:block"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">Lagos → Accra</p>
                    <p className="text-xs text-text-secondary">Delivery en route</p>
                  </div>
                </div>
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
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
              Mobile app
            </p>
            <h2 className="mb-4 text-3xl font-semibold tracking-[-0.02em] text-text-primary sm:text-4xl">
              The marketplace in your pocket
            </h2>
            <p className="mb-8 max-w-md text-text-secondary">
              Book services, order products, request rides, and track everything in
              real time — wherever you are.
            </p>

            {/* Features */}
            <div className="mb-8 space-y-5">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{feature.title}</p>
                    <p className="text-sm text-text-secondary">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Download buttons */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="#"
                className="flex items-center gap-3 rounded-xl bg-dark-300 px-6 py-3.5 text-white transition-colors hover:bg-dark-400 dark:bg-dark-100 dark:hover:bg-dark-200"
              >
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                <div>
                  <p className="text-xs text-white/60">Download on the</p>
                  <p className="text-sm font-semibold">App Store</p>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 rounded-xl bg-dark-300 px-6 py-3.5 text-white transition-colors hover:bg-dark-400 dark:bg-dark-100 dark:hover:bg-dark-200"
              >
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
                <div>
                  <p className="text-xs text-white/60">Get it on</p>
                  <p className="text-sm font-semibold">Google Play</p>
                </div>
              </a>
            </div>

            {/* QR code placeholder */}
            <div className="flex items-center gap-4 rounded-xl border border-border bg-surface-secondary p-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-white dark:bg-dark-100">
                <QrCode className="h-8 w-8 text-text-tertiary" />
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
