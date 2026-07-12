import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTheftPreventionRecord, getTheftPreventionRecord, getTheftInvestigations } from '@/lib/pickup/compliance-manager';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { orderId, expectedItems } = body;

  if (!orderId || !expectedItems) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const recordId = await createTheftPreventionRecord(orderId, expectedItems);
  if (!recordId) {
    return NextResponse.json({ error: 'Failed to create theft prevention record' }, { status: 500 });
  }

  return NextResponse.json({ id: recordId }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  const all = searchParams.get('all');

  if (all === 'true') {
    const investigations = await getTheftInvestigations();
    return NextResponse.json(investigations);
  }

  if (!orderId) {
    return NextResponse.json({ error: 'orderId required' }, { status: 400 });
  }

  const record = await getTheftPreventionRecord(orderId);
  if (!record) {
    return NextResponse.json({ error: 'No theft prevention record found' }, { status: 404 });
  }

  return NextResponse.json(record);
}
