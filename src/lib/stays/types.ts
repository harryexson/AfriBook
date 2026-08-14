// ─────────────────────────────────────────────────────────────
// StaysCape — API-facing domain types and mappers.
//
// Mock data (stays-data.ts) is deterministic per country; real
// rows come from the Supabase tables created in migration 008.
// These types are the single contract shared by API routes,
// pages and components.
// ─────────────────────────────────────────────────────────────

import type { StayHotelData, StayRoomData } from './stays-data'
import { getCurrencyForCountry } from '@/lib/money'

export type StayHotelStatus = 'draft' | 'published' | 'suspended' | 'archived'

export type StayRoomType =
  | 'standard'
  | 'deluxe'
  | 'superior'
  | 'suite'
  | 'executive'
  | 'family'
  | 'studio'
  | 'apartment'
  | 'villa'
  | 'hostel'
  | 'shared'

export type StayBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type StayPaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'

export interface StayContact {
  phone: string
  email: string
}

export interface StayHotel {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  status: StayHotelStatus
  countryCode: string
  country: string
  city: string
  address: string
  latitude: number | null
  longitude: number | null
  starRating: number
  propertyType: string
  checkInTime: string
  checkOutTime: string
  galleryImages: string[]
  currencyCode: string
  priceFrom: number
  priceTo: number
  platformFeePercent: number
  taxRate: number
  amenities: string[]
  rating: number
  reviewCount: number
  roomsCount: number
  isFeatured: boolean
  isSponsored: boolean
  contact: StayContact
}

export interface StayRoom {
  id: string
  hotelId: string
  roomType: StayRoomType | string
  name: string
  description: string
  maxOccupancy: number
  bedCount: number
  bedType: string
  bathrooms: number
  sizeSqm: number | null
  pricePerNight: number
  currencyCode: string
  minNights: number
  quantity: number
  photos: string[]
  amenities: string[]
  isActive: boolean
}

export interface StayAvailability {
  available: boolean
  pricePerNight?: number
  currencyCode?: string
  nights?: number
  reason?: string
  date?: string
  remaining?: number
}

export interface StayBooking {
  id: string
  bookingCode: string
  hotelId: string
  roomId: string
  guestId: string | null
  guestName: string
  guestEmail: string
  guestPhone: string
  checkInDate: string
  checkOutDate: string
  nights: number
  guests: number
  pricePerNight: number
  subtotal: number
  platformFee: number
  tax: number
  total: number
  currencyCode: string
  status: StayBookingStatus
  paymentStatus: StayPaymentStatus
  paymentIntentId: string | null
  paymentMethod: string | null
  specialRequests: string
  guestMessage: string
  guestMetadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  hotel?: {
    id: string
    name: string
    slug: string
    city: string
    country: string
    countryCode: string
    galleryImages: string[]
    rating: number
    reviewCount: number
    coverImageUrl?: string
  }
  room?: Pick<StayRoom, 'id' | 'name' | 'roomType' | 'maxOccupancy' | 'photos'>
}

export interface StayBookingLookup {
  id: string
  bookingCode: string
  hotelId: string
  roomId: string
  guestName: string
  checkInDate: string
  checkOutDate: string
  nights: number
  guests: number
  pricePerNight: number
  subtotal: number
  platformFee: number
  tax: number
  total: number
  currencyCode: string
  status: StayBookingStatus
  paymentStatus: StayPaymentStatus
  paymentMethod: string | null
  createdAt: string
  hotel: {
    id: string
    name: string
    slug: string
    city: string
    country: string
    countryCode: string
    coverImageUrl: string
    galleryImages: string[]
    rating: number
    reviewCount: number
  } | null
  room: {
    id: string
    name: string
    roomType: string
    maxOccupancy: number
    photos: string[]
  } | null
}

export const DEFAULT_PLATFORM_FEE_PERCENT = 3

export function toStayHotel(data: StayHotelData): StayHotel {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    shortDescription: data.shortDescription,
    status: 'published',
    countryCode: data.countryCode,
    country: data.country,
    city: data.city,
    address: data.address.formatted,
    latitude: data.location.latitude,
    longitude: data.location.longitude,
    starRating: data.starRating,
    propertyType: data.propertyType,
    checkInTime: data.checkInTime,
    checkOutTime: data.checkOutTime,
    galleryImages: data.galleryImages,
    currencyCode: data.currencyCode,
    priceFrom: data.priceFrom,
    priceTo: data.priceTo,
    platformFeePercent: DEFAULT_PLATFORM_FEE_PERCENT,
    taxRate: 0,
    amenities: data.amenities,
    rating: data.rating,
    reviewCount: data.reviewCount,
    roomsCount: data.roomsCount,
    isFeatured: data.isFeatured,
    isSponsored: data.isSponsored,
    contact: data.contact,
  }
}

