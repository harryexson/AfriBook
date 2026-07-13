import React, { useState, useEffect } from "react";
import { LoyaltyProgram } from "@/entities/LoyaltyProgram";
import { Reward } from "@/entities/Reward";
import { Restaurant } from "@/entities/Restaurant";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Award,
  Star,
  Gift,
  TrendingUp,
  Users,
  Settings,
  Save,
  Plus,
  Trash2,
  Eye,
  Mail,
  Crown,
  Trophy,
  Sparkles,
  DollarSign,
  CheckCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import RedemptionTracker from "@/components/loyalty/RedemptionTracker";

const tierIcons = {
  bronze: Award,
  silver: Star,
  gold: Trophy,
  platinum: Crown
};

const tierColors = {
  bronze: "from-amber-700 to-amber-600",
  silver: "from-slate-400 to-slate-500",
  gold: "from-yellow-500 to-yellow-600",
  platinum: "from-purple-500 to-purple-600"
};

export default function LoyaltyProgramSetup() {
  const [restaurant, setRestaurant] = useState(null);
  const [loyaltyProgram, setLoyaltyProgram] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  
  const [programData, setProgramData] = useState({
    program_name: "",
    status: "active",
    points_per_dollar: 10,
    bonus_points_enabled: false,
    birthday_bonus_points: 100,
    referral_bonus_points: 250,
    tiers: [
      {
        name: "Bronze",
        threshold: 0,
        color: "amber-700",
        benefits: ["Earn points on purchases", "Birthday bonus"],
        points_multiplier: 1,
        exclusive_rewards: []
      },
      {
        name: "Silver",
        threshold: 500,
        color: "slate-400",
        benefits: ["1.25x points multiplier", "Early access to promotions"],
        points_multiplier: 1.25,
        exclusive_rewards: []
      },
      {
        name: "Gold",
        threshold: 1000,
        color: "yellow-500",
        benefits: ["1.5x points multiplier", "Free delivery", "Priority support"],
        points_multiplier: 1.5,
        exclusive_rewards: []
      },
      {
        name: "Platinum",
        threshold: 2500,
        color: "purple-500",
        benefits: ["2x points multiplier", "Exclusive events", "VIP treatment"],
        points_multiplier: 2,
        exclusive_rewards: []
      }
    ],
    auto_upgrade_tiers: true,
    tier_downgrade_enabled: false,
    points_expiration_enabled: false,
    points_expiration_days: 365,
    welcome_message: "Welcome to our loyalty program! Start earning points with every purchase.",
    terms_and_conditions: "",
    email_notifications: {
      welcome_email: true,
      tier_upgrade: true,
      points_earned: true,
      reward_available: true,
      birthday_email: true
    }
  });

  const [newReward, setNewReward] = useState({
    title: "",
    description: "",
    points_cost: 0,
    discount_type: "percentage",
    discount_value: 0,
    min_order_amount: 0,
    tier_requirement: "any",
    status: "active"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      const restaurants = await Restaurant.filter({ owner_email: user.email });
      
      if (restaurants.length > 0) {
        const rest = restaurants[0];
        setRestaurant(rest);

        // Load existing loyalty program
        const programs = await LoyaltyProgram.filter({ restaurant_id: rest.id });
        if (programs.length > 0) {
          setLoyaltyProgram(programs[0]);
          setProgramData(programs[0]);
        } else {
          // Set default program name
          setProgramData(prev => ({
            ...prev,
            program_name: `${rest.business_name} Rewards`,
            restaurant_id: rest.id
          }));
        }

        // Load rewards
        const rewardsList = await Reward.filter({ restaurant_id: rest.id });
        setRewards(rewardsList);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleSaveProgram = async () => {
    setIsSaving(true);
    try {
      const dataToSave = {
        ...programData,
        restaurant_id: restaurant.id
      };

      if (loyaltyProgram) {
        await LoyaltyProgram.update(loyaltyProgram.id, dataToSave);
      } else {
        const newProgram = await LoyaltyProgram.create(dataToSave);
        setLoyaltyProgram(newProgram);
      }

      alert("Loyalty program saved successfully!");
    } catch (error) {
      console.error("Error saving program:", error);
      alert("Failed to save loyalty program");
    }
    setIsSaving(false);
  };

  const handleSaveReward = async () => {
    try {
      const rewardData = {
        ...newReward,
        restaurant_id: restaurant.id
      };

      if (editingReward) {
        await Reward.update(editingReward.id, rewardData);
      } else {
        await Reward.create(rewardData);
      }

      await loadData();
      setShowRewardDialog(false);
      setEditingReward(null);
      setNewReward({
        title: "",
        description: "",
        points_cost: 0,
        discount_type: "percentage",
        discount_value: 0,
        min_order_amount: 0,
        tier_requirement: "any",
        status: "active"
      });
    } catch (error) {
      console.error("Error saving reward:", error);
      alert("Failed to save reward");
    }
  };

  const handleDeleteReward = async (rewardId) => {
    if (!confirm("Are you sure you want to delete this reward?")) return;
    
    try {
      await Reward.delete(rewardId);
      await loadData();
    } catch (error) {
      console.error("Error deleting reward:", error);
    }
  };

  const updateTier = (index, field, value) => {
    const newTiers = [...programData.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setProgramData({ ...programData, tiers: newTiers });
  };

  const addBenefit = (tierIndex) => {
    const benefit = prompt("Enter new benefit:");
    if (benefit) {
      const newTiers = [...programData.tiers];
      newTiers[tierIndex].benefits = [...newTiers[tierIndex].benefits, benefit];
      setProgramData({ ...programData, tiers: newTiers });
    }
  };

  const removeBenefit = (tierIndex, benefitIndex) => {
    const newTiers = [...programData.tiers];
    newTiers[tierIndex].benefits = newTiers[tierIndex].benefits.filter((_, i) => i !== benefitIndex);
    setProgramData({ ...programData, tiers: newTiers });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-12">
          <p className="text-2xl font-bold text-slate-900 mb-4">No Restaurant Found</p>
          <p className="text-slate-600">Please set up your restaurant first</p>
        </Card>
      </div>
    );
  }

  const stats = {
    members: loyaltyProgram?.member_count || 0,
    activeMembers: loyaltyProgram?.active_member_count || 0,
    pointsIssued: loyaltyProgram?.total_points_issued || 0,
    pointsRedeemed: loyaltyProgram?.total_points_redeemed || 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Loyalty Program Setup</h1>
            <p className="text-slate-600">Configure your customer loyalty program for {restaurant.business_name}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {loyaltyProgram && (
              <Badge className={programData.status === "active" ? "bg-green-600" : "bg-amber-600"}>
                {programData.status}
              </Badge>
            )}
            <Button onClick={handleSaveProgram} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-5 h-5 mr-2" />
              {isSaving ? "Saving..." : "Save Program"}
            </Button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.members}</div>
              <div className="text-blue-100 text-sm">Total Members</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.activeMembers}</div>
              <div className="text-green-100 text-sm">Active Members</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.pointsIssued.toLocaleString()}</div>
              <div className="text-purple-100 text-sm">Points Issued</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Gift className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.pointsRedeemed.toLocaleString()}</div>
              <div className="text-amber-100 text-sm">Points Redeemed</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList>
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="tiers">Loyalty Tiers</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Basic Settings Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-6 h-6 text-emerald-600" />
                  Program Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label>Program Name *</Label>
                    <Input
                      value={programData.program_name}
                      onChange={(e) => setProgramData({...programData, program_name: e.target.value})}
                      placeholder="Joe's Pizza Rewards"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Program Status</Label>
                    <select
                      value={programData.status}
                      onChange={(e) => setProgramData({...programData, status: e.target.value})}
                      className="w-full mt-2 px-3 py-2 border rounded-lg"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-200">
                  <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Points Earning Rules
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label>Points Per Dollar Spent *</Label>
                      <Input
                        type="number"
                        value={programData.points_per_dollar}
                        onChange={(e) => setProgramData({...programData, points_per_dollar: parseFloat(e.target.value)})}
                        className="mt-2"
                      />
                      <p className="text-xs text-slate-600 mt-1">
                        Example: Customer spends $50, earns {programData.points_per_dollar * 50} points
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <p className="font-medium">Enable Bonus Points</p>
                          <p className="text-xs text-slate-600">Allow special point multipliers</p>
                        </div>
                        <Switch
                          checked={programData.bonus_points_enabled}
                          onCheckedChange={(checked) => setProgramData({...programData, bonus_points_enabled: checked})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <Label>Birthday Bonus Points</Label>
                      <Input
                        type="number"
                        value={programData.birthday_bonus_points}
                        onChange={(e) => setProgramData({...programData, birthday_bonus_points: parseInt(e.target.value)})}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Referral Bonus Points</Label>
                      <Input
                        type="number"
                        value={programData.referral_bonus_points}
                        onChange={(e) => setProgramData({...programData, referral_bonus_points: parseInt(e.target.value)})}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900">Advanced Settings</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">Auto-Upgrade Tiers</p>
                      <p className="text-sm text-slate-600">Automatically move customers to higher tiers</p>
                    </div>
                    <Switch
                      checked={programData.auto_upgrade_tiers}
                      onCheckedChange={(checked) => setProgramData({...programData, auto_upgrade_tiers: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">Enable Tier Downgrades</p>
                      <p className="text-sm text-slate-600">Downgrade inactive customers</p>
                    </div>
                    <Switch
                      checked={programData.tier_downgrade_enabled}
                      onCheckedChange={(checked) => setProgramData({...programData, tier_downgrade_enabled: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">Points Expiration</p>
                      <p className="text-sm text-slate-600">Make points expire after certain period</p>
                    </div>
                    <Switch
                      checked={programData.points_expiration_enabled}
                      onCheckedChange={(checked) => setProgramData({...programData, points_expiration_enabled: checked})}
                    />
                  </div>

                  {programData.points_expiration_enabled && (
                    <div>
                      <Label>Points Expiration (Days)</Label>
                      <Input
                        type="number"
                        value={programData.points_expiration_days}
                        onChange={(e) => setProgramData({...programData, points_expiration_days: parseInt(e.target.value)})}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label>Welcome Message</Label>
                  <Textarea
                    value={programData.welcome_message}
                    onChange={(e) => setProgramData({...programData, welcome_message: e.target.value})}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Terms & Conditions</Label>
                  <Textarea
                    value={programData.terms_and_conditions}
                    onChange={(e) => setProgramData({...programData, terms_and_conditions: e.target.value})}
                    className="mt-2"
                    rows={5}
                    placeholder="Enter program terms and conditions..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loyalty Tiers Tab */}
          <TabsContent value="tiers" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {programData.tiers.map((tier, index) => {
                const TierIcon = tierIcons[tier.name.toLowerCase()] || Award;
                
                return (
                  <Card key={index} className="border-0 shadow-xl">
                    <CardHeader className={`bg-gradient-to-br ${tierColors[tier.name.toLowerCase()]} text-white rounded-t-xl`}>
                      <div className="flex items-center gap-3">
                        <TierIcon className="w-8 h-8" />
                        <CardTitle className="text-2xl">{tier.name} Tier</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <Label>Spending Threshold ($)</Label>
                        <Input
                          type="number"
                          value={tier.threshold}
                          onChange={(e) => updateTier(index, 'threshold', parseFloat(e.target.value))}
                          className="mt-2"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Lifetime spend required to reach this tier
                        </p>
                      </div>

                      <div>
                        <Label>Points Multiplier</Label>
                        <Input
                          type="number"
                          step="0.25"
                          value={tier.points_multiplier}
                          onChange={(e) => updateTier(index, 'points_multiplier', parseFloat(e.target.value))}
                          className="mt-2"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          e.g., 1.5 = customers earn 50% more points
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Tier Benefits</Label>
                          <Button size="sm" variant="outline" onClick={() => addBenefit(index)}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {tier.benefits.map((benefit, bIdx) => (
                            <div key={bIdx} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="flex-1 text-sm">{benefit}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeBenefit(index, bIdx)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-6 h-6 text-emerald-600" />
                    Redemption Rewards
                  </CardTitle>
                  <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-5 h-5 mr-2" />
                        Create Reward
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingReward ? "Edit Reward" : "Create New Reward"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>Reward Title *</Label>
                            <Input
                              value={newReward.title}
                              onChange={(e) => setNewReward({...newReward, title: e.target.value})}
                              placeholder="Free Appetizer"
                            />
                          </div>
                          <div>
                            <Label>Points Cost *</Label>
                            <Input
                              type="number"
                              value={newReward.points_cost}
                              onChange={(e) => setNewReward({...newReward, points_cost: parseInt(e.target.value)})}
                              placeholder="500"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={newReward.description}
                            onChange={(e) => setNewReward({...newReward, description: e.target.value})}
                            placeholder="Get any appetizer free with your order"
                            rows={2}
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>Discount Type</Label>
                            <select
                              value={newReward.discount_type}
                              onChange={(e) => setNewReward({...newReward, discount_type: e.target.value})}
                              className="w-full px-3 py-2 border rounded-lg"
                            >
                              <option value="percentage">Percentage Off</option>
                              <option value="fixed_amount">Fixed Amount Off</option>
                              <option value="free_item">Free Item</option>
                            </select>
                          </div>
                          <div>
                            <Label>Discount Value</Label>
                            <Input
                              type="number"
                              value={newReward.discount_value}
                              onChange={(e) => setNewReward({...newReward, discount_value: parseFloat(e.target.value)})}
                              placeholder={newReward.discount_type === "percentage" ? "20" : "10"}
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>Minimum Order Amount ($)</Label>
                            <Input
                              type="number"
                              value={newReward.min_order_amount}
                              onChange={(e) => setNewReward({...newReward, min_order_amount: parseFloat(e.target.value)})}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label>Tier Requirement</Label>
                            <select
                              value={newReward.tier_requirement}
                              onChange={(e) => setNewReward({...newReward, tier_requirement: e.target.value})}
                              className="w-full px-3 py-2 border rounded-lg"
                            >
                              <option value="any">Any Tier</option>
                              <option value="bronze">Bronze+</option>
                              <option value="silver">Silver+</option>
                              <option value="gold">Gold+</option>
                              <option value="platinum">Platinum Only</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button variant="outline" onClick={() => {
                            setShowRewardDialog(false);
                            setEditingReward(null);
                          }} className="flex-1">
                            Cancel
                          </Button>
                          <Button onClick={handleSaveReward} className="flex-1 bg-emerald-600">
                            {editingReward ? "Update" : "Create"} Reward
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {rewards.length === 0 ? (
                  <div className="text-center py-12">
                    <Gift className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg mb-2">No rewards created yet</p>
                    <p className="text-slate-400 mb-6">Create rewards that customers can redeem with points</p>
                    <Button onClick={() => setShowRewardDialog(true)} className="bg-emerald-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Reward
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rewards.map(reward => (
                      <Card key={reward.id} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Star className="w-5 h-5 text-amber-500" />
                              <h3 className="font-bold text-lg">{reward.title}</h3>
                            </div>
                            <Badge className="bg-emerald-600">{reward.points_cost} pts</Badge>
                          </div>
                          
                          <p className="text-sm text-slate-600 mb-3">{reward.description}</p>
                          
                          <div className="text-sm text-slate-700 mb-3">
                            <strong>Value:</strong>{" "}
                            {reward.discount_type === "percentage" && `${reward.discount_value}% off`}
                            {reward.discount_type === "fixed_amount" && `$${reward.discount_value} off`}
                            {reward.discount_type === "free_item" && "Free item"}
                          </div>

                          {reward.tier_requirement !== "any" && (
                            <Badge variant="outline" className="mb-3 capitalize">
                              {reward.tier_requirement}+ Required
                            </Badge>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingReward(reward);
                                setNewReward(reward);
                                setShowRewardDialog(true);
                              }}
                              className="flex-1"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteReward(reward.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-blue-900 mb-3">💡 Reward Ideas</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-semibold text-sm">Free Appetizer</p>
                    <p className="text-xs text-slate-600">500 points</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-semibold text-sm">$10 Off Order</p>
                    <p className="text-xs text-slate-600">1000 points</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-semibold text-sm">Free Dessert</p>
                    <p className="text-xs text-slate-600">750 points</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-semibold text-sm">20% Off</p>
                    <p className="text-xs text-slate-600">1500 points</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-semibold text-sm">Free Delivery</p>
                    <p className="text-xs text-slate-600">250 points</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-semibold text-sm">BOGO Deal</p>
                    <p className="text-xs text-slate-600">2000 points</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-6 h-6 text-emerald-600" />
                  Email Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Welcome Email</p>
                    <p className="text-sm text-slate-600">Send email when customer joins program</p>
                  </div>
                  <Switch
                    checked={programData.email_notifications?.welcome_email}
                    onCheckedChange={(checked) => setProgramData({
                      ...programData,
                      email_notifications: { ...programData.email_notifications, welcome_email: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Tier Upgrade</p>
                    <p className="text-sm text-slate-600">Notify when customer reaches new tier</p>
                  </div>
                  <Switch
                    checked={programData.email_notifications?.tier_upgrade}
                    onCheckedChange={(checked) => setProgramData({
                      ...programData,
                      email_notifications: { ...programData.email_notifications, tier_upgrade: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Points Earned</p>
                    <p className="text-sm text-slate-600">Notify after each purchase with points earned</p>
                  </div>
                  <Switch
                    checked={programData.email_notifications?.points_earned}
                    onCheckedChange={(checked) => setProgramData({
                      ...programData,
                      email_notifications: { ...programData.email_notifications, points_earned: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Reward Available</p>
                    <p className="text-sm text-slate-600">Notify when customer has enough points for a reward</p>
                  </div>
                  <Switch
                    checked={programData.email_notifications?.reward_available}
                    onCheckedChange={(checked) => setProgramData({
                      ...programData,
                      email_notifications: { ...programData.email_notifications, reward_available: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium">Birthday Email</p>
                    <p className="text-sm text-slate-600">Send birthday wishes with bonus points</p>
                  </div>
                  <Switch
                    checked={programData.email_notifications?.birthday_email}
                    onCheckedChange={(checked) => setProgramData({
                      ...programData,
                      email_notifications: { ...programData.email_notifications, birthday_email: checked }
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Redemptions Tab */}
          <TabsContent value="redemptions" className="space-y-6">
            <RedemptionTracker restaurantId={restaurant?.id} />
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-6 h-6 text-emerald-600" />
                  Customer View Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-b from-slate-50 to-white p-8 rounded-xl">
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-6">
                      {programData.program_name}
                    </h2>
                    
                    <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
                      <p className="text-slate-700 text-center">{programData.welcome_message}</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 mb-8">
                      {programData.tiers.map((tier, idx) => {
                        const TierIcon = tierIcons[tier.name.toLowerCase()];
                        return (
                          <div key={idx} className={`bg-gradient-to-br ${tierColors[tier.name.toLowerCase()]} text-white rounded-xl p-4 text-center`}>
                            <TierIcon className="w-8 h-8 mx-auto mb-2" />
                            <h3 className="font-bold text-lg">{tier.name}</h3>
                            <p className="text-xs opacity-90">${tier.threshold}+ spent</p>
                            <p className="text-sm mt-2">{tier.points_multiplier}x Points</p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-200 text-center">
                      <Sparkles className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                      <h3 className="text-2xl font-bold text-emerald-900 mb-2">
                        Earn {programData.points_per_dollar} Points Per $1 Spent
                      </h3>
                      <p className="text-emerald-700">
                        Redeem points for exclusive rewards and discounts
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}