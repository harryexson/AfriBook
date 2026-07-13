'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Calendar,
  MapPin,
  Clock,
  Download,
  Share2,
  Copy,
  Send,
  Ticket,
  ArrowRight,
  Link as LinkIcon,
  Mail,
  Users,
  Plus,
  Check,
} from 'lucide-react';
import { Facebook, Twitter } from '@/components/icons/SocialIcons';
import { QRCodeSVG } from 'qrcode.react';
import {
  generateGoogleCalendarUrl,
  generateAppleCalendarUrl,
  generateOutlookCalendarUrl,
  type CalendarEvent,
} from '@/lib/events/calendar';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function ConfirmationPage() {
  const [copied, setCopied] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const ticketCode = 'AFB-EVT001-VIP-0847';

  const calEvent: CalendarEvent = {
    title: 'Afrobeats Night: The Ultimate Concert Experience',
    description: 'Join us for an unforgettable night of Afrobeats featuring the biggest names in African music.',
    startDate: 'Sat, Aug 15, 2026',
    endDate: 'Sat, Aug 15, 2026',
    startTime: '8:00 PM',
    endTime: '2:00 AM',
    venue: 'Eko Convention Centre',
    address: 'Eko Hotels & Suites, Plot 14, Adetokunbo Ademola Crescent, Victoria Island',
    city: 'Lagos',
    country: 'Nigeria',
  };

  const copyTicketCode = () => {
    navigator.clipboard.writeText(ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyReferral = () => {
    navigator.clipboard.writeText('https://afribook.com/events/evt-001?ref=AFRI-2026');
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Success Header */}
      <section className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 py-16 md:py-20 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
          >
            <CheckCircle className="w-14 h-14 text-green-500" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-heading text-3xl md:text-4xl font-bold text-white mb-3"
          >
            You&apos;re Registered!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/80 text-lg"
          >
            Your ticket has been sent to your email. See you at the event!
          </motion.p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 -mt-6 pb-16">
        {/* QR Ticket */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-surface rounded-2xl border border-border shadow-xl overflow-hidden mb-6"
        >
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-center">
            <h2 className="font-heading text-xl font-bold text-white">Afrobeats Night</h2>
            <p className="text-white/80 text-sm">The Ultimate Concert Experience</p>
          </div>

          {/* Ticket Body */}
          <div className="p-6 text-center">
            <div className="bg-white rounded-2xl p-6 inline-block mb-4 shadow-sm">
              <QRCodeSVG
                value={ticketCode}
                size={200}
                level="H"
                includeMargin={true}
                fgColor="#111827"
                bgColor="#ffffff"
              />
            </div>
            <p className="font-mono text-sm text-text-secondary mb-1">Ticket Code</p>
            <div className="flex items-center justify-center gap-2">
              <p className="font-mono font-bold text-lg text-text-primary tracking-wider">
                {ticketCode}
              </p>
              <button
                onClick={copyTicketCode}
                className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-text-tertiary" />
                )}
              </button>
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="relative px-6">
            <div className="border-t-2 border-dashed border-border" />
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-surface-secondary rounded-full" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-surface-secondary rounded-full" />
          </div>

          {/* Ticket Details */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-tertiary text-xs mb-1">Date</p>
                <p className="font-medium text-text-primary">Aug 15, 2026</p>
              </div>
              <div>
                <p className="text-text-tertiary text-xs mb-1">Time</p>
                <p className="font-medium text-text-primary">8:00 PM</p>
              </div>
              <div>
                <p className="text-text-tertiary text-xs mb-1">Tier</p>
                <p className="font-medium text-text-primary">VIP</p>
              </div>
              <div>
                <p className="text-text-tertiary text-xs mb-1">Guests</p>
                <p className="font-medium text-text-primary">1</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Event Summary */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-surface rounded-2xl border border-border p-6 mb-6"
        >
          <h3 className="font-heading font-bold text-text-primary mb-4">Event Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-text-primary">Saturday, August 15, 2026</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-text-primary">8:00 PM — 2:00 AM (WAT)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-text-primary">
                Eko Convention Centre, Victoria Island, Lagos
              </span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-3 mb-6"
        >
          <motion.div variants={fadeIn}>
            <button className="w-full flex items-center justify-between p-4 bg-surface rounded-xl border border-border hover:border-amber-500/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <Download className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-text-primary text-sm">Download Ticket</p>
                  <p className="text-xs text-text-tertiary">Save PDF ticket to your device</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-text-tertiary" />
            </button>
          </motion.div>

          <motion.div variants={fadeIn}>
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="font-medium text-text-primary text-sm mb-3">Add to Calendar</p>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={generateGoogleCalendarUrl(calEvent)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 bg-surface-secondary rounded-lg text-xs font-medium text-text-secondary hover:text-amber-500 hover:bg-amber-500/5 transition-colors text-center"
                >
                  Google
                </a>
                <a
                  href={generateAppleCalendarUrl(calEvent)}
                  className="py-2.5 bg-surface-secondary rounded-lg text-xs font-medium text-text-secondary hover:text-amber-500 hover:bg-amber-500/5 transition-colors text-center"
                >
                  Apple
                </a>
                <a
                  href={generateOutlookCalendarUrl(calEvent)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 bg-surface-secondary rounded-lg text-xs font-medium text-text-secondary hover:text-amber-500 hover:bg-amber-500/5 transition-colors text-center"
                >
                  Outlook
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeIn}>
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="font-medium text-text-primary text-sm mb-3">Share on Social</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'WhatsApp', icon: Send },
                  { label: 'Twitter', icon: Twitter },
                  { label: 'Facebook', icon: Facebook },
                  { label: 'Email', icon: Mail },
                ].map((s) => (
                  <button
                    key={s.label}
                    className="flex flex-col items-center gap-1.5 py-2.5 bg-surface-secondary rounded-lg text-xs text-text-secondary hover:text-amber-500 hover:bg-amber-500/5 transition-colors"
                  >
                    <s.icon className="w-4 h-4" />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Invite Friends */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-surface rounded-2xl border border-border p-6 mb-6"
        >
          <h3 className="font-heading font-bold text-text-primary mb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            Invite Friends
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            Share your referral link and earn rewards for each friend who registers!
          </p>
          <div className="flex gap-2">
            <div className="flex-1 bg-surface-secondary rounded-lg px-3 py-2.5 text-sm text-text-secondary truncate">
              https://afribook.com/events/evt-001?ref=AFRI-2026
            </div>
            <button
              onClick={copyReferral}
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-1.5 shrink-0"
            >
              {referralCopied ? (
                <>
                  <Check className="w-4 h-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex gap-3"
        >
          <Link
            href="/events/evt-001"
            className="flex-1 py-3.5 border border-border rounded-xl text-center font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
          >
            Back to Event
          </Link>
          <Link
            href="/events/tickets"
            className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-center transition-colors"
          >
            My Tickets
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
