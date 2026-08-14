// ─── Celebrations service ──────────────────────────────────────
// Domain logic for hosted celebration pages (weddings, baby showers,
// birthdays, ...) built on top of the events schema.
//
// Responsibility split:
//   * This module: DB reads/writes + capacity/billing/reminder/domain rules.
//   * API routes: auth, HTTP parsing, Stripe payment-intent creation.
//
// Pricing rule: canonical celebration prices are USD on `celebration_plans`.
// They are localized to a planner's own market with the same PPP machinery
// used everywhere else in AfriBook (`usdToLocal`), and every amount returned
// to the client carries an explicit `currencyCode`.
//
// The supabase client is loosely typed (`any`) because these tables are newer
// than the generated `Database` type; callers pass the service-role client
// from `@/lib/supabase/admin` or the SSR client from `@/lib/supabase/server`
// — RLS policies do the authorization, never this module.
// ───────────────────────────────────────────────────────────────

import { getCurrencyConfig, getCurrencyForCountry } from '@/lib/money';
import { usdToLocal } from '@/lib/localization/ppp';
import { generateTicketCode } from '@/lib/events/qr-generator';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';
import type { LocalizedCelebrationPlan } from '@/types/celebrations';

export const CELEBRATION_PLAN_CODES = [
  'free',
  'cap_45',
  'cap_75',
  'cap_100',
  'cap_150',
  'cap_unlimited',
] as const;

export type CelebrationPlanCode = (typeof CELEBRATION_PLAN_CODES)[number];

// ─── Market context ────────────────────────────────────────────

export interface PlannerMarket {
  countryCode: string;
  currencyCode: string;
  exchangeRate: number;
}

/**
 * Resolve a planner's market for price localization. Reads the profile's
 * country, falls back to USD when no market can be determined. Never throws.
 */
export async function resolvePlannerMarket(
  db: any,
  userId: string,
): Promise<PlannerMarket> {
  const { data: profile } = await db
    .from('profiles')
    .select('country_code')
    .eq('id', userId)
    .single();

  const countryCode = (profile?.country_code ?? 'NG').toUpperCase();
  const currencyCode = getCurrencyForCountry(countryCode);
  const config = getCurrencyConfig(currencyCode);
  const exchangeRate = config?.exchangeRate ?? 1;

  return { countryCode, currencyCode, exchangeRate };
}

/** Market context derived from an existing event (its own currency wins). */
export function marketFromEvent(event: {
  country_code?: string | null;
  currency_code?: string | null;
}): PlannerMarket {
  const countryCode = (event.country_code ?? 'NG').toUpperCase();
  const currencyCode = event.currency_code ?? getCurrencyForCountry(countryCode);
  const config = getCurrencyConfig(currencyCode);
  const exchangeRate = config?.exchangeRate ?? 1;
  return { countryCode, currencyCode, exchangeRate };
}

// ─── Plans ─────────────────────────────────────────────────────

interface CelebrationPlanRow {
  id: string;
  code: string;
  name: string;
  guest_capacity: number | null;
  price_monthly_usd: number;
  price_per_event_usd: number;
  donation_fee_percent: number;
  sms_enabled: boolean;
  custom_domain_enabled: boolean;
  photo_upload_enabled: boolean;
  donations_enabled: boolean;
  menu_enabled: boolean;
  guest_list_enabled: boolean;
  max_reminders_per_event: number;
  sort_order: number;
  is_active: boolean;
}

export function localizeCelebrationPlan(
  plan: CelebrationPlanRow,
  market: PlannerMarket,
): LocalizedCelebrationPlan {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    guestCapacity: plan.guest_capacity,
    priceMonthly: usdToLocal(plan.price_monthly_usd, market.countryCode, market.exchangeRate),
    pricePerEvent: usdToLocal(plan.price_per_event_usd, market.countryCode, market.exchangeRate),
    currencyCode: market.currencyCode,
    donationFeePercent: Number(plan.donation_fee_percent),
    smsEnabled: plan.sms_enabled,
    customDomainEnabled: plan.custom_domain_enabled,
    photoUploadEnabled: plan.photo_upload_enabled,
    donationsEnabled: plan.donations_enabled,
    menuEnabled: plan.menu_enabled,
    guestListEnabled: plan.guest_list_enabled,
    maxRemindersPerEvent: plan.max_reminders_per_event,
    isActive: plan.is_active,
  };
}

