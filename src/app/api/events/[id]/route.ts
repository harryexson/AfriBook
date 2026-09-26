import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/neon/admin';
import { requireAuthenticatedUser } from '@/lib/neon/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const eventRows = await query<Record<string, unknown>>(
      `SELECT * FROM events WHERE ${isUuid ? 'id' : 'slug'} = $1 LIMIT 1`,
      [id],
    );
    const event = eventRows[0];

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const tierRows = await query<Record<string, unknown>>(
      `SELECT * FROM event_ticket_types WHERE event_id = $1`,
      [event.id],
    );

    await query(
      `UPDATE events SET view_count = $1 WHERE id = $2`,
      [Number(event.view_count ?? 0) + 1, event.id],
    );

    const totalRegistrationsRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ticket_purchases WHERE event_id = $1 AND order_status = 'confirmed'`,
      [event.id],
    );
    const totalCheckedInRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ticket_purchases WHERE event_id = $1 AND check_in_status = 'checked_in'`,
      [event.id],
    );

    const organizerEvents = await query<Record<string, unknown>>(
      `SELECT id, title, slug, cover_image_url, start_date, venue_city FROM events
       WHERE organizer_id = $1 AND status = 'published' AND id <> $2
       ORDER BY start_date ASC LIMIT 5`,
      [event.organizer_id, event.id],
    );

    return NextResponse.json({
      success: true,
      data: {
        ...event,
        event_ticket_types: tierRows,
        stats: {
          totalRegistrations: Number(totalRegistrationsRows[0]?.count ?? 0),
          totalCheckedIn: Number(totalCheckedInRows[0]?.count ?? 0),
          ticketsSold: event.tickets_sold ?? 0,
          viewCount: Number(event.view_count ?? 0) + 1,
        },
        relatedEvents: organizerEvents,
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

    const existingRows = await query<{ id: string; organizer_id: string; status: string; tickets_sold: number }>(
      `SELECT id, organizer_id, status, tickets_sold FROM events WHERE id = $1 LIMIT 1`,
      [id],
    );
    const existing = existingRows[0];

    if (!existing) {
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
      timezone: 'timezone', doorsOpen: 'doors_open_at', isVirtual: 'is_virtual',
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
      const tiers = await query<{ price: number }>(
        `SELECT price FROM event_ticket_types WHERE event_id = $1`,
        [id],
      );
      if (tiers.length > 0) {
        const prices = tiers.map(t => t.price).filter(p => p > 0);
        minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      }
      updateData.min_price = minPrice;
      updateData.max_price = maxPrice;
    }

    // tags/galleryImages are jsonb columns — stringify array/object values.
    if (updateData.tags !== undefined) updateData.tags = JSON.stringify(updateData.tags);
    if (updateData.gallery_images !== undefined) updateData.gallery_images = JSON.stringify(updateData.gallery_images);

    const setColumns = Object.keys(updateData);
    const setValues = Object.values(updateData);
    const setClause = setColumns.map((col, i) => `${col} = $${i + 1}`).join(', ');

    let updated: Record<string, unknown> | undefined;
    try {
      const rows = await query<Record<string, unknown>>(
        `UPDATE events SET ${setClause} WHERE id = $${setColumns.length + 1} RETURNING *`,
        [...setValues, id],
      );
      updated = rows[0];
    } catch {
      return NextResponse.json(
        { success: false, error: 'Failed to update event' },
        { status: 500 }
      );
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update event' },
        { status: 500 }
      );
    }

    const updatedTiers = await query<Record<string, unknown>>(
      `SELECT * FROM event_ticket_types WHERE event_id = $1`,
      [id],
    );

    return NextResponse.json({
      success: true,
      data: { ...updated, event_ticket_types: updatedTiers },
      message: 'Event updated successfully',
    });
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

    const eventRows = await query<{ id: string; organizer_id: string; tickets_sold: number }>(
      `SELECT id, organizer_id, tickets_sold FROM events WHERE id = $1 LIMIT 1`,
      [id],
    );
    const event = eventRows[0];

    if (!event) {
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
      try {
        await query(
          `UPDATE events SET status = 'cancelled', cancelled_at = $1, updated_at = $1 WHERE id = $2`,
          [new Date().toISOString(), id],
        );
      } catch {
        return NextResponse.json(
          { success: false, error: 'Failed to cancel event' },
          { status: 500 }
        );
      }

      const paidRegistrations = await query<{ id: string; buyer_id: string | null; total: number; buyer_name: string; buyer_email: string }>(
        `SELECT id, buyer_id, total, buyer_name, buyer_email FROM ticket_purchases
         WHERE event_id = $1 AND order_status = 'confirmed' AND total > 0`,
        [id],
      );

      const notifications = paidRegistrations
        .map((r) => ({
          user_id: r.buyer_id ?? '',
          type: 'event_cancelled',
          title: 'Event Cancelled',
          body: `The event has been cancelled. A refund of ${(r.total ?? 0) > 0 ? 'your purchase' : 'N/A'} will be processed.`,
          data: { event_id: id, registration_id: r.id },
        }))
        .filter((n) => n.user_id);

      if (notifications.length > 0) {
        const columns = ['user_id', 'type', 'title', 'body', 'data'];
        const values: unknown[] = [];
        const placeholders = notifications.map((n, rowIndex) => {
          const row = [n.user_id, n.type, n.title, n.body, JSON.stringify(n.data)];
          const rowPlaceholders = row.map((v, colIndex) => {
            values.push(v);
            return `$${rowIndex * columns.length + colIndex + 1}`;
          });
          return `(${rowPlaceholders.join(', ')})`;
        });
        await query(
          `INSERT INTO notifications (${columns.join(', ')}) VALUES ${placeholders.join(', ')}`,
          values,
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          eventId: id,
          status: 'cancelled',
          affectedRegistrations: paidRegistrations.length,
          message: 'Event cancelled. Refunds will be processed for paid registrations.',
        },
      });
    }

    await query(`DELETE FROM event_ticket_types WHERE event_id = $1`, [id]);
    await query(`DELETE FROM event_promo_codes WHERE event_id = $1`, [id]);

    try {
      await query(`DELETE FROM events WHERE id = $1`, [id]);
    } catch {
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
