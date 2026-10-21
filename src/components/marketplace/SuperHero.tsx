'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Car, Utensils, BedDouble, Sparkles, MapPin, ArrowRight } from 'lucide-react'
import { useCountry } from '@/components/shared/CountryProvider'

type TabKey = 'rides' | 'food' | 'stays' | 'services'

interface TabConfig {
  key: TabKey
  label: string
  icon: React.ComponentType<{ className?: string }>
  fieldOne: { name: string; placeholder: string }
  fieldTwo?: { name: string; placeholder: string }
  cta: string
}

const TABS: TabConfig[] = [
  {
    key: 'rides',
    label: 'Rides',
    icon: Car,
    fieldOne: { name: 'pickup', placeholder: 'Pickup location' },
    fieldTwo: { name: 'dropoff', placeholder: 'Drop-off location' },
    cta: 'Explore AfriBook',
  },
  {
    key: 'food',
    label: 'Food',
    icon: Utensils,
    fieldOne: { name: 'near', placeholder: 'Delivery address' },
    fieldTwo: { name: 'q', placeholder: 'Restaurant or cuisine' },
    cta: 'Find food',
  },
  {
    key: 'stays',
    label: 'Stays',
    icon: BedDouble,
    fieldOne: { name: 'destination', placeholder: 'Where to?' },
    fieldTwo: { name: 'dates', placeholder: 'Check-in — Check-out' },
    cta: 'Search stays',
  },
  {
    key: 'services',
    label: 'Services',
    icon: Sparkles,
    fieldOne: { name: 'q', placeholder: 'What do you need?' },
    fieldTwo: { name: 'near', placeholder: 'Your area' },
    cta: 'Browse services',
  },
]

export default function SuperHero() {
  const router = useRouter()
  const { country, countryCode } = useCountry()
  const [active, setActive] = useState<TabKey>('rides')
  const [fieldOne, setFieldOne] = useState('')
  const [fieldTwo, setFieldTwo] = useState('')

  const tab = TABS.find((t) => t.key === active)!

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const one = encodeURIComponent(fieldOne.trim())
    const two = encodeURIComponent(fieldTwo.trim())
    switch (active) {
      case 'rides':
        router.push(`/rides/book${one ? `?pickup=${one}&dropoff=${two}` : ''}`)
        break
      case 'food':
        router.push(`/food${one ? `?near=${one}&q=${two}` : ''}`)
        break
      case 'stays':
        router.push(`/stays${one ? `?destination=${one}` : ''}`)
        break
      case 'services':
        router.push(
          `/${countryCode}/search?category=${encodeURIComponent('Home Services')}${
            fieldOne ? `&q=${one}` : ''
          }`,
        )
        break
    }
  }

  function switchTab(key: TabKey) {
    setActive(key)
    setFieldOne('')
    setFieldTwo('')
  }

  return (
    <section className="relative overflow-hidden bg-surface-secondary">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-24 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:pb-20 lg:pt-28">
        {/* Copy + booking widget */}
        <div className="relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="eyebrow"
          >
            The African multi-service marketplace
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-4 text-5xl font-extrabold leading-[1.02] tracking-tight text-text-primary sm:text-6xl"
          >
            Your city,
            <br />
            all in <span className="text-gradient-terra">one place.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 max-w-md text-lg text-text-secondary"
          >
            Rides, meals, stays, services and local finds. Everything you need,
            right at your fingertips.
          </motion.p>

          {/* Booking widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 rounded-[1.75rem] border border-border bg-surface p-2 shadow-premium"
          >
            {/* Tabs */}
            <div className="flex gap-1 p-1">
              {TABS.map((t) => {
                const selected = t.key === active
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => switchTab(t.key)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                      selected
                        ? 'bg-peach text-terra-dark'
                        : 'text-text-secondary hover:bg-surface-secondary'
                    }`}
                    aria-pressed={selected}
                  >
                    <t.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                )
              })}
            </div>

            <form onSubmit={handleSubmit} className="p-3 pt-1">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-2xl border border-border bg-surface-secondary px-3.5 py-3">
                  <MapPin className="h-4 w-4 shrink-0 text-terra" />
                  <input
                    value={fieldOne}
                    onChange={(e) => setFieldOne(e.target.value)}
                    placeholder={tab.fieldOne.placeholder}
                    className="w-full min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
                    aria-label={tab.fieldOne.placeholder}
                  />
                </label>
                {tab.fieldTwo && (
                  <label className="flex items-center gap-2 rounded-2xl border border-border bg-surface-secondary px-3.5 py-3">
                    <MapPin className="h-4 w-4 shrink-0 text-text-tertiary" />
                    <input
                      value={fieldTwo}
                      onChange={(e) => setFieldTwo(e.target.value)}
                      placeholder={tab.fieldTwo.placeholder}
                      className="w-full min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
                      aria-label={tab.fieldTwo.placeholder}
                    />
                  </label>
                )}
              </div>
              <button
                type="submit"
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-terra px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-terra-dark"
              >
                {tab.cta}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </motion.div>

          <p className="mt-4 text-xs text-text-tertiary">
            Serving {country.flag} {country.name} · Prices shown in{' '}
            {country.currency.code} ({country.currency.symbol})
          </p>
        </div>

        {/* Photo collage */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative hidden lg:block"
        >
          <div className="grid grid-cols-5 grid-rows-6 gap-3 h-[520px]">
            <div className="col-span-3 row-span-6 overflow-hidden rounded-[1.75rem] shadow-lg">
              <img
                src="/people/rides.jpg"
                alt="A professional driver ready for your trip"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="col-span-2 row-span-3 overflow-hidden rounded-[1.75rem] shadow-lg">
              <img
                src="/food/local.jpg"
                alt="Freshly prepared local meals"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="col-span-2 row-span-3 overflow-hidden rounded-[1.75rem] shadow-lg">
              <img
                src="/people/spa.jpg"
                alt="Relaxing stays and wellness services"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Floating caption card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="absolute -bottom-5 left-1/2 w-[260px] -translate-x-1/2 rounded-2xl border border-border bg-surface/95 p-4 shadow-premium backdrop-blur"
          >
            <p className="text-sm font-bold text-text-primary">
              More than a marketplace.
            </p>
            <p className="mt-0.5 text-xs text-text-secondary">
              A better way to live.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Category strip */}
      <CategoryStrip countryCode={countryCode} />
    </section>
  )
}

const STRIP = [
  { label: 'Rides', img: '/people/rides.jpg', href: '/rides' },
  { label: 'Food delivery', img: '/food/streetfood.jpg', href: '/food' },
  { label: 'Stays', img: '/food/continental.jpg', href: '/stays' },
  { label: 'Home services', img: '/people/cleaning.jpg', category: 'Home Services' },
  { label: 'Beauty & wellness', img: '/people/salon.jpg', category: 'Beauty & Wellness' },
  { label: 'Local marketplace', img: '/people/community.jpg', href: '/marketplace/products' },
]

function CategoryStrip({ countryCode }: { countryCode: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {STRIP.map((item) => {
          const href =
            item.href ??
            `/${countryCode}/search?category=${encodeURIComponent(item.category ?? '')}`
          return (
            <Link key={item.label} href={href} className="group text-center">
              <div className="aspect-square overflow-hidden rounded-[1.5rem] shadow-sm ring-1 ring-border">
                <img
                  src={item.img}
                  alt={item.label}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <p className="mt-2.5 text-sm font-semibold text-text-primary transition-colors group-hover:text-terra">
                {item.label}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
