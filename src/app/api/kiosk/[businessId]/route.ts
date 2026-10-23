import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSale, getPos, PosError, saleSchema } from '@/lib/pos/service'
import { checkRateLimit } from '@/lib/rate-limit'

type Context = { params: Promise<{ businessId: string }> }
function failure(error: unknown) {
  const status = error instanceof PosError ? error.status : error instanceof z.ZodError ? 400 : 503
  return NextResponse.json({ error: error instanceof PosError ? error.message : status === 400 ? 'Check the order details.' : 'The kiosk is temporarily unavailable. Please order at the counter.' }, { status })
}
export async function GET(_req: NextRequest, context: Context) {
  try {
    const { businessId } = await context.params
    z.string().uuid().parse(businessId)
    const data = await getPos(null, businessId, true)
    if (!data.business) return NextResponse.json({ error: 'This kiosk is not available.' }, { status: 404 })
    return NextResponse.json({ business: data.business, items: data.items, settings: data.settings }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return failure(error) }
}
export async function POST(req: NextRequest, context: Context) {
  try {
    const { businessId } = await context.params
    const limit = await checkRateLimit(`kiosk:${businessId}:${req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'}`, 5, 60000)
    if (!limit.allowed) return NextResponse.json({ error: 'Please wait before placing another order.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } })
    const body = await req.json()
    const input = saleSchema.parse({ ...body, businessId })
    if (input.tendered !== undefined) throw new PosError('Payment is collected by staff at the counter.')
    const sale = await createSale(null, input, true)
    // Never expose other orders, staff identifiers or a receipt claiming paid.
    return NextResponse.json({ order: { id: sale.id, status: sale.status, currency: sale.currency, totalMinor: sale.total_minor } }, { status: 201 })
  } catch (error) { return failure(error) }
}
