import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gift, Copy, Users, DollarSign, CheckCircle2, Clock, Loader2, Share2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function DriverReferrals() {
  const [user, setUser] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    qualified: 0,
    completed: 0,
    totalEarned: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Get or generate referral code
      if (currentUser.driver_referral_code) {
        setReferralCode(currentUser.driver_referral_code);
      } else {
        await generateReferralCode();
      }

      // Load referrals
      const myReferrals = await base44.entities.DriverReferral.filter({
        referrer_driver_id: currentUser.id
      }, '-created_date');

      setReferrals(myReferrals);

      // Calculate stats
      const stats = {
        total: myReferrals.length,
        pending: myReferrals.filter(r => r.status === 'pending').length,
        qualified: myReferrals.filter(r => r.status === 'qualified').length,
        completed: myReferrals.filter(r => r.status === 'completed').length,
        totalEarned: myReferrals
          .filter(r => r.referrer_reward?.claimed)
          .reduce((sum, r) => sum + (r.referrer_reward.amount || 0), 0)
      };

      setStats(stats);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateReferralCode = async () => {
    setGeneratingCode(true);
    try {
      const result = await base44.functions.invoke('generateDriverReferralCode', {});
      
      if (result.data?.success) {
        setReferralCode(result.data.referral_code);
        const updatedUser = await base44.auth.me();
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error('Failed to generate referral code');
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied to clipboard!');
  };

  const shareReferral = async () => {
    const shareText = `Join Ride-ly as a driver and earn money on your schedule! Use my referral code ${referralCode} to get a $50 bonus after completing 20 rides. Sign up now!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Ride-ly as a Driver',
          text: shareText
        });
      } catch (error) {
        // User cancelled or error occurred
        copyReferralCode();
      }
    } else {
      copyReferralCode();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!user || (user.user_type !== 'driver' && user.user_type !== 'both')) {
    return (
      <Card className="max-w-md mx-auto mt-12">
        <CardContent className="p-8 text-center">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Driver Referrals</h2>
          <p className="text-gray-600">This feature is only available to drivers</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 lg:p-8">
      <Toaster richColors />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Driver Referral Program</h1>
          <p className="text-gray-600">Invite other drivers and earn $100 for each successful referral</p>
        </div>

        {/* Referral Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0 shadow-2xl">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Your Referral Code</h2>
                  <p className="text-blue-100 text-sm">Share with potential drivers</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm mb-2">Your unique code</p>
                    <p className="text-4xl font-bold tracking-wider font-mono">
                      {generatingCode ? '...' : referralCode}
                    </p>
                  </div>
                  <Button
                    onClick={copyReferralCode}
                    className="bg-white text-blue-600 hover:bg-blue-50"
                    disabled={generatingCode}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={shareReferral}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  variant="outline"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Code
                </Button>
                <Button
                  onClick={() => {
                    const message = `Join Ride-ly as a driver! Use code ${referralCode} for a $50 bonus.`;
                    window.open(`sms:?&body=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  variant="outline"
                >
                  📱 Send SMS
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Referrals</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Users className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">In Progress</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Earned</p>
                  <p className="text-3xl font-bold text-green-600">${stats.totalEarned}</p>
                </div>
                <DollarSign className="w-10 h-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">1. Share Your Code</h3>
                <p className="text-sm text-gray-600">
                  Share your referral code with friends who want to drive
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">2. They Sign Up</h3>
                <p className="text-sm text-gray-600">
                  New driver completes onboarding and starts driving
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">3. Earn Rewards</h3>
                <p className="text-sm text-gray-600">
                  Get $100 when they complete 20 rides within 90 days
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mt-6">
              <p className="text-sm font-semibold text-green-900">💰 Referral Rewards</p>
              <ul className="text-sm text-green-800 mt-2 space-y-1">
                <li>• You earn: <strong>$100 cash bonus</strong></li>
                <li>• New driver earns: <strong>$50 cash bonus</strong></li>
                <li>• No limit on referrals - refer as many drivers as you want!</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Referrals List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referrals ({referrals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No referrals yet</p>
                <p className="text-sm text-gray-400">Start sharing your referral code to earn bonuses!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {referrals.map((referral) => {
                  const progress = (referral.qualifying_rides_completed / referral.qualifying_rides_required) * 100;
                  const remaining = referral.qualifying_rides_required - referral.qualifying_rides_completed;

                  return (
                    <motion.div
                      key={referral.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="border-2">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                                referral.status === 'completed' ? 'bg-green-500' :
                                referral.status === 'qualified' ? 'bg-blue-500' :
                                'bg-gray-400'
                              }`}>
                                {referral.status === 'completed' ? (
                                  <CheckCircle2 className="w-6 h-6" />
                                ) : (
                                  <Users className="w-6 h-6" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-lg">New Driver Referral</p>
                                <p className="text-sm text-gray-500">
                                  Referred on {format(new Date(referral.created_date), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>

                            <Badge className={
                              referral.status === 'completed' ? 'bg-green-100 text-green-800' :
                              referral.status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {referral.status === 'completed' ? '✅ Completed' :
                               referral.status === 'qualified' ? '🎉 Qualified' :
                               '⏳ In Progress'}
                            </Badge>
                          </div>

                          {referral.status === 'pending' && (
                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <span className="text-gray-600">
                                    Rides Completed: {referral.qualifying_rides_completed} / {referral.qualifying_rides_required}
                                  </span>
                                  <span className="font-semibold text-blue-600">
                                    {remaining} rides to go
                                  </span>
                                </div>
                                <Progress value={progress} className="h-3" />
                              </div>

                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                  <strong>💰 Potential Bonus:</strong> ${referral.referrer_reward?.amount || 100} when they complete {remaining} more ride{remaining !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          )}

                          {referral.status === 'qualified' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                <div>
                                  <p className="font-semibold text-blue-900">Referral Qualified!</p>
                                  <p className="text-sm text-blue-700">
                                    Your ${referral.referrer_reward?.amount || 100} bonus will be processed shortly
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {referral.status === 'completed' && referral.referrer_reward?.claimed && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  <div>
                                    <p className="font-semibold text-green-900">Bonus Received!</p>
                                    <p className="text-sm text-green-700">
                                      ${referral.referrer_reward.amount} added to your earnings
                                    </p>
                                  </div>
                                </div>
                                {referral.referrer_reward.claimed_at && (
                                  <p className="text-xs text-green-600">
                                    {format(new Date(referral.referrer_reward.claimed_at), 'MMM d, yyyy')}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Referral Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>Share on social media:</strong> Post your code on Facebook, Twitter, or Instagram
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>Word of mouth:</strong> Tell friends, family, and colleagues about the opportunity
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>Join driver communities:</strong> Share in local driver forums and groups
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>Highlight the benefits:</strong> Flexible schedule, competitive earnings, instant payouts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}