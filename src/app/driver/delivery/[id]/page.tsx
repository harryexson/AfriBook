'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Navigation, Phone, Store, User } from 'lucide-react'
import DeliveryProgress from '@/components/driver/DeliveryProgress'
import PickupVerification from '@/components/driver/PickupVerification'
import ItemVerification from '@/components/driver/ItemVerification'
import PhotoCapture from '@/components/driver/PhotoCapture'
import SOSButton from '@/components/driver/SOSButton'
import type { DeliveryStep } from '@/components/driver/DeliveryProgress'
import { useCountry } from '@/components/shared/CountryProvider'
import { formatMoneySymbol, getCurrencyForCountry } from '@/lib/money'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

const MOCK_DELIVERY = {
  id: 'del-1',
  orderId: 'ord-1',
  vendorName: 'Chioma\'s Kitchen',
  vendorAddress: '15B Admiralty Way, Lekki Phase 1',
  vendorPhone: '+234 801 234 5678',
  customerName: 'Emeka Okafor',
  customerAddress: '42 Awolowo Road, Ikoyi',
  customerPhone: '+234 802 345 6789',
  items: [
    { id: 'p1', name: 'Jollof Rice Family Pack', quantity: 2 },
    { id: 'p2', name: 'Grilled Chicken (Full)', quantity: 1 },
    { id: 'p3', name: 'Plantain Chips', quantity: 3 },
  ],
  estimatedEarnings: 2500,
  distanceKm: 8.3,
  estimatedDuration: 22,
}

export default function ActiveDeliveryPage() {
  const router = useRouter()
  const { countryCode } = useCountry()
  const [currentStep, setCurrentStep] = useState<DeliveryStep>('assigned')
  const [showVerification, setShowVerification] = useState(false)
  const [showItemCheck, setShowItemCheck] = useState(false)

  const delivery = MOCK_DELIVERY

  const handleStepClick = (step: DeliveryStep) => {
    if (step === 'arrived_at_vendor') {
      setCurrentStep('arrived_at_vendor')
    }
    if (step === 'picked_up') {
      setShowVerification(true)
    }
  }

  const handleVerified = () => {
    setShowVerification(false)
    setCurrentStep('picked_up')
    setShowItemCheck(true)
  }

  const handleItemVerified = () => {
    setShowItemCheck(false)
    setCurrentStep('in_transit')
  }

  return (
    <>
      <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="max-w-2xl mx-auto space-y-4 pb-24">
        {/* Header */}
        <motion.div variants={ITEM} className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-surface-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-text-primary font-heading">Active Delivery</h1>
            <p className="text-xs text-text-secondary">#{delivery.orderId.slice(0, 8)}</p>
          </div>
        </motion.div>

        {/* Estimated earnings banner */}
        <motion.div variants={ITEM} className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-100 font-medium">Estimated Earnings</p>
              <p className="text-2xl font-bold">{formatMoneySymbol(delivery.estimatedEarnings, getCurrencyForCountry(countryCode))}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-amber-100">{delivery.distanceKm} km</p>
              <p className="text-xs text-amber-200">~{delivery.estimatedDuration} min</p>
            </div>
          </div>
        </motion.div>

        {/* Delivery Progress */}
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Progress</h2>
          <DeliveryProgress currentStep={currentStep} onStepClick={handleStepClick} />
        </motion.div>

        {/* Vendor info */}
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Store className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">{delivery.vendorName}</p>
              <p className="text-xs text-text-secondary truncate">{delivery.vendorAddress}</p>
            </div>
            <a href={`tel:${delivery.vendorPhone}`} className="p-2 rounded-lg bg-surface-secondary hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
              <Phone className="w-4 h-4 text-amber-600" />
            </a>
          </div>
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-secondary text-text-primary font-medium text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
            <Navigation className="w-4 h-4" />
            Navigate to Vendor
          </button>
        </motion.div>

        {/* Customer info */}
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">{delivery.customerName}</p>
              <p className="text-xs text-text-secondary truncate">{delivery.customerAddress}</p>
            </div>
            <a href={`tel:${delivery.customerPhone}`} className="p-2 rounded-lg bg-surface-secondary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <Phone className="w-4 h-4 text-blue-600" />
            </a>
          </div>
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-secondary text-text-primary font-medium text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
            <Navigation className="w-4 h-4" />
            Navigate to Customer
          </button>
        </motion.div>

        {/* Items */}
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Items ({delivery.items.length})</h2>
          <div className="space-y-2">
            {delivery.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs font-bold text-amber-600 shrink-0">
                    {item.quantity}
                  </span>
                  <span className="text-sm text-text-primary truncate">{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div variants={ITEM} className="flex gap-3">
          {currentStep === 'assigned' && (
            <button
              onClick={() => setCurrentStep('arrived_at_vendor')}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 transition-all"
            >
              I&apos;ve Arrived at Vendor
            </button>
          )}
          {currentStep === 'arrived_at_vendor' && (
            <button
              onClick={() => setShowVerification(true)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 transition-all"
            >
              Collect Items from Vendor
            </button>
          )}
          {currentStep === 'picked_up' && !showItemCheck && (
            <button
              onClick={() => setShowItemCheck(true)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 transition-all"
            >
              Start Delivery
            </button>
          )}
          {currentStep === 'in_transit' && (
            <button
              onClick={() => setCurrentStep('delivered')}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-emerald-700 transition-all"
            >
              Mark as Delivered
            </button>
          )}
        </motion.div>

        {/* Verification modals */}
        {showVerification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-surface border border-border p-5"
          >
            <PickupVerification orderId={delivery.orderId} onVerified={handleVerified} />
          </motion.div>
        )}

        {showItemCheck && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-surface border border-border p-5"
          >
            <ItemVerification
              orderId={delivery.orderId}
              role="driver"
              items={delivery.items}
              verifiedBy="driver-id"
              onComplete={handleItemVerified}
            />
          </motion.div>
        )}

        {/* Photo capture for delivered step */}
        {currentStep === 'delivered' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-surface border border-border p-5"
          >
            <h3 className="font-bold text-text-primary mb-3">Delivery Photo Evidence</h3>
            <PhotoCapture
              onPhotoCapture={(url) => console.log('Photo captured:', url)}
              label="Take Delivery Photo"
              description="Capture a photo of the delivered items as proof"
            />
            <button className="w-full mt-3 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors">
              Complete Delivery
            </button>
          </motion.div>
        )}
      </motion.div>

      <SOSButton
        driverId="driver-id"
        currentLocation={{ lat: 6.5244, lng: 3.3792 }}
        deliveryId={delivery.id}
      />
    </>
  )
}
