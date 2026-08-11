// ─── Loyalty Engine ──────────────────────────────────────────
// Points-based loyalty system with tiers. Earns points on rides,
// food orders, and marketplace purchases. Redeems for discounts.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import {
  LOYALTY_TIERS,
  getTierForPoints,
  getPointsMultiplier,
  type LoyaltyTier,
} from './tiers';

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
        total_points: SIGNUP_BONUS,
        available_points: SIGNUP_BONUS,
        tier: 'bronze',
        points_to_next_tier: LOYALTY_TIERS.silver.threshold - SIGNUP_BONUS,
      } as any)
      .select()
      .single();

    loyalty = data;

    // Record signup bonus
    if (loyalty) {
      await recordPointsTransaction(userId, SIGNUP_BONUS, 'earned', 'bonus', 'Welcome bonus', SIGNUP_BONUS);
    }
  }

  const totalPoints = loyalty?.total_points ?? SIGNUP_BONUS;
  const availablePoints = loyalty?.available_points ?? SIGNUP_BONUS;
  const tier = getTierForPoints(totalPoints);
  const pointsToNextTier = getNextTierPoints(tier, totalPoints);

  // Get monthly earnings
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthlyTx } = (await supabase
    .from('points_transactions')
    .select('points')
    .eq('user_id', userId)
    .eq('type', 'earned')
    .gte('created_at', startOfMonth.toISOString())) as { data: any };

  const monthlyEarnings = (monthlyTx ?? []).reduce((sum: number, tx: any) => sum + ((tx.points as number) ?? 0), 0);

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
    .select('total_points, available_points')
    .eq('user_id', userId)
    .single()) as { data: any };

  const previousTotal = loyalty?.total_points ?? 0;
  const previousAvailable = loyalty?.available_points ?? 0;
  const newTotal = previousTotal + totalPoints;
  const newAvailable = previousAvailable + totalPoints;
  const newTier = getTierForPoints(newTotal);
  const pointsToNextTier = getNextTierPoints(newTier, newTotal);

  await (supabase.from('loyalty_members') as any)
    .update({
      total_points: newTotal,
      available_points: newAvailable,
      tier: newTier.name,
      points_to_next_tier: pointsToNextTier,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  // Record transaction
  return recordPointsTransaction(
    userId,
    totalPoints,
    'earned',
    source,
    description,
    newAvailable,
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

  const newAvailable = account.availablePoints - points;

  await (supabase.from('loyalty_members') as any)
    .update({
      available_points: newAvailable,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  await recordPointsTransaction(
    userId,
    -points,
    'redeemed',
    'redemption',
    description,
    newAvailable,
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

  const { data, error } = (await supabase
    .from('points_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)) as { data: any; error: any };

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id as string,
    userId: row.user_id as string,
    points: row.points as number,
    type: row.type as PointsTransaction['type'],
    source: row.source as PointsTransaction['source'],
    description: row.description as string,
    balanceAfter: row.balance_after as number,
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
  userId: string,
  points: number,
  type: PointsTransaction['type'],
  source: PointsTransaction['source'],
  description: string,
  balanceAfter: number,
): Promise<PointsTransaction | null> {
  const supabase = await createClient();

  const { data, error } = (await supabase
    .from('points_transactions')
      .insert({
      user_id: userId,
      points,
      type,
      source,
      description,
      balance_after: balanceAfter,
    } as any)
    .select()
    .single()) as { data: any; error: any };

  if (error || !data) return null;

  return {
    id: data.id as string,
    userId: data.user_id as string,
    points: data.points as number,
    type: data.type as PointsTransaction['type'],
    source: data.source as PointsTransaction['source'],
    description: data.description as string,
    balanceAfter: data.balance_after as number,
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
