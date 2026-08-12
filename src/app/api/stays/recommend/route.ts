import { NextRequest, NextResponse } from 'next/server'
import { getStaysDb } from '@/lib/stays/db'
import { resolveStayHotel } from '@/lib/stays/resolver'
import { buildStayBundle, getStayTips } from '@/lib/stays/assistant'
import type { BundleEventInput } from '@/lib/stays/assistant'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const hotelId = String(body.hotelId ?? '')
  if (!hotelId) {
    return NextResponse.json({ error: 'hotelId is required' }, { status: 400 })
  }

  const db = getStaysDb()
  const hotel = await resolveStayHotel(db, hotelId)
  if (!hotel) {
    return NextResponse.json({ error: 'Stay not found' }, { status: 404 })
  }

  const cc = hotel.countryCode

  // Best-effort: attach a real, published, paid event from the same country.
  let event: BundleEventInput | null = null
  if (db) {
    try {
      const { data, error } = await db
        .from('events')
        .select('id, title, min_price, currency_code')
        .eq('status', 'published')
        .eq('is_free', false)
        .or(`country_code.eq.${cc},country.eq.${hotel.country}`)
        .gt('min_price', 0)
        .order('min_price', { ascending: true })
        .limit(1)

      if (!error && Array.isArray(data) && data.length > 0) {
        const row = data[0]
        event = {
          id: String(row.id),
          title: String(row.title),
          minPrice: Number(row.min_price) || 0,
          currencyCode: String(row.currency_code ?? hotel.currencyCode),
        }
      }
    } catch {
      // no event — bundle simply has ride + food
    }
  }

  const bundle = buildStayBundle(hotel, cc, event)

  return NextResponse.json({
    success: true,
    data: {
      tips: getStayTips(hotel, cc),
      bundle,
    },
  })
}
