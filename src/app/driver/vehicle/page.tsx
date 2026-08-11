'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Car, Shield, FileText, AlertTriangle, CheckCircle,
  Clock, Upload, Plus, Trash2,
} from 'lucide-react'

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const ITEM = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

const VEHICLE_TYPES = [
  { value: 'car', label: 'Car' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'truck', label: 'Truck' },
  { value: 'van', label: 'Van' },
]

interface Document {
  id: string
  name: string
  type: 'insurance' | 'registration' | 'license'
  status: 'verified' | 'pending' | 'expired' | 'missing'
  expiryDate?: string
  fileName?: string
}

export default function VehiclePage() {
  const [editing, setEditing] = useState(false)

  const [vehicle, setVehicle] = useState({
    type: 'car',
    make: 'Toyota',
    model: 'Corolla',
    year: '2022',
    color: 'White',
    licensePlate: 'LAG-123-XY',
  })

  const [documents, setDocuments] = useState<Document[]>([
    { id: 'd1', name: 'Insurance Certificate', type: 'insurance', status: 'verified', expiryDate: 'Dec 31, 2026', fileName: 'insurance_2026.pdf' },
    { id: 'd2', name: 'Vehicle Registration', type: 'registration', status: 'pending', fileName: 'registration.pdf' },
    { id: 'd3', name: 'Driver\'s License', type: 'license', status: 'verified', expiryDate: 'Mar 15, 2027', fileName: 'license.pdf' },
  ])

  const handleFileUpload = (type: Document['type']) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.jpg,.jpeg,.png'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setDocuments((prev) =>
          prev.map((d) =>
            d.type === type ? { ...d, fileName: file.name, status: 'pending' as const } : d
          )
        )
      }
    }
    input.click()
  }

  const statusConfig = {
    verified: { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
    pending: { icon: Clock, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    expired: { icon: AlertTriangle, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
    missing: { icon: AlertTriangle, color: 'text-text-tertiary bg-surface-secondary' },
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={ITEM} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Vehicle</h1>
          <p className="text-sm text-text-secondary mt-1">Manage your vehicle and documents</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
            editing
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/25'
          )}
        >
          {editing ? 'Save Changes' : 'Edit Vehicle'}
        </button>
      </motion.div>

      {/* Vehicle details */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary font-heading">Vehicle Information</h3>
              <p className="text-sm text-text-secondary">Your registered vehicle</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Type', key: 'type', options: VEHICLE_TYPES },
              { label: 'Make', key: 'make' },
              { label: 'Model', key: 'model' },
              { label: 'Year', key: 'year' },
              { label: 'Color', key: 'color' },
              { label: 'License Plate', key: 'licensePlate' },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-xs font-semibold text-text-secondary mb-1 block">{field.label}</label>
                {editing ? (
                  field.options ? (
                    <select
                      value={vehicle[field.key as keyof typeof vehicle]}
                      onChange={(e) => setVehicle({ ...vehicle, [field.key]: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    >
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={vehicle[field.key as keyof typeof vehicle]}
                      onChange={(e) => setVehicle({ ...vehicle, [field.key]: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                    />
                  )
                ) : (
                  <p className="text-sm font-medium text-text-primary py-2">
                    {field.options
                      ? field.options.find((o) => o.value === vehicle[field.key as keyof typeof vehicle])?.label ?? vehicle[field.key as keyof typeof vehicle]
                      : vehicle[field.key as keyof typeof vehicle]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Verification status */}
        <div className="border-t border-border px-5 sm:px-6 py-4 bg-surface-secondary">
          <div className="flex items-center gap-2 text-sm">
            <Shield className={cn('w-4 h-4', documents.every((d) => d.status === 'verified') ? 'text-emerald-500' : 'text-amber-500')} />
            <span className="text-text-secondary">
              Vehicle verification:{' '}
              <span className={cn('font-semibold', documents.every((d) => d.status === 'verified') ? 'text-emerald-600' : 'text-amber-600')}>
                {documents.filter((d) => d.status === 'verified').length} of {documents.length} documents verified
              </span>
            </span>
          </div>
        </div>
      </motion.div>

      {/* Documents */}
      <motion.div variants={ITEM} className="rounded-2xl bg-surface border border-border p-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary font-heading">Documents</h3>
            <p className="text-sm text-text-secondary">Upload and manage your vehicle documents</p>
          </div>
          <button
            onClick={() => {
              const newDoc: Document = {
                id: `d${Date.now()}`,
                name: 'New Document',
                type: 'insurance',
                status: 'missing',
              }
              setDocuments([...documents, newDoc])
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-secondary border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-all"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        <div className="space-y-3">
          {documents.map((doc) => {
            const StatusIcon = statusConfig[doc.status].icon
            return (
              <div
                key={doc.id}
                className={cn(
                  'flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all',
                  doc.status === 'verified' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-900/30' :
                  doc.status === 'expired' ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-900/30' :
                  'bg-surface border-border'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', statusConfig[doc.status].color)}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{doc.name}</p>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <span className={cn('font-medium capitalize', {
                        'text-emerald-600': doc.status === 'verified',
                        'text-amber-600': doc.status === 'pending',
                        'text-red-600': doc.status === 'expired',
                        'text-text-tertiary': doc.status === 'missing',
                      })}>
                        {doc.status === 'missing' ? 'Not uploaded' : doc.status}
                      </span>
                      {doc.expiryDate && (
                        <span>&middot; Expires {doc.expiryDate}</span>
                      )}
                    </div>
                    {doc.fileName && (
                      <p className="text-xs text-text-tertiary mt-0.5">{doc.fileName}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFileUpload(doc.type)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {doc.fileName ? 'Replace' : 'Upload'}
                  </button>
                  <button
                    onClick={() => setDocuments(documents.filter((d) => d.id !== doc.id))}
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {documents.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-text-secondary font-medium">No documents uploaded</p>
            <p className="text-sm text-text-tertiary mt-1">Upload your vehicle documents to start earning</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
