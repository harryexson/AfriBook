'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import { useCountry } from '@/components/shared/CountryProvider'
import {
  Hotel, Plus, Loader2, X, BedDouble, DollarSign, Users2,
  CheckCircle2, XCircle, Clock, ImageIcon, ChevronLeft,
} from 'lucide-react'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

interface HotelListing {
  id: string
  name: string
  slug: string
  status: string
  city: string
  country: string
  cover_image_url: string | null
  gallery_images: string[]
  rooms_count: number
  price_from: number
  currency_code: string
  rating: number
  review_count: number
}

interface Room {
  id: string
  name: string
  room_type: string
  price_per_night: number
  currency_code: string
  quantity: number
  available: number
  max_occupancy: number
  photos: string[]
  is_active: boolean
}

interface Booking {
  id: string
  booking_code: string
  guest_name: string
  check_in_date: string
  check_out_date: string
  nights: number
  guests: number
  total: number
  currency_code: string
  status: string
  payment_status: string
  special_requests: string | null
}

interface BookingsSummary {
  totalBookings: number
  pendingRequests: number
  totalEarnings: number
  currencyCode: string
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  pending_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  archived: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

const BOOKING_STATUS_STYLE: Record<string, { label: string; color: string }> = {
  pending: { label: 'Requested', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  checked_in: { label: 'Checked in', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  no_show: { label: 'No-show', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export default function VendorHotelPage() {
  const { countryCode } = useCountry()
  const [properties, setProperties] = useState<HotelListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<HotelListing | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const loadProperties = useCallback(() => {
    setLoading(true)
    fetch('/api/stays/host')
      .then((res) => res.json())
      .then((body) => {
        if (!body.success) {
          setError(body.error ?? 'Failed to load properties')
          return
        }
        setProperties(body.data)
        setError('')
      })
      .catch(() => setError('Failed to load properties'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(loadProperties, [loadProperties])

  if (selected) {
    return (
      <PropertyDetail
        property={selected}
        onBack={() => { setSelected(null); loadProperties() }}
      />
    )
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM} className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2">
            <Hotel className="w-6 h-6 text-amber-500" />
            My Properties
          </h1>
          <p className="text-sm text-text-secondary mt-1">List rooms, track earnings, and manage guest requests.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/25 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add property
        </button>
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-text-secondary">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-600 py-4">{error}</p>}

      {!loading && !error && properties.length === 0 && (
        <motion.div variants={ITEM} className="text-center py-16 rounded-2xl border border-dashed border-border">
          <Hotel className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No properties yet</p>
          <p className="text-sm text-text-tertiary mt-1">Add your first hotel, guesthouse, or apartment to start hosting.</p>
        </motion.div>
      )}

      {!loading && !error && properties.length > 0 && (
        <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="text-left rounded-2xl bg-surface border border-border overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-32 bg-surface-secondary flex items-center justify-center">
                {p.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover_image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-text-tertiary" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize', STATUS_STYLE[p.status] ?? STATUS_STYLE.draft)}>
                    {p.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-text-tertiary flex items-center gap-1">
                    <BedDouble className="w-3.5 h-3.5" /> {p.rooms_count}
                  </span>
                </div>
                <p className="text-sm font-semibold text-text-primary truncate">{p.name}</p>
                <p className="text-xs text-text-secondary truncate">{p.city}, {p.country}</p>
                {p.price_from > 0 && (
                  <p className="text-xs text-text-tertiary mt-1">From {formatCurrency(p.price_from, p.currency_code)}/night</p>
                )}
              </div>
            </button>
          ))}
        </motion.div>
      )}

      {showAdd && (
        <AddPropertyModal
          defaultCountry={countryCode}
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); loadProperties() }}
        />
      )}
    </motion.div>
  )
}

function AddPropertyModal({ defaultCountry, onClose, onCreated }: { defaultCountry: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [propertyType, setPropertyType] = useState('hotel')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/stays/host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, city, address, countryCode: defaultCountry, propertyType }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        setError(body.error ?? 'Failed to create property')
        return
      }
      onCreated()
    } catch {
      setError('Failed to create property')
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-surface border border-border p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-text-primary">Add a property</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-secondary">
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-secondary">Property name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunrise Guesthouse"
              className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary">City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Lagos"
              className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address"
              className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary">Property type</label>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}
              className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30">
              {['hotel', 'guesthouse', 'apartment', 'villa', 'hostel'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

        <button
          onClick={submit}
          disabled={busy || !name || !city}
          className="w-full mt-4 py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 disabled:opacity-50 transition-all"
        >
          {busy ? 'Creating…' : 'Create property'}
        </button>
        <p className="text-[11px] text-text-tertiary mt-2">New properties start as drafts and go live after a quick review.</p>
      </motion.div>
    </motion.div>
  )
}

function PropertyDetail({ property, onBack }: { property: HotelListing; onBack: () => void }) {
  const [tab, setTab] = useState<'rooms' | 'bookings'>('rooms')
  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [summary, setSummary] = useState<BookingsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/stays/host/${property.id}/rooms`).then((r) => r.json()),
      fetch(`/api/stays/host/${property.id}/bookings`).then((r) => r.json()),
    ])
      .then(([roomsBody, bookingsBody]) => {
        if (roomsBody.success) setRooms(roomsBody.data)
        if (bookingsBody.success) {
          setBookings(bookingsBody.data.bookings)
          setSummary(bookingsBody.data.summary)
        }
      })
      .finally(() => setLoading(false))
  }, [property.id])

  useEffect(load, [load])

  const actOnBooking = async (bookingId: string, status: string) => {
    setBusyBookingId(bookingId)
    try {
      const res = await fetch(`/api/stays/host/${property.id}/bookings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      })
      if (res.ok) load()
    } finally {
      setBusyBookingId(null)
    }
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-3">
          <ChevronLeft className="w-4 h-4" /> All properties
        </button>
        <h1 className="text-2xl font-bold text-text-primary font-heading">{property.name}</h1>
        <p className="text-sm text-text-secondary mt-1">{property.city}, {property.country}</p>
      </motion.div>

