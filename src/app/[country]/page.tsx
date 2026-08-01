import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Search, MapPin, Star, Users, ShoppingBag, ArrowRight,
  TrendingUp, Sparkles, Clock, ChevronRight, Store, Heart, Calendar, Zap,
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
function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    'Home Services': Store, 'Healthcare': Heart, 'Education': TrendingUp, 'Technology': Zap,
    'Food & Dining': Clock, 'Beauty & Wellness': Sparkles, 'Automotive': Search, 'Legal & Financial': Store,
    'Real Estate': MapPin, 'Entertainment': Star, 'Fashion & Tailoring': Sparkles, 'Agriculture': TrendingUp,
    'Transportation': ArrowRight, 'Tourism': MapPin, 'Logistics': ShoppingBag, 'Tutoring': Users,
    'Event Planning': Star, 'Fitness': TrendingUp,
  }
  const Icon = icons[name] ?? Store
  return <Icon className={cn('w-6 h-6', className)} />
}

// ─── Promos (currency aware, deterministic) ──────────────────
function getCountryPromos(country: CountryConfig): PromoConfig[] {
  const symbol = country.currency.symbol
  return [
    { title: '20% off first booking', desc: 'Use code on your first service booking', code: 'WELCOME20', gradient: 'from-amber-500 to-orange-500' },
    { title: 'Free delivery', desc: 'On all orders above the minimum order value', code: 'FREEDEL', gradient: 'from-emerald-500 to-teal-500' },
    { title: 'Refer a friend', desc: `Earn ${symbol}500 for each friend who signs up and books`, code: 'REFER', gradient: 'from-purple-500 to-violet-500' },
    { title: 'Weekend special', desc: 'Flat 15% off on all beauty & wellness bookings on weekends', code: 'WEEKEND15', gradient: 'from-pink-500 to-rose-500' },
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
      <section className={cn('relative min-h-[80vh] flex items-center bg-gradient-to-br', heroGradient)}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl">{countryConfig.flag}</span>
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading text-white leading-tight">
                  Welcome to {countryConfig.name}
                </h1>
                <p className="text-xl text-white/80 mt-2 max-w-xl">
                  Find and book trusted local services in {countryConfig.name}.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href={`/${code}/search`}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-text-primary font-semibold hover:bg-white/90 transition-all shadow-lg group"
              >
                <Search className="w-5 h-5" />
                Browse services in {countryConfig.name}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href={`/${code}/search?category=${encodeURIComponent('Beauty & Wellness')}`}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm text-white font-semibold border border-white/25 hover:bg-white/20 transition-all"
              >
                <Calendar className="w-5 h-5" />
                Book ahead
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
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary">
                Browse by category
              </h2>
              <p className="mt-2 text-text-secondary">
                Find services available in {countryConfig.name}
              </p>
            </div>
            <Link
              href={`/${code}/search`}
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-amber-500 hover:text-amber-600 transition-colors"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {countryConfig.categories.map((cat) => (
              <Link
                key={cat}
                href={`/${code}/search?category=${encodeURIComponent(cat)}`}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-surface-secondary border border-border hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">
                  <CategoryIcon name={cat} />
                </div>
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
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary">
                Featured in {countryConfig.name}
              </h2>
              <p className="mt-2 text-text-secondary">
                Top-rated businesses near you
              </p>
            </div>
            <Link
              href={`/${code}/search`}
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-amber-500 hover:text-amber-600 transition-colors"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

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
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary">
                  Trending services
                </h2>
                <p className="mt-2 text-text-secondary">
                  Book instantly in {countryConfig.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {trending.map(({ service, business }) => (
                <Link
                  key={service.id}
                  href={`/${code}/book/${service.businessId}/${service.id}`}
                  className="group flex items-start gap-4 p-5 rounded-2xl bg-surface border border-border hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
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
                  <span className="text-sm font-bold text-text-primary shrink-0">
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
    </div>
  )
}
