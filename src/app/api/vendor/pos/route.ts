import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthenticatedUser } from '@/lib/neon/server'
import { configurePos, createSale, getPos, PosError, saleSchema, settingsSchema, updateSale } from '@/lib/pos/service'

function failure(error: unknown) {
  const status = error instanceof PosError ? error.status : error instanceof z.ZodError ? 400 : error instanceof Error && 'status' in error && error.status === 401 ? 401 : 503
  return NextResponse.json({ error: error instanceof PosError ? error.message : status === 400 ? 'Check the sale details and try again.' : status === 401 ? 'Sign in to use point of sale.' : 'Point of sale is unavailable. Check the database configuration and migration.' }, { status })
}
export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuthenticatedUser()
    const businessId = req.nextUrl.searchParams.get('businessId') || undefined
    if (businessId) z.string().uuid().parse(businessId)
    return NextResponse.json(await getPos(user.id, businessId), { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return failure(error) }
}
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuthenticatedUser()
    const input = saleSchema.parse(await req.json())
    const sale = await createSale(user.id, input)
    return NextResponse.json({ sale }, { status: 201 })
  } catch (error) { return failure(error) }
}
export async function PATCH(req: NextRequest) {
  try {
    const { user } = await requireAuthenticatedUser()
    const input = z.discriminatedUnion('action', [
      z.object({ action: z.literal('configure'), businessId: z.string().uuid(), settings: settingsSchema }).strict(),
      z.object({ action: z.enum(['collect_cash', 'cancel', 'preparing', 'ready', 'completed']), saleId: z.string().uuid(), tendered: z.string().regex(/^\d+(\.\d+)?$/).optional() }).strict(),
    ]).parse(await req.json())
    if (input.action === 'configure') { await configurePos(user.id, input.businessId, input.settings); return NextResponse.json({ success: true }) }
    return NextResponse.json({ sale: await updateSale(user.id, input.saleId, input.action, input.tendered) })
  } catch (error) { return failure(error) }
}
