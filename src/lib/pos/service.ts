import 'server-only'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { query, withTransaction } from '@/lib/neon/admin'
import { getCurrencyForCountry } from '@/lib/money'
import { saleTotals, toMinor } from './money'
import type { CounterSale, PosSettings, SaleItem, SaleKind, SaleLine } from './types'

export class PosError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}
export const settingsSchema = z.object({ enabled: z.boolean(), kioskEnabled: z.boolean(), taxBasisPoints: z.number().int().min(0).max(10000), taxInclusive: z.boolean() }).strict()
export const saleSchema = z.object({ businessId: z.string().uuid(), requestKey: z.string().uuid(), fulfillment: z.enum(['pickup', 'dine_in', 'service']), items: z.array(z.object({ id: z.string().uuid(), kind: z.enum(['product', 'menu', 'service']), quantity: z.number().int().min(1).max(99) }).strict()).min(1).max(100), tendered: z.string().regex(/^\d+(\.\d+)?$/).optional() }).strict()
type SaleInput = z.infer<typeof saleSchema>
type Sql = Parameters<Parameters<typeof withTransaction>[0]>[0]
interface BusinessRow extends Record<string, unknown> { id: string; name: string; owner_id: string; status: string; country_code: string; metadata: Record<string, unknown> | null }

function settingsFor(business: BusinessRow): PosSettings | null {
  const result = settingsSchema.safeParse(business.metadata?.pos)
  return result.success ? result.data : null
}
function normaliseSale(row: Record<string, unknown>): CounterSale {
  const amount = (key: string) => row[key] === null ? null : Number(row[key])
  return { ...row, subtotal_minor: amount('subtotal_minor'), tax_minor: amount('tax_minor'), total_minor: amount('total_minor'), tendered_minor: amount('tendered_minor'), change_minor: amount('change_minor') } as unknown as CounterSale
}

export async function getPos(userId: string | null, businessId?: string, kiosk = false) {
  const businesses = await query<BusinessRow>(
    kiosk ? `SELECT id,name,owner_id,status,country_code,metadata FROM businesses WHERE id=$1 AND status='active' AND metadata->'pos'->>'kioskEnabled'='true'`
      : `SELECT id,name,owner_id,status,country_code,metadata FROM businesses WHERE owner_id=$1 ORDER BY name`,
    [kiosk ? businessId : userId],
  )
  const selected = businessId ? businesses.find(b => b.id === businessId) : businesses[0]
  if (!selected) return { businesses: kiosk ? [] : businesses.map(b => ({ id: b.id, name: b.name })), business: null, items: [], sales: [], settings: null }
  const settings = settingsFor(selected)
  if (kiosk && (!settings?.enabled || !settings.kioskEnabled)) throw new PosError('This kiosk is not accepting orders.', 404)
  const currency = getCurrencyForCountry(selected.country_code)
  const items = await query<SaleItem & Record<string, unknown>>(
    `SELECT id,'product' AS kind,name,price::text,currency,images->>0 AS image,stock FROM products WHERE business_id=$1 AND is_available=true
     UNION ALL SELECT m.id,'menu',m.name,m.price::text,m.currency,m.image,NULL::integer FROM menu_items m JOIN restaurants r ON r.id=m.restaurant_id WHERE r.business_id=$1 AND m.is_available=true
     UNION ALL SELECT id,'service',name,price::text,currency,image,NULL::integer FROM services WHERE business_id=$1 AND is_available=true AND $2=false ORDER BY name`, [selected.id, kiosk],
  )
  const sales = kiosk ? [] : (await query(`SELECT * FROM pos_sales WHERE business_id=$1 ORDER BY created_at DESC LIMIT 100`, [selected.id])).map(normaliseSale)
  return { businesses: businesses.map(b => ({ id: b.id, name: b.name })), business: { id: selected.id, name: selected.name, currency }, items: items.filter(i => i.currency === currency), sales, settings }
}

export async function configurePos(userId: string, businessId: string, settings: PosSettings) {
  const parsed = settingsSchema.parse(settings)
  const rows = await query(`UPDATE businesses SET metadata=COALESCE(metadata,'{}'::jsonb) || jsonb_build_object('pos',$3::jsonb,'pos_configured_by',$2::text,'pos_configured_at',now()), updated_at=now() WHERE id=$1 AND owner_id=$2 RETURNING id`, [businessId, userId, JSON.stringify(parsed)])
  if (!rows.length) throw new PosError('Business not found.', 404)
}

