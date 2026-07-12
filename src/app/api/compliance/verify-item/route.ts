import { NextRequest, NextResponse } from 'next/server';
import { verifyItemIntegrity } from '@/lib/pickup/compliance-manager';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { orderId, verifiedBy, role, itemsConfirmed, hasDiscrepancy, discrepancyNotes, photoUrl } = body;

  if (!orderId || !verifiedBy || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!['vendor', 'driver', 'customer'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role. Must be vendor, driver, or customer' }, { status: 400 });
  }

  const result = await verifyItemIntegrity({
    orderId,
    verifiedBy,
    role,
    itemsConfirmed,
    hasDiscrepancy,
    discrepancyNotes,
    photoUrl,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
