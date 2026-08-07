import { NextRequest, NextResponse } from "next/server";
import { createClient, requireAuthenticatedUser } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const supabase = (await createClient()) as any;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { imageUrl, caption } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "Missing required field: imageUrl" },
        { status: 400 },
      );
    }

    const { data: event } = await supabase
      .from("events")
      .select("id, start_date")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    const now = new Date().toISOString();
    const uploadedBeforeEvent = new Date(now) < new Date(event.start_date);

    const { data: photo, error: photoError } = await supabase
      .from("event_photos")
      .insert({
        event_id: eventId,
        user_id: user.id,
        user_name: profile?.full_name ?? profile?.email ?? "Guest",
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        caption: caption ?? null,
        status: "pending",
        is_cover: false,
        uploaded_before_event: uploadedBeforeEvent,
        download_count: 0,
        share_count: 0,
      })
      .select()
      .single();

    if (photoError) {
      return NextResponse.json(
        { success: false, error: "Failed to upload photo" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, data: photo, message: "Photo submitted for review" },
      { status: 201 },
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "approved";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );
    const offset = (page - 1) * limit;

    const supabase = (await createClient()) as any;

    const { data: event } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    let query = supabase
      .from("event_photos")
      .select("*", { count: "exact" })
      .eq("event_id", eventId);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (status !== "approved") {
      const { supabase: authSupabase, user } = await requireAuthenticatedUser();
      const profileResponse = await authSupabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      const isAdmin =
        profileResponse.data?.role === "admin" ||
        profileResponse.data?.role === "super_admin";

      const { data: event } = await supabase
        .from("events")
        .select("organizer_id")
        .eq("id", eventId)
        .single();

      if (!event) {
        return NextResponse.json(
          { success: false, error: "Event not found" },
          { status: 404 },
        );
      }

      if (event.organizer_id !== user.id && !isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Forbidden: only the organizer or an admin can view non-approved photos",
          },
          { status: 403 },
        );
      }
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch photos" },
        { status: 500 },
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
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
