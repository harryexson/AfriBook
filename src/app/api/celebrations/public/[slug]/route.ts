import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCelebrationPublicPayload } from '@/lib/celebrations/service';

const admin = createAdminClient() as any;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const rsvpToken = req.nextUrl.searchParams.get('rsvp');

    const { data: evt } = await admin
      .from('events')
      .select(
        'id, title, slug, description, status, celebration_type, celebrant_a_name, celebrant_b_name, dress_code, hashtag, start_date, end_date, timezone, rsvp_deadline, menu_deadline, allow_menu_choice, allow_donations, donation_goal, cover_image_url, venue_name, venue_address, venue_city, currency_code, custom_domain, custom_domain_status',
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (!evt || evt.celebration_type == null) {
      return NextResponse.json(
        { success: false, error: 'Celebration not found' },
        { status: 404 },
      );
    }

    const data = await getCelebrationPublicPayload(admin, evt.id, evt);

    if (rsvpToken) {
      const { data: guest } = await admin
        .from('event_guests')
        .select(
          'id, guest_name, rsvp_status, attending_count, dietary_notes, notes, celebration_guest_choices(menu_item_id)',
        )
        .eq('event_id', evt.id)
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
