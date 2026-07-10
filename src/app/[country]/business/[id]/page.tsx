'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, MapPin, Clock, Phone, Mail, Globe, ChevronLeft, ChevronRight,
  Share2, Heart, ThumbsUp, MessageCircle, Calendar, Users, Scissors,
  ShoppingBag, Timer, Map, X, Check,
} from 'lucide-react'
import Link from 'next/link'
import { cn, formatCurrency } from '@/lib/utils'
import { getCountryConfig } from '@/lib/localization'
import type { CountryConfig } from '@/lib/localization/countries'
import ServiceCard from '@/components/marketplace/ServiceCard'
import ReviewForm from '@/components/marketplace/ReviewForm'
import type { Business, Service, Review, Staff } from '@/types'

const MOCK_BUSINESS: Business = {
  id: 'b1', name: 'Lagos Fresh Market', description: 'Premium fresh produce delivered to your doorstep. We source directly from local farmers across Nigeria to bring you the freshest fruits, vegetables, and organic goods. Established in 2020, we have served over 10,000 happy customers across Lagos.', category: 'Food & Dining', countryCode: 'NG', ownerId: '',
  address: { street: '12 Ahmadu Bello Way', city: 'Lagos', state: 'Lagos', postalCode: '100001', countryCode: 'NG', formatted: '12 Ahmadu Bello Way, Victoria Island, Lagos', geoPoint: { latitude: 6.5244, longitude: 3.3792 } },
  location: { latitude: 6.5244, longitude: 3.3792 },
  contact: { phone: '+234 800 123 4567', email: 'hello@lagosfreshmarket.ng', website: 'https://lagosfreshmarket.ng', socialLinks: { instagram: '@lagosfreshmarket' } },
  media: { logoUrl: '', coverUrl: '', galleryUrls: [] },
  hours: [
    { day: 'mon', open: '07:00', close: '20:00', isClosed: false }, { day: 'tue', open: '07:00', close: '20:00', isClosed: false },
    { day: 'wed', open: '07:00', close: '20:00', isClosed: false }, { day: 'thu', open: '07:00', close: '20:00', isClosed: false },
    { day: 'fri', open: '07:00', close: '21:00', isClosed: false }, { day: 'sat', open: '08:00', close: '21:00', isClosed: false },
    { day: 'sun', open: '09:00', close: '18:00', isClosed: false },
  ],
  status: 'active', rating: 4.8, reviewCount: 234, qrBookingUrl: '', tags: ['groceries', 'fresh', 'organic', 'delivery', 'farm'],
  deliveryAvailable: true, deliveryRadiusKm: 15, minimumOrder: 2000, commissionRate: 0.08, createdAt: '', updatedAt: '',
}

const MOCK_SERVICES: Service[] = [
  { id: 's1', businessId: 'b1', name: 'Fresh Produce Box', description: 'Assorted seasonal fruits and vegetables - enough for a family of 4 for a week.', duration: 30, price: 3500, currencyCode: 'NGN', category: 'Food & Dining', available: true, maxCapacityPerSlot: 10, paddingMinutes: 0, createdAt: '', updatedAt: '' },
  { id: 's2', businessId: 'b1', name: 'Premium Fruit Basket', description: 'Curated selection of premium imported and local fruits in a gift basket.', duration: 20, price: 8000, currencyCode: 'NGN', category: 'Food & Dining', available: true, maxCapacityPerSlot: 5, paddingMinutes: 0, createdAt: '', updatedAt: '' },
  { id: 's3', businessId: 'b1', name: 'Weekly Meal Prep Pack', description: 'Pre-portioned ingredients for 7 days of healthy Nigerian meals.', duration: 45, price: 15000, currencyCode: 'NGN', category: 'Food & Dining', available: true, maxCapacityPerSlot: 3, paddingMinutes: 5, createdAt: '', updatedAt: '' },
  { id: 's4', businessId: 'b1', name: 'Organic Vegetable Bundle', description: 'Fresh organic vegetables sourced from local farms.', duration: 15, price: 2500, currencyCode: 'NGN', category: 'Food & Dining', available: true, maxCapacityPerSlot: 20, paddingMinutes: 0, createdAt: '', updatedAt: '' },
]

