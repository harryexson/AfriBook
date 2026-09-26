import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/neon/admin';
import {
  respondToCelebrationRsvp,
  getCelebrationPublicPayload,
} from '@/lib/celebrations/service';

// Public route: no auth. The RSVP token is the capability that authorizes a
// guest to respond; the page payload only exposes aggregate/approved data.

const EVENT_COLUMNS =
  'id, title, slug, description, status, celebration_type, celebrant_a_name, celebrant_b_name, dress_code, hashtag, start_date, end_date, timezone, rsvp_deadline, menu_deadline, allow_menu_choice, allow_donations, donation_goal, cover_image_url, venue_name, venue_address, venue_city, currency_code, custom_domain, custom_domain_status';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const rsvpToken = req.nextUrl.searchParams.get('rsvp');

    const evtRows = await query<any>(
      `SELECT ${EVENT_COLUMNS} FROM events WHERE id = $1 AND status = 'published' LIMIT 1`,
      [eventId],
    );
    const evt = evtRows[0] ?? null;

    if (!evt || evt.celebration_type == null) {
      return NextResponse.json(
        { success: false, error: 'Celebration not found' },
        { status: 404 },
      );
    }

    const data = await getCelebrationPublicPayload(eventId, evt);

    // When the guest arrives with their RSVP token, include their current state
    // (status, selections) so the page can render their saved response.
    if (rsvpToken) {
      const guestRows = await query<{
        id: string;
        guest_name: string;
        rsvp_status: string;
        attending_count: number | null;
        dietary_notes: string | null;
        notes: string | null;
      }>(
        `SELECT id, guest_name, rsvp_status, attending_count, dietary_notes, notes
         FROM event_guests WHERE event_id = $1 AND rsvp_token = $2 LIMIT 1`,
        [eventId, rsvpToken],
      );
      const guest = guestRows[0] ?? null;

      if (guest) {
        const choiceRows = await query<{ menu_item_id: string }>(
          `SELECT menu_item_id FROM celebration_guest_choices WHERE guest_id = $1`,
          [guest.id],
        );
        data.guest = {
          id: guest.id,
          name: guest.guest_name,
          rsvpStatus: guest.rsvp_status,
          attendingCount: guest.attending_count,
          dietaryNotes: guest.dietary_notes,
          notes: guest.notes,
          menuChoiceItemIds: choiceRows.map((c) => c.menu_item_id),
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
    const guestRows = await query<{ id: string }>(
      `SELECT id FROM event_guests WHERE event_id = $1 AND rsvp_token = $2 LIMIT 1`,
      [eventId, token],
    );

    if (!guestRows[0]) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired RSVP link for this celebration' },
        { status: 400 },
      );
    }

    const result = await respondToCelebrationRsvp(token, {
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