async function canonicalLines(sql: Sql, business: BusinessRow, input: SaleInput, kiosk: boolean) {
  const currency = getCurrencyForCountry(business.country_code)
  const lines: SaleLine[] = []
  const seen = new Set<string>()
  // Stable locking order prevents deadlocks when two tills share inventory.
  for (const item of [...input.items].sort((a, b) => `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`))) {
    if (seen.has(item.id)) throw new PosError('Combine duplicate items before checkout.')
    seen.add(item.id)
    if (kiosk && item.kind === 'service') throw new PosError('Services must be handled at the counter.')
    const table: Record<SaleKind, string> = { product: 'products', service: 'services', menu: 'menu_items' }
    const rows = item.kind === 'menu'
      ? await sql(`SELECT m.id,m.name,m.price::text,m.currency,m.is_available FROM menu_items m JOIN restaurants r ON r.id=m.restaurant_id WHERE m.id=$1 AND r.business_id=$2 FOR UPDATE OF m`, [item.id, business.id])
      : await sql(`SELECT id,name,price::text,currency,is_available${item.kind === 'product' ? ',stock' : ''} FROM ${table[item.kind]} WHERE id=$1 AND business_id=$2 FOR UPDATE`, [item.id, business.id])
    const row = rows[0]
    if (!row || row.is_available !== true) throw new PosError('An item is no longer available.', 409)
    if (row.currency !== currency) throw new PosError('All sale items must use the business currency.', 409)
    if (item.kind === 'product' && Number(row.stock) < item.quantity) throw new PosError(`Not enough stock for ${row.name}.`, 409)
    lines.push({ id: item.id, kind: item.kind, name: String(row.name), quantity: item.quantity, unitMinor: toMinor(String(row.price), currency) })
  }
  return lines
}

async function takeStock(sql: Sql, saleId: string, lines: SaleLine[]) {
  for (const line of lines.filter(l => l.kind === 'product')) {
    const rows = await sql('UPDATE products SET stock=stock-$2 WHERE id=$1 AND is_available=true AND stock >= $2 RETURNING id', [line.id, line.quantity])
    if (!rows.length) throw new PosError(`Not enough stock for ${line.name}.`, 409)
    await sql('INSERT INTO inventory_log(product_id,quantity_change,reason,reference_id) VALUES ($1,$2,$3,$4)', [line.id, -line.quantity, 'Point of sale', saleId])
  }
}

export async function createSale(userId: string | null, input: SaleInput, kiosk = false): Promise<CounterSale> {
  const parsed = saleSchema.parse(input)
  const fingerprint = createHash('sha256').update(JSON.stringify({ channel: kiosk ? 'kiosk' : 'counter', fulfillment: parsed.fulfillment, items: [...parsed.items].sort((a, b) => a.id.localeCompare(b.id)), tendered: kiosk ? null : parsed.tendered })).digest('hex')
  return withTransaction(async sql => {
    // The business lock serializes idempotency checks as well as tax config.
    const [business] = await sql<BusinessRow>('SELECT * FROM businesses WHERE id=$1 FOR UPDATE', [parsed.businessId])
    if (!business || (!kiosk && business.owner_id !== userId)) throw new PosError('Business not found.', 404)
    const settings = settingsFor(business)
    if (!settings?.enabled || business.status !== 'active' || (kiosk && !settings.kioskEnabled)) throw new PosError('Point of sale is not enabled for this business.', 409)
    const [existing] = await sql('SELECT * FROM pos_sales WHERE business_id=$1 AND request_key=$2', [business.id, parsed.requestKey])
    if (existing) {
      if (existing.request_fingerprint !== fingerprint) throw new PosError('This checkout reference was already used for a different sale.', 409)
      return normaliseSale(existing)
    }
    const lines = await canonicalLines(sql, business, parsed, kiosk)
    if (lines.some(l => l.kind === 'service') && parsed.fulfillment !== 'service') throw new PosError('Service receipts require service fulfillment.')
    const currency = getCurrencyForCountry(business.country_code)
    const amounts = saleTotals(lines.reduce((sum, l) => sum + l.unitMinor * l.quantity, 0), settings.taxBasisPoints, settings.taxInclusive)
    if (amounts.totalMinor <= 0) throw new PosError('The sale total must be greater than zero.')
    const tendered = kiosk ? null : toMinor(parsed.tendered ?? '0', currency)
    if (!kiosk && tendered! < amounts.totalMinor) throw new PosError('Cash received is below the sale total.')
    if (kiosk) {
      const [pending] = await sql("SELECT count(*)::int AS count FROM pos_sales WHERE business_id=$1 AND status='awaiting_payment' AND created_at>now()-interval '15 minutes'", [business.id])
      if (Number(pending.count) >= 100) throw new PosError('The kiosk queue is full. Please order at the counter.', 429)
    }
    const [sale] = await sql(
      `INSERT INTO pos_sales(business_id,operator_id,request_key,request_fingerprint,channel,status,fulfillment,currency,lines,subtotal_minor,tax_minor,total_minor,tendered_minor,change_minor,tax_basis_points,tax_inclusive,paid_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15,$16,CASE WHEN $6='paid' THEN now() ELSE NULL END) RETURNING *`,
      [business.id, kiosk ? null : userId, parsed.requestKey, fingerprint, kiosk ? 'kiosk' : 'counter', kiosk ? 'awaiting_payment' : 'paid', parsed.fulfillment, currency, JSON.stringify(lines), amounts.subtotalMinor, amounts.taxMinor, amounts.totalMinor, tendered, kiosk ? null : tendered! - amounts.totalMinor, settings.taxBasisPoints, settings.taxInclusive],
    )
    if (!kiosk) await takeStock(sql, String(sale.id), lines)
    await sql('INSERT INTO pos_sale_events(sale_id,event,actor_id) VALUES ($1,$2,$3)', [sale.id, kiosk ? 'order_requested' : 'cash_collected', kiosk ? null : userId])
    return normaliseSale(sale)
  })
}

