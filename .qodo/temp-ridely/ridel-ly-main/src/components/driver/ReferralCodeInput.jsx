import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, CheckCircle2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ReferralCodeInput({ user, onApplied }) {
  const [referralCode, setReferralCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const hasReferralCode = user?.referred_by_driver;

  const handleApply = async () => {
    if (!referralCode.trim()) {
      toast.error('Please enter a referral code');
      return;
    }

    setIsApplying(true);
    try {
      const result = await base44.functions.invoke('processDriverReferral', {
        referralCode: referralCode.trim().toUpperCase()
      });

      if (result.data?.success) {
        toast.success(result.data.message || 'Referral code applied! 🎉');
        onApplied?.();
      } else {
        toast.error(result.data?.error || 'Invalid referral code');
      }
    } catch (error) {
      console.error('Error applying referral:', error);
      toast.error('Failed to apply referral code');
    } finally {
      setIsApplying(false);
    }
  };

  if (hasReferralCode) {
    return (
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Referral Code Applied!</p>
              <p className="text-sm text-green-700">
                Complete 20 rides to unlock your $50 bonus
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="w-5 h-5 text-purple-600" />
          Have a Referral Code?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Enter a referral code to earn a <strong>$50 bonus</strong> after completing 20 rides!
        </p>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="DRIVER-JOHN-ABCD"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="uppercase"
              disabled={isApplying}
            />
          </div>
          <Button
            onClick={handleApply}
            disabled={isApplying || !referralCode.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isApplying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Apply'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}