/** List all active plans localized to the given market. */
export async function getCelebrationPlans(
  db: any,
  market: PlannerMarket,
): Promise<LocalizedCelebrationPlan[]> {
  const { data: rows } = await db
    .from('celebration_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return (rows ?? []).map((plan: CelebrationPlanRow) => localizeCelebrationPlan(plan, market));
}

export async function getCelebrationPlan(
  db: any,
  planCode: string,
): Promise<CelebrationPlanRow | null> {
  const { data } = await db
    .from('celebration_plans')
    .select('*')
    .eq('code', planCode)
    .maybeSingle();
  return data ?? null;
}

// ─── Subscriptions ─────────────────────────────────────────────

interface CelebrationSubscriptionRow {
  id: string;
  user_id: string;
  plan_code: string;
  billing_mode: 'subscription' | 'per_event';
  status: string;
  currency_code: string;
  price_monthly_local: number;
  price_per_event_local: number;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
}

/**
 * The planner's active celebration subscription, or null. Only one active
 * subscription is expected per user.
 */
export async function getActiveCelebrationSubscription(
  db: any,
  userId: string,
): Promise<CelebrationSubscriptionRow | null> {
  const { data } = await db
    .from('celebration_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  return data ?? null;
}

/**
 * Effective plan code for a celebration. Uses the planner's active
 * celebration subscription; defaults to the free plan when none exists.
 */
export async function resolveEventPlanCode(
  db: any,
  userId: string,
): Promise<string> {
  const sub = await getActiveCelebrationSubscription(db, userId);
  if (sub) return sub.plan_code;
  return 'free';
}

export async function getEventPlan(
  db: any,
  event: { organizer_id: string },
): Promise<CelebrationPlanRow> {
  const planCode = await resolveEventPlanCode(db, event.organizer_id);
  const plan = await getCelebrationPlan(db, planCode);
  if (plan) return plan;
  return (await getCelebrationPlan(db, 'free')) as CelebrationPlanRow;
}

// ─── Capacity ──────────────────────────────────────────────────

/**
 * Guests currently counted against a celebration's capacity.
 * Counts invited/confirmed/attended guests (declined releases a slot).
 */
export async function countCelebrationGuests(db: any, eventId: string): Promise<number> {
  const { count } = await db
    .from('event_guests')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .in('rsvp_status', ['invited', 'confirmed', 'attended']);
  return count ?? 0;
}

/** Throws a descriptive Error when the plan's guest capacity is exceeded. */
export async function assertEventCapacity(
  db: any,
  event: { organizer_id: string },
  eventId: string,
  extra: number = 0,
): Promise<void> {
  const plan = await getEventPlan(db, event);
  if (plan.guest_capacity == null) return; // unlimited
  const current = await countCelebrationGuests(db, eventId);
  if (current + extra > plan.guest_capacity) {
    throw new Error(
      `Guest capacity exceeded: this celebration allows ${plan.guest_capacity} guests (currently ${current}).`,
    );
  }
}

// ─── Guests & RSVP ─────────────────────────────────────────────

export function generateGuestRsvpToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

export function celebrationPageUrl(event: {
  slug?: string | null;
  custom_domain?: string | null;
}): string {
  if (event.custom_domain) return `https://${event.custom_domain}`;
  return `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/celebrations/${event.slug ?? ''}`;
}

export interface CreateGuestInput {
  name: string;
  email?: string;
  phone?: string;
  relationship?: string;
  attendingCount?: number;
}

export interface CreatedCelebrationGuest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  rsvpToken: string;
  rsvpUrl: string;
  ticketCode: string;
}

/**
 * Invite one or more guests to a celebration. Each guest gets a unique RSVP
 * token (the capability to respond) and a QR ticket code for check-in.
 * Emails/SMS are sent best-effort and never fail the invite.
 */
export async function createCelebrationGuests(
  db: any,
  event: {
    id: string;
    organizer_id: string;
    title: string;
    slug?: string | null;
    custom_domain?: string | null;
    start_date?: string | null;
    venue_name?: string | null;
  },
  inputs: CreateGuestInput[],
): Promise<CreatedCelebrationGuest[]> {
  if (inputs.length === 0) return [];

  await assertEventCapacity(db, event, event.id, inputs.length);

  const pageUrl = celebrationPageUrl(event);
  const rows = inputs.map((input) => ({
    event_id: event.id,
    guest_name: input.name,
    guest_email: input.email ?? null,
    guest_phone: input.phone ?? null,
    relationship: input.relationship ?? 'other',
    rsvp_status: 'invited' as const,
    rsvp_token: generateGuestRsvpToken(),
    attending_count: input.attendingCount ?? 1,
    ticket_code: generateTicketCode(),
    created_at: new Date().toISOString(),
  }));

  const { data: created, error } = await db.from('event_guests').insert(rows).select();

  if (error || !created) {
    throw new Error(error?.message ?? 'Failed to create guest invitations');
  }

  const createdGuests: CreatedCelebrationGuest[] = created.map((g: any) => ({
    id: g.id,
    name: g.guest_name,
    email: g.guest_email,
    phone: g.guest_phone,
    rsvpToken: g.rsvp_token,
    rsvpUrl: `${pageUrl}?rsvp=${g.rsvp_token}`,
    ticketCode: g.ticket_code,
  }));

  await Promise.all(
    createdGuests.map((guest) => {
      const jobs: Promise<unknown>[] = [];
      if (guest.email) {
        jobs.push(
          sendEmail({
            to: guest.email,
            subject: `You're invited: ${event.title}`,
            html: `<p>Hi ${escapeHtml(guest.name)},</p><p>You are invited to <strong>${escapeHtml(event.title)}</strong> on AfriBook.</p><p>Please RSVP using this link:</p><p><a href="${guest.rsvpUrl}">${guest.rsvpUrl}</a></p><p>— The ${escapeHtml(event.title)} team</p>`,
            template: 'celebration_invite',
            metadata: { event_id: event.id, guest_id: guest.id, rsvp_token: guest.rsvpToken },
          }),
        );
      }
      if (guest.phone) {
        jobs.push(
          sendSms({
            to: guest.phone,
            body: `You're invited to ${event.title}! RSVP here: ${guest.rsvpUrl}`,
            eventId: event.id,
            recipientName: guest.name,
            templateKey: 'celebration_invite',
          }),
        );
      }
      return Promise.all(jobs);
    }),
  );

  return createdGuests;
}

/** Apply an RSVP decision from the guest's unique token (the capability). */
export async function respondToCelebrationRsvp(
  db: any,
  rsvpToken: string,
  decision: {
    attending: boolean;
    attendingCount?: number;
    dietaryNotes?: string;
    notes?: string;
    menuChoiceItemIds?: string[];
  },
): Promise<{ ok: boolean; error?: string }> {
  const { data: guest, error } = await db
    .from('event_guests')
    .select('id, event_id, rsvp_status')
    .eq('rsvp_token', rsvpToken)
    .maybeSingle();

  if (error || !guest) {
    return { ok: false, error: 'Invalid or expired RSVP link' };
  }
  if (guest.rsvp_status === 'attended') {
    return { ok: false, error: 'This guest has already attended the celebration' };
  }

  const attendingCount =
    decision.attendingCount && decision.attendingCount >= 1 ? decision.attendingCount : 1;

  const { error: updateError } = await db
    .from('event_guests')
    .update({
      rsvp_status: decision.attending ? 'confirmed' : 'declined',
      rsvp_response_date: new Date().toISOString(),
      attending_count: decision.attending ? attendingCount : 0,
      dietary_notes: decision.dietaryNotes ?? null,
      notes: decision.notes ?? null,
    })
    .eq('id', guest.id);

  if (updateError) return { ok: false, error: updateError.message };

  if (decision.attending && decision.menuChoiceItemIds?.length) {
    const { data: evt } = await db
      .from('events')
      .select('allow_menu_choice, menu_deadline')
      .eq('id', guest.event_id)
      .single();

    const menuOpen =
      evt?.allow_menu_choice &&
      (!evt.menu_deadline || new Date(evt.menu_deadline).getTime() >= Date.now());

    if (menuOpen) {
      const { data: validItems } = await db
        .from('celebration_menu_items')
        .select('id')
        .eq('event_id', guest.event_id)
        .eq('is_active', true)
        .in('id', decision.menuChoiceItemIds);

      const validIds = new Set((validItems ?? []).map((i: { id: string }) => i.id));
      const choices = decision.menuChoiceItemIds
        .filter((id) => validIds.has(id))
        .map((menu_item_id) => ({
          guest_id: guest.id,
          menu_item_id,
          quantity: 1,
          created_at: new Date().toISOString(),
        }));

      if (choices.length) {
        await db.from('celebration_guest_choices').delete().eq('guest_id', guest.id);
        const { error: choiceError } = await db
          .from('celebration_guest_choices')
          .insert(choices);
        if (choiceError) return { ok: false, error: choiceError.message };
      }
    }
  } else if (!decision.attending) {
    await db.from('celebration_guest_choices').delete().eq('guest_id', guest.id);
  }

  return { ok: true };
}

// ─── Reminders (SMS) ───────────────────────────────────────────

export interface ReminderQuota {
  maxReminders: number;
  usedReminders: number;
  smsEnabled: boolean;
  remaining: number;
}

export async function getCelebrationReminderQuota(
  db: any,
  event: { organizer_id: string },
  eventId: string,
): Promise<ReminderQuota> {
  const plan = await getEventPlan(db, event);
  const { count } = await db
    .from('sms_logs')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('template_key', 'celebration_reminder');
  const used = count ?? 0;
  const max = plan.max_reminders_per_event;
  return {
    maxReminders: max,
    usedReminders: used,
    smsEnabled: plan.sms_enabled,
    remaining: Math.max(max - used, 0),
  };
}

/**
 * Send event-reminder SMS to all confirmed guests. Enforces plan gating
 * (sms_enabled) and the per-event reminder quota. Returns a per-phone result
 * so callers can surface partial failures without a hard error.
 */
export async function sendCelebrationReminders(
  db: any,
  event: {
    id: string;
    organizer_id: string;
    title: string;
    slug?: string | null;
    custom_domain?: string | null;
  },
): Promise<{ sent: number; failed: number; quota: ReminderQuota }> {
  const quota = await getCelebrationReminderQuota(db, event, event.id);
  if (!quota.smsEnabled) {
    throw new Error('SMS reminders are not enabled on your celebration plan');
  }
  if (quota.remaining <= 0) {
    throw new Error(`Reminder quota exhausted (${quota.maxReminders} per event)`);
  }

  const { data: guests } = await db
    .from('event_guests')
    .select('guest_name, guest_phone')
    .eq('event_id', event.id)
    .eq('rsvp_status', 'confirmed')
    .not('guest_phone', 'is', null);

  const pageUrl = celebrationPageUrl(event);
  let sent = 0;
  let failed = 0;

  await Promise.all(
    (guests ?? []).map(async (guest: { guest_name: string; guest_phone: string }) => {
      const result = await sendSms({
        to: guest.guest_phone,
        body: `Reminder: ${event.title} is coming up. Details: ${pageUrl}`,
        eventId: event.id,
        recipientName: guest.guest_name,
        templateKey: 'celebration_reminder',
      });
      if (result.ok) sent += 1;
      else failed += 1;
    }),
  );

  return { sent, failed, quota };
}

// ─── Donations ─────────────────────────────────────────────────

export interface DonationFeeBreakdown {
  currencyCode: string;
  feePercent: number;
  platformFee: number;
  netAmount: number;
}

/**
 * Compute the platform commission split for a donation using the event's
 * configured `donation_fee_percent` (seeded from the planner's plan).
 */
export async function calculateDonationFee(
  db: any,
  event: { id: string; currency_code?: string | null },
  amount: number,
): Promise<DonationFeeBreakdown> {
  const { data: evt } = await db
    .from('events')
    .select('currency_code, donation_fee_percent')
    .eq('id', event.id)
    .single();

  const currencyCode = evt?.currency_code ?? event.currency_code ?? 'USD';
  const feePercent = Number(evt?.donation_fee_percent ?? 8);
  const platformFee = Math.round(amount * (feePercent / 100) * 100) / 100;
  const netAmount = Math.round((amount - platformFee) * 100) / 100;

  return { currencyCode, feePercent, platformFee, netAmount };
}

export async function getCelebrationDonationTotals(
  db: any,
  eventId: string,
): Promise<{ totalAmount: number; donorCount: number }> {
  const { data } = await db.rpc('get_celebration_donation_totals', { p_event_id: eventId });
  return {
    totalAmount: Number(data?.total_amount ?? 0),
    donorCount: Number(data?.donor_count ?? 0),
  };
}

// ─── Custom domains ────────────────────────────────────────────

/**
 * Best-effort DNS TXT verification for a celebration custom domain.
 * Expects `afribook-verify=<eventId>` in the domain's TXT records.
 * In environments without public DNS access this marks the domain `pending`
 * (a manual/background job can complete verification later).
 */
export async function verifyCelebrationDomain(
  db: any,
  eventId: string,
  domain: string,
): Promise<'verified' | 'pending' | 'failed'> {
  const normalized = domain.toLowerCase().trim();
  const expected = `afribook-verify=${eventId}`;

  let status: 'verified' | 'pending' | 'failed' = 'pending';
  try {
    const dnsResult = await resolveTxtRecords(normalized);
    if (dnsResult?.includes(expected)) status = 'verified';
    else if (dnsResult === null) status = 'pending';
    else status = 'failed';
  } catch {
    status = 'pending';
  }

  await db
    .from('events')
    .update({
      custom_domain: normalized,
      custom_domain_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId);

  return status;
}

async function resolveTxtRecords(domain: string): Promise<string[] | null> {
  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=TXT`,
      { headers: { Accept: 'application/dns-json' } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { Answer?: { data?: string }[] };
    return (json.Answer ?? []).map((a) => (a.data ?? '').replace(/"/g, ''));
  } catch {
    return null;
  }
}

// ─── Public celebration page ──────────────────────────────────

/** Build the public payload shared by the RSVP and `[slug]` page routes. */
export async function getCelebrationPublicPayload(
  db: any,
  eventId: string,
  evt: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    celebration_type: string;
    celebrant_a_name?: string | null;
    celebrant_b_name?: string | null;
    dress_code?: string | null;
    hashtag?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    timezone?: string | null;
    rsvp_deadline?: string | null;
    menu_deadline?: string | null;
    allow_menu_choice?: boolean | null;
    allow_donations?: boolean | null;
    donation_goal?: number | null;
    cover_image_url?: string | null;
    venue_name?: string | null;
    venue_address?: string | null;
    venue_city?: string | null;
    currency_code?: string | null;
    custom_domain?: string | null;
    custom_domain_status?: string | null;
  },
): Promise<any> {
  const pageUrl = celebrationPageUrl(evt);

  const [menu, donationTotals, confirmedCount] = await Promise.all([
    evt.allow_menu_choice
      ? db
          .from('celebration_menu_items')
          .select('id, name, category, description, is_vegetarian, is_vegan, is_halal, is_kosher, allergens, sort_order')
          .eq('event_id', eventId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
      : Promise.resolve({ data: [] }),
    evt.allow_donations
      ? getCelebrationDonationTotals(db, eventId)
      : Promise.resolve({ totalAmount: 0, donorCount: 0 }),
    db
      .from('event_guests')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('rsvp_status', 'confirmed'),
  ]);

  const confirmed = confirmedCount.count ?? 0;

  return {
    event: {
      id: evt.id,
      title: evt.title,
      slug: evt.slug,
      description: evt.description,
      pageUrl,
      celebrationType: evt.celebration_type,
      celebrantAName: evt.celebrant_a_name,
      celebrantBName: evt.celebrant_b_name,
      dressCode: evt.dress_code,
      hashtag: evt.hashtag,
      startDate: evt.start_date,
      endDate: evt.end_date,
      timezone: evt.timezone,
      rsvpDeadline: evt.rsvp_deadline,
      menuDeadline: evt.menu_deadline,
      coverImageUrl: evt.cover_image_url,
      venueName: evt.venue_name,
      venueAddress: evt.venue_address,
      venueCity: evt.venue_city,
    },
    allowMenuChoice: evt.allow_menu_choice,
    allowDonations: evt.allow_donations,
    donationGoal: Number(evt.donation_goal),
    currencyCode: evt.currency_code,
    menu: menu.data ?? [],
    donations: {
      totalAmount: Number(donationTotals.totalAmount ?? 0),
      donorCount: Number(donationTotals.donorCount ?? 0),
    },
    guestStats: {
      confirmed,
    },
  };
}

// ─── Helpers ───────────────────────────────────────────────────

/** Convert a major-unit amount into Stripe minor units for a currency. */
export function toMinorUnits(amount: number, currencyCode: string): number {
  const decimals = getCurrencyConfig(currencyCode)?.decimalPlaces ?? 2;
  return Math.round(amount * 10 ** decimals);
}

/** Convert Stripe minor units back into a major-unit amount. */
export function fromMinorUnits(amount: number, currencyCode: string): number {
  const decimals = getCurrencyConfig(currencyCode)?.decimalPlaces ?? 2;
  return Math.round(amount) / 10 ** decimals;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
