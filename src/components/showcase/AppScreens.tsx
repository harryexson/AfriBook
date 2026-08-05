'use client'

import type { LucideIcon } from 'lucide-react'
import {
  Home,
  Search,
  ShoppingBag,
  Package,
  User,
  MapPin,
  Flame,
  Star,
  Utensils,
  Car,
  Ticket,
  Calendar,
  Heart,
  Bell,
  Box,
  ChevronRight,
  ShieldCheck,
  Wallet,
  TrendingUp,
  Clock,
  Users,
  Plus,
  Zap,
} from 'lucide-react'
import { PhoneScreen } from './PhoneMockup'

const MARKET_TABS = [
  { label: 'Home', icon: Home, active: true },
  { label: 'Search', icon: Search },
  { label: 'Cart', icon: ShoppingBag },
  { label: 'Orders', icon: Package },
  { label: 'Profile', icon: User },
]

const RIDES_TABS = [
  { label: 'Home', icon: Home, active: true },
  { label: 'Activity', icon: Clock },
  { label: 'Wallet', icon: Wallet },
  { label: 'Profile', icon: User },
]

const FOOD_TABS = [
  { label: 'Home', icon: Home, active: true },
  { label: 'Search', icon: Search },
  { label: 'Orders', icon: Package },
  { label: 'Profile', icon: User },
]

const DELIVERY_TABS = [
  { label: 'Track', icon: Package, active: true },
  { label: 'Send', icon: Box },
  { label: 'History', icon: Clock },
  { label: 'Profile', icon: User },
]

const EVENTS_TABS = [
  { label: 'Discover', icon: Search, active: true },
  { label: 'Tickets', icon: Ticket },
  { label: 'Favorites', icon: Heart },
  { label: 'Profile', icon: User },
]

const SELL_TABS = [
  { label: 'Home', icon: Home, active: true },
  { label: 'Orders', icon: Package },
  { label: 'Menu', icon: Utensils },
  { label: 'Payouts', icon: Wallet },
  { label: 'Profile', icon: User },
]

type IconLabel = [LucideIcon, string]

function ProductCard({
  icon,
  name,
  meta,
  price,
}: {
  icon: LucideIcon
  name: string
  meta: string
  price: string
}) {
  const Icon = icon
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-gold">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-white">{name}</p>
        <p className="truncate text-[9px] text-white/45">{meta}</p>
      </div>
      <p className="text-[11px] font-bold text-amber-400">{price}</p>
    </div>
  )
}

