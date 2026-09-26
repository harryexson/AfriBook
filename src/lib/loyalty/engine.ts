// ─── Loyalty Engine ──────────────────────────────────────────
// Points-based loyalty system with tiers. Earns points on rides,
// food orders, and marketplace purchases. Redeems for discounts.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/neon/server';
import {
  LOYALTY_TIERS,
  getTierForPoints,
  getPointsMultiplier,
  type LoyaltyTier,
} from './tiers';

// NOTE: the real `loyalty_members` table is (id, user_id, business_id,
// points_balance, lifetime_points, tier [enum loyalty_tier: bronze/silver/
// gold/platinum], visit_count, last_visit_date, created_at, updated_at) —
// no total_points/available_points/points_to_next_tier columns like the
// original code assumed (silently no-op'd under Supabase). `lifetime_points`
// is the closest match for "total ever earned" and `points_balance` for
// "currently available"; points-to-next-tier isn't persisted, it's derived
// on read (already was, via getNextTierPoints).
//
// `points_transactions` is even further off: (id, loyalty_member_id,
// points_amount, transaction_type, description, order_id, previous_balance,
// new_balance, created_at) — it's keyed by loyalty_member_id (not user_id)
// and has no `source` column at all. This module has no callers anywhere
// else in the codebase. `source` therefore can't be persisted or recovered
// on read; write functions still accept it for API compatibility but it's
// dropped rather than jammed into `description` text (see
// getTransactionHistory's comment).

// ─── Types ───────────────────────────────────────────────────

interface LoyaltyAccount {
  userId: string;
  totalPoints: number;
  availablePoints: number;
  tier: LoyaltyTier;
  pointsToNextTier: number;
  monthlyEarnings: number;
  createdAt: string;
}

