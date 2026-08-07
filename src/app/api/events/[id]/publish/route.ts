import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser } from "@/lib/supabase/server";
import { moderateEvent } from "@/lib/moderation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();
    const profileResponse = await authSupabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin =
      profileResponse.data?.role === "admin" ||
      profileResponse.data?.role === "super_admin";
    const body = await req.json().catch(() => ({}));

    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select(
        "id, organizer_id, status, title, description, category, start_date, ticket_types: event_ticket_types(id, name, price, quantity_available)",
      )
      .eq("id", id)
      .single();

    if (fetchError || !event) {
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
        await supabase.from("content_moderation_flags").insert({
          entity_type: "event",
          entity_id: id,
          field: "publish",
          matched_categories: screening.categories,
          matched_terms: screening.matches.map((m) => m.term),
          severity: "high",
          action: "blocked",
          created_at: new Date().toISOString(),
        });
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

    const { data: updated, error: updateError } = await supabase
      .from("events")
      .update({
        status: "published",
        published_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .select("*, event_ticket_types(*)")
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to publish event" },
        { status: 500 },
      );
    }

    await supabase.from("notifications").insert({
      user_id: event.organizer_id,
      type: "event_published",
      title: "Event Published",
      body: `Your event "${event.title}" is now live and accepting registrations.`,
      data: { event_id: id },
    });

    return NextResponse.json({
      success: true,
      data: updated,
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
