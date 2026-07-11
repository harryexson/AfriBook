import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();
    const { userId, imageUrl, caption } = body;

    if (!userId || !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, imageUrl' },
        { status: 400 }
      );
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, start_date, end_date')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, email, avatar_url')
      .eq('id', userId)
      .single();

    const now = new Date().toISOString();
    const uploadedBeforeEvent = new Date(now) < new Date(event.start_date);

    const photoData = {
      event_id: eventId,
      user_id: userId,
      user_name: user?.full_name ?? user?.email ?? 'Anonymous',
      image_url: imageUrl,
      thumbnail_url: imageUrl,
      caption: caption ?? null,
      status: 'approved' as const,
      is_cover: false,
      uploaded_before_event: uploadedBeforeEvent,
      download_count: 0,
      share_count: 0,
      created_at: now,
    };

    const { data: photo, error: photoError } = await supabase
      .from('event_photos')
      .insert(photoData)
      .select()
      .single();

    if (photoError) {
      return NextResponse.json(
        { success: false, error: 'Failed to upload photo' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: photo, message: 'Photo uploaded successfully' },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') ?? 'approved';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const offset = (page - 1) * limit;

    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .single();

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    let query = supabase
      .from('event_photos')
      .select('*', { count: 'exact' })
      .eq('event_id', eventId);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch photos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
