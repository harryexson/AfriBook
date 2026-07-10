'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import {
  LayoutDashboard, Route, Wallet, Car, Settings, Bell,
  Menu, X, Home, ChevronRight, Wifi, WifiOff,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/driver', icon: LayoutDashboard },
  { label: 'Trips', href: '/driver/trips', icon: Route },
  { label: 'Earnings', href: '/driver/earnings', icon: Wallet },
  { label: 'Vehicle', href: '/driver/vehicle', icon: Car },
  { label: 'Settings', href: '/driver/settings', icon: Settings },
]

const BREADCRUMB_MAP: Record<string, string> = {
  driver: 'Dashboard',
  trips: 'Trips',
  earnings: 'Earnings',
  vehicle: 'Vehicle',
  settings: 'Settings',
}

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, status } = useAuthStore()
  const { sidebarMobileOpen, setSidebarMobileOpen } = useUIStore()
  const [isOnline, setIsOnline] = useState(true)

  const isUnauthorized = status === 'authenticated' && user && user.role !== 'driver' && user.role !== 'admin' && user.role !== 'super_admin'
  const isLoading = status === 'idle' || status === 'loading' || isUnauthorized

  useEffect(() => {
    if (isUnauthorized) {
      router.replace('/')
    }
  }, [isUnauthorized, router])

  // Breadcrumbs
  const segments = pathname.split('/').filter(Boolean).filter((s) => s !== 'driver' || pathname === '/driver')
  const crumbs = segments.map((seg, i) => ({
    label: BREADCRUMB_MAP[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
    href: '/driver/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }))

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center animate-glow">
            <span className="text-white font-bold text-xl">Af</span>
          </div>
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-secondary flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-surface shrink-0">
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="flex items-center justify-between p-4 border-b border-border-light">
            <Link href="/driver" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'D'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{user?.name ?? 'Driver'}</p>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wide">Driver Portal</p>
              </div>
            </Link>
          </div>

          {/* Online toggle */}
          <div className="p-4 border-b border-border-light">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all',
                isOnline
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
              )}
            >
              {isOnline ? (
                <><Wifi className="w-4 h-4" /> Online</>
              ) : (
                <><WifiOff className="w-4 h-4" /> Offline</>
              )}
            </button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 p-4 border-b border-border-light">
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">{isOnline ? '2,450' : '---'}</p>
              <p className="text-[10px] text-text-tertiary">Today</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">{isOnline ? '8' : '---'}</p>
              <p className="text-[10px] text-text-tertiary">Trips</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">{isOnline ? '4.9' : '---'}</p>
              <p className="text-[10px] text-text-tertiary">Rating</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === '/driver' ? pathname === '/driver' : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                  )}
                >
                  <item.icon className={cn(
                    'w-5 h-5 shrink-0',
                    isActive ? 'text-amber-600 dark:text-amber-400' : 'text-text-tertiary'
                  )} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Help card */}
          <div className="p-4 border-t border-border-light">
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Driver Support</p>
              <p className="text-[11px] text-text-secondary mt-1">Available 24/7</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              >
                <Menu className="w-5 h-5 text-text-secondary" />
              </button>

              {/* Breadcrumbs */}
              <nav className="hidden sm:flex items-center gap-1 text-sm">
                <Link href="/driver" className="text-text-tertiary hover:text-text-secondary transition-colors">
                  <Home className="w-3.5 h-3.5" />
                </Link>
                {crumbs.map((crumb) => (
                  <span key={crumb.href} className="flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-text-tertiary" />
                    {crumb.isLast ? (
                      <span className="font-medium text-text-primary">{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href} className="text-text-secondary hover:text-text-primary transition-colors">
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {/* Online toggle (mobile) */}
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={cn(
                  'lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                  isOnline
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-surface-secondary text-text-tertiary'
                )}
              >
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-text-tertiary'
                )} />
                {isOnline ? 'Online' : 'Offline'}
              </button>

              <button className="relative p-2 rounded-lg hover:bg-surface-secondary transition-colors">
                <Bell className="w-5 h-5 text-text-secondary" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-semibold cursor-pointer">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'D'}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
          >
            {children}
          </motion.div>
        </main>

        {/* Bottom nav (mobile) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-xl border-t border-border safe-area-bottom">
          <div className="flex items-center justify-around h-16 px-2">
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === '/driver' ? pathname === '/driver' : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-0',
                    isActive ? 'text-amber-600' : 'text-text-tertiary hover:text-text-secondary'
                  )}
                >
                  <item.icon className={cn('w-5 h-5', isActive && 'drop-shadow-sm')} />
                  <span className={cn('text-[10px] font-medium truncate', isActive ? 'font-semibold' : '')}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-72 z-50 bg-surface border-r border-border lg:hidden"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-border-light">
                  <Link href="/driver" className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm">
                      {user?.name?.charAt(0)?.toUpperCase() ?? 'D'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{user?.name ?? 'Driver'}</p>
                      <p className="text-[10px] text-text-tertiary uppercase tracking-wide">Driver Portal</p>
                    </div>
                  </Link>
                  <button onClick={() => setSidebarMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors">
                    <X className="w-4 h-4 text-text-secondary" />
                  </button>
                </div>

                <div className="p-4 border-b border-border-light">
                  <button
                    onClick={() => { setIsOnline(!isOnline); setSidebarMobileOpen(false) }}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all',
                      isOnline
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                        : 'bg-surface-secondary text-text-secondary'
                    )}
                  >
                    {isOnline ? <><Wifi className="w-4 h-4" /> Online</> : <><WifiOff className="w-4 h-4" /> Offline</>}
                  </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                  {NAV_ITEMS.map((item) => {
                    const isActive = item.href === '/driver' ? pathname === '/driver' : pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                          isActive
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                        )}
                      >
                        <item.icon className={cn('w-5 h-5', isActive ? 'text-amber-600' : 'text-text-tertiary')} />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Bottom nav spacer */}
      <div className="lg:hidden h-16" />
    </div>
  )
}
