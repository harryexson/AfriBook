import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Star, Clock, Zap } from 'lucide-react'
import { getCountryConfig, formatPrice } from '@/lib/localization'
import { photoFor } from '@/lib/media/images'
import { CategoryPhotoRail, DiscoverGrid, TwinBanners, type PhotoLink } from '@/components/marketplace/HomeDiscovery'
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
import HeroMosaic from '@/components/marketplace/HeroMosaic'
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
  const isRTL = countryConfig.isRTL
  const code = countryCode

  const businessById = new Map(businesses.map((b) => [b.id, b]))
  const featured = businesses.slice(0, 8)
  const trending = services
    .filter((s) => s.available && s.price > 0)
    .slice(0, 6)
    .map((s) => ({ service: s, business: businessById.get(s.businessId) }))
    .filter((x): x is { service: Service; business: Business } => Boolean(x.business))

  // "From" prices only where the catalogue actually has a priced service in
  // that vertical — otherwise the card shows its tagline alone.
  const fromPrice = (pattern: RegExp) => {
    const priced = services.filter((s) => {
      const b = businessById.get(s.businessId)
      return s.price > 0 && b && pattern.test(`${b.category} ${b.name} ${s.name}`)
    })
    if (priced.length === 0) return undefined
    const cheapest = priced.reduce((a, b) => (b.price < a.price ? b : a))
    return formatPrice(cheapest.price, cheapest.currencyCode)
  }
  const search = (category: string) => `/${code}/search?category=${encodeURIComponent(category)}`
  const tile = (id: string, bucket: string) => photoFor(id, bucket, null, { width: 320, ratio: 0.75 })

  const rail: PhotoLink[] = [
    { label: 'Rides', href: '/rides/book', src: tile('rail-rides', 'rides'), alt: 'Car on a city street' },
    { label: 'Food delivery', href: '/food', src: '/food/grill.jpg', alt: 'Grilled skewers and sides' },
    { label: 'Stays', href: '/stays', src: tile('rail-stays-2', 'stays'), alt: 'Hotel bedroom' },
    { label: 'Home services', href: search('Home Services'), src: '/people/cleaning.jpg', alt: 'Cleaner at work in a home' },
    { label: 'Beauty & wellness', href: search('Beauty & Wellness'), src: '/people/spa.jpg', alt: 'Spa treatment' },
    { label: 'Local marketplace', href: '/marketplace', src: tile('rail-market', 'generic'), alt: 'Local shop' },
  ]

  const discover: PhotoLink[] = [
    { label: 'Restaurants', href: '/food', src: '/food/continental.jpg', alt: 'Plated restaurant dish', tagline: 'Local flavours, great vibes', fromPrice: fromPrice(/food|dining|restaurant|kitchen/i) },
    { label: 'Hotels', href: '/stays', src: tile('disc-hotels', 'stays'), alt: 'Hotel room', tagline: 'Comfortable stays, anywhere' },
    { label: 'Barber & Salon', href: search('Beauty & Wellness'), src: '/people/barber.jpg', alt: 'Barber giving a haircut', tagline: 'Look good, feel great', fromPrice: fromPrice(/barber|salon|hair|beauty/i) },
    { label: 'Photography', href: `/${code}/search?q=photography`, src: '/people/photography.jpg', alt: 'Photographer with camera', tagline: 'Capture your moments', fromPrice: fromPrice(/photo/i) },
    { label: 'Home Repair', href: search('Home Services'), src: tile('disc-repair', 'home'), alt: 'Technician at work', tagline: 'Skilled pros, trusted service', fromPrice: fromPrice(/repair|plumb|electric|clean|home/i) },
    { label: 'Fashion & Apparel', href: '/marketplace', src: '/people/tailoring.jpg', alt: 'Tailor at work', tagline: 'Pre-loved & new styles', fromPrice: fromPrice(/fashion|tailor|apparel/i) },
  ]

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="flex flex-col">
      <HeroMosaic country={countryConfig} code={code} businessCount={stats.businesses} />

      <CategoryPhotoRail items={rail} />

      <DiscoverGrid items={discover} viewAllHref={`/${code}/search`} />

      {/* Every category, kept as quiet chips so none lose their entry point. */}
      <section className="pb-16">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 sm:px-6 lg:px-8">
          {countryConfig.categories.map((cat) => (
            <Link
              key={cat}
              href={search(cat)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-text-secondary transition-colors hover:border-amber-300 hover:text-amber-700"
            >
              <CategoryIcon name={cat} className="h-4 w-4" />
              {cat}
            </Link>
          ))}
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
      <div className="pt-16 sm:pt-20">
        <TwinBanners
          events={{
            eyebrow: 'Upcoming events',
            title: 'Music. Culture. Community.',
            body: `Discover concerts, festivals and events near you in ${countryConfig.name}.`,
            cta: 'View events',
            href: '/events',
            src: photoFor('banner-events', 'events', null, { width: 360, ratio: 0.8 }),
            alt: 'Crowd at a live concert',
          }}
          vendor={{
            eyebrow: 'For sellers',
            title: 'Your talent. Your customers. Your business.',
            body: `Join ${stats.providers} vendors reaching customers across ${countryConfig.name} — list services or products in minutes.`,
            cta: 'Become a Vendor',
            href: '/sell',
            src: '/people/salon.jpg',
            alt: 'Salon owner at work',
          }}
        />
      </div>
    </div>
  )
}