      {summary && (
        <motion.div variants={ITEM} className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-surface border border-border p-4">
            <DollarSign className="w-5 h-5 text-emerald-600 mb-2" />
            <p className="text-lg font-bold text-text-primary">{formatCurrency(summary.totalEarnings, summary.currencyCode)}</p>
            <p className="text-xs text-text-secondary">Total earnings</p>
          </div>
          <div className="rounded-2xl bg-surface border border-border p-4">
            <Clock className="w-5 h-5 text-amber-600 mb-2" />
            <p className="text-lg font-bold text-text-primary">{summary.pendingRequests}</p>
            <p className="text-xs text-text-secondary">Pending requests</p>
          </div>
          <div className="rounded-2xl bg-surface border border-border p-4">
            <Users2 className="w-5 h-5 text-blue-600 mb-2" />
            <p className="text-lg font-bold text-text-primary">{summary.totalBookings}</p>
            <p className="text-xs text-text-secondary">Total bookings</p>
          </div>
        </motion.div>
      )}

      <motion.div variants={ITEM} className="flex bg-surface-secondary rounded-xl p-0.5 w-fit">
        {(['rooms', 'bookings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn('px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-amber-500 text-white shadow-sm' : 'text-text-secondary hover:text-text-primary')}
          >
            {t === 'rooms' ? 'Rooms' : 'Guest requests'}
          </button>
        ))}
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-text-secondary">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      )}

