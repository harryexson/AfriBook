import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Reward } from "@/entities/Reward";
import { PointsTransaction } from "@/entities/PointsTransaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Star, Gift, Crown, TrendingUp,
  Clock, Sparkles, ShoppingBag, ArrowRight
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function PortalLoyaltySection({ loyaltyMember, tierInfo, onRefresh }) {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLoyaltyData();
  }, [loyaltyMember]);

  const loadLoyaltyData = async () => {
    setIsLoading(true);
    try {
      const activeRewards = await Reward.filter({ status: "active" });
      setRewards(activeRewards);

      if (loyaltyMember) {
        const history = await PointsTransaction.filter(
          { loyalty_member_id: loyaltyMember.id },
          "-created_date",
          20
        );
        setTransactions(history);
      }
    } catch (error) {
      console.error("Error loading loyalty data:", error);
    }
    setIsLoading(false);
  };

  if (!loyaltyMember) {
    return (
      <Card className="border-0 shadow-xl text-center p-12">
        <Star className="w-20 h-20 text-amber-400 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Join Our Rewards Program</h2>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Earn points on every order, unlock exclusive rewards, and enjoy special member benefits.
        </p>
        <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-2xl mx-auto">
          <div className="text-center p-4 bg-emerald-50 rounded-xl">
            <ShoppingBag className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-bold">Earn Points</h4>
            <p className="text-sm text-slate-600">Get points on every order</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <Gift className="w-10 h-10 text-purple-600 mx-auto mb-2" />
            <h4 className="font-bold">Redeem Rewards</h4>
            <p className="text-sm text-slate-600">Free items & discounts</p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-xl">
            <Crown className="w-10 h-10 text-amber-600 mx-auto mb-2" />
            <h4 className="font-bold">VIP Perks</h4>
            <p className="text-sm text-slate-600">Exclusive member benefits</p>
          </div>
        </div>
        <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8">
          Join Now - It's Free
        </Button>
      </Card>
    );
  }

  const currentTier = tierInfo[loyaltyMember.tier] || tierInfo.bronze;
  const TierIcon = currentTier.icon;

  const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
  const currentTierIndex = tierOrder.indexOf(loyaltyMember.tier);
  const nextTierKey = tierOrder[currentTierIndex + 1];
  const nextTier = nextTierKey ? tierInfo[nextTierKey] : null;

  return (
    <div className="space-y-6">
      {/* Loyalty Status Card */}
      <Card className={`border-0 shadow-2xl bg-gradient-to-br ${currentTier.color} text-white`}>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <TierIcon className="w-16 h-16" />
              <div>
                <p className="text-white/80 text-sm">Your Status</p>
                <h2 className="text-3xl font-bold">{currentTier.name} Member</h2>
                <p className="text-white/80">{loyaltyMember.customer_name}</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-white/80 text-sm">Available Points</p>
              <p className="text-5xl font-bold">{loyaltyMember.points_balance}</p>
            </div>
          </div>

          {nextTier && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex justify-between items-center mb-2 text-sm">
                <span>Progress to {nextTier.name}</span>
                <span>${loyaltyMember.lifetime_spend?.toFixed(0) || 0} spent</span>
              </div>
              <Progress value={Math.min((loyaltyMember.lifetime_spend || 0) / 500 * 100, 100)} className="h-3 bg-white/20" />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Available Rewards */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-6 h-6 text-purple-600" />
                Available Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading rewards...</div>
              ) : rewards.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No rewards available right now</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {rewards.slice(0, 4).map(reward => {
                    const canRedeem = loyaltyMember.points_balance >= reward.points_cost;
                    return (
                      <Card key={reward.id} className={`border-2 ${canRedeem ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'}`}>
                        <CardContent className="p-4">
                          <h4 className="font-bold text-slate-900 mb-1">{reward.title}</h4>
                          <p className="text-sm text-slate-600 mb-3">{reward.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-500" />
                              <span className="font-bold text-emerald-600">{reward.points_cost} pts</span>
                            </div>
                            <Button 
                              size="sm" 
                              disabled={!canRedeem}
                              className={canRedeem ? 'bg-emerald-600' : 'bg-slate-300'}
                            >
                              {canRedeem ? 'Redeem' : `Need ${reward.points_cost - loyaltyMember.points_balance} more`}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate(createPageUrl("CustomerLoyalty"))}
              >
                View All Rewards
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Points Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {tx.transaction_type === 'earned' && <TrendingUp className="w-4 h-4 text-green-600" />}
                        {tx.transaction_type === 'redeemed' && <Gift className="w-4 h-4 text-purple-600" />}
                        {tx.transaction_type === 'bonus' && <Sparkles className="w-4 h-4 text-amber-600" />}
                        <div>
                          <p className="text-sm font-medium text-slate-900">{tx.description || tx.transaction_type}</p>
                          <p className="text-xs text-slate-500">{format(new Date(tx.created_date), 'MMM d')}</p>
                        </div>
                      </div>
                      <span className={`font-bold ${tx.points_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.points_amount > 0 ? '+' : ''}{tx.points_amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-0 shadow-xl mt-6">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Lifetime Points Earned</span>
                <span className="font-bold">{loyaltyMember.points_balance + (transactions.filter(t => t.transaction_type === 'redeemed').reduce((s, t) => s + Math.abs(t.points_amount), 0))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Total Orders</span>
                <span className="font-bold">{loyaltyMember.visit_count || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Lifetime Spend</span>
                <span className="font-bold">${loyaltyMember.lifetime_spend?.toFixed(2) || '0.00'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}