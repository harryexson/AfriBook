import { LoyaltyMember } from "@/entities/LoyaltyMember";
import { PointsTransaction } from "@/entities/PointsTransaction";
import { LoyaltyProgram } from "@/entities/LoyaltyProgram";
import { Order } from "@/entities/Order";
import { base44 } from "@/api/base44Client";

const DEFAULT_POINTS_PER_DOLLAR = 10;

const TIERS = [
  { name: "bronze",   threshold: 0,    multiplier: 1 },
  { name: "silver",   threshold: 500,  multiplier: 1.25 },
  { name: "gold",     threshold: 1000, multiplier: 1.5 },
  { name: "platinum", threshold: 2500, multiplier: 2 },
];

function getTierForSpend(spend) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (spend >= TIERS[i].threshold) return TIERS[i];
  }
  return TIERS[0];
}

/**
 * Award points for a single completed order.
 * Returns null if points were already awarded (idempotent).
 */
export async function awardPointsForOrder(order, member, program) {
  // Idempotency: skip if already awarded for this order
  const existing = await PointsTransaction.filter({
    loyalty_member_id: member.id,
    order_id: order.id,
    transaction_type: "earned"
  });
  if (existing.length > 0) return null;

  const pointsPerDollar = program?.points_per_dollar ?? DEFAULT_POINTS_PER_DOLLAR;
  const tier = getTierForSpend(member.lifetime_spend || 0);
  const pointsEarned = Math.floor(order.total_amount * pointsPerDollar * tier.multiplier);
  if (pointsEarned <= 0) return null;

  const previousBalance = member.points_balance || 0;
  const newBalance      = previousBalance + pointsEarned;
  const newLifetimeSpend = (member.lifetime_spend || 0) + order.total_amount;
  const newVisitCount    = (member.visit_count || 0) + 1;
  const newTier          = getTierForSpend(newLifetimeSpend);
  const tierUpgraded     = newTier.name !== (member.tier || "bronze");

  await PointsTransaction.create({
    loyalty_member_id: member.id,
    customer_name: member.customer_name,
    customer_email: member.email,
    transaction_type: "earned",
    points_amount: pointsEarned,
    order_id: order.id,
    description: `Earned for order #${order.id.slice(-6)} — $${order.total_amount.toFixed(2)}`,
    previous_balance: previousBalance,
    new_balance: newBalance,
  });

  await LoyaltyMember.update(member.id, {
    points_balance: newBalance,
    lifetime_spend: newLifetimeSpend,
    visit_count: newVisitCount,
    last_visit_date: new Date().toISOString().split("T")[0],
    tier: newTier.name,
  });

  // Email notification
  const tierUpgradeMsg = tierUpgraded
    ? `🏆 Exciting news — you've been upgraded to ${newTier.name.toUpperCase()} tier!\n\n`
    : "";
  const redeemHint = newBalance >= 500
    ? "💡 You have enough points to redeem a reward! Visit your Loyalty page to claim it."
    : `You need ${500 - newBalance} more points to unlock your first reward.`;

  await base44.integrations.Core.SendEmail({
    to: member.email,
    subject: `🎉 +${pointsEarned} loyalty points earned!`,
    body: `Hi ${member.customer_name},\n\nThank you for your order! You just earned ${pointsEarned} loyalty points for your $${order.total_amount.toFixed(2)} purchase.\n\n${tierUpgradeMsg}Your new points balance: ${newBalance} pts\n${redeemHint}\n\nKeep ordering to unlock bigger rewards!\nRESTROBUDDY`,
  }).catch(e => console.error("Failed to send loyalty email:", e));

  return { pointsEarned, newBalance, tierUpgraded, newTier: newTier.name };
}

/**
 * Scan completed orders for a customer and award any unclaimed points.
 * Safe to call multiple times — fully idempotent.
 */
export async function syncUnclaimedPoints(userEmail) {
  const [members, programs] = await Promise.all([
    LoyaltyMember.filter({ email: userEmail }),
    LoyaltyProgram.filter({ status: "active" }),
  ]);

  if (members.length === 0) return 0;
  let member = members[0];
  const program = programs[0] || null;

  // Get completed orders for this customer
  const completedOrders = await Order.filter({ customer_email: userEmail, status: "completed" });
  if (completedOrders.length === 0) return 0;

  // Which orders already have a transaction?
  const existingTxns = await PointsTransaction.filter({
    loyalty_member_id: member.id,
    transaction_type: "earned",
  });
  const awardedOrderIds = new Set(existingTxns.map(t => t.order_id).filter(Boolean));

  const unclaimed = completedOrders.filter(o => !awardedOrderIds.has(o.id));
  let awarded = 0;
  for (const order of unclaimed) {
    // Re-fetch member each time so balance is up-to-date
    const fresh = await LoyaltyMember.filter({ email: userEmail });
    member = fresh[0] || member;
    const result = await awardPointsForOrder(order, member, program);
    if (result) awarded++;
  }
  return awarded;
}