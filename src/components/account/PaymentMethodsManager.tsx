'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Smartphone,
  Building,
  Trash2,
  Plus,
  Check,
  Star,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserPaymentMethod, SavedPaymentType } from '@/types';
import { paymentMethodLabel, paymentMethodSubtitle, PAYMENT_METHOD_LABELS } from '@/lib/paymentMethods';

type AddForm = {
  type: SavedPaymentType;
  label: string;
  network: string;
  accountName: string;
  last4: string;
  accountNumber: string;
  phoneNumber: string;
  countryCode: string;
  currency: string;
  expiryMonth: string;
  expiryYear: string;
};

const EMPTY_FORM: AddForm = {
  type: 'card',
  label: '',
  network: '',
  accountName: '',
  last4: '',
  accountNumber: '',
  phoneNumber: '',
  countryCode: 'NG',
  currency: 'NGN',
  expiryMonth: '',
  expiryYear: '',
};

const TYPE_CONFIG: { type: SavedPaymentType; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'card', icon: CreditCard },
  { type: 'mobile_money', icon: Smartphone },
  { type: 'bank', icon: Building },
];

export default function PaymentMethodsManager({ compact = false }: { compact?: boolean }) {
  const [methods, setMethods] = useState<UserPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddForm>(EMPTY_FORM);

  const loadMethods = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payment-methods');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to load payment methods');
      setMethods(json.methods ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          label: form.label || undefined,
          network: form.network || undefined,
          accountName: form.type === 'bank' ? form.accountName : undefined,
          last4: form.last4 || undefined,
          accountNumber: form.accountNumber || undefined,
          phoneNumber: form.type === 'mobile_money' ? form.phoneNumber : undefined,
          countryCode: form.countryCode || undefined,
          currency: form.currency || undefined,
          expiryMonth: form.expiryMonth ? Number(form.expiryMonth) : undefined,
          expiryYear: form.expiryYear ? Number(form.expiryYear) : undefined,
          isDefault: methods.length === 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to save payment method');
      setShowForm(false);
      setForm(EMPTY_FORM);
      await loadMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setError('');
    try {
      const res = await fetch(`/api/payment-methods/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to set default');
      await loadMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default');
    }
  };

  const handleDelete = async (id: string) => {
    setError('');
    try {
      const res = await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to delete payment method');
      await loadMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment method');
    }
  };

  return (
    <div className={cn('space-y-4', compact && 'space-y-2.5')}>
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/30 p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Saved methods list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      ) : methods.length === 0 && !showForm ? (
        <div className="text-center py-8 border border-dashed border-border rounded-xl">
          <p className="text-sm text-text-tertiary">No payment methods saved yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {methods.map((method) => {
            const Icon = TYPE_CONFIG.find((t) => t.type === method.type)?.icon ?? CreditCard;
            const subtitle = paymentMethodSubtitle(method);
            return (
              <div
                key={method.id}
                className={cn('flex items-center gap-3 rounded-xl border border-border bg-surface-secondary', compact ? 'p-3' : 'p-4')}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  method.isDefault ? 'bg-amber-500 text-white' : 'bg-surface-tertiary text-text-secondary'
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {paymentMethodLabel(method)}
                    </p>
                    {method.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                        <Star className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>
                  {subtitle && (
                    <p className="text-xs text-text-tertiary truncate">{subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      title="Set as default"
                      className="p-2 rounded-lg text-text-tertiary hover:text-amber-500 hover:bg-surface transition-colors"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(method.id)}
                    title="Remove"
                    className="p-2 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5 space-y-4">
              {/* Type selector */}
              <div className="flex flex-wrap gap-2">
                {TYPE_CONFIG.map(({ type, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, type })}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                      form.type === type
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-border bg-surface text-text-secondary hover:border-amber-500/40'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {PAYMENT_METHOD_LABELS[type]}
                  </button>
                ))}
              </div>

              {/* Label */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Label (optional)</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder={form.type === 'card' ? 'e.g. Personal Visa' : form.type === 'mobile_money' ? 'e.g. My M-Pesa' : 'e.g. Salary account'}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* Type-specific fields */}
              {form.type === 'card' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-secondary">Network</label>
                      <input
                        type="text"
                        value={form.network}
                        onChange={(e) => setForm({ ...form, network: e.target.value })}
                        placeholder="Visa / Mastercard"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-secondary">Last 4 digits</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={form.last4}
                        onChange={(e) => setForm({ ...form, last4: e.target.value.replace(/\D/g, '') })}
                        placeholder="4242"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-secondary">Expiry month (MM)</label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={form.expiryMonth}
                        onChange={(e) => setForm({ ...form, expiryMonth: e.target.value })}
                        placeholder="12"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-secondary">Expiry year (YYYY)</label>
                      <input
                        type="number"
                        min={new Date().getFullYear()}
                        value={form.expiryYear}
                        onChange={(e) => setForm({ ...form, expiryYear: e.target.value })}
                        placeholder={String(new Date().getFullYear() + 1)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      />
                    </div>
                  </div>
                </>
              )}

              {form.type === 'mobile_money' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">Provider</label>
                    <select
                      value={form.network}
                      onChange={(e) => setForm({ ...form, network: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    >
                      <option value="">Select provider</option>
                      <option value="M-Pesa">M-Pesa</option>
                      <option value="Airtel Money">Airtel Money</option>
                      <option value="MTN MoMo">MTN MoMo</option>
                      <option value="Orange Money">Orange Money</option>
                      <option value="MoMo">MoMo</option>
                      <option value="Safaricom">Safaricom</option>
                      <option value="EcoCash">EcoCash</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">Phone number</label>
                    <input
                      type="tel"
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                      placeholder="+254 7XX XXX XXX"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>
              )}

              {form.type === 'bank' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">Bank name</label>
                    <input
                      type="text"
                      value={form.network}
                      onChange={(e) => setForm({ ...form, network: e.target.value })}
                      placeholder="e.g. KCB, GTBank"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">Account name</label>
                    <input
                      type="text"
                      value={form.accountName}
                      onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                      placeholder="Account holder name"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-semibold text-text-secondary">Account number</label>
                    <input
                      type="text"
                      value={form.accountNumber}
                      onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                      placeholder="Bank account number"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-text-tertiary flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-500" />
                Card numbers are never stored. Only masked identifiers are saved.
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all',
                    'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </span>
                  ) : (
                    'Save payment method'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(''); }}
                  className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-amber-500/40 text-sm font-medium text-amber-600 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add payment method
        </button>
      )}
    </div>
  );
}