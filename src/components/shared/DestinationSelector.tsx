'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, MapPin, ChevronRight, LocateFixed } from 'lucide-react'
import { COUNTRIES } from '@/lib/localization/countries'
import { getStayCities } from '@/lib/stays/stays-data'
import { useDestinationStore } from '@/stores/destination-store'
import { useCountry } from './CountryProvider'

interface DestinationSelectorProps {
  open: boolean
  onClose: () => void
}

type Step = 'country' | 'city' | 'neighborhood' | 'address'

const NEIGHBORHOODS: Record<string, string[]> = {
  Lagos: ['Ikoyi', 'Lekki', 'Victoria Island', 'Surulere', 'Yaba'],
  Nairobi: ['Westlands', 'Kilimani', 'Kileleshwa', 'Karen', 'Upper Hill'],
  Accra: ['Osu', 'Airport Residential', 'East Legon', 'Cantonments'],
  Johannesburg: ['Sandton', 'Rosebank', 'Melville', 'Braamfontein'],
  'Cape Town': ['City Bowl', 'Sea Point', 'Camps Bay', 'Woodstock'],
  Lilongwe: ['Area 3', 'Area 18', 'Area 43', 'City Centre'],
  Blantyre: ['Namiwawa', 'Limbe', 'Chichiri'],
  Dar: ['Masaki', 'Oyster Bay', 'Kariakoo', 'Mikocheni'],
  'Dar es Salaam': ['Masaki', 'Oyster Bay', 'Kariakoo', 'Mikocheni'],
  Kampala: ['Kololo', 'Muyenga', 'Naguru', 'Bukoto'],
  Kigali: ['Kiyovu', 'Kimihurura', 'Nyarutarama', 'Gisozi'],
  Cairo: ['Zamalek', 'Maadi', 'Nasr City', 'Heliopolis'],
  Paris: ['Le Marais', 'Saint-Germain', 'Montmartre', 'Le Sentier'],
  London: ['Mayfair', 'Shoreditch', 'Notting Hill', 'Soho'],
  Dubai: ['Downtown', 'Marina', 'Jumeirah', 'Deira'],
  'New York': ['Manhattan', 'Brooklyn', 'Queens', 'Bronx'],
}

const countryList = Object.values(COUNTRIES)

