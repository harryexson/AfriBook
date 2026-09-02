import { NextResponse } from 'next/server';
import { requireAdmin, handleError } from '@/lib/backoffice';
import { checkPaymentProviderEnv, checkCoreEnv } from '@/lib/payments/env-validation';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const providers = checkPaymentProviderEnv();
    const core = checkCoreEnv();
    const healthy = core.missing.length === 0 && providers.some((p) => p.status === 'ready') && providers.every((p) => p.status !== 'misconfigured');

    return NextResponse.json({ success: true, healthy, core, providers });
  } catch (err) {
    return handleError(err, 'Failed to check payment provider health');
  }
}
