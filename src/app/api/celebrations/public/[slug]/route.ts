import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/neon/admin';
import { getCelebrationPublicPayload } from '@/lib/celebrations/service';

const EVENT_COLUMNS =
  'id, title, slug, description, status, celebration_type, celebrant_a_name, celebrant_b_name, dress_code, hashtag, start_date, end_date, timezone, rsvp_deadline, menu_deadline, allow_menu_choice, allow_donations, donation_goal, cover_image_url, venue_name, venue_address, venue_city, currency_code, custom_domain, custom_domain_status';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const rsvpToken = req.nextUrl.searchParams.get('rsvp');

    const evtRows = await query<any>(
      `SELECT ${EVENT_COLUMNS} FROM events WHERE slug = $1 AND status = 'published' LIMIT 1`,
      [slug],
    );
    const evt = evtRows[0] ?? null;

    if (!evt || evt.celebration_type == null) {
      return NextResponse.json(
        { success: false, error: 'Celebration not found' },
        { status: 404 },
      );
    }

    const data = await getCelebrationPublicPayload(evt.id, evt);

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
        [evt.id, rsvpToken],
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
