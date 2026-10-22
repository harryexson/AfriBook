'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChefHat, Clock, Flame, Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/neon/client'
import type { KitchenDisplayItem, KitchenDisplayPriority } from '@/lib/retrobuddy/types'

type Column = 'pending' | 'in_progress' | 'ready'

const COLUMNS: { key: Column; label: string; next?: { to: Column; label: string } }[] = [
  { key: 'pending', label: 'New', next: { to: 'in_progress', label: 'Start cooking' } },
  { key: 'in_progress', label: 'Cooking', next: { to: 'ready', label: 'Mark ready' } },
  { key: 'ready', label: 'Ready for pickup' },
]

const POLL_MS = 15_000

const PRIORITY_STYLE: Record<KitchenDisplayPriority, string> = {
  normal: 'bg-white/10 text-white/70',
  urgent: 'bg-amber-400/20 text-amber-200',
  rush: 'bg-red-500/25 text-red-200',
}

function minutesSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
}

/**
 * Kitchen display for the restaurant's own queue. Reads the real kitchen
 * queue from /api/retrobuddy/kitchen and refreshes every 15 seconds (paused
 * while the tab is hidden). Status changes are only shown once the server
 * confirms them — nothing moves on the board optimistically.
 */
export default function KitchenDisplayPage() {
  const [supabase] = useState(() => createClient())
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [items, setItems] = useState<KitchenDisplayItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [, tick] = useState(0)
  const restaurantRef = useRef<string | null>(null)

  const fetchQueue = useCallback(async (id: string) => {
    const res = await fetch(`/api/retrobuddy/kitchen?restaurantId=${id}`)
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error ?? 'Could not load the kitchen queue')
    setItems(body.queue ?? [])
    setLastUpdated(new Date())
    setLoadError(null)
  }, [])

  // Resolve the signed-in user's restaurant once, the same way the orders page does.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Sign in to see your kitchen queue')
        const { data: business } = await (supabase.from('businesses') as any)
          .select('id').eq('owner_id', user.id).limit(1).maybeSingle()
        if (!business) throw new Error('No business found for this account')
        const { data: restaurant } = await (supabase.from('restaurants') as any)
          .select('id').eq('business_id', business.id).maybeSingle()
        if (!restaurant) throw new Error('No restaurant found for this business')
        if (cancelled) return
        restaurantRef.current = restaurant.id
        setRestaurantId(restaurant.id)
        await fetchQueue(restaurant.id)
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load the kitchen')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [supabase, fetchQueue])

  // Poll the queue, and re-render the age labels every 30s.
  useEffect(() => {
    if (!restaurantId) return
    const refresh = () => {
      if (document.visibilityState === 'visible' && restaurantRef.current) {
        fetchQueue(restaurantRef.current).catch((err) =>
          setLoadError(err instanceof Error ? err.message : 'Lost connection to the kitchen queue'),
        )
      }
    }
    const poll = setInterval(refresh, POLL_MS)
    const age = setInterval(() => tick((n) => n + 1), 30_000)
    return () => {
      clearInterval(poll)
      clearInterval(age)
    }
  }, [restaurantId, fetchQueue])

  const advance = async (item: KitchenDisplayItem, to: Column) => {
    setBusyId(item.id)
    setActionError(null)
    try {
      const res = await fetch('/api/retrobuddy/kitchen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', itemId: item.id, status: to }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'That status change was not saved')
      if (restaurantRef.current) await fetchQueue(restaurantRef.current)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'That status change was not saved')
    } finally {
      setBusyId(null)
    }
  }

  const byColumn = (col: Column) => items.filter((i) => i.status === col)
  const delayed = items.filter((i) => i.prepTimeStatus !== 'on_time').length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary">Kitchen display</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-text-primary">Live orders</h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          {delayed > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 font-semibold text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              {delayed} running late
            </span>
          )}
          {lastUpdated && (
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Updated {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {actionError && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{actionError}</p>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-surface-secondary" />
          ))}
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-border bg-surface-secondary p-8 text-center">
          <p className="font-semibold text-text-primary">The kitchen queue isn&apos;t available</p>
          <p className="mt-1 text-sm text-text-secondary">{loadError}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <ChefHat className="mx-auto h-10 w-10 text-text-tertiary" />
          <p className="mt-3 font-semibold text-text-primary">No orders in the kitchen</p>
          <p className="mt-1 text-sm text-text-secondary">New orders appear here as soon as they&apos;re accepted.</p>
        </div>
      ) : (
        /* Dark board, after the reference: the kitchen runs dark and the
           cards carry the colour. Espresso surfaces, terracotta and olive. */
        <div className="grid gap-4 rounded-[1.75rem] bg-dark-600 p-4 md:grid-cols-3 md:p-5">
          {COLUMNS.map((col) => {
            const list = byColumn(col.key)
            return (
              <section key={col.key} aria-label={col.label} className="flex min-h-[320px] flex-col gap-3">
                <header className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold text-white">{col.label}</h2>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/80">
                    {list.length}
                  </span>
                </header>

                {list.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/40">
                    Nothing here
                  </p>
                )}

                {list.map((item) => {
                  const mins = minutesSince(item.createdAt)
                  const late = item.prepTimeStatus !== 'on_time'
                  return (
                    <article
                      key={item.id}
                      className={cn(
                        'rounded-2xl border p-4 transition-colors',
                        item.prepTimeStatus === 'critical'
                          ? 'border-red-400/50 bg-red-950/40'
                          : late
                            ? 'border-amber-300/40 bg-dark-400'
                            : 'border-white/10 bg-dark-400',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-sm font-semibold text-white">#{item.orderNumber}</p>
                        <div className="flex items-center gap-2">
                          {item.priority !== 'normal' && (
                            <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase', PRIORITY_STYLE[item.priority])}>
                              {item.priority}
                            </span>
                          )}
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-xs font-medium',
                              late ? 'text-amber-200' : 'text-white/60',
                            )}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            {mins} min
                          </span>
                        </div>
                      </div>

                      <ul className="mt-3 space-y-2">
                        {item.items.map((line) => (
                          <li key={line.id} className="text-sm text-white">
                            <span className="font-mono font-semibold text-amber-200">{line.quantity}×</span>{' '}
                            {line.name}
                            {line.notes && (
                              <span className="mt-0.5 block text-xs text-white/55">{line.notes}</span>
                            )}
                          </li>
                        ))}
                      </ul>

                      {item.specialInstructions && (
                        <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-white/5 p-2.5 text-xs text-white/75">
                          <Flame className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                          {item.specialInstructions}
                        </p>
                      )}

                      {col.next && (
                        <button
                          type="button"
                          onClick={() => advance(item, col.next!.to)}
                          disabled={busyId === item.id}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-400 disabled:opacity-60"
                        >
                          {busyId === item.id && <Loader2 className="h-4 w-4 animate-spin" />}
                          {col.next.label}
                        </button>
                      )}
                    </article>
                  )
                })}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
