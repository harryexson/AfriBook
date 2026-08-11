'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Country, PaymentMethod } from '@/types'
import { Save, Globe, DollarSign, Percent, Phone, Clock } from 'lucide-react'
import * as Switch from '@radix-ui/react-switch'

interface CountryEditorProps {
  country: Country
  onSave?: (country: Country) => void
  loading?: boolean
}

const MOCK_COUNTRIES: Country[] = [
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', currency: { code: 'XAF', symbol: 'FCFA', name: 'CFA Franc BEAC', exchangeRate: 1 }, language: { code: 'en', name: 'English', nativeName: 'English', isRTL: false }, timezone: 'Africa/Douala', phoneFormat: '+237 XXXXXXXXX', paymentMethods: ['mobile_money', 'card', 'cash'], minimumFeeFloor: 500, taxRate: 0.1925, legalTerms: 'Cameroon Terms' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', exchangeRate: 1.65 }, language: { code: 'en', name: 'English', nativeName: 'English', isRTL: false }, timezone: 'Africa/Lagos', phoneFormat: '+234 XXXXXXXXX', paymentMethods: ['mobile_money', 'card', 'bank_transfer', 'cash'], minimumFeeFloor: 200, taxRate: 0.075, legalTerms: 'Nigeria Terms' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', exchangeRate: 0.78 }, language: { code: 'en', name: 'English', nativeName: 'English', isRTL: false }, timezone: 'Africa/Nairobi', phoneFormat: '+254 XXXXXXXXX', paymentMethods: ['mobile_money', 'card', 'cash'], minimumFeeFloor: 100, taxRate: 0.16, legalTerms: 'Kenya Terms' },
]

const ALL_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'card', label: 'Card' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'wallet', label: 'Wallet' },
]

