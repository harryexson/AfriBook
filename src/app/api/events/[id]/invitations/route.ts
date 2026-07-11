import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();
    const { recipients, inviterId, inviterName, platform, customMessage } = body;

    if (!inviterId || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: inviterId, recipients[]' },
        { status: 400 }
      );
    }

    const validPlatforms = ['email', 'sms', 'whatsapp', 'facebook', 'twitter', 'linkedin', 'instagram'];
    const selectedPlatform = platform ?? 'email';
    if (!validPlatforms.includes(selectedPlatform)) {
      return NextResponse.json(
        { success: false, error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, slug, share_url, start_date, venue_name, venue_city, cover_image_url, referral_code, enable_referrals')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventUrl = event.share_url ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/events/${event.slug}`;
    const invitationRows = recipients.map((r: { name: string; email?: string; phone?: string }) => {
      const referralCode = event.enable_referrals ? generateReferralCode() : '';
      return {
        event_id: eventId,
        inviter_id: inviterId,
        inviter_name: inviterName ?? 'Someone',
        recipient_name: r.name,
        recipient_email: r.email ?? null,
        recipient_phone: r.phone ?? null,
        platform: selectedPlatform,
        status: 'sent' as const,
        custom_message: customMessage ?? null,
        referral_code: referralCode,
        referral_discount: 0,
        event_url: eventUrl,
        created_at: new Date().toISOString(),
      };
    });

    const { data: invitations, error: insertError } = await supabase
      .from('event_invitations')
      .insert(invitationRows)
      .select();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: 'Failed to create invitations' },
        { status: 500 }
      );
    }

    if (inviterId) {
      await supabase.from('notifications').insert({
        user_id: inviterId,
        type: 'invitations_sent',
        title: 'Invitations Sent',
        body: `You sent ${recipients.length} invitation(s) for "${event.title}".`,
        data: { event_id: eventId, count: recipients.length, platform: selectedPlatform },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          invitations: invitations ?? [],
          eventUrl,
          platform: selectedPlatform,
          count: invitations?.length ?? 0,
        },
        message: `${invitations?.length ?? 0} invitation(s) sent successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(req.url);
    const organizerId = searchParams.get('organizerId');

    const { data: event } = await supabase
      .from('events')
      .select('id, organizer_id')
      .eq('id', eventId)
      .single();

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (!organizerId || event.organizer_id !== organizerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: only the organizer can view invitation stats' },
        { status: 403 }
      );
    }

    const { data: invitations, count: totalInvitations } = await supabase
      .from('event_invitations')
      .select('id, platform, status, created_at', { count: 'exact' })
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    const platformCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    (invitations ?? []).forEach((inv) => {
      platformCounts[inv.platform] = (platformCounts[inv.platform] ?? 0) + 1;
      statusCounts[inv.status] = (statusCounts[inv.status] ?? 0) + 1;
    });

    const { count: registered } = await supabase
      .from('event_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'registered');

    return NextResponse.json({
      success: true,
      data: {
        totalInvitations: totalInvitations ?? 0,
        platformBreakdown: platformCounts,
        statusBreakdown: statusCounts,
        registeredFromInvitations: registered ?? 0,
        conversionRate: (totalInvitations ?? 0) > 0
          ? Math.round(((registered ?? 0) / (totalInvitations ?? 1)) * 100)
          : 0,
        recentInvitations: (invitations ?? []).slice(0, 20),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
