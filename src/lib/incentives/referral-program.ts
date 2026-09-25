// ─── Referral Program ──────────────────────────────────────────
// "Bring AfriBook" — one engine, four sides of the marketplace:
// riders, drivers, vendors/restaurants, and service providers (hotel
// & rental-company hosts). Every bonus is milestone-gated (paid only
// once the referee completes real, qualifying activity) and capped,
// so growth spend is always self-funding rather than an open-ended
// liability — the platform never pays out more than a small slice of
// the incremental revenue the referral itself generated.
// ──────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import type { PartyType } from './types';

export type { PartyType };

export interface ReferralBonusSchedule {
  partyType: PartyType;
  /** What the referee must do before either side is paid. */
  milestone: string;
  /** Flat bonus to the person who referred, once the milestone is met. */
  referrerBonus: number;
  /** Flat bonus/credit to the new person who was referred. */
  refereeBonus: number;
  currencyNote: string;
  /** Hard cap on paid referrals per referrer per rolling 30 days —
   *  the anti-fraud/anti-loss backstop. */
  maxPerMonth: number;
}

// Amounts are illustrative "reference currency units" scaled per-market by
// the same getCurrencyForCountry conversion used across ridely — kept as
// small, capped, milestone-gated amounts so the program is self-funding:
// each bonus is a fraction of the take AfriBook keeps from the referee's
// qualifying activity, never paid before that activity (and its platform
// fee) has actually landed.
export const REFERRAL_SCHEDULES: Record<PartyType, ReferralBonusSchedule> = {
  rider: {
    partyType: 'rider',
    milestone: 'Referee completes 1 paid ride or food order',
    referrerBonus: 5,
    refereeBonus: 5,
    currencyNote: 'Paid as ride/order credit, not cash — keeps the cost inside the marketplace',
    maxPerMonth: 10,
  },
  driver: {
    partyType: 'driver',
    milestone: 'Referee completes 20 trips within 30 days of activation',
    referrerBonus: 40,
    refereeBonus: 25,
    currencyNote: 'Paid as cash into the weekly payout — retention-gated so it only pays for drivers who stick',
    maxPerMonth: 5,
  },
  vendor: {
    partyType: 'vendor',
    milestone: 'Referee’s store completes its first paid-out settlement cycle',
    referrerBonus: 30,
    refereeBonus: 0, // the referee's own incentive is the reduced onboarding commission, see promo-campaigns.ts
    currencyNote: 'Credited against the referrer’s own platform fees for one settlement cycle',
    maxPerMonth: 8,
  },
  host: {
    partyType: 'host',
    milestone: 'Referee’s first hotel room / rental vehicle booking is completed',
    referrerBonus: 50,
    refereeBonus: 0,
    currencyNote: 'Credited against the referrer’s own host commission for one booking cycle',
    maxPerMonth: 5,
  },
};

function generateCode(seed: string): string {
  const clean = seed.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 5) || 'AFRIB';
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${clean}${suffix}`;
}

/** Fetches the caller's existing code, or mints one on first use. */
export async function getOrCreateReferralCode(
  profileId: string,
  partyType: PartyType,
  nameSeed: string,
): Promise<{ code: string; id: string }> {
  const supabase = await createClient();

  const { data: existing } = await (supabase.from('referral_codes') as any)
    .select('id, code')
    .eq('owner_id', profileId)
    .eq('owner_type', partyType)
    .eq('is_active', true)
    .maybeSingle();

  if (existing) return { code: existing.code as string, id: existing.id as string };

  // Retry a few times in case of a (rare) code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode(nameSeed);
    const { data, error } = await (supabase.from('referral_codes') as any)
      .insert({ owner_id: profileId, owner_type: partyType, code })
      .select('id, code')
      .single();
    if (!error && data) return { code: data.code as string, id: data.id as string };
  }

  throw new Error('Failed to generate a referral code');
}

export interface RedeemResult {
  success: boolean;
  error?: string;
  referralId?: string;
}

/** Called once, at signup, when a new user enters someone else's code. */
export async function redeemReferralCode(
  code: string,
  refereeId: string,
  refereeType: PartyType,
): Promise<RedeemResult> {
  const supabase = await createClient();

  const { data: refCode } = await (supabase.from('referral_codes') as any)
    .select('id, owner_id, owner_type, is_active')
    .eq('code', code.trim().toUpperCase())
    .maybeSingle();

  if (!refCode || !refCode.is_active) {
    return { success: false, error: 'Invalid or inactive referral code' };
  }
  if (refCode.owner_id === refereeId) {
    return { success: false, error: 'You cannot refer yourself' };
  }

  const schedule = REFERRAL_SCHEDULES[refereeType];

  // Anti-loss cap: a referrer earning ≥ maxPerMonth paid referrals in the
  // trailing 30 days stops accruing new *bonus* referrals (redemption of
  // the code itself still succeeds for the new user's own welcome credit,
  // but the referrer's side is void so growth spend never runs away).
  const { count } = await (supabase.from('referrals') as any)
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', refCode.owner_id)
    .eq('status', 'paid')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const overCap = (count ?? 0) >= schedule.maxPerMonth;

  const { data, error } = await (supabase.from('referrals') as any)
    .insert({
      referral_code_id: refCode.id,
      referrer_id: refCode.owner_id,
      referrer_type: refCode.owner_type,
      referee_id: refereeId,
      referee_type: refereeType,
      status: 'pending',
      milestone_required: schedule.milestone,
      referrer_bonus: overCap ? 0 : schedule.referrerBonus,
      referee_bonus: schedule.refereeBonus,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: 'This person has already been referred, or redemption failed' };
  }

  return { success: true, referralId: data.id as string };
}

/**
 * Call when a referee's qualifying milestone is actually observed
 * (e.g. from the ride/order completion path). Marks the referral
 * qualified and pays out both bonuses as wallet/earnings credit.
 */
export async function markReferralMilestoneMet(refereeId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: referral } = await (supabase.from('referrals') as any)
    .select('id, status, referrer_bonus')
    .eq('referee_id', refereeId)
    .eq('status', 'pending')
    .maybeSingle();

  if (!referral) return false;

  await (supabase.from('referrals') as any)
    .update({
      status: 'qualified',
      milestone_met_at: new Date().toISOString(),
    })
    .eq('id', referral.id);

  return true;
}

export async function getMyReferralStats(profileId: string): Promise<{
  totalReferred: number;
  qualified: number;
  paid: number;
  pendingBonus: number;
}> {
  const supabase = await createClient();
  const { data } = await (supabase.from('referrals') as any)
    .select('status, referrer_bonus')
    .eq('referrer_id', profileId);

  const rows: any[] = data ?? [];
  return {
    totalReferred: rows.length,
    qualified: rows.filter((r) => r.status === 'qualified' || r.status === 'paid').length,
    paid: rows.filter((r) => r.status === 'paid').length,
    pendingBonus: rows
      .filter((r) => r.status === 'qualified')
      .reduce((sum, r) => sum + Number(r.referrer_bonus ?? 0), 0),
  };
}
