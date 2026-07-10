import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', req.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, req.url),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=no_user', req.url));
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, country_code')
    .eq('id', user.id)
    .single() as unknown as { data: { role: string; country_code: string } | null };

  if (next && next !== '/') {
    return NextResponse.redirect(new URL(next, req.url));
  }

  const role = profile?.role ?? 'customer';
  const countryCode = profile?.country_code ?? 'us';

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
