'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, MapPin, Clock, Phone, Mail, Globe, ChevronLeft, ChevronRight,
  Share2, Heart, ThumbsUp, MessageCircle, Users, Scissors,
  ShoppingBag, Timer, Map, Check, Image, Video,
} from 'lucide-react'
import Link from 'next/link'
import { cn, formatCurrency } from '@/lib/utils'
import { getCountryConfig } from '@/lib/localization'
import type { CountryConfig } from '@/lib/localization/countries'
import ServiceCard from '@/components/marketplace/ServiceCard'
import ReviewForm from '@/components/marketplace/ReviewForm'
import type { Business, Service, Review, Staff } from '@/types'
import { getCountryBusinesses, getCountryServices } from '@/lib/countries-data'
import { getWeekdayKey, formatInTimezone } from '@/lib/time'

const CATEGORY_IMAGES: Record<string, string[]> = {
  'Food & Dining': [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800',
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800',
    'https://images.unsplash.com/photo-1590779033100-9f8a05c1b5e6?w=800',
  ],
  'Beauty & Wellness': [
    'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800',
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
    'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=800',
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800',
  ],
  Healthcare: [
    'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=800',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
    'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800',
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800',
  ],
  'Home Services': [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
    'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800',
    'https://images.unsplash.com/photo-1558002038-1055907df827?w=800',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
  ],
  'Technology': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
    'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800',
  ],
  'Education': [
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
  ],
  'Sports & Fitness': [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800',
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800',
  ],
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
  'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800',
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800',
  'https://images.unsplash.com/photo-1590779033100-9f8a05c1b5e6?w=800',
]

const DAY_LABELS: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const NOW = Date.now()

