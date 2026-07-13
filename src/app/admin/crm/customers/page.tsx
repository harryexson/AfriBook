'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Search, Filter, ChevronDown, ChevronUp, X, Download, Mail,
  Ban, Trash2, ChevronRight, User, ShoppingCart, MessageSquare,
  Clock, FileText, Star, Phone, Globe, Calendar, DollarSign,
  ArrowUpDown, Eye, MoreHorizontal,
} from 'lucide-react'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  country: string
  countryCode: string
  joinDate: string
  totalOrders: number
  lifetimeValue: number
  status: 'active' | 'inactive' | 'suspended'
  lastActive: string
  avatar: string
  orders: { id: string; date: string; amount: number; item: string }[]
  tickets: { id: string; subject: string; status: 'open' | 'resolved' | 'pending'; date: string }[]
  activity: { action: string; time: string; type: string }[]
  notes: string
}

const CUSTOMERS: Customer[] = [
  {
    id: 'CUS-001', name: 'Amina Diallo', email: 'amina.diallo@gmail.com', phone: '+221776543210',
    country: 'Senegal', countryCode: 'SN', joinDate: '2024-03-15', totalOrders: 47,
    lifetimeValue: 2840.50, status: 'active', lastActive: '2026-07-13T08:22:00Z', avatar: 'AD',
    orders: [
      { id: 'ORD-8901', date: '2026-07-10', amount: 85.00, item: 'Dinner for 2 — Savannah Grille' },
      { id: 'ORD-8744', date: '2026-06-28', amount: 120.00, item: 'Full spa treatment — Dakar Wellness' },
      { id: 'ORD-8601', date: '2026-06-15', amount: 45.00, item: 'Hair styling — Chez Awa' },
      { id: 'ORD-8412', date: '2026-05-30', amount: 200.00, item: 'Weekend retreat package' },
    ],
    tickets: [
      { id: 'TKT-4821', subject: 'Billing inquiry for June invoice', status: 'open', date: '2026-07-12' },
    ],
    activity: [
      { action: 'Placed order ORD-8901', time: '2026-07-10T14:30:00Z', type: 'order' },
      { action: 'Left 5-star review', time: '2026-07-10T15:00:00Z', type: 'review' },
      { action: 'Submitted support ticket', time: '2026-07-12T09:15:00Z', type: 'support' },
      { action: 'Updated profile photo', time: '2026-06-28T11:00:00Z', type: 'profile' },
    ],
    notes: 'VIP customer. Prefers French communication. Very engaged — attends platform events.',
  },
  {
    id: 'CUS-002', name: 'Kwame Asante', email: 'kwame.asante@yahoo.com', phone: '+233201234567',
    country: 'Ghana', countryCode: 'GH', joinDate: '2024-01-22', totalOrders: 63,
    lifetimeValue: 4120.75, status: 'active', lastActive: '2026-07-13T07:45:00Z', avatar: 'KA',
    orders: [
      { id: 'ORD-8890', date: '2026-07-12', amount: 150.00, item: 'Corporate lunch — Accra Eats' },
      { id: 'ORD-8756', date: '2026-07-01', amount: 75.00, item: 'Barber appointment — Kings Cut' },
      { id: 'ORD-8623', date: '2026-06-18', amount: 320.00, item: 'Team building event package' },
    ],
    tickets: [],
    activity: [
      { action: 'Placed order ORD-8890', time: '2026-07-12T12:00:00Z', type: 'order' },
      { action: 'Left 5-star review', time: '2026-07-12T13:30:00Z', type: 'review' },
      { action: 'Referred 2 friends', time: '2026-07-01T10:00:00Z', type: 'referral' },
    ],
    notes: 'High-value customer. Business owner — frequently books for his team. Refers other business owners.',
  },
  {
    id: 'CUS-003', name: 'Sarah O\'Brien', email: 'sarah.obrien@outlook.com', phone: '+447912345678',
    country: 'United Kingdom', countryCode: 'GB', joinDate: '2024-06-10', totalOrders: 12,
    lifetimeValue: 580.00, status: 'active', lastActive: '2026-07-12T18:30:00Z', avatar: 'SO',
    orders: [
      { id: 'ORD-8834', date: '2026-07-05', amount: 95.00, item: 'Photography session — Studio London' },
      { id: 'ORD-8501', date: '2026-06-01', amount: 40.00, item: 'Yoga class — Zen Studio' },
    ],
    tickets: [
      { id: 'TKT-4820', subject: 'Request for refund on order ORD-8501', status: 'pending', date: '2026-07-12' },
      { id: 'TKT-4756', subject: 'Question about booking reschedule policy', status: 'resolved', date: '2026-06-20' },
    ],
    activity: [
      { action: 'Submitted support ticket', time: '2026-07-12T16:00:00Z', type: 'support' },
      { action: 'Placed order ORD-8834', time: '2026-07-05T09:00:00Z', type: 'order' },
    ],
    notes: 'International customer. Traveling to West Africa next month — may book more services.',
  },
  {
    id: 'CUS-004', name: 'Chidi Okafor', email: 'chidi.okafor@gmail.com', phone: '+2348031234567',
    country: 'Nigeria', countryCode: 'NG', joinDate: '2023-11-05', totalOrders: 89,
    lifetimeValue: 6230.00, status: 'active', lastActive: '2026-07-13T06:10:00Z', avatar: 'CO',
    orders: [
      { id: 'ORD-8910', date: '2026-07-13', amount: 250.00, item: 'Pro subscription renewal' },
      { id: 'ORD-8800', date: '2026-07-02', amount: 180.00, item: 'Premium event tickets — Lagos Tech Summit' },
      { id: 'ORD-8655', date: '2026-06-20', amount: 95.00, item: 'Haircut — Lagos Hair Studio' },
      { id: 'ORD-8500', date: '2026-06-05', amount: 310.00, item: 'Business workshop — 3 sessions' },
    ],
    tickets: [],
    activity: [
      { action: 'Renewed Pro subscription', time: '2026-07-13T06:00:00Z', type: 'upgrade' },
      { action: 'Placed order ORD-8800', time: '2026-07-02T11:30:00Z', type: 'order' },
      { action: 'Left 4-star review', time: '2026-06-20T16:00:00Z', type: 'review' },
    ],
    notes: 'Power user. Pro subscriber since 2024. Active in Lagos business community.',
  },
  {
    id: 'CUS-005', name: 'Fatima Hassan', email: 'fatima.h@proton.me', phone: '+254712345678',
    country: 'Kenya', countryCode: 'KE', joinDate: '2024-09-18', totalOrders: 28,
    lifetimeValue: 1540.25, status: 'active', lastActive: '2026-07-13T05:50:00Z', avatar: 'FH',
    orders: [
      { id: 'ORD-8895', date: '2026-07-11', amount: 65.00, item: 'Meal prep service — Nairobi Kitchen' },
      { id: 'ORD-8730', date: '2026-06-25', amount: 110.00, item: 'Fitness membership — Nairobi Fit Hub' },
      { id: 'ORD-8600', date: '2026-06-10', amount: 40.00, item: 'Manicure & pedicure — Glam Nails' },
    ],
    tickets: [
      { id: 'TKT-4815', subject: 'Unable to apply promo code', status: 'resolved', date: '2026-07-11' },
    ],
    activity: [
      { action: 'Placed order ORD-8895', time: '2026-07-11T10:00:00Z', type: 'order' },
      { action: 'Referred friend Amina', time: '2026-07-05T14:00:00Z', type: 'referral' },
      { action: 'Referred friend Zainab', time: '2026-06-30T09:00:00Z', type: 'referral' },
      { action: 'Referred friend Halima', time: '2026-06-22T11:00:00Z', type: 'referral' },
    ],
    notes: 'Top referrer — 3 successful referrals this month. Active on social media.',
  },
  {
    id: 'CUS-006', name: 'James Mwangi', email: 'j.mwangi@gmail.com', phone: '+254723456789',
    country: 'Kenya', countryCode: 'KE', joinDate: '2023-08-12', totalOrders: 41,
    lifetimeValue: 2190.00, status: 'inactive', lastActive: '2026-06-10T14:20:00Z', avatar: 'JM',
    orders: [
      { id: 'ORD-8420', date: '2026-06-01', amount: 55.00, item: 'Car wash — Clean Ride Nairobi' },
      { id: 'ORD-8200', date: '2026-05-15', amount: 120.00, item: 'Weekend safari package' },
    ],
    tickets: [
      { id: 'TKT-4789', subject: 'Cancelled subscription — reason: too expensive', status: 'resolved', date: '2026-06-10' },
    ],
    activity: [
      { action: 'Cancelled subscription', time: '2026-06-10T14:00:00Z', type: 'churn' },
      { action: 'Placed order ORD-8420', time: '2026-06-01T08:00:00Z', type: 'order' },
    ],
    notes: 'Churned — cited pricing. Consider sending win-back offer with discount.',
  },
  {
    id: 'CUS-007', name: 'Ngozi Eze', email: 'ngozi.eze@outlook.com', phone: '+2348167890123',
    country: 'Nigeria', countryCode: 'NG', joinDate: '2024-02-28', totalOrders: 55,
    lifetimeValue: 3870.50, status: 'active', lastActive: '2026-07-12T20:15:00Z', avatar: 'NE',
    orders: [
      { id: 'ORD-8878', date: '2026-07-08', amount: 200.00, item: 'Full treatment — Lagos Hair Studio' },
      { id: 'ORD-8720', date: '2026-06-22', amount: 85.00, item: 'Dinner reservation — Buka Lagos' },
      { id: 'ORD-8590', date: '2026-06-08', amount: 150.00, item: 'Gym membership — FitNaija' },
    ],
    tickets: [],
    activity: [
      { action: 'Placed order ORD-8878', time: '2026-07-08T15:00:00Z', type: 'order' },
      { action: 'Left 5-star review', time: '2026-07-08T16:30:00Z', type: 'review' },
    ],
    notes: 'Loyal customer. Prefers booking via mobile app. Responds well to push notifications.',
  },
  {
    id: 'CUS-008', name: 'Ethan Brooks', email: 'ethan.brooks@gmail.com', phone: '+14155551234',
    country: 'United States', countryCode: 'US', joinDate: '2025-01-14', totalOrders: 8,
    lifetimeValue: 320.00, status: 'active', lastActive: '2026-07-11T22:00:00Z', avatar: 'EB',
    orders: [
      { id: 'ORD-8845', date: '2026-07-06', amount: 60.00, item: 'Online consultation — Tech Tutor' },
      { id: 'ORD-8600', date: '2026-06-12', amount: 45.00, item: 'Language lesson — Swahili 101' },
    ],
    tickets: [],
    activity: [
      { action: 'Placed order ORD-8845', time: '2026-07-06T18:00:00Z', type: 'order' },
      { action: 'Verified email', time: '2025-01-14T10:00:00Z', type: 'signup' },
    ],
    notes: 'International user based in SF. Interested in African culture and services.',
  },
  {
    id: 'CUS-009', name: 'Aisha Mohammed', email: 'aisha.mohammed@hotmail.com', phone: '+2349023456789',
    country: 'Nigeria', countryCode: 'NG', joinDate: '2024-07-03', totalOrders: 19,
    lifetimeValue: 980.75, status: 'active', lastActive: '2026-07-12T15:40:00Z', avatar: 'AM',
    orders: [
      { id: 'ORD-8860', date: '2026-07-09', amount: 45.00, item: 'Tailoring — Aso Oke Boutique' },
      { id: 'ORD-8700', date: '2026-06-20', amount: 80.00, item: 'Bridal makeup trial' },
    ],
    tickets: [
      { id: 'TKT-4818', subject: 'Refund request for order ORD-8600', status: 'open', date: '2026-07-12' },
    ],
    activity: [
      { action: 'Submitted refund request', time: '2026-07-12T15:30:00Z', type: 'support' },
      { action: 'Placed order ORD-8860', time: '2026-07-09T11:00:00Z', type: 'order' },
    ],
    notes: 'Pending refund of $45. Escalate if not resolved by end of week.',
  },
  {
    id: 'CUS-010', name: 'Tendai Moyo', email: 'tendai.moyo@gmail.com', phone: '+263771234567',
    country: 'Zimbabwe', countryCode: 'ZW', joinDate: '2024-04-20', totalOrders: 33,
    lifetimeValue: 1720.00, status: 'active', lastActive: '2026-07-13T04:30:00Z', avatar: 'TM',
    orders: [
      { id: 'ORD-8888', date: '2026-07-11', amount: 90.00, item: 'Monthly gym pass — Harare Fitness' },
      { id: 'ORD-8710', date: '2026-06-24', amount: 140.00, item: 'Team lunch — The Grill House' },
    ],
    tickets: [],
    activity: [
      { action: 'Placed order ORD-8888', time: '2026-07-11T07:00:00Z', type: 'order' },
      { action: 'Left 4-star review', time: '2026-07-11T08:00:00Z', type: 'review' },
    ],
    notes: 'Consistent monthly spender. Gym enthusiast — upsell annual membership.',
  },
  {
    id: 'CUS-011', name: 'Priya Sharma', email: 'priya.sharma@gmail.com', phone: '+12025551987',
    country: 'United States', countryCode: 'US', joinDate: '2025-03-08', totalOrders: 5,
    lifetimeValue: 210.00, status: 'inactive', lastActive: '2026-05-20T12:00:00Z', avatar: 'PS',
    orders: [
      { id: 'ORD-8350', date: '2026-05-15', amount: 50.00, item: 'Virtual cooking class — West African Cuisine' },
      { id: 'ORD-8100', date: '2026-04-10', amount: 35.00, item: 'Online drum lesson' },
    ],
    tickets: [
      { id: 'TKT-4700', subject: 'How to cancel recurring booking', status: 'resolved', date: '2026-05-20' },
    ],
    activity: [
      { action: 'Cancelled recurring booking', time: '2026-05-20T11:00:00Z', type: 'churn' },
      { action: 'Placed order ORD-8350', time: '2026-05-15T14:00:00Z', type: 'order' },
    ],
    notes: 'Low engagement. Only used online services. Send re-engagement email with free class offer.',
  },
  {
    id: 'CUS-012', name: 'Olumide Adeyemi', email: 'olumide.adeyemi@yahoo.com', phone: '+2348056789012',
    country: 'Nigeria', countryCode: 'NG', joinDate: '2023-12-01', totalOrders: 72,
    lifetimeValue: 5100.25, status: 'active', lastActive: '2026-07-12T21:00:00Z', avatar: 'OA',
    orders: [
      { id: 'ORD-8905', date: '2026-07-12', amount: 175.00, item: 'Birthday party venue — The Garden Lagos' },
      { id: 'ORD-8780', date: '2026-07-03', amount: 90.00, item: 'Haircut & grooming — Gentleman\'s Den' },
      { id: 'ORD-8650', date: '2026-06-18', amount: 280.00, item: 'Catering for 20 — Buka Express' },
    ],
    tickets: [],
    activity: [
      { action: 'Placed order ORD-8905', time: '2026-07-12T17:00:00Z', type: 'order' },
      { action: 'Left 5-star review', time: '2026-07-12T18:30:00Z', type: 'review' },
      { action: 'Referred 1 friend', time: '2026-07-03T09:00:00Z', type: 'referral' },
    ],
    notes: 'Enterprise-adjacent. Books for large groups. Consider enterprise account upgrade.',
  },
  {
    id: 'CUS-013', name: 'Zainab Al-Rashid', email: 'zainab.rashid@outlook.com', phone: '+971501234567',
    country: 'United Arab Emirates', countryCode: 'AE', joinDate: '2024-11-12', totalOrders: 15,
    lifetimeValue: 890.00, status: 'active', lastActive: '2026-07-11T13:20:00Z', avatar: 'ZR',
    orders: [
      { id: 'ORD-8840', date: '2026-07-07', amount: 120.00, item: 'Virtual wellness consultation' },
      { id: 'ORD-8690', date: '2026-06-22', amount: 85.00, item: 'Artisan craft delivery — 3 items' },
    ],
    tickets: [],
    activity: [
      { action: 'Placed order ORD-8840', time: '2026-07-07T10:00:00Z', type: 'order' },
    ],
    notes: 'Diaspora customer. High interest in African artisan products. Good candidate for gift bundles.',
  },
  {
    id: 'CUS-014', name: 'Samuel Kiprop', email: 'samuel.kiprop@gmail.com', phone: '+254734567890',
    country: 'Kenya', countryCode: 'KE', joinDate: '2025-02-05', totalOrders: 22,
    lifetimeValue: 1340.50, status: 'suspended', lastActive: '2026-06-28T09:00:00Z', avatar: 'SK',
    orders: [
      { id: 'ORD-8680', date: '2026-06-25', amount: 60.00, item: 'Mobile phone repair — TechFix Nairobi' },
      { id: 'ORD-8500', date: '2026-06-05', amount: 100.00, item: 'Event tickets — Nairobi Comedy Night' },
    ],
    tickets: [
      { id: 'TKT-4800', subject: 'Account suspended — suspicious activity', status: 'open', date: '2026-06-28' },
    ],
    activity: [
      { action: 'Account suspended', time: '2026-06-28T09:00:00Z', type: 'suspension' },
      { action: 'Placed order ORD-8680', time: '2026-06-25T14:00:00Z', type: 'order' },
    ],
    notes: 'Suspended for suspicious login activity. Awaiting identity verification.',
  },
  {
    id: 'CUS-015', name: 'Grace Mensah', email: 'grace.mensah@gmail.com', phone: '+233245678901',
    country: 'Ghana', countryCode: 'GH', joinDate: '2024-08-22', totalOrders: 37,
    lifetimeValue: 2450.75, status: 'active', lastActive: '2026-07-12T17:45:00Z', avatar: 'GM',
    orders: [
      { id: 'ORD-8870', date: '2026-07-10', amount: 75.00, item: 'Full body massage — Accra Spa' },
      { id: 'ORD-8705', date: '2026-06-21', amount: 130.00, item: 'Catering — traditional Ghanaian feast' },
      { id: 'ORD-8555', date: '2026-06-01', amount: 50.00, item: 'Fitness class — 10 sessions' },
    ],
    tickets: [],
    activity: [
      { action: 'Placed order ORD-8870', time: '2026-07-10T11:00:00Z', type: 'order' },
      { action: 'Left 5-star review', time: '2026-07-10T12:00:00Z', type: 'review' },
    ],
    notes: 'Wellness enthusiast. Books spa and fitness regularly. Upsell annual wellness package.',
  },
  {
    id: 'CUS-016', name: 'David Ochieng', email: 'david.ochieng@yahoo.com', phone: '+254745678901',
    country: 'Kenya', countryCode: 'KE', joinDate: '2023-06-15', totalOrders: 94,
    lifetimeValue: 7820.00, status: 'active', lastActive: '2026-07-13T09:00:00Z', avatar: 'DO',
    orders: [
      { id: 'ORD-8915', date: '2026-07-13', amount: 350.00, item: 'Enterprise catering — Nairobi Tech Hub launch' },
      { id: 'ORD-8850', date: '2026-07-08', amount: 200.00, item: 'Photography & videography package' },
      { id: 'ORD-8720', date: '2026-06-25', amount: 125.00, item: 'Team dinner — Carnivore Nairobi' },
    ],
    tickets: [],
    activity: [
      { action: 'Placed order ORD-8915', time: '2026-07-13T08:30:00Z', type: 'order' },
      { action: 'Left 5-star review', time: '2026-07-13T09:00:00Z', type: 'review' },
    ],
    notes: 'Highest LTV customer. Corporate accounts manager. Priority support — VIP treatment.',
  },
  {
    id: 'CUS-017', name: 'Abena Boateng', email: 'abena.boateng@gmail.com', phone: '+233501234567',
    country: 'Ghana', countryCode: 'GH', joinDate: '2025-05-10', totalOrders: 9,
    lifetimeValue: 420.00, status: 'inactive', lastActive: '2026-05-30T16:00:00Z', avatar: 'AB',
    orders: [
      { id: 'ORD-8380', date: '2026-05-25', amount: 55.00, item: 'Hair braiding — Kinky Crown' },
      { id: 'ORD-8200', date: '2026-05-01', amount: 30.00, item: 'Smoothie subscription — Fresh Start' },
    ],
    tickets: [
      { id: 'TKT-4720', subject: 'Service was below expectations', status: 'resolved', date: '2026-05-30' },
    ],
    activity: [
      { action: 'Completed support ticket', time: '2026-05-30T15:00:00Z', type: 'support' },
      { action: 'Placed order ORD-8380', time: '2026-05-25T10:00:00Z', type: 'order' },
    ],
    notes: 'Had a bad experience. Customer service issued full refund. Needs re-engagement outreach.',
  },
  {
    id: 'CUS-018', name: 'Michael Adekunle', email: 'michael.adekunle@outlook.com', phone: '+2348187654321',
    country: 'Nigeria', countryCode: 'NG', joinDate: '2024-05-01', totalOrders: 31,
    lifetimeValue: 1890.25, status: 'active', lastActive: '2026-07-11T19:30:00Z', avatar: 'MA',
    orders: [
      { id: 'ORD-8855', date: '2026-07-09', amount: 80.00, item: 'Barber session — Fade Nation Lagos' },
      { id: 'ORD-8700', date: '2026-06-20', amount: 150.00, item: 'Concert tickets — Afrobeats Night' },
    ],
    tickets: [],
    activity: [
      { action: 'Placed order ORD-8855', time: '2026-07-09T13:00:00Z', type: 'order' },
      { action: 'Left 4-star review', time: '2026-07-09T14:00:00Z', type: 'review' },
    ],
    notes: 'Regular customer. Active in Lagos nightlife scene. Good for event promotions.',
  },
]

