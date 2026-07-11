'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  Search,
  CheckCircle2,
  XCircle,
  Undo2,
  Users,
  Clock,
  TrendingUp,
  QrCode,
  Keyboard,
  UserCheck,
  BarChart3,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const recentCheckIns = [
  { id: '1', name: 'Adaeze Okonkwo', tier: 'VIP', time: '2 min ago', method: 'QR Scan' },
  { id: '2', name: 'Kofi Mensah', tier: 'General', time: '5 min ago', method: 'QR Scan' },
  { id: '3', name: 'Fatima Hassan', tier: 'VIP', time: '8 min ago', method: 'Manual' },
  { id: '4', name: 'Thabo Ndlovu', tier: 'General', time: '12 min ago', method: 'QR Scan' },
  { id: '5', name: 'Ngozi Eze', tier: 'VVIP Table', time: '15 min ago', method: 'QR Scan' },
  { id: '6', name: 'Samuel Kimani', tier: 'General', time: '18 min ago', method: 'QR Scan' },
  { id: '7', name: 'Aisha Bello', tier: 'VIP', time: '22 min ago', method: 'Manual' },
  { id: '8', name: 'Emeka Ugwu', tier: 'General', time: '25 min ago', method: 'QR Scan' },
];

const timelineData = [
  { hour: '6 PM', count: 45 },
  { hour: '7 PM', count: 120 },
  { hour: '8 PM', count: 280 },
  { hour: '9 PM', count: 190 },
  { hour: '10 PM', count: 65 },
  { hour: '11 PM', count: 30 },
];

const maxCount = Math.max(...timelineData.map((d) => d.count));

export default function CheckInPage() {
  const [manualCode, setManualCode] = useState('');
  const [scannerActive, setScannerActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);

  const totalTickets = 1000;
  const checkedIn = 735;
  const remaining = totalTickets - checkedIn;
  const checkInRate = Math.round((checkedIn / totalTickets) * 100);

  const handleManualCheckIn = () => {
    if (!manualCode) return;
    setCheckingIn(true);
    setTimeout(() => {
      setCheckingIn(false);
      setManualCode('');
    }, 1500);
  };

  const filteredAttendees = recentCheckIns.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tier.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/events/evt-001"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-heading font-bold text-text-primary">Check-in Scanner</h1>
              <p className="text-text-secondary text-sm">Afrobeats Night · Aug 15, 2026</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 bg-green-500/10 text-green-600 px-3 py-1.5 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Dashboard */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          {[
            {
              label: 'Total Tickets',
              value: totalTickets.toLocaleString(),
              icon: Users,
              color: 'bg-blue-500/10 text-blue-500',
            },
            {
              label: 'Checked In',
              value: checkedIn.toLocaleString(),
              icon: UserCheck,
              color: 'bg-green-500/10 text-green-500',
            },
            {
              label: 'Remaining',
              value: remaining.toLocaleString(),
              icon: Clock,
              color: 'bg-amber-500/10 text-amber-500',
            },
            {
              label: 'Check-in Rate',
              value: `${checkInRate}%`,
              icon: TrendingUp,
              color: 'bg-purple-500/10 text-purple-500',
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeIn}
              className="bg-surface rounded-xl border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">{stat.label}</p>
                  <p className="font-heading font-bold text-text-primary text-lg">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scanner Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* QR Scanner */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="bg-surface rounded-2xl border border-border overflow-hidden"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-heading font-bold text-text-primary flex items-center gap-2">
                  <Camera className="w-5 h-5 text-amber-500" />
                  QR Scanner
                </h2>
                <button
                  onClick={() => setScannerActive(!scannerActive)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    scannerActive
                      ? 'bg-green-500/10 text-green-600'
                      : 'bg-surface-secondary text-text-secondary'
                  }`}
                >
                  {scannerActive ? 'Active' : 'Paused'}
                </button>
              </div>

              {/* Camera Placeholder */}
              <div className="relative bg-dark-500 aspect-video flex items-center justify-center">
                {scannerActive ? (
                  <>
                    <div className="w-64 h-64 border-2 border-amber-500/50 rounded-3xl relative">
                      <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-amber-500 rounded-tl-xl" />
                      <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-amber-500 rounded-tr-xl" />
                      <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-amber-500 rounded-bl-xl" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-amber-500 rounded-br-xl" />
                    </div>
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-amber-500/50 animate-pulse" />
                  </>
                ) : (
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-white/30 mx-auto mb-3" />
                    <p className="text-white/50 text-sm">Scanner paused</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Manual Entry */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="bg-surface rounded-2xl border border-border p-6"
            >
              <h2 className="font-heading font-bold text-text-primary mb-4 flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-amber-500" />
                Manual Check-in
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="Enter ticket code (e.g. AFB-EVT001-VIP-0847)"
                  className="flex-1 px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                />
                <button
                  onClick={handleManualCheckIn}
                  disabled={!manualCode || checkingIn}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
                >
                  {checkingIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Check In
                </button>
              </div>
            </motion.div>

            {/* Check-in Timeline */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="bg-surface rounded-2xl border border-border p-6"
            >
              <h2 className="font-heading font-bold text-text-primary mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                Check-in Timeline
              </h2>
              <div className="flex items-end gap-3 h-40">
                {timelineData.map((d) => (
                  <div key={d.hour} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-text-secondary">{d.count}</span>
                    <div className="w-full bg-amber-500/20 rounded-t-lg relative" style={{ height: `${(d.count / maxCount) * 100}%` }}>
                      <div
                        className="absolute bottom-0 inset-x-0 bg-amber-500 rounded-t-lg transition-all"
                        style={{ height: '100%' }}
                      />
                    </div>
                    <span className="text-xs text-text-tertiary">{d.hour}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent Check-ins Sidebar */}
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search attendees..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-secondary border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>

            {/* Recent Check-ins */}
            <div className="bg-surface rounded-2xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-heading font-bold text-text-primary flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Recent Check-ins
                </h2>
              </div>
              <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                {filteredAttendees.map((attendee) => (
                  <div key={attendee.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                        {attendee.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary text-sm">{attendee.name}</p>
                        <div className="flex items-center gap-2 text-xs text-text-tertiary">
                          <span>{attendee.tier}</span>
                          <span>·</span>
                          <span>{attendee.method}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-tertiary">{attendee.time}</p>
                      <button className="text-xs text-red-500 hover:underline flex items-center gap-0.5 mt-0.5">
                        <Undo2 className="w-3 h-3" />
                        Undo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bulk Check-in */}
            <div className="bg-surface rounded-2xl border border-border p-4">
              <h3 className="font-heading font-semibold text-text-primary text-sm mb-3">
                Bulk Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2.5 bg-surface-secondary rounded-xl text-sm font-medium text-text-secondary hover:text-amber-500 hover:bg-amber-500/5 transition-colors">
                  <QrCode className="w-4 h-4" />
                  Bulk QR Scan
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2.5 bg-surface-secondary rounded-xl text-sm font-medium text-text-secondary hover:text-amber-500 hover:bg-amber-500/5 transition-colors">
                  <Users className="w-4 h-4" />
                  Check in by List
                </button>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-text-secondary">
                  Duplicate check-ins will be flagged. Each ticket can only be used once.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
