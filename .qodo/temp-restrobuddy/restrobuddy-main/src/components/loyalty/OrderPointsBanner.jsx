import React, { useEffect, useState } from "react";
import { LoyaltyMember } from "@/entities/LoyaltyMember";
import { PointsTransaction } from "@/entities/PointsTransaction";
import { LoyaltyProgram } from "@/entities/LoyaltyProgram";
import { base44 } from "@/api/base44Client";
import { awardPointsForOrder } from "@/hooks/useLoyaltyEngine";
import { Star, TrendingUp, Crown, Award, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TIER_ICONS = { bronze: Award, silver: Star, gold: Trophy, platinum: Crown };
const TIER_COLORS = {
  bronze: "from-amber-600 to-amber-500",
  silver: "from-slate-400 to-slate-500",
  gold: "from-yellow-500 to-yellow-400",
  platinum: "from-purple-600 to-purple-500",
};

export default function OrderPointsBanner({ order }) {
  const [result, setResult] = useState(null); // { pointsEarned, newBalance, tierUpgraded, newTier }
  const [member, setMember] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!order?.customer_email) return;
    if (!["completed", "delivered"].includes(order?.status)) return;

    const run = async () => {
      try {
        const user = await base44.auth.me().catch(() => null);
        if (!user || user.email !== order.customer_email) return;

        const [members, programs] = await Promise.all([
          LoyaltyMember.filter({ email: user.email }),
          LoyaltyProgram.filter({ status: "active" }),
        ]);

        if (members.length === 0) return;
        const mem = members[0];
        setMember(mem);

        const program = programs[0] || null;
        const awarded = await awardPointsForOrder(order, mem, program);
        if (awarded) setResult(awarded);
        else {
          // Points were already awarded — just show current balance
          const existing = await PointsTransaction.filter({
            loyalty_member_id: mem.id,
            order_id: order.id,
            transaction_type: "earned",
          });
          if (existing.length > 0) {
            setResult({ pointsEarned: existing[0].points_amount, newBalance: mem.points_balance, already: true });
          }
        }
      } catch (e) {
        console.error("OrderPointsBanner error:", e);
      }
      setChecked(true);
    };

    run();
  }, [order?.id, order?.status]);

  if (!result) return null;

  const TierIcon = TIER_ICONS[result.newTier || member?.tier] || Star;
  const tierColor = TIER_COLORS[result.newTier || member?.tier] || "from-emerald-600 to-emerald-500";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0 }}
        className={`rounded-2xl bg-gradient-to-r ${tierColor} text-white p-5 mb-6 shadow-xl`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              {result.already ? (
                <>
                  <p className="font-bold text-lg leading-tight">Points Already Earned ✓</p>
                  <p className="text-white/80 text-sm">Balance: {result.newBalance} pts</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-lg leading-tight">
                    +{result.pointsEarned} Points Earned! 🎉
                  </p>
                  <p className="text-white/80 text-sm">New balance: {result.newBalance} pts</p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {result.tierUpgraded && (
              <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
                <TierIcon className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xs font-bold capitalize">Tier Up! {result.newTier}</p>
              </div>
            )}
            <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xs font-bold">{result.newBalance} pts</p>
              <p className="text-xs text-white/70">balance</p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}