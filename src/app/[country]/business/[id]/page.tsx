'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, MapPin, Clock, Phone, Mail, Globe, ChevronLeft, ChevronRight,
  Share2, Heart, MessageCircle, Users, Scissors,
  ShoppingBag, Timer, Map, Check, Image,
} from 'lucide-react'
import Link from 'next/link'
import { cn, formatCurrency } from '@/lib/utils'
import { getCountryConfig } from '@/lib/localization'
import { getCurrencyForCountry } from '@/lib/money'
import type { CountryConfig } from '@/lib/localization/countries'
import ServiceCard from '@/components/marketplace/ServiceCard'
import ProviderCard from '@/components/marketplace/ProviderCard'
import ReviewForm from '@/components/marketplace/ReviewForm'
import MapEmbed from '@/components/shared/MapEmbed'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import type { Business, Service } from '@/types'
import { getCountryBusinesses, getCountryServices, getStaffForBusiness } from '@/lib/countries-data'
import { galleryFor, bucketFor } from '@/lib/images'
import { getWeekdayKey, formatInTimezone } from '@/lib/time'


const DAY_LABELS: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

/** A row from the `reviews` table, as returned by /api/reviews. */
interface StoredReview {
  id: string
  rating: number
  title: string | null
  content: string | null
  is_verified: boolean
  reply_from_business?: string | null
  created_at: string
}

/**
 * Which tabs make sense for a given vertical. 'Products' and 'Menu' are
 * still 'coming soon' placeholders platform-wide (no product/menu backend
 * wired to this page yet), so an unrelated business type — an automotive
 * shop, a driver, a lawyer — showing an always-empty 'Menu coming soon' tab
 * read as unfinished rather than genuinely empty. Filtering by business
 * type fixes that without inventing fake content. Unknown/uncategorized
 * businesses (generic) get everything, so nothing that might apply is ever
 * hidden by a classification gap.
 */
