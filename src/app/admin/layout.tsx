'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Menu, Bell, ChevronRight, Home, Search, X,
  Command, MessageSquare, UserPlus, Building2, CreditCard,
  Scale, FileText,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import AdminSidebar from '@/components/admin/AdminSidebar'
import ImpersonationBanner from '@/components/admin/ImpersonationBanner'
import * as Dialog from '@radix-ui/react-dialog'
import * as ScrollArea from '@radix-ui/react-scroll-area'

const BREADCRUMB_MAP: Record<string, string> = {
  admin: 'Dashboard',
  users: 'Users',
  businesses: 'Businesses',
  payments: 'Payments',
  disputes: 'Disputes',
  countries: 'Countries',
  analytics: 'Analytics',
  kyc: 'KYC / KYB',
  settings: 'Settings',
  team: 'Team Management',
  audit: 'Audit Logs',
  crm: 'CRM',
  compliance: 'Compliance',
}

const QUICK_SEARCH_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: Home, keywords: 'home overview stats' },
  { label: 'Users', href: '/admin/users', icon: UserPlus, keywords: 'customers vendors drivers' },
  { label: 'Businesses', href: '/admin/businesses', icon: Building2, keywords: 'vendors shops services' },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard, keywords: 'transactions fees refunds' },
  { label: 'Disputes', href: '/admin/disputes', icon: Scale, keywords: 'claims chargebacks refunds' },
  { label: 'Analytics', href: '/admin/analytics', icon: FileText, keywords: 'reports stats metrics' },
  { label: 'KYC', href: '/admin/kyc', icon: FileText, keywords: 'verification documents identity' },
  { label: 'Settings', href: '/admin/settings', icon: Home, keywords: 'configuration platform' },
]

const MOCK_NOTIFICATIONS = [
  { id: 'n1', title: 'New dispute raised', body: 'Payment #pay_45 has been disputed', time: '5m ago', unread: true },
  { id: 'n2', title: 'KYC document pending', body: '3 documents awaiting review', time: '15m ago', unread: true },
  { id: 'n3', title: 'Large payout processed', body: 'XAF 2,500,000 paid to vendor #v_12', time: '1h ago', unread: false },
  { id: 'n4', title: 'System alert', body: 'Payment provider latency detected', time: '2h ago', unread: false },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, status } = useAuthStore()
  const { setSidebarMobileOpen } = useUIStore()

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)

  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin')
  const isAuthorized = status !== 'authenticated' || isAdmin
  const isLoading = status === 'idle' || status === 'loading'

  useEffect(() => {
    if (status === 'authenticated' && !isAdmin) {
      router.replace('/')
    }
  }, [status, isAdmin, router])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    return segments.map((seg, i) => ({
      label: BREADCRUMB_MAP[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
      href: '/' + segments.slice(0, i + 1).join('/'),
      isLast: i === segments.length - 1,
    }))
  }, [pathname])

  const searchResults = useMemo(
    () => searchQuery
      ? QUICK_SEARCH_ITEMS.filter((item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.keywords.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : QUICK_SEARCH_ITEMS,
    [searchQuery],
  )

  const handleSearchNavigate = useCallback((href: string) => {
    setSearchOpen(false)
    setSearchQuery('')
    router.push(href)
  }, [router])

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

  if (!isAuthorized) return null

  return (
    <div className="min-h-screen bg-surface-secondary flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <ImpersonationBanner />

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
                <Link href="/admin" className="text-text-tertiary hover:text-text-secondary transition-colors">
                  <Home className="w-3.5 h-3.5" />
                </Link>
                {breadcrumbs.map((crumb) => (
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
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-secondary border border-border text-xs text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search...</span>
                <kbd className="text-[10px] px-1 py-0.5 rounded bg-surface border border-border font-mono">Ctrl+K</kbd>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 rounded-lg hover:bg-surface-secondary transition-colors"
                >
                  <Bell className="w-5 h-5 text-text-secondary" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
                </button>

                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="absolute right-0 top-10 w-80 z-50 rounded-2xl bg-surface border border-border shadow-xl shadow-black/5 overflow-hidden"
                    >
                      <div className="p-3 border-b border-border">
                        <p className="text-sm font-semibold text-text-primary">Notifications</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {MOCK_NOTIFICATIONS.map((n) => (
                          <div key={n.id} className={cn('flex items-start gap-3 p-3 hover:bg-surface-secondary transition-colors cursor-pointer', n.unread && 'bg-amber-50/50 dark:bg-amber-900/10')}>
                            <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', n.unread ? 'bg-amber-500' : 'bg-transparent')} />
                            <div>
                              <p className="text-sm font-medium text-text-primary">{n.title}</p>
                              <p className="text-xs text-text-tertiary mt-0.5">{n.body}</p>
                              <p className="text-[10px] text-text-tertiary mt-1">{n.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 border-t border-border text-center">
                        <button className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors">View all notifications</button>
                      </div>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Admin avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-semibold cursor-pointer">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <ScrollArea.Root className="flex-1 overflow-hidden">
          <ScrollArea.Viewport className="h-full">
            <main className="p-4 lg:p-6">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
              >
                {children}
              </motion.div>
            </main>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" className="flex w-2.5 touch-none select-none bg-transparent p-0.5">
            <ScrollArea.Thumb className="relative flex-1 rounded-full bg-border" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </div>

      {/* Command palette */}
      <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50 focus:outline-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <Command className="w-5 h-5 text-text-tertiary shrink-0" />
                <input
                  type="text"
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-tertiary focus:outline-none"
                  autoFocus
                />
                <Dialog.Close className="p-1 rounded-lg hover:bg-surface-secondary transition-colors">
                  <X className="w-4 h-4 text-text-tertiary" />
                </Dialog.Close>
              </div>
              <div className="max-h-72 overflow-y-auto p-2 space-y-0.5">
                {searchResults.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => handleSearchNavigate(item.href)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-surface-secondary transition-colors text-left"
                  >
                    <item.icon className="w-4 h-4 text-text-tertiary" />
                    <span className="text-sm font-medium text-text-primary">{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 px-4 py-3 border-t border-border text-[10px] text-text-tertiary">
                <span><kbd className="px-1 py-0.5 rounded bg-surface-secondary border border-border font-mono">↑↓</kbd> Navigate</span>
                <span><kbd className="px-1 py-0.5 rounded bg-surface-secondary border border-border font-mono">↵</kbd> Open</span>
                <span><kbd className="px-1 py-0.5 rounded bg-surface-secondary border border-border font-mono">Esc</kbd> Close</span>
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
