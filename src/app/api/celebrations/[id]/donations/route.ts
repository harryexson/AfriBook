import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { query } from '@/lib/neon/admin';
import {
  calculateDonationFee,
  getCelebrationDonationTotals,
  getEventPlan,
  toMinorUnits,
} from '@/lib/celebrations/service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;

    const evtRows = await query<{
      id: string;
      allow_donations: boolean | null;
      donation_goal: number | null;
      currency_code: string | null;
      donation_fee_percent: number | null;
    }>(
      `SELECT id, allow_donations, donation_goal, currency_code, donation_fee_percent FROM events WHERE id = $1 LIMIT 1`,
      [eventId],
    );
    const evt = evtRows[0] ?? null;

    if (!evt?.allow_donations) {
      return NextResponse.json(
        { success: false, error: 'Donations are not enabled for this celebration' },
        { status: 400 },
      );
    }

    const totals = await getCelebrationDonationTotals(eventId);

    return NextResponse.json({
      success: true,
      data: {
        goal: Number(evt.donation_goal ?? 0),
        raised: totals.totalAmount,
        donorCount: totals.donorCount,
        currencyCode: evt.currency_code,
        feePercent: Number(evt.donation_fee_percent ?? 8),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();
    const { donorName, donorEmail, donorPhone, amount, message, isAnonymous } = body;

    if (!donorName || typeof donorName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing required field: donorName' },
        { status: 400 },
      );
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 },
      );
    }

    const evtRows = await query<{
      id: string;
      organizer_id: string;
      title: string;
      status: string;
      allow_donations: boolean | null;
      donation_goal: number | null;
      currency_code: string | null;
      donation_fee_percent: number | null;
    }>(
      `SELECT id, organizer_id, title, status, allow_donations, donation_goal, currency_code, donation_fee_percent
       FROM events WHERE id = $1 LIMIT 1`,
      [eventId],
    );
    const evt = evtRows[0] ?? null;

    if (!evt) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }
    if (evt.status !== 'published') {
      return NextResponse.json(
        { success: false, error: 'Donations open once the celebration is published' },
        { status: 400 },
      );
    }
    if (!evt.allow_donations) {
      return NextResponse.json(
        { success: false, error: 'Donations are not enabled for this celebration' },
        { status: 400 },
      );
    }

    // Plan-level feature gate: donations_enabled must be on for the effective plan.
    const plan = await getEventPlan(evt);
    if (!plan.donations_enabled) {
      return NextResponse.json(
        { success: false, error: 'Donations are not enabled on the current celebration plan' },
        { status: 400 },
      );
    }

    const { currencyCode, feePercent, platformFee, netAmount } = await calculateDonationFee(
      evt,
      numericAmount,
    );

    // Insert a pending donation row first so the webhook can reconcile by ID.
    let donation: { id: string } | null = null;
    try {
      const nowIso = new Date().toISOString();
      const inserted = await query<{ id: string }>(
        `INSERT INTO celebration_donations
           (event_id, donor_name, donor_email, donor_phone, amount, currency_code, fee_percent,
            platform_fee, net_amount, message, is_anonymous, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', $12, $13)
         RETURNING id`,
        [
          eventId,
          donorName,
          donorEmail ?? null,
          donorPhone ?? null,
          numericAmount,
          currencyCode,
          feePercent,
          platformFee,
          netAmount,
          message ?? null,
          Boolean(isAnonymous),
          nowIso,
          nowIso,
        ],
      );
      donation = inserted[0] ?? null;
    } catch {
      donation = null;
    }

    if (!donation) {
      return NextResponse.json(
        { success: false, error: 'Failed to create donation record' },
        { status: 500 },
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: toMinorUnits(numericAmount, currencyCode),
      currency: currencyCode.toLowerCase(),
      metadata: {
        type: 'celebration_donation',
        donation_id: donation.id,
        event_id: eventId,
        organizer_id: evt.organizer_id,
        net_amount: String(netAmount),
        currency_code: currencyCode,
      },
      receipt_email: donorEmail ?? undefined,
    });

    await query(
      `UPDATE celebration_donations SET stripe_payment_intent_id = $1, updated_at = $2 WHERE id = $3`,
      [paymentIntent.id, new Date().toISOString(), donation.id],
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          donationId: donation.id,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: numericAmount,
          currencyCode,
          platformFee,
          netAmount,
          feePercent,
        },
        message: 'Donation initiated. Complete payment to finalize your gift.',
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
