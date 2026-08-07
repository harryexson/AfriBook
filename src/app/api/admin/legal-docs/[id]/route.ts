import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

const DOC_STATUSES = ['draft', 'published', 'archived'];

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
    slug: 'slug',
    title: 'title',
    version: 'version',
    status: 'status',
    effectiveDate: 'effective_date',
    lastUpdated: 'last_updated',
    author: 'author',
    content: 'content',
    languages: 'languages',
    sections: 'sections',
    wordCount: 'word_count',
  };

  for (const [key, col] of Object.entries(mapping)) {
    if (body[key] !== undefined) update[col] = body[key];
  }

  if (update.status !== undefined) {
    if (!DOC_STATUSES.includes(update.status as string)) {
      return NextResponse.json({ error: `Invalid status: ${update.status}` }, { status: 400 });
    }
    if (update.status === 'published') update.published_at = new Date().toISOString();
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await (supabase.from('legal_document_versions') as LooseQuery)
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return handleError(error, 'Failed to update document version');
  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase } = result.ctx;

  const { id } = await params;
  const { error } = await (supabase.from('legal_document_versions') as LooseQuery).delete().eq('id', id);
  if (error) return handleError(error, 'Failed to delete document version');
  return NextResponse.json({ ok: true });
}
