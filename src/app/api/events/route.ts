import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/neon/admin";
import { requireAuthenticatedUser } from "@/lib/neon/server";

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

    const subscriptionRows = await query<{ plan: string; max_events: number }>(
      `SELECT plan, max_events FROM organizer_subscriptions
       WHERE organizer_id = $1 AND status = 'active' LIMIT 1`,
      [user.id],
    );
    const subscription = subscriptionRows[0] ?? null;

    const plan = (subscription?.plan ?? "free") as string;
    if (subscription && subscription.max_events !== -1) {
      const countRows = await query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM events WHERE organizer_id = $1 AND status <> 'cancelled'`,
        [user.id],
      );
      const count = Number(countRows[0]?.count ?? 0);
      if (count >= subscription.max_events) {
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
      gallery_images: JSON.stringify([]),
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
      tags: JSON.stringify(tags ?? []),
      meta_description: metaDescription ?? null,
      view_count: 0,
      share_count: 0,
      favorite_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const columns = Object.keys(eventData);
    const values = Object.values(eventData);
    const placeholders = columns.map((_, i) => `$${i + 1}`);

    let event: Record<string, unknown> | undefined;
    try {
      const rows = await query<Record<string, unknown>>(
        `INSERT INTO events (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
        values,
      );
      event = rows[0];
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to create event" },
        { status: 500 },
      );
    }

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Failed to create event" },
        { status: 500 },
      );
    }

    if (ticketTiers && ticketTiers.length > 0) {
      const tierRows = ticketTiers.map(
        (tier: Record<string, unknown>, index: number) => ({
          event_id: event!.id,
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
          benefits: JSON.stringify(tier.includesPerks ?? tier.benefits ?? []),
          is_active: true,
          sort_order: tier.sortOrder ?? index,
        }),
      );

      const tierColumns = Object.keys(tierRows[0]);
      const tierValues: unknown[] = [];
      const tierPlaceholders = tierRows.map((row: Record<string, unknown>, rowIndex: number) => {
        const placeholders = tierColumns.map((col, colIndex) => {
          tierValues.push(row[col]);
          return `$${rowIndex * tierColumns.length + colIndex + 1}`;
        });
        return `(${placeholders.join(", ")})`;
      });

      try {
        await query(
          `INSERT INTO event_ticket_types (${tierColumns.join(", ")}) VALUES ${tierPlaceholders.join(", ")}`,
          tierValues,
        );
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: "Event created but failed to save ticket tiers",
          },
          { status: 500 },
        );
      }
    }

    const ticketTypeRows = await query<Record<string, unknown>>(
      `SELECT * FROM event_ticket_types WHERE event_id = $1`,
      [event.id],
    );
    const fullEvent = { ...event, event_ticket_types: ticketTypeRows };

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
    const sortByRaw = searchParams.get("sort") ?? "start_date";
    const sortOrder = searchParams.get("sortOrder") ?? "asc";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );
    const offset = (page - 1) * limit;

    // Guard against SQL injection via the sort column — only allow known columns.
    const sortableColumns = new Set([
      "start_date", "end_date", "created_at", "updated_at", "title", "view_count", "tickets_sold",
    ]);
    const sortBy = sortableColumns.has(sortByRaw) ? sortByRaw : "start_date";
    const sortDirection = sortOrder === "asc" ? "ASC" : "DESC";

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status !== "all") {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (city) {
      params.push(`%${city}%`);
      conditions.push(`venue_city ILIKE $${params.length}`);
    }
    if (country) {
      params.push(`%${country}%`);
      conditions.push(`venue_country ILIKE $${params.length}`);
    }
    if (startDate) {
      params.push(startDate);
      conditions.push(`start_date >= $${params.length}`);
    }
    if (endDate) {
      params.push(endDate);
      conditions.push(`start_date <= $${params.length}`);
    }
    if (isVirtual !== null && isVirtual !== undefined) {
      params.push(isVirtual === "true");
      conditions.push(`is_virtual = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx} OR organizer_name ILIKE $${idx})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM events ${whereClause}`,
      params,
    );
    const count = Number(countRows[0]?.count ?? 0);

    const dataParams = [...params, limit, offset];
    const events = await query<Record<string, unknown>>(
      `SELECT * FROM events ${whereClause}
       ORDER BY ${sortBy} ${sortDirection}
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams,
    );

    const eventIds = events.map((e) => e.id as string);
    const tierRows = eventIds.length
      ? await query<Record<string, unknown>>(
          `SELECT * FROM event_ticket_types WHERE event_id = ANY($1::uuid[])`,
          [eventIds],
        )
      : [];
    const tiersByEvent = new Map<string, Record<string, unknown>[]>();
    for (const tier of tierRows) {
      const key = tier.event_id as string;
      if (!tiersByEvent.has(key)) tiersByEvent.set(key, []);
      tiersByEvent.get(key)!.push(tier);
    }
    const data = events.map((e) => ({
      ...e,
      event_ticket_types: tiersByEvent.get(e.id as string) ?? [],
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
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