const MOCK_STAFF: Staff[] = [
  { id: 'st1', businessId: 'b1', userId: '', name: 'Adebayo Ola', role: 'Senior Farmer', email: 'ade@lagosfreshmarket.ng', phone: '+234 800 111 2222', avatarUrl: '', schedule: [{ day: 'mon', start: '07:00', end: '15:00', isAvailable: true }, { day: 'tue', start: '07:00', end: '15:00', isAvailable: true }, { day: 'wed', start: '07:00', end: '15:00', isAvailable: true }, { day: 'thu', start: '07:00', end: '15:00', isAvailable: true }, { day: 'fri', start: '07:00', end: '14:00', isAvailable: true }, { day: 'sat', start: '08:00', end: '13:00', isAvailable: true }, { day: 'sun', start: '00:00', end: '00:00', isAvailable: false }], serviceIds: ['s1', 's2'], isActive: true, bio: 'Over 15 years of experience in organic farming and produce selection.', rating: 4.9, createdAt: '', updatedAt: '' },
  { id: 'st2', businessId: 'b1', userId: '', name: 'Chioma Eze', role: 'Produce Specialist', email: 'chioma@lagosfreshmarket.ng', phone: '+234 800 333 4444', avatarUrl: '', schedule: [{ day: 'mon', start: '09:00', close: '17:00', isAvailable: true }, { day: 'tue', start: '09:00', close: '17:00', isAvailable: true }, { day: 'wed', start: '09:00', close: '17:00', isAvailable: true }, { day: 'thu', start: '09:00', close: '17:00', isAvailable: true }, { day: 'fri', start: '09:00', close: '16:00', isAvailable: true }, { day: 'sat', start: '10:00', close: '15:00', isAvailable: true }, { day: 'sun', start: '00:00', close: '00:00', isAvailable: false }], serviceIds: ['s3', 's4'], isActive: true, bio: 'Expert in selecting the freshest produce and creating meal prep plans.', rating: 4.8, createdAt: '', updatedAt: '' },
]

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', businessId: 'b1', userId: 'u1', targetType: 'business', targetId: 'b1', rating: 5, title: 'Amazing quality!', body: 'The freshest vegetables I have found in Lagos. Delivery was prompt and the produce lasted over a week. Highly recommend the weekly meal prep pack!', images: [], isVerifiedPurchase: true, isApproved: true, createdAt: '2026-06-15T10:30:00Z', updatedAt: '' },
  { id: 'r2', businessId: 'b1', userId: 'u2', targetType: 'business', targetId: 'b1', rating: 4, title: 'Great service', body: 'Good quality produce and friendly staff. A bit pricey but worth it for organic.', images: [], isVerifiedPurchase: true, isApproved: true, createdAt: '2026-06-10T14:20:00Z', updatedAt: '' },
  { id: 'r3', businessId: 'b1', userId: 'u3', targetType: 'business', targetId: 'b1', rating: 5, title: 'Best in Lagos', body: 'I have been ordering from Lagos Fresh Market for 6 months now. Consistent quality and excellent customer service.', images: [], isVerifiedPurchase: true, isApproved: true, createdAt: '2026-06-05T09:15:00Z', updatedAt: '' },
]

const GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800',
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800', 'https://images.unsplash.com/photo-1590779033100-9f8a05c1b5e6?w=800',
]

