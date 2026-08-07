import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

const TICKET_STATUSES = ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase } = result.ctx;

  const { id } = await params;

  const { data: ticket, error } = await (supabase.from('support_tickets') as LooseQuery)
    .select('*, user:user_id(email, full_name, avatar_url), messages:ticket_messages(*)')
    .eq('id', id)
    .single();

  if (error) return handleError(error, 'Failed to load ticket');
  return NextResponse.json({ data: ticket });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase } = result.ctx;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  const mapping: Record<string, string> = {
    subject: 'subject',
    description: 'description',
    category: 'category',
    priority: 'priority',
    status: 'status',
    assignedTo: 'assigned_to',
    tags: 'tags',
    metadata: 'metadata',
  };

  for (const [key, col] of Object.entries(mapping)) {
    if (body[key] !== undefined) update[col] = body[key];
  }

  if (update.status !== undefined) {
    if (!TICKET_STATUSES.includes(update.status as string)) {
      return NextResponse.json({ error: `Invalid status: ${update.status}` }, { status: 400 });
    }
    if (update.status === 'resolved' && !body.firstResponseAt) update.first_response_at = new Date().toISOString();
    if (update.status === 'closed') update.closed_at = new Date().toISOString();
  }
  if (update.priority !== undefined && !PRIORITIES.includes(update.priority as string)) {
    return NextResponse.json({ error: `Invalid priority: ${update.priority}` }, { status: 400 });
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await (supabase.from('support_tickets') as LooseQuery)
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return handleError(error, 'Failed to update ticket');
  return NextResponse.json({ data });
}