const COUNTRIES = [...new Set(CUSTOMERS.map((c) => c.country))].sort()
const STATUSES: Customer['status'][] = ['active', 'inactive', 'suspended']

type SortKey = keyof Customer
type SortDir = 'asc' | 'desc'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'bg-surface-secondary text-text-secondary',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const TICKET_STATUS: Record<string, string> = {
  open: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [clvMin, setClvMin] = useState('')
  const [clvMax, setClvMax] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [drawerCustomer, setDrawerCustomer] = useState<Customer | null>(null)
  const [drawerTab, setDrawerTab] = useState<'profile' | 'orders' | 'tickets' | 'activity' | 'notes'>('profile')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)))
    }
  }

  const filtered = useMemo(() => {
    let result = [...CUSTOMERS]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q)
      )
    }
    if (countryFilter) result = result.filter((c) => c.country === countryFilter)
    if (statusFilter) result = result.filter((c) => c.status === statusFilter)
    if (dateFrom) result = result.filter((c) => c.joinDate >= dateFrom)
    if (dateTo) result = result.filter((c) => c.joinDate <= dateTo)
    if (clvMin) result = result.filter((c) => c.lifetimeValue >= parseFloat(clvMin))
    if (clvMax) result = result.filter((c) => c.lifetimeValue <= parseFloat(clvMax))

    result.sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })

    return result
  }, [search, countryFilter, statusFilter, dateFrom, dateTo, clvMin, clvMax, sortKey, sortDir])

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-text-tertiary" />
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-amber-500" /> : <ChevronDown className="w-3 h-3 text-amber-500" />
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Customer List</h1>
        <p className="text-sm text-text-secondary mt-1">Manage, search, and segment your customer base.</p>
      </motion.div>

      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                showFilters ? 'bg-amber-500 text-white border-amber-500' : 'bg-surface-secondary border-border text-text-secondary hover:text-text-primary'
              )}
            >
              <Filter className="w-4 h-4" /> Filters
              {(countryFilter || statusFilter || dateFrom || dateTo || clvMin || clvMax) && (
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
            <button
              onClick={() => showToast('Export started — check your email.')}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pb-4 border-b border-border">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Country</label>
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="">All countries</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="">All statuses</option>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Joined from</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Joined to</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">CLV range ($)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={clvMin}
                      onChange={(e) => setClvMin(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={clvMax}
                      onChange={(e) => setClvMax(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3">
                <button
                  onClick={() => { setCountryFilter(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); setClvMin(''); setClvMax('') }}
                  className="text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors"
                >
                  Clear all filters
                </button>
                <span className="text-xs text-text-tertiary">{filtered.length} results</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-3 py-3 border-b border-border"
          >
            <span className="text-sm text-text-secondary">{selectedIds.size} selected</span>
            <button
              onClick={() => showToast(`Exported ${selectedIds.size} customers.`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <Download className="w-3 h-3" /> Export
            </button>
            <button
              onClick={() => showToast(`Email queued for ${selectedIds.size} customers.`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <Mail className="w-3 h-3" /> Send Email
            </button>
            <button
              onClick={() => showToast(`${selectedIds.size} customers suspended.`, 'error')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <Ban className="w-3 h-3" /> Suspend
            </button>
            <button
              onClick={() => showToast(`${selectedIds.size} customers deleted.`, 'error')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary border border-border text-xs font-medium text-red-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </motion.div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="pb-3 pr-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-border accent-amber-500"
                  />
                </th>
                {([
                  { key: 'name' as SortKey, label: 'Name' },
                  { key: 'email' as SortKey, label: 'Email' },
                  { key: 'phone' as SortKey, label: 'Phone' },
                  { key: 'country' as SortKey, label: 'Country' },
                  { key: 'joinDate' as SortKey, label: 'Join Date' },
                  { key: 'totalOrders' as SortKey, label: 'Orders' },
                  { key: 'lifetimeValue' as SortKey, label: 'CLV' },
                  { key: 'status' as SortKey, label: 'Status' },
                  { key: 'lastActive' as SortKey, label: 'Last Active' },
                ]).map(({ key, label }) => (
                  <th
                    key={key}
                    className="text-left text-xs font-medium text-text-secondary uppercase tracking-wider pb-3 cursor-pointer select-none hover:text-text-primary transition-colors"
                    onClick={() => handleSort(key)}
                  >
                    <div className="flex items-center gap-1">
                      {label} <SortIcon col={key} />
                    </div>
                  </th>
                ))}
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-surface-secondary/50 transition-colors cursor-pointer"
                  onClick={() => { setDrawerCustomer(customer); setDrawerTab('profile') }}
                >
                  <td className="py-3 pr-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(customer.id)}
                      onChange={() => toggleSelect(customer.id)}
                      className="w-4 h-4 rounded border-border accent-amber-500"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {customer.avatar}
                      </div>
                      <span className="text-sm font-medium text-text-primary whitespace-nowrap">{customer.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-text-secondary whitespace-nowrap">{customer.email}</td>
                  <td className="py-3 pr-4 text-sm text-text-secondary whitespace-nowrap">{customer.phone}</td>
                  <td className="py-3 pr-4 text-sm text-text-secondary whitespace-nowrap">{customer.country}</td>
                  <td className="py-3 pr-4 text-sm text-text-secondary whitespace-nowrap">{new Date(customer.joinDate).toLocaleDateString()}</td>
                  <td className="py-3 pr-4 text-sm font-medium text-text-primary text-right">{customer.totalOrders}</td>
                  <td className="py-3 pr-4 text-sm font-semibold text-text-primary text-right">${customer.lifetimeValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 pr-4">
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_STYLES[customer.status])}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-sm text-text-secondary whitespace-nowrap">
                    {new Date(customer.lastActive).toLocaleDateString()}
                  </td>
                  <td className="py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setDrawerCustomer(customer); setDrawerTab('profile') }}
                      className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
                    >
                      <Eye className="w-4 h-4 text-text-tertiary" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-sm text-text-tertiary">
                    No customers match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <span className="text-xs text-text-tertiary">Showing {filtered.length} of {CUSTOMERS.length} customers</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {drawerCustomer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setDrawerCustomer(null)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-surface border-l border-border z-50 overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-lg font-bold">
                      {drawerCustomer.avatar}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-text-primary">{drawerCustomer.name}</h2>
                      <p className="text-sm text-text-secondary">{drawerCustomer.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDrawerCustomer(null)}
                    className="p-2 rounded-xl hover:bg-surface-secondary transition-colors"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                <div className="flex gap-1 bg-surface-secondary rounded-xl p-1 overflow-x-auto">
                  {(['profile', 'orders', 'tickets', 'activity', 'notes'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setDrawerTab(tab)}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                        drawerTab === tab ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                      )}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {drawerTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { icon: Phone, label: 'Phone', value: drawerCustomer.phone },
                        { icon: Globe, label: 'Country', value: drawerCustomer.country },
                        { icon: Calendar, label: 'Joined', value: new Date(drawerCustomer.joinDate).toLocaleDateString() },
                        { icon: DollarSign, label: 'Lifetime Value', value: `$${drawerCustomer.lifetimeValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                        { icon: ShoppingCart, label: 'Total Orders', value: drawerCustomer.totalOrders.toString() },
                        { icon: Clock, label: 'Last Active', value: new Date(drawerCustomer.lastActive).toLocaleDateString() },
                      ].map((item) => {
                        const Icon = item.icon
                        return (
                          <div key={item.label} className="p-3 rounded-xl bg-surface-secondary">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-3.5 h-3.5 text-text-tertiary" />
                              <span className="text-xs text-text-tertiary">{item.label}</span>
                            </div>
                            <p className="text-sm font-medium text-text-primary">{item.value}</p>
                          </div>
                        )
                      })}
                    </div>
                    <div className="p-3 rounded-xl bg-surface-secondary">
                      <span className="text-xs text-text-tertiary block mb-1">Status</span>
                      <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize', STATUS_STYLES[drawerCustomer.status])}>
                        {drawerCustomer.status}
                      </span>
                    </div>
                  </div>
                )}

                {drawerTab === 'orders' && (
                  <div className="space-y-3">
                    {drawerCustomer.orders.map((order) => (
                      <div key={order.id} className="p-4 rounded-xl bg-surface-secondary">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text-primary">{order.id}</span>
                          <span className="text-sm font-semibold text-text-primary">${order.amount.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-text-secondary">{order.item}</p>
                        <p className="text-xs text-text-tertiary mt-1">{new Date(order.date).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {drawerCustomer.orders.length === 0 && (
                      <p className="text-sm text-text-tertiary text-center py-8">No orders found.</p>
                    )}
                  </div>
                )}

                {drawerTab === 'tickets' && (
                  <div className="space-y-3">
                    {drawerCustomer.tickets.map((ticket) => (
                      <div key={ticket.id} className="p-4 rounded-xl bg-surface-secondary">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text-primary">{ticket.id}</span>
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', TICKET_STATUS[ticket.status])}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary">{ticket.subject}</p>
                        <p className="text-xs text-text-tertiary mt-1">{new Date(ticket.date).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {drawerCustomer.tickets.length === 0 && (
                      <p className="text-sm text-text-tertiary text-center py-8">No support tickets.</p>
                    )}
                  </div>
                )}

                {drawerTab === 'activity' && (
                  <div className="space-y-3">
                    {drawerCustomer.activity.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-secondary/50">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-text-primary">{item.action}</p>
                          <p className="text-xs text-text-tertiary mt-0.5">{new Date(item.time).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {drawerTab === 'notes' && (
                  <div className="p-4 rounded-xl bg-surface-secondary min-h-[200px]">
                    <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                      {drawerCustomer.notes || 'No notes for this customer.'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
