import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/neon/admin";
import { requireAuthenticatedUser } from "@/lib/neon/server";

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
  instagram: () => `https://www.instagram.com/`,
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
    const { user } = await requireAuthenticatedUser();
    const body = await req.json();
    const { platforms } = body;
    const currentUserId = user.id;

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { success: false, error: "platforms array is required" },
        { status: 400 },
      );
    }

    // events has no `referral_code` column (that field lives per-invite on
    // event_invitations, not globally on the event) — select only what
    // actually exists.
    const eventRows = await query<{
      id: string;
      title: string;
      slug: string;
      share_url: string | null;
      description: string;
      enable_referrals: boolean;
    }>(
      `SELECT id, title, slug, share_url, description, enable_referrals FROM events WHERE id = $1`,
      [eventId],
    );
    const event = eventRows[0];

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    const shareUrl = event.share_url ?? `${APP_URL}/events/${event.slug}`;
    const shareText = `Check out "${event.title}" on AfriBook!`;

    // Referral codes belong to event_invitations, one per inviter — look up
    // (or lazily create) this user's own referral code for the event when
    // referrals are enabled, since events.referral_code doesn't exist.
    let referralCode: string | null = null;
    if (event.enable_referrals) {
      const inviteRows = await query<{ referral_code: string | null }>(
        `SELECT referral_code FROM event_invitations WHERE event_id = $1 AND inviter_id = $2 LIMIT 1`,
        [eventId, currentUserId],
      );
      referralCode = inviteRows[0]?.referral_code ?? null;
    }

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
        event.enable_referrals && referralCode
          ? urlGenerator(`${shareUrl}?ref=${referralCode}`, shareText)
          : undefined;

      shareLinks.push({ platform, url, referralUrl });

      await query(
        `INSERT INTO event_shares (event_id, user_id, platform, share_url, clicked, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [eventId, currentUserId, platform, shareUrl, false, new Date().toISOString()],
      );
    }

    // increment_event_share_count RPC doesn't exist — replaced with a direct
    // atomic UPDATE.
    await query(
      `UPDATE events SET share_count = COALESCE(share_count, 0) + $1 WHERE id = $2`,
      [platforms.length, eventId],
    );

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
      share_count: number | null;
    }>(
      `SELECT id, organizer_id, share_count FROM events WHERE id = $1`,
      [eventId],
    );
    const event = eventRows[0];

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

    const shares = await query<{ platform: string; created_at: string }>(
      `SELECT platform, created_at FROM event_shares WHERE event_id = $1 ORDER BY created_at DESC`,
      [eventId],
    );
    const totalSharesRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM event_shares WHERE event_id = $1`,
      [eventId],
    );
    const totalShares = Number(totalSharesRows[0]?.count ?? 0);

    const platformCounts: Record<string, number> = {};
    shares.forEach((s) => {
      platformCounts[s.platform] = (platformCounts[s.platform] ?? 0) + 1;
    });

    const referralClicksRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM event_shares WHERE event_id = $1 AND clicked = true`,
      [eventId],
    );
    const referralClicks = Number(referralClicksRows[0]?.count ?? 0);

    return NextResponse.json({
      success: true,
      data: {
        totalShares: event.share_count ?? totalShares ?? 0,
        platformBreakdown: platformCounts,
        referralClicks,
        recentShares: shares.slice(0, 20),
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
