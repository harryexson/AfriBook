'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Globe, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COUNTRIES } from '@/lib/localization/countries'
import type { CountryConfig } from '@/lib/localization/countries'

interface CountrySelectorProps {
  open: boolean
  onClose: () => void
}

const countryList = Object.values(COUNTRIES)

export default function CountrySelector({ open, onClose }: CountrySelectorProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () =>
      countryList.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.nativeName.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  )

  const handleSelect = (country: CountryConfig) => {
    window.location.href = `https://${country.domain}`
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[600px] sm:max-h-[80vh] z-[110] bg-white dark:bg-dark-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-text-primary">Select your country</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search countries..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Country grid */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-text-tertiary text-sm">
                  No countries found matching "{search}"
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filtered.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleSelect(country)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-secondary transition-colors text-left group"
                    >
                      <span className="text-2xl shrink-0">{country.flag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {country.name}
                        </p>
                        <p className="text-xs text-text-tertiary truncate">
                          {country.currency.symbol}{country.currency.code} &middot; {country.language.nativeName}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer info */}
            <div className="px-6 py-3 border-t border-border bg-surface-secondary">
              <p className="text-xs text-text-tertiary text-center">
                You'll be redirected to the country-specific experience
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
