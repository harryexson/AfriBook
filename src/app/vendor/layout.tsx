'use client'

import { useEffect, useMemo } from 'react'
import { useRouter, usePathname, RedirectType } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Menu, Bell, ChevronRight, Home } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import VendorSidebar from '@/components/vendor/VendorSidebar'

const BREADCRUMB_MAP: Record<string, string> = {
  vendor: 'Dashboard',
  business: 'Business Profile',
  services: 'Services',
  products: 'Products',
  staff: 'Staff',
  bookings: 'Bookings',
  restaurant: 'Restaurant',
  menu: 'Menu',
  orders: 'Orders',
  analytics: 'Analytics',
  payouts: 'Payouts',
  qr: 'QR Codes',
  domain: 'Domain',
  settings: 'Settings',
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, status } = useAuthStore()
  const { setSidebarMobileOpen } = useUIStore()

  const isUnauthorized = status === 'authenticated' && user && user.role !== 'vendor' && user.role !== 'admin' && user.role !== 'super_admin'
  const isLoading = status === 'idle' || status === 'loading' || isUnauthorized

  useEffect(() => {
    if (isUnauthorized) {
      router.replace('/')
    }
  }, [isUnauthorized, router])

  const breadcrumbs = useMemo(
    () => pathname.split('/').filter(Boolean).filter((s) => s !== 'vendor' || pathname === '/vendor'),
    [pathname]
  )
  const crumbs = useMemo(
    () => breadcrumbs.map((seg, i) => ({
      label: BREADCRUMB_MAP[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
      href: '/' + breadcrumbs.slice(0, i + 1).join('/'),
      isLast: i === breadcrumbs.length - 1,
    })),
    [breadcrumbs]
  )

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
      <VendorSidebar businessName={user ? `${user.name}'s Business` : undefined} />

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
              <nav className="flex items-center gap-1 text-sm">
                <Link href="/vendor" className="text-text-tertiary hover:text-text-secondary transition-colors">
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

            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-lg hover:bg-surface-secondary transition-colors">
                <Bell className="w-5 h-5 text-text-secondary" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-semibold cursor-pointer">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'V'}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
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
      </div>
    </div>
  )
}
