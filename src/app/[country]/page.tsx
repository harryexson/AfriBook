'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Search, MapPin, Star, Users, ShoppingBag, ArrowRight,
  TrendingUp, Sparkles, Clock, ChevronRight, Store,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getCountryConfig } from '@/lib/localization'
import type { CountryConfig } from '@/lib/localization/countries'
import BusinessCard from '@/components/marketplace/BusinessCard'
import type { Business } from '@/types'

const COUNTRY_BUSINESSES: Record<string, Business[]> = {
  NG: [
    { id: 'ng-1', name: 'Lagos Fresh Market', description: 'Premium fresh produce delivered to your doorstep. We source directly from local farmers across Nigeria to bring you the freshest fruits, vegetables, and organic goods.', category: 'Food & Dining', countryCode: 'NG', ownerId: '', address: { street: '12 Ahmadu Bello Way', city: 'Lagos', state: 'Lagos', postalCode: '100001', countryCode: 'NG', formatted: '12 Ahmadu Bello Way, Lagos', geoPoint: { latitude: 6.5244, longitude: 3.3792 } }, location: { latitude: 6.5244, longitude: 3.3792 }, contact: { phone: '+234 800 123 4567', email: 'hello@lagosfreshmarket.ng' }, media: { galleryUrls: [] }, hours: [{ day: 'mon', open: '07:00', close: '20:00', isClosed: false }, { day: 'tue', open: '07:00', close: '20:00', isClosed: false }, { day: 'wed', open: '07:00', close: '20:00', isClosed: false }, { day: 'thu', open: '07:00', close: '20:00', isClosed: false }, { day: 'fri', open: '07:00', close: '21:00', isClosed: false }, { day: 'sat', open: '08:00', close: '21:00', isClosed: false }, { day: 'sun', open: '09:00', close: '18:00', isClosed: false }], status: 'active', rating: 4.8, reviewCount: 234, qrBookingUrl: '', tags: ['groceries', 'fresh', 'organic', 'delivery'], deliveryAvailable: true, deliveryRadiusKm: 15, minimumOrder: 2000, commissionRate: 0.08, createdAt: '', updatedAt: '' },
    { id: 'ng-2', name: 'Lekki Beauty Studio', description: 'Full-service beauty salon offering hairstyling, makeup, nails, and skincare treatments.', category: 'Beauty & Wellness', countryCode: 'NG', ownerId: '', address: { street: '45 Admiralty Way', city: 'Lekki', state: 'Lagos', postalCode: '100005', countryCode: 'NG', formatted: '45 Admiralty Way, Lekki, Lagos', geoPoint: { latitude: 6.4281, longitude: 3.4219 } }, location: { latitude: 6.4281, longitude: 3.4219 }, contact: { phone: '+234 800 987 6543', email: 'book@lekki-beauty.ng' }, media: { galleryUrls: [] }, hours: [{ day: 'mon', open: '08:00', close: '19:00', isClosed: false }, { day: 'tue', open: '08:00', close: '19:00', isClosed: false }, { day: 'wed', open: '08:00', close: '19:00', isClosed: false }, { day: 'thu', open: '08:00', close: '19:00', isClosed: false }, { day: 'fri', open: '08:00', close: '20:00', isClosed: false }, { day: 'sat', open: '09:00', close: '18:00', isClosed: false }, { day: 'sun', open: '00:00', close: '00:00', isClosed: true }], status: 'active', rating: 4.9, reviewCount: 189, qrBookingUrl: '', tags: ['salon', 'beauty', 'hair', 'nails'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '' },
    { id: 'ng-3', name: 'Abuja Tech Hub', description: 'Computer repairs, IT consulting, web development, and digital services for businesses and individuals.', category: 'Technology', countryCode: 'NG', ownerId: '', address: { street: '10 Shehu Shagari Way', city: 'Abuja', state: 'FCT', postalCode: '900001', countryCode: 'NG', formatted: '10 Shehu Shagari Way, Abuja', geoPoint: { latitude: 9.0579, longitude: 7.4951 } }, location: { latitude: 9.0579, longitude: 7.4951 }, contact: { phone: '+234 800 555 1234', email: 'info@abujatech.ng' }, media: { galleryUrls: [] }, hours: [{ day: 'mon', open: '09:00', close: '18:00', isClosed: false }, { day: 'tue', open: '09:00', close: '18:00', isClosed: false }, { day: 'wed', open: '09:00', close: '18:00', isClosed: false }, { day: 'thu', open: '09:00', close: '18:00', isClosed: false }, { day: 'fri', open: '09:00', close: '17:00', isClosed: false }, { day: 'sat', open: '10:00', close: '15:00', isClosed: false }, { day: 'sun', open: '00:00', close: '00:00', isClosed: true }], status: 'active', rating: 4.7, reviewCount: 98, qrBookingUrl: '', tags: ['tech', 'repairs', 'consulting', 'web'], deliveryAvailable: true, deliveryRadiusKm: 10, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '' },
    { id: 'ng-4', name: 'Lagos Fashion House', description: 'Bespoke tailoring, ready-to-wear African fashion, and custom designs.', category: 'Fashion & Tailoring', countryCode: 'NG', ownerId: '', address: { street: '22 Awolowo Road', city: 'Lagos', state: 'Lagos', postalCode: '100002', countryCode: 'NG', formatted: '22 Awolowo Road, Ikoyi, Lagos', geoPoint: { latitude: 6.4478, longitude: 3.4323 } }, location: { latitude: 6.4478, longitude: 3.4323 }, contact: { phone: '+234 800 333 4444', email: 'style@lagosfashion.ng' }, media: { galleryUrls: [] }, hours: [{ day: 'mon', open: '09:00', close: '19:00', isClosed: false }, { day: 'tue', open: '09:00', close: '19:00', isClosed: false }, { day: 'wed', open: '09:00', close: '19:00', isClosed: false }, { day: 'thu', open: '09:00', close: '19:00', isClosed: false }, { day: 'fri', open: '09:00', close: '20:00', isClosed: false }, { day: 'sat', open: '09:00', close: '18:00', isClosed: false }, { day: 'sun', open: '00:00', close: '00:00', isClosed: true }], status: 'active', rating: 4.6, reviewCount: 142, qrBookingUrl: '', tags: ['fashion', 'tailoring', 'african', 'bespoke'], deliveryAvailable: true, deliveryRadiusKm: 5, minimumOrder: 5000, commissionRate: 0.1, createdAt: '', updatedAt: '' },
  ],
  KE: [
    { id: 'ke-1', name: 'Nairobi Beauty Studio', description: 'Premium beauty and wellness services including hairstyling, makeup, massage, and skincare.', category: 'Beauty & Wellness', countryCode: 'KE', ownerId: '', address: { street: '100 Moi Avenue', city: 'Nairobi', state: 'Nairobi', postalCode: '00100', countryCode: 'KE', formatted: '100 Moi Avenue, Nairobi', geoPoint: { latitude: -1.2864, longitude: 36.8172 } }, location: { latitude: -1.2864, longitude: 36.8172 }, contact: { phone: '+254 700 123 456', email: 'hello@nairobi-beauty.ke' }, media: { galleryUrls: [] }, hours: [{ day: 'mon', open: '08:00', close: '20:00', isClosed: false }, { day: 'tue', open: '08:00', close: '20:00', isClosed: false }, { day: 'wed', open: '08:00', close: '20:00', isClosed: false }, { day: 'thu', open: '08:00', close: '20:00', isClosed: false }, { day: 'fri', open: '08:00', close: '21:00', isClosed: false }, { day: 'sat', open: '09:00', close: '19:00', isClosed: false }, { day: 'sun', open: '10:00', close: '16:00', isClosed: false }], status: 'active', rating: 4.9, reviewCount: 312, qrBookingUrl: '', tags: ['beauty', 'salon', 'wellness', 'spa'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '' },
    { id: 'ke-2', name: 'Mama Mboga Farm Fresh', description: 'Farm-to-table organic produce delivered straight from Kiambu farms to your kitchen.', category: 'Food & Dining', countryCode: 'KE', ownerId: '', address: { street: '50 Kenyatta Market', city: 'Nairobi', state: 'Nairobi', postalCode: '00200', countryCode: 'KE', formatted: '50 Kenyatta Market, Nairobi', geoPoint: { latitude: -1.2921, longitude: 36.8219 } }, location: { latitude: -1.2921, longitude: 36.8219 }, contact: { phone: '+254 711 222 333', email: 'orders@mamamboga.ke' }, media: { galleryUrls: [] }, hours: [{ day: 'mon', open: '06:00', close: '18:00', isClosed: false }, { day: 'tue', open: '06:00', close: '18:00', isClosed: false }, { day: 'wed', open: '06:00', close: '18:00', isClosed: false }, { day: 'thu', open: '06:00', close: '18:00', isClosed: false }, { day: 'fri', open: '06:00', close: '19:00', isClosed: false }, { day: 'sat', open: '06:00', close: '17:00', isClosed: false }, { day: 'sun', open: '07:00', close: '14:00', isClosed: false }], status: 'active', rating: 4.7, reviewCount: 189, qrBookingUrl: '', tags: ['organic', 'farm', 'groceries', 'fresh'], deliveryAvailable: true, deliveryRadiusKm: 20, minimumOrder: 500, commissionRate: 0.08, createdAt: '', updatedAt: '' },
    { id: 'ke-3', name: 'M-Pesa Tech Solutions', description: 'Mobile money integration, fintech consulting, and digital payment solutions for businesses.', category: 'Technology', countryCode: 'KE', ownerId: '', address: { street: '5 Upper Hill Road', city: 'Nairobi', state: 'Nairobi', postalCode: '00300', countryCode: 'KE', formatted: '5 Upper Hill Road, Nairobi', geoPoint: { latitude: -1.3005, longitude: 36.8154 } }, location: { latitude: -1.3005, longitude: 36.8154 }, contact: { phone: '+254 722 444 555', email: 'info@mpesa-tech.ke' }, media: { galleryUrls: [] }, hours: [{ day: 'mon', open: '08:00', close: '17:00', isClosed: false }, { day: 'tue', open: '08:00', close: '17:00', isClosed: false }, { day: 'wed', open: '08:00', close: '17:00', isClosed: false }, { day: 'thu', open: '08:00', close: '17:00', isClosed: false }, { day: 'fri', open: '08:00', close: '16:00', isClosed: false }, { day: 'sat', open: '00:00', close: '00:00', isClosed: true }, { day: 'sun', open: '00:00', close: '00:00', isClosed: true }], status: 'active', rating: 4.8, reviewCount: 76, qrBookingUrl: '', tags: ['fintech', 'mobile', 'payments', 'consulting'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '' },
  ],
  GH: [
    { id: 'gh-1', name: 'Accra Fashion House', description: 'Contemporary African fashion, bespoke tailoring, and ready-to-wear collections.', category: 'Fashion & Tailoring', countryCode: 'GH', ownerId: '', address: { street: '15 Oxford Street', city: 'Accra', state: 'Greater Accra', postalCode: 'GA001', countryCode: 'GH', formatted: '15 Oxford Street, Osu, Accra', geoPoint: { latitude: 5.5557, longitude: -0.2011 } }, location: { latitude: 5.5557, longitude: -0.2011 }, contact: { phone: '+233 30 123 4567', email: 'hello@accrafashion.gh' }, media: { galleryUrls: [] }, hours: [{ day: 'mon', open: '09:00', close: '19:00', isClosed: false }, { day: 'tue', open: '09:00', close: '19:00', isClosed: false }, { day: 'wed', open: '09:00', close: '19:00', isClosed: false }, { day: 'thu', open: '09:00', close: '19:00', isClosed: false }, { day: 'fri', open: '09:00', close: '20:00', isClosed: false }, { day: 'sat', open: '09:00', close: '18:00', isClosed: false }, { day: 'sun', open: '12:00', close: '16:00', isClosed: false }], status: 'active', rating: 4.6, reviewCount: 142, qrBookingUrl: '', tags: ['fashion', 'tailoring', 'african', 'couture'], deliveryAvailable: true, deliveryRadiusKm: 10, minimumOrder: 200, commissionRate: 0.1, createdAt: '', updatedAt: '' },
    { id: 'gh-2', name: 'Kumasi AgroConnect', description: 'Connecting farmers with buyers. Fresh cocoa, cashew, maize, and vegetables from the Ashanti Region.', category: 'Agriculture', countryCode: 'GH', ownerId: '', address: { street: 'Kejetia Market Rd', city: 'Kumasi', state: 'Ashanti', postalCode: 'AK001', countryCode: 'GH', formatted: 'Kejetia Market Rd, Kumasi', geoPoint: { latitude: 6.6985, longitude: -1.6235 } }, location: { latitude: 6.6985, longitude: -1.6235 }, contact: { phone: '+233 50 987 6543', email: 'info@kumasiagro.gh' }, media: { galleryUrls: [] }, hours: [{ day: 'mon', open: '06:00', close: '17:00', isClosed: false }, { day: 'tue', open: '06:00', close: '17:00', isClosed: false }, { day: 'wed', open: '06:00', close: '17:00', isClosed: false }, { day: 'thu', open: '06:00', close: '17:00', isClosed: false }, { day: 'fri', open: '06:00', close: '16:00', isClosed: false }, { day: 'sat', open: '06:00', close: '15:00', isClosed: false }, { day: 'sun', open: '00:00', close: '00:00', isClosed: true }], status: 'active', rating: 4.5, reviewCount: 87, qrBookingUrl: '', tags: ['agriculture', 'farming', 'cocoa', 'organic'], deliveryAvailable: true, deliveryRadiusKm: 50, minimumOrder: 1000, commissionRate: 0.05, createdAt: '', updatedAt: '' },
  ],
}

const COUNTRY_STATS: Record<string, { businesses: string; bookings: string; users: string }> = {
  NG: { businesses: '12,500+', bookings: '85,000+', users: '450,000+' },
  KE: { businesses: '8,200+', bookings: '52,000+', users: '280,000+' },
  GH: { businesses: '5,100+', bookings: '31,000+', users: '175,000+' },
}

const HERO_GRADIENTS: Record<string, string> = {
  NG: 'from-green-600 to-emerald-800',
  KE: 'from-red-600 to-amber-800',
  GH: 'from-yellow-600 to-red-800',
  ZA: 'from-blue-600 to-indigo-800',
  EG: 'from-red-700 to-amber-900',
  TZ: 'from-cyan-600 to-teal-800',
  UG: 'from-yellow-700 to-orange-800',
  MW: 'from-red-600 to-green-800',
  US: 'from-blue-600 to-indigo-800',
  GB: 'from-blue-700 to-red-800',
  IN: 'from-orange-600 to-green-800',
  AE: 'from-red-600 to-amber-800',
  DE: 'from-yellow-700 to-red-800',
  FR: 'from-blue-600 to-red-800',
}

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    'Home Services': Store, 'Healthcare': Heart, 'Education': TrendingUp, 'Technology': ShoppingBag,
    'Food & Dining': Clock, 'Beauty & Wellness': Sparkles, 'Automotive': Search, 'Legal & Financial': Store,
    'Real Estate': MapPin, 'Entertainment': Star, 'Fashion & Tailoring': Sparkles, 'Agriculture': TrendingUp,
    'Transportation': ArrowRight, 'Tourism': MapPin, 'Logistics': ShoppingBag, 'Tutoring': Users,
    'Event Planning': Star,
  }
  const Icon = icons[name] ?? Store
  return <Icon className={cn('w-6 h-6', className)} />
}

export default function CountryHomePage() {
  const params = useParams()
  const countryCode = (params?.country as string)?.toUpperCase() ?? 'NG'
  const country = getCountryConfig(countryCode) as CountryConfig | undefined

  if (!country) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">Country not found</h1>
          <p className="text-text-secondary mt-2">We don&apos;t support this region yet.</p>
          <Link href="/" className="mt-4 inline-flex text-amber-500 hover:text-amber-600 font-medium">
            Go home
          </Link>
        </div>
      </div>
    )
  }

  const businesses = COUNTRY_BUSINESSES[countryCode] ?? []
  const stats = COUNTRY_STATS[countryCode] ?? { businesses: '5,000+', bookings: '20,000+', users: '100,000+' }
  const heroGradient = HERO_GRADIENTS[countryCode] ?? 'from-amber-600 to-amber-800'
  const isRTL = country.isRTL

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="flex flex-col">
      {/* Hero Section */}
      <section className={cn(
        'relative min-h-[80vh] flex items-center bg-gradient-to-br',
        heroGradient,
      )}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl">{country.flag}</span>
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading text-white leading-tight">
                  Welcome to {country.name}
                </h1>
                <p className="text-xl text-white/80 mt-2 max-w-xl">
                  Find and book trusted local services in {country.name}.
                </p>
              </div>
            </div>

            <Link
              href={`/${params.country}/search`}
              className="inline-flex items-center gap-2 mt-6 px-6 py-3.5 rounded-xl bg-white text-text-primary font-semibold hover:bg-white/90 transition-all shadow-lg group"
            >
              <Search className="w-5 h-5" />
              Browse services in {country.name}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-3 gap-6 mt-16 max-w-lg"
          >
            {[
              { icon: Store, label: 'Businesses', value: stats.businesses },
              { icon: ShoppingBag, label: 'Bookings', value: stats.bookings },
              { icon: Users, label: 'Users', value: stats.users },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm mx-auto mb-2">
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/70">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-10"
          >
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary">
                Browse by category
              </h2>
              <p className="mt-2 text-text-secondary">
                Find services available in {country.name}
              </p>
            </div>
            <Link
              href={`/${params.country}/search`}
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-amber-500 hover:text-amber-600 transition-colors"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div
            variants={CONTAINER_VARIANTS}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {country.categories.map((cat) => (
              <motion.div key={cat} variants={ITEM_VARIANTS}>
                <Link
                  href={`/${params.country}/search?category=${encodeURIComponent(cat)}`}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-surface-secondary border border-border hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">
                    <CategoryIcon name={cat} />
                  </div>
                  <span className="text-sm font-semibold text-text-primary text-center group-hover:text-amber-500 transition-colors">
                    {cat}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-16 sm:py-20 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-10"
          >
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary">
                Featured in {country.name}
              </h2>
              <p className="mt-2 text-text-secondary">
                Top-rated businesses near you
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {businesses.slice(0, 4).map((b, i) => (
              <BusinessCard key={b.id} business={b} countryCode={countryCode} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Local Promotions */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary">
              Local promotions
            </h2>
            <p className="mt-2 text-text-secondary">
              Exclusive deals in {country.name}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: '20% off first booking', desc: 'Use code WELCOME20 on your first service booking', gradient: 'from-amber-500 to-orange-500' },
              { title: 'Free delivery', desc: 'On all orders above the minimum order value', gradient: 'from-emerald-500 to-teal-500' },
              { title: 'Refer a friend', desc: 'Earn {currency} 500 for each friend who signs up and books', gradient: 'from-purple-500 to-violet-500' },
              { title: 'Weekend special', desc: 'Flat 15% off on all beauty & wellness bookings on weekends', gradient: 'from-pink-500 to-rose-500' },
            ].map((promo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  'relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-br text-white',
                  promo.gradient
                )}
              >
                <div className="relative z-10">
                  <h3 className="text-xl font-bold">{promo.title}</h3>
                  <p className="text-white/80 mt-1 text-sm">{promo.desc}</p>
                  <button className="mt-4 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white text-sm font-semibold hover:bg-white/30 transition-colors">
                    Claim offer
                  </button>
                </div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-white/5" />
                <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-white/5" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
