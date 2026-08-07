import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

const DOC_STATUSES = ['draft', 'published', 'archived'];

// GET /api/admin/legal-docs?status=&slug=&page=&limit=
export async function GET(req: NextRequest) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase } = result.ctx;

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get('status');
  const slug = searchParams.get('slug');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '25', 10);
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: LooseQuery = (supabase.from('legal_document_versions') as LooseQuery)
    .select('*', { count: 'exact' });
  if (status) query = query.eq('status', status);
  if (slug) query = query.eq('slug', slug);

  const { data, count, error } = await query
    .order('last_updated', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return handleError(error, 'Failed to load legal documents');
  return NextResponse.json({ data: data ?? [], count: count ?? 0, page, limit });
}

// POST /api/admin/legal-docs — register a new document version.
export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if ('error' in result) return result.error;
  const { supabase, userId } = result.ctx;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const status = body.status ?? 'draft';
  if (!DOC_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
  }
  if (!body.slug || !body.title || !body.version) {
    return NextResponse.json({ error: 'slug, title and version are required' }, { status: 400 });
  }

  const row = {
    slug: body.slug,
    title: body.title,
    version: body.version,
    status,
    effective_date: body.effectiveDate ?? null,
    last_updated: body.lastUpdated ?? null,
    author: body.author ?? null,
    content: body.content ?? null,
    languages: body.languages ?? ['en'],
    sections: body.sections ?? 0,
    word_count: body.wordCount ?? 0,
    created_by: userId,
    published_at: status === 'published' ? new Date().toISOString() : null,
  };

  const { data, error } = await (supabase.from('legal_document_versions') as LooseQuery).insert(row).select('*').single();
  if (error) return handleError(error, 'Failed to create document version');
  return NextResponse.json({ data }, { status: 201 });
}
