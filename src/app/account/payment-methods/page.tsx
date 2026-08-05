'use client';

import { motion } from 'framer-motion';
import { CreditCard, Shield } from 'lucide-react';
import PaymentMethodsManager from '@/components/account/PaymentMethodsManager';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function PaymentMethodsPage() {
  return (
    <div>
      <motion.div initial="hidden" animate="visible" variants={fadeIn} className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary mb-1">
          Payment Methods
        </h1>
        <p className="text-text-secondary">
          Add mobile money wallets, bank accounts, and debit or credit cards to your account
        </p>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
        <div className="bg-surface-secondary rounded-2xl border border-border p-6">
          <h2 className="font-heading font-bold text-text-primary mb-1 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            Your Saved Methods
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            These methods are available at checkout and for subscriptions. Your default is used automatically.
          </p>
          <PaymentMethodsManager />
        </div>

        <div className="bg-surface-secondary rounded-2xl border border-border p-6 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-sm text-text-secondary">
            <p className="font-medium text-text-primary mb-1">How your details are protected</p>
            <p>
              Full card numbers and mobile money secrets are never stored on AfriBook servers. We keep tokenised
              references and masked identifiers, and route charges through PCI-compliant payment partners such as
              Stripe, Paystack, Flutterwave, M-Pesa, and others in your region.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}