import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_COUNTRY } from '@/lib/localization/market-context';

export async function GET(req: NextRequest) {
  const { createClient } = await import('@/lib/neon/server');
  const supabase = await createClient();

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', req.url));
  }

  // NOTE: Neon Auth (Better Auth under the hood) has no client-callable
  // `exchangeCodeForSession` — its OAuth/PKCE code exchange happens inside
  // the hosted auth service itself, which is expected to set the session
  // cookie before ever redirecting the browser here. This route's job is
  // now just "read whatever session cookie already exists and route by
  // role" rather than performing the exchange itself. If OAuth sign-in
  // isn't landing here with a session already established, the real fix is
  // wiring up `@neondatabase/auth/next/server`'s `authApiHandler` at
  // `/api/auth/[...all]` (and pointing the OAuth provider's redirect URI at
  // it) — that's a bigger, separate piece of work than this migration pass.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=no_user', req.url));
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, country_code')
    .eq('id', user.id)
    .single() as unknown as { data: { role: string; country_code: string } | null };

  if (next && next !== '/') {
    return NextResponse.redirect(new URL(next, req.url));
  }

  const role = profile?.role ?? 'customer';
  const countryCode = profile?.country_code ?? DEFAULT_COUNTRY;

  const dashboardMap: Record<string, string> = {
    customer: `/${countryCode}`,
    vendor: `/vendor/dashboard`,
    admin: `/admin/dashboard`,
    driver: `/driver/dashboard`,
    super_admin: `/admin/dashboard`,
  };

  const redirectTo = dashboardMap[role] ?? `/${countryCode}`;
  return NextResponse.redirect(new URL(redirectTo, req.url));
}