function defaultSchedule(): Staff['schedule'] {
  return DAY_ORDER.map((day, d) => ({
    day: day as Staff['schedule'][number]['day'],
    start: d === 6 ? '10:00' : '08:00',
    end: d === 6 ? '16:00' : '19:00',
    isAvailable: d !== 6,
  }))
}

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const countryCode = (params?.country as string)?.toUpperCase() ?? 'NG'
  const businessId = (params?.id as string) ?? ''
  const country = getCountryConfig(countryCode) as CountryConfig | undefined

  const allBusinesses = getCountryBusinesses(countryCode)
  const allServices = getCountryServices(countryCode)

  const business: Business | undefined = allBusinesses.find((b) => b.id === businessId)
  const services: Service[] = allServices.filter((s) => s.businessId === businessId)

  const [activeTab, setActiveTab] = useState('services')
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showAllHours, setShowAllHours] = useState(false)

  if (!business) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-4">
            <Map className="w-8 h-8 text-text-tertiary" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Business not found</h1>
          <p className="text-text-secondary mt-1">This business may have been removed or the link is incorrect.</p>
          <Link
            href={`/${countryCode}/search`}
            className="mt-5 inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Browse businesses in {country?.name ?? 'this country'}
          </Link>
        </div>
      </div>
    )
  }

  const staff: Staff[] = [
    {
      id: 'st1', businessId: business.id, userId: '', name: `${business.name.split(' ')[0]} Team Lead`,
      role: 'Lead Provider', email: '', phone: business.contact.phone, avatarUrl: '',
      schedule: defaultSchedule(), serviceIds: services.slice(0, 2).map((s) => s.id),
      isActive: true, bio: `Lead at ${business.name}, ensuring top quality service in ${business.address.city}.`,
      rating: Math.min(5, business.rating + 0.1), createdAt: '', updatedAt: '',
    },
    {
      id: 'st2', businessId: business.id, userId: '', name: `${business.address.city} Specialist`,
      role: 'Service Specialist', email: '', phone: business.contact.phone, avatarUrl: '',
      schedule: defaultSchedule(), serviceIds: services.slice(2).map((s) => s.id),
      isActive: true, bio: `Focused on delivering ${business.category} excellence to every customer.`,
      rating: business.rating, createdAt: '', updatedAt: '',
    },
  ]

  const reviews: Review[] = [
    {
      id: 'r1', businessId: business.id, userId: 'u1', targetType: 'business', targetId: business.id,
      rating: Math.min(5, Math.round(business.rating)), title: 'Excellent service', isVerifiedPurchase: true,
      body: `Booked ${services[0]?.name ?? business.category} and the experience was fantastic. Prompt, professional and great value for money.`,
      images: [], isApproved: true, createdAt: new Date(NOW - 3 * 86400000).toISOString(), updatedAt: '',
    },
    {
      id: 'r2', businessId: business.id, userId: 'u2', targetType: 'business', targetId: business.id,
      rating: Math.max(3, Math.round(business.rating) - 1), title: 'Great experience', isVerifiedPurchase: false,
      body: `Really enjoyed the ${services[1]?.name ?? 'service'} — friendly team and smooth booking through AfriBook.`,
      images: [], isApproved: true, createdAt: new Date(NOW - 6 * 86400000).toISOString(), updatedAt: '',
    },
    {
      id: 'r3', businessId: business.id, userId: 'u3', targetType: 'business', targetId: business.id,
      rating: Math.min(5, Math.round(business.rating)), title: 'Highly recommended', isVerifiedPurchase: true,
      body: `I have used ${business.name} for months now. Consistent quality and excellent customer service every single time.`,
      images: [], isApproved: true, createdAt: new Date(NOW - 9 * 86400000).toISOString(), updatedAt: '',
    },
  ]

  const galleryImages = CATEGORY_IMAGES[business.category] ?? FALLBACK_IMAGES
  const startingPrice = services.length > 0 ? Math.min(...services.map((s) => s.price)) : 0

  const todayLabel = DAY_LABELS[getWeekdayKey(new Date(), country?.timezone)]
  const todayHours = business.hours.find((h) => DAY_LABELS[h.day] === todayLabel)
  const isOpen = todayHours && !todayHours.isClosed
  const localTime = formatInTimezone(new Date(), country?.timezone)

  const tabs = [
    { id: 'services', label: 'Services', icon: Scissors },
    { id: 'portfolio', label: 'Portfolio', icon: Image },
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
                  {business.address.city}, {business.address.state || country?.name}
                </span>
                <span className={cn('flex items-center gap-1', isOpen ? 'text-emerald-500' : 'text-red-500')}>
                  <span className={cn('w-2 h-2 rounded-full', isOpen ? 'bg-emerald-500' : 'bg-red-500')} />
                  {isOpen ? `Open - closes ${todayHours?.close}` : 'Closed'}
                  <span className="text-text-tertiary">({localTime} {country?.name})</span>
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
                    {services.length > 0 ? (
                      services.map((service, i) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          countryCode={countryCode}
                          businessSlug={business.id}
                          staffCount={staff.filter((s) => s.serviceIds.includes(service.id)).length}
                          index={i}
                          onBook={(s) => router.push(`/${params?.country}/book/${business.id}/${s.id}`)}
                        />
                      ))
                    ) : (
                      <div className="text-center py-12 text-text-secondary">
                        <p className="font-medium">No services listed yet</p>
                        <p className="text-sm mt-1">Check back soon for available services.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Portfolio Tab */}
                {activeTab === 'portfolio' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold font-heading text-text-primary mb-3">Our Work</h3>
                      <p className="text-sm text-text-secondary mb-4">Browse through our latest projects, transformations, and deliveries.</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {galleryImages.map((img, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden bg-surface-secondary border border-border group cursor-pointer">
                          <img src={img} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-heading text-text-primary mb-3 flex items-center gap-2">
                        <Video className="w-5 h-5 text-amber-500" />
                        Video Showcase
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { title: `${business.category} at ${business.name}`, duration: '2:30' },
                          { title: `${business.name} Experience`, duration: '4:15' },
                        ].map((video, i) => (
                          <div key={i} className="rounded-xl overflow-hidden bg-surface-secondary border border-border group cursor-pointer">
                            <div className="aspect-video bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center relative">
                              <div className="w-14 h-14 rounded-full bg-amber-500/90 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                              </div>
                              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">{video.duration}</span>
                            </div>
                            <div className="p-3">
                              <p className="text-sm font-medium text-text-primary">{video.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
                    const isToday = DAY_LABELS[day] === todayLabel
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
                <div className="h-40 rounded-xl overflow-hidden border border-border">
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${(business.location.longitude || 3.3792) - 0.01},${(business.location.latitude || 6.5244) - 0.01},${(business.location.longitude || 3.3792) + 0.01},${(business.location.latitude || 6.5244) + 0.01}&layer=mapnik&marker=${business.location.latitude || 6.5244},${business.location.longitude || 3.3792}`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    title="Business location map"
                  />
                </div>
                <a
                  href={`https://www.google.com/maps?q=${business.location.latitude || 6.5244},${business.location.longitude || 3.3792}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-amber-500 text-xs font-medium hover:text-amber-600 mt-2 transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  Open in Maps
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Sticky mobile booking CTA */}
      {services.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-surface border-t border-border p-4 z-30">
          <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
            <div>
              <p className="text-xs text-text-secondary">Starting from</p>
              <p className="font-bold text-text-primary">{formatCurrency(startingPrice, country?.currency.code ?? 'NGN')}</p>
            </div>
            <button
              onClick={() => router.push(`/${params?.country}/book/${business.id}/${services[0].id}`)}
              className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors shadow-sm"
            >
              Book Now
            </button>
          </div>
        </div>
      )}

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
