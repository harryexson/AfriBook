import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  verifyCelebrationDomain,
  getEventPlan,
} from '@/lib/celebrations/service';

const admin = createAdminClient() as any;

async function assertOrganizer(
  userId: string,
  eventId: string,
): Promise<{
  id: string;
  organizer_id: string;
  celebration_type: string | null;
  custom_domain: string | null;
  custom_domain_status: string | null;
}> {
  const { data: evt } = await admin
    .from('events')
    .select('id, organizer_id, title, celebration_type, custom_domain, custom_domain_status')
    .eq('id', eventId)
    .single();

  if (!evt || evt.celebration_type == null) {
    throw Object.assign(new Error('Not found: not a celebration'), { status: 404 });
  }
  if (evt.organizer_id !== userId) {
    throw Object.assign(new Error('Forbidden: only the organizer can configure the domain'), {
      status: 403,
    });
  }
  return evt;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { user } = await requireAuthenticatedUser();
    const evt = await assertOrganizer(user.id, eventId);
    const plan = await getEventPlan(admin, evt);

    return NextResponse.json({
      success: true,
      data: {
        domain: evt.custom_domain ?? null,
        status: evt.custom_domain_status,
        enabled: plan.custom_domain_enabled,
        verificationRecord: evt.custom_domain
          ? `afribook-verify=${eventId}`
          : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;
    const { user } = await requireAuthenticatedUser();
    const evt = await assertOrganizer(user.id, eventId);

    const plan = await getEventPlan(admin, evt);
    if (!plan.custom_domain_enabled) {
      return NextResponse.json(
        { success: false, error: 'Custom domains are not enabled on your celebration plan' },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { domain } = body;
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing required field: domain' },
        { status: 400 },
      );
    }

    const normalized = domain.toLowerCase().trim();
    if (
      !/^(?!-)[a-z0-9-]{1,63}(?<!-)\.(?!-)[a-z0-9-]{1,63}(?<!-)(\.[a-z0-9-]{1,63})*$/.test(
        normalized,
      )
    ) {
      return NextResponse.json(
        { success: false, error: 'Domain must be a valid hostname (e.g. wedding.example.com)' },
        { status: 400 },
      );
    }

    const status = await verifyCelebrationDomain(admin, eventId, normalized);

    return NextResponse.json({
      success: true,
      data: {
        domain: normalized,
        status,
        verificationRecord: `afribook-verify=${eventId}`,
      },
      message:
        status === 'verified'
          ? 'Domain verified — celebration is live on your custom domain.'
          : status === 'failed'
            ? 'Verification record not found. Add the TXT record and try again.'
            : 'Verification pending. Add the TXT record; we will re-check shortly.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Internal server error' },
      { status: error?.status ?? 500 },
    );
  }
}
