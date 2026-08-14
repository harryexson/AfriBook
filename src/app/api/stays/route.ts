import { NextRequest, NextResponse } from 'next/server'
import { getStaysDb } from '@/lib/stays/db'
import { getStayHotels } from '@/lib/stays/stays-data'
import { stayHotelFromDb, toStayHotel } from '@/lib/stays/types'
import type { StayHotel } from '@/lib/stays/types'

export const runtime = 'nodejs'

const VALID_SORTS = ['recommended', 'price-asc', 'price-desc', 'rating', 'reviews']

type HotelRow = Record<string, unknown>

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const countryCode = (searchParams.get('countryCode') ?? '').toUpperCase()
  const city = searchParams.get('city') ?? ''
  const q = (searchParams.get('q') ?? '').trim().toLowerCase()
  const minPrice = Number(searchParams.get('minPrice') ?? 0) || 0
  const maxPrice = Number(searchParams.get('maxPrice') ?? 0) || 0
  const amenity = searchParams.get('amenity') ?? ''
  const sort = VALID_SORTS.includes(searchParams.get('sort') ?? '') ? searchParams.get('sort')! : 'recommended'
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
  const limit = Math.min(48, Math.max(1, Number(searchParams.get('limit') ?? 12) || 12))

  const db = getStaysDb()
  let data: StayHotel[] | null = null
  let source: 'db' | 'mock' = 'mock'
  let total = 0

  if (db) {
    try {
      let query = db.from('stay_hotels').select('*', { count: 'exact' }).eq('status', 'published')
      if (countryCode) query = query.eq('country_code', countryCode)
      if (city) query = query.eq('city', city)
      if (minPrice > 0) query = query.gte('price_from', minPrice)
      if (maxPrice > 0) query = query.lte('price_to', maxPrice)
      if (amenity) query = query.contains('amenities', [amenity])

      if (sort === 'price-asc') query = query.order('price_from', { ascending: true })
      else if (sort === 'price-desc') query = query.order('price_from', { ascending: false })
      else if (sort === 'rating') query = query.order('rating', { ascending: false })
      else if (sort === 'reviews') query = query.order('review_count', { ascending: false })
      else query = query.order('is_featured', { ascending: false }).order('rating', { ascending: false })

      const { data: rows, error, count } = await query.range((page - 1) * limit, page * limit - 1)

      if (!error && Array.isArray(rows)) {
        const mapped = (rows as HotelRow[])
          .map((row) => stayHotelFromDb(row))
          .filter((h): h is StayHotel => h !== null)
        if (mapped.length > 0) {
          data = mapped
          source = 'db'
          total = count ?? mapped.length
        }
      }
    } catch {
      // fall through to mock
    }
  }

  if (!data) {
    const hotels = getStayHotels(countryCode || 'NG')
    let filtered = hotels
    if (city) filtered = filtered.filter((h) => h.city.toLowerCase() === city.toLowerCase())
    if (q) {
      const needle = q
      filtered = filtered.filter(
        (h) =>
          h.name.toLowerCase().includes(needle) ||
          h.city.toLowerCase().includes(needle) ||
          h.country.toLowerCase().includes(needle) ||
          h.shortDescription.toLowerCase().includes(needle),
      )
    }
    if (minPrice > 0) filtered = filtered.filter((h) => h.priceFrom >= minPrice)
    if (maxPrice > 0) filtered = filtered.filter((h) => h.priceTo <= maxPrice)
    if (amenity) filtered = filtered.filter((h) => h.amenities.includes(amenity))

    const sorted = [...filtered]
    if (sort === 'price-asc') sorted.sort((a, b) => a.priceFrom - b.priceFrom)
    else if (sort === 'price-desc') sorted.sort((a, b) => b.priceFrom - a.priceFrom)
    else if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating)
    else if (sort === 'reviews') sorted.sort((a, b) => b.reviewCount - a.reviewCount)
    else sorted.sort(
      (a, b) =>
        Number(b.isSponsored) - Number(a.isSponsored) ||
        Number(b.isFeatured) - Number(a.isFeatured) ||
        b.rating - a.rating,
    )

    total = sorted.length
    data = sorted.slice((page - 1) * limit, page * limit).map((h) => toStayHotel(h))
  }

  return NextResponse.json({
    success: true,
    source,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  })
}
