import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/neon/server';
import { query } from '@/lib/neon/admin';

// POST /api/support/tickets — customer-facing "Report an issue". Open to
// guests (who must give an email to be contacted on); signed-in reports are
// linked to the profile so they show up in the admin support queue with the
// reporter attached. Rate-limited in src/lib/rate-limit.ts.

const TYPES: Record<string, { label: string; category: string; priority: 'medium' | 'high' | 'critical' }> = {
  order: { label: 'Order problem', category: 'order', priority: 'medium' },
  safety: { label: 'Safety concern', category: 'other', priority: 'critical' },
  fraud: { label: 'Fraud or scam', category: 'billing', priority: 'high' },
  vendor: { label: 'Vendor issue', category: 'other', priority: 'medium' },
  driver: { label: 'Driver issue', category: 'rides', priority: 'medium' },
  other: { label: 'Other', category: 'other', priority: 'medium' },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const type = typeof body?.type === 'string' ? body.type : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const reference = typeof body?.reference === 'string' ? body.reference.trim().slice(0, 64) : '';
  const email = typeof body?.email === 'string' ? body.email.trim().slice(0, 254) : '';

  const spec = TYPES[type];
  if (!spec) return NextResponse.json({ success: false, error: 'Choose what the issue is about' }, { status: 400 });
  if (description.length < 10 || description.length > 1000) {
    return NextResponse.json(
      { success: false, error: 'Describe the issue in 10 to 1,000 characters' },
      { status: 400 },
    );
  }
  if (email && !EMAIL.test(email)) {
    return NextResponse.json({ success: false, error: 'That email address looks invalid' }, { status: 400 });
  }

  let userId: string | null = null;
  try {
    const db = (await createClient()) as any;
    const { data } = await db.auth.getUser();
    userId = data?.user?.id ?? null;
  } catch {
    userId = null;
  }
  if (!userId && !email) {
    return NextResponse.json(
      { success: false, error: 'Add an email so the support team can reply' },
      { status: 400 },
    );
  }

  const ticketNumber = `TKT-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${randomBytes(3).toString('hex').toUpperCase()}`;

  try {
    const [row] = await query<{ ticket_number: string; status: string }>(
      `INSERT INTO support_tickets (ticket_number, user_id, subject, description, category, priority, status, tags, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, 'open', $7, $8)
       RETURNING ticket_number, status`,
      [
        ticketNumber,
        userId,
        reference ? `${spec.label} — ${reference}` : spec.label,
        description,
        spec.category,
        spec.priority,
        ['customer-report', type],
        JSON.stringify({ source: 'help/report', contact_email: email || null, reference: reference || null }),
      ],
    );
    return NextResponse.json({ success: true, data: { ticketNumber: row.ticket_number, status: row.status } }, { status: 201 });
  } catch (err) {
    console.error('[support/tickets] insert failed', err);
    return NextResponse.json({ success: false, error: 'Your report could not be saved. Please try again.' }, { status: 502 });
  }
}
