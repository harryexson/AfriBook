'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Ticket,
  Users,
  Tag,
  CreditCard,
  Smartphone,
  Building2,
  Lock,
  Check,
  Minus,
  Plus,
  X,
  Shield,
  Loader2,
} from 'lucide-react';
import { StripeCheckout } from '@/components/checkout/StripeCheckout';
import { useAuthStore } from '@/stores/auth-store';
import { formatEventDate, formatAmount } from '../../utils';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface EventDetail {
  id: string;
  title: string;
  slug: string;
  start_date: string;
  end_date: string;
  venue_name?: string | null;
  venue_city?: string | null;
  currency_code: string;
  is_free: boolean;
  organizer_name?: string;
  allow_guest_registration?: boolean;
  max_guests_per_registration?: number;
  event_ticket_types?: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency_code: string;
    quantity_available: number;
    quantity_sold: number;
    max_per_order: number;
    benefits: string[];
  }[];
}

export default function RegisterPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { status: authStatus } = useAuthStore();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [guests, setGuests] = useState<{ name: string; email: string; phone: string }[]>([
    { name: '', email: '', phone: '' },
  ]);
  const [specialRequests, setSpecialRequests] = useState('');
  const [checkout, setCheckout] = useState<{ clientSecret: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/${params.id}`, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Failed to load event');
        setEvent(json.data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [params.id]);

  useEffect(() => {
    const qty = parseInt(searchParams.get('qty') ?? '1', 10);
    if (qty > 0 && qty <= 10) {
      setQuantity(qty);
      setGuests(Array.from({ length: qty }, () => ({ name: '', email: '', phone: '' })));
    }
  }, [searchParams]);

  const tiers = (event?.event_ticket_types ?? []).filter((t) => (t.quantity_available ?? 0) - (t.quantity_sold ?? 0) > 0);
  const selectedTierId = searchParams.get('tier');
  const selectedTier = tiers.find((t) => t.id === selectedTierId) ?? tiers[0] ?? null;
  const currency = event?.currency_code ?? 'NGN';
  const isFree = event?.is_free ?? (selectedTier?.price === 0);

  const subtotal = selectedTier ? selectedTier.price * quantity : 0;
  const platformFee = Math.round(subtotal * 0.05 * 100) / 100;
  const processingFee = isFree ? 0 : 1.5;
  const tax = Math.round(subtotal * 0.075 * 100) / 100;
  const discount = promoApplied ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
  const total = subtotal + platformFee + processingFee + tax - discount;

  const updateGuest = (index: number, field: keyof (typeof guests)[0], value: string) => {
    const updated = [...guests];
    updated[index] = { ...updated[index], [field]: value };
    setGuests(updated);
  };

  const addGuest = () => {
    const maxGuests = Math.max(quantity, (event?.max_guests_per_registration ?? 0) * quantity || quantity);
    if (guests.length < maxGuests) {
      setGuests([...guests, { name: '', email: '', phone: '' }]);
    }
  };

  const removeGuest = (index: number) => {
    if (guests.length > 1) {
      setGuests(guests.filter((_, i) => i !== index));
    }
  };

  const handlePayment = async () => {
    if (!selectedTier || !event || processing) return;
    setProcessing(true);
    setSubmitError(null);
    try {
      const validGuests = guests.filter((g) => g.name || g.email || g.phone);
      const res = await fetch(`/api/events/${params.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketTierId: selectedTier.id,
          quantity,
          guests: validGuests,
          promoCode: promoApplied ? promoCode : undefined,
          specialRequests: specialRequests || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Registration failed');

      if (json.data?.paymentIntent?.clientSecret) {
        setCheckout({ clientSecret: json.data.paymentIntent.clientSecret });
        return;
      }

      const ticketCode = json.data?.tickets?.[0]?.ticket_code ?? '';
      window.location.href = `/events/${params.id}/confirmation?registration=${json.data.registration.id}&code=${ticketCode}`;
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckoutSuccess = () => {
    window.location.href = `/events/${params.id}/confirmation?payment=complete`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center px-4">
        <div className="text-center">
          <Ticket className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">Checkout unavailable</h1>
          <p className="text-text-secondary mb-6">{error ?? 'This event could not be loaded.'}</p>
          <Link href="/events" className="text-amber-500 font-medium hover:underline">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const eventLink = `/events/${event.slug || event.id}`;

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={eventLink} className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-heading font-bold text-text-primary text-lg">Checkout</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {authStatus !== 'authenticated' && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 text-sm text-amber-700 dark:text-amber-400">
            You must be{' '}
            <Link href="/login" className="font-semibold underline">
              signed in
            </Link>{' '}
            to complete registration. Ticket ownership is tied to your account.
          </div>
        )}

        {submitError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
            {submitError}
          </div>
        )}

        {!selectedTier ? (
          <div className="bg-surface rounded-2xl border border-border p-8 text-center">
            <Ticket className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold text-text-primary mb-2">
              Tickets are sold out
            </h2>
            <p className="text-text-secondary text-sm">No tickets are currently available for this event.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Ticket Summary */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-surface rounded-2xl border border-border p-6">
                <h2 className="font-heading text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-amber-500" />
                  Your Tickets
                </h2>
                <div className="bg-surface-secondary rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading font-bold text-text-primary">{selectedTier.name}</h3>
                    <span className="font-heading font-bold text-amber-500">
                      {formatAmount(selectedTier.price, currency)} each
                    </span>
                  </div>
                  {(selectedTier.benefits ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedTier.benefits.map((perk, i) => (
                        <span key={i} className="text-xs text-text-secondary bg-surface px-2.5 py-1 rounded-full">
                          {perk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">Quantity</span>
                  <div className="flex items-center border border-border rounded-xl">
                    <button
                      onClick={() => {
                        setQuantity(Math.max(1, quantity - 1));
                        if (guests.length > quantity - 1) {
                          setGuests(guests.slice(0, quantity - 1));
                        }
                      }}
                      className="p-2.5 hover:bg-surface-secondary transition-colors rounded-l-xl"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-5 py-2.5 font-bold text-text-primary text-lg">{quantity}</span>
                    <button
                      onClick={() => {
                        if (quantity < (selectedTier.max_per_order || 10)) {
                          setQuantity(quantity + 1);
                          addGuest();
                        }
                      }}
                      className="p-2.5 hover:bg-surface-secondary transition-colors rounded-r-xl"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Guest Information */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-surface rounded-2xl border border-border p-6">
                <h2 className="font-heading text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  Guest Information
                </h2>
                <div className="space-y-4">
                  {guests.map((guest, i) => (
                    <div key={i} className="bg-surface-secondary rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-text-primary text-sm">
                          {i === 0 ? 'Your Information' : `Guest ${i + 1}`}
                        </h4>
                        {i > 0 && (
                          <button onClick={() => removeGuest(i)} className="text-text-tertiary hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">Full Name *</label>
                          <input
                            type="text"
                            value={guest.name}
                            onChange={(e) => updateGuest(i, 'name', e.target.value)}
                            placeholder="Full name"
                            className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">Email *</label>
                          <input
                            type="email"
                            value={guest.email}
                            onChange={(e) => updateGuest(i, 'email', e.target.value)}
                            placeholder="email@example.com"
                            className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">Phone</label>
                          <input
                            type="tel"
                            value={guest.phone}
                            onChange={(e) => updateGuest(i, 'phone', e.target.value)}
                            placeholder="+234..."
                            className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {guests.length < Math.max(quantity, (event.max_guests_per_registration ?? 0) * quantity || quantity) && (
                    <button
                      onClick={addGuest}
                      className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-text-secondary hover:border-amber-500 hover:text-amber-500 text-sm font-medium transition-colors"
                    >
                      + Add Guest
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Special Requests */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-surface rounded-2xl border border-border p-6">
                <h2 className="font-heading text-xl font-bold text-text-primary mb-4">Special Requests</h2>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any dietary restrictions, accessibility needs, or special arrangements..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none text-sm"
                />
              </motion.div>

              {/* Promo Code */}
              {!isFree && (
                <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-surface rounded-2xl border border-border p-6">
                  <h2 className="font-heading text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-amber-500" />
                    Promo Code
                  </h2>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Enter promo code"
                      className="flex-1 px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 uppercase text-sm"
                    />
                    <button
                      onClick={() => promoCode && setPromoApplied(true)}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-3 rounded-xl text-sm transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {promoApplied && (
                    <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                      <Check className="w-4 h-4" /> 10% discount applied!
                    </p>
                  )}
                </motion.div>
              )}

              {/* Terms */}
              <motion.div initial="hidden" animate="visible" variants={fadeIn} className="bg-surface rounded-2xl border border-border p-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-5 h-5 rounded border-border text-amber-500 focus:ring-amber-500 mt-0.5"
                  />
                  <span className="text-sm text-text-secondary leading-relaxed">
                    I agree to the{' '}
                    <span className="text-amber-500 font-medium cursor-pointer">Terms & Conditions</span>{' '}
                    and{' '}
                    <span className="text-amber-500 font-medium cursor-pointer">Refund Policy</span>
                    . I understand that tickets are non-transferable unless explicitly allowed by the
                    organizer.
                  </span>
                </label>
              </motion.div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
                  <h3 className="font-heading font-bold text-text-primary mb-4">Order Summary</h3>

                  <div className="bg-surface-secondary rounded-xl p-4 mb-4">
                    <p className="font-heading font-bold text-text-primary">{event.title}</p>
                    <p className="text-sm text-text-secondary mt-1">{formatEventDate(event.start_date)}</p>
                    <p className="text-sm text-text-secondary">
                      {[event.venue_name, event.venue_city].filter(Boolean).join(', ') || 'TBA'}
                    </p>
                  </div>

                  <div className="space-y-3 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">{quantity}x {selectedTier.name}</span>
                      <span className="text-text-primary font-medium">{formatAmount(subtotal, currency)}</span>
                    </div>
                    {!isFree && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Platform fee (5%)</span>
                          <span className="text-text-primary">{formatAmount(platformFee, currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Processing fee</span>
                          <span className="text-text-primary">{formatAmount(processingFee, currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Tax (7.5%)</span>
                          <span className="text-text-primary">{formatAmount(tax, currency)}</span>
                        </div>
                      </>
                    )}
                    {promoApplied && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount (10%)</span>
                        <span>-{formatAmount(discount, currency)}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-4 mb-6">
                    <div className="flex justify-between font-bold text-text-primary text-lg">
                      <span>Total</span>
                      <span className="text-amber-500">{formatAmount(total, currency)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePayment}
                    disabled={!acceptedTerms || processing}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white font-bold py-3.5 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {isFree ? 'Register Free' : 'Pay & Register'}
                        <Lock className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-text-tertiary">
                    <Shield className="w-4 h-4" />
                    <span>{isFree ? 'Free registration' : 'Secure checkout powered by Stripe'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stripe Checkout Modal */}
      {checkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold text-text-primary flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" />
                Complete Payment
              </h3>
              <button onClick={() => setCheckout(null)} className="p-2 hover:bg-surface-secondary rounded-lg transition-colors">
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>
            <p className="text-sm text-text-secondary mb-4">
              Pay {formatAmount(total, currency)} to confirm your {selectedTier?.name} tickets.
            </p>
            <StripeCheckout
              clientSecret={checkout.clientSecret}
              publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''}
              buttonLabel={`Pay ${formatAmount(total, currency)}`}
              onSuccess={handleCheckoutSuccess}
              onError={(message) => setSubmitError(message)}
            />
          </div>
        </div>
      )}
    </div>
  );
}