import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoyaltyMember } from "@/entities/LoyaltyMember";
import { LoyaltyProgram } from "@/entities/LoyaltyProgram";
import { Reward } from "@/entities/Reward";
import { PointsTransaction } from "@/entities/PointsTransaction";
import { PersonalizedOffer } from "@/entities/PersonalizedOffer";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Star, Award, Gift, TrendingUp, Sparkles, Trophy,
  Clock, ShoppingBag, Check, Crown,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import PersonalizedOfferCard from "../components/loyalty/PersonalizedOfferCard";
import { syncUnclaimedPoints } from "@/hooks/useLoyaltyEngine";

export default function CustomerLoyalty() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loyaltyMember, setLoyaltyMember] = useState(null);
  const [loyaltyProgram, setLoyaltyProgram] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [personalizedOffers, setPersonalizedOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [redeemingReward, setRedeemingReward] = useState(null);

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  const loadLoyaltyData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load loyalty member
      let members = await LoyaltyMember.filter({ email: currentUser.email });
      let member;

      if (members.length === 0) {
        // Create new loyalty member
        member = await LoyaltyMember.create({
          customer_name: currentUser.full_name,
          email: currentUser.email,
          phone: currentUser.phone || "",
          points_balance: 0,
          tier: "bronze",
          lifetime_spend: 0,
          visit_count: 0
        });
      } else {
        member = members[0];
      }

      setLoyaltyMember(member);

      // Auto-award any unclaimed points from completed orders
      const newlyAwarded = await syncUnclaimedPoints(currentUser.email);
      if (newlyAwarded > 0) {
        // Re-fetch member with updated balance
        const updated = await LoyaltyMember.filter({ email: currentUser.email });
        if (updated.length > 0) {
          member = updated[0];
          setLoyaltyMember(updated[0]);
        }
      }

      // Load loyalty program (get first active one for demo, in production filter by restaurant)
      const programs = await LoyaltyProgram.filter({ status: "active" });
      if (programs.length > 0) {
        setLoyaltyProgram(programs[0]);
      }

      // Load available rewards
      const activeRewards = await Reward.filter({ status: "active" });
      setRewards(activeRewards);

      // Load transaction history
      const history = await PointsTransaction.filter(
        { loyalty_member_id: member.id },
        "-created_date",
        50
      );
      setTransactions(history);

      // Load personalized offers
      const offers = await PersonalizedOffer.filter({
        loyalty_member_id: member.id,
        status: "active"
      });
      setPersonalizedOffers(offers);

    } catch (error) {
      console.error("Error loading loyalty data:", error);
    }
    setIsLoading(false);
  };

  const handleRedeemReward = async (reward) => {
    if (!loyaltyMember || loyaltyMember.points_balance < reward.points_cost) {
      alert("Insufficient points");
      return;
    }

    if (reward.tier_requirement !== "any") {
      const tierHierarchy = ["bronze", "silver", "gold", "platinum"];
      const userTierIndex = tierHierarchy.indexOf(loyaltyMember.tier);
      const requiredTierIndex = tierHierarchy.indexOf(reward.tier_requirement);
      
      if (userTierIndex < requiredTierIndex) {
        alert(`This reward requires ${reward.tier_requirement} tier or higher`);
        return;
      }
    }

    setRedeemingReward(reward.id);

    try {
      const newBalance = loyaltyMember.points_balance - reward.points_cost;

      // Create transaction
      await PointsTransaction.create({
        loyalty_member_id: loyaltyMember.id,
        customer_name: loyaltyMember.customer_name,
        customer_email: loyaltyMember.email,
        transaction_type: "redeemed",
        points_amount: -reward.points_cost,
        reward_id: reward.id,
        description: `Redeemed: ${reward.title}`,
        previous_balance: loyaltyMember.points_balance,
        new_balance: newBalance
      });

      // Update loyalty member
      await LoyaltyMember.update(loyaltyMember.id, {
        points_balance: newBalance
      });

      // Update reward redemption count
      await Reward.update(reward.id, {
        total_redemptions: (reward.total_redemptions || 0) + 1
      });

      // Email the customer their redemption confirmation
      await base44.integrations.Core.SendEmail({
        to: loyaltyMember.email,
        subject: `🎁 Reward redeemed: ${reward.title}`,
        body: `Hi ${loyaltyMember.customer_name},\n\nYou've successfully redeemed your reward!\n\n🎁 Reward: ${reward.title}\n💳 Points used: ${reward.points_cost}\n💰 Remaining balance: ${newBalance} pts\n\nHow to use it:\n${reward.discount_type === 'percentage' ? `Show this email to staff to get ${reward.discount_value}% off your order.` : reward.discount_type === 'fixed_amount' ? `Show this email to staff to get $${reward.discount_value} off your order.` : 'Show this email to staff to claim your free item.'}\n\nThank you for your loyalty!\nRESTROBUDDY`
      }).catch(e => console.error("Failed to send redemption email:", e));

      alert(`Successfully redeemed ${reward.title}! Check your email for details and show it to staff.`);
      
      // Reload data
      await loadLoyaltyData();
    } catch (error) {
      console.error("Error redeeming reward:", error);
      alert("Failed to redeem reward. Please try again.");
    }

    setRedeemingReward(null);
  };

  const handleRedeemOffer = async (offer) => {
    // Mark offer as used
    try {
      await PersonalizedOffer.update(offer.id, {
        status: "redeemed",
        redeemed_date: new Date().toISOString(),
        usage_count: (offer.usage_count || 0) + 1
      });

      alert(`Offer redeemed! Use code: ${offer.id.slice(-8).toUpperCase()} at checkout`);
      await loadLoyaltyData();
    } catch (error) {
      console.error("Error redeeming offer:", error);
      alert("Failed to redeem offer");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading loyalty program...</p>
        </div>
      </div>
    );
  }

  const tierInfo = loyaltyProgram?.tiers?.find(t => t.name.toLowerCase() === loyaltyMember?.tier) || {
    name: "Bronze",
    color: "from-amber-700 to-amber-600",
    benefits: [],
    points_multiplier: 1,
    threshold: 0
  };

  const nextTier = loyaltyProgram?.tiers?.find(t => t.threshold > (loyaltyMember?.lifetime_spend || 0));
  const progressToNextTier = nextTier
    ? ((loyaltyMember?.lifetime_spend || 0) / nextTier.threshold) * 100
    : 100;

  const tierIcons = {
    bronze: Award,
    silver: Star,
    gold: Trophy,
    platinum: Crown
  };

  const TierIcon = tierIcons[loyaltyMember?.tier] || Award;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            {loyaltyProgram?.program_name || "Loyalty Program"}
          </h1>
          <p className="text-slate-600">Earn points, unlock rewards, and enjoy exclusive benefits</p>
        </div>

        {/* Personalized Offers Section */}
        {personalizedOffers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              Just For You - Personalized Offers
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {personalizedOffers.map(offer => (
                <PersonalizedOfferCard
                  key={offer.id}
                  offer={offer}
                  onRedeem={() => handleRedeemOffer(offer)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tier Status Card */}
        <Card className={`border-0 shadow-2xl bg-gradient-to-br ${tierInfo.color} text-white mb-8`}>
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <TierIcon className="w-12 h-12" />
                  <div>
                    <h2 className="text-3xl font-bold">{tierInfo.name} Member</h2>
                    <p className="text-white/80">{loyaltyMember?.customer_name}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold mb-1">{loyaltyMember?.points_balance || 0}</div>
                <div className="text-white/90 text-lg">Points Available</div>
              </div>
            </div>

            {loyaltyProgram && (
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="font-semibold">Earning Rate:</span>
                </div>
                <p className="text-white/90">
                  {loyaltyProgram.points_per_dollar * tierInfo.points_multiplier} points per $1 spent
                  {tierInfo.points_multiplier > 1 && (
                    <span className="ml-2 px-2 py-1 bg-amber-500 text-white text-xs rounded-full">
                      {tierInfo.points_multiplier}x multiplier
                    </span>
                  )}
                </p>
              </div>
            )}

            {nextTier && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold">Progress to {nextTier.name}</span>
                  <span className="text-sm">${loyaltyMember?.lifetime_spend || 0} / ${nextTier.threshold}</span>
                </div>
                <Progress value={progressToNextTier} className="h-3 bg-white/20" />
                <p className="text-xs text-white/70 mt-2">
                  ${(nextTier.threshold - (loyaltyMember?.lifetime_spend || 0)).toFixed(2)} more to unlock {nextTier.name}!
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
              <div className="text-center">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{loyaltyMember?.visit_count || 0}</div>
                <div className="text-sm text-white/80">Total Orders</div>
              </div>
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">${(loyaltyMember?.lifetime_spend || 0).toFixed(2)}</div>
                <div className="text-sm text-white/80">Lifetime Spend</div>
              </div>
              <div className="text-center">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {loyaltyMember?.last_visit_date 
                    ? format(new Date(loyaltyMember.last_visit_date), 'MMM d')
                    : 'N/A'}
                </div>
                <div className="text-sm text-white/80">Last Visit</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="rewards" className="mb-8">
          <TabsList className="bg-white border border-slate-200 p-2 rounded-xl shadow-md">
            <TabsTrigger value="rewards" className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Gift className="w-4 h-4 mr-2" />
              Available Rewards
            </TabsTrigger>
            <TabsTrigger value="benefits" className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              Tier Benefits
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Clock className="w-4 h-4 mr-2" />
              Points History
            </TabsTrigger>
          </TabsList>

          {/* Rewards Tab */}
          <TabsContent value="rewards">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards
                .filter(reward => {
                  if (reward.tier_requirement === "any") return true;
                  const tierHierarchy = ["bronze", "silver", "gold", "platinum"];
                  const userTierIndex = tierHierarchy.indexOf(loyaltyMember?.tier || "bronze");
                  const requiredTierIndex = tierHierarchy.indexOf(reward.tier_requirement);
                  return userTierIndex >= requiredTierIndex;
                })
                .map(reward => {
                  const canAfford = (loyaltyMember?.points_balance || 0) >= reward.points_cost;
                  
                  return (
                    <Card key={reward.id} className={`border-2 ${canAfford ? 'border-emerald-200' : 'border-slate-200'}`}>
                      <CardContent className="p-6">
                        {reward.image_url && (
                          <div className="h-32 mb-4 rounded-lg overflow-hidden bg-slate-100">
                            <img src={reward.image_url} alt={reward.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-slate-900 mb-2">{reward.title}</h3>
                          <p className="text-slate-600 text-sm mb-3">{reward.description}</p>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="w-5 h-5 text-amber-500" />
                            <span className="text-2xl font-bold text-emerald-600">{reward.points_cost}</span>
                            <span className="text-slate-600">points</span>
                          </div>

                          {reward.tier_requirement !== "any" && (
                            <Badge className="bg-purple-100 text-purple-800 mb-2">
                              {reward.tier_requirement.charAt(0).toUpperCase() + reward.tier_requirement.slice(1)} tier required
                            </Badge>
                          )}

                          {reward.discount_type === "percentage" && (
                            <p className="text-sm text-emerald-600 font-semibold">
                              {reward.discount_value}% off your order
                            </p>
                          )}
                          {reward.discount_type === "fixed_amount" && (
                            <p className="text-sm text-emerald-600 font-semibold">
                              ${reward.discount_value} off your order
                            </p>
                          )}
                          {reward.discount_type === "free_item" && (
                            <p className="text-sm text-emerald-600 font-semibold">
                              Free item included
                            </p>
                          )}

                          {reward.min_order_amount > 0 && (
                            <p className="text-xs text-slate-500 mt-1">
                              Min order: ${reward.min_order_amount}
                            </p>
                          )}
                        </div>

                        <Button
                          onClick={() => handleRedeemReward(reward)}
                          disabled={!canAfford || redeemingReward === reward.id}
                          className={`w-full ${canAfford ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300'}`}
                        >
                          {redeemingReward === reward.id ? (
                            'Redeeming...'
                          ) : canAfford ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Redeem Now
                            </>
                          ) : (
                            `Need ${reward.points_cost - (loyaltyMember?.points_balance || 0)} more points`
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}

              {rewards.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="text-center py-12">
                    <Gift className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-xl font-semibold text-slate-900 mb-2">No rewards available</p>
                    <p className="text-slate-600">Check back soon for exciting rewards!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Benefits Tab */}
          <TabsContent value="benefits">
            <div className="grid md:grid-cols-2 gap-6">
              {loyaltyProgram?.tiers?.map((tier) => {
                const TierIcon = tierIcons[tier.name.toLowerCase()] || Award;
                const isCurrentTier = tier.name.toLowerCase() === loyaltyMember?.tier;
                
                return (
                  <Card key={tier.name} className={`border-2 ${isCurrentTier ? 'border-emerald-500 bg-emerald-50' : ''}`}>
                    <CardHeader className={`bg-gradient-to-br ${tier.color} text-white rounded-t-xl`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <TierIcon className="w-10 h-10" />
                          <CardTitle className="text-2xl">{tier.name}</CardTitle>
                        </div>
                        {isCurrentTier && (
                          <Badge className="bg-white text-emerald-700">Current</Badge>
                        )}
                      </div>
                      {tier.threshold > 0 && (
                        <p className="text-white/80 text-sm mt-2">
                          Requires ${tier.threshold} lifetime spend
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-5 h-5 text-amber-500" />
                          <span className="font-semibold">Points Multiplier: {tier.points_multiplier}x</span>
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-900 mb-3">Benefits:</h4>
                      <ul className="space-y-2">
                        {tier.benefits?.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-700">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Points Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No transactions yet</p>
                    <p className="text-sm text-slate-500 mt-2">Start ordering to earn points!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map(transaction => (
                      <div key={transaction.id} className="flex justify-between items-start p-4 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {transaction.transaction_type === 'earned' && (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            )}
                            {transaction.transaction_type === 'redeemed' && (
                              <Gift className="w-4 h-4 text-purple-600" />
                            )}
                            {transaction.transaction_type === 'bonus' && (
                              <Sparkles className="w-4 h-4 text-amber-600" />
                            )}
                            <span className="font-semibold text-slate-900">
                              {transaction.description || transaction.transaction_type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {format(new Date(transaction.created_date), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${
                            transaction.points_amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.points_amount > 0 ? '+' : ''}{transaction.points_amount}
                          </div>
                          <div className="text-xs text-slate-500">
                            Balance: {transaction.new_balance}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">How to Earn Points</h3>
            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div>
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-8 h-8 text-emerald-600" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Every Order</h4>
                <p className="text-slate-600 text-sm">
                  {loyaltyProgram ? `Earn ${loyaltyProgram.points_per_dollar * tierInfo.points_multiplier} points per $1 spent` : "Earn points with every purchase"}
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Bonus Events</h4>
                <p className="text-slate-600 text-sm">Double points days and special promotions</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Gift className="w-8 h-8 text-amber-600" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">Birthday Bonus</h4>
                <p className="text-slate-600 text-sm">
                  {loyaltyProgram?.birthday_bonus_points 
                    ? `Get ${loyaltyProgram.birthday_bonus_points} bonus points on your birthday`
                    : "Special points on your birthday"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}