export default function DestinationSelector({ open, onClose }: DestinationSelectorProps) {
  const { destination, setDestination } = useDestinationStore()
  const { setCountry } = useCountry()
  const [step, setStep] = useState<Step>('country')
  const [search, setSearch] = useState('')

  const cities = useMemo(
    () => getStayCities(destination.countryCode),
    [destination.countryCode],
  )

  const filteredCountries = useMemo(
    () =>
      countryList.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.nativeName.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  )

  const filteredCities = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return cities
    return cities.filter((c) => c.toLowerCase().includes(q))
  }, [cities, search])

  const selectCountry = (code: string) => {
    setDestination({ countryCode: code, city: '', neighborhood: '', address: '' })
    setStep('city')
    setSearch('')
  }

  const selectCity = (city: string) => {
    setDestination({ city, neighborhood: '', address: '' })
    setStep('neighborhood')
    setSearch('')
  }

  const selectNeighborhood = (neighborhood: string) => {
    setDestination({ neighborhood, address: '' })
    setStep('address')
  }

  const applyAddress = (address: string) => {
    setDestination({ address })
    // Keep the country cookie/storage in sync without redirecting away
    // from the current page — destination changes apply in-place.
    setCountry(destination.countryCode, { navigate: false })
    onClose()
  }

  const reset = () => {
    setStep('country')
    setSearch('')
  }

  const neighborhoods = NEIGHBORHOODS[destination.city] ?? []

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
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[560px] sm:max-h-[82vh] z-[110] bg-white dark:bg-dark-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Set your destination</h2>
                  <p className="text-xs text-text-tertiary">
                    {step === 'country' && 'Choose a country'}
                    {step === 'city' && `Choose a city in ${COUNTRIES[destination.countryCode]?.name}`}
                    {step === 'neighborhood' && `Choose a neighborhood in ${destination.city}`}
                    {step === 'address' && 'Confirm an address or skip'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Breadcrumb */}
            {step !== 'country' && (
              <div className="flex items-center gap-1.5 px-6 pt-4 text-xs text-text-secondary">
                <button onClick={reset} className="hover:text-amber-600 transition-colors">
                  {COUNTRIES[destination.countryCode]?.name}
                </button>
                {destination.city && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <button
                      onClick={() => {
                        setStep('city')
                        setSearch('')
                      }}
                      className="hover:text-amber-600 transition-colors"
                    >
                      {destination.city}
                    </button>
                  </>
                )}
                {destination.neighborhood && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <button
                      onClick={() => {
                        setStep('neighborhood')
                        setSearch('')
                      }}
                      className="hover:text-amber-600 transition-colors"
                    >
                      {destination.neighborhood}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Search */}
            <div className="px-6 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={step === 'country' ? 'Search countries...' : `Search ${step === 'city' ? 'cities' : 'areas'}...`}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {step === 'country' && (
                filteredCountries.length === 0 ? (
                  <Empty label="No countries found" />
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => selectCountry(country.code)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-secondary transition-colors text-left group"
                      >
                        <span className="text-2xl shrink-0">{country.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">{country.name}</p>
                          <p className="text-xs text-text-tertiary truncate">
                            {country.currency.symbol}{country.currency.code}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}
                  </div>
                )
              )}

              {step === 'city' && (
                filteredCities.length === 0 ? (
                  <Empty label="No cities found" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => selectCity(city)}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-secondary transition-colors text-left group"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
                          <MapPin className="w-4 h-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">{city}</p>
                          <p className="text-xs text-text-tertiary">
                            {COUNTRIES[destination.countryCode]?.name}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}
                  </div>
                )
              )}

              {step === 'neighborhood' && (
                neighborhoods.length === 0 ? (
                  <div className="space-y-2">
                    <Empty label="No neighborhood data for this city yet" />
                    <button
                      onClick={() => setStep('address')}
                      className="w-full p-3 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-colors text-sm font-semibold text-text-primary"
                    >
                      Skip — use city only
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {neighborhoods
                      .filter((n) => n.toLowerCase().includes(search.toLowerCase()))
                      .map((neighborhood) => (
                        <button
                          key={neighborhood}
                          onClick={() => selectNeighborhood(neighborhood)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-secondary transition-colors text-left group"
                        >
                          <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                            <LocateFixed className="w-4 h-4" />
                          </span>
                          <p className="flex-1 text-sm font-semibold text-text-primary truncate">{neighborhood}</p>
                          <ChevronRight className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                      ))}
                    <button
                      onClick={() => setStep('address')}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-surface-secondary hover:bg-surface-tertiary transition-colors text-sm font-semibold text-text-primary"
                    >
                      Skip — use {destination.city} only
                    </button>
                  </div>
                )
              )}

              {step === 'address' && (
                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-text-secondary">Street address</span>
                    <input
                      type="text"
                      defaultValue={destination.address || (destination.neighborhood ? `${destination.neighborhood}, ${destination.city}` : destination.city)}
                      placeholder="e.g. 12 Main Road, City Centre"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary placeholder-text-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    />
                  </label>
                  <div className="rounded-xl bg-surface-secondary p-4 text-sm">
                    <p className="font-semibold text-text-primary">
                      📍 {destination.neighborhood || destination.city}, {COUNTRIES[destination.countryCode]?.name}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      Results will be filtered to this destination and priced in{' '}
                      {COUNTRIES[destination.countryCode]?.currency.code}.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => applyAddress(destination.address || destination.neighborhood || destination.city)}
                      className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-amber-950 hover:bg-amber-400 transition-colors"
                    >
                      Apply destination
                    </button>
                    <button
                      onClick={onClose}
                      className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-text-secondary hover:bg-surface-secondary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-border bg-surface-secondary">
              <p className="text-xs text-text-tertiary text-center">
                Your destination and currency follow you across Hotels, Restaurants and Services.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div className="text-center py-8 text-text-tertiary text-sm">
      {label}
    </div>
  )
}

/** Reusable trigger chip: "📍 Lilongwe, Malawi · Change location". */
export function DestinationChip({ onOpen }: { onOpen: () => void }) {
  const destination = useDestinationStore((s) => s.destination)
  const country = COUNTRIES[destination.countryCode]
  const place = destination.neighborhood || destination.city || country?.name

  return (
    <button
      onClick={onOpen}
      className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-500/20 dark:text-amber-400"
    >
      <MapPin className="h-4 w-4" />
      {place}
      {place && <span className="font-normal text-amber-700/60 dark:text-amber-400/60">· Change location</span>}
    </button>
  )
}