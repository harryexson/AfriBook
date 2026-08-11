import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser } from "@/lib/supabase/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Date.now().toString(36)
  );
}

export async function POST(req: NextRequest) {
  try {
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();
    const profileResponse = await authSupabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const body = await req.json();
    const {
      organizerName,
      title,
      description,
      shortDescription,
      category,
      venue,
      address,
      city,
      country,
      location,
      startDate,
      endDate,
      timezone,
      ticketType,
      ticketTiers,
      totalCapacity,
      currencyCode,
      isVirtual,
      virtualLink,
      coverImageUrl,
      tags,
      metaDescription,
      enableReferrals,
      enableWaitlist,
      requireApproval,
      allowGuestRegistration,
      maxGuestsPerRegistration,
    } = body;

    if (!title || !description || !category || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: title, description, category, startDate, endDate",
        },
        { status: 400 },
      );
    }

    const validCategories = [
      "conference",
      "concert",
      "festival",
      "workshop",
      "seminar",
      "wedding",
      "birthday",
      "party",
      "corporate",
      "charity",
      "sports",
      "networking",
      "food_drink",
      "arts",
      "technology",
      "music",
      "fashion",
      "health",
      "education",
      "other",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        },
        { status: 400 },
      );
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json(
        { success: false, error: "endDate must be after startDate" },
        { status: 400 },
      );
    }

    const { data: subscription } = await supabase
      .from("organizer_subscriptions")
      .select("plan, max_events")
      .eq("organizer_id", user.id)
      .eq("status", "active")
      .single();

    const plan = (subscription?.plan ?? "free") as string;
    if (subscription && subscription.max_events !== -1) {
      const { count } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("organizer_id", user.id)
        .neq("status", "cancelled");
      if ((count ?? 0) >= subscription.max_events) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Event limit reached for your subscription plan. Please upgrade.",
          },
          { status: 403 },
        );
      }
    }

    const slug = slugify(title);
    const feePercentMap: Record<string, number> = {
      free: 5,
      starter: 4,
      professional: 3,
      enterprise: 2,
    };
    const feeFixedMap: Record<string, number> = {
      free: 1,
      starter: 0.75,
      professional: 0.5,
      enterprise: 0.25,
    };

    let minPrice = 0;
    let maxPrice = 0;
    const isFree =
      !ticketTiers ||
      ticketTiers.length === 0 ||
      ticketTiers.every((t: { price?: number }) => (t.price ?? 0) === 0);

    if (ticketTiers && ticketTiers.length > 0) {
      const prices = ticketTiers
        .map((t: { price: number }) => t.price)
        .filter((p: number) => p > 0);
      minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    }

    const eventData = {
      organizer_id: user.id,
      organizer_name: organizerName ?? profileResponse.data?.full_name ?? "",
      title,
      slug,
      description,
      short_description: shortDescription ?? description.substring(0, 200),
      category,
      status: "draft" as const,
      start_date: startDate,
      end_date: endDate,
      timezone: timezone ?? "Africa/Lagos",
      venue_name: venue ?? null,
      venue_address: address ?? null,
      venue_city: city ?? null,
      venue_country: country ?? null,
      venue_lat: location?.lat ?? null,
      venue_lng: location?.lng ?? null,
      is_virtual: isVirtual ?? false,
      virtual_link: virtualLink ?? null,
      cover_image_url: coverImageUrl ?? null,
      gallery_images: [],
      ticket_type: ticketType ?? (isFree ? "free" : "paid"),
      min_price: minPrice,
      max_price: maxPrice,
      currency_code: currencyCode ?? "NGN",
      total_capacity: totalCapacity ?? 0,
      tickets_sold: 0,
      is_free: isFree,
      platform_fee_percent: feePercentMap[plan] ?? 5,
      platform_fee_fixed: feeFixedMap[plan] ?? 1,
      share_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/events/${slug}`,
      enable_referrals: enableReferrals ?? false,
      enable_waitlist: enableWaitlist ?? false,
      require_approval: requireApproval ?? false,
      allow_guest_registration: allowGuestRegistration ?? true,
      max_guests_per_registration: maxGuestsPerRegistration ?? 0,
      tags: tags ?? [],
      meta_description: metaDescription ?? null,
      view_count: 0,
      share_count: 0,
      favorite_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert(eventData)
      .select()
      .single();

    if (eventError) {
      return NextResponse.json(
        { success: false, error: "Failed to create event" },
        { status: 500 },
      );
    }

    if (ticketTiers && ticketTiers.length > 0) {
      const tierRows = ticketTiers.map(
        (tier: Record<string, unknown>, index: number) => ({
          event_id: event.id,
          name: tier.name,
          tier: tier.tier ?? "general",
          type: tier.type ?? "paid",
          description: tier.description ?? "",
          price: tier.price ?? 0,
          original_price: tier.originalPrice ?? null,
          currency_code: tier.currencyCode ?? currencyCode ?? "NGN",
          quantity_available: tier.quantityAvailable ?? tier.available ?? 0,
          quantity_sold: 0,
          max_per_order: tier.maxPerOrder ?? 10,
          min_per_order: tier.minPerOrder ?? 1,
          sale_starts_at: tier.saleStartsAt ?? startDate,
          sale_ends_at: tier.saleEndsAt ?? endDate,
          includes_guest_registration: tier.includesGuestRegistration ?? false,
          max_guests_per_ticket: tier.maxGuestsPerTicket ?? 0,
          benefits: tier.includesPerks ?? tier.benefits ?? [],
          is_active: true,
          sort_order: tier.sortOrder ?? index,
        }),
      );

      const { error: ttError } = await supabase
        .from("event_ticket_types")
        .insert(tierRows);

      if (ttError) {
        return NextResponse.json(
          {
            success: false,
            error: "Event created but failed to save ticket tiers",
          },
          { status: 500 },
        );
      }
    }

    const { data: fullEvent } = await supabase
      .from("events")
      .select("*, event_ticket_types(*)")
      .eq("id", event.id)
      .single();

    return NextResponse.json(
      {
        success: true,
        data: fullEvent ?? event,
        message: "Event created successfully",
      },
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const city = searchParams.get("city");
    const country = searchParams.get("country");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status") ?? "published";
    const isVirtual = searchParams.get("isVirtual");
    const sortBy = searchParams.get("sort") ?? "start_date";
    const sortOrder = searchParams.get("sortOrder") ?? "asc";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );
    const offset = (page - 1) * limit;

    let query = supabase
      .from("events")
      .select("*, event_ticket_types(*)", { count: "exact" });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (city) {
      query = query.ilike("venue_city", `%${city}%`);
    }

    if (country) {
      query = query.ilike("venue_country", `%${country}%`);
    }

    if (startDate) {
      query = query.gte("start_date", startDate);
    }

    if (endDate) {
      query = query.lte("start_date", endDate);
    }

    if (isVirtual !== null && isVirtual !== undefined) {
      query = query.eq("is_virtual", isVirtual === "true");
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,organizer_name.ilike.%${search}%`,
      );
    }

    query = query.order(sortBy, { ascending: sortOrder === "asc" });
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch events" },
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