export async function updateSale(userId: string, saleId: string, action: 'collect_cash' | 'cancel' | 'preparing' | 'ready' | 'completed', tendered?: string) {
  return withTransaction(async sql => {
    const [sale] = await sql(`SELECT s.* FROM pos_sales s JOIN businesses b ON b.id=s.business_id WHERE s.id=$1 AND b.owner_id=$2 FOR UPDATE OF s`, [saleId, userId])
    if (!sale) throw new PosError('Sale not found.', 404)
    if (action === 'collect_cash') {
      if (sale.status === 'paid') return normaliseSale(sale)
      if (sale.status !== 'awaiting_payment' || Date.now() - new Date(String(sale.created_at)).getTime() > 15 * 60 * 1000) throw new PosError('This kiosk order has expired. Please create a new order.', 409)
      const cash = toMinor(tendered ?? '0', String(sale.currency))
      if (cash < Number(sale.total_minor)) throw new PosError('Cash received is below the sale total.')
      // Recheck availability; the public kiosk never reserves stock.
      for (const line of sale.lines as SaleLine[]) {
        const table = line.kind === 'product' ? 'products' : line.kind === 'menu' ? 'menu_items' : 'services'
        const [item] = await sql(`SELECT is_available FROM ${table} WHERE id=$1 FOR UPDATE`, [line.id])
        if (!item?.is_available) throw new PosError(`${line.name} is no longer available.`, 409)
      }
      await takeStock(sql, String(sale.id), sale.lines as SaleLine[])
      const [updated] = await sql("UPDATE pos_sales SET status='paid',operator_id=$2,tendered_minor=$3,change_minor=$3-total_minor,paid_at=now(),updated_at=now() WHERE id=$1 RETURNING *", [saleId, userId, cash])
      await sql("INSERT INTO pos_sale_events(sale_id,event,actor_id) VALUES ($1,'cash_collected',$2)", [saleId, userId])
      return normaliseSale(updated)
    }
    if (action === 'cancel') {
      if (sale.status !== 'awaiting_payment') throw new PosError('Only unpaid orders can be cancelled here.', 409)
      const [updated] = await sql("UPDATE pos_sales SET status='cancelled',updated_at=now() WHERE id=$1 RETURNING *", [saleId])
      await sql("INSERT INTO pos_sale_events(sale_id,event,actor_id) VALUES ($1,'cancelled',$2)", [saleId, userId])
      return normaliseSale(updated)
    }
    const next: Record<string, string> = { pending: 'preparing', preparing: 'ready', ready: 'completed' }
    if (sale.status !== 'paid' || next[String(sale.prep_status)] !== action) throw new PosError('The order has changed. Refresh the queue.', 409)
    const [updated] = await sql('UPDATE pos_sales SET prep_status=$2,updated_at=now() WHERE id=$1 RETURNING *', [saleId, action])
    await sql('INSERT INTO pos_sale_events(sale_id,event,actor_id) VALUES ($1,$2,$3)', [saleId, action, userId])
    return normaliseSale(updated)
  })
}
