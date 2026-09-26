import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/neon/server';
import { query } from '@/lib/neon/admin';
import {
  createCelebrationGuests,
  countCelebrationGuests,
  resolveEventPlanCode,
  getCelebrationPlan,
} from '@/lib/celebrations/service';

async function assertOrganizer(userId: string, eventId: string): Promise<void> {
  const rows = await query<{ id: string; organizer_id: string; celebration_type: string | null }>(
    `SELECT id, organizer_id, celebration_type FROM events WHERE id = $1 LIMIT 1`,
    [eventId],
  );
  const evt = rows[0] ?? null;

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
      query<{
        id: string;
        guest_name: string;
        guest_email: string | null;
        guest_phone: string | null;
        relationship: string | null;
        rsvp_status: string;
        rsvp_response_date: string | null;
        attending_count: number | null;
        dietary_notes: string | null;
        notes: string | null;
        ticket_code: string;
        created_at: string;
      }>(
        `SELECT id, guest_name, guest_email, guest_phone, relationship, rsvp_status, rsvp_response_date,
                attending_count, dietary_notes, notes, ticket_code, created_at
         FROM event_guests WHERE event_id = $1 ORDER BY created_at DESC`,
        [eventId],
      ),
      countCelebrationGuests(eventId),
    ]);

    const planCode = await resolveEventPlanCode(user.id);
    const plan = await getCelebrationPlan(planCode);

    const statusCounts = { invited: 0, confirmed: 0, declined: 0, attended: 0 };
    for (const g of guests) {
      const key = g.rsvp_status as keyof typeof statusCounts;
      if (key in statusCounts) statusCounts[key] += 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        guests,
        counts: {
          ...statusCounts,
          totalGuests: guests.length,
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

    const evtRows = await query<{
      id: string;
      organizer_id: string;
      title: string;
      slug: string | null;
      custom_domain: string | null;
      custom_domain_status: string | null;
      start_date: string | null;
      venue_name: string | null;
      billing_mode: string | null;
      billing_status: string | null;
    }>(
      `SELECT id, organizer_id, title, slug, custom_domain, custom_domain_status, start_date, venue_name, billing_mode, billing_status
       FROM events WHERE id = $1 LIMIT 1`,
      [eventId],
    );
    const evt = evtRows[0];

    if (evt.billing_mode === 'per_event' && evt.billing_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Celebration is not yet active — complete per-event billing first' },
        { status: 402 },
      );
    }

    const created = await createCelebrationGuests(
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
