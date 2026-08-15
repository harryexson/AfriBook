'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Calendar,
  MapPin,
  Clock,
  Copy,
  Send,
  Mail,
  Users,
  Check,
  Loader2,
  Ticket as TicketIcon,
} from 'lucide-react';
import { Facebook, Twitter } from '@/components/icons/SocialIcons';
import { QRCodeSVG } from 'qrcode.react';
import {
  generateGoogleCalendarUrl,
  generateAppleCalendarUrl,
  generateOutlookCalendarUrl,
  type CalendarEvent,
} from '@/lib/events/calendar';
import { formatEventDate, formatEventDateRange, formatAmount } from '../../utils';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

interface Registration {
  id: string;
  status: string;
  payment_status: string;
  ticket_tier_name?: string;
  ticket_tier_id?: string;
  quantity: number;
  total?: number;
  currency_code?: string;
  created_at: string;
  event_ticket_tiers?: { name?: string } | null;
  event_tickets?: { ticket_code?: string; status?: string; attendee_name?: string }[];
}

export default function ConfirmationPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const regId = searchParams.get('registration');
  const queryCode = searchParams.get('code');
  const paymentComplete = searchParams.get('payment') === 'complete';

  const [copied, setCopied] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [event, setEvent] = useState<{ title: string; slug: string; description: string; start_date: string; end_date: string; venue_name?: string | null; venue_address?: string | null; venue_city?: string | null; venue_country?: string | null; currency_code: string; is_virtual: boolean } | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [ticketCode, setTicketCode] = useState<string>(queryCode ?? '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const eventRes = await fetch(`/api/events/${params.id}`, { signal: controller.signal });
        const eventJson = await eventRes.json();
        if (!eventRes.ok) throw new Error(eventJson.error ?? 'Failed to load event');
        setEvent(eventJson.data);

        // Resolve the registration + ticket code. If the register flow passed
        // a code we use it directly; otherwise fetch the user's registrations
        // and match by registration id (paid events confirm via webhook).
        if (!queryCode) {
          const regRes = await fetch(`/api/events/${params.id}/register`, { signal: controller.signal });
          const regJson = await regRes.json();
          if (regRes.ok) {
            const registrations: Registration[] = regJson.data ?? [];
            const matched = registrations.find((r) => r.id === regId) ?? registrations[0] ?? null;
            setRegistration(matched);
            if (matched?.event_tickets?.[0]?.ticket_code) {
              setTicketCode(matched.event_tickets[0].ticket_code);
            } else if (matched?.id) {
              setTicketCode(matched.id);
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [params.id, regId, queryCode]);

  const calEvent: CalendarEvent | null = event
    ? {
        title: event.title,
        description: event.description,
        startDate: event.start_date,
        endDate: event.end_date,
        startTime: '',
        endTime: '',
        venue: event.venue_name ?? '',
        address: event.venue_address ?? '',
        city: event.venue_city ?? '',
        country: event.venue_country ?? '',
      }
    : null;

  const copyTicketCode = () => {
    navigator.clipboard.writeText(ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyReferral = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${shareUrl}/events/${event?.slug || params.id}`);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading your ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center px-4">
        <div className="text-center">
          <TicketIcon className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">Something went wrong</h1>
          <p className="text-text-secondary mb-6">{error ?? 'Your ticket could not be loaded.'}</p>
          <Link href="/events/tickets" className="text-amber-500 font-medium hover:underline">
            Go to My Tickets
          </Link>
        </div>
      </div>
    );
  }

  const tierName = registration?.event_ticket_tiers?.name ?? registration?.ticket_tier_name ?? 'Ticket';
  const quantity = registration?.quantity ?? 1;
  const currency = event.currency_code ?? 'NGN';

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
            {paymentComplete ? "Payment Confirmed!" : "You're Registered!"}
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
            <h2 className="font-heading text-xl font-bold text-white">{event.title}</h2>
            <p className="text-white/80 text-sm">{tierName}</p>
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
              <button onClick={copyTicketCode} className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-text-tertiary" />}
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
                <p className="font-medium text-text-primary">{formatEventDate(event.start_date)}</p>
              </div>
              <div>
                <p className="text-text-tertiary text-xs mb-1">Tier</p>
                <p className="font-medium text-text-primary">{tierName}</p>
              </div>
              <div>
                <p className="text-text-tertiary text-xs mb-1">Quantity</p>
                <p className="font-medium text-text-primary">{quantity} ticket{quantity > 1 ? 's' : ''}</p>
              </div>
              {registration?.total != null && (
                <div>
                  <p className="text-text-tertiary text-xs mb-1">Total</p>
                  <p className="font-medium text-text-primary">{formatAmount(registration.total, registration.currency_code || currency)}</p>
                </div>
              )}
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
              <span className="text-text-primary">{formatEventDateRange(event.start_date, event.end_date)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-text-primary">{event.is_virtual ? 'Online event' : 'Timezone: Africa/Lagos'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-text-primary">
                {event.is_virtual
                  ? 'Online event'
                  : [event.venue_name, event.venue_address, event.venue_city].filter(Boolean).join(', ') || 'TBA'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-3 mb-6">
          <motion.div variants={fadeIn}>
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="font-medium text-text-primary text-sm mb-3">Add to Calendar</p>
              {calEvent ? (
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
              ) : null}
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
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-surface rounded-2xl border border-border p-6 mb-6">
          <h3 className="font-heading font-bold text-text-primary mb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            Invite Friends
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            Share this event with friends who might want to come along.
          </p>
          <div className="flex gap-2">
            <div className="flex-1 bg-surface-secondary rounded-lg px-3 py-2.5 text-sm text-text-secondary truncate">
              {typeof window !== 'undefined' ? `${window.location.origin}/events/${event.slug || params.id}` : ''}
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
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex gap-3">
          <Link
            href={`/events/${event.slug || params.id}`}
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