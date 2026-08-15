import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { supabase, user } = await requireAuthenticatedUser();
    const body = await req.json();
    const { recipients, inviterName, platform, customMessage } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: recipients[]' },
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
      .select('id, title, slug, share_url, start_date, venue_name, venue_city, cover_image_url, referral_code, enable_referrals, organizer_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const profileResponse = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    const isAdmin = profileResponse.data?.role === 'admin' || profileResponse.data?.role === 'super_admin';

    if (event.organizer_id !== user.id && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: only the event organizer or admin can send invitations' },
        { status: 403 }
      );
    }

    const eventUrl = event.share_url ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/events/${event.slug}`;
    const invitationRows = recipients.map((r: { name: string; email?: string; phone?: string }) => {
      const referralCode = event.enable_referrals ? generateReferralCode() : '';
      return {
        event_id: eventId,
        inviter_id: user.id,
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

    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'invitations_sent',
      title: 'Invitations Sent',
      body: `You sent ${recipients.length} invitation(s) for "${event.title}".`,
      data: { event_id: eventId, count: recipients.length, platform: selectedPlatform },
    });

    // Dispatch invitation email/SMS to each recipient.
    const invited = invitations ?? [];
    await Promise.all(
      invited.map((inv: Record<string, unknown>) => {
        const jobs: Promise<unknown>[] = [];
        const email = inv.recipient_email as string | null;
        const phone = inv.recipient_phone as string | null;
        const name = (inv.recipient_name as string) || 'there';
        if (email) {
          jobs.push(
            sendEmail({
              to: email,
              subject: `You're invited: ${event.title}`,
              html: [
                `Hi ${escapeHtml(name)},`,
                '',
                `${escapeHtml(String(inv.inviter_name ?? 'Someone'))} invited you to <strong>${escapeHtml(event.title)}</strong> on AfriBook.`,
                '',
                `Date: ${new Date(event.start_date).toLocaleDateString()}`,
                `Venue: ${escapeHtml(event.venue_name ?? 'TBA')}${event.venue_city ? `, ${escapeHtml(event.venue_city)}` : ''}`,
                '',
                `<a href="${eventUrl}">Get your tickets</a>`,
                '',
                customMessage ? `"${escapeHtml(customMessage)}"` : '',
                '- AfriBook',
              ]
                .filter(Boolean)
                .join('<br/>'),
              template: 'event_invitation',
              userId: user.id,
              metadata: { event_id: eventId, invitation_id: inv.id },
            }).catch(() => {}),
          );
        }
        if (phone) {
          jobs.push(
            sendSms({
              to: phone,
              body: `${String(inv.inviter_name ?? 'Someone')} invited you to "${event.title}"! ${new Date(event.start_date).toLocaleDateString()} at ${event.venue_name ?? 'Virtual'}. Get tickets: ${eventUrl}`,
              eventId,
              recipientName: name,
              templateKey: 'event_invitation',
            }).catch(() => {}),
          );
        }
        return Promise.all(jobs);
      }),
    );

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
    const { supabase, user } = await requireAuthenticatedUser();
    const profileResponse = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    const isAdmin =
      profileResponse.data?.role === 'admin' ||
      profileResponse.data?.role === 'super_admin';

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

    if (event.organizer_id !== user.id && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: only the organizer or an admin can view invitation stats' },
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
