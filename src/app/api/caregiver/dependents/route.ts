import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/neon/admin';
import { requireAuthenticatedUser } from '@/lib/neon/server';

/** People (minors, elderly, disabled, or otherwise vulnerable riders) the current user is registered as the guardian/caregiver for. */
export async function GET() {
  try {
    const { user } = await requireAuthenticatedUser();

    const dependents = await query<{
      id: string; full_name: string | null; email: string; phone: string | null; is_minor: boolean;
    }>(
      `SELECT id, full_name, email, phone, is_minor FROM profiles WHERE guardian_id = $1 ORDER BY full_name`,
      [user.id],
    );

    return NextResponse.json({ success: true, dependents });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to load dependents' },
      { status },
    );
  }
}

/**
 * Links an existing AfriBook account as a dependent of the current user.
 * Deliberately lightweight (email lookup, no double opt-in) — a real
 * production version should require the dependent (or their existing
 * guardian) to confirm the link, not just whoever knows their email. Flagged
 * here rather than silently shipped as if it were the finished flow.
 */
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAuthenticatedUser();
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const isMinor = Boolean(body?.isMinor);

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const rows = await query<{ id: string; guardian_id: string | null }>(
      'SELECT id, guardian_id FROM profiles WHERE email = $1',
      [email],
    );
    const dependent = rows[0];

    if (!dependent) {
      return NextResponse.json({ success: false, error: 'No AfriBook account found for that email' }, { status: 404 });
    }
    if (dependent.id === user.id) {
      return NextResponse.json({ success: false, error: 'You cannot link yourself as a dependent' }, { status: 400 });
    }
    if (dependent.guardian_id && dependent.guardian_id !== user.id) {
      return NextResponse.json({ success: false, error: 'This person already has a different guardian on file' }, { status: 409 });
    }

    await query(
      'UPDATE profiles SET guardian_id = $1, is_minor = is_minor OR $2 WHERE id = $3',
      [user.id, isMinor, dependent.id],
    );

    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, 'safety', 'Safety monitoring linked', $2, $3)`,
      [
        dependent.id,
        'Someone added you as a person they help monitor for ride safety. You can remove this in your account settings at any time.',
        JSON.stringify({ guardian_id: user.id }),
      ],
    );

    return NextResponse.json({ success: true, dependentId: dependent.id });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to link dependent' },
      { status },
    );
  }
}
