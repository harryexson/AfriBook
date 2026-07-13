import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Copy, 
  Share2, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function ReferralsPage() {
  const [referralData, setReferralData] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [referralHistory, setReferralHistory] = useState([]);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('processReferral', {
        action: 'get_referral_code'
      });

      if (response.data?.success) {
        setReferralData(response.data);
        setReferralCode(response.data.referral_code);
      }

      // Load referral history
      const user = await base44.auth.me();
      const referrals = await base44.entities.Referral.filter({ referrer_id: user.id });
      setReferralHistory(referrals);
    } catch (error) {
      console.error('Error loading referral data:', error);
      toast.error('Could not load referral information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success('Referral code copied to clipboard!');
  };

  const handleShare = async () => {
    const shareText = `Join Ride-ly and get $5 off your first ride! Use my referral code: ${referralCode}`;
    const shareUrl = `${window.location.origin}/Landing?ref=${referralCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Ride-ly',
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success('Referral link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <Toaster richColors />
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Refer Friends, Earn Rewards</h1>
          <p className="text-lg text-gray-600">
            Share Ride-ly with friends and you both get rewarded!
          </p>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-purple-200 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Share2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">1. Share Your Code</h3>
                  <p className="text-sm text-gray-600">
                    Send your unique referral code to friends and family
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">2. They Sign Up</h3>
                  <p className="text-sm text-gray-600">
                    Your friend signs up and gets $5 off their first ride
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">3. You Both Earn</h3>
                  <p className="text-sm text-gray-600">
                    After their first ride, you get $10 in credits!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Referrals</p>
                  <p className="text-4xl font-bold mt-2">{referralData?.stats?.total_referrals || 0}</p>
                </div>
                <Users className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Completed</p>
                  <p className="text-4xl font-bold mt-2">{referralData?.stats?.completed || 0}</p>
                </div>
                <CheckCircle2 className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Earned</p>
                  <p className="text-4xl font-bold mt-2">${referralData?.stats?.total_earned || 0}</p>
                </div>
                <DollarSign className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-blue-200 bg-white">
            <CardHeader>
              <CardTitle>Your Referral Code</CardTitle>
              <CardDescription>Share this code with friends to start earning</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    value={referralCode}
                    readOnly
                    className="text-2xl font-bold text-center tracking-wider h-14 pr-12 bg-gray-50"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCopyCode}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleCopyCode} variant="outline" className="h-12">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
                <Button onClick={handleShare} className="h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Link
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  💡 <strong>Tip:</strong> Share your code on social media, text it to friends, or use the share button above to spread the word!
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral History */}
        {referralHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Referral History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {referralHistory.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          referral.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                        }`}>
                          {referral.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {referral.status === 'completed' ? 'Completed Referral' : 'Pending Referral'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(referral.created_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {referral.status === 'completed' && referral.referrer_reward?.claimed && (
                          <Badge className="bg-green-100 text-green-800">
                            +${referral.referrer_reward.value}
                          </Badge>
                        )}
                        {referral.status === 'pending' && (
                          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}