interface PointsTransaction {
  id: string;
  userId: string;
  points: number;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  source: 'ride' | 'food_order' | 'marketplace' | 'referral' | 'bonus' | 'redemption';
  description: string;
  balanceAfter: number;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────

const POINTS_PER_CURRENCY_UNIT = 1; // 1 point per currency unit spent
const REFERRAL_BONUS = 500;
const SIGNUP_BONUS = 100;

// ─── Get Loyalty Account ─────────────────────────────────────

export async function getLoyaltyAccount(userId: string): Promise<LoyaltyAccount> {
  const supabase = await createClient();

  // Get or create loyalty record
  let { data: loyalty } = (await supabase
    .from('loyalty_members')
    .select('*')
    .eq('user_id', userId)
    .single()) as { data: any };

  if (!loyalty) {
    // Create new loyalty account with signup bonus
    const { data } = await supabase
      .from('loyalty_members')
      .insert({
        user_id: userId,
        points_balance: SIGNUP_BONUS,
        lifetime_points: SIGNUP_BONUS,
        tier: 'bronze',
      } as any)
      .select()
      .single();

    loyalty = data;

    // Record signup bonus
    if (loyalty) {
      await recordPointsTransaction(loyalty.id, userId, SIGNUP_BONUS, 'earned', 'Welcome bonus', 0, SIGNUP_BONUS);
    }
  }

  const totalPoints = loyalty?.lifetime_points ?? SIGNUP_BONUS;
  const availablePoints = loyalty?.points_balance ?? SIGNUP_BONUS;
  const tier = getTierForPoints(totalPoints);
  const pointsToNextTier = getNextTierPoints(tier, totalPoints);

  // Get monthly earnings
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  let monthlyEarnings = 0;
  if (loyalty?.id) {
    const { data: monthlyTx } = (await supabase
      .from('points_transactions')
      .select('points_amount')
      .eq('loyalty_member_id', loyalty.id)
      .eq('transaction_type', 'earned')
      .gte('created_at', startOfMonth.toISOString())) as { data: any };

    monthlyEarnings = (monthlyTx ?? []).reduce((sum: number, tx: any) => sum + ((tx.points_amount as number) ?? 0), 0);
  }

  return {
    userId,
    totalPoints,
    availablePoints,
    tier,
    pointsToNextTier,
    monthlyEarnings,
    createdAt: loyalty?.created_at as string ?? new Date().toISOString(),
  };
}

// ─── Earn Points ─────────────────────────────────────────────

export async function earnPoints(
  userId: string,
  amount: number,
  source: 'ride' | 'food_order' | 'marketplace' | 'referral' | 'bonus',
  description: string,
): Promise<PointsTransaction | null> {
  const supabase = await createClient();

  // Get current tier for multiplier
  const account = await getLoyaltyAccount(userId);
  const multiplier = getPointsMultiplier(account.tier);
  const basePoints = Math.round(amount * POINTS_PER_CURRENCY_UNIT);
  const totalPoints = Math.round(basePoints * multiplier);

  // Update loyalty account
  const { data: loyalty } = (await supabase
    .from('loyalty_members')
    .select('id, lifetime_points, points_balance')
    .eq('user_id', userId)
    .single()) as { data: any };

  const previousTotal = loyalty?.lifetime_points ?? 0;
  const previousAvailable = loyalty?.points_balance ?? 0;
  const newTotal = previousTotal + totalPoints;
  const newAvailable = previousAvailable + totalPoints;
  const newTier = getTierForPoints(newTotal);

  await (supabase.from('loyalty_members') as any)
    .update({
      lifetime_points: newTotal,
      points_balance: newAvailable,
      tier: newTier.name,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  // Record transaction (source is accepted for API compatibility but can't
  // be persisted — see the module-level comment on points_transactions).
  return recordPointsTransaction(
    loyalty?.id,
    userId,
    totalPoints,
    'earned',
    description,
    previousAvailable,
    newAvailable,
    source,
  );
}

// ─── Redeem Points ───────────────────────────────────────────

export async function redeemPoints(
  userId: string,
  points: number,
  description: string,
): Promise<{ success: boolean; discountAmount: number; error?: string }> {
  const supabase = await createClient();

  const account = await getLoyaltyAccount(userId);

  if (account.availablePoints < points) {
    return { success: false, discountAmount: 0, error: 'Insufficient points' };
  }

  // Convert points to discount (100 points = 1 unit of currency)
  const discountAmount = points / 100;

  const { data: loyalty } = (await supabase
    .from('loyalty_members')
    .select('id, points_balance')
    .eq('user_id', userId)
    .single()) as { data: any };

  const previousAvailable = loyalty?.points_balance ?? account.availablePoints;
  const newAvailable = previousAvailable - points;

  await (supabase.from('loyalty_members') as any)
    .update({
      points_balance: newAvailable,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  await recordPointsTransaction(
    loyalty?.id,
    userId,
    -points,
    'redeemed',
    description,
    previousAvailable,
    newAvailable,
    'redemption',
  );

  return { success: true, discountAmount };
}

// ─── Get Transaction History ─────────────────────────────────

export async function getTransactionHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<PointsTransaction[]> {
  const supabase = await createClient();

  const { data: loyalty } = (await supabase
    .from('loyalty_members')
    .select('id')
    .eq('user_id', userId)
    .single()) as { data: any };

  if (!loyalty?.id) return [];

  const { data, error } = (await supabase
    .from('points_transactions')
    .select('*')
    .eq('loyalty_member_id', loyalty.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)) as { data: any; error: any };

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id as string,
    userId,
    points: row.points_amount as number,
    type: row.transaction_type as PointsTransaction['type'],
    // `source` isn't persisted in the real schema (see module-level
    // comment) — it can't be recovered on read.
    source: 'bonus' as PointsTransaction['source'],
    description: row.description as string,
    balanceAfter: row.new_balance as number,
    createdAt: row.created_at as string,
  }));
}

// ─── Award Referral Bonus ────────────────────────────────────

export async function awardReferralBonus(
  referrerId: string,
  referredId: string,
): Promise<void> {
  await earnPoints(referrerId, REFERRAL_BONUS, 'referral', 'Referral bonus');
  await earnPoints(referredId, 250, 'bonus', 'Referred by a friend');
}

// ─── Private Helpers ──────────────────────────────────────────

async function recordPointsTransaction(
  loyaltyMemberId: string | undefined,
  userId: string,
  points: number,
  type: PointsTransaction['type'],
  description: string,
  previousBalance: number,
  newBalance: number,
  source: PointsTransaction['source'] = 'bonus',
): Promise<PointsTransaction | null> {
  if (!loyaltyMemberId) return null;

  const supabase = await createClient();

  // `points_transactions` has no user_id/source columns in the real schema
  // — it's keyed by loyalty_member_id, uses points_amount/transaction_type,
  // and tracks previous_balance/new_balance instead of balance_after.
  const { data, error } = (await supabase
    .from('points_transactions')
      .insert({
      loyalty_member_id: loyaltyMemberId,
      points_amount: points,
      transaction_type: type,
      description,
      previous_balance: previousBalance,
      new_balance: newBalance,
    } as any)
    .select()
    .single()) as { data: any; error: any };

  if (error || !data) return null;

  return {
    id: data.id as string,
    userId,
    points: data.points_amount as number,
    type: data.transaction_type as PointsTransaction['type'],
    source,
    description: data.description as string,
    balanceAfter: data.new_balance as number,
    createdAt: data.created_at as string,
  };
}

function getNextTierPoints(currentTier: LoyaltyTier, totalPoints: number): number {
  const tiers = Object.values(LOYALTY_TIERS);
  const currentIdx = tiers.findIndex((t) => t.name === currentTier.name);

  if (currentIdx < tiers.length - 1) {
    return tiers[currentIdx + 1].threshold - totalPoints;
  }

  return 0;
}
