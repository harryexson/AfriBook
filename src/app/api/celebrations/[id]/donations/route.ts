import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  calculateDonationFee,
  getCelebrationDonationTotals,
  getEventPlan,
  toMinorUnits,
} from '@/lib/celebrations/service';

const admin = createAdminClient() as any;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;

    const { data: evt } = await admin
      .from('events')
      .select('id, allow_donations, donation_goal, currency_code, donation_fee_percent')
      .eq('id', eventId)
      .single();

    if (!evt?.allow_donations) {
      return NextResponse.json(
        { success: false, error: 'Donations are not enabled for this celebration' },
        { status: 400 },
      );
    }

    const totals = await getCelebrationDonationTotals(admin, eventId);

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

    const { data: evt } = await admin
      .from('events')
      .select(
        'id, organizer_id, title, status, allow_donations, donation_goal, currency_code, donation_fee_percent',
      )
      .eq('id', eventId)
      .single();

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
    const plan = await getEventPlan(admin, evt);
    if (!plan.donations_enabled) {
      return NextResponse.json(
        { success: false, error: 'Donations are not enabled on the current celebration plan' },
        { status: 400 },
      );
    }

    const { currencyCode, feePercent, platformFee, netAmount } = await calculateDonationFee(
      admin,
      evt,
      numericAmount,
    );

    // Insert a pending donation row first so the webhook can reconcile by ID.
    const { data: donation, error: insertError } = await admin
      .from('celebration_donations')
      .insert({
        event_id: eventId,
        donor_name: donorName,
        donor_email: donorEmail ?? null,
        donor_phone: donorPhone ?? null,
        amount: numericAmount,
        currency_code: currencyCode,
        fee_percent: feePercent,
        platform_fee: platformFee,
        net_amount: netAmount,
        message: message ?? null,
        is_anonymous: Boolean(isAnonymous),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !donation) {
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

    await admin
      .from('celebration_donations')
      .update({ stripe_payment_intent_id: paymentIntent.id, updated_at: new Date().toISOString() })
      .eq('id', donation.id);

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
