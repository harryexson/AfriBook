import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Star, Users, ShoppingBag, ArrowRight,
  Clock, Calendar, Zap, Store,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCountryConfig, formatPrice } from '@/lib/localization'
import type { CountryConfig } from '@/lib/localization/countries'
import {
  getCountryBusinesses,
  getCountryServices,
  getCountryStats,
  getAllCountryCodes,
} from '@/lib/countries-data'
import BusinessCard from '@/components/marketplace/BusinessCard'
import PromoCard, { type PromoConfig } from '@/components/marketplace/PromoCard'
import CategoryIcon from '@/components/marketplace/CategoryIcon'
import IconTile from '@/components/ui/IconTile'
import SectionHeader from '@/components/ui/SectionHeader'
import CtaBanner from '@/components/marketplace/CtaBanner'
import type { Business, Service } from '@/types'

export function generateStaticParams() {
  return getAllCountryCodes().map((code) => ({ country: code }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>
}): Promise<Metadata> {
  const { country } = await params
  const countryConfig = getCountryConfig(country.toUpperCase())
  if (!countryConfig) return {}

  const description = `Book trusted local services, order products, request rides, and get deliveries in ${countryConfig.name}. Join ${countryConfig.flag} ${countryConfig.name} on AfriBook.`

  return {
    title: `${countryConfig.name} — Services, Bookings & Delivery`,
    description,
    keywords: [
      countryConfig.name,
      `${countryConfig.name} services`,
      `${countryConfig.name} booking`,
      `${countryConfig.name} delivery`,
      'AfriBook',
      'local services',
    ],
    openGraph: {
      title: `${countryConfig.name} on AfriBook`,
      description,
      type: 'website',
      locale: 'en_US',
      siteName: 'AfriBook',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${countryConfig.name} on AfriBook`,
      description,
    },
  }
}

// ─── Hero treatment (site-wide amber/dark brand) ──────────────
const HERO_GRADIENT = 'from-amber-600 via-amber-700 to-dark-800'

// ─── Category icons ───────────────────────────────────────────
// One distinct icon per category — previously five icons (Store, Sparkles,
// MapPin, Star, TrendingUp) were each reused across 2-3 unrelated
// categories, which made the category grid hard to scan at a glance.
// ─── Promos (currency aware, deterministic) ──────────────────
function getCountryPromos(country: CountryConfig): PromoConfig[] {
  const symbol = country.currency.symbol
  // One accent, four depths — not four unrelated hues. Consistent with the
  // single-accent rule in design-system/afribook/MASTER.md.
  return [
    { title: '20% off first booking', desc: 'Use code on your first service booking', code: 'WELCOME20', gradient: 'from-amber-400 to-amber-600' },
    { title: 'Free delivery', desc: 'On all orders above the minimum order value', code: 'FREEDEL', gradient: 'from-amber-500 to-amber-700' },
    { title: 'Refer a friend', desc: `Earn ${symbol}500 for each friend who signs up and books`, code: 'REFER', gradient: 'from-amber-600 to-dark-300' },
    { title: 'Weekend special', desc: 'Flat 15% off on all beauty & wellness bookings on weekends', code: 'WEEKEND15', gradient: 'from-amber-300 to-amber-500' },
  ]
}

export default async function CountryHomePage({
  params,
}: {
  params: Promise<{ country: string }>
}) {
  const { country } = await params
  const countryCode = country.toUpperCase()
  const countryConfig = getCountryConfig(countryCode) as CountryConfig | undefined

  if (!countryConfig) notFound()

  const businesses = getCountryBusinesses(countryCode)
  const services = getCountryServices(countryCode)
  const stats = getCountryStats(countryCode)
  const heroGradient = HERO_GRADIENT
  const isRTL = countryConfig.isRTL
  const code = countryCode

  const businessById = new Map(businesses.map((b) => [b.id, b]))
  const featured = businesses.slice(0, 8)
  const trending = services
    .filter((s) => s.available && s.price > 0)
    .slice(0, 6)
    .map((s) => ({ service: s, business: businessById.get(s.businessId) }))
    .filter((x): x is { service: Service; business: Business } => Boolean(x.business))

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="flex flex-col">
      {/* Hero Section */}
      <section className={cn('relative min-h-[80vh] flex items-center bg-gradient-to-br overflow-hidden', heroGradient)}>
        {/* Signature motif: a routed path connecting stops, not a stock grid.
            Stands in for the rides/delivery/booking "something is en route"
            idea that recurs across the product (see MASTER.md signature
            element). Static by default; animates only if motion is allowed. */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.18] motion-reduce:opacity-[0.12]"
          viewBox="0 0 1200 600"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <path
            d="M -50 480 C 180 480, 220 220, 420 220 S 640 60, 860 140 S 1120 120, 1260 260"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeDasharray="2 14"
            strokeLinecap="round"
          />
          {[
            { cx: 420, cy: 220 },
            { cx: 860, cy: 140 },
          ].map((p) => (
            <circle key={`${p.cx}-${p.cy}`} cx={p.cx} cy={p.cy} r="5" fill="white" />
          ))}
        </svg>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl">{countryConfig.flag}</span>
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading text-white leading-[1.05] tracking-tight text-balance">
                  Services, rides, and deliveries in {countryConfig.name} — one app, local prices
                </h1>
                <p className="text-xl text-white/80 mt-3 max-w-xl">
                  Book a trusted business, request a ride, or get something delivered, all priced in {countryConfig.currency.code}.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href={`/${code}/search`}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-text-primary font-semibold hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg group"
              >
                <Search className="w-5 h-5" />
                Browse services in {countryConfig.name}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/rides/book"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold border border-white/25 hover:bg-white/20 active:scale-[0.98] transition-all"
              >
                <Calendar className="w-5 h-5" />
                Request a ride
              </Link>
            </div>

            <p className="mt-4 text-sm text-white/70 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              {businesses.length}+ vetted businesses &middot; Instant booking &middot; Secure local payments
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 max-w-2xl">
            {[
              { icon: Store, label: 'Businesses', value: stats.businesses },
              { icon: ShoppingBag, label: 'Bookings', value: stats.bookings },
              { icon: Users, label: 'Users', value: stats.users },
              { icon: Clock, label: 'Rides & Delivery', value: stats.deliveries },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm mx-auto mb-2">
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold font-mono tabular-nums text-white">{s.value}</p>
                <p className="text-xs text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Browse by category"
            subtitle={`Find services available in ${countryConfig.name}`}
            viewAllHref={`/${code}/search`}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {countryConfig.categories.map((cat) => (
              <Link
                key={cat}
                href={`/${code}/search?category=${encodeURIComponent(cat)}`}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-surface-secondary border border-border hover:border-amber-500/30 transition-colors duration-200"
              >
                <IconTile size="lg">
                  <CategoryIcon name={cat} />
                </IconTile>
                <span className="text-sm font-semibold text-text-primary text-center group-hover:text-amber-500 transition-colors">
                  {cat}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-16 sm:py-20 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title={`Featured in ${countryConfig.name}`}
            subtitle="Top-rated businesses near you"
            viewAllHref={`/${code}/search`}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featured.map((b, i) => (
              <BusinessCard key={b.id} business={b} countryCode={code} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Services */}
      {trending.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Trending services"
              subtitle={`Book instantly in ${countryConfig.name}`}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {trending.map(({ service, business }) => (
                <Link
                  key={service.id}
                  href={`/${code}/book/${service.businessId}/${service.id}`}
                  className="group flex items-start gap-4 p-5 rounded-2xl bg-surface border border-border hover:border-amber-500/30 transition-colors duration-200"
                >
                  <IconTile icon={Zap} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
                      {business.name}
                    </span>
                    <h3 className="text-base font-bold text-text-primary mt-0.5 group-hover:text-amber-500 transition-colors">
                      {service.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {business.rating.toFixed(1)}
                      </span>
                      {service.duration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {service.duration} min
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold font-mono tabular-nums text-text-primary shrink-0">
                    {formatPrice(service.price, service.currencyCode)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Local Promotions */}
      <section className="py-16 sm:py-20 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary">
              Local promotions
            </h2>
            <p className="mt-2 text-text-secondary">
              Exclusive deals in {countryConfig.name}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {getCountryPromos(countryConfig).map((promo) => (
              <PromoCard key={promo.title} promo={promo} />
            ))}
          </div>
        </div>
      </section>

      {/* Vendor recruitment — previously nowhere on the highest-traffic
          page in the app; /sell exists but nothing on the homepage ever
          pointed to it. Stats are the real per-country numbers already
          computed above (getCountryStats), not invented figures. */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CtaBanner
            icon={Store}
            eyebrow="Sell on AfriBook"
            title={`Grow your business in ${countryConfig.name}`}
            description={`Join ${stats.providers} vendors already reaching customers across ${countryConfig.name} on AfriBook — list your services or products in minutes.`}
            ctaLabel="Become a Vendor"
            ctaHref="/sell"
            stats={[
              { label: 'Active vendors', value: stats.providers },
              { label: 'Bookings so far', value: stats.bookings },
            ]}
          />
        </div>
      </section>
    </div>
  )
}
