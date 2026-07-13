import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function PrimeBenefitsBanner({ user, onClose }) {
  // Don't show if user is already Prime
  if (user?.is_prime_member) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white border-0 shadow-xl overflow-hidden">
        <CardContent className="p-6 relative">
          <div className="absolute top-0 right-0 opacity-10">
            <Crown className="w-32 h-32" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6" />
                <h3 className="font-bold text-xl">Try Ride-ly Prime FREE</h3>
              </div>
              {onClose && (
                <button onClick={onClose} className="text-white/80 hover:text-white">
                  ✕
                </button>
              )}
            </div>
            
            <p className="text-white/90 mb-4">
              Get 20% off every ride + free food delivery for just $9.99/month
            </p>
            
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">First 30 days free</span>
            </div>
            
            <Button
              onClick={() => window.location.href = createPageUrl('Prime')}
              className="bg-white text-orange-600 hover:bg-gray-100 font-bold"
            >
              Learn More
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}