import { NextRequest, NextResponse } from 'next/server';

// The DB shape types are camelCase while columns are snake_case, so we cast
// the query builder (same pattern used across booking/order routes).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

// GET /api/consents — list the signed-in user's consent records.
export async function GET() {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await (supabase
    .from('user_consents') as LooseQuery)
    .select('*')
    .eq('user_id', user.id)
    .order('granted_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ consents: data }, { status: 200 });
}

// POST /api/consents — record one or more consent grants (or revocations).
// Body: { consents: [{ consentType, granted?, context?, consentVersion?, metadata? }] }
export async function POST(req: NextRequest) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const rawConsents = Array.isArray(body.consents) ? body.consents : [body];

  if (rawConsents.length === 0) {
    return NextResponse.json({ error: 'No consents provided' }, { status: 400 });
  }

  const VALID_TYPES = [
    'terms_of_service',
    'privacy_policy',
    'communications',
    'data_sharing',
    'payment_authorization',
    'hold_harmless_waiver',
    'host_agreement',
    'driver_agreement',
    'rider_agreement',
    'guest_agreement',
  ];

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
  const userAgent = req.headers.get('user-agent') || undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = rawConsents.map((c: any) => ({
    user_id: user.id,
    consent_type: c.consentType,
    consent_version: c.consentVersion,
    context: c.context,
    granted: c.granted ?? true,
    ip_address: ip,
    user_agent: userAgent,
    metadata: c.metadata ?? {},
  }));

  // Validate type values before insert.
  for (const row of rows) {
    if (!VALID_TYPES.includes(row.consent_type)) {
      return NextResponse.json({ error: `Invalid consent type: ${row.consent_type}` }, { status: 400 });
    }
  }

  const { data, error } = await (supabase
    .from('user_consents') as LooseQuery)
    .upsert(rows, { onConflict: 'user_id,consent_type' })
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire a welcome confirmation when the account terms are accepted so new
  // users get a receipt of their agreements (audited in `email_logs`).
  const acceptedTerms = rows.some(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (r: any) => r.consent_type === 'terms_of_service' && r.granted !== false,
  );
  if (acceptedTerms && user.email) {
    const { sendEmail } = await import('@/lib/email');
    sendEmail({
      to: user.email,
      userId: user.id,
      template: 'welcome',
      subject: 'Welcome to AfriBook — your account is ready',
      html: `<p>Hi ${user.user_metadata?.name ?? 'there'},</p><p>Welcome to AfriBook. Your account is ready and your agreements have been recorded.</p><p>Happy booking!</p>`,
      metadata: { acceptedConsents: rows.map((r: any) => r.consent_type) },
    }).catch(() => {});
  }

  return NextResponse.json({ consents: data }, { status: 201 });
}