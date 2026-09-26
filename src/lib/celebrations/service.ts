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
// This module talks to Postgres directly via `@/lib/neon/admin`'s `query()`/
// `withTransaction()` (the service-role-equivalent path — see admin.ts for
// why there's no `.from()` builder to fake here). Authorization for these
// operations is enforced by the calling API routes (organizer/staff checks),
// not by this module.
// ───────────────────────────────────────────────────────────────

import { query, withTransaction } from '@/lib/neon/admin';
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
export async function resolvePlannerMarket(userId: string): Promise<PlannerMarket> {
  const rows = await query<{ country_code: string | null }>(
    `SELECT country_code FROM profiles WHERE id = $1 LIMIT 1`,
    [userId],
  );

  const countryCode = (rows[0]?.country_code ?? 'NG').toUpperCase();
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
export async function getCelebrationPlans(market: PlannerMarket): Promise<LocalizedCelebrationPlan[]> {
  const rows = await query<CelebrationPlanRow>(
    `SELECT * FROM celebration_plans WHERE is_active = true ORDER BY sort_order ASC`,
  );

  return rows.map((plan) => localizeCelebrationPlan(plan, market));
}

export async function getCelebrationPlan(planCode: string): Promise<CelebrationPlanRow | null> {
  const rows = await query<CelebrationPlanRow>(
    `SELECT * FROM celebration_plans WHERE code = $1 LIMIT 1`,
    [planCode],
  );
  return rows[0] ?? null;
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
  userId: string,
): Promise<CelebrationSubscriptionRow | null> {
  const rows = await query<CelebrationSubscriptionRow>(
    `SELECT * FROM celebration_subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}

/**
 * Effective plan code for a celebration. Uses the planner's active
 * celebration subscription; defaults to the free plan when none exists.
 */
export async function resolveEventPlanCode(userId: string): Promise<string> {
  const sub = await getActiveCelebrationSubscription(userId);
  if (sub) return sub.plan_code;
  return 'free';
}

export async function getEventPlan(event: { organizer_id: string }): Promise<CelebrationPlanRow> {
  const planCode = await resolveEventPlanCode(event.organizer_id);
  const plan = await getCelebrationPlan(planCode);
  if (plan) return plan;
  return (await getCelebrationPlan('free')) as CelebrationPlanRow;
}

// ─── Capacity ──────────────────────────────────────────────────

/**
 * Guests currently counted against a celebration's capacity.
 * Counts invited/confirmed/attended guests (declined releases a slot).
 */
export async function countCelebrationGuests(eventId: string): Promise<number> {
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM event_guests
     WHERE event_id = $1 AND rsvp_status IN ('invited', 'confirmed', 'attended')`,
    [eventId],
  );
  return Number(rows[0]?.count ?? 0);
}

/** Throws a descriptive Error when the plan's guest capacity is exceeded. */
export async function assertEventCapacity(
  event: { organizer_id: string },
  eventId: string,
  extra: number = 0,
): Promise<void> {
  const plan = await getEventPlan(event);
  if (plan.guest_capacity == null) return; // unlimited
  const current = await countCelebrationGuests(eventId);
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

interface InsertedGuestRow {
  id: string;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  rsvp_token: string;
  ticket_code: string;
}

/**
 * Invite one or more guests to a celebration. Each guest gets a unique RSVP
 * token (the capability to respond) and a QR ticket code for check-in.
 * Emails/SMS are sent best-effort and never fail the invite.
 */
export async function createCelebrationGuests(
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

  await assertEventCapacity(event, event.id, inputs.length);

  const pageUrl = celebrationPageUrl(event);
  const now = new Date().toISOString();
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
    created_at: now,
  }));

  const columns = [
    'event_id',
    'guest_name',
    'guest_email',
    'guest_phone',
    'relationship',
    'rsvp_status',
    'rsvp_token',
    'attending_count',
    'ticket_code',
    'created_at',
  ];
  const values: unknown[] = [];
  const valuePlaceholders = rows.map((row, rowIndex) => {
    const placeholders = columns.map((col, colIndex) => {
      values.push((row as Record<string, unknown>)[col]);
      return `$${rowIndex * columns.length + colIndex + 1}`;
    });
    return `(${placeholders.join(', ')})`;
  });

  const created = await query<InsertedGuestRow>(
    `INSERT INTO event_guests (${columns.join(', ')})
     VALUES ${valuePlaceholders.join(', ')}
     RETURNING id, guest_name, guest_email, guest_phone, rsvp_token, ticket_code`,
    values,
  );

  const createdGuests: CreatedCelebrationGuest[] = created.map((g) => ({
    id: g.id,
    name: g.guest_name,
    email: g.guest_email ?? undefined,
    phone: g.guest_phone ?? undefined,
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
  rsvpToken: string,
  decision: {
    attending: boolean;
    attendingCount?: number;
    dietaryNotes?: string;
    notes?: string;
    menuChoiceItemIds?: string[];
  },
): Promise<{ ok: boolean; error?: string }> {
  return withTransaction(async (txQuery) => {
    const guestRows = await txQuery<{ id: string; event_id: string; rsvp_status: string }>(
      `SELECT id, event_id, rsvp_status FROM event_guests WHERE rsvp_token = $1 LIMIT 1`,
      [rsvpToken],
    );
    const guest = guestRows[0];

    if (!guest) {
      return { ok: false, error: 'Invalid or expired RSVP link' };
    }
    if (guest.rsvp_status === 'attended') {
      return { ok: false, error: 'This guest has already attended the celebration' };
    }

    const attendingCount =
      decision.attendingCount && decision.attendingCount >= 1 ? decision.attendingCount : 1;

    await txQuery(
      `UPDATE event_guests
       SET rsvp_status = $1, rsvp_response_date = $2, attending_count = $3, dietary_notes = $4, notes = $5
       WHERE id = $6`,
      [
        decision.attending ? 'confirmed' : 'declined',
        new Date().toISOString(),
        decision.attending ? attendingCount : 0,
        decision.dietaryNotes ?? null,
        decision.notes ?? null,
        guest.id,
      ],
    );

    if (decision.attending && decision.menuChoiceItemIds?.length) {
      const evtRows = await txQuery<{ allow_menu_choice: boolean | null; menu_deadline: string | null }>(
        `SELECT allow_menu_choice, menu_deadline FROM events WHERE id = $1 LIMIT 1`,
        [guest.event_id],
      );
      const evt = evtRows[0];

      const menuOpen =
        evt?.allow_menu_choice &&
        (!evt.menu_deadline || new Date(evt.menu_deadline).getTime() >= Date.now());

      if (menuOpen) {
        const validItems = await txQuery<{ id: string }>(
          `SELECT id FROM celebration_menu_items
           WHERE event_id = $1 AND is_active = true AND id = ANY($2::uuid[])`,
          [guest.event_id, decision.menuChoiceItemIds],
        );

        const validIds = new Set(validItems.map((i) => i.id));
        const choices = decision.menuChoiceItemIds
          .filter((id) => validIds.has(id))
          .map((menu_item_id) => ({
            guest_id: guest.id,
            menu_item_id,
            quantity: 1,
            created_at: new Date().toISOString(),
          }));

        if (choices.length) {
          await txQuery(`DELETE FROM celebration_guest_choices WHERE guest_id = $1`, [guest.id]);

          const columns = ['guest_id', 'menu_item_id', 'quantity', 'created_at'];
          const values: unknown[] = [];
          const valuePlaceholders = choices.map((choice, rowIndex) => {
            const placeholders = columns.map((col, colIndex) => {
              values.push((choice as Record<string, unknown>)[col]);
              return `$${rowIndex * columns.length + colIndex + 1}`;
            });
            return `(${placeholders.join(', ')})`;
          });

          await txQuery(
            `INSERT INTO celebration_guest_choices (${columns.join(', ')}) VALUES ${valuePlaceholders.join(', ')}`,
            values,
          );
        }
      }
    } else if (!decision.attending) {
      await txQuery(`DELETE FROM celebration_guest_choices WHERE guest_id = $1`, [guest.id]);
    }

    return { ok: true };
  });
}

// ─── Reminders (SMS) ───────────────────────────────────────────

export interface ReminderQuota {
  maxReminders: number;
  usedReminders: number;
  smsEnabled: boolean;
  remaining: number;
}

export async function getCelebrationReminderQuota(
  event: { organizer_id: string },
  eventId: string,
): Promise<ReminderQuota> {
  const plan = await getEventPlan(event);
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM sms_logs WHERE event_id = $1 AND template_key = 'celebration_reminder'`,
    [eventId],
  );
  const used = Number(rows[0]?.count ?? 0);
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
export async function sendCelebrationReminders(event: {
  id: string;
  organizer_id: string;
  title: string;
  slug?: string | null;
  custom_domain?: string | null;
}): Promise<{ sent: number; failed: number; quota: ReminderQuota }> {
  const quota = await getCelebrationReminderQuota(event, event.id);
  if (!quota.smsEnabled) {
    throw new Error('SMS reminders are not enabled on your celebration plan');
  }
  if (quota.remaining <= 0) {
    throw new Error(`Reminder quota exhausted (${quota.maxReminders} per event)`);
  }

  const guests = await query<{ guest_name: string; guest_phone: string }>(
    `SELECT guest_name, guest_phone FROM event_guests
     WHERE event_id = $1 AND rsvp_status = 'confirmed' AND guest_phone IS NOT NULL`,
    [event.id],
  );

  const pageUrl = celebrationPageUrl(event);
  let sent = 0;
  let failed = 0;

  await Promise.all(
    guests.map(async (guest) => {
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
  event: { id: string; currency_code?: string | null },
  amount: number,
): Promise<DonationFeeBreakdown> {
  const rows = await query<{ currency_code: string | null; donation_fee_percent: number | null }>(
    `SELECT currency_code, donation_fee_percent FROM events WHERE id = $1 LIMIT 1`,
    [event.id],
  );
  const evt = rows[0];

  const currencyCode = evt?.currency_code ?? event.currency_code ?? 'USD';
  const feePercent = Number(evt?.donation_fee_percent ?? 8);
  const platformFee = Math.round(amount * (feePercent / 100) * 100) / 100;
  const netAmount = Math.round((amount - platformFee) * 100) / 100;

  return { currencyCode, feePercent, platformFee, netAmount };
}

export async function getCelebrationDonationTotals(
  eventId: string,
): Promise<{ totalAmount: number; donorCount: number }> {
  const rows = await query<{ total_amount: number; donor_count: number }>(
    `SELECT * FROM get_celebration_donation_totals($1)`,
    [eventId],
  );
  return {
    totalAmount: Number(rows[0]?.total_amount ?? 0),
    donorCount: Number(rows[0]?.donor_count ?? 0),
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

  await query(
    `UPDATE events SET custom_domain = $1, custom_domain_status = $2, updated_at = $3 WHERE id = $4`,
    [normalized, status, new Date().toISOString(), eventId],
  );

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

  const [menuItems, donationTotals, confirmedRows] = await Promise.all([
    evt.allow_menu_choice
      ? query<{
          id: string;
          name: string;
          category: string;
          description: string | null;
          is_vegetarian: boolean;
          is_vegan: boolean;
          is_halal: boolean;
          is_kosher: boolean;
          allergens: unknown;
          sort_order: number;
        }>(
          `SELECT id, name, category, description, is_vegetarian, is_vegan, is_halal, is_kosher, allergens, sort_order
           FROM celebration_menu_items
           WHERE event_id = $1 AND is_active = true
           ORDER BY sort_order ASC`,
          [eventId],
        )
      : Promise.resolve([]),
    evt.allow_donations
      ? getCelebrationDonationTotals(eventId)
      : Promise.resolve({ totalAmount: 0, donorCount: 0 }),
    query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM event_guests WHERE event_id = $1 AND rsvp_status = 'confirmed'`,
      [eventId],
    ),
  ]);

  const confirmed = Number(confirmedRows[0]?.count ?? 0);

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
    menu: menuItems,
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
