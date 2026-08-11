'use client';

import { useState } from 'react';
import Link from 'next/link';
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

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const mockTier = {
  name: 'VIP',
  price: 120,
  perks: ['Front-row standing area', 'VIP lounge access', 'Complimentary drinks'],
};

export default function RegisterPage() {
  const [quantity, setQuantity] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [guests, setGuests] = useState([
    { name: '', email: '', phone: '' },
  ]);
  const [specialRequests, setSpecialRequests] = useState('');

  const subtotal = mockTier.price * quantity;
  const platformFee = Math.round(subtotal * 0.05 * 100) / 100;
  const processingFee = 1.5;
  const tax = Math.round(subtotal * 0.075 * 100) / 100;
  const discount = promoApplied ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
  const total = subtotal + platformFee + processingFee + tax - discount;

  const updateGuest = (index: number, field: string, value: string) => {
    const updated = [...guests];
    updated[index] = { ...updated[index], [field]: value };
    setGuests(updated);
  };

  const addGuest = () => {
    if (guests.length < quantity) {
      setGuests([...guests, { name: '', email: '', phone: '' }]);
    }
  };

  const removeGuest = (index: number) => {
    if (guests.length > 1) {
      setGuests(guests.filter((_, i) => i !== index));
    }
  };

  const handlePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      window.location.href = `/events/evt-001/confirmation`;
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <div className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/events/evt-001"
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-heading font-bold text-text-primary text-lg">Checkout</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Summary */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="bg-surface rounded-2xl border border-border p-6"
            >
              <h2 className="font-heading text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-500" />
                Your Tickets
              </h2>
              <div className="bg-surface-secondary rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-bold text-text-primary">{mockTier.name}</h3>
                  <span className="font-heading font-bold text-amber-500">
                    ${mockTier.price} each
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mockTier.perks.map((perk) => (
                    <span
                      key={perk}
                      className="text-xs text-text-secondary bg-surface px-2.5 py-1 rounded-full"
                    >
                      {perk}
                    </span>
                  ))}
                </div>
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
                  <span className="px-5 py-2.5 font-bold text-text-primary text-lg">
                    {quantity}
                  </span>
                  <button
                    onClick={() => {
                      if (quantity < 10) {
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
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="bg-surface rounded-2xl border border-border p-6"
            >
              <h2 className="font-heading text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                Guest Information
              </h2>
              <div className="space-y-4">
                {guests.map((guest, i) => (
                  <div
                    key={i}
                    className="bg-surface-secondary rounded-xl border border-border p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-text-primary text-sm">
                        {i === 0 ? 'Your Information' : `Guest ${i + 1}`}
                      </h4>
                      {i > 0 && (
                        <button
                          onClick={() => removeGuest(i)}
                          className="text-text-tertiary hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={guest.name}
                          onChange={(e) => updateGuest(i, 'name', e.target.value)}
                          placeholder="Full name"
                          className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={guest.email}
                          onChange={(e) => updateGuest(i, 'email', e.target.value)}
                          placeholder="email@example.com"
                          className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                          Phone
                        </label>
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
                {guests.length < quantity && (
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
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="bg-surface rounded-2xl border border-border p-6"
            >
              <h2 className="font-heading text-xl font-bold text-text-primary mb-4">
                Special Requests
              </h2>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Any dietary restrictions, accessibility needs, or special arrangements..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none text-sm"
              />
            </motion.div>

            {/* Promo Code */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="bg-surface rounded-2xl border border-border p-6"
            >
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

            {/* Payment Method */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="bg-surface rounded-2xl border border-border p-6"
            >
              <h2 className="font-heading text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" />
                Payment Method
              </h2>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'mobile', label: 'Mobile Money', icon: Smartphone },
                  { id: 'bank', label: 'Bank Transfer', icon: Building2 },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      paymentMethod === method.id
                        ? 'border-amber-500 bg-amber-500/5'
                        : 'border-border hover:border-amber-500/40'
                    }`}
                  >
                    <method.icon
                      className={`w-6 h-6 mx-auto mb-2 ${
                        paymentMethod === method.id ? 'text-amber-500' : 'text-text-tertiary'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        paymentMethod === method.id ? 'text-amber-500' : 'text-text-secondary'
                      }`}
                    >
                      {method.label}
                    </span>
                  </button>
                ))}
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                      />
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">
                        CVV
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full pl-4 pr-10 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                        />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'mobile' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Mobile Money Provider
                    </label>
                    <select className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm">
                      <option>M-Pesa</option>
                      <option>MTN Mobile Money</option>
                      <option>Airtel Money</option>
                      <option>Opay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+234..."
                      className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'bank' && (
                <div className="bg-surface-secondary rounded-xl p-4 text-sm text-text-secondary">
                  <p>Bank transfer details will be provided after confirmation.</p>
                  <p className="mt-2 text-xs text-text-tertiary">
                    Please complete the transfer within 30 minutes to secure your tickets.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Terms */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="bg-surface rounded-2xl border border-border p-6"
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-5 h-5 rounded border-border text-amber-500 focus:ring-amber-500 mt-0.5"
                />
                <span className="text-sm text-text-secondary leading-relaxed">
                  I agree to the{' '}
                  <span className="text-amber-500 font-medium cursor-pointer">
                    Terms & Conditions
                  </span>{' '}
                  and{' '}
                  <span className="text-amber-500 font-medium cursor-pointer">
                    Refund Policy
                  </span>
                  . I understand that tickets are non-transferable unless explicitly allowed by the
                  organizer.
                </span>
              </label>
            </motion.div>

            {/* Mobile Pay Button */}
            <div className="lg:hidden">
              <button
                onClick={handlePayment}
                disabled={!acceptedTerms || processing}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white font-bold py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ${total.toFixed(2)} & Register
                    <Lock className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
                <h3 className="font-heading font-bold text-text-primary mb-4">Order Summary</h3>

                <div className="bg-surface-secondary rounded-xl p-4 mb-4">
                  <p className="font-heading font-bold text-text-primary">
                    Afrobeats Night: The Ultimate Concert
                  </p>
                  <p className="text-sm text-text-secondary mt-1">Sat, Aug 15, 2026 · 8:00 PM</p>
                  <p className="text-sm text-text-secondary">Eko Convention Centre, Lagos</p>
                </div>

                <div className="space-y-3 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">
                      {quantity}x {mockTier.name}
                    </span>
                    <span className="text-text-primary font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Platform fee (5%)</span>
                    <span className="text-text-primary">${platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Processing fee</span>
                    <span className="text-text-primary">${processingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Tax (7.5%)</span>
                    <span className="text-text-primary">${tax.toFixed(2)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount (10%)</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between font-bold text-text-primary text-lg">
                    <span>Total</span>
                    <span className="text-amber-500">${total.toFixed(2)}</span>
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
                      Pay & Register
                      <Lock className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-text-tertiary">
                  <Shield className="w-4 h-4" />
                  <span>Secure checkout powered by Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
