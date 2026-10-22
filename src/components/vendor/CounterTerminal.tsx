'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, Plus, Minus, ShoppingBag, Receipt, Settings2, ArrowRight, Check, Monitor, ChefHat, RefreshCw, Printer, X } from 'lucide-react'
import { formatMinor, saleTotals, toMinor } from '@/lib/pos/money'
import type { CounterSale, PosSettings, SaleItem } from '@/lib/pos/types'
import styles from './CounterTerminal.module.css'

interface Data { businesses?: { id: string; name: string }[]; business: { id: string; name: string; currency: string } | null; items: SaleItem[]; sales?: CounterSale[]; settings: PosSettings | null }
type Tab = 'counter' | 'orders' | 'kitchen' | 'settings'
type Cart = { item: SaleItem; quantity: number }[]

export default function CounterTerminal({ kiosk = false, businessId: kioskBusinessId }: { kiosk?: boolean; businessId?: string }) {
  const [data, setData] = useState<Data | null>(null)
  const [businessId, setBusinessId] = useState(kioskBusinessId || '')
  const [cart, setCart] = useState<Cart>([])
  const [tab, setTab] = useState<Tab>('counter')
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [tendered, setTendered] = useState('')
  const [fulfillment, setFulfillment] = useState('pickup')
  const [receipt, setReceipt] = useState<CounterSale | null>(null)
  const [kioskOrder, setKioskOrder] = useState<{ id: string; totalMinor: number; currency: string } | null>(null)
  const [pending, setPending] = useState<CounterSale | null>(null)
  const request = useRef<{ fingerprint: string; key: string } | null>(null)
  const version = useRef(0)
  const endpoint = kiosk ? `/api/kiosk/${kioskBusinessId}` : '/api/vendor/pos'
  const load = useCallback(async (background = false) => {
    const current = ++version.current
    if (!background) setLoading(true)
    try {
      const res = await fetch(`${endpoint}${!kiosk && businessId ? `?businessId=${encodeURIComponent(businessId)}` : ''}`, { cache: 'no-store' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Could not connect to your business.')
      if (current === version.current) { setData(body); setError('') }
    } catch (err) { if (current === version.current) setError(err instanceof Error ? err.message : 'Connection failed.') }
    finally { if (current === version.current) setLoading(false) }
  }, [endpoint, kiosk, businessId])
  useEffect(() => { setData(null); setCart([]); setReceipt(null); setPending(null); setTendered(''); void load(); return () => { version.current++ } }, [load])
  useEffect(() => { if (kiosk || (tab !== 'orders' && tab !== 'kitchen')) return; const timer = setInterval(() => { if (!document.hidden && !busy) void load(true) }, 15000); return () => clearInterval(timer) }, [kiosk, tab, load, busy])
  useEffect(() => {
    if (!kiosk) return
    let timer: ReturnType<typeof setTimeout>
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => { setCart([]); setSearch(''); setKioskOrder(null); request.current = null }, 90000) }
    reset(); document.addEventListener('pointerdown', reset); document.addEventListener('keydown', reset)
    return () => { clearTimeout(timer); document.removeEventListener('pointerdown', reset); document.removeEventListener('keydown', reset) }
  }, [kiosk])
  const currency = data?.business?.currency || 'USD'
  const total = useMemo(() => {
    try { return saleTotals(cart.reduce((sum, line) => sum + toMinor(line.item.price, currency) * line.quantity, 0), data?.settings?.taxBasisPoints || 0, data?.settings?.taxInclusive || false) }
    catch { return null }
  }, [cart, data?.settings, currency])
  const items = data?.items.filter(item => (kind === 'all' || item.kind === kind) && item.name.toLowerCase().includes(search.toLowerCase())) || []
  const add = (item: SaleItem, delta = 1) => {
    if (busy) return
    setReceipt(null)
    setCart(current => {
      const existing = current.find(l => l.item.id === item.id)
      if (!existing) return delta > 0 ? [...current, { item, quantity: 1 }] : current
      const quantity = Math.min(99, existing.quantity + delta)
      return quantity <= 0 ? current.filter(l => l.item.id !== item.id) : current.map(l => l.item.id === item.id ? { ...l, quantity } : l)
    })
    if (item.kind === 'service') setFulfillment('service')
  }
  const submit = async () => {
    if (!data?.business || !cart.length || !total || busy) return
    setError(''); setBusy(true)
    const body = { ...(kiosk ? {} : { businessId: data.business.id, tendered }), fulfillment, items: cart.map(l => ({ id: l.item.id, kind: l.item.kind, quantity: l.quantity })) }
    const fingerprint = JSON.stringify(body)
    if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, key: crypto.randomUUID() }
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, requestKey: request.current.key }) })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'The sale could not be saved. Your basket is still here.')
      if (kiosk) setKioskOrder(result.order)
      else setReceipt(result.sale)
      setCart([]); setTendered(''); request.current = null
      if (!kiosk) await load(true)
    } catch (err) { setError(err instanceof Error ? err.message : 'Connection failed. Retry with the same basket.') }
    finally { setBusy(false) }
  }
  const update = async (sale: CounterSale, action: string) => {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/vendor/pos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, saleId: sale.id, ...(action === 'collect_cash' ? { tendered } : {}) }) })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Could not update this sale.')
      if (action === 'collect_cash') { setReceipt(body.sale); setPending(null); setTendered('') }
      await load(true)
    } catch (err) { setError(err instanceof Error ? err.message : 'Connection failed.') }
    finally { setBusy(false) }
  }

  if (kioskOrder) return <div className={styles.kioskConfirmation}><span className={styles.successIcon}><Check /></span><p className={styles.eyebrow}>Your order is waiting at the counter</p><h1>One more step.<br />You’re nearly there.</h1><p>Show this number to a member of staff and pay at the counter.</p><strong className={styles.orderNumber}>#{kioskOrder.id.slice(-6).toUpperCase()}</strong><p>{formatMinor(kioskOrder.totalMinor, kioskOrder.currency)} · Payment pending</p><small>Please pay within 15 minutes. Availability is checked at the counter.</small><button onClick={() => { setKioskOrder(null); void load() }}>Start a new order <ArrowRight size={17} /></button></div>

  return <div className={`${styles.terminal} ${kiosk ? styles.kiosk : ''}`}>
    <header className={styles.header}><div><p className={styles.eyebrow}>{kiosk ? 'Welcome to' : 'AfriBook for business'}</p><h1>{kiosk ? data?.business?.name || 'Something good starts here.' : 'A good day at the counter.'}</h1><p>{kiosk ? 'Take your time. Find your favourites. Pay at the counter.' : 'Your products, services and orders. All in one place.'}</p></div><div className={styles.tools}>{!kiosk && (data?.businesses?.length || 0) > 1 && <select aria-label="Business" value={businessId || data?.business?.id} disabled={busy || cart.length > 0} onChange={e => setBusinessId(e.target.value)}>{data?.businesses?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}<button aria-label="Refresh catalogue" disabled={busy} onClick={() => void load(true)}><RefreshCw size={18} /></button><span>{data?.business?.currency || 'Point of sale'}</span></div></header>
    {!kiosk && <nav className={styles.tabs} aria-label="Point of sale">{([{ key: 'counter', label: 'Counter', icon: Monitor }, { key: 'orders', label: 'Sales & kiosk orders', icon: Receipt }, { key: 'kitchen', label: 'Counter kitchen', icon: ChefHat }, { key: 'settings', label: 'Settings', icon: Settings2 }] as const).map(t => <button key={t.key} aria-pressed={tab === t.key} onClick={() => { setTab(t.key); setReceipt(null); setPending(null); setTendered('') }} disabled={busy}><t.icon size={16} />{t.label}</button>)}</nav>}
    {error && <div role="alert" className={styles.error}>{error}<button onClick={() => void load()} disabled={busy}>Retry</button></div>}
    {loading ? <div className={styles.loading} aria-label="Loading catalogue"><div /><div /><div /></div> : !data?.business ? <div className={styles.empty}><StoreIcon /><h2>{kiosk ? 'This kiosk is currently unavailable.' : 'Your counter starts with your business.'}</h2><p>{kiosk ? 'Please order with a member of staff.' : 'Add a business and its catalogue to start taking in-person sales.'}</p>{!kiosk && <Link href="/onboarding/vendor">Set up your business <ArrowRight size={16} /></Link>}</div> : <>
      {!kiosk && !data.settings?.enabled && tab !== 'settings' && <div className={styles.setup}><Settings2 size={18} /><p>Review your tax and cash settings before opening the counter.</p><button onClick={() => setTab('settings')}>Set up point of sale <ArrowRight size={15} /></button></div>}
      {tab === 'settings' && !kiosk ? <PosSetup key={data.business.id} businessId={data.business.id} settings={data.settings} onSaved={() => void load(true)} /> : tab === 'orders' ? <div className={styles.sales}>
        <h2>Sales & counter collection</h2><p className={styles.muted}>Kiosk orders remain unpaid until a member of staff collects cash.</p>
        {pending && <form className={styles.collect} onSubmit={e => { e.preventDefault(); void update(pending, 'collect_cash') }}><h3>Collect {formatMinor(pending.total_minor, pending.currency)} for #{pending.id.slice(-6).toUpperCase()}</h3><label>Cash received<input inputMode="decimal" required value={tendered} onChange={e => setTendered(e.target.value)} /></label><button disabled={busy} type="submit">Confirm cash collected</button><button type="button" onClick={() => setPending(null)}>Close</button></form>}
        {(data.sales || []).length === 0 ? <div className={styles.empty}><Receipt /><h3>Your first sale will appear here.</h3><p>Completed cash receipts and unpaid kiosk requests stay separate.</p></div> : <div className={styles.saleRows}>{data.sales?.map(sale => <article key={sale.id}><div><strong>#{sale.id.slice(-6).toUpperCase()}</strong><small>{sale.channel === 'kiosk' ? 'Self-service kiosk' : 'Counter'} · {new Date(sale.created_at).toLocaleString()}</small></div><span className={styles.status}>{sale.status.replace('_', ' ')}</span><strong>{formatMinor(sale.total_minor, sale.currency)}</strong>{sale.status === 'awaiting_payment' ? <><button disabled={busy} onClick={() => { setPending(sale); setTendered('') }}>Collect cash</button><button disabled={busy} onClick={() => void update(sale, 'cancel')}>Cancel order</button></> : sale.status === 'paid' && <button onClick={() => setReceipt(sale)}>Receipt</button>}</article>)}</div>}
      </div> : tab === 'kitchen' ? <div className={styles.kitchenBoard}>{(['pending', 'preparing', 'ready'] as const).map(stage => { const tickets = data.sales?.filter(s => s.status === 'paid' && s.prep_status === stage && s.lines.some(l => l.kind === 'menu')) || []; return <section key={stage}><h2>{stage === 'pending' ? 'To prepare' : stage === 'preparing' ? 'Preparing' : 'Ready to collect'}<span>{tickets.length}</span></h2>{tickets.length === 0 && <p className={styles.muted}>All clear here.</p>}{tickets.map(sale => <article key={sale.id}><h3>#{sale.id.slice(-6).toUpperCase()}</h3><small>{sale.fulfillment.replace('_', ' ')} · {new Date(sale.created_at).toLocaleTimeString()}</small><ul>{sale.lines.filter(l => l.kind === 'menu').map(line => <li key={line.id}><strong>{line.quantity}×</strong> {line.name}</li>)}</ul><button disabled={busy} onClick={() => void update(sale, stage === 'pending' ? 'preparing' : stage === 'preparing' ? 'ready' : 'completed')}>{stage === 'pending' ? 'Start preparation' : stage === 'preparing' ? 'Mark ready' : 'Collected'}</button></article>)}</section> })}</div> : <div className={styles.workspace}>
        <section className={styles.catalogue}><div className={styles.search}><Search size={18} /><input aria-label="Search catalogue" placeholder="Find a dish, product or service…" value={search} onChange={e => setSearch(e.target.value)} /></div><div className={styles.filters}>{['all', 'menu', 'product', ...(!kiosk ? ['service'] : [])].map(value => <button key={value} aria-pressed={kind === value} onClick={() => setKind(value)}>{value === 'all' ? 'Everything' : value === 'menu' ? 'Food & drinks' : value === 'product' ? 'Products' : 'Services'}</button>)}</div>
          {items.length === 0 ? <div className={styles.empty}><ShoppingBag /><h2>{search ? 'No matching items.' : 'A little quiet here, for now.'}</h2><p>{search ? 'Try another name or category.' : kiosk ? 'Please ask a member of staff for today’s menu.' : 'Add your real products, menu items or services to start selling.'}</p>{!kiosk && <Link href="/vendor/restaurant/menu">Manage your menu <ArrowRight size={15} /></Link>}</div> : <div className={styles.itemGrid}>{items.map(item => <button key={item.id} className={styles.item} onClick={() => add(item)} disabled={busy || item.stock === 0 || !data.settings?.enabled}><div className={styles.itemPhoto}>{item.image ? <img src={item.image} alt="" /> : <ShoppingBag size={30} />}{item.stock === 0 && <span>Sold out</span>}</div><div><small>{item.kind === 'menu' ? 'Food & drinks' : item.kind === 'service' ? 'Service receipt' : 'Product'}</small><h3>{item.name}</h3><footer><strong>{formatMinor(toMinor(item.price, currency), currency)}</strong><span aria-hidden="true"><Plus size={16} /></span></footer></div></button>)}</div>}
        </section>
        <aside className={styles.basket}><div className={styles.basketHeading}><h2>{kiosk ? 'Your order' : 'Current sale'}</h2><span>{cart.reduce((n, l) => n + l.quantity, 0)} items</span></div><label className={styles.fulfillment}>Order type<select disabled={busy} value={fulfillment} onChange={e => setFulfillment(e.target.value)}><option value="pickup">Takeaway / pickup</option><option value="dine_in">Dine in</option>{!kiosk && <option value="service">Service already provided</option>}</select></label>
          {cart.length === 0 ? <div className={styles.basketEmpty}><ShoppingBag /><p>A few good choices<br />start right here.</p></div> : <ul className={styles.cartLines}>{cart.map(line => <li key={line.item.id}><div><h3>{line.item.name}</h3><small>{formatMinor(toMinor(line.item.price, currency), currency)} each</small><div className={styles.quantity}><button aria-label={`Remove one ${line.item.name}`} disabled={busy} onClick={() => add(line.item, -1)}><Minus size={13} /></button><span>{line.quantity}</span><button aria-label={`Add one ${line.item.name}`} disabled={busy} onClick={() => add(line.item)}><Plus size={13} /></button></div></div><strong>{formatMinor(toMinor(line.item.price, currency) * line.quantity, currency)}</strong></li>)}</ul>}
          <div className={styles.totals}><p><span>Subtotal</span><span>{formatMinor(total?.subtotalMinor || 0, currency)}</span></p><p><span>Tax{data.settings?.taxInclusive ? ' (included)' : ''}</span><span>{formatMinor(total?.taxMinor || 0, currency)}</span></p><p><strong>Total</strong><strong>{formatMinor(total?.totalMinor || 0, currency)}</strong></p></div>
          {!kiosk && <label className={styles.cashLabel}>Cash received ({currency})<input inputMode="decimal" placeholder="0.00" disabled={busy} value={tendered} onChange={e => setTendered(e.target.value)} /></label>}
          <button className={styles.checkout} disabled={busy || !cart.length || !total || !data.settings?.enabled || (!kiosk && !tendered)} onClick={() => void submit()}>{busy ? 'Saving your order…' : kiosk ? 'Send order to the counter' : 'Confirm cash collected'}<ArrowRight size={16} /></button><p className={styles.checkoutNote}>{kiosk ? 'Pay at the counter within 15 minutes. Your order starts after payment.' : fulfillment === 'service' ? 'This records a completed service sale. It does not reserve an appointment.' : 'Confirm only after you have received cash. Stock is checked when the sale is saved.'}</p>
        </aside>
      </div>}
      {receipt && <section className={styles.receipt} aria-label="Cash receipt"><div className={styles.receiptHeading}><h2><Check size={18} /> Cash collected</h2><button onClick={() => setReceipt(null)} aria-label="Close receipt"><X size={18} /></button></div><p>{data.business.name} · #{receipt.id.slice(-6).toUpperCase()}</p><ul>{receipt.lines.map(line => <li key={line.id}><span>{line.quantity}× {line.name}</span><span>{formatMinor(line.unitMinor * line.quantity, receipt.currency)}</span></li>)}</ul><p>Tax <strong>{formatMinor(receipt.tax_minor, receipt.currency)}</strong></p><p>Total <strong>{formatMinor(receipt.total_minor, receipt.currency)}</strong></p><p>Cash received <strong>{formatMinor(receipt.tendered_minor || 0, receipt.currency)}</strong></p><p>Change <strong>{formatMinor(receipt.change_minor || 0, receipt.currency)}</strong></p><button className={styles.printButton} onClick={() => window.print()}><Printer size={16} /> Print receipt</button></section>}
    </>}
  </div>
}

function StoreIcon() { return <ShoppingBag size={34} /> }

function PosSetup({ businessId, settings, onSaved }: { businessId: string; settings: PosSettings | null; onSaved: () => void }) {
  const [rate, setRate] = useState(String((settings?.taxBasisPoints || 0) / 100))
  const [inclusive, setInclusive] = useState(settings?.taxInclusive || false)
  const [kioskEnabled, setKioskEnabled] = useState(settings?.kioskEnabled || false)
  const [reviewed, setReviewed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  return <form className={styles.settings} onSubmit={async e => {
    e.preventDefault(); setMessage(''); setBusy(true)
    try {
      const taxBasisPoints = toMinor(rate, 'USD')
      if (taxBasisPoints > 10000 || !reviewed) throw new Error('Review your tax settings before enabling sales.')
      const res = await fetch('/api/vendor/pos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'configure', businessId, settings: { enabled: true, kioskEnabled, taxBasisPoints, taxInclusive: inclusive } }) })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Settings could not be saved.')
      setMessage('Your counter settings are saved.'); onSaved()
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Settings could not be saved.') }
    finally { setBusy(false) }
  }}><h2>Make the counter yours.</h2><p>Cash receipts use your business currency. Enter the tax rate that applies to these sales. Use a separate transaction when items need different tax rates.</p><label>Sales tax rate (%)<input required inputMode="decimal" value={rate} onChange={e => setRate(e.target.value)} /></label><label className={styles.check}><input type="checkbox" checked={inclusive} onChange={e => setInclusive(e.target.checked)} />Prices already include this tax</label><label className={styles.check}><input type="checkbox" checked={kioskEnabled} onChange={e => setKioskEnabled(e.target.checked)} />Accept self-service kiosk orders (payment at counter)</label><label className={styles.check}><input required type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} />I reviewed the tax rate and will collect cash before confirming payment.</label><button disabled={busy || !reviewed}>{busy ? 'Saving…' : 'Save and enable point of sale'}</button><p role="status">{message}</p>{settings?.kioskEnabled && <div className={styles.kioskLink}><h3>Your ordering kiosk</h3><Link href={`/kiosk/${businessId}`} target="_blank" rel="noopener noreferrer">Open kiosk <ArrowRight size={15} /></Link><small>Use a separate browser profile or a dedicated device for your public kiosk. Never leave your business dashboard signed in on an unattended device.</small></div>}</form>
}
