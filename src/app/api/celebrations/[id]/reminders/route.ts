import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/neon/server';
import { query } from '@/lib/neon/admin';
import { sendCelebrationReminders } from '@/lib/celebrations/service';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { user } = await requireAuthenticatedUser();

    const evtRows = await query<{
      id: string;
      organizer_id: string;
      title: string;
      slug: string | null;
      custom_domain: string | null;
      custom_domain_status: string | null;
      celebration_type: string | null;
    }>(
      `SELECT id, organizer_id, title, slug, custom_domain, custom_domain_status, celebration_type
       FROM events WHERE id = $1 LIMIT 1`,
      [eventId],
    );
    const evt = evtRows[0] ?? null;

    if (!evt || evt.celebration_type == null) {
      return NextResponse.json({ success: false, error: 'Celebration not found' }, { status: 404 });
    }
    if (evt.organizer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: only the organizer can send reminders' },
        { status: 403 },
      );
    }

    const result = await sendCelebrationReminders({
      id: evt.id,
      organizer_id: evt.organizer_id,
      title: evt.title,
      slug: evt.slug,
      custom_domain: evt.custom_domain_status === 'verified' ? evt.custom_domain : null,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Reminders sent to ${result.sent} guest(s)${result.failed > 0 ? ` (${result.failed} failed)` : ''}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 },
    );
  }
}
