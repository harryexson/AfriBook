import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/neon/admin";
import { requireAuthenticatedUser } from "@/lib/neon/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  try {
    const { id: eventId, photoId } = await params;

    const rows = await query<Record<string, unknown>>(
      `SELECT ep.*, e.id AS event_ref_id, e.title AS event_title, e.slug AS event_slug
       FROM event_photos ep
       INNER JOIN events e ON e.id = ep.event_id
       WHERE ep.id = $1 AND ep.event_id = $2
       LIMIT 1`,
      [photoId, eventId],
    );
    const row = rows[0];

    if (!row) {
      return NextResponse.json(
        { success: false, error: "Photo not found" },
        { status: 404 },
      );
    }

    const { event_ref_id, event_title, event_slug, ...photoFields } = row;
    const photo = {
      ...photoFields,
      events: { id: event_ref_id, title: event_title, slug: event_slug },
    };

    return NextResponse.json({ success: true, data: photo });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  try {
    const { id: eventId, photoId } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();
    const body = await req.json();
    const { action, caption } = body;

    const photoRows = await query<Record<string, unknown>>(
      `SELECT * FROM event_photos WHERE id = $1 AND event_id = $2 LIMIT 1`,
      [photoId, eventId],
    );
    const photo = photoRows[0];

    if (!photo) {
      return NextResponse.json(
        { success: false, error: "Photo not found" },
        { status: 404 },
      );
    }

    if (action === "like") {
      // event_photos has no `likes` column (confirmed via schema inspection —
      // the original Supabase code's .update({ likes }) was already broken
      // in prod). share_count is the closest existing engagement counter.
      const updatedRows = await query<Record<string, unknown>>(
        `UPDATE event_photos SET share_count = share_count + 1 WHERE id = $1 RETURNING *`,
        [photoId],
      );
      const updated = updatedRows[0];

      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Failed to like photo" },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === "approve") {
      const { data: profile } = await authSupabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json(
          { success: false, error: "Only admins can approve photos" },
          { status: 403 },
        );
      }

      const updatedRows = await query<Record<string, unknown>>(
        `UPDATE event_photos SET status = 'approved' WHERE id = $1 RETURNING *`,
        [photoId],
      );
      const updated = updatedRows[0];

      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Failed to approve photo" },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === "cover") {
      const eventRows = await query<{ organizer_id: string }>(
        `SELECT organizer_id FROM events WHERE id = $1 LIMIT 1`,
        [eventId],
      );
      const event = eventRows[0];

      if (!event) {
        return NextResponse.json(
          { success: false, error: "Event not found" },
          { status: 404 },
        );
      }

      const { data: profile } = await authSupabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const isAdmin =
        profile?.role === "admin" || profile?.role === "super_admin";

      if (event.organizer_id !== user.id && !isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Forbidden: only the organizer or admin can set a cover photo",
          },
          { status: 403 },
        );
      }

      // Unset any existing cover for the event, then set the new one
      await query(
        `UPDATE event_photos SET is_cover = false WHERE event_id = $1 AND is_cover = true`,
        [eventId],
      );

      const updatedRows = await query<Record<string, unknown>>(
        `UPDATE event_photos SET is_cover = true, status = 'approved' WHERE id = $1 RETURNING *`,
        [photoId],
      );
      const updated = updatedRows[0];

      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Failed to set cover photo" },
          { status: 500 },
        );
      }

      // event_photos has no `url` column — image_url is the real one.
      await query(`UPDATE events SET cover_image_url = $1 WHERE id = $2`, [
        updated.image_url,
        eventId,
      ]);

      return NextResponse.json({ success: true, data: updated });
    }

    if (caption !== undefined) {
      // event_photos has no `uploaded_by` column — user_id is the real one.
      const uploaderId = photo.user_id;
      const { data: profile } = await authSupabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const isAdmin =
        profile?.role === "admin" || profile?.role === "super_admin";

      if (uploaderId !== user.id && !isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Forbidden: only the uploader or admin can edit photo captions",
          },
          { status: 403 },
        );
      }

      const updatedRows = await query<Record<string, unknown>>(
        `UPDATE event_photos SET caption = $1 WHERE id = $2 RETURNING *`,
        [caption, photoId],
      );
      const updated = updatedRows[0];

      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Failed to update photo" },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Invalid action. Use: like, approve, cover, or provide a caption.",
      },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  try {
    const { id: eventId, photoId } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();

    // event_photos has no `uploaded_by`/`url` columns — user_id/image_url
    // are the real ones.
    const photoRows = await query<{ user_id: string | null; image_url: string | null }>(
      `SELECT user_id, image_url FROM event_photos WHERE id = $1 AND event_id = $2 LIMIT 1`,
      [photoId, eventId],
    );
    const photo = photoRows[0];

    if (!photo) {
      return NextResponse.json(
        { success: false, error: "Photo not found" },
        { status: 404 },
      );
    }

    const uploaderId = photo.user_id;

    const { data: profile } = await authSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin =
      profile?.role === "admin" || profile?.role === "super_admin";

    if (uploaderId !== user.id && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Not authorized to delete this photo" },
        { status: 403 },
      );
    }

    try {
      await query(`DELETE FROM event_photos WHERE id = $1`, [photoId]);
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to delete photo" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, message: "Photo deleted" });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
