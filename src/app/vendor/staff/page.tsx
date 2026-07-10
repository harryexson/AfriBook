'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Plus, Search, Users, X, Mail, Phone, Shield,
} from 'lucide-react'
import StaffCard from '@/components/vendor/StaffCard'
import ScheduleGrid from '@/components/vendor/ScheduleGrid'
import type { Staff } from '@/types'

const MOCK_STAFF: Staff[] = [
  { id: 'st1', businessId: 'b1', userId: 'u1', name: 'Amara Okafor', role: 'stylist', email: 'amara@salon.com', phone: '+234800111222', schedule: [], serviceIds: ['s1', 's2'], isActive: true, rating: 4.9, bio: 'Senior hair stylist with 8 years experience.', createdAt: '', updatedAt: '' },
  { id: 'st2', businessId: 'b1', userId: 'u2', name: 'Kofi Mensah', role: 'barber', email: 'kofi@salon.com', phone: '+23320111222', schedule: [], serviceIds: ['s3'], isActive: true, rating: 4.7, createdAt: '', updatedAt: '' },
  { id: 'st3', businessId: 'b1', userId: 'u3', name: 'Fatima Bello', role: 'receptionist', email: 'fatima@salon.com', phone: '+234802333444', schedule: [], serviceIds: [], isActive: false, rating: 0, createdAt: '', updatedAt: '' },
]

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
}

export default function StaffPage() {
  const [staffList] = useState<Staff[]>(MOCK_STAFF)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [activeTab, setActiveTab] = useState<'team' | 'schedule'>('team')

  const [form, setForm] = useState({
    name: '', email: '', phone: '', role: 'stylist', services: [] as string[],
  })

  const filtered = staffList.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = () => {
    setShowForm(false)
    setForm({ name: '', email: '', phone: '', role: 'stylist', services: [] })
  }

  return (
    <motion.div variants={CONTAINER} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={ITEM} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Staff</h1>
          <p className="text-sm text-text-secondary mt-1">{staffList.length} team members</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={ITEM}>
        <div className="flex bg-surface-secondary rounded-xl p-1 w-fit">
          {(['team', 'schedule'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                activeTab === tab
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {tab === 'team' ? 'Team Members' : 'Schedule'}
            </button>
          ))}
        </div>
      </motion.div>

      {activeTab === 'team' && (
        <>
          <motion.div variants={ITEM}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
              />
            </div>
          </motion.div>

          <motion.div variants={ITEM} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((s) => (
              <StaffCard key={s.id} staff={s} onClick={setSelectedStaff} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16">
                <Users className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary font-medium">No staff found</p>
                <p className="text-sm text-text-tertiary mt-1">Add your first team member.</p>
              </div>
            )}
          </motion.div>
        </>
      )}

      {activeTab === 'schedule' && (
        <motion.div variants={ITEM}>
          <ScheduleGrid />
        </motion.div>
      )}

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary font-heading">Add Staff Member</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="staff@email.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+234..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Role</span>
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
                >
                  {['stylist', 'barber', 'therapist', 'receptionist', 'manager', 'assistant'].map((r) => (
                    <option key={r} value={r} className="capitalize">{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
                  Cancel
                </button>
                <button onClick={handleAdd} className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors">
                  Add Staff
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff Detail Drawer */}
      <AnimatePresence>
        {selectedStaff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedStaff(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto bg-surface rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xl font-bold">
                      {selectedStaff.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-text-primary">{selectedStaff.name}</h2>
                      <p className="text-sm text-text-secondary capitalize">{selectedStaff.role}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStaff(null)} className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Email</p>
                    <p className="text-sm text-text-primary">{selectedStaff.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Phone</p>
                    <p className="text-sm text-text-primary">{selectedStaff.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Status</p>
                    <span className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      selectedStaff.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    )}>
                      {selectedStaff.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Rating</p>
                    <p className="text-sm text-text-primary">{selectedStaff.rating > 0 ? selectedStaff.rating.toFixed(1) : 'N/A'}</p>
                  </div>
                </div>
                {selectedStaff.bio && (
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">Bio</p>
                    <p className="text-sm text-text-secondary">{selectedStaff.bio}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
