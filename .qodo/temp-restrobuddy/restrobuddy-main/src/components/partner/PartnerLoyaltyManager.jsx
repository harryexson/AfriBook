import React, { useState, useEffect } from "react";
import { LoyaltyProgram } from "@/entities/LoyaltyProgram";
import { LoyaltyMember } from "@/entities/LoyaltyMember";
import { Reward } from "@/entities/Reward";
import { PointsTransaction } from "@/entities/PointsTransaction";
import { PersonalizedOffer } from "@/entities/PersonalizedOffer";
import { Notification } from "@/entities/Notification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Award, Star, Gift, Users, Plus, Edit, Trash2,
  Search, Send, Settings, History
} from "lucide-react";
import { format } from "date-fns";

export default function PartnerLoyaltyManager({ restaurant }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loyaltyProgram, setLoyaltyProgram] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [showPromoDialog, setShowPromoDialog] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [programForm, setProgramForm] = useState({
    program_name: "",
    status: "draft",
    points_per_dollar: 10,
    birthday_bonus_points: 100,
    referral_bonus_points: 50,
    welcome_message: "",
    points_expiration_enabled: false,
    points_expiration_days: 365
  });

  const [rewardForm, setRewardForm] = useState({
    title: "",
    description: "",
    points_cost: 100,
    discount_type: "percentage",
    discount_value: 10,
    min_order_amount: 0,
    tier_requirement: "any",
    usage_limit_per_customer: 1,
    status: "active"
  });

  const [promoForm, setPromoForm] = useState({
    title: "",
    description: "",
    offer_type: "bonus_points",
    bonus_points_amount: 50,
    discount_value: 0,
    valid_days: 7
  });

  useEffect(() => {
    loadLoyaltyData();
  }, [restaurant]);

  const loadLoyaltyData = async () => {
    setIsLoading(true);
    try {
      // Load or create loyalty program
      const programs = await LoyaltyProgram.filter({ restaurant_id: restaurant.id });
      if (programs.length > 0) {
        setLoyaltyProgram(programs[0]);
        setProgramForm({
          program_name: programs[0].program_name || "",
          status: programs[0].status || "draft",
          points_per_dollar: programs[0].points_per_dollar || 10,
          birthday_bonus_points: programs[0].birthday_bonus_points || 100,
          referral_bonus_points: programs[0].referral_bonus_points || 50,
          welcome_message: programs[0].welcome_message || "",
          points_expiration_enabled: programs[0].points_expiration_enabled || false,
          points_expiration_days: programs[0].points_expiration_days || 365
        });
      }

      // Load rewards
      const allRewards = await Reward.filter({ restaurant_id: restaurant.id });
      setRewards(allRewards);

      // Load members (customers who have ordered from this restaurant)
      const allMembers = await LoyaltyMember.filter({ restaurant_id: restaurant.id });
      setMembers(allMembers);

      // Load recent transactions
      const recentTransactions = await PointsTransaction.filter(
        { restaurant_id: restaurant.id },
        "-created_date",
        100
      );
      setTransactions(recentTransactions);

    } catch (error) {
      console.error("Error loading loyalty data:", error);
    }
    setIsLoading(false);
  };

  const handleSaveProgram = async () => {
    setIsSaving(true);
    try {
      const programData = {
        ...programForm,
        restaurant_id: restaurant.id
      };

      if (loyaltyProgram) {
        await LoyaltyProgram.update(loyaltyProgram.id, programData);
      } else {
        await LoyaltyProgram.create(programData);
      }
      
      await loadLoyaltyData();
      alert("Loyalty program saved!");
    } catch (error) {
      console.error("Error saving program:", error);
      alert("Failed to save program");
    }
    setIsSaving(false);
  };

  const handleSaveReward = async () => {
    if (!rewardForm.title || !rewardForm.points_cost) {
      alert("Please fill in required fields");
      return;
    }

    setIsSaving(true);
    try {
      const rewardData = {
        ...rewardForm,
        restaurant_id: restaurant.id
      };

      if (editingReward) {
        await Reward.update(editingReward.id, rewardData);
      } else {
        await Reward.create(rewardData);
      }

      setShowRewardDialog(false);
      resetRewardForm();
      await loadLoyaltyData();
    } catch (error) {
      console.error("Error saving reward:", error);
      alert("Failed to save reward");
    }
    setIsSaving(false);
  };

  const handleDeleteReward = async (reward) => {
    if (!confirm(`Delete "${reward.title}"?`)) return;
    
    try {
      await Reward.delete(reward.id);
      await loadLoyaltyData();
    } catch (error) {
      console.error("Error deleting reward:", error);
    }
  };

  const handleSendPromotion = async () => {
    if (!promoForm.title || selectedMembers.length === 0) {
      alert("Please fill in promotion details and select members");
      return;
    }

    setIsSaving(true);
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + promoForm.valid_days);

      for (const member of selectedMembers) {
        // Create personalized offer
        await PersonalizedOffer.create({
          restaurant_id: restaurant.id,
          loyalty_member_id: member.id,
          customer_email: member.email,
          offer_type: promoForm.offer_type,
          title: promoForm.title,
          description: promoForm.description,
          bonus_points_amount: promoForm.bonus_points_amount,
          discount_value: promoForm.discount_value,
          discount_type: promoForm.offer_type === "discount" ? "percentage" : null,
          valid_from: new Date().toISOString(),
          valid_until: validUntil.toISOString(),
          status: "active",
          trigger_reason: "custom"
        });

        // Send notification
        await Notification.create({
          customer_email: member.email,
          title: `🎁 ${promoForm.title}`,
          message: promoForm.description || `Special offer from ${restaurant.business_name}!`,
          type: "offer",
          priority: "high",
          status: "unread",
          icon: "gift"
        });
      }

      setShowPromoDialog(false);
      setSelectedMembers([]);
      setPromoForm({
        title: "",
        description: "",
        offer_type: "bonus_points",
        bonus_points_amount: 50,
        discount_value: 0,
        valid_days: 7
      });
      alert(`Promotion sent to ${selectedMembers.length} members!`);
    } catch (error) {
      console.error("Error sending promotion:", error);
      alert("Failed to send promotion");
    }
    setIsSaving(false);
  };

  const resetRewardForm = () => {
    setRewardForm({
      title: "",
      description: "",
      points_cost: 100,
      discount_type: "percentage",
      discount_value: 10,
      min_order_amount: 0,
      tier_requirement: "any",
      usage_limit_per_customer: 1,
      status: "active"
    });
    setEditingReward(null);
  };

  const handleEditReward = (reward) => {
    setEditingReward(reward);
    setRewardForm({
      title: reward.title,
      description: reward.description || "",
      points_cost: reward.points_cost,
      discount_type: reward.discount_type || "percentage",
      discount_value: reward.discount_value || 10,
      min_order_amount: reward.min_order_amount || 0,
      tier_requirement: reward.tier_requirement || "any",
      usage_limit_per_customer: reward.usage_limit_per_customer || 1,
      status: reward.status || "active"
    });
    setShowRewardDialog(true);
  };

  const toggleMemberSelection = (member) => {
    setSelectedMembers(prev => {
      if (prev.find(m => m.id === member.id)) {
        return prev.filter(m => m.id !== member.id);
      }
      return [...prev, member];
    });
  };

  const selectAllMembers = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers([...filteredMembers]);
    }
  };

  const filteredMembers = members.filter(m =>
    m.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalMembers: members.length,
    activeMembers: members.filter(m => m.status === "active").length,
    totalPointsIssued: transactions.filter(t => t.points_amount > 0).reduce((sum, t) => sum + t.points_amount, 0),
    totalPointsRedeemed: Math.abs(transactions.filter(t => t.points_amount < 0).reduce((sum, t) => sum + t.points_amount, 0))
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Loyalty Program</h2>
          <p className="text-slate-600">Manage rewards and engage your loyal customers</p>
        </div>
        <Badge className={loyaltyProgram?.status === "active" ? "bg-green-500" : "bg-amber-500"}>
          {loyaltyProgram?.status || "Not Set Up"}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-xs text-slate-600">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalPointsIssued.toLocaleString()}</p>
                <p className="text-xs text-slate-600">Points Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Gift className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalPointsRedeemed.toLocaleString()}</p>
                <p className="text-xs text-slate-600">Points Redeemed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{rewards.length}</p>
                <p className="text-xs text-slate-600">Active Rewards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            Program Settings
          </TabsTrigger>
          <TabsTrigger value="rewards" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Gift className="w-4 h-4 mr-2" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            <History className="w-4 h-4 mr-2" />
            Transaction History
          </TabsTrigger>
        </TabsList>

        {/* Program Settings Tab */}
        <TabsContent value="overview">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Loyalty Program Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Program Name</Label>
                  <Input
                    value={programForm.program_name}
                    onChange={(e) => setProgramForm({...programForm, program_name: e.target.value})}
                    placeholder={`${restaurant.business_name} Rewards`}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    value={programForm.status}
                    onChange={(e) => setProgramForm({...programForm, status: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <Label>Points Per $1 Spent</Label>
                  <Input
                    type="number"
                    min="1"
                    value={programForm.points_per_dollar}
                    onChange={(e) => setProgramForm({...programForm, points_per_dollar: parseInt(e.target.value)})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Birthday Bonus Points</Label>
                  <Input
                    type="number"
                    min="0"
                    value={programForm.birthday_bonus_points}
                    onChange={(e) => setProgramForm({...programForm, birthday_bonus_points: parseInt(e.target.value)})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Referral Bonus Points</Label>
                  <Input
                    type="number"
                    min="0"
                    value={programForm.referral_bonus_points}
                    onChange={(e) => setProgramForm({...programForm, referral_bonus_points: parseInt(e.target.value)})}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Welcome Message</Label>
                <Textarea
                  value={programForm.welcome_message}
                  onChange={(e) => setProgramForm({...programForm, welcome_message: e.target.value})}
                  placeholder="Welcome to our loyalty program! Earn points with every order."
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">Points Expiration</p>
                  <p className="text-sm text-slate-600">Enable if points should expire after a period</p>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={programForm.points_expiration_enabled}
                    onCheckedChange={(checked) => setProgramForm({...programForm, points_expiration_enabled: checked})}
                  />
                  {programForm.points_expiration_enabled && (
                    <Input
                      type="number"
                      min="30"
                      value={programForm.points_expiration_days}
                      onChange={(e) => setProgramForm({...programForm, points_expiration_days: parseInt(e.target.value)})}
                      className="w-24"
                    />
                  )}
                  {programForm.points_expiration_enabled && <span className="text-sm text-slate-600">days</span>}
                </div>
              </div>

              <Button onClick={handleSaveProgram} disabled={isSaving} className="w-full bg-emerald-600">
                {isSaving ? "Saving..." : "Save Program Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Loyalty Rewards</h3>
            <Dialog open={showRewardDialog} onOpenChange={(open) => { setShowRewardDialog(open); if (!open) resetRewardForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reward
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingReward ? "Edit Reward" : "Create Reward"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Reward Title *</Label>
                    <Input
                      value={rewardForm.title}
                      onChange={(e) => setRewardForm({...rewardForm, title: e.target.value})}
                      placeholder="e.g., $5 Off Your Order"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={rewardForm.description}
                      onChange={(e) => setRewardForm({...rewardForm, description: e.target.value})}
                      placeholder="Describe the reward..."
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Points Required *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={rewardForm.points_cost}
                        onChange={(e) => setRewardForm({...rewardForm, points_cost: parseInt(e.target.value)})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Reward Type</Label>
                      <select
                        value={rewardForm.discount_type}
                        onChange={(e) => setRewardForm({...rewardForm, discount_type: e.target.value})}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                      >
                        <option value="percentage">Percentage Off</option>
                        <option value="fixed_amount">Fixed Amount Off</option>
                        <option value="free_item">Free Item</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Discount Value</Label>
                      <Input
                        type="number"
                        min="0"
                        value={rewardForm.discount_value}
                        onChange={(e) => setRewardForm({...rewardForm, discount_value: parseFloat(e.target.value)})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Min Order Amount ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={rewardForm.min_order_amount}
                        onChange={(e) => setRewardForm({...rewardForm, min_order_amount: parseFloat(e.target.value)})}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Tier Requirement</Label>
                    <select
                      value={rewardForm.tier_requirement}
                      onChange={(e) => setRewardForm({...rewardForm, tier_requirement: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                    >
                      <option value="any">Any Tier</option>
                      <option value="bronze">Bronze+</option>
                      <option value="silver">Silver+</option>
                      <option value="gold">Gold+</option>
                      <option value="platinum">Platinum Only</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => { setShowRewardDialog(false); resetRewardForm(); }} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveReward} disabled={isSaving} className="flex-1 bg-emerald-600">
                      {isSaving ? "Saving..." : (editingReward ? "Update" : "Create")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {rewards.length === 0 ? (
            <Card className="border-0 shadow-xl text-center p-12">
              <Gift className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Rewards Yet</h3>
              <p className="text-slate-600 mb-6">Create rewards for your customers to redeem</p>
              <Button onClick={() => setShowRewardDialog(true)} className="bg-emerald-600">
                <Plus className="w-4 h-4 mr-2" />
                Create First Reward
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map(reward => (
                <Card key={reward.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900">{reward.title}</h4>
                        <Badge variant="outline" className="mt-1">{reward.status}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEditReward(reward)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteReward(reward)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    {reward.description && (
                      <p className="text-sm text-slate-600 mb-3">{reward.description}</p>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-emerald-600">{reward.points_cost} points</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {reward.discount_type === "percentage" && `${reward.discount_value}% off`}
                      {reward.discount_type === "fixed_amount" && `$${reward.discount_value} off`}
                      {reward.discount_type === "free_item" && "Free item"}
                    </div>
                    {reward.total_redemptions > 0 && (
                      <p className="text-xs text-slate-500 mt-2">{reward.total_redemptions} redemptions</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                className="pl-10"
              />
            </div>
            <Dialog open={showPromoDialog} onOpenChange={setShowPromoDialog}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600" disabled={selectedMembers.length === 0}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Promotion ({selectedMembers.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Promotion</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Promotion Title *</Label>
                    <Input
                      value={promoForm.title}
                      onChange={(e) => setPromoForm({...promoForm, title: e.target.value})}
                      placeholder="e.g., Double Points Weekend"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={promoForm.description}
                      onChange={(e) => setPromoForm({...promoForm, description: e.target.value})}
                      placeholder="Describe your promotion..."
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Offer Type</Label>
                      <select
                        value={promoForm.offer_type}
                        onChange={(e) => setPromoForm({...promoForm, offer_type: e.target.value})}
                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                      >
                        <option value="bonus_points">Bonus Points</option>
                        <option value="discount">Discount</option>
                        <option value="free_item">Free Item</option>
                      </select>
                    </div>
                    <div>
                      <Label>Valid For (Days)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={promoForm.valid_days}
                        onChange={(e) => setPromoForm({...promoForm, valid_days: parseInt(e.target.value)})}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {promoForm.offer_type === "bonus_points" && (
                    <div>
                      <Label>Bonus Points Amount</Label>
                      <Input
                        type="number"
                        min="1"
                        value={promoForm.bonus_points_amount}
                        onChange={(e) => setPromoForm({...promoForm, bonus_points_amount: parseInt(e.target.value)})}
                        className="mt-1"
                      />
                    </div>
                  )}
                  {promoForm.offer_type === "discount" && (
                    <div>
                      <Label>Discount Percentage</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={promoForm.discount_value}
                        onChange={(e) => setPromoForm({...promoForm, discount_value: parseInt(e.target.value)})}
                        className="mt-1"
                      />
                    </div>
                  )}
                  <p className="text-sm text-slate-600">
                    This will be sent to {selectedMembers.length} selected member{selectedMembers.length > 1 ? 's' : ''}
                  </p>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowPromoDialog(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleSendPromotion} disabled={isSaving} className="flex-1 bg-purple-600">
                      {isSaving ? "Sending..." : "Send Promotion"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {members.length === 0 ? (
            <Card className="border-0 shadow-xl text-center p-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Members Yet</h3>
              <p className="text-slate-600">Customers will appear here after joining your loyalty program</p>
            </Card>
          ) : (
            <Card className="border-0 shadow-xl">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                            onChange={selectAllMembers}
                            className="rounded"
                          />
                        </th>
                        <th className="p-3 text-left font-semibold text-slate-700">Customer</th>
                        <th className="p-3 text-left font-semibold text-slate-700">Tier</th>
                        <th className="p-3 text-left font-semibold text-slate-700">Points</th>
                        <th className="p-3 text-left font-semibold text-slate-700">Lifetime Spend</th>
                        <th className="p-3 text-left font-semibold text-slate-700">Last Visit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredMembers.map(member => (
                        <tr key={member.id} className="hover:bg-slate-50">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedMembers.some(m => m.id === member.id)}
                              onChange={() => toggleMemberSelection(member)}
                              className="rounded"
                            />
                          </td>
                          <td className="p-3">
                            <p className="font-medium">{member.customer_name}</p>
                            <p className="text-sm text-slate-500">{member.email}</p>
                          </td>
                          <td className="p-3">
                            <Badge className={
                              member.tier === "platinum" ? "bg-purple-500" :
                              member.tier === "gold" ? "bg-yellow-500" :
                              member.tier === "silver" ? "bg-slate-400" :
                              "bg-amber-700"
                            }>
                              {member.tier || "Bronze"}
                            </Badge>
                          </td>
                          <td className="p-3 font-bold text-emerald-600">{member.points_balance?.toLocaleString() || 0}</td>
                          <td className="p-3">${(member.lifetime_spend || 0).toFixed(2)}</td>
                          <td className="p-3 text-sm text-slate-600">
                            {member.last_visit_date ? format(new Date(member.last_visit_date), 'MMM d, yyyy') : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Transaction History Tab */}
        <TabsContent value="history">
          {transactions.length === 0 ? (
            <Card className="border-0 shadow-xl text-center p-12">
              <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Transactions Yet</h3>
              <p className="text-slate-600">Points transactions will appear here</p>
            </Card>
          ) : (
            <Card className="border-0 shadow-xl">
              <CardContent className="p-0">
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {transactions.map(tx => (
                    <div key={tx.id} className="p-4 hover:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{tx.customer_name}</p>
                          <p className="text-sm text-slate-600">{tx.description}</p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(tx.created_date), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${tx.points_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.points_amount > 0 ? '+' : ''}{tx.points_amount}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {tx.transaction_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}