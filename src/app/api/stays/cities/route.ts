import { NextRequest, NextResponse } from 'next/server'
import { getStayCities, getStayHotels } from '@/lib/stays/stays-data'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const countryCode = (req.nextUrl.searchParams.get('countryCode') ?? 'NG').toUpperCase()
  const cities = getStayCities(countryCode)
  const hotels = getStayHotels(countryCode)

  const data = cities.map((city) => ({
    name: city,
    hotelCount: hotels.filter((h) => h.city === city).length,
  }))

  return NextResponse.json({ success: true, data })
}
