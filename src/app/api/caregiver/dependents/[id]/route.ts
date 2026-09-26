import { NextResponse } from 'next/server';
import { query } from '@/lib/neon/admin';
import { requireAuthenticatedUser } from '@/lib/neon/server';

/** Either side of the relationship can unlink it — the caregiver, or the dependent themselves. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { user } = await requireAuthenticatedUser();

    const rows = await query<{ id: string; guardian_id: string | null }>(
      'SELECT id, guardian_id FROM profiles WHERE id = $1',
      [id],
    );
    const dependent = rows[0];
    if (!dependent) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    if (dependent.guardian_id !== user.id && dependent.id !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await query('UPDATE profiles SET guardian_id = NULL WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = Number(err?.status) === 401 ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Authentication required' : 'Failed to unlink' },
      { status },
    );
  }
}
