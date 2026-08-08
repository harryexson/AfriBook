import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const admin = createAdminClient() as any;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { user } = await requireAuthenticatedUser();

    const { data: evt } = await admin
      .from('events')
      .select('id, organizer_id, title, celebration_type, status')
      .eq('id', eventId)
      .single();

    if (!evt || evt.celebration_type == null) {
      return NextResponse.json({ success: false, error: 'Celebration not found' }, { status: 404 });
    }

    const isOrganizer = evt.organizer_id === user.id;
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role ?? '';
    if (!isOrganizer && !['admin', 'super_admin', 'staff'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: only the organizer or staff can check guests in' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { ticketCode } = body;
    if (!ticketCode || typeof ticketCode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing required field: ticketCode' },
        { status: 400 },
      );
    }

    const { data: guest } = await admin
      .from('event_guests')
      .select(
        'id, guest_name, guest_email, rsvp_status, attending_count, check_in_status, checked_in_at',
      )
      .eq('event_id', eventId)
      .eq('ticket_code', ticketCode)
      .maybeSingle();

    if (!guest) {
      return NextResponse.json(
        { success: false, error: 'No guest found for this ticket code' },
        { status: 404 },
      );
    }

    if (guest.check_in_status === 'checked_in' || guest.rsvp_status === 'attended') {
      return NextResponse.json({
        success: true,
        data: {
          alreadyCheckedIn: true,
          guest: { name: guest.guest_name, rsvpStatus: guest.rsvp_status },
          checkedInAt: guest.checked_in_at,
        },
        message: `${guest.guest_name} was already checked in.`,
      });
    }

    await admin
      .from('event_guests')
      .update({
        rsvp_status: 'attended',
        check_in_status: 'checked_in',
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id,
      })
      .eq('id', guest.id);

    return NextResponse.json({
      success: true,
      data: {
        alreadyCheckedIn: false,
        guest: { name: guest.guest_name, rsvpStatus: 'attended' },
      },
      message: `${guest.guest_name} checked in successfully.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
