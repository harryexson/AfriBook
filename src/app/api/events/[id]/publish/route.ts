import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/neon/admin";
import { requireAuthenticatedUser } from "@/lib/neon/server";
import { moderateEvent } from "@/lib/moderation";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();
    const profileResponse = await authSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin =
      profileResponse.data?.role === "admin" ||
      profileResponse.data?.role === "super_admin";

    const eventRows = await query<{
      id: string;
      organizer_id: string;
      status: string;
      title: string;
      description: string;
      category: string;
      start_date: string;
    }>(
      `SELECT id, organizer_id, status, title, description, category, start_date FROM events WHERE id = $1`,
      [id],
    );
    const event = eventRows[0];

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    // ── Trust & safety gate: block / flag prohibited events immediately ──
    const screening = moderateEvent({
      title: event.title,
      description: event.description,
      category: event.category,
    });
    if (screening.blocked) {
      // Best-effort audit log (table created by migration 007). Never throws.
      try {
        await query(
          `INSERT INTO content_moderation_flags
             (entity_type, entity_id, field, matched_categories, matched_terms, severity, action, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            "event",
            id,
            "publish",
            screening.categories,
            screening.matches.map((m) => m.term),
            "high",
            "blocked",
            new Date().toISOString(),
          ],
        );
      } catch {
        /* logging is best-effort */
      }
      return NextResponse.json(
        {
          success: false,
          error:
            "This event violates AfriBook prohibited-content policy and cannot be published.",
          reasons: screening.reasons,
        },
        { status: 422 },
      );
    }

    if (event.organizer_id !== user.id && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: you can only publish your own events",
        },
        { status: 403 },
      );
    }

    if (event.status === "published") {
      return NextResponse.json(
        { success: false, error: "Event is already published" },
        { status: 400 },
      );
    }

    if (event.status === "cancelled") {
      return NextResponse.json(
        { success: false, error: "Cannot publish a cancelled event" },
        { status: 400 },
      );
    }

    if (new Date(event.start_date) < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot publish an event with a past start date",
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    let updated: Record<string, unknown> | undefined;
    try {
      const rows = await query<Record<string, unknown>>(
        `UPDATE events SET status = 'published', published_at = $1, updated_at = $1 WHERE id = $2 RETURNING *`,
        [now, id],
      );
      updated = rows[0];
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to publish event" },
        { status: 500 },
      );
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Failed to publish event" },
        { status: 500 },
      );
    }

    const ticketTypes = await query<Record<string, unknown>>(
      `SELECT * FROM event_ticket_types WHERE event_id = $1`,
      [id],
    );

    await query(
      `INSERT INTO notifications (user_id, type, title, body, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        event.organizer_id,
        "event_published",
        "Event Published",
        `Your event "${event.title}" is now live and accepting registrations.`,
        JSON.stringify({ event_id: id }),
      ],
    );

    return NextResponse.json({
      success: true,
      data: { ...updated, event_ticket_types: ticketTypes },
      message: "Event published successfully",
    });
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
