import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/neon/server';
import { query } from '@/lib/neon/admin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { user } = await requireAuthenticatedUser();

    const evtRows = await query<{
      id: string;
      organizer_id: string;
      title: string;
      celebration_type: string | null;
      status: string;
    }>(
      `SELECT id, organizer_id, title, celebration_type, status FROM events WHERE id = $1 LIMIT 1`,
      [eventId],
    );
    const evt = evtRows[0] ?? null;

    if (!evt || evt.celebration_type == null) {
      return NextResponse.json({ success: false, error: 'Celebration not found' }, { status: 404 });
    }

    const isOrganizer = evt.organizer_id === user.id;
    const profileRows = await query<{ role: string | null }>(
      `SELECT role FROM profiles WHERE id = $1 LIMIT 1`,
      [user.id],
    );
    const profile = profileRows[0] ?? null;

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

    const guestRows = await query<{
      id: string;
      guest_name: string;
      guest_email: string | null;
      rsvp_status: string;
      attending_count: number | null;
      check_in_status: string | null;
      checked_in_at: string | null;
    }>(
      `SELECT id, guest_name, guest_email, rsvp_status, attending_count, check_in_status, checked_in_at
       FROM event_guests WHERE event_id = $1 AND ticket_code = $2 LIMIT 1`,
      [eventId, ticketCode],
    );
    const guest = guestRows[0] ?? null;

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

    await query(
      `UPDATE event_guests
       SET rsvp_status = 'attended', check_in_status = 'checked_in', checked_in_at = $1, checked_in_by = $2
       WHERE id = $3`,
      [new Date().toISOString(), user.id, guest.id],
    );

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
