import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

// GET /api/admin/email-logs?status=&page=&limit=
export async function GET(req: NextRequest) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase } = result.ctx;

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '25', 10);
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: LooseQuery = (supabase.from('email_logs') as LooseQuery).select('*', { count: 'exact' });
  if (status) query = query.eq('status', status);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return handleError(error, 'Failed to load email logs');
  return NextResponse.json({ data: data ?? [], count: count ?? 0, page, limit });
}

// POST /api/admin/email-logs — record an outbound email (called by the mailer layer).
export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase } = result.ctx;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  if (!body.recipient || typeof body.recipient !== 'string') {
    return NextResponse.json({ error: 'recipient is required' }, { status: 400 });
  }

  const row = {
    user_id: body.userId ?? null,
    recipient: body.recipient,
    subject: body.subject ?? null,
    template: body.template ?? null,
    provider: body.provider ?? 'console',
    status: body.status ?? 'queued',
    message_id: body.messageId ?? null,
    error: body.error ?? null,
    metadata: body.metadata ?? {},
    sent_at: body.sentAt ?? null,
  };

  const { data, error } = await (supabase.from('email_logs') as LooseQuery).insert(row).select('*').single();
  if (error) return handleError(error, 'Failed to log email');
  return NextResponse.json({ data }, { status: 201 });
}