const TABS_BY_BUCKET: Record<string, string[]> = {
  food: ['menu', 'services', 'reviews'],
  stays: ['services', 'portfolio', 'reviews'],
  beauty: ['services', 'staff', 'portfolio', 'reviews'],
  home: ['services', 'staff', 'portfolio', 'reviews'],
  automotive: ['services', 'staff', 'portfolio', 'reviews'],
  technology: ['services', 'products', 'reviews'],
  education: ['services', 'staff', 'reviews'],
  healthcare: ['services', 'staff', 'reviews'],
  events: ['services', 'portfolio', 'reviews'],
  rides: ['services', 'reviews'],
  fashion: ['products', 'portfolio', 'reviews'],
  agriculture: ['products', 'reviews'],
  realestate: ['services', 'portfolio', 'reviews'],
  legal: ['services', 'reviews'],
  logistics: ['services', 'reviews'],
  generic: ['services', 'portfolio', 'products', 'menu', 'staff', 'reviews'],
}

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const countryCode = (params?.country as string)?.toUpperCase() ?? 'NG'
  const businessId = (params?.id as string) ?? ''
  const country = getCountryConfig(countryCode) as CountryConfig | undefined
  const currencyCode = country?.currency.code ?? getCurrencyForCountry(countryCode)

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
  const { authenticated } = useAuth()
  const [reviews, setReviews] = useState<StoredReview[]>([])
  const [reviewsStatus, setReviewsStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reviewSubmit, setReviewSubmit] = useState<
    { state: 'idle' } | { state: 'saving' } | { state: 'saved' } | { state: 'error'; message: string }
  >({ state: 'idle' })

  useEffect(() => {
    if (!businessId) return
    let cancelled = false
    setReviewsStatus('loading')
    fetch(`/api/reviews?businessId=${encodeURIComponent(businessId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        if (!json.success) throw new Error()
        setReviews(json.data.reviews)
        setReviewsStatus('ready')
      })
      .catch(() => !cancelled && setReviewsStatus('error'))
    return () => {
      cancelled = true
    }
  }, [businessId])

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

  const staff = getStaffForBusiness(business, services)

  const submitReview = async (data: { rating: number; title: string; body: string }) => {
    setReviewSubmit({ state: 'saving' })
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id, ...data }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setReviewSubmit({ state: 'error', message: json.error ?? 'Could not save your review' })
        return
      }
      setReviews((prev) => [json.data.review, ...prev])
      setReviewSubmit({ state: 'saved' })
      setShowReviewForm(false)
    } catch {
      setReviewSubmit({ state: 'error', message: 'Network error — your review was not saved' })
    }
  }

  const galleryImages = galleryFor(business.id, business.category, business.media?.galleryUrls)
  const startingPrice = services.length > 0 ? Math.min(...services.map((s) => s.price)) : 0

  const todayLabel = DAY_LABELS[getWeekdayKey(new Date(), country?.timezone)]
  const todayHours = business.hours.find((h) => DAY_LABELS[h.day] === todayLabel)
  const isOpen = todayHours && !todayHours.isClosed
  const localTime = formatInTimezone(new Date(), country?.timezone)

  const ALL_TABS = [
    { id: 'services', label: 'Services', icon: Scissors },
    { id: 'portfolio', label: 'Portfolio', icon: Image },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'menu', label: 'Menu', icon: Timer },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'reviews', label: 'Reviews', icon: MessageCircle },
  ]
  const businessBucket = bucketFor(business.category)
  const visibleTabIds = TABS_BY_BUCKET[businessBucket] ?? TABS_BY_BUCKET.generic
  const tabs = ALL_TABS.filter((t) => visibleTabIds.includes(t.id))
  // If a stale activeTab (e.g. left over from a previously viewed business
  // of a different type) isn't in this business's tab set, fall back to the
  // first one rather than rendering a selected-but-hidden tab's empty panel.
  const currentTab = tabs.some((t) => t.id === activeTab) ? activeTab : tabs[0]?.id

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
                <span className={cn('flex items-center gap-1', isOpen ? 'text-olive-600' : 'text-red-500')}>
                  <span className={cn('w-2 h-2 rounded-full', isOpen ? 'bg-olive-500' : 'bg-red-500')} />
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
                      currentTab === tab.id ? 'border-amber-500 text-amber-500' : 'border-transparent text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Services Tab */}
                {currentTab === 'services' && (
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
                {currentTab === 'portfolio' && (
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
                  </div>
                )}

                {/* Products Tab */}
                {currentTab === 'products' && (
                  <div className="text-center py-12 text-text-secondary">
                    <ShoppingBag className="w-12 h-12 mx-auto text-text-tertiary" />
                    <p className="mt-3 font-medium">Products coming soon</p>
                    <p className="text-sm mt-1">This business hasn&apos;t listed any products yet.</p>
                  </div>
                )}

                {/* Menu Tab (for restaurants) */}
                {currentTab === 'menu' && (
                  <div className="text-center py-12 text-text-secondary">
                    <Timer className="w-12 h-12 mx-auto text-text-tertiary" />
                    <p className="mt-3 font-medium">Menu coming soon</p>
                    <p className="text-sm mt-1">Digital menu is being prepared by the business.</p>
                  </div>
                )}

                {/* Staff Tab */}
                {currentTab === 'staff' && (
                  <div className="space-y-4">
                    {staff.length > 0 ? (
                      staff.map((s) => (
                        <ProviderCard
                          key={s.id}
                          staff={s}
                          selectLabel="Book"
                          onSelect={(selected) => {
                            // Book the first service this provider offers —
                            // matches the Services tab's own booking link.
                            // Previously this button had no handler at all.
                            const firstServiceId = selected.serviceIds[0] ?? services[0]?.id
                            if (firstServiceId) router.push(`/${params?.country}/book/${business.id}/${firstServiceId}`)
                          }}
                        />
                      ))
                    ) : (
                      <div className="text-center py-12 text-text-secondary">
                        <p className="font-medium">No staff listed yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Tab — only reviews actually stored in the
                    `reviews` table; nothing is invented to fill the space. */}
                {currentTab === 'reviews' && (
                  <div className="space-y-6">
                    {reviewsStatus === 'loading' && (
                      <div className="space-y-3" aria-busy="true">
                        {[0, 1].map((i) => (
                          <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-secondary" />
                        ))}
                      </div>
                    )}

                    {reviewsStatus === 'error' && (
                      <p className="rounded-2xl border border-border bg-surface-secondary p-4 text-sm text-text-secondary">
                        Reviews couldn&apos;t be loaded right now. Please try again later.
                      </p>
                    )}

                    {reviewsStatus === 'ready' && reviews.length === 0 && (
                      <div className="rounded-2xl border border-border bg-surface-secondary p-6 text-center">
                        <MessageCircle className="mx-auto h-8 w-8 text-text-tertiary" />
                        <p className="mt-3 font-semibold text-text-primary">No reviews on AfriBook yet</p>
                        <p className="mt-1 text-sm text-text-secondary">
                          Reviews from customers who book through AfriBook will appear here.
                        </p>
                      </div>
                    )}

                    {reviewsStatus === 'ready' && reviews.length > 0 && (
                      <>
                        <div className="flex items-center gap-4 border-b border-border pb-5">
                          <span className="font-mono text-4xl font-bold tabular-nums text-text-primary">
                            {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                          </span>
                          <div>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    'h-4 w-4',
                                    i < Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
                                      ? 'fill-amber-500 text-amber-500'
                                      : 'text-text-tertiary',
                                  )}
                                />
                              ))}
                            </div>
                            <p className="mt-1 text-xs text-text-tertiary">
                              {reviews.length} review{reviews.length === 1 ? '' : 's'} on AfriBook
                            </p>
                          </div>
                        </div>

                        <ul className="space-y-5">
                          {reviews.map((review) => (
                            <li key={review.id} className="border-b border-border pb-5 last:border-0">
                              <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={cn('h-3.5 w-3.5', i < review.rating ? 'fill-amber-500 text-amber-500' : 'text-text-tertiary')}
                                    />
                                  ))}
                                </div>
                                {review.is_verified && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-olive-50 px-2 py-0.5 text-[11px] font-semibold text-olive-700">
                                    <Check className="h-3 w-3" />
                                    Booked on AfriBook
                                  </span>
                                )}
                                <span className="ml-auto text-xs text-text-tertiary">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {review.title && <h5 className="mt-2 font-semibold text-text-primary">{review.title}</h5>}
                              {review.content && <p className="mt-1 text-sm text-text-secondary">{review.content}</p>}
                              {review.reply_from_business && (
                                <p className="mt-3 rounded-xl bg-surface-secondary p-3 text-sm text-text-secondary">
                                  <span className="font-semibold text-text-primary">Reply from {business.name}: </span>
                                  {review.reply_from_business}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {reviewSubmit.state === 'saved' && (
                      <p role="status" className="rounded-xl bg-olive-50 p-3 text-sm font-medium text-olive-700">
                        Thanks — your review is published.
                      </p>
                    )}

                    {authenticated ? (
                      <button
                        onClick={() => {
                          setShowReviewForm(!showReviewForm)
                          setReviewSubmit({ state: 'idle' })
                        }}
                        className="w-full rounded-xl border-2 border-dashed border-border py-3 font-medium text-text-secondary transition-all hover:border-amber-500/50 hover:text-amber-600"
                      >
                        {showReviewForm ? 'Cancel' : 'Write a review'}
                      </button>
                    ) : (
                      <Link
                        href={`/login?redirect=${encodeURIComponent(`/${countryCode}/business/${business.id}`)}`}
                        className="block w-full rounded-xl border-2 border-dashed border-border py-3 text-center font-medium text-text-secondary transition-all hover:border-amber-500/50 hover:text-amber-600"
                      >
                        Sign in to write a review
                      </Link>
                    )}

                    <AnimatePresence>
                      {showReviewForm && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          {reviewSubmit.state === 'error' && (
                            <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                              {reviewSubmit.message}
                            </p>
                          )}
                          <ReviewForm
                            businessName={business.name}
                            onSubmit={({ rating, title, body }) => submitReview({ rating, title, body })}
                          />
                          {reviewSubmit.state === 'saving' && (
                            <p className="mt-2 text-sm text-text-tertiary">Saving your review…</p>
                          )}
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
                <MapEmbed center={business.location} openInMaps />
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
              <p className="font-bold font-mono tabular-nums text-text-primary">{formatCurrency(startingPrice, currencyCode)}</p>
            </div>
            <Button
              className="flex-1"
              onClick={() => router.push(`/${params?.country}/book/${business.id}/${services[0].id}`)}
            >
              Book Now
            </Button>
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
