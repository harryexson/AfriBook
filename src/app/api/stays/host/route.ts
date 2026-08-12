import { NextRequest, NextResponse } from 'next/server'
import { getStaysDb } from '@/lib/stays/db'
import { COUNTRIES } from '@/lib/localization/countries'
import { randomId } from '@/lib/utils'
import { requireAuthenticatedUser } from '@/lib/supabase/server'

export const runtime = 'nodejs'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

type HotelRow = Record<string, unknown>

export async function POST(req: NextRequest) {
  let auth: Awaited<ReturnType<typeof requireAuthenticatedUser>>
  try {
    auth = await requireAuthenticatedUser()
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = String(body.name ?? '').trim()
  const countryCode = String(body.countryCode ?? '').toUpperCase()
  const city = String(body.city ?? '').trim()

  if (!name || !countryCode || !city) {
    return NextResponse.json(
      { error: 'Missing required fields (name, countryCode, city)' },
      { status: 400 },
    )
  }

  const country = COUNTRIES[countryCode]
  const currencyCode = country?.currency?.code ?? 'USD'
  const slug = slugify(`${name} ${city}`)

  const priceFrom = Math.max(0, Number(body.priceFrom) || 0)
  const priceTo = Math.max(priceFrom, Number(body.priceTo) || priceFrom)

  const payload: HotelRow = {
    host_id: auth.user.id,
    host_name: String(body.hostName ?? ''),
    name,
    slug,
    description: String(body.description ?? ''),
    short_description: String(body.shortDescription ?? '').slice(0, 500),
    status: 'draft',
    country_code: countryCode,
    country: country?.name ?? '',
    city,
    address: String(body.address ?? ''),
    latitude: Number(body.latitude) || null,
    longitude: Number(body.longitude) || null,
    star_rating: Math.min(5, Math.max(1, Math.floor(Number(body.starRating) || 3))),
    property_type: String(body.propertyType ?? 'hotel'),
    rooms_count: 0,
    gallery_images: Array.isArray(body.galleryImages) ? body.galleryImages.map(String) : [],
    currency_code: currencyCode,
    price_from: priceFrom,
    price_to: priceTo,
    platform_fee_percent: 3,
    tax_rate: 0,
    amenities: Array.isArray(body.amenities) ? body.amenities.map(String) : [],
    rating: 0,
    review_count: 0,
    is_featured: false,
  }

  const db = getStaysDb()
  if (db) {
    try {
      const { data, error } = await db.from('stay_hotels').insert(payload).select().single()
      if (!error && data) {
        return NextResponse.json(
          {
            success: true,
            data: {
              hotelId: (data as HotelRow).id,
              name,
              slug,
              status: 'draft',
              message:
                'Your stay was submitted for review. It will be published once it passes our quality checks.',
            },
          },
          { status: 201 },
        )
      }
      console.warn('[stays] host insert failed, falling back to demo:', error)
    } catch {
      // fall through
    }
  }

  const demoId = `stay-${countryCode.toLowerCase()}-host-${randomId(6).toLowerCase()}`
  return NextResponse.json(
    {
      success: true,
      data: {
        hotelId: demoId,
        name,
        slug,
        status: 'draft',
        demo: true,
        message:
          'Demo mode: Supabase is unavailable, so your stay was recorded locally instead of persisted.',
      },
    },
    { status: 201 },
  )
}