const DAY_LABELS: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const countryCode = (params?.country as string)?.toUpperCase() ?? 'NG'
  const country = getCountryConfig(countryCode) as CountryConfig | undefined

  const business = MOCK_BUSINESS
  const [activeTab, setActiveTab] = useState('services')
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showAllHours, setShowAllHours] = useState(false)
  const [showMobileBook, setShowMobileBook] = useState(false)

  const services = MOCK_SERVICES
  const staff = MOCK_STAFF
  const reviews = MOCK_REVIEWS
  const galleryImages = GALLERY_IMAGES

  const todayLabel = DAY_LABELS[new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()]
  const todayHours = business.hours.find((h) => DAY_LABELS[h.day] === todayLabel)
  const isOpen = todayHours && !todayHours.isClosed

  const tabs = [
    { id: 'services', label: 'Services', icon: Scissors },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'menu', label: 'Menu', icon: Timer },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'reviews', label: 'Reviews', icon: MessageCircle },
  ]

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: business.name, url })
    } else {
      await navigator.clipboard.writeText(url)
      setShowShare(true)
      setTimeout(() => setShowShare(false), 2000)
    }
  }

  return (
    <div className="min-h-screen pt-16 md:pt-20 pb-24 md:pb-12">
      {/* Gallery Hero */}
      <div className="relative h-64 sm:h-80 md:h-96 bg-surface-secondary overflow-hidden">
        <div className="flex h-full transition-transform duration-500" style={{ transform: `translateX(-${galleryIdx * 100}%)` }}>
          {galleryImages.map((img, i) => (
            <div key={i} className="min-w-full h-full">
              <img src={img} alt={`${business.name} gallery ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Gallery controls */}
        {galleryImages.length > 1 && (
          <>
            <button onClick={() => setGalleryIdx((i) => (i - 1 + galleryImages.length) % galleryImages.length)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setGalleryIdx((i) => (i + 1) % galleryImages.length)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {galleryImages.map((_, i) => (
                <button key={i} onClick={() => setGalleryIdx(i)} className={cn('w-2 h-2 rounded-full transition-all', i === galleryIdx ? 'bg-white w-6' : 'bg-white/50')} />
              ))}
            </div>
          </>
        )}

        {/* Top actions */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            <button onClick={() => setIsFav(!isFav)} className={cn('p-2 rounded-full backdrop-blur-sm transition-all', isFav ? 'bg-red-500 text-white' : 'bg-black/30 text-white hover:bg-black/50')}>
              <Heart className={cn('w-5 h-5', isFav && 'fill-current')} />
            </button>
            <button onClick={handleShare} className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm transition-all">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-8 relative z-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Business Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-2xl border border-border p-6 sm:p-8"
            >
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">{business.category}</span>
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-text-primary mt-1">{business.name}</h1>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-semibold text-text-primary">{business.rating.toFixed(1)}</span>
                  <span>({business.reviewCount} reviews)</span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {business.address.city}, {business.address.state}
                </span>
                <span className={cn('flex items-center gap-1', isOpen ? 'text-emerald-500' : 'text-red-500')}>
                  <span className={cn('w-2 h-2 rounded-full', isOpen ? 'bg-emerald-500' : 'bg-red-500')} />
                  {isOpen ? `Open - closes ${todayHours?.close}` : 'Closed'}
                </span>
              </div>

              {/* About */}
              <p className="mt-4 text-text-secondary leading-relaxed">{business.description}</p>

              <div className="flex flex-wrap gap-2 mt-4">
                {business.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-lg bg-surface-secondary border border-border text-xs font-medium text-text-secondary">
                    #{tag}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Tabs */}
            <div className="bg-surface rounded-2xl border border-border">
              <div className="flex overflow-x-auto scrollbar-none border-b border-border">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all',
                      activeTab === tab.id ? 'border-amber-500 text-amber-500' : 'border-transparent text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Services Tab */}
                {activeTab === 'services' && (
                  <div className="space-y-4">
                    {services.map((service, i) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        countryCode={countryCode}
                        businessSlug={business.id}
                        staffCount={staff.filter((s) => s.serviceIds.includes(service.id)).length}
                        index={i}
                        onBook={(s) => router.push(`/${params?.country}/book/${business.id}/${s.id}`)}
                      />
                    ))}
                  </div>
                )}

                {/* Products Tab */}
                {activeTab === 'products' && (
                  <div className="text-center py-12 text-text-secondary">
                    <ShoppingBag className="w-12 h-12 mx-auto text-text-tertiary" />
                    <p className="mt-3 font-medium">Products coming soon</p>
                    <p className="text-sm mt-1">This business hasn&apos;t listed any products yet.</p>
                  </div>
                )}

                {/* Menu Tab (for restaurants) */}
                {activeTab === 'menu' && (
                  <div className="text-center py-12 text-text-secondary">
                    <Timer className="w-12 h-12 mx-auto text-text-tertiary" />
                    <p className="mt-3 font-medium">Menu coming soon</p>
                    <p className="text-sm mt-1">Digital menu is being prepared by the business.</p>
                  </div>
                )}

                {/* Staff Tab */}
                {activeTab === 'staff' && (
                  <div className="space-y-4">
                    {staff.map((s) => (
                      <div key={s.id} className="flex items-start gap-4 p-4 rounded-xl bg-surface-secondary border border-border">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-text-primary">{s.name}</h4>
                          <p className="text-sm text-text-secondary">{s.role}</p>
                          {s.bio && <p className="text-sm text-text-secondary mt-1">{s.bio}</p>}
                          <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" />{s.rating.toFixed(1)}</span>
                            <span>{s.serviceIds.length} services</span>
                          </div>
                        </div>
                        <button className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shrink-0">
                          Book
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    {/* Rating summary */}
                    <div className="flex items-start gap-6 pb-6 border-b border-border">
                      <div className="text-center">
                        <span className="text-4xl font-bold text-text-primary">{business.rating.toFixed(1)}</span>
                        <div className="flex items-center justify-center gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn('w-4 h-4', i < Math.round(business.rating) ? 'text-amber-500 fill-amber-500' : 'text-text-tertiary')} />
                          ))}
                        </div>
                        <span className="text-xs text-text-tertiary">{business.reviewCount} reviews</span>
                      </div>
                      <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = reviews.filter((r) => Math.round(r.rating) === star).length
                          const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                          return (
                            <div key={star} className="flex items-center gap-2 text-sm">
                              <span className="w-8 text-text-secondary text-right">{star}</span>
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <div className="flex-1 h-2 rounded-full bg-surface-tertiary overflow-hidden">
                                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-8 text-xs text-text-tertiary">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Review list */}
                    <div className="space-y-5">
                      {reviews.map((review) => (
                        <div key={review.id} className="pb-5 border-b border-border last:border-0">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {review.userId.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-text-primary">Anonymous</span>
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={cn('w-3.5 h-3.5', i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-text-tertiary')} />
                                  ))}
                                </div>
                              </div>
                              {review.title && <h5 className="font-medium text-text-primary mt-1">{review.title}</h5>}
                              {review.body && <p className="text-sm text-text-secondary mt-1">{review.body}</p>}
                              <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
                                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                {review.isVerifiedPurchase && (
                                  <span className="flex items-center gap-1 text-emerald-500"><Check className="w-3 h-3" />Verified purchase</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-2">
                                <button className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"><ThumbsUp className="w-3.5 h-3.5" />Helpful</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Write review */}
                    <button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="w-full py-3 rounded-xl border-2 border-dashed border-border text-text-secondary hover:border-amber-500/50 hover:text-amber-500 font-medium transition-all"
                    >
                      {showReviewForm ? 'Cancel' : 'Write a review'}
                    </button>

                    <AnimatePresence>
                      {showReviewForm && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <ReviewForm
                            businessName={business.name}
                            onSubmit={(data) => {
                              console.log('Review submitted:', data)
                              setShowReviewForm(false)
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Business info card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface rounded-2xl border border-border p-6 space-y-4"
            >
              {/* Hours */}
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Business Hours
                </h4>
                <div className="space-y-1.5">
                  {DAY_ORDER.slice(0, showAllHours ? 7 : 5).map((day) => {
                    const h = business.hours.find((bh) => bh.day === day)
                    const isToday = DAY_LABELS[day] === new Date().toLocaleDateString('en-US', { weekday: 'short' })
                    return (
                      <div key={day} className={cn('flex items-center justify-between text-sm', isToday && 'font-semibold text-text-primary')}>
                        <span className={isToday ? 'text-text-primary' : 'text-text-secondary'}>{DAY_LABELS[day]}</span>
                        <span className={h?.isClosed ? 'text-red-500' : 'text-text-secondary'}>
                          {h?.isClosed ? 'Closed' : `${h?.open} - ${h?.close}`}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <button onClick={() => setShowAllHours(!showAllHours)} className="text-xs text-amber-500 hover:text-amber-600 mt-2 font-medium">
                  {showAllHours ? 'Show less' : 'Show all hours'}
                </button>
              </div>

              {/* Contact */}
              <div className="pt-4 border-t border-border space-y-2">
                <a href={`tel:${business.contact.phone}`} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                  <Phone className="w-4 h-4 text-amber-500" />{business.contact.phone}
                </a>
                <a href={`mailto:${business.contact.email}`} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                  <Mail className="w-4 h-4 text-amber-500" />{business.contact.email}
                </a>
                {business.contact.website && (
                  <a href={business.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                    <Globe className="w-4 h-4 text-amber-500" />Website
                  </a>
                )}
              </div>

              {/* Address */}
              <div className="pt-4 border-t border-border">
                <p className="flex items-start gap-2 text-sm text-text-secondary">
                  <MapPin className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  {business.address.formatted}
                </p>
              </div>

              {/* Map */}
              <div className="pt-4 border-t border-border">
                <div className="h-40 rounded-xl bg-surface-secondary border border-border flex items-center justify-center">
                  <div className="text-center">
                    <Map className="w-8 h-8 text-text-tertiary mx-auto" />
                    <p className="text-xs text-text-secondary mt-1">Map loading...</p>
                    <p className="text-xs text-text-tertiary">{business.address.city}, {business.address.state}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Sticky mobile booking CTA */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-surface border-t border-border p-4 z-30">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div>
            <p className="text-xs text-text-secondary">Starting from</p>
            <p className="font-bold text-text-primary">{formatCurrency(3500, country?.currency.code ?? 'NGN')}</p>
          </div>
          <button
            onClick={() => { setShowMobileBook(true); router.push(`/${params?.country}/book/${business.id}/s1`) }}
            className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors shadow-sm"
          >
            Book Now
          </button>
        </div>
      </div>

      {/* Share toast */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 lg:bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-text-primary text-text-inverse text-sm font-medium shadow-lg z-50"
          >
            Link copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
