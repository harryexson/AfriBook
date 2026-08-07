import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

// POST /api/admin/tickets/[id]/messages — append a message (public or internal note).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase, userId } = result.ctx;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!body.body || typeof body.body !== 'string' || body.body.trim().length === 0) {
    return NextResponse.json({ error: 'body is required' }, { status: 400 });
  }

  const row = {
    ticket_id: id,
    sender_id: userId,
    body: body.body,
    attachments: body.attachments ?? [],
    internal: body.internal ?? false,
  };

  const { data, error } = await (supabase.from('ticket_messages') as LooseQuery)
    .insert(row)
    .select('*')
    .single();
  if (error) return handleError(error, 'Failed to send message');

  // If this is a first public reply by staff, stamp the response time.
  if (!body.internal) {
    await (supabase.from('support_tickets') as LooseQuery)
      .update({ first_response_at: new Date().toISOString(), status: 'in_progress' })
      .eq('id', id)
      .is('first_response_at', null);
  }

  return NextResponse.json({ data }, { status: 201 });
}
