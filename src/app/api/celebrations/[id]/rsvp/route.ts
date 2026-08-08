import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  respondToCelebrationRsvp,
  getCelebrationPublicPayload,
} from '@/lib/celebrations/service';

// Public route: no auth. The RSVP token is the capability that authorizes a
// guest to respond; the page payload only exposes aggregate/approved data.
const admin = createAdminClient() as any;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const rsvpToken = req.nextUrl.searchParams.get('rsvp');

    const { data: evt } = await admin
      .from('events')
      .select(
        'id, title, slug, description, status, celebration_type, celebrant_a_name, celebrant_b_name, dress_code, hashtag, start_date, end_date, timezone, rsvp_deadline, menu_deadline, allow_menu_choice, allow_donations, donation_goal, cover_image_url, venue_name, venue_address, venue_city, currency_code, custom_domain, custom_domain_status',
      )
      .eq('id', eventId)
      .eq('status', 'published')
      .single();

    if (!evt || evt.celebration_type == null) {
      return NextResponse.json(
        { success: false, error: 'Celebration not found' },
        { status: 404 },
      );
    }

    const data = await getCelebrationPublicPayload(admin, eventId, evt);

    // When the guest arrives with their RSVP token, include their current state
    // (status, selections) so the page can render their saved response.
    if (rsvpToken) {
      const { data: guest } = await admin
        .from('event_guests')
        .select(
          'id, guest_name, rsvp_status, attending_count, dietary_notes, notes, celebration_guest_choices(menu_item_id)',
        )
        .eq('event_id', eventId)
        .eq('rsvp_token', rsvpToken)
        .maybeSingle();

      if (guest) {
        data.guest = {
          id: guest.id,
          name: guest.guest_name,
          rsvpStatus: guest.rsvp_status,
          attendingCount: guest.attending_count,
          dietaryNotes: guest.dietary_notes,
          notes: guest.notes,
          menuChoiceItemIds: (guest.celebration_guest_choices ?? []).map(
            (c: { menu_item_id: string }) => c.menu_item_id,
          ),
        };
      }
    }

    return NextResponse.json({ success: true, data });
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
    const { token, attending, attendingCount, dietaryNotes, notes, menuChoiceItemIds } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: token' },
        { status: 400 },
      );
    }

    if (typeof attending !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Missing required field: attending (boolean)' },
        { status: 400 },
      );
    }

    // Confirm the token belongs to this celebration before touching anything.
    const { data: guest } = await admin
      .from('event_guests')
      .select('id')
      .eq('event_id', eventId)
      .eq('rsvp_token', token)
      .maybeSingle();

    if (!guest) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired RSVP link for this celebration' },
        { status: 400 },
      );
    }

    const result = await respondToCelebrationRsvp(admin, token, {
      attending,
      attendingCount: typeof attendingCount === 'number' ? attendingCount : undefined,
      dietaryNotes: typeof dietaryNotes === 'string' ? dietaryNotes : undefined,
      notes: typeof notes === 'string' ? notes : undefined,
      menuChoiceItemIds: Array.isArray(menuChoiceItemIds) ? menuChoiceItemIds : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { attending },
      message: attending
        ? 'Thank you — your RSVP has been confirmed!'
        : 'Thank you — your response has been recorded.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
