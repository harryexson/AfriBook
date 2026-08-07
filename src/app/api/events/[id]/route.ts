import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';
import { requireAuthenticatedUser } from '@/lib/supabase/server';

const supabase = createServiceRoleClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabase
      .from('events')
      .select('*, event_ticket_types(*)');

    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    const { data: event, error } = await query.single();

    if (error || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    await supabase
      .from('events')
      .update({ view_count: (event.view_count ?? 0) + 1 })
      .eq('id', event.id);

    const { count: totalRegistrations } = await supabase
      .from('ticket_purchases')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('order_status', 'confirmed');

    const { count: totalCheckedIn } = await supabase
      .from('ticket_purchases')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('check_in_status', 'checked_in');

    const { data: organizerEvents } = await supabase
      .from('events')
      .select('id, title, slug, cover_image_url, start_date, venue_city')
      .eq('organizer_id', event.organizer_id)
      .eq('status', 'published')
      .neq('id', event.id)
      .order('start_date', { ascending: true })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        ...event,
        stats: {
          totalRegistrations: totalRegistrations ?? 0,
          totalCheckedIn: totalCheckedIn ?? 0,
          ticketsSold: event.tickets_sold ?? 0,
          viewCount: (event.view_count ?? 0) + 1,
        },
        relatedEvents: organizerEvents ?? [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();

    const profileResponse = await authSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profileResponse.data?.role === 'admin' || profileResponse.data?.role === 'super_admin';

    const { data: existing, error: fetchError } = await supabase
      .from('events')
      .select('id, organizer_id, status, tickets_sold')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (existing.organizer_id !== user.id && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: you can only update your own events' },
        { status: 403 }
      );
    }

    const allowedFields = [
      'title', 'description', 'shortDescription', 'category',
      'startDate', 'endDate', 'timezone', 'doorsOpen',
      'isVirtual', 'venue', 'address', 'city', 'country',
      'location', 'virtualLink', 'coverImageUrl', 'galleryImages',
      'totalCapacity', 'tags', 'metaDescription',
      'enableReferrals', 'enableWaitlist', 'requireApproval',
      'allowGuestRegistration', 'maxGuestsPerRegistration',
      'ticketType', 'currencyCode', 'status',
    ];

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const fieldToColumn: Record<string, string> = {
      title: 'title', description: 'description', shortDescription: 'short_description',
      category: 'category', startDate: 'start_date', endDate: 'end_date',
      timezone: 'timezone', doorsOpen: 'doors_open', isVirtual: 'is_virtual',
      venue: 'venue_name', address: 'venue_address', city: 'venue_city',
      country: 'venue_country', virtualLink: 'virtual_link',
      coverImageUrl: 'cover_image_url', galleryImages: 'gallery_images',
      totalCapacity: 'total_capacity', tags: 'tags', metaDescription: 'meta_description',
      enableReferrals: 'enable_referrals', enableWaitlist: 'enable_waitlist',
      requireApproval: 'require_approval', allowGuestRegistration: 'allow_guest_registration',
      maxGuestsPerRegistration: 'max_guests_per_registration',
      ticketType: 'ticket_type', currencyCode: 'currency_code', status: 'status',
    };

    for (const key of allowedFields) {
      if (body[key] !== undefined && fieldToColumn[key]) {
        updateData[fieldToColumn[key]] = body[key];
      }
    }

    if (body.location && typeof body.location === 'object') {
      updateData.venue_lat = body.location.lat ?? null;
      updateData.venue_lng = body.location.lng ?? null;
    }

    if (updateData.title && !body.slug) {
      const newSlug = (updateData.title as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        + '-' + Date.now().toString(36);
      updateData.slug = newSlug;
      updateData.share_url = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/events/${newSlug}`;
    }

    if (updateData.title) {
      let minPrice = 0;
      let maxPrice = 0;
      const { data: tiers } = await supabase
        .from('event_ticket_types')
        .select('price')
        .eq('event_id', id);
      if (tiers && tiers.length > 0) {
        const prices = tiers.map(t => t.price).filter(p => p > 0);
        minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      }
      updateData.min_price = minPrice;
      updateData.max_price = maxPrice;
    }

    const { data: updated, error: updateError } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select('*, event_ticket_types(*)')
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: updated, message: 'Event updated successfully' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();

    const profileResponse = await authSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profileResponse.data?.role === 'admin' || profileResponse.data?.role === 'super_admin';

    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('id, organizer_id, tickets_sold')
      .eq('id', id)
      .single();

    if (fetchError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.organizer_id !== user.id && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: you can only cancel your own events' },
        { status: 403 }
      );
    }

    if (event.tickets_sold > 0) {
      const { error: cancelError } = await supabase
        .from('events')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (cancelError) {
        return NextResponse.json(
          { success: false, error: 'Failed to cancel event' },
          { status: 500 }
        );
      }

      const { data: paidRegistrations } = await supabase
        .from('ticket_purchases')
        .select('id, buyer_id, total, buyer_name, buyer_email')
        .eq('event_id', id)
        .eq('order_status', 'confirmed')
        .gt('total', 0);

      const notifications = (paidRegistrations ?? []).map((r) => ({
        user_id: r.buyer_id ?? '',
        type: 'event_cancelled',
        title: 'Event Cancelled',
        body: `The event has been cancelled. A refund of ${(r.total ?? 0) > 0 ? 'your purchase' : 'N/A'} will be processed.`,
        data: { event_id: id, registration_id: r.id },
      })).filter((n) => n.user_id);

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }

      return NextResponse.json({
        success: true,
        data: {
          eventId: id,
          status: 'cancelled',
          affectedRegistrations: paidRegistrations?.length ?? 0,
          message: 'Event cancelled. Refunds will be processed for paid registrations.',
        },
      });
    }

    await supabase.from('event_ticket_types').delete().eq('event_id', id);
    await supabase.from('event_promo_codes').delete().eq('event_id', id);

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { message: 'Event deleted successfully' } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
