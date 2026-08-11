'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, AlertTriangle, Clock, MapPin, Phone, User,
  Bell, CheckCircle, ChevronRight, Plus, ShieldAlert,
} from 'lucide-react'
import SOSButton from '@/components/driver/SOSButton'
import CheckInModal from '@/components/driver/CheckInModal'
import type { CheckInType, DriverEmergencyContact } from '@/types/pickup-security'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

const MOCK_EMERGENCY_CONTACTS: DriverEmergencyContact[] = [
  {
    id: 'ec1', driverId: 'd1', name: 'Amara Obi', relationship: 'Spouse',
    phone: '+234 803 456 7890', isPrimary: true, notifyOnSos: true, createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ec2', driverId: 'd1', name: 'Chidi Okonkwo', relationship: 'Brother',
    phone: '+234 802 567 8901', isPrimary: false, notifyOnSos: true, createdAt: '2024-01-01T00:00:00Z',
  },
]

const CHECK_IN_TYPES: { type: CheckInType; label: string; icon: typeof Clock }[] = [
  { type: 'shift_start', label: 'Start Shift', icon: Clock },
  { type: 'pre_delivery', label: 'Pre-Delivery', icon: MapPin },
  { type: 'post_delivery', label: 'Post-Delivery', icon: MapPin },
  { type: 'scheduled_check', label: 'Scheduled Check', icon: Bell },
  { type: 'shift_end', label: 'End Shift', icon: Clock },
]

const SAFETY_TIPS = [
  'Keep your phone charged and power bank handy',
  'Share live location with emergency contacts',
  'Avoid high-risk areas after curfew (10PM - 5AM)',
  'Use the SOS button if you feel unsafe',
  'Complete check-ins at each delivery stage',
  'Verify item integrity at every handoff point',
]

export default function SafetyPage() {
  const [activeCheckIn, setActiveCheckIn] = useState<CheckInType | null>(null)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 10000 },
      )
    }
  }, [])

  const handleCheckIn = (type: CheckInType) => {
    setActiveCheckIn(type)
    setShowCheckInModal(true)
  }

  return (
    <>
      <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="max-w-2xl mx-auto space-y-4 pb-24">
        {/* Header */}
        <motion.div variants={ITEM} className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary font-heading">Safety Center</h1>
            <p className="text-xs text-text-secondary">Your safety is our priority</p>
          </div>
        </motion.div>

        {/* SOS Quick Access */}
        <motion.div variants={ITEM} className="rounded-2xl bg-gradient-to-br from-red-500 to-red-600 p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-8 h-8 text-red-100" />
            <div>
              <p className="text-lg font-bold">Emergency SOS</p>
              <p className="text-sm text-red-100">Press the red SOS button for immediate help</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-red-100">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Emergency contacts will be notified automatically
          </div>
        </motion.div>

        {/* Check-Ins */}
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Quick Check-In</h2>
            <span className="text-[10px] text-text-tertiary">Verify your safety status</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CHECK_IN_TYPES.map((ci) => (
              <button
                key={ci.type}
                onClick={() => handleCheckIn(ci.type)}
                className="flex items-center gap-2 p-3 rounded-xl bg-surface-secondary hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
              >
                <ci.icon className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-medium text-text-primary">{ci.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Emergency Contacts */}
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Emergency Contacts</h2>
            <button className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {MOCK_EMERGENCY_CONTACTS.map((contact) => (
              <div key={contact.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary">
                <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <User className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary">{contact.name}</p>
                    {contact.isPrimary && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary">{contact.relationship} &middot; {contact.phone}</p>
                </div>
                <div className="flex items-center gap-1">
                  <a href={`tel:${contact.phone}`} className="p-2 rounded-lg hover:bg-surface transition-colors">
                    <Phone className="w-4 h-4 text-emerald-500" />
                  </a>
                  <ChevronRight className="w-4 h-4 text-text-tertiary" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Safety Zone Status */}
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-text-primary">Current Zone Status</h2>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
            <Shield className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Safe Zone</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">
                No active safety alerts in your area
              </p>
            </div>
          </div>
        </motion.div>

        {/* Safety Tips */}
        <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-text-primary">Safety Tips</h2>
          </div>
          <div className="space-y-1">
            {SAFETY_TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary">{tip}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <SOSButton
        driverId="driver-id"
        currentLocation={currentLocation ?? undefined}
      />

      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        driverId="driver-id"
        checkInType={activeCheckIn ?? 'shift_start'}
      />
    </>
  )
}
