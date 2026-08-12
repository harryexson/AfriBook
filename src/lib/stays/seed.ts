// ─────────────────────────────────────────────────────────────
// StaysCape — Seed service.
//
// On first read, real hotels/rooms/availability rows are inserted
// from the deterministic per-country data (stays-data.ts) so the
// browse/detail/book flow works against real Supabase tables.
// Subsequent loads see rows already present and skip seeding.
// ─────────────────────────────────────────────────────────────

import { getStayHotels, getStayRoomsForHotel } from './stays-data'
import { COUNTRIES } from '@/lib/localization/countries'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

export const SEED_AVAILABILITY_DAYS = 90

type Db = SupabaseClient<Database>

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    Math.random().toString(36).slice(2, 8)
  )
}

export interface SeedResult {
  countries: number
  hotels: number
  rooms: number
  availability: number
}

/** Seed one country's stays if it has no rows yet. */
export async function seedCountryStays(supabase: Db, countryCode: string): Promise<SeedResult> {
  const result: SeedResult = { countries: 0, hotels: 0, rooms: 0, availability: 0 }
  const country = COUNTRIES[countryCode]
  if (!country) return result

  const hotels = getStayHotels(countryCode)
  if (hotels.length === 0) return result

  const { count } = await supabase
    .from('stay_hotels')
    .select('id', { count: 'exact', head: true })
    .eq('country_code', countryCode)

  if ((count ?? 0) > 0) return result

  for (const hotel of hotels) {
    const hotelRow: Record<string, unknown> = {
      name: hotel.name,
      slug: slugify(hotel.name),
      description: hotel.description,
      short_description: hotel.shortDescription,
      status: 'published',
      country_code: hotel.countryCode,
      country: hotel.country,
      city: hotel.city,
      address: hotel.address.formatted,
      latitude: hotel.location.latitude,
      longitude: hotel.location.longitude,
      star_rating: hotel.starRating,
      property_type: hotel.propertyType,
      check_in_time: hotel.checkInTime,
      check_out_time: hotel.checkOutTime,
      rooms_count: hotel.roomsCount,
      cover_image_url: hotel.galleryImages[0] ?? '',
      gallery_images: hotel.galleryImages,
      currency_code: hotel.currencyCode,
      price_from: hotel.priceFrom,
      price_to: hotel.priceTo,
      platform_fee_percent: 3,
      tax_rate: country.taxRate,
      amenities: hotel.amenities,
      rating: hotel.rating,
      review_count: hotel.reviewCount,
      is_featured: hotel.isFeatured,
    }

    const { data: inserted, error: hotelError } = await supabase
      .from('stay_hotels')
      .insert(hotelRow)
      .select('id')
      .single()

    if (hotelError || !inserted) continue
    result.hotels += 1
    const hotelId = inserted.id

    const rooms = getStayRoomsForHotel(hotel.id)
    const availabilityRows: Record<string, unknown>[] = []

    for (const room of rooms) {
      const roomRow: Record<string, unknown> = {
        hotel_id: hotelId,
        room_type: room.roomType,
        name: room.name,
        description: room.description,
        max_occupancy: room.maxOccupancy,
        bed_count: room.bedCount,
        bed_type: room.bedType,
        size_sqm: room.sizeSqm,
        price_per_night: room.pricePerNight,
        currency_code: room.currencyCode,
        min_nights: room.minNights,
        quantity: room.quantity,
        available: room.quantity,
        photos: room.photos,
        amenities: room.amenities,
      }

      const { data: roomInserted, error: roomError } = await supabase
        .from('stay_rooms')
        .insert(roomRow)
        .select('id')
        .single()

      if (roomError || !roomInserted) continue
      result.rooms += 1
      const roomId = roomInserted.id

      for (let i = 0; i < SEED_AVAILABILITY_DAYS; i++) {
        const d = new Date()
        d.setUTCDate(d.getUTCDate() + i)
        availabilityRows.push({
          room_id: roomId,
          hotel_id: hotelId,
          stay_date: d.toISOString().slice(0, 10),
          total: room.quantity,
          booked: 0,
        })
      }
    }

    if (availabilityRows.length > 0) {
      const { error: availError } = await supabase
        .from('stay_room_availability')
        .insert(availabilityRows)
      if (!availError) result.availability += availabilityRows.length
    }
  }

  result.countries = 1
  return result
}

/** Seed every configured country (used by the health endpoint and on first boot). */
export async function ensureStaysSeeded(
  supabase: Db,
  countryCodes?: string[],
): Promise<SeedResult> {
  const codes = countryCodes && countryCodes.length > 0 ? countryCodes : Object.keys(COUNTRIES)
  const totals: SeedResult = { countries: 0, hotels: 0, rooms: 0, availability: 0 }

  for (const code of codes) {
    const partial = await seedCountryStays(supabase, code)
    totals.countries += partial.countries
    totals.hotels += partial.hotels
    totals.rooms += partial.rooms
    totals.availability += partial.availability
  }

  return totals
}
