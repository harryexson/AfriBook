import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id: eventId, photoId } = await params;

    const { data: photo, error } = await supabase
      .from('event_photos')
      .select('*, events!inner(id, title, slug)')
      .eq('id', photoId)
      .eq('event_id', eventId)
      .single();

    if (error || !photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: photo });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id: eventId, photoId } = await params;
    const body = await req.json();
    const { userId, action, caption } = body;

    const { data: photo, error: fetchError } = await supabase
      .from('event_photos')
      .select('*')
      .eq('id', photoId)
      .eq('event_id', eventId)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }

    if (action === 'like') {
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Missing required field: userId' },
          { status: 400 }
        );
      }

      const { data: updated, error } = await supabase
        .from('event_photos')
        .update({ likes: (photo.likes ?? 0) + 1 })
        .eq('id', photoId)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to like photo' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'approve') {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId ?? '')
        .single();

      if (!userId || profile?.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Only admins can approve photos' },
          { status: 403 }
        );
      }

      const { data: updated, error } = await supabase
        .from('event_photos')
        .update({ status: 'approved' })
        .eq('id', photoId)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to approve photo' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'cover') {
      // Unset any existing cover for the event, then set the new one
      await supabase
        .from('event_photos')
        .update({ is_cover: false })
        .eq('event_id', eventId)
        .eq('is_cover', true);

      const { data: updated, error } = await supabase
        .from('event_photos')
        .update({ is_cover: true, status: 'approved' })
        .eq('id', photoId)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to set cover photo' },
          { status: 500 }
        );
      }

      await supabase
        .from('events')
        .update({ cover_image_url: updated.image_url ?? updated.url })
        .eq('id', eventId);

      return NextResponse.json({ success: true, data: updated });
    }

    if (caption !== undefined) {
      const { data: updated, error } = await supabase
        .from('event_photos')
        .update({ caption })
        .eq('id', photoId)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to update photo' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use: like, approve, cover, or provide a caption.' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id: eventId, photoId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required query param: userId' },
        { status: 400 }
      );
    }

    const { data: photo, error: fetchError } = await supabase
      .from('event_photos')
      .select('uploaded_by, user_id, url')
      .eq('id', photoId)
      .eq('event_id', eventId)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }

    const uploaderId = photo.user_id ?? photo.uploaded_by;

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (uploaderId !== userId && profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this photo' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('event_photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete photo' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Photo deleted' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
