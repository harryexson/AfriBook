import { NextRequest, NextResponse } from 'next/server';
import { mobileSessionCookie, sessionTokenFromCookies } from '@/lib/neon/mobile-session';

const ACTIONS = new Set(['sign-in/email', 'sign-up/email', 'email-otp/send-verification-otp',
  'email-otp/verify-email', 'sign-out', 'get-session', 'delete-user']);

export async function POST(req: NextRequest) {
  const noStore = { 'Cache-Control': 'no-store' };
  try {
    const { action, payload = {} } = await req.json();
    if (!ACTIONS.has(action)) return NextResponse.json({ error: 'Unsupported authentication action' }, { status: 400, headers: noStore });
    const cookie = mobileSessionCookie(req.headers.get('authorization'));
    if (['delete-user', 'sign-out', 'get-session'].includes(action) && !cookie) {
      return NextResponse.json({ error: 'Sign in to continue' }, { status: 401, headers: noStore });
    }
    // Forward through the same managed Neon service as the website. Fixed paths
    // and fixed upstream prevent this endpoint becoming an open proxy.
    const response = await fetch(`${process.env.NEON_AUTH_BASE_URL}/${action}`, {
      method: action === 'get-session' ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json',
        Origin: process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin,
        'x-neon-auth-middleware': 'true', ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(action === 'get-session' ? {} : { body: JSON.stringify(payload) }),
      cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.message || data.error || 'Authentication failed' }, { status: response.status, headers: noStore });
    const sessionToken = sessionTokenFromCookies(response.headers.getSetCookie());
    // Never forward session cookies into a cross-origin browser cookie jar.
    // The Expo client persists the bearer in SecureStore on Android/iOS.
    return NextResponse.json({ data, ...(sessionToken ? { sessionToken } : {}) }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: 'Authentication service unavailable. Please retry.' }, { status: 502, headers: noStore });
  }
}