export default function CountryEditor({ country: initial, onSave, loading }: CountryEditorProps) {
  const [country, setCountry] = useState<Country>(initial)
  const [selectedCode, setSelectedCode] = useState(initial.code)
  const [saving, setSaving] = useState(false)

  const countries = MOCK_COUNTRIES

  const current = countries.find((c) => c.code === selectedCode) ?? country

  const updateField = <K extends keyof Country>(key: K, value: Country[K]) => {
    setCountry((prev) => ({ ...prev, [key]: value }))
  }

  const togglePaymentMethod = (method: PaymentMethod) => {
    const methods = current.paymentMethods.includes(method)
      ? current.paymentMethods.filter((m) => m !== method)
      : [...current.paymentMethods, method]
    setCountry((prev) => ({ ...prev, paymentMethods: methods }))
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 1000))
    onSave?.(current)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-surface border border-border p-6 animate-pulse space-y-4">
        <div className="w-48 h-6 rounded bg-surface-secondary" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 rounded-xl bg-surface-secondary" />
          <div className="h-24 rounded-xl bg-surface-secondary" />
          <div className="h-24 rounded-xl bg-surface-secondary" />
          <div className="h-24 rounded-xl bg-surface-secondary" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-surface border border-border">
      {/* Country selector tabs */}
      <div className="flex items-center gap-2 p-4 border-b border-border overflow-x-auto">
        {countries.map((c) => (
          <button
            key={c.code}
            onClick={() => { setSelectedCode(c.code); setCountry(c) }}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
              selectedCode === c.code
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary border border-transparent'
            )}
          >
            <span className="text-base">{c.flag}</span>
            <span>{c.name}</span>
            <span className="text-xs text-text-tertiary">{c.code}</span>
          </button>
        ))}
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-3xl shrink-0">
            {current.flag}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary font-heading">{current.name}</h3>
            <p className="text-sm text-text-secondary">{current.code} &middot; {current.timezone}</p>
          </div>
        </div>

        {/* Currency */}
        <div className="p-4 rounded-xl bg-surface-secondary">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-text-tertiary" />
            <h4 className="text-sm font-semibold text-text-primary">Currency</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-text-tertiary">Code</label>
              <input
                type="text" value={current.currency.code}
                onChange={(e) => updateField('currency', { ...current.currency, code: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
            <div>
              <label className="text-xs text-text-tertiary">Symbol</label>
              <input
                type="text" value={current.currency.symbol}
                onChange={(e) => updateField('currency', { ...current.currency, symbol: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
            <div>
              <label className="text-xs text-text-tertiary">Exchange Rate</label>
              <input
                type="number" step="0.01" value={current.currency.exchangeRate}
                onChange={(e) => updateField('currency', { ...current.currency, exchangeRate: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>
        </div>

        {/* Fees & Tax */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-surface-secondary">
            <div className="flex items-center gap-2 mb-3">
              <Percent className="w-4 h-4 text-text-tertiary" />
              <h4 className="text-sm font-semibold text-text-primary">Fee Floor</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary text-sm">{current.currency.symbol}</span>
              <input
                type="number" value={current.minimumFeeFloor}
                onChange={(e) => updateField('minimumFeeFloor', parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface-secondary">
            <div className="flex items-center gap-2 mb-3">
              <Percent className="w-4 h-4 text-text-tertiary" />
              <h4 className="text-sm font-semibold text-text-primary">Tax Rate</h4>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number" step="0.001" value={current.taxRate * 100}
                onChange={(e) => updateField('taxRate', (parseFloat(e.target.value) || 0) / 100)}
                className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <span className="text-text-tertiary text-sm">%</span>
            </div>
          </div>
        </div>

        {/* Payment methods */}
        <div className="p-4 rounded-xl bg-surface-secondary">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-text-tertiary" />
            <h4 className="text-sm font-semibold text-text-primary">Payment Methods</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ALL_METHODS.map((method) => (
              <label key={method.value} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border cursor-pointer hover:border-amber-500/20 transition-colors">
                <span className="text-sm text-text-primary capitalize">{method.label}</span>
                <Switch.Root
                  checked={current.paymentMethods.includes(method.value)}
                  onCheckedChange={() => togglePaymentMethod(method.value)}
                  className="w-9 h-5 rounded-full bg-surface-tertiary data-[state=checked]:bg-amber-500 relative outline-none transition-colors"
                >
                  <Switch.Thumb className="block w-3.5 h-3.5 bg-white rounded-full shadow-sm translate-x-0.5 data-[state=checked]:translate-x-[18px] transition-transform" />
                </Switch.Root>
              </label>
            ))}
          </div>
        </div>

        {/* Subdomain & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-surface-secondary">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-text-tertiary" />
              <h4 className="text-sm font-semibold text-text-primary">Subdomain</h4>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text" value={current.code.toLowerCase()}
                className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <span className="text-text-tertiary text-sm">.afribook.com</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface-secondary">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="w-4 h-4 text-text-tertiary" />
              <h4 className="text-sm font-semibold text-text-primary">Phone Format</h4>
            </div>
            <input value={current.phoneFormat}
              onChange={(e) => updateField('phoneFormat', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
          </div>
        </div>

        {/* Language & Timezone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-surface-secondary">
            <h4 className="text-sm font-semibold text-text-primary mb-1">Language</h4>
            <select value={current.language.code}
              onChange={(e) => updateField('language', { ...current.language, code: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30">
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="pt">Portuguese</option>
              <option value="sw">Swahili</option>
            </select>
          </div>
          <div className="p-4 rounded-xl bg-surface-secondary">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-text-tertiary" />
              <h4 className="text-sm font-semibold text-text-primary">Timezone</h4>
            </div>
            <select value={current.timezone}
              onChange={(e) => updateField('timezone', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30">
              <option value="Africa/Douala">Africa/Douala</option>
              <option value="Africa/Lagos">Africa/Lagos</option>
              <option value="Africa/Nairobi">Africa/Nairobi</option>
              <option value="Africa/Johannesburg">Africa/Johannesburg</option>
              <option value="Africa/Accra">Africa/Accra</option>
              <option value="Africa/Dar_es_Salaam">Africa/Dar es Salaam</option>
              <option value="Africa/Kigali">Africa/Kigali</option>
              <option value="Africa/Kampala">Africa/Kampala</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Configuration
        </button>
      </div>
    </div>
  )
}
