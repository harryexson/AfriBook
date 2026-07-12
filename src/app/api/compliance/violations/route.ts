import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createComplianceViolation, getOpenViolations, resolveViolation } from '@/lib/pickup/compliance-manager';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === 'resolve') {
    const { violationId, resolution, resolutionNotes } = body;
    if (!violationId || !resolution) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const ok = await resolveViolation(violationId, {
      resolution,
      resolvedBy: user.id,
      resolutionNotes,
    });
    if (!ok) {
      return NextResponse.json({ error: 'Failed to resolve violation' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  const {
    subjectType, subjectId, violationType, description, severity,
    orderId, deliveryId, rideId, evidenceUrls,
  } = body;

  if (!subjectType || !subjectId || !violationType || !description || !severity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const violation = await createComplianceViolation({
    subjectType,
    subjectId,
    violationType,
    description,
    severity,
    orderId,
    deliveryId,
    rideId,
    evidenceUrls,
  });

  if (!violation) {
    return NextResponse.json({ error: 'Failed to create violation' }, { status: 500 });
  }

  return NextResponse.json(violation, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subjectType = searchParams.get('subjectType') as 'driver' | 'vendor' | 'business' | null;
  const subjectId = searchParams.get('subjectId');

  if (!subjectType || !subjectId) {
    return NextResponse.json({ error: 'subjectType and subjectId required' }, { status: 400 });
  }

  const violations = await getOpenViolations({ subjectType, subjectId });
  return NextResponse.json(violations);
}
