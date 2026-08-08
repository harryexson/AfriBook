import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createCelebrationGuests,
  countCelebrationGuests,
  resolveEventPlanCode,
  getCelebrationPlan,
} from '@/lib/celebrations/service';

const admin = createAdminClient() as any;

async function assertOrganizer(userId: string, eventId: string): Promise<void> {
  const { data: evt } = await admin
    .from('events')
    .select('id, organizer_id, celebration_type')
    .eq('id', eventId)
    .single();

  if (!evt || evt.celebration_type == null) {
    throw Object.assign(new Error('Not found: not a celebration'), { status: 404 });
  }
  if (evt.organizer_id !== userId) {
    throw Object.assign(new Error('Forbidden: only the organizer can manage guests'), { status: 403 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { user } = await requireAuthenticatedUser();
    await assertOrganizer(user.id, eventId);

    const [guests, total] = await Promise.all([
      admin
        .from('event_guests')
        .select(
          'id, guest_name, guest_email, guest_phone, relationship, rsvp_status, rsvp_response_date, attending_count, dietary_notes, notes, ticket_code, created_at',
        )
        .eq('event_id', eventId)
        .order('created_at', { ascending: false }),
      countCelebrationGuests(admin, eventId),
    ]);

    const planCode = await resolveEventPlanCode(admin, user.id);
    const plan = await getCelebrationPlan(admin, planCode);

    const statusCounts = { invited: 0, confirmed: 0, declined: 0, attended: 0 };
    for (const g of guests ?? []) {
      const key = g.rsvp_status as keyof typeof statusCounts;
      if (key in statusCounts) statusCounts[key] += 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        guests: guests ?? [],
        counts: {
          ...statusCounts,
          totalGuests: (guests ?? []).length,
        },
        capacity: {
          planCode,
          guestCapacity: plan?.guest_capacity ?? null,
          used: total,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { user } = await requireAuthenticatedUser();
    await assertOrganizer(user.id, eventId);

    const body = await req.json();
    const { guests } = body;

    if (!guests || !Array.isArray(guests) || guests.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: guests[]' },
        { status: 400 },
      );
    }

    if (guests.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Maximum 500 guests per invite batch' },
        { status: 400 },
      );
    }

    const { data: evt } = await admin
      .from('events')
      .select(
        'id, organizer_id, title, slug, custom_domain, custom_domain_status, start_date, venue_name, billing_mode, billing_status',
      )
      .eq('id', eventId)
      .single();

    if (evt.billing_mode === 'per_event' && evt.billing_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Celebration is not yet active — complete per-event billing first' },
        { status: 402 },
      );
    }

    const created = await createCelebrationGuests(
      admin,
      {
        id: evt.id,
        organizer_id: evt.organizer_id,
        title: evt.title,
        slug: evt.slug,
        custom_domain: evt.custom_domain_status === 'verified' ? evt.custom_domain : null,
        start_date: evt.start_date,
        venue_name: evt.venue_name,
      },
      guests,
    );

    return NextResponse.json(
      {
        success: true,
        data: { guests: created, count: created.length },
        message: `${created.length} invitation(s) sent`,
      },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 },
    );
  }
}
