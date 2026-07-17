'use client'

import { useState, useMemo, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, X, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCountryConfig } from '@/lib/localization'
import type { CountryConfig } from '@/lib/localization/countries'
import BusinessCard from '@/components/marketplace/BusinessCard'
import ServiceCard from '@/components/marketplace/ServiceCard'
import SearchHeader from '@/components/marketplace/SearchHeader'
import FilterSidebar from '@/components/marketplace/FilterSidebar'
import type { FilterState } from '@/components/marketplace/FilterSidebar'
import type { Business, Service } from '@/types'

const COUNTRY_BUSINESSES: Record<string, Business[]> = {
  NG: [
    { id: 'b1', name: 'Lagos Fresh Market', description: 'Premium fresh produce delivered to your doorstep.', category: 'Food & Dining', countryCode: 'NG', ownerId: '', address: { street: '12 Ahmadu Bello Way', city: 'Lagos', state: 'Lagos', postalCode: '100001', countryCode: 'NG', formatted: '12 Ahmadu Bello Way, Lagos', geoPoint: { latitude: 6.5244, longitude: 3.3792 } }, location: { latitude: 6.5244, longitude: 3.3792 }, contact: { phone: '+234 800 123 4567', email: 'hello@lagosfreshmarket.ng' }, media: { galleryUrls: [] }, hours: [{ day: 'mon', open: '07:00', close: '20:00', isClosed: false }, { day: 'tue', open: '07:00', close: '20:00', isClosed: false }, { day: 'wed', open: '07:00', close: '20:00', isClosed: false }, { day: 'thu', open: '07:00', close: '20:00', isClosed: false }, { day: 'fri', open: '07:00', close: '21:00', isClosed: false }, { day: 'sat', open: '08:00', close: '21:00', isClosed: false }, { day: 'sun', open: '09:00', close: '18:00', isClosed: false }], status: 'active', rating: 4.8, reviewCount: 234, qrBookingUrl: '', tags: ['groceries', 'fresh', 'organic', 'delivery'], deliveryAvailable: true, deliveryRadiusKm: 15, minimumOrder: 2000, commissionRate: 0.08, createdAt: '', updatedAt: '' },
    { id: 'b2', name: 'Lekki Beauty Studio', description: 'Full-service beauty salon offering hairstyling, makeup, nails.', category: 'Beauty & Wellness', countryCode: 'NG', ownerId: '', address: { street: '45 Admiralty Way', city: 'Lekki', state: 'Lagos', postalCode: '100005', countryCode: 'NG', formatted: '45 Admiralty Way, Lekki, Lagos', geoPoint: { latitude: 6.4281, longitude: 3.4219 } }, location: { latitude: 6.4281, longitude: 3.4219 }, contact: { phone: '+234 800 987 6543', email: 'book@lekki-beauty.ng' }, media: { galleryUrls: [] }, hours: [{ day: 'mon', open: '08:00', close: '19:00', isClosed: false }, { day: 'tue', open: '08:00', close: '19:00', isClosed: false }, { day: 'wed', open: '08:00', close: '19:00', isClosed: false }, { day: 'thu', open: '08:00', close: '19:00', isClosed: false }, { day: 'fri', open: '08:00', close: '20:00', isClosed: false }, { day: 'sat', open: '09:00', close: '18:00', isClosed: false }, { day: 'sun', open: '00:00', close: '00:00', isClosed: true }], status: 'active', rating: 4.9, reviewCount: 189, qrBookingUrl: '', tags: ['salon', 'beauty', 'hair', 'nails'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '' },
    { id: 'b3', name: 'Abuja Tech Hub', description: 'Computer repairs, IT consulting, web development, and digital services.', category: 'Technology', countryCode: 'NG', ownerId: '', address: { street: '10 Shehu Shagari Way', city: 'Abuja', state: 'FCT', postalCode: '900001', countryCode: 'NG', formatted: '10 Shehu Shagari Way, Abuja', geoPoint: { latitude: 9.0579, longitude: 7.4951 } }, location: { latitude: 9.0579, longitude: 7.4951 }, contact: { phone: '+234 800 555 1234', email: 'info@abujatech.ng' }, media: { galleryUrls: [] }, hours: [{ day: 'mon', open: '09:00', close: '18:00', isClosed: false }, { day: 'tue', open: '09:00', close: '18:00', isClosed: false }, { day: 'wed', open: '09:00', close: '18:00', isClosed: false }, { day: 'thu', open: '09:00', close: '18:00', isClosed: false }, { day: 'fri', open: '09:00', close: '17:00', isClosed: false }, { day: 'sat', open: '10:00', close: '15:00', isClosed: false }, { day: 'sun', open: '00:00', close: '00:00', isClosed: true }], status: 'active', rating: 4.7, reviewCount: 98, qrBookingUrl: '', tags: ['tech', 'repairs', 'consulting'], deliveryAvailable: true, deliveryRadiusKm: 10, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '' },
    { id: 'b4', name: 'Lagos Fashion House', description: 'Bespoke tailoring, ready-to-wear African fashion, and custom designs.', category: 'Fashion & Tailoring', countryCode: 'NG', ownerId: '', address: { street: '22 Awolowo Road', city: 'Lagos', state: 'Lagos', postalCode: '100002', countryCode: 'NG', formatted: '22 Awolowo Road, Ikoyi, Lagos', geoPoint: { latitude: 6.4478, longitude: 3.4323 } }, location: { latitude: 6.4478, longitude: 3.4323 }, contact: { phone: '+234 800 333 4444', email: 'style@lagosfashion.ng' }, media: { galleryUrls: [] }, hours: [{ day: 'mon', open: '09:00', close: '19:00', isClosed: false }, { day: 'tue', open: '09:00', close: '19:00', isClosed: false }, { day: 'wed', open: '09:00', close: '19:00', isClosed: false }, { day: 'thu', open: '09:00', close: '19:00', isClosed: false }, { day: 'fri', open: '09:00', close: '20:00', isClosed: false }, { day: 'sat', open: '09:00', close: '18:00', isClosed: false }, { day: 'sun', open: '00:00', close: '00:00', isClosed: true }], status: 'active', rating: 4.6, reviewCount: 142, qrBookingUrl: '', tags: ['fashion', 'tailoring', 'bespoke'], deliveryAvailable: true, deliveryRadiusKm: 5, minimumOrder: 5000, commissionRate: 0.1, createdAt: '', updatedAt: '' },
    { id: 'b5', name: 'Lagos Home Cleaners', description: 'Professional home and office cleaning services.', category: 'Home Services', countryCode: 'NG', ownerId: '', address: { street: '7 Victoria Island', city: 'Lagos', state: 'Lagos', postalCode: '100003', countryCode: 'NG', formatted: '7 Victoria Island, Lagos', geoPoint: { latitude: 6.4281, longitude: 3.4219 } }, location: { latitude: 6.4281, longitude: 3.4219 }, contact: { phone: '+234 800 222 3333', email: 'info@lagoscleaners.ng' }, media: { galleryUrls: [] }, hours: [{ day: 'mon', open: '07:00', close: '18:00', isClosed: false }, { day: 'tue', open: '07:00', close: '18:00', isClosed: false }, { day: 'wed', open: '07:00', close: '18:00', isClosed: false }, { day: 'thu', open: '07:00', close: '18:00', isClosed: false }, { day: 'fri', open: '07:00', close: '17:00', isClosed: false }, { day: 'sat', open: '08:00', close: '16:00', isClosed: false }, { day: 'sun', open: '00:00', close: '00:00', isClosed: true }], status: 'active', rating: 4.5, reviewCount: 67, qrBookingUrl: '', tags: ['cleaning', 'home', 'office'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '' },
    { id: 'b6', name: 'Dr. Ola Medical Center', description: 'General practice, dental, and specialist consultations.', category: 'Healthcare', countryCode: 'NG', ownerId: '', address: { street: '30 Ikeja Way', city: 'Lagos', state: 'Lagos', postalCode: '100004', countryCode: 'NG', formatted: '30 Ikeja Way, Lagos', geoPoint: { latitude: 6.6017, longitude: 3.3515 } }, location: { latitude: 6.6017, longitude: 3.3515 }, contact: { phone: '+234 800 777 8888', email: 'appointments@ola-medical.ng' }, media: { galleryUrls: [] }, hours: [{ day: 'mon', open: '08:00', close: '17:00', isClosed: false }, { day: 'tue', open: '08:00', close: '17:00', isClosed: false }, { day: 'wed', open: '08:00', close: '17:00', isClosed: false }, { day: 'thu', open: '08:00', close: '17:00', isClosed: false }, { day: 'fri', open: '08:00', close: '16:00', isClosed: false }, { day: 'sat', open: '09:00', close: '13:00', isClosed: false }, { day: 'sun', open: '00:00', close: '00:00', isClosed: true }], status: 'active', rating: 4.7, reviewCount: 156, qrBookingUrl: '', tags: ['medical', 'doctor', 'dental', 'healthcare'], deliveryAvailable: false, deliveryRadiusKm: 0, minimumOrder: 0, commissionRate: 0.1, createdAt: '', updatedAt: '' },
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

const COUNTRY_SERVICES: Record<string, Service[]> = {
  NG: [
    { id: 's1', businessId: 'b1', name: 'Fresh Produce Box', description: 'Assorted seasonal fruits and vegetables', duration: 30, price: 3500, currencyCode: 'NGN', category: 'Food & Dining', available: true, maxCapacityPerSlot: 10, paddingMinutes: 0, createdAt: '', updatedAt: '' },
    { id: 's2', businessId: 'b2', name: 'Hair Braiding', description: 'Professional braiding with extensions', duration: 120, price: 15000, currencyCode: 'NGN', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 2, paddingMinutes: 15, createdAt: '', updatedAt: '' },
    { id: 's3', businessId: 'b2', name: 'Manicure & Pedicure', description: 'Full nail care treatment', duration: 60, price: 8000, currencyCode: 'NGN', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 3, paddingMinutes: 10, createdAt: '', updatedAt: '' },
    { id: 's4', businessId: 'b3', name: 'Computer Diagnostics', description: 'Full system diagnostic and report', duration: 45, price: 5000, currencyCode: 'NGN', category: 'Technology', available: true, maxCapacityPerSlot: 5, paddingMinutes: 0, createdAt: '', updatedAt: '' },
    { id: 's5', businessId: 'b3', name: 'Website Development', description: 'Custom website design and development', duration: 0, price: 150000, currencyCode: 'NGN', category: 'Technology', available: true, maxCapacityPerSlot: 1, paddingMinutes: 30, createdAt: '', updatedAt: '' },
    { id: 's6', businessId: 'b4', name: 'Bespoke Tailoring', description: 'Custom-made traditional or modern attire', duration: 180, price: 45000, currencyCode: 'NGN', category: 'Fashion & Tailoring', available: true, maxCapacityPerSlot: 1, paddingMinutes: 30, createdAt: '', updatedAt: '' },
    { id: 's7', businessId: 'b5', name: 'Home Deep Cleaning', description: 'Thorough deep cleaning of 2-bedroom apartment', duration: 180, price: 25000, currencyCode: 'NGN', category: 'Home Services', available: true, maxCapacityPerSlot: 2, paddingMinutes: 15, createdAt: '', updatedAt: '' },
    { id: 's8', businessId: 'b6', name: 'General Consultation', description: 'Standard doctor consultation', duration: 30, price: 10000, currencyCode: 'NGN', category: 'Healthcare', available: true, maxCapacityPerSlot: 4, paddingMinutes: 5, createdAt: '', updatedAt: '' },
  ],
  KE: [
    { id: 'ks1', businessId: 'ke-1', name: 'Hair Braiding & Styling', description: 'Professional braiding, weaving, and styling', duration: 120, price: 2500, currencyCode: 'KES', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 2, paddingMinutes: 15, createdAt: '', updatedAt: '' },
    { id: 'ks2', businessId: 'ke-1', name: 'Full-Body Massage', description: 'Relaxing Swedish and deep-tissue massage', duration: 60, price: 4000, currencyCode: 'KES', category: 'Beauty & Wellness', available: true, maxCapacityPerSlot: 1, paddingMinutes: 10, createdAt: '', updatedAt: '' },
    { id: 'ks3', businessId: 'ke-2', name: 'Weekly Veggie Box', description: 'Assorted seasonal fruits and vegetables', duration: 30, price: 1500, currencyCode: 'KES', category: 'Food & Dining', available: true, maxCapacityPerSlot: 10, paddingMinutes: 0, createdAt: '', updatedAt: '' },
    { id: 'ks4', businessId: 'ke-3', name: 'Fintech Consultation', description: 'Mobile money & payments integration advisory', duration: 60, price: 12000, currencyCode: 'KES', category: 'Technology', available: true, maxCapacityPerSlot: 1, paddingMinutes: 15, createdAt: '', updatedAt: '' },
  ],
  GH: [
    { id: 'gs1', businessId: 'gh-1', name: 'Bespoke Tailoring', description: 'Custom-made traditional or modern attire', duration: 180, price: 800, currencyCode: 'GHS', category: 'Fashion & Tailoring', available: true, maxCapacityPerSlot: 1, paddingMinutes: 30, createdAt: '', updatedAt: '' },
    { id: 'gs2', businessId: 'gh-1', name: 'Ready-to-Wear Fitting', description: 'Off-the-rack sizing and alterations', duration: 45, price: 250, currencyCode: 'GHS', category: 'Fashion & Tailoring', available: true, maxCapacityPerSlot: 3, paddingMinutes: 10, createdAt: '', updatedAt: '' },
    { id: 'gs3', businessId: 'gh-2', name: 'Cocoa Bulk Order', description: 'Wholesale cocoa beans from Ashanti Region', duration: 0, price: 5000, currencyCode: 'GHS', category: 'Agriculture', available: true, maxCapacityPerSlot: 1, paddingMinutes: 0, createdAt: '', updatedAt: '' },
  ],
}

const ITEMS_PER_PAGE = 6
const SUGGESTIONS = ['Hair stylist', 'Plumber near me', 'Food delivery', 'Computer repair', 'Cleaning service', 'Fashion designer', 'Doctor appointment', 'Massage therapy']

export default function SearchPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const countryCode = (params?.country as string)?.toUpperCase() ?? 'NG'
  const country = getCountryConfig(countryCode) as CountryConfig | undefined

  const MOCK_BUSINESSES = COUNTRY_BUSINESSES[countryCode] ?? []
  const MOCK_SERVICES = COUNTRY_SERVICES[countryCode] ?? []

  const initialQuery = searchParams?.get('q') ?? ''
  const initialCategory = searchParams?.get('category') ?? ''

  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState('relevance')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showMap, setShowMap] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

  const priceRange: [number, number] = [0, 200000]
  const [filters, setFilters] = useState<FilterState>({
    categories: initialCategory ? [initialCategory] : [],
    priceMin: priceRange[0],
    priceMax: priceRange[1],
    rating: 0,
    maxDistance: 0,
    availableNow: false,
    openNow: false,
    deliveryAvailable: false,
  })

  const activeFilterCount = useMemo(() => {
    let count = filters.categories.length
    if (filters.rating > 0) count++
    if (filters.maxDistance > 0) count++
    if (filters.availableNow) count++
    if (filters.openNow) count++
    if (filters.deliveryAvailable) count++
    return count
  }, [filters])

  const filteredBusinesses = useMemo(() => {
    let results = MOCK_BUSINESSES

    if (query) {
      const q = query.toLowerCase()
      results = results.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    if (filters.categories.length > 0) {
      results = results.filter((b) => filters.categories.includes(b.category))
    }

    if (filters.priceMin > 0 || filters.priceMax < priceRange[1]) {
      results = results.filter((b) => {
        const services = MOCK_SERVICES.filter((s) => s.businessId === b.id)
        if (services.length === 0) return true
        const avgPrice = services.reduce((a, s) => a + s.price, 0) / services.length
        return avgPrice >= filters.priceMin && avgPrice <= filters.priceMax
      })
    }

    if (filters.rating > 0) {
      results = results.filter((b) => b.rating >= filters.rating)
    }

    if (filters.deliveryAvailable) {
      results = results.filter((b) => b.deliveryAvailable)
    }

    switch (sort) {
      case 'rating':
        results.sort((a, b) => b.rating - a.rating)
        break
      case 'price_asc':
      case 'price_desc':
        break
      case 'newest':
        break
    }

    return results
  }, [query, sort, filters])

  const totalPages = Math.ceil(filteredBusinesses.length / ITEMS_PER_PAGE)
  const paginatedResults = filteredBusinesses.slice(0, page * ITEMS_PER_PAGE)

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q)
    setPage(1)
    const sp = new URLSearchParams(searchParams?.toString())
    if (q) sp.set('q', q)
    else sp.delete('q')
    router.replace(`/${params?.country}/search?${sp.toString()}`, { scroll: false })
  }, [router, searchParams, params?.country])

  const handleSortChange = useCallback((s: string) => {
    setSort(s)
    setPage(1)
  }, [])

  const categories = country?.categories ?? ['Home Services', 'Healthcare', 'Education', 'Technology', 'Food & Dining', 'Beauty & Wellness']

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <SearchHeader
          query={query}
          onQueryChange={handleQueryChange}
          totalResults={filteredBusinesses.length}
          sort={sort}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          activeFilterCount={activeFilterCount}
          onToggleFilters={() => setShowFilters(!showFilters)}
          suggestions={SUGGESTIONS}
        />

        <div className="flex gap-8 mt-6">
          {/* Filter Sidebar - Desktop */}
          <FilterSidebar
            categories={categories}
            filters={filters}
            onChange={(f) => { setFilters(f); setPage(1) }}
            priceRange={priceRange}
            className="hidden lg:block"
          />

          {/* Overlay on mobile */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={() => setShowFilters(false)}
              >
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  className="absolute left-0 top-0 bottom-0 w-80 bg-surface p-6 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-text-primary">Filters</h3>
                    <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
                  </div>
                  <FilterSidebar
                    categories={categories}
                    filters={filters}
                    onChange={(f) => { setFilters(f); setPage(1) }}
                    priceRange={priceRange}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Map toggle */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setShowMap(!showMap)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                  showMap ? 'border-amber-500 text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'border-border text-text-secondary hover:border-amber-500/30'
                )}
              >
                <Map className="w-4 h-4" />
                Map view
              </button>
            </div>

            {/* Map placeholder */}
            <AnimatePresence>
              {showMap && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 240, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden rounded-xl mb-6"
                >
                  <div className="h-60 bg-surface-secondary border border-border rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <Map className="w-10 h-10 text-text-tertiary mx-auto" />
                      <p className="mt-2 text-sm text-text-secondary">Map view loading...</p>
                      <p className="text-xs text-text-tertiary mt-1">{filteredBusinesses.length} businesses in this area</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results grid/list */}
            {paginatedResults.length > 0 ? (
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                  : 'flex flex-col gap-4'
              )}>
                {paginatedResults.map((business, i) => (
                  viewMode === 'grid' ? (
                    <BusinessCard key={business.id} business={business} countryCode={countryCode} index={i} />
                  ) : (
                    <motion.div
                      key={business.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.03 }}
                      className="flex gap-5 bg-surface border border-border rounded-xl p-4 hover:shadow-md hover:border-amber-500/30 transition-all"
                    >
                      <div className="w-24 h-24 rounded-xl bg-surface-secondary shrink-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-amber-500">{business.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-amber-500 uppercase">{business.category}</span>
                        <h3 className="text-lg font-bold text-text-primary">{business.name}</h3>
                        <p className="text-sm text-text-secondary line-clamp-1">{business.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-text-secondary">
                          <span>★ {business.rating.toFixed(1)} ({business.reviewCount})</span>
                          <span>{business.address?.city}</span>
                          {business.deliveryAvailable && <span className="text-emerald-500">Delivery</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <span className="text-xs text-text-tertiary">{Math.floor(Math.random() * 10) + 1} km away</span>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500">
                          Book
                        </span>
                      </div>
                    </motion.div>
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <SearchHeader
                  query={query}
                  onQueryChange={() => {}}
                  totalResults={0}
                  sort={sort}
                  onSortChange={() => {}}
                  viewMode={viewMode}
                  onViewModeChange={() => {}}
                  activeFilterCount={0}
                  onToggleFilters={() => {}}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-4">
                  <Map className="w-8 h-8 text-text-tertiary" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">No results found</h3>
                <p className="text-text-secondary mt-1">Try adjusting your search or filters</p>
                <button
                  onClick={() => { setFilters({ categories: [], priceMin: 0, priceMax: 200000, rating: 0, maxDistance: 0, availableNow: false, openNow: false, deliveryAvailable: false }); setQuery('') }}
                  className="mt-4 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && paginatedResults.length < filteredBusinesses.length && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="px-6 py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors shadow-sm"
                >
                  Load more ({filteredBusinesses.length - paginatedResults.length} remaining)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
