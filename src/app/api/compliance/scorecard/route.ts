import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getComplianceScorecard, getComplianceHistory } from '@/lib/pickup/compliance-manager';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const subjectType = searchParams.get('subjectType') as 'driver' | 'vendor' | 'business' | null;
  const subjectId = searchParams.get('subjectId');
  const history = searchParams.get('history');

  if (!subjectType || !subjectId) {
    return NextResponse.json({ error: 'subjectType and subjectId required' }, { status: 400 });
  }

  if (history === 'true') {
    const scores = await getComplianceHistory({ subjectType, subjectId });
    return NextResponse.json(scores);
  }

  const scorecard = await getComplianceScorecard({ subjectType, subjectId });
  if (!scorecard) {
    return NextResponse.json({ error: 'No scorecard found' }, { status: 404 });
  }

  return NextResponse.json(scorecard);
}
