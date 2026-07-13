import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Crown, 
  CheckCircle2, 
  Zap, 
  Shield, 
  Clock,
  Gift,
  TrendingUp,
  Loader2,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';

const PLANS = [
  {
    id: 'monthly_9_99',
    name: 'Monthly Prime',
    price: 9.99,
    interval: 'month',
    savings: null,
    popular: false
  },
  {
    id: 'yearly_99_99',
    name: 'Annual Prime',
    price: 99.99,
    interval: 'year',
    savings: 20,
    popular: true
  }
];

const BENEFITS = [
  {
    icon: TrendingUp,
    title: '20% Off All Rides',
    description: 'Save on every trip, every time',
    color: 'text-green-600',
    bg: 'bg-green-50'
  },
  {
    icon: Zap,
    title: 'Priority Driver Matching',
    description: 'Get matched with drivers faster',
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  {
    icon: Gift,
    title: 'Free Food Delivery',
    description: '$0 delivery fees on all orders',
    color: 'text-purple-600',
    bg: 'bg-purple-50'
  },
  {
    icon: Shield,
    title: '24/7 Priority Support',
    description: 'Skip the line with dedicated support',
    color: 'text-orange-600',
    bg: 'bg-orange-50'
  },
  {
    icon: Star,
    title: 'Exclusive Promotions',
    description: 'Prime-only deals and offers',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50'
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Book rides up to 30 days in advance',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50'
  }
];

export default function Prime() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check for existing subscription
      const subs = await base44.entities.PrimeSubscription.filter({
        user_id: currentUser.id
      }, '-created_date', 1);

      if (subs.length > 0 && subs[0].status === 'active') {
        setSubscription(subs[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const result = await base44.functions.invoke('createPrimeCheckout', {
        planId: selectedPlan.id
      });

      if (result.data?.success && result.data.url) {
        window.location.href = result.data.url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to start subscription');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleManageSubscription = async (action) => {
    try {
      const result = await base44.functions.invoke('managePrimeSubscription', {
        action: action,
        subscriptionId: subscription.stripe_subscription_id
      });

      if (result.data?.success) {
        toast.success(result.data.message);
        loadData();
      } else {
        toast.error('Failed to manage subscription');
      }
    } catch (error) {
      console.error('Management error:', error);
      toast.error('Failed to manage subscription');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
      </div>
    );
  }

  // Active subscription view
  if (subscription && subscription.status === 'active') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-4 lg:p-8">
        <Toaster richColors />
        
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full mb-4">
              <Crown className="w-6 h-6" />
              <span className="font-bold text-lg">PRIME MEMBER</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">You're a Prime Member!</h1>
            <p className="text-gray-600">Enjoy exclusive benefits on every ride</p>
          </motion.div>

          {/* Subscription Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-6 border-2 border-yellow-300 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-xl mb-1">
                      {PLANS.find(p => p.id === subscription.plan_id)?.name || 'Prime Membership'}
                    </h3>
                    <Badge className="bg-green-100 text-green-800">
                      {subscription.status === 'cancelled' ? 'Active until renewal' : 'Active'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {subscription.status === 'cancelled' ? 'Ends on' : 'Renews on'}
                    </p>
                    <p className="font-bold text-lg">
                      {format(new Date(subscription.renews_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {subscription.status !== 'cancelled' ? (
                    <Button
                      variant="outline"
                      onClick={() => handleManageSubscription('cancel')}
                      className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Cancel Membership
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleManageSubscription('reactivate')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Reactivate Membership
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = createPageUrl('BookRide')}
                    className="flex-1"
                  >
                    Book Prime Ride
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {BENEFITS.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${benefit.bg} flex items-center justify-center flex-shrink-0`}>
                        <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">{benefit.title}</h3>
                        <p className="text-sm text-gray-600">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Your Prime Savings</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">$0</p>
                    <p className="text-sm opacity-90">Saved This Month</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm opacity-90">Prime Rides</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold">$0</p>
                    <p className="text-sm opacity-90">Total Savings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Subscription plans view
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-4 lg:p-8">
      <Toaster richColors />
      
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full mb-6">
            <Crown className="w-6 h-6" />
            <span className="font-bold text-lg">RIDE-LY PRIME</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Ride More, Save More
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get 20% off every ride plus exclusive perks with Ride-ly Prime
          </p>
        </motion.div>

        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card className={`relative overflow-hidden transition-all cursor-pointer ${
                selectedPlan.id === plan.id 
                  ? 'border-4 border-yellow-400 shadow-2xl scale-105' 
                  : 'border-2 border-gray-200 hover:border-yellow-300 hover:shadow-lg'
              } ${plan.popular ? 'ring-2 ring-yellow-400' : ''}`}
              onClick={() => setSelectedPlan(plan)}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    BEST VALUE
                  </div>
                )}
                
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/{plan.interval}</span>
                  </div>
                  
                  {plan.savings && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <p className="text-green-800 font-semibold text-sm">
                        💰 Save {plan.savings}% with annual billing
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>20% off all rides</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>Priority driver matching</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>Free food delivery</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>24/7 priority support</span>
                    </div>
                  </div>

                  {selectedPlan.id === plan.id && (
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                    >
                      <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Subscribe Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-12"
        >
          <Button
            onClick={handleSubscribe}
            disabled={isSubscribing}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-12 py-6 text-xl font-bold shadow-2xl"
            size="lg"
          >
            {isSubscribing ? (
              <>
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Crown className="w-6 h-6 mr-2" />
                Get Prime - ${selectedPlan.price}/{selectedPlan.interval}
              </>
            )}
          </Button>
          <p className="text-sm text-gray-600 mt-3">
            Cancel anytime • No hidden fees
          </p>
        </motion.div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {BENEFITS.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-xl ${benefit.bg} flex items-center justify-center mb-4`}>
                    <benefit.icon className={`w-7 h-7 ${benefit.color}`} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-1 mb-3">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-xl font-semibold mb-2">
                "Prime has saved me over $200 this year!"
              </p>
              <p className="text-white/80 text-sm">
                Join 10,000+ happy Prime members
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold text-center mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-600 text-sm">
                  Yes! You can cancel your Prime membership at any time. You'll continue to enjoy benefits until the end of your billing period.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">How much will I save?</h3>
                <p className="text-gray-600 text-sm">
                  With 20% off all rides, if you take just 2-3 rides per week, you'll save more than the membership cost!
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">What payment methods are accepted?</h3>
                <p className="text-gray-600 text-sm">
                  We accept all major credit and debit cards through our secure Stripe payment processor.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}