import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/neon/server';
import { query } from '@/lib/neon/admin';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/reviews?businessId=<uuid> — published reviews for one business.
// Catalogue/demo businesses use non-UUID ids and have no review rows, so they
// get an empty list rather than an error.
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId') ?? '';
  if (!UUID.test(businessId)) {
    return NextResponse.json({ success: true, data: { reviews: [], acceptsReviews: false } });
  }

  // Reviews are public (RLS `reviews_read_all` is USING (true)), but Neon's
  // Data API refuses token-less requests, so signed-out visitors read via SQL.
  // Only public columns are selected — never reviewer_id.
  try {
    const reviews = await query(
      `SELECT id, rating, title, content, is_verified, reply_from_business, created_at
         FROM reviews WHERE business_id = $1
        ORDER BY created_at DESC LIMIT 50`,
      [businessId],
    );
    return NextResponse.json({ success: true, data: { reviews, acceptsReviews: true } });
  } catch (err) {
    console.error('[reviews] GET failed', err);
    return NextResponse.json({ success: false, error: 'Could not load reviews' }, { status: 502 });
  }
}

// POST /api/reviews { businessId, rating, title, body }
// "Verified" is decided here from the reviewer's own completed bookings,
// never taken from the request.
export async function POST(req: NextRequest) {
  let auth;
  try {
    auth = await requireAuthenticatedUser();
  } catch {
    return NextResponse.json({ success: false, error: 'Sign in to leave a review' }, { status: 401 });
  }
  const { supabase, user } = auth as { supabase: any; user: { id: string } };

  const body = await req.json().catch(() => null);
  const businessId = typeof body?.businessId === 'string' ? body.businessId : '';
  const rating = Number(body?.rating);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const content = typeof body?.body === 'string' ? body.body.trim() : '';

  if (!UUID.test(businessId)) {
    return NextResponse.json(
      { success: false, error: 'This business is not taking reviews on AfriBook yet' },
      { status: 400 },
    );
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ success: false, error: 'Rating must be 1 to 5 stars' }, { status: 400 });
  }
  if (!title || title.length > 255 || !content || content.length > 2000) {
    return NextResponse.json(
      { success: false, error: 'Add a title (up to 255 characters) and a review (up to 2,000)' },
      { status: 400 },
    );
  }

  const { data: completed } = await supabase
    .from('bookings')
    .select('id')
    .eq('business_id', businessId)
    .eq('customer_id', user.id)
    .eq('status', 'completed')
    .limit(1);
  const bookingId: string | null = completed?.[0]?.id ?? null;

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      business_id: businessId,
      reviewer_id: user.id,
      booking_id: bookingId,
      rating,
      title,
      content,
      is_verified: bookingId !== null,
    })
    .select('id, rating, title, content, is_verified, created_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: 'Could not save your review' }, { status: 502 });
  }
  return NextResponse.json({ success: true, data: { review: data } }, { status: 201 });
}