export function MarketAppScreen() {
  const categories: IconLabel[] = [
    [Utensils, 'Food'],
    [Car, 'Rides'],
    [ShoppingBag, 'Shop'],
    [Ticket, 'Events'],
    [Package, 'Send'],
  ]
  const items: Array<{ icon: LucideIcon; name: string; meta: string; price: string }> = [
    { icon: ShoppingBag, name: 'Adunni Aso-Oke', meta: 'Handwoven · 4.9★', price: '$24' },
    { icon: Utensils, name: 'Jollof Special', meta: "Mama Nkechi's · 30 min", price: '$8' },
    { icon: Ticket, name: 'Afrobeats Night', meta: 'Eko Centre · Sat', price: '$38' },
  ]

  return (
    <PhoneScreen
      tabs={MARKET_TABS}
      header={
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] text-white/50">Deliver to</p>
            <p className="flex items-center gap-1 text-[11px] font-semibold text-white">
              <MapPin className="h-3 w-3 text-amber-400" /> Lagos, NG
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-gold text-[10px] font-bold text-white">
            A
          </div>
        </div>
      }
    >
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <Search className="h-3.5 w-3.5 text-white/40" />
        <span className="text-[11px] text-white/40">Search products, food, services…</span>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {categories.map(([Icon, label]) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-[8px] font-medium text-white/60">{label}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 mb-2 flex items-center gap-1 text-[11px] font-semibold text-white">
        <Flame className="h-3 w-3 text-amber-400" /> Trending near you
      </p>
      <div className="space-y-2">
        {items.map((item) => (
          <ProductCard key={item.name} {...item} />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-gold px-4 py-3">
        <div>
          <p className="text-[9px] font-medium text-amber-100">One account for all of it</p>
          <p className="text-[12px] font-bold text-white">AfriBook Super App</p>
        </div>
        <ChevronRight className="h-4 w-4 text-white" />
      </div>
    </PhoneScreen>
  )
}

export function RidesAppScreen() {
  return (
    <PhoneScreen
      tabs={RIDES_TABS}
      contentClassName="relative"
      header={
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] text-white/50">Good evening</p>
            <p className="text-[12px] font-semibold text-white">Where to, Ada?</p>
          </div>
          <div className="flex gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <Bell className="h-3.5 w-3.5 text-white/70" />
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-gold text-[10px] font-bold text-white">
              A
            </div>
          </div>
        </div>
      }
    >
      {/* Map background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:16px_16px]" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 240 420" fill="none">
          <path
            d="M30 360 C 70 330, 60 240, 120 200 S 180 90, 210 60"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeDasharray="1 6"
            strokeLinecap="round"
          />
          <circle cx="30" cy="360" r="7" fill="#F59E0B" />
          <circle cx="210" cy="60" r="7" fill="#3B82F6" />
        </svg>
      </div>

      {/* Request card */}
      <div className="relative mx-3 mt-8 space-y-2 rounded-2xl border border-white/10 bg-dark-300/90 p-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <span className="text-[11px] text-white/80">Muri Okunola, VI</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
            <MapPin className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <span className="text-[11px] text-white/80">Ikoyi, Lagos</span>
        </div>
        <div className="space-y-1.5 pt-1">
          {[
            ['Economy', '3 min', '$3.20'],
            ['Comfort', '5 min', '$5.60'],
          ].map(([label, eta, price], i) => (
            <div
              key={label}
              className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                i === 0
                  ? 'border border-amber-500/60 bg-amber-500/15'
                  : 'border border-white/10 bg-white/5'
              }`}
            >
              <span className="text-[10px] font-medium text-white">{label}</span>
              <span className="text-[9px] text-white/45">{eta}</span>
              <span className="text-[11px] font-bold text-amber-400">{price}</span>
            </div>
          ))}
        </div>
        <button className="w-full rounded-xl bg-amber-500 py-2 text-[12px] font-bold text-amber-950">
          Request AfriBook
        </button>
      </div>

      {/* Driver card */}
      <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-dark-300/90 p-3 backdrop-blur-md">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-gold text-[11px] font-bold text-white">
          TK
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold text-white">Tunde K.</p>
          <p className="text-[9px] text-white/50">Toyota Corolla · GH 4821</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-amber-400">
          <Star className="h-3 w-3 fill-current" /> 4.92
        </div>
      </div>
    </PhoneScreen>
  )
}

export function FoodAppScreen() {
  const cuisines = ['All', 'Nigerian', 'Ethiopian', 'Seafood', 'Vegan', 'Fusion']
  const spots: Array<{ initial: string; name: string; meta: string; badge: string; tint: string }> = [
    { initial: 'MN', name: "Mama Nkechi's Kitchen", meta: 'Nigerian · 30 min · $1.50', badge: '4.9★', tint: 'from-amber-500 to-orange-500' },
    { initial: 'CN', name: 'Carnivore Nairobi', meta: 'BBQ · 35 min · $2.00', badge: '4.8★', tint: 'from-emerald-500 to-teal-500' },
    { initial: 'ZS', name: 'Zanzibar Spice House', meta: 'Seafood · 35 min · $1.70', badge: '4.8★', tint: 'from-cyan-500 to-blue-500' },
  ]

  return (
    <PhoneScreen
      tabs={FOOD_TABS}
      header={
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] text-white/50">Order to</p>
            <p className="flex items-center gap-1 text-[11px] font-semibold text-white">
              <MapPin className="h-3 w-3 text-amber-400" /> Lekki Phase 1
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-gold text-[10px] font-bold text-white">
            A
          </div>
        </div>
      }
    >
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        <Search className="h-3.5 w-3.5 text-white/40" />
        <span className="text-[11px] text-white/40">Search restaurants or dishes…</span>
      </div>

      <div className="-mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5 pb-1">
        {cuisines.map((c, i) => (
          <span
            key={c}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-semibold ${
              i === 0 ? 'bg-amber-500 text-amber-950' : 'bg-white/8 text-white/70'
            }`}
          >
            {c}
          </span>
        ))}
      </div>

      <p className="mt-3 mb-2 text-[11px] font-semibold text-white">Popular near you</p>
      <div className="space-y-2.5">
        {spots.map((spot) => (
          <div key={spot.name} className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-2.5">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${spot.tint} text-[12px] font-bold text-white`}
            >
              {spot.initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[11px] font-semibold text-white">{spot.name}</p>
                <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400">
                  <Star className="h-2.5 w-2.5 fill-current" /> {spot.badge}
                </span>
              </div>
              <p className="truncate text-[9px] text-white/45">{spot.meta}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-amber-500 px-4 py-3">
        <div>
          <p className="text-[9px] font-medium text-amber-200">3 items in cart</p>
          <p className="text-[12px] font-bold text-amber-950">$24.50 · View cart</p>
        </div>
        <ChevronRight className="h-4 w-4 text-amber-950" />
      </div>
    </PhoneScreen>
  )
}

export function DeliveryAppScreen() {
  const steps = [
    ['Picked up', 'done'],
    ['In transit', 'active'],
    ['Out for delivery', 'todo'],
    ['Delivered', 'todo'],
  ] as const

  return (
    <PhoneScreen
      tabs={DELIVERY_TABS}
      contentClassName="relative"
      header={
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] text-white/50">Tracking</p>
            <p className="text-[12px] font-semibold text-white">AB-84 201</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-gold text-[10px] font-bold text-white">
            A
          </div>
        </div>
      }
    >
      {/* Map background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:16px_16px]" />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 240 420" fill="none">
          <path
            d="M40 90 C 90 120, 200 160, 180 250 S 70 300, 50 380"
            stroke="#38BDF8"
            strokeWidth="2"
            strokeDasharray="2 6"
            strokeLinecap="round"
          />
          <circle cx="40" cy="90" r="7" fill="#F59E0B" />
          <circle cx="50" cy="380" r="7" fill="#10B981" />
        </svg>
      </div>

      {/* Courier card */}
      <div className="relative mx-3 mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-dark-300/90 p-3 backdrop-blur-md">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold text-[12px] font-bold text-white">
          DK
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Zap className="h-1.5 w-1.5" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-white">David K. · Bike</p>
          <p className="text-[9px] text-white/50">Arriving in 12 min</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-amber-400">
          <ShieldCheck className="h-3.5 w-3.5" /> Insured
        </div>
      </div>

      {/* Timeline */}
      <div className="relative mx-3 mt-3 rounded-2xl border border-white/10 bg-dark-300/90 p-4 backdrop-blur-md">
        <div className="space-y-3">
          {steps.map(([label, state]) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  state === 'done'
                    ? 'bg-emerald-400'
                    : state === 'active'
                      ? 'bg-amber-400 shadow-[0_0_0_4px_rgba(245,158,11,0.2)]'
                      : 'bg-white/20'
                }`}
              />
              <span
                className={`text-[10px] ${
                  state === 'todo' ? 'text-white/35' : 'text-white/85'
                }`}
              >
                {label}
              </span>
              {state === 'active' && (
                <span className="ml-auto text-[9px] font-semibold text-amber-400">Live</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-3 mt-3 flex items-center justify-between rounded-2xl bg-gradient-gold px-4 py-3">
        <div>
          <p className="text-[9px] font-medium text-amber-100">ETA</p>
          <p className="text-[13px] font-bold text-white">12 min</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-medium text-amber-100">From → To</p>
          <p className="text-[10px] font-semibold text-white">Surulere → Yaba</p>
        </div>
      </div>
    </PhoneScreen>
  )
}

export function EventsAppScreen() {
  const events = [
    { initial: 'AF', name: 'Afrobeats Night', meta: 'Eko Centre · Aug 15', price: '$38', tint: 'from-amber-500 to-orange-600' },
    { initial: 'TS', name: 'Africa Tech Summit', meta: 'KICC Nairobi · Sep 5', price: '$115', tint: 'from-violet-500 to-indigo-600' },
  ]
  const qrCells = [
    [1, 1, 1, 0, 1, 1, 1],
    [1, 0, 1, 1, 0, 0, 1],
    [1, 1, 0, 0, 1, 0, 1],
    [0, 1, 0, 1, 1, 1, 0],
    [1, 0, 1, 1, 0, 1, 1],
    [1, 1, 0, 0, 1, 0, 0],
    [1, 1, 1, 0, 1, 1, 1],
  ]

  return (
    <PhoneScreen
      tabs={EVENTS_TABS}
      header={
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] text-white/50">Discover</p>
            <p className="text-[12px] font-semibold text-white">Live near you</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-gold text-[10px] font-bold text-white">
            A
          </div>
        </div>
      }
    >
      {/* Featured */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10">
        <div className="flex h-28 items-center justify-between bg-gradient-to-br from-amber-600 to-orange-700 px-4">
          <div>
            <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
              Concert
            </span>
            <p className="mt-1.5 text-[13px] font-bold text-white">Afrobeats Night 2026</p>
            <p className="text-[9px] text-white/70">Eko Convention Centre · Sat 8:00 PM</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[11px] font-bold text-white">$38</span>
              <span className="rounded-full bg-white text-[8px] font-bold text-amber-600 px-2 py-0.5">
                Get tickets
              </span>
            </div>
          </div>
          <Calendar className="h-9 w-9 text-white/30" />
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 text-[9px] text-white/60">
          <Flame className="h-3 w-3 text-amber-400" />
          124 tickets left · Trending in Lagos
        </div>
      </div>

      <p className="mt-4 mb-2 text-[11px] font-semibold text-white">Upcoming</p>
      <div className="space-y-2">
        {events.map((event) => (
          <div key={event.name} className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-2.5">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${event.tint} text-[11px] font-bold text-white`}
            >
              {event.initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-white">{event.name}</p>
              <p className="truncate text-[9px] text-white/45">{event.meta}</p>
            </div>
            <span className="text-[11px] font-bold text-amber-400">{event.price}</span>
          </div>
        ))}
      </div>

      {/* Ticket QR */}
      <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-amber-300">Your ticket · ADMIT ONE</p>
            <p className="text-[9px] text-white/50">Afrobeats Night · Row B, Seat 12</p>
          </div>
          <div className="grid grid-cols-7 gap-[1.5px] rounded-md bg-white p-1.5">
            {qrCells.flat().map((cell, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 ${cell ? 'bg-dark-900' : 'bg-white'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </PhoneScreen>
  )
}

export function SellAppScreen() {
  const orders = [
    { name: 'Adunni Fashion House', item: 'Aso-Oke set ×2', amount: '$48.00', status: 'New' },
    { name: 'Kwame Tech Solutions', item: 'Power bank ×5', amount: '$125.00', status: 'Packed' },
    { name: 'Nairobi Fresh Market', item: 'Avocado crate', amount: '$64.50', status: 'Delivered' },
  ]
  const bars = [35, 55, 40, 70, 52, 82, 65, 96, 74]
  const actions: Array<[LucideIcon, string]> = [
    [Plus, 'Add product'],
    [Utensils, 'Manage menu'],
    [Wallet, 'Payouts'],
  ]

  return (
    <PhoneScreen
      tabs={SELL_TABS}
      header={
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] text-white/50">Vendor Hub</p>
            <p className="text-[12px] font-semibold text-white">Amina&apos;s Boutique</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-gold text-[10px] font-bold text-white">
            A
          </div>
        </div>
      }
    >
      {/* Earnings */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
        <div className="flex items-center justify-between">
          <p className="text-[9px] text-white/50">This month</p>
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[8px] font-bold text-emerald-400">
            <TrendingUp className="h-2.5 w-2.5" /> +18%
          </span>
        </div>
        <p className="mt-1 text-lg font-bold text-white">$12,480</p>
        <div className="mt-2.5 flex h-10 items-end gap-1">
          {bars.map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className={`flex-1 rounded-sm ${i === bars.length - 1 ? 'bg-amber-400' : 'bg-white/15'}`}
            />
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {actions.map(([Icon, label]) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 py-2.5"
          >
            <Icon className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[8px] font-medium text-white/70">{label}</span>
          </div>
        ))}
      </div>

      {/* Orders */}
      <p className="mt-4 mb-2 flex items-center gap-1 text-[11px] font-semibold text-white">
        <Package className="h-3 w-3 text-amber-400" /> Recent orders
      </p>
      <div className="space-y-2">
        {orders.map((order) => (
          <div key={order.name} className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-gold text-[10px] font-bold text-white">
              {order.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-white">{order.name}</p>
              <p className="truncate text-[9px] text-white/45">{order.item}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-white">{order.amount}</p>
              <p
                className={`text-[8px] font-semibold ${
                  order.status === 'Delivered' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {order.status}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-[9px] text-white/50">
        <Users className="h-3 w-3 text-amber-400" />
        1.2M customers across 16+ countries can discover your store
      </div>
    </PhoneScreen>
  )
}
