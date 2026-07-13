import React, { useEffect, useState } from "react";
import { PointsTransaction } from "@/entities/PointsTransaction";
import { LoyaltyMember } from "@/entities/LoyaltyMember";
import { Reward } from "@/entities/Reward";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Gift, Search, TrendingDown, Users, Star } from "lucide-react";
import { format } from "date-fns";

export default function RedemptionTracker({ restaurantId }) {
  const [redemptions, setRedemptions] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    load();
  }, [restaurantId]);

  const load = async () => {
    setIsLoading(true);
    const [txns, rwds] = await Promise.all([
      PointsTransaction.filter({ transaction_type: "redeemed" }, "-created_date", 100),
      Reward.filter({ restaurant_id: restaurantId }),
    ]);
    setRedemptions(txns);
    setRewards(rwds);
    setIsLoading(false);
  };

  const rewardMap = Object.fromEntries(rewards.map(r => [r.id, r]));

  const filtered = redemptions.filter(t =>
    !search ||
    t.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const totalRedemptions = redemptions.length;
  const totalPointsSpent = redemptions.reduce((s, t) => s + Math.abs(t.points_amount || 0), 0);
  const uniqueCustomers = new Set(redemptions.map(t => t.customer_email)).size;

  // Redemptions per reward
  const byReward = rewards.map(r => ({
    ...r,
    count: redemptions.filter(t => t.reward_id === r.id).length
  })).sort((a, b) => b.count - a.count);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-5">
            <Gift className="w-7 h-7 mb-2" />
            <div className="text-3xl font-bold">{totalRedemptions}</div>
            <div className="text-purple-100 text-sm">Total Redemptions</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <CardContent className="p-5">
            <TrendingDown className="w-7 h-7 mb-2" />
            <div className="text-3xl font-bold">{totalPointsSpent.toLocaleString()}</div>
            <div className="text-red-100 text-sm">Points Redeemed</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-5">
            <Users className="w-7 h-7 mb-2" />
            <div className="text-3xl font-bold">{uniqueCustomers}</div>
            <div className="text-blue-100 text-sm">Unique Redeemers</div>
          </CardContent>
        </Card>
      </div>

      {/* Reward Popularity */}
      {byReward.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="w-5 h-5 text-amber-500" />
              Redemptions by Reward
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byReward.map(r => (
                <div key={r.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{r.title}</p>
                    <p className="text-xs text-slate-500">{r.points_cost} pts each</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="h-2 rounded-full bg-emerald-100 w-24 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${byReward[0].count > 0 ? (r.count / byReward[0].count) * 100 : 0}%` }}
                      />
                    </div>
                    <Badge className="bg-emerald-600 min-w-[40px] justify-center">{r.count}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Redemption Log */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" />
              Redemption Log
            </CardTitle>
            <div className="relative w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search customer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No redemptions yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filtered.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">{t.customer_name || t.customer_email}</p>
                    <p className="text-xs text-slate-500 truncate">{t.description}</p>
                    <p className="text-xs text-slate-400">{format(new Date(t.created_date), 'MMM d, yyyy • h:mm a')}</p>
                  </div>
                  <Badge variant="destructive" className="flex-shrink-0">
                    {t.points_amount} pts
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}