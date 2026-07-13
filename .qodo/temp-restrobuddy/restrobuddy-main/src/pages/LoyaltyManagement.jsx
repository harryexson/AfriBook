import React, { useState, useEffect } from "react";
import { LoyaltyMember } from "@/entities/LoyaltyMember";
import { PointsTransaction } from "@/entities/PointsTransaction";
import { Reward } from "@/entities/Reward";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Star, Users, Search, Plus, Edit, Trash2,
  Award, Crown, Trophy, Gift, DollarSign
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function LoyaltyManagement() {
  const [members, setMembers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberTransactions, setMemberTransactions] = useState([]);
  const [user, setUser] = useState(null);
  
  // Adjust points dialog
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  // Reward dialog
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [rewardForm, setRewardForm] = useState({
    title: "",
    description: "",
    points_cost: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_amount: 0,
    tier_requirement: "any"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [allMembers, allRewards] = await Promise.all([
        LoyaltyMember.list("-lifetime_spend", 200),
        Reward.list()
      ]);

      setMembers(allMembers);
      setRewards(allRewards);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const loadMemberTransactions = async (member) => {
    try {
      const transactions = await PointsTransaction.filter(
        { loyalty_member_id: member.id },
        "-created_date",
        100
      );
      setMemberTransactions(transactions);
      setSelectedMember(member);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  const handleAdjustPoints = async () => {
    if (!selectedMember || !adjustmentAmount || !adjustmentReason) {
      alert("Please fill in all fields");
      return;
    }

    const points = parseInt(adjustmentAmount);
    const newBalance = selectedMember.points_balance + points;

    try {
      await PointsTransaction.create({
        loyalty_member_id: selectedMember.id,
        customer_name: selectedMember.customer_name,
        customer_email: selectedMember.email,
        transaction_type: "adjusted",
        points_amount: points,
        description: adjustmentReason,
        previous_balance: selectedMember.points_balance,
        new_balance: newBalance,
        staff_member: user.full_name
      });

      await LoyaltyMember.update(selectedMember.id, {
        points_balance: newBalance
      });

      alert("Points adjusted successfully!");
      setShowAdjustDialog(false);
      setAdjustmentAmount("");
      setAdjustmentReason("");
      await loadData();
      await loadMemberTransactions(selectedMember);
    } catch (error) {
      console.error("Error adjusting points:", error);
      alert("Failed to adjust points");
    }
  };

  const handleSaveReward = async () => {
    if (!rewardForm.title || !rewardForm.points_cost || !rewardForm.discount_value) {
      alert("Please fill in required fields");
      return;
    }

    try {
      const rewardData = {
        ...rewardForm,
        points_cost: parseInt(rewardForm.points_cost),
        discount_value: parseFloat(rewardForm.discount_value),
        min_order_amount: parseFloat(rewardForm.min_order_amount) || 0,
        status: "active"
      };

      if (editingReward) {
        await Reward.update(editingReward.id, rewardData);
      } else {
        await Reward.create(rewardData);
      }

      alert(`Reward ${editingReward ? 'updated' : 'created'} successfully!`);
      setShowRewardDialog(false);
      setEditingReward(null);
      setRewardForm({
        title: "",
        description: "",
        points_cost: "",
        discount_type: "percentage",
        discount_value: "",
        min_order_amount: 0,
        tier_requirement: "any"
      });
      await loadData();
    } catch (error) {
      console.error("Error saving reward:", error);
      alert("Failed to save reward");
    }
  };

  const handleEditReward = (reward) => {
    setEditingReward(reward);
    setRewardForm({
      title: reward.title,
      description: reward.description,
      points_cost: reward.points_cost.toString(),
      discount_type: reward.discount_type,
      discount_value: reward.discount_value.toString(),
      min_order_amount: reward.min_order_amount || 0,
      tier_requirement: reward.tier_requirement || "any"
    });
    setShowRewardDialog(true);
  };

  const handleDeleteReward = async (rewardId) => {
    if (!confirm("Are you sure you want to delete this reward?")) return;

    try {
      await Reward.update(rewardId, { status: "inactive" });
      await loadData();
      alert("Reward deleted successfully!");
    } catch (error) {
      console.error("Error deleting reward:", error);
      alert("Failed to delete reward");
    }
  };

  const filteredMembers = members.filter(member =>
    member.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMembers = members.length;
  const totalPoints = members.reduce((sum, m) => sum + (m.points_balance || 0), 0);
  const avgPointsPerMember = totalMembers > 0 ? (totalPoints / totalMembers).toFixed(0) : 0;
  const totalLifetimeSpend = members.reduce((sum, m) => sum + (m.lifetime_spend || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading loyalty management...</p>
        </div>
      </div>
    );
  }

  const tierIcon = {
    bronze: Award,
    silver: Star,
    gold: Trophy,
    platinum: Crown
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Loyalty Program Management</h1>
          <p className="text-slate-600">Manage members, rewards, and points</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Total Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{totalMembers}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Star className="w-5 h-5" />
                Total Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{totalPoints.toLocaleString()}</p>
              <p className="text-sm text-amber-100 mt-2">Avg: {avgPointsPerMember} per member</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Lifetime Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">${totalLifetimeSpend.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Active Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{rewards.filter(r => r.status === 'active').length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="members">
          <TabsList className="bg-white border border-slate-200 p-2 rounded-xl shadow-md">
            <TabsTrigger value="members" className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Members
            </TabsTrigger>
            <TabsTrigger value="rewards" className="rounded-lg px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Gift className="w-4 h-4 mr-2" />
              Rewards
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-xl">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Loyalty Members</CardTitle>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <Input
                          placeholder="Search members..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {filteredMembers.map(member => {
                        const TierIcon = tierIcon[member.tier];
                        return (
                          <div
                            key={member.id}
                            onClick={() => loadMemberTransactions(member)}
                            className={`p-4 rounded-lg cursor-pointer transition-all ${
                              selectedMember?.id === member.id
                                ? 'bg-emerald-100 border-2 border-emerald-500'
                                : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                                  {member.customer_name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{member.customer_name}</p>
                                  <p className="text-sm text-slate-600">{member.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2 justify-end mb-1">
                                  <TierIcon className="w-5 h-5 text-amber-500" />
                                  <Badge className="capitalize">{member.tier}</Badge>
                                </div>
                                <p className="text-2xl font-bold text-emerald-600">
                                  {member.points_balance || 0}
                                </p>
                                <p className="text-xs text-slate-500">points</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                {selectedMember ? (
                  <Card className="border-0 shadow-xl sticky top-8">
                    <CardHeader>
                      <CardTitle>{selectedMember.customer_name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-semibold">Stats</Label>
                          <div className="space-y-2 mt-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Points:</span>
                              <span className="font-bold">{selectedMember.points_balance}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Tier:</span>
                              <Badge className="capitalize">{selectedMember.tier}</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Lifetime Spend:</span>
                              <span className="font-bold">${selectedMember.lifetime_spend?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Total Orders:</span>
                              <span className="font-bold">{selectedMember.visit_count}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => setShowAdjustDialog(true)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Adjust Points
                        </Button>

                        <div className="pt-4 border-t">
                          <Label className="text-sm font-semibold mb-3 block">Recent Activity</Label>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {memberTransactions.slice(0, 10).map(transaction => (
                              <div key={transaction.id} className="p-2 bg-slate-50 rounded-lg text-sm">
                                <div className="flex justify-between items-start">
                                  <span className="text-slate-700 flex-1">{transaction.description}</span>
                                  <span className={`font-bold ml-2 ${
                                    transaction.points_amount > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {transaction.points_amount > 0 ? '+' : ''}{transaction.points_amount}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  {format(new Date(transaction.created_date), 'MMM d, h:mm a')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-0 shadow-xl">
                    <CardContent className="text-center py-12">
                      <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600">Select a member to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="mt-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Manage Rewards</CardTitle>
                  <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Reward
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingReward ? 'Edit' : 'Create'} Reward</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Title *</Label>
                          <Input
                            value={rewardForm.title}
                            onChange={(e) => setRewardForm({...rewardForm, title: e.target.value})}
                            placeholder="e.g., 10% Off Your Order"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={rewardForm.description}
                            onChange={(e) => setRewardForm({...rewardForm, description: e.target.value})}
                            placeholder="Describe the reward..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Points Cost *</Label>
                            <Input
                              type="number"
                              value={rewardForm.points_cost}
                              onChange={(e) => setRewardForm({...rewardForm, points_cost: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>Discount Type *</Label>
                            <Select
                              value={rewardForm.discount_type}
                              onValueChange={(value) => setRewardForm({...rewardForm, discount_type: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage Off</SelectItem>
                                <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                                <SelectItem value="free_item">Free Item</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Discount Value *</Label>
                            <Input
                              type="number"
                              value={rewardForm.discount_value}
                              onChange={(e) => setRewardForm({...rewardForm, discount_value: e.target.value})}
                              placeholder={rewardForm.discount_type === 'percentage' ? '10' : '5.00'}
                            />
                          </div>
                          <div>
                            <Label>Min Order Amount</Label>
                            <Input
                              type="number"
                              value={rewardForm.min_order_amount}
                              onChange={(e) => setRewardForm({...rewardForm, min_order_amount: e.target.value})}
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Tier Requirement</Label>
                          <Select
                            value={rewardForm.tier_requirement}
                            onValueChange={(value) => setRewardForm({...rewardForm, tier_requirement: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any Tier</SelectItem>
                              <SelectItem value="bronze">Bronze+</SelectItem>
                              <SelectItem value="silver">Silver+</SelectItem>
                              <SelectItem value="gold">Gold+</SelectItem>
                              <SelectItem value="platinum">Platinum Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleSaveReward} className="w-full bg-emerald-600 hover:bg-emerald-700">
                          {editingReward ? 'Update' : 'Create'} Reward
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rewards.map(reward => (
                    <Card key={reward.id} className="border-2">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <Badge className={reward.status === 'active' ? 'bg-green-500' : 'bg-slate-500'}>
                            {reward.status}
                          </Badge>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEditReward(reward)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteReward(reward.id)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{reward.title}</h3>
                        <p className="text-sm text-slate-600 mb-3">{reward.description}</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Points Cost:</span>
                            <span className="font-bold text-emerald-600">{reward.points_cost}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Discount:</span>
                            <span className="font-bold">
                              {reward.discount_type === 'percentage' && `${reward.discount_value}%`}
                              {reward.discount_type === 'fixed_amount' && `$${reward.discount_value}`}
                              {reward.discount_type === 'free_item' && 'Free Item'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Redeemed:</span>
                            <span className="font-bold">{reward.total_redemptions || 0} times</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Adjust Points Dialog */}
        <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Points for {selectedMember?.customer_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Current Balance</Label>
                <div className="text-3xl font-bold text-emerald-600">
                  {selectedMember?.points_balance || 0} points
                </div>
              </div>
              <div>
                <Label>Adjustment Amount *</Label>
                <Input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="Enter positive or negative number"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Use positive numbers to add, negative to subtract
                </p>
              </div>
              <div>
                <Label>Reason *</Label>
                <Textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g., Compensation for service issue, Promotional bonus"
                  rows={3}
                />
              </div>
              <Button onClick={handleAdjustPoints} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Confirm Adjustment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}