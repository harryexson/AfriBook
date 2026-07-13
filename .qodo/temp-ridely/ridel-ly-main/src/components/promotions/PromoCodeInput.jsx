import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, X, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

export default function PromoCodeInput({ fareAmount, serviceType = 'ride', onPromoApplied }) {
  const [promoCode, setPromoCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [error, setError] = useState('');

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    setIsApplying(true);
    setError('');

    try {
      const response = await base44.functions.invoke('applyPromoCode', {
        promoCode: promoCode.trim(),
        fareAmount,
        serviceType
      });

      if (response.data?.success) {
        setAppliedPromo(response.data);
        onPromoApplied?.(response.data);
        setPromoCode('');
      } else {
        setError(response.data?.error || 'Invalid promo code');
        setTimeout(() => setError(''), 4000);
      }
    } catch (error) {
      console.error('Error applying promo:', error);
      setError('Failed to apply promo code');
      setTimeout(() => setError(''), 4000);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    onPromoApplied?.(null);
  };

  return (
    <div className="space-y-3">
      {appliedPromo ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border-2 border-green-300 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-900">Promo Code Applied!</p>
                <p className="text-sm text-green-700">{appliedPromo.message}</p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleRemovePromo}
              className="text-green-700 hover:text-green-900"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-green-200">
            <span className="text-sm text-green-700">Original Fare:</span>
            <span className="text-sm text-green-900 line-through">${appliedPromo.original_fare.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-green-700">Discount:</span>
            <span className="text-sm font-semibold text-green-900">-${appliedPromo.discount_amount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-green-200">
            <span className="font-semibold text-green-900">New Fare:</span>
            <span className="text-xl font-bold text-green-900">${appliedPromo.final_fare.toFixed(2)}</span>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="pl-10 uppercase"
                onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
              />
            </div>
            <Button
              onClick={handleApplyPromo}
              disabled={isApplying || !promoCode.trim()}
              className="px-6"
            >
              {isApplying ? 'Applying...' : 'Apply'}
            </Button>
          </div>
          
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}