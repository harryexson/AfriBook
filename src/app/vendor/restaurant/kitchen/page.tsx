'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChefHat, RefreshCw, Clock3, ArrowRight, Maximize, Minimize, AlertCircle } from 'lucide-react'
import type { KitchenDisplayItem } from '@/lib/retrobuddy/types'

interface Restaurant { id: string; name: string }
const stages = [{ key: 'pending', label: 'To prepare' }, { key: 'in_progress', label: 'In the kitchen' }, { key: 'ready', label: 'Ready for collection' }] as const

export default function KitchenPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [restaurantId, setRestaurantId] = useState('')
  const [queue, setQueue] = useState<KitchenDisplayItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [updated, setUpdated] = useState<Date | null>(null)
  const [expanded, setExpanded] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const requestVersion = useRef(0)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/vendor/restaurants', { signal: controller.signal }).then(async res => {
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Could not load restaurants.')
      setRestaurants(body.restaurants)
      setRestaurantId(body.restaurants[0]?.id ?? '')
      setLoading(false)
    }).catch(err => { if (!controller.signal.aborted) { setError(err.message); setLoading(false) } })
    return () => controller.abort()
  }, [])

  const load = useCallback(async () => {
    if (!restaurantId) return
    const version = ++requestVersion.current
    try {
      const res = await fetch(`/api/retrobuddy/kitchen?restaurantId=${encodeURIComponent(restaurantId)}`, { cache: 'no-store' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Could not refresh kitchen orders.')
      if (requestVersion.current !== version) return
      setQueue(body.queue); setUpdated(new Date()); setError('')
    } catch (err) { if (requestVersion.current === version) setError(err instanceof Error ? err.message : 'Connection failed.') }
    finally { if (requestVersion.current === version) setLoading(false) }
  }, [restaurantId])

  useEffect(() => {
    setQueue([]); setUpdated(null); setLoading(Boolean(restaurantId))
    void load()
    const timer = setInterval(() => { if (!document.hidden) void load() }, 15000)
    return () => { clearInterval(timer); requestVersion.current++ }
  }, [load, restaurantId])

  useEffect(() => {
    const changed = () => setExpanded(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', changed)
    return () => document.removeEventListener('fullscreenchange', changed)
  }, [])

  const advance = async (item: KitchenDisplayItem) => {
    const targetRestaurant = restaurantId
    setBusy(item.id); setError('')
    try {
      const res = await fetch('/api/retrobuddy/kitchen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_status', itemId: item.id, status: item.status === 'pending' ? 'in_progress' : 'ready' }) })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Could not update the order.')
      if (restaurantId === targetRestaurant) await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not update the order.') }
    finally { setBusy(null) }
  }

  return <div ref={container} className="min-h-[80dvh] space-y-7 bg-surface-secondary p-2 sm:p-4">
    <header className="flex flex-wrap items-center justify-between gap-5">
      <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-amber-700">AfriBook for restaurants</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">The kitchen, at a glance.</h1><p className="mt-2 text-sm text-text-secondary">A clear path from a new order to a great meal.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        {restaurants.length > 0 && <select aria-label="Restaurant" value={restaurantId} onChange={e => { if (!busy) setRestaurantId(e.target.value) }} disabled={Boolean(busy)} className="max-w-56 rounded-xl border border-border bg-surface px-3 py-3 text-sm">{restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select>}
        <button onClick={() => void load()} disabled={!restaurantId || loading} aria-label="Refresh kitchen orders" className="rounded-xl border border-border bg-surface p-3 disabled:opacity-40"><RefreshCw size={18} /></button>
        <button onClick={async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await container.current?.requestFullscreen() } catch { setError('Full screen is unavailable in this browser.') } }} aria-label={expanded ? 'Exit full screen' : 'Open full screen'} className="rounded-xl border border-border bg-surface p-3">{expanded ? <Minimize size={18} /> : <Maximize size={18} />}</button>
      </div>
    </header>
    <nav className="flex flex-wrap gap-5 border-b border-border pb-4 text-sm"><Link href="/vendor/restaurant/orders">Orders</Link><Link href="/vendor/restaurant/menu">Menu</Link><span className="font-semibold text-amber-700" aria-current="page">Kitchen display</span><Link href="/vendor/pos">Point of sale</Link></nav>
    {error && <div role="alert" className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={18} /><span>{error} {updated && 'Showing the last successful refresh.'}</span></div>}
    <p role="status" className="text-xs text-text-secondary">{loading ? 'Loading your kitchen…' : updated ? `Last refreshed ${updated.toLocaleTimeString()} · Refreshes every 15 seconds` : 'Waiting for a restaurant connection'}</p>
    {!loading && restaurants.length === 0 && !error ? <div className="rounded-2xl border border-border bg-surface px-6 py-20 text-center"><ChefHat className="mx-auto mb-4 text-amber-600" size={36} /><h2 className="text-xl font-semibold">Let’s get your kitchen connected.</h2><p className="mt-2 text-sm text-text-secondary">Add your restaurant to start managing orders here.</p><Link href="/onboarding/restaurant" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white">Set up your restaurant <ArrowRight size={16} /></Link></div> : <div className="grid gap-5 lg:grid-cols-3">{stages.map(stage => {
      const items = queue.filter(item => item.status === stage.key)
      return <section key={stage.key} aria-labelledby={`stage-${stage.key}`} className="min-h-80 rounded-2xl border border-border bg-surface/50 p-4"><h2 id={`stage-${stage.key}`} className="mb-5 flex items-center justify-between text-sm font-semibold">{stage.label}<span className="rounded-lg bg-surface-tertiary px-2.5 py-1 text-xs">{items.length}</span></h2>
        {loading ? <div className="h-44 rounded-xl bg-surface-tertiary" aria-label="Loading orders" /> : items.length === 0 ? <p className="py-12 text-center text-sm text-text-secondary">{error ? 'Queue unavailable' : 'All clear here.'}</p> : items.map(item => <article key={item.id} className="mb-4 rounded-xl border border-border bg-surface p-5 shadow-xs"><div className="flex items-start justify-between gap-2"><h3 className="font-semibold">Order #{item.orderId.slice(-6).toUpperCase()}</h3><span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${item.prepTimeStatus === 'on_time' ? 'bg-olive-50 text-olive-700' : 'bg-amber-100 text-amber-800'}`}>{item.prepTimeStatus === 'on_time' ? 'On time' : 'Needs attention'}</span></div><p className="my-4 flex items-center gap-1.5 text-xs text-text-secondary"><Clock3 size={13} />Due {new Date(item.estimatedReadyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><ul className="space-y-3 border-y border-border-light py-4">{item.items.map((line, index) => <li key={line.id || index} className="text-sm"><span className="mr-3 font-semibold text-amber-700">{line.quantity}×</span>{line.name}{line.notes && <p className="ml-7 mt-1 text-xs text-text-secondary">{line.notes}</p>}</li>)}</ul>{item.specialInstructions && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">{item.specialInstructions}</p>}{stage.key !== 'ready' && <button disabled={Boolean(busy)} onClick={() => void advance(item)} className="mt-5 w-full rounded-lg bg-dark-300 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy === item.id ? 'Saving…' : stage.key === 'pending' ? 'Start preparation' : 'Mark ready for pickup'}</button>}</article>)}
      </section>
    })}</div>}
  </div>
}
