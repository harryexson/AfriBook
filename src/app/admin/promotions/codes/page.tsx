'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatCurrency } from '@/lib/utils'
import AdminStatCard from '@/components/admin/StatCard'
import {
  Tag, Percent, DollarSign, Users, TrendingUp, Shield,
  Plus, Search, Download, Copy, BarChart3, X, CheckCircle,
  Sparkles, Globe, ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

type DiscountType = 'percentage' | 'fixed'
type CodeStatus = 'active' | 'expired' | 'disabled'

interface PromoCode {
  id: string
  code: string
  description: string
  discountType: DiscountType
  discountValue: number
  minOrder: number
  maxUses: number
  usedCount: number
  maxPerUser: number
  validFrom: string
  validUntil: string
  status: CodeStatus
  countries: string[]
  categories: string[]
  revenueImpact: number
  topUsers: { name: string; uses: number }[]
  dailyRedemptions: { date: string; count: number }[]
}

const PROMO_CODES: PromoCode[] = [
  {
    id: 'pc_001', code: 'WELCOME20', description: 'Welcome bonus for new users — 20% off first order',
    discountType: 'percentage', discountValue: 20, minOrder: 5000, maxUses: 50000, usedCount: 18420,
    maxPerUser: 1, validFrom: '2026-01-01', validUntil: '2026-12-31', status: 'active',
    countries: ['CM', 'NG', 'KE', 'GH', 'ZA'], categories: ['All'],
    revenueImpact: 18960000,
    topUsers: [{ name: 'Jean-Pierre Mbarga', uses: 1 }, { name: 'Amina Bello', uses: 1 }, { name: 'Kofi Mensah', uses: 1 }],
    dailyRedemptions: [{ date: 'Jul 7', count: 142 }, { date: 'Jul 8', count: 168 }, { date: 'Jul 9', count: 155 }, { date: 'Jul 10', count: 190 }, { date: 'Jul 11', count: 174 }, { date: 'Jul 12', count: 203 }, { date: 'Jul 13', count: 181 }],
  },
  {
    id: 'pc_002', code: 'FREEDEL', description: 'Free delivery on all orders above 10,000 XAF',
    discountType: 'fixed', discountValue: 2500, minOrder: 10000, maxUses: 30000, usedCount: 12890,
    maxPerUser: 3, validFrom: '2026-03-01', validUntil: '2026-09-30', status: 'active',
    countries: ['CM', 'NG'], categories: ['Food & Dining', 'Groceries'],
    revenueImpact: 32225000,
    topUsers: [{ name: 'Emmanuel Nkoulou', uses: 3 }, { name: 'Fatima Abubakar', uses: 2 }, { name: 'David Okafor', uses: 3 }],
    dailyRedemptions: [{ date: 'Jul 7', count: 230 }, { date: 'Jul 8', count: 265 }, { date: 'Jul 9', count: 248 }, { date: 'Jul 10', count: 290 }, { date: 'Jul 11', count: 275 }, { date: 'Jul 12', count: 310 }, { date: 'Jul 13', count: 256 }],
  },
  {
    id: 'pc_003', code: 'REFER5', description: 'Referral reward — 500 XAF credit for both referrer and referee',
    discountType: 'fixed', discountValue: 500, minOrder: 0, maxUses: 100000, usedCount: 34560,
    maxPerUser: 50, validFrom: '2026-01-15', validUntil: '2026-12-31', status: 'active',
    countries: ['All'], categories: ['All'],
    revenueImpact: 17280000,
    topUsers: [{ name: 'Grace Adeyemi', uses: 42 }, { name: 'Samuel Owusu', uses: 38 }, { name: 'Chantal Fouda', uses: 31 }],
    dailyRedemptions: [{ date: 'Jul 7', count: 480 }, { date: 'Jul 8', count: 510 }, { date: 'Jul 9', count: 495 }, { date: 'Jul 10', count: 520 }, { date: 'Jul 11', count: 505 }, { date: 'Jul 12', count: 490 }, { date: 'Jul 13', count: 515 }],
  },
  {
    id: 'pc_004', code: 'WEEKEND15', description: 'Weekend special — 15% off every Saturday and Sunday',
    discountType: 'percentage', discountValue: 15, minOrder: 3000, maxUses: 25000, usedCount: 8920,
    maxPerUser: 2, validFrom: '2026-04-01', validUntil: '2026-12-31', status: 'active',
    countries: ['CM', 'KE', 'GH'], categories: ['Food & Dining', 'Salon & Beauty', 'Fitness'],
    revenueImpact: 14500000,
    topUsers: [{ name: 'Pauline Njoroge', uses: 2 }, { name: 'Ibrahim Sow', uses: 2 }, { name: 'Thandiwe Mokoena', uses: 2 }],
    dailyRedemptions: [{ date: 'Jul 7', count: 320 }, { date: 'Jul 8', count: 85 }, { date: 'Jul 9', count: 78 }, { date: 'Jul 10', count: 82 }, { date: 'Jul 11', count: 90 }, { date: 'Jul 12', count: 345 }, { date: 'Jul 13', count: 360 }],
  },
  {
    id: 'pc_005', code: 'NEWUSER', description: 'New user exclusive — flat 2,000 XAF off first booking',
    discountType: 'fixed', discountValue: 2000, minOrder: 5000, maxUses: 40000, usedCount: 15670,
    maxPerUser: 1, validFrom: '2026-02-01', validUntil: '2026-12-31', status: 'active',
    countries: ['NG', 'ZA', 'TZ'], categories: ['All'],
    revenueImpact: 31340000,
    topUsers: [{ name: 'Tunde Adebayo', uses: 1 }, { name: 'Naledi Dlamini', uses: 1 }, { name: 'Aisha Mwangi', uses: 1 }],
    dailyRedemptions: [{ date: 'Jul 7', count: 198 }, { date: 'Jul 8', count: 215 }, { date: 'Jul 9', count: 203 }, { date: 'Jul 10', count: 228 }, { date: 'Jul 11', count: 210 }, { date: 'Jul 12', count: 242 }, { date: 'Jul 13', count: 219 }],
  },
  {
    id: 'pc_006', code: 'VIP50', description: 'VIP tier exclusive — 50% off premium services',
    discountType: 'percentage', discountValue: 50, minOrder: 20000, maxUses: 5000, usedCount: 1890,
    maxPerUser: 1, validFrom: '2026-06-01', validUntil: '2026-08-31', status: 'active',
    countries: ['CM', 'NG'], categories: ['Consulting', 'Photography', 'Fitness'],
    revenueImpact: 18900000,
    topUsers: [{ name: 'Patrice Atangana', uses: 1 }, { name: 'Ngozi Eze', uses: 1 }, { name: 'Brian Kimani', uses: 1 }],
    dailyRedemptions: [{ date: 'Jul 7', count: 12 }, { date: 'Jul 8', count: 15 }, { date: 'Jul 9', count: 14 }, { date: 'Jul 10', count: 18 }, { date: 'Jul 11', count: 16 }, { date: 'Jul 12', count: 20 }, { date: 'Jul 13', count: 17 }],
  },
  {
    id: 'pc_007', code: 'STUDENT20', description: 'Student discount — 20% off with valid student ID verification',
    discountType: 'percentage', discountValue: 20, minOrder: 2000, maxUses: 15000, usedCount: 4560,
    maxPerUser: 5, validFrom: '2026-01-01', validUntil: '2026-12-31', status: 'active',
    countries: ['KE', 'NG', 'GH', 'TZ', 'UG'], categories: ['Fitness', 'Salon & Beauty', 'Food & Dining'],
    revenueImpact: 9120000,
    topUsers: [{ name: 'Kevin Omondi', uses: 5 }, { name: 'Blessing Okoro', uses: 4 }, { name: 'Yaa Asantewaa', uses: 4 }],
    dailyRedemptions: [{ date: 'Jul 7', count: 55 }, { date: 'Jul 8', count: 62 }, { date: 'Jul 9', count: 58 }, { date: 'Jul 10', count: 68 }, { date: 'Jul 11', count: 64 }, { date: 'Jul 12', count: 72 }, { date: 'Jul 13', count: 60 }],
  },
  {
    id: 'pc_008', code: 'FIRSTBOOK', description: 'First booking bonus — 3,000 XAF off your very first reservation',
    discountType: 'fixed', discountValue: 3000, minOrder: 8000, maxUses: 20000, usedCount: 7840,
    maxPerUser: 1, validFrom: '2026-01-01', validUntil: '2026-12-31', status: 'active',
    countries: ['All'], categories: ['All'],
    revenueImpact: 23520000,
    topUsers: [{ name: 'Mariam Diallo', uses: 1 }, { name: 'Oluwaseun Adeyemi', uses: 1 }, { name: 'Zainab Hassan', uses: 1 }],
    dailyRedemptions: [{ date: 'Jul 7', count: 92 }, { date: 'Jul 8', count: 105 }, { date: 'Jul 9', count: 98 }, { date: 'Jul 10', count: 112 }, { date: 'Jul 11', count: 107 }, { date: 'Jul 12', count: 118 }, { date: 'Jul 13', count: 101 }],
  },
  {
    id: 'pc_009', code: 'BUSINESS25', description: 'Business account signup — 25% off first 3 months of premium',
    discountType: 'percentage', discountValue: 25, minOrder: 15000, maxUses: 8000, usedCount: 2340,
    maxPerUser: 1, validFrom: '2026-03-01', validUntil: '2026-12-31', status: 'active',
    countries: ['CM', 'NG', 'KE', 'ZA'], categories: ['Business Services', 'Consulting'],
    revenueImpact: 11700000,
    topUsers: [{ name: 'TechHub Cameroon', uses: 1 }, { name: 'Lagos Connect Ltd', uses: 1 }, { name: 'Nairobi Digital', uses: 1 }],
    dailyRedemptions: [{ date: 'Jul 7', count: 8 }, { date: 'Jul 8', count: 11 }, { date: 'Jul 9', count: 9 }, { date: 'Jul 10', count: 14 }, { date: 'Jul 11', count: 12 }, { date: 'Jul 12', count: 15 }, { date: 'Jul 13', count: 10 }],
  },
  {
    id: 'pc_010', code: 'HOLIDAY30', description: 'Holiday season special — 30% off during festive periods',
    discountType: 'percentage', discountValue: 30, minOrder: 10000, maxUses: 20000, usedCount: 11200,
    maxPerUser: 2, validFrom: '2026-12-15', validUntil: '2027-01-05', status: 'active',
    countries: ['All'], categories: ['Food & Dining', 'Salon & Beauty', 'Photography'],
    revenueImpact: 33600000,
    topUsers: [{ name: 'Celestine Biyick', uses: 2 }, { name: 'Adaeze Obi', uses: 2 }, { name: 'Peter Wanjiku', uses: 2 }],
    dailyRedemptions: [{ date: 'Jul 7', count: 0 }, { date: 'Jul 8', count: 0 }, { date: 'Jul 9', count: 0 }, { date: 'Jul 10', count: 0 }, { date: 'Jul 11', count: 0 }, { date: 'Jul 12', count: 0 }, { date: 'Jul 13', count: 0 }],
  },
  {
    id: 'pc_011', code: 'FLASH10', description: 'Flash sale exclusive — 10% off during 24-hour flash events',
    discountType: 'percentage', discountValue: 10, minOrder: 1000, maxUses: 50000, usedCount: 22100,
    maxPerUser: 3, validFrom: '2026-06-15', validUntil: '2026-07-15', status: 'active',
    countries: ['NG', 'KE', 'CM'], categories: ['All'],
    revenueImpact: 22100000,
    topUsers: [{ name: 'Chidinma Eze', uses: 3 }, { name: 'Wangari Muthoni', uses: 3 }, { name: 'Alain Biya', uses: 2 }],
    dailyRedemptions: [{ date: 'Jul 7', count: 580 }, { date: 'Jul 8', count: 620 }, { date: 'Jul 9', count: 595 }, { date: 'Jul 10', count: 640 }, { date: 'Jul 11', count: 610 }, { date: 'Jul 12', count: 660 }, { date: 'Jul 13', count: 625 }],
  },
  {
    id: 'pc_012', code: 'LOYALTY20', description: 'Loyalty reward — 20% off for users with 10+ completed bookings',
    discountType: 'percentage', discountValue: 20, minOrder: 5000, maxUses: 30000, usedCount: 8900,
    maxPerUser: 1, validFrom: '2026-04-01', validUntil: '2026-12-31', status: 'active',
    countries: ['All'], categories: ['All'],
    revenueImpact: 17800000,
    topUsers: [{ name: 'Mariama Camara', uses: 1 }, { name: 'Emeka Nwosu', uses: 1 }, { name: 'Amina Juma', uses: 1 }],
    dailyRedemptions: [{ date: 'Jul 7', count: 42 }, { date: 'Jul 8', count: 48 }, { date: 'Jul 9', count: 45 }, { date: 'Jul 10', count: 52 }, { date: 'Jul 11', count: 49 }, { date: 'Jul 12', count: 55 }, { date: 'Jul 13', count: 46 }],
  },
  {
    id: 'pc_013', code: 'PARTNER15', description: 'Partner business co-promotion — 15% off at partner locations',
    discountType: 'percentage', discountValue: 15, minOrder: 3000, maxUses: 10000, usedCount: 3450,
    maxPerUser: 2, validFrom: '2026-05-01', validUntil: '2026-09-30', status: 'active',
    countries: ['CM', 'NG'], categories: ['Food & Dining', 'Salon & Beauty'],
    revenueImpact: 6900000,
    topUsers: [{ name: 'Jacques Kamga', uses: 2 }, { name: 'Blessing Onuoha', uses: 2 }, { name: 'Sandrine Tchinda', uses: 1 }],
    dailyRedemptions: [{ date: 'Jul 7', count: 28 }, { date: 'Jul 8', count: 32 }, { date: 'Jul 9', count: 30 }, { date: 'Jul 10', count: 35 }, { date: 'Jul 11', count: 33 }, { date: 'Jul 12', count: 38 }, { date: 'Jul 13', count: 31 }],
  },
  {
    id: 'pc_014', code: 'MEDIA20', description: 'Media & influencer campaign — 20% off via social media link referrals',
    discountType: 'percentage', discountValue: 20, minOrder: 5000, maxUses: 12000, usedCount: 5670,
    maxPerUser: 1, validFrom: '2026-06-01', validUntil: '2026-08-31', status: 'active',
    countries: ['NG', 'KE', 'ZA'], categories: ['Food & Dining', 'Fitness', 'Salon & Beauty'],
    revenueImpact: 11340000,
    topUsers: [{ name: 'Bella Okonkwo', uses: 1 }, { name: 'Kevin Hart Jr', uses: 1 }, { name: 'Zuri Kariuki', uses: 1 }],
    dailyRedemptions: [{ date: 'Jul 7', count: 72 }, { date: 'Jul 8', count: 85 }, { date: 'Jul 9', count: 78 }, { date: 'Jul 10', count: 92 }, { date: 'Jul 11', count: 88 }, { date: 'Jul 12', count: 95 }, { date: 'Jul 13', count: 82 }],
  },
  {
    id: 'pc_015', code: 'GROUP10', description: 'Group booking discount — 10% off when booking for 4+ people',
    discountType: 'percentage', discountValue: 10, minOrder: 15000, maxUses: 8000, usedCount: 1890,
    maxPerUser: 5, validFrom: '2026-03-01', validUntil: '2026-12-31', status: 'active',
    countries: ['All'], categories: ['Fitness', 'Photography', 'Consulting'],
    revenueImpact: 5670000,
    topUsers: [{ name: 'Team AfriBook', uses: 5 }, { name: 'Lagos Social Club', uses: 4 }, { name: 'Nairobi Runners', uses: 3 }],
    dailyRedemptions: [{ date: 'Jul 7', count: 15 }, { date: 'Jul 8', count: 18 }, { date: 'Jul 9', count: 16 }, { date: 'Jul 10', count: 22 }, { date: 'Jul 11', count: 19 }, { date: 'Jul 12', count: 24 }, { date: 'Jul 13', count: 17 }],
  },
  {
    id: 'pc_016', code: 'EXPIRED_OLD', description: 'Expired legacy code from Q1 2025 campaign',
    discountType: 'percentage', discountValue: 25, minOrder: 5000, maxUses: 10000, usedCount: 10000,
    maxPerUser: 1, validFrom: '2025-01-01', validUntil: '2025-03-31', status: 'expired',
    countries: ['CM'], categories: ['Food & Dining'],
    revenueImpact: 25000000,
    topUsers: [{ name: 'Legacy User 1', uses: 1 }, { name: 'Legacy User 2', uses: 1 }],
    dailyRedemptions: [{ date: 'Jul 7', count: 0 }, { date: 'Jul 8', count: 0 }, { date: 'Jul 9', count: 0 }, { date: 'Jul 10', count: 0 }, { date: 'Jul 11', count: 0 }, { date: 'Jul 12', count: 0 }, { date: 'Jul 13', count: 0 }],
  },
  {
    id: 'pc_017', code: 'TESTCODE', description: 'Internal testing code — disabled after QA sign-off',
    discountType: 'fixed', discountValue: 1000, minOrder: 0, maxUses: 100, usedCount: 42,
    maxPerUser: 10, validFrom: '2026-01-01', validUntil: '2026-12-31', status: 'disabled',
    countries: ['All'], categories: ['All'],
    revenueImpact: 42000,
    topUsers: [{ name: 'QA Tester', uses: 10 }, { name: 'Dev Team', uses: 8 }],
    dailyRedemptions: [{ date: 'Jul 7', count: 0 }, { date: 'Jul 8', count: 0 }, { date: 'Jul 9', count: 0 }, { date: 'Jul 10', count: 0 }, { date: 'Jul 11', count: 0 }, { date: 'Jul 12', count: 0 }, { date: 'Jul 13', count: 0 }],
  },
]

const STATUS_STYLES: Record<CodeStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  expired: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  disabled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const COLORS = ['#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444']

export default function AdminPromoCodesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CodeStatus | 'all'>('all')
  const [expandedCode, setExpandedCode] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const [newCode, setNewCode] = useState({
    code: '', description: '', discountType: 'percentage' as DiscountType,
    discountValue: 10, minOrder: 0, maxUses: 1000, maxPerUser: 1,
    validFrom: '', validUntil: '', countries: 'All', categories: 'All',
  })

  const [bulkPrefix, setBulkPrefix] = useState('')
  const [bulkCount, setBulkCount] = useState(10)
  const [bulkGenerated, setBulkGenerated] = useState<string[]>([])

  const filtered = useMemo(() => {
    return PROMO_CODES.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (search && !c.code.toLowerCase().includes(search.toLowerCase()) && !c.description.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [statusFilter, search])

  const totalRedemptions = PROMO_CODES.reduce((sum, c) => sum + c.usedCount, 0)
  const totalRevenueImpact = PROMO_CODES.reduce((sum, c) => sum + c.revenueImpact, 0)
  const activeCodes = PROMO_CODES.filter((c) => c.status === 'active').length

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleBulkGenerate = () => {
    if (!bulkPrefix) return
    const codes = Array.from({ length: bulkCount }, (_, i) => {
      const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
      return `${bulkPrefix.toUpperCase()}_${suffix}`
    })
    setBulkGenerated(codes)
    setToast({ type: 'success', message: `${codes.length} promo codes generated` })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreate = () => {
    if (!newCode.code) {
      setToast({ type: 'error', message: 'Promo code is required' })
      setTimeout(() => setToast(null), 3000)
      return
    }
    setToast({ type: 'success', message: `Promo code "${newCode.code}" created successfully` })
    setShowCreateForm(false)
    setNewCode({ code: '', description: '', discountType: 'percentage', discountValue: 10, minOrder: 0, maxUses: 1000, maxPerUser: 1, validFrom: '', validUntil: '', countries: 'All', categories: 'All' })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-heading">Promo Codes</h1>
            <p className="text-sm text-text-secondary mt-1">Create, manage, and track all promotional codes on the platform.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={() => { setShowCreateForm(!showCreateForm); setBulkGenerated([]) }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create Promo Code
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Active Codes" value={String(activeCodes)} icon={Tag} change={10.2} accent="bg-amber-500" />
        <AdminStatCard label="Total Redemptions" value={totalRedemptions.toLocaleString()} icon={TrendingUp} change={18.4} accent="bg-emerald-500" />
        <AdminStatCard label="Revenue Impact" value={formatCurrency(totalRevenueImpact, 'XAF')} icon={DollarSign} change={26.7} accent="bg-purple-500" />
        <AdminStatCard label="Avg Redemption Rate" value="34.2%" icon={BarChart3} change={5.3} accent="bg-blue-500" />
      </motion.div>

      {/* Create form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-surface border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text-primary font-heading">Create Promo Code</h3>
                <button onClick={() => setShowCreateForm(false)} className="p-1 rounded-lg hover:bg-surface-secondary transition-colors">
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Code *</label>
                  <input
                    type="text" value={newCode.code} placeholder="e.g. SUMMER20"
                    onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
                  <input
                    type="text" value={newCode.description} placeholder="e.g. Summer holiday special discount"
                    onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Discount Type</label>
                  <select
                    value={newCode.discountType}
                    onChange={(e) => setNewCode({ ...newCode, discountType: e.target.value as DiscountType })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  >
                    <option value="percentage">Percentage Off (%)</option>
                    <option value="fixed">Fixed Amount (XAF)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Discount Value</label>
                  <input
                    type="number" value={newCode.discountValue} min={0}
                    onChange={(e) => setNewCode({ ...newCode, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Min Order (XAF)</label>
                  <input
                    type="number" value={newCode.minOrder} min={0}
                    onChange={(e) => setNewCode({ ...newCode, minOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Max Total Uses</label>
                  <input
                    type="number" value={newCode.maxUses} min={1}
                    onChange={(e) => setNewCode({ ...newCode, maxUses: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Max Uses Per User</label>
                  <input
                    type="number" value={newCode.maxPerUser} min={1}
                    onChange={(e) => setNewCode({ ...newCode, maxPerUser: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Valid From</label>
                  <input
                    type="date" value={newCode.validFrom}
                    onChange={(e) => setNewCode({ ...newCode, validFrom: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Valid Until</label>
                  <input
                    type="date" value={newCode.validUntil}
                    onChange={(e) => setNewCode({ ...newCode, validUntil: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Target Countries</label>
                  <select
                    value={newCode.countries}
                    onChange={(e) => setNewCode({ ...newCode, countries: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  >
                    <option value="All">All Countries</option>
                    <option value="CM">Cameroon</option>
                    <option value="NG">Nigeria</option>
                    <option value="KE">Kenya</option>
                    <option value="ZA">South Africa</option>
                    <option value="GH">Ghana</option>
                    <option value="TZ">Tanzania</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Applicable Categories</label>
                  <select
                    value={newCode.categories}
                    onChange={(e) => setNewCode({ ...newCode, categories: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  >
                    <option value="All">All Categories</option>
                    <option value="Food & Dining">Food &amp; Dining</option>
                    <option value="Salon & Beauty">Salon &amp; Beauty</option>
                    <option value="Fitness">Fitness &amp; Wellness</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Photography">Photography</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleCreate}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm"
                >
                  Create Promo Code
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-5 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk generate */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-text-primary font-heading">Bulk Generate Codes</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Prefix</label>
            <input
              type="text" value={bulkPrefix} placeholder="e.g. SUMMER"
              onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())}
              className="w-40 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Count</label>
            <input
              type="number" value={bulkCount} min={1} max={100}
              onChange={(e) => setBulkCount(Number(e.target.value))}
              className="w-24 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          <button
            onClick={handleBulkGenerate}
            className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm"
          >
            Generate
          </button>
        </div>
        {bulkGenerated.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-surface-secondary border border-border">
            <p className="text-xs font-medium text-text-secondary mb-2">Generated {bulkGenerated.length} codes:</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {bulkGenerated.map((code) => (
                <button
                  key={code}
                  onClick={() => handleCopy(code)}
                  className="px-2.5 py-1 rounded-lg bg-surface border border-border text-xs font-mono text-text-primary hover:border-amber-500/40 transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text" placeholder="Search codes or descriptions..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CodeStatus | 'all')}
            className="px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="disabled">Disabled</option>
          </select>
          <span className="text-xs text-text-tertiary">{filtered.length} codes</span>
        </div>
      </motion.div>

      {/* Promo codes table */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary/50">
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Code</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary hidden md:table-cell">Description</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Discount</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary hidden lg:table-cell">Min Order</th>
                <th className="text-right px-4 py-3 font-medium text-text-secondary">Usage</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary hidden xl:table-cell">Valid Period</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Status</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary hidden 2xl:table-cell">Countries</th>
                <th className="text-left px-4 py-3 font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((code) => {
                const usagePct = code.maxUses > 0 ? (code.usedCount / code.maxUses) * 100 : 0
                const isExpanded = expandedCode === code.id
                return (
                  <>
                    <tr key={code.id} className="border-b border-border/50 hover:bg-surface-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-text-primary">{code.code}</span>
                          <button onClick={() => handleCopy(code.code)} className="p-0.5 rounded hover:bg-surface-secondary transition-colors">
                            {copiedCode === code.code ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-text-tertiary" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-text-secondary line-clamp-1">{code.description}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {code.discountType === 'percentage' ? (
                            <Percent className="w-3 h-3 text-amber-500" />
                          ) : (
                            <DollarSign className="w-3 h-3 text-amber-500" />
                          )}
                          <span className="text-sm font-medium text-text-primary">
                            {code.discountType === 'percentage' ? `${code.discountValue}%` : formatCurrency(code.discountValue, 'XAF')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <span className="text-xs text-text-secondary">
                          {code.minOrder > 0 ? formatCurrency(code.minOrder, 'XAF') : 'None'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-xs font-medium text-text-primary">{code.usedCount.toLocaleString()} / {code.maxUses.toLocaleString()}</p>
                        <div className="w-16 h-1.5 rounded-full bg-surface-secondary mt-1 ml-auto">
                          <div
                            className={cn('h-full rounded-full transition-all', usagePct > 80 ? 'bg-red-500' : usagePct > 50 ? 'bg-amber-500' : 'bg-emerald-500')}
                            style={{ width: `${Math.min(usagePct, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <p className="text-xs text-text-secondary">{code.validFrom}</p>
                        <p className="text-xs text-text-tertiary">to {code.validUntil}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_STYLES[code.status])}>
                          {code.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden 2xl:table-cell">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-text-tertiary" />
                          <span className="text-xs text-text-secondary">
                            {code.countries.includes('All') ? 'Global' : code.countries.join(', ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedCode(isExpanded ? null : code.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-amber-500 hover:bg-amber-500/10 transition-colors"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          Analytics
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${code.id}-analytics`}>
                        <td colSpan={9} className="p-4 bg-surface-secondary/30">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div>
                              <h4 className="text-sm font-semibold text-text-primary mb-2">Redemption Trend (7 days)</h4>
                              <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={code.dailyRedemptions}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px', fontSize: '12px' }} />
                                    <Line type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3, fill: '#F59E0B' }} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-text-primary mb-2">Top Users</h4>
                              <div className="space-y-2">
                                {code.topUsers.map((u, i) => (
                                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border/50">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600">
                                        {u.name[0]}
                                      </div>
                                      <span className="text-xs text-text-primary">{u.name}</span>
                                    </div>
                                    <span className="text-xs text-text-secondary">{u.uses} use{u.uses > 1 ? 's' : ''}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-text-primary mb-2">Revenue Impact</h4>
                              <div className="p-4 rounded-xl bg-surface border border-border/50 text-center">
                                <DollarSign className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-text-primary">{formatCurrency(code.revenueImpact, 'XAF')}</p>
                                <p className="text-xs text-text-secondary mt-1">Total revenue influenced</p>
                              </div>
                              <div className="mt-3 p-3 rounded-xl bg-surface border border-border/50">
                                <p className="text-xs text-text-secondary mb-1">Categories</p>
                                <div className="flex flex-wrap gap-1">
                                  {code.categories.map((cat) => (
                                    <span key={cat} className="px-2 py-0.5 rounded-full bg-surface-secondary text-xs text-text-secondary">{cat}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          )}
        >
          {toast.message}
        </motion.div>
      )}
    </motion.div>
  )
}
