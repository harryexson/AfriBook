'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import type { UserRole, AdminRole } from '@/types'
import {
  LayoutDashboard, Users, Building2, CreditCard, Scale,
  Globe, BarChart3, ShieldCheck, Settings, X,
  ChevronLeft, ChevronRight, Search,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
  roles: (UserRole | AdminRole)[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'moderator', 'finance', 'support'] },
  { label: 'Users', href: '/admin/users', icon: Users, roles: ['super_admin', 'admin', 'moderator', 'support'] },
  { label: 'Businesses', href: '/admin/businesses', icon: Building2, roles: ['super_admin', 'admin', 'moderator'] },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard, roles: ['super_admin', 'admin', 'finance'] },
  { label: 'Disputes', href: '/admin/disputes', icon: Scale, roles: ['super_admin', 'admin', 'finance'] },
  { label: 'Countries', href: '/admin/countries', icon: Globe, roles: ['super_admin', 'admin'] },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, roles: ['super_admin', 'admin', 'finance'] },
  { label: 'KYC / KYB', href: '/admin/kyc', icon: ShieldCheck, roles: ['super_admin', 'admin', 'moderator'] },
  { label: 'Settings', href: '/admin/settings', icon: Settings, roles: ['super_admin', 'admin'] },
]

interface AdminSidebarProps {
  onNavigate?: () => void
}

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { sidebarOpen, sidebarMobileOpen, toggleSidebar, setSidebarMobileOpen } = useUIStore()

  const adminRole = (user?.role ?? 'admin') as UserRole

  const visibleItems = useMemo(
    () => NAV_ITEMS.filter((item) => item.roles.includes(adminRole)),
    [adminRole],
  )

  useEffect(() => {
    setSidebarMobileOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border-light">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            Af
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">AfriBook</p>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wide">Admin Panel</p>
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

      {/* Search */}
      {sidebarOpen && (
        <div className="px-3 pt-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-tertiary">
            <Search className="w-4 h-4" />
            <span className="flex-1">Search...</span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border font-mono">Ctrl+K</kbd>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {visibleItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
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

      {/* Collapse toggle */}
      <div className="hidden lg:block p-3 border-t border-border-light">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full py-2 rounded-xl text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary transition-all text-xs font-medium gap-1"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {sidebarOpen && <span>Collapse</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className={cn(
        'hidden lg:flex flex-col border-r border-border bg-surface transition-all duration-300 shrink-0',
        sidebarOpen ? 'w-64' : 'w-16'
      )}>
        {sidebar}
      </aside>

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
