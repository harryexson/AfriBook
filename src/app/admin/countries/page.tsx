'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'
import type { Country } from '@/types'
import AdminStatCard from '@/components/admin/StatCard'
import CountryEditor from '@/components/admin/CountryEditor'
import { Globe, DollarSign, Percent, TrendingUp } from 'lucide-react'

const CONTAINER = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } } }

const MOCK_FIRST_COUNTRY: Country = {
  code: 'CM', name: 'Cameroon', flag: '🇨🇲',
  currency: { code: 'XAF', symbol: 'FCFA', name: 'CFA Franc BEAC', exchangeRate: 1 },
  language: { code: 'en', name: 'English', nativeName: 'English', isRTL: false },
  timezone: 'Africa/Douala', phoneFormat: '+237 XXXXXXXXX',
  paymentMethods: ['mobile_money', 'card', 'cash'],
  minimumFeeFloor: 500, taxRate: 0.1925, legalTerms: 'Cameroon Terms',
}

export default function AdminCountriesPage() {
  const [toast, setToast] = useState<{ message: string } | null>(null)

  const handleSave = (country: Country) => {
    setToast({ message: `${country.name} configuration saved` })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM}>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Country Configuration</h1>
        <p className="text-sm text-text-secondary mt-1">Manage country-specific settings, fees, taxes, and payment methods.</p>
      </motion.div>

      <motion.div variants={ITEM} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Active Countries" value="16" icon={Globe} change={0} accent="bg-blue-500" />
        <AdminStatCard label="Avg Fee Floor" value={formatCurrency(350, 'XAF')} icon={DollarSign} change={0} accent="bg-amber-500" />
        <AdminStatCard label="Avg Tax Rate" value="14.2%" icon={Percent} change={0} accent="bg-purple-500" />
        <AdminStatCard label="Top Currency" value="XAF" icon={TrendingUp} change={0} accent="bg-emerald-500" />
      </motion.div>

      <motion.div variants={ITEM}>
        <CountryEditor country={MOCK_FIRST_COUNTRY} onSave={handleSave} />
      </motion.div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium bg-emerald-500 text-white"
        >
          {toast.message}
        </motion.div>
      )}
    </motion.div>
  )
}
