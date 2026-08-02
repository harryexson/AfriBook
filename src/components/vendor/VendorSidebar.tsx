'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import {
  LayoutDashboard, Building2, Scissors, Package, Users, Calendar,
  Utensils, BarChart3, Wallet, Settings, QrCode, X,
  ShoppingBag, Globe,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/vendor', icon: LayoutDashboard },
  { label: 'Business Profile', href: '/vendor/business', icon: Building2 },
  { label: 'Services', href: '/vendor/services', icon: Scissors },
  { label: 'Products', href: '/vendor/products', icon: Package },
  { label: 'Staff', href: '/vendor/staff', icon: Users },
  { label: 'Bookings', href: '/vendor/bookings', icon: Calendar },
  { label: 'Menu', href: '/vendor/restaurant/menu', icon: Utensils },
  { label: 'Orders', href: '/vendor/restaurant/orders', icon: ShoppingBag },
  { label: 'Domain', href: '/vendor/domain', icon: Globe },
  { label: 'Analytics', href: '/vendor/analytics', icon: BarChart3 },
  { label: 'Payouts', href: '/vendor/payouts', icon: Wallet },
  { label: 'QR Codes', href: '/vendor/qr', icon: QrCode },
  { label: 'Settings', href: '/vendor/settings', icon: Settings },
]

interface VendorSidebarProps {
  businessName?: string
}

export default function VendorSidebar({ businessName }: VendorSidebarProps) {
  const pathname = usePathname()
  const { sidebarOpen, sidebarMobileOpen, setSidebarMobileOpen } = useUIStore()

  useEffect(() => {
    setSidebarMobileOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/vendor') return pathname === '/vendor'
    return pathname.startsWith(href)
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border-light">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {(businessName ?? 'AB').charAt(0).toUpperCase()}
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{businessName ?? 'AfriBook Vendor'}</p>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wide">Vendor Dashboard</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setSidebarMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
        >
          <X className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                active
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              )}
            >
              <item.icon className={cn(
                'w-5 h-5 shrink-0 transition-colors',
                active ? 'text-amber-600 dark:text-amber-400' : 'text-text-tertiary group-hover:text-text-secondary'
              )} />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {sidebarOpen && (
        <div className="p-4 border-t border-border-light">
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Need help?</p>
            <p className="text-[11px] text-text-secondary mt-1">Visit our vendor support center.</p>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col border-r border-border bg-surface transition-all duration-300 shrink-0',
        sidebarOpen ? 'w-64' : 'w-16'
      )}>
        {sidebar}
      </aside>

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
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
