import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuthenticatedUser } from "@/lib/supabase/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

const platformUrls: Record<string, (url: string, text: string) => string> = {
  facebook: (url) =>
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  twitter: (url, text) =>
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  whatsapp: (url, text) =>
    `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`,
  linkedin: (url) =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  instagram: (url) => `https://www.instagram.com/`,
  email: (url, text) =>
    `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
  sms: (url, text) => `sms:?body=${encodeURIComponent(text + " " + url)}`,
  copy_link: (url) => url,
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { supabase: authSupabase, user } = await requireAuthenticatedUser();
    const body = await req.json();
    const { platforms } = body;
    const currentUserId = user.id;

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { success: false, error: "platforms array is required" },
        { status: 400 },
      );
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        "id, title, slug, share_url, description, referral_code, enable_referrals",
      )
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    const shareUrl = event.share_url ?? `${APP_URL}/events/${event.slug}`;
    const shareText = `Check out "${event.title}" on AfriBook!`;

    const shareLinks: {
      platform: string;
      url: string;
      referralUrl?: string;
    }[] = [];

    for (const platform of platforms) {
      const urlGenerator = platformUrls[platform];
      if (!urlGenerator) continue;

      const url = urlGenerator(shareUrl, shareText);
      const referralUrl =
        event.enable_referrals && event.referral_code
          ? urlGenerator(`${shareUrl}?ref=${event.referral_code}`, shareText)
          : undefined;

      shareLinks.push({ platform, url, referralUrl });

      await supabase.from("event_shares").insert({
        event_id: eventId,
        user_id: currentUserId,
        platform,
        share_url: shareUrl,
        clicked: false,
        created_at: new Date().toISOString(),
      });
    }

    await supabase
      .from("events")
      .update({
        share_count:
          ((event as { share_count?: number }).share_count ?? 0) +
          platforms.length,
      })
      .eq("id", eventId);

    return NextResponse.json({
      success: true,
      data: {
        eventUrl: shareUrl,
        shareText,
        links: shareLinks,
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { supabase, user } = await requireAuthenticatedUser();
    const profileResponse = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin =
      profileResponse.data?.role === "admin" ||
      profileResponse.data?.role === "super_admin";

    const { data: event } = await supabase
      .from("events")
      .select("id, organizer_id, share_count")
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
            "Unauthorized: only the organizer or an admin can view share stats",
        },
        { status: 403 },
      );
    }

    const { data: shares, count: totalShares } = await supabase
      .from("event_shares")
      .select("platform, created_at", { count: "exact" })
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    const platformCounts: Record<string, number> = {};
    (shares ?? []).forEach((s) => {
      platformCounts[s.platform] = (platformCounts[s.platform] ?? 0) + 1;
    });

    const { count: referralClicks } = await supabase
      .from("event_shares")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("clicked", true);

    return NextResponse.json({
      success: true,
      data: {
        totalShares: event.share_count ?? totalShares ?? 0,
        platformBreakdown: platformCounts,
        referralClicks: referralClicks ?? 0,
        recentShares: (shares ?? []).slice(0, 20),
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
