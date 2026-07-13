import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, TrendingUp, Tag, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PromotionsBanner() {
  const [promotions, setPromotions] = useState([]);
  const [userCredits, setUserCredits] = useState(null);
  const [dismissedPromos, setDismissedPromos] = useState([]);

  useEffect(() => {
    loadPromotions();
    loadUserCredits();
  }, []);

  const loadPromotions = async () => {
    try {
      const now = new Date().toISOString();
      const activePromos = await base44.entities.PromoCode.filter({
        is_active: true,
        valid_until: { $gte: now }
      });

      // Get top 3 active promos
      setPromotions(activePromos.slice(0, 3));
    } catch (error) {
      console.error('Error loading promotions:', error);
    }
  };

  const loadUserCredits = async () => {
    try {
      const user = await base44.auth.me();
      const credits = await base44.entities.UserCredit.filter({ user_id: user.id });
      if (credits.length > 0) {
        setUserCredits(credits[0]);
      }
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  const handleDismiss = (promoId) => {
    setDismissedPromos([...dismissedPromos, promoId]);
  };

  const visiblePromotions = promotions.filter(p => !dismissedPromos.includes(p.id));

  if (visiblePromotions.length === 0 && (!userCredits || userCredits.total_credits <= 0)) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {/* User Credits Banner */}
      {userCredits && userCredits.total_credits > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-green-100">Your Credits</p>
                    <p className="text-2xl font-bold">${userCredits.total_credits.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-100">Available to use</p>
                  <Link to={createPageUrl('Referrals')}>
                    <Button size="sm" variant="secondary" className="mt-2">
                      Earn More
                    </Button>
                  </Link>
                </div>
              </div>
              {userCredits.referral_credits > 0 && (
                <div className="mt-3 pt-3 border-t border-white/20 text-sm text-green-100">
                  💰 ${userCredits.referral_credits.toFixed(2)} from referrals
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Promotions */}
      <AnimatePresence>
        {visiblePromotions.map((promo, index) => {
          const getPromoIcon = () => {
            if (promo.discount_type === 'free_delivery') return Gift;
            if (promo.discount_type === 'percentage') return TrendingUp;
            return Tag;
          };

          const Icon = getPromoIcon();

          const getPromoColor = () => {
            if (promo.user_type_restriction === 'new_users') return 'from-purple-500 to-pink-500';
            if (promo.discount_type === 'free_delivery') return 'from-blue-500 to-cyan-500';
            return 'from-orange-500 to-red-500';
          };

          return (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`bg-gradient-to-r ${getPromoColor()} border-0 text-white relative overflow-hidden`}>
                <CardContent className="p-4">
                  <button
                    onClick={() => handleDismiss(promo.id)}
                    className="absolute top-2 right-2 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-start gap-3 pr-8">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-white/20 text-white border-white/30">
                          {promo.code}
                        </Badge>
                        {promo.user_type_restriction === 'new_users' && (
                          <Badge className="bg-white/20 text-white border-white/30 text-xs">
                            New Users Only
                          </Badge>
                        )}
                      </div>
                      <p className="font-semibold text-lg">
                        {promo.discount_type === 'percentage' && `${promo.discount_value}% off`}
                        {promo.discount_type === 'fixed_amount' && `$${promo.discount_value} off`}
                        {promo.discount_type === 'free_delivery' && 'Free Delivery'}
                        {promo.applicable_to?.includes('ride') && !promo.applicable_to?.includes('delivery') && ' rides'}
                        {promo.applicable_to?.includes('delivery') && !promo.applicable_to?.includes('ride') && ' deliveries'}
                      </p>
                      {promo.min_ride_value && (
                        <p className="text-sm text-white/80 mt-1">
                          Minimum order: ${promo.min_ride_value}
                        </p>
                      )}
                      {promo.max_discount && promo.discount_type === 'percentage' && (
                        <p className="text-sm text-white/80">
                          Max discount: ${promo.max_discount}
                        </p>
                      )}
                      <p className="text-xs text-white/70 mt-2">
                        Valid until {new Date(promo.valid_until).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>

                {/* Decorative Elements */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute -left-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Referral CTA */}
      <Link to={createPageUrl('Referrals')}>
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 border-0 text-white hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Refer Friends, Earn $10</p>
                  <p className="text-sm text-indigo-100">Share your code and get rewarded</p>
                </div>
              </div>
              <Button size="sm" variant="secondary">
                Learn More
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}