      {!loading && tab === 'rooms' && (
        <motion.div variants={ITEM} className="space-y-3">
          <button
            onClick={() => setShowAddRoom(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border text-sm text-text-secondary hover:text-text-primary hover:border-amber-300 transition-all"
          >
            <Plus className="w-4 h-4" /> Add room type
          </button>
          {rooms.length === 0 ? (
            <p className="text-sm text-text-tertiary py-6 text-center">No rooms yet — add one to start accepting bookings.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rooms.map((room) => (
                <div key={room.id} className="rounded-2xl bg-surface border border-border p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-text-primary">{room.name}</span>
                    <span className="text-xs text-text-tertiary capitalize">{room.room_type}</span>
                  </div>
                  <p className="text-sm font-bold text-text-primary">{formatCurrency(room.price_per_night, room.currency_code)}<span className="text-xs font-normal text-text-tertiary">/night</span></p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                    <span>{room.available}/{room.quantity} available</span>
                    <span>Up to {room.max_occupancy} guests</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {!loading && tab === 'bookings' && (
        <motion.div variants={ITEM} className="space-y-2">
          {bookings.length === 0 ? (
            <p className="text-sm text-text-tertiary py-6 text-center">No bookings yet.</p>
          ) : (
            bookings.map((b) => {
              const style = BOOKING_STATUS_STYLE[b.status] ?? BOOKING_STATUS_STYLE.pending
              return (
                <div key={b.id} className="rounded-2xl bg-surface border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold', style.color)}>{style.label}</span>
                      <span className="text-xs text-text-tertiary">#{b.booking_code}</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary">{formatCurrency(b.total, b.currency_code)}</span>
                  </div>
                  <p className="text-sm text-text-primary font-medium">{b.guest_name}</p>
                  <p className="text-xs text-text-secondary">{b.check_in_date} → {b.check_out_date} · {b.nights} night{b.nights === 1 ? '' : 's'} · {b.guests} guest{b.guests === 1 ? '' : 's'}</p>
                  {b.special_requests && <p className="text-xs text-text-tertiary mt-1 italic">"{b.special_requests}"</p>}

                  {b.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => actOnBooking(b.id, 'confirmed')}
                        disabled={busyBookingId === b.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={() => actOnBooking(b.id, 'cancelled')}
                        disabled={busyBookingId === b.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-secondary text-text-secondary text-xs font-semibold hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  )}
                  {b.status === 'confirmed' && (
                    <button
                      onClick={() => actOnBooking(b.id, 'checked_in')}
                      disabled={busyBookingId === b.id}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 disabled:opacity-50"
                    >
                      Check in guest
                    </button>
                  )}
                  {b.status === 'checked_in' && (
                    <button
                      onClick={() => actOnBooking(b.id, 'completed')}
                      disabled={busyBookingId === b.id}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 disabled:opacity-50"
                    >
                      Check out guest
                    </button>
                  )}
                </div>
              )
            })
          )}
        </motion.div>
      )}

      {showAddRoom && (
        <AddRoomModal
          hotelId={property.id}
          onClose={() => setShowAddRoom(false)}
          onCreated={() => { setShowAddRoom(false); load() }}
        />
      )}
    </motion.div>
  )
}

function AddRoomModal({ hotelId, onClose, onCreated }: { hotelId: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [roomType, setRoomType] = useState('standard')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [maxOccupancy, setMaxOccupancy] = useState('2')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/stays/host/${hotelId}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, roomType, pricePerNight: Number(price),
          quantity: Number(quantity), maxOccupancy: Number(maxOccupancy),
        }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        setError(body.error ?? 'Failed to create room')
        return
      }
      onCreated()
    } catch {
      setError('Failed to create room')
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-surface border border-border p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-text-primary">Add a room type</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-secondary">
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-text-secondary">Room name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Deluxe Double"
              className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary">Room type</label>
            <select value={roomType} onChange={(e) => setRoomType(e.target.value)}
              className="w-full mt-1.5 px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30">
              {['standard', 'deluxe', 'superior', 'suite', 'executive', 'family', 'studio', 'apartment', 'villa'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-semibold text-text-secondary">Price/night</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="80"
                className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary">Quantity</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-secondary">Max guests</label>
              <input type="number" value={maxOccupancy} onChange={(e) => setMaxOccupancy(e.target.value)}
                className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

        <button
          onClick={submit}
          disabled={busy || !name || !price}
          className="w-full mt-4 py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 disabled:opacity-50 transition-all"
        >
          {busy ? 'Adding…' : 'Add room'}
        </button>
      </motion.div>
    </motion.div>
  )
}