export function toStayRoom(data: StayRoomData): StayRoom {
  return {
    id: data.id,
    hotelId: data.hotelId,
    roomType: data.roomType,
    name: data.name,
    description: data.description,
    maxOccupancy: data.maxOccupancy,
    bedCount: data.bedCount,
    bedType: data.bedType,
    bathrooms: data.bathrooms,
    sizeSqm: data.sizeSqm,
    pricePerNight: data.pricePerNight,
    currencyCode: data.currencyCode,
    minNights: data.minNights,
    quantity: data.quantity,
    photos: data.photos,
    amenities: data.amenities,
    isActive: true,
  }
}

type DbRow = Record<string, unknown>

function num(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function strArr(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : []
}

export function stayHotelFromDb(row: DbRow): StayHotel | null {
  if (!row?.id) return null
  return {
    id: str(row.id),
    name: str(row.name),
    slug: str(row.slug),
    description: str(row.description),
    shortDescription: str(row.short_description),
    status: (str(row.status, 'draft') as StayHotelStatus) ?? 'draft',
    countryCode: str(row.country_code),
    country: str(row.country),
    city: str(row.city),
    address: str(row.address),
    latitude: row.latitude != null ? num(row.latitude) : null,
    longitude: row.longitude != null ? num(row.longitude) : null,
    starRating: num(row.star_rating),
    propertyType: str(row.property_type, 'hotel'),
    checkInTime: str(row.check_in_time, '14:00'),
    checkOutTime: str(row.check_out_time, '11:00'),
    galleryImages: strArr(row.gallery_images),
    currencyCode: str(row.currency_code, getCurrencyForCountry(str(row.country_code))),
    priceFrom: num(row.price_from),
    priceTo: num(row.price_to),
    platformFeePercent: num(row.platform_fee_percent, DEFAULT_PLATFORM_FEE_PERCENT),
    taxRate: num(row.tax_rate),
    amenities: strArr(row.amenities),
    rating: num(row.rating),
    reviewCount: num(row.review_count),
    roomsCount: num(row.rooms_count),
    isFeatured: Boolean(row.is_featured),
    isSponsored: Boolean(row.is_sponsored),
    contact: {
      phone: str(row.host_phone),
      email: str(row.host_email),
    },
  }
}

export function stayRoomFromDb(row: DbRow): StayRoom | null {
  if (!row?.id) return null
  return {
    id: str(row.id),
    hotelId: str(row.hotel_id),
    roomType: str(row.room_type, 'standard'),
    name: str(row.name),
    description: str(row.description),
    maxOccupancy: num(row.max_occupancy, 2),
    bedCount: num(row.bed_count, 1),
    bedType: str(row.bed_type, 'double'),
    bathrooms: num(row.bathrooms, 1),
    sizeSqm: row.size_sqm != null ? num(row.size_sqm) : null,
    pricePerNight: num(row.price_per_night),
    currencyCode: str(row.currency_code, getCurrencyForCountry(str(row.country_code))),
    minNights: num(row.min_nights, 1),
    quantity: num(row.quantity, 1),
    photos: strArr(row.photos),
    amenities: strArr(row.amenities),
    isActive: row.is_active !== false,
  }
}

export function stayBookingFromDb(row: DbRow): StayBooking | null {
  if (!row?.id) return null
  return {
    id: str(row.id),
    bookingCode: str(row.booking_code),
    hotelId: str(row.hotel_id),
    roomId: str(row.room_id),
    guestId: row.guest_id != null ? str(row.guest_id) : null,
    guestName: str(row.guest_name),
    guestEmail: str(row.guest_email),
    guestPhone: str(row.guest_phone),
    checkInDate: str(row.check_in_date),
    checkOutDate: str(row.check_out_date),
    nights: num(row.nights, 1),
    guests: num(row.guests, 1),
    pricePerNight: num(row.price_per_night),
    subtotal: num(row.subtotal),
    platformFee: num(row.platform_fee),
    tax: num(row.tax),
    total: num(row.total),
    currencyCode: str(row.currency_code, 'NGN'),
    status: (str(row.status, 'pending') as StayBookingStatus) ?? 'pending',
    paymentStatus:
      (str(row.payment_status, 'pending') as StayPaymentStatus) ?? 'pending',
    paymentIntentId: row.payment_intent_id != null ? str(row.payment_intent_id) : null,
    paymentMethod: row.payment_method != null ? str(row.payment_method) : null,
    specialRequests: str(row.special_requests),
    guestMessage: str(row.guest_message),
    guestMetadata:
      row.guest_metadata && typeof row.guest_metadata === 'object'
        ? (row.guest_metadata as Record<string, unknown>)
        : {},
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
  }
}
