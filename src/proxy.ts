import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COUNTRIES } from '@/lib/localization/countries';
import { checkRateLimit, getRateLimitBucket } from '@/lib/rate-limit';

// Every ISO code we actually have pricing/currency/tax data for, lowercased
// for use in URLs and cookies. Previously this was a hand-maintained list of
// 18 codes, which meant every visitor from any of the other ~180 supported
// countries silently fell back to Nigeria pricing/currency below.
const COUNTRY_CODES = Object.keys(COUNTRIES).map((c) => c.toLowerCase());
type CountryCode = string;
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/api', '/_next', '/favicon.ico', '/images'];
const AUTH_PROTECTED_ROUTES = ['/vendor', '/admin', '/driver', '/checkout', '/bookings', '/orders', '/profile', '/payments'];
const VENDOR_ROUTES = ['/vendor'];
const ADMIN_ROUTES = ['/admin'];
const DRIVER_ROUTES = ['/driver'];

function detectCountry(hostname: string): string {
  for (const cc of COUNTRY_CODES) {
    if (hostname.startsWith(`${cc}.`)) return cc;
  }

  const knownDomains: Record<string, string> = {
    'afribook.us': 'us',
    'afribook.ca': 'ca',
    'afribook.co.uk': 'gb',
    'afribook.fr': 'fr',
    'afribook.de': 'de',
    'afribook.in': 'in',
    'afribook.ng': 'ng',
    'afribook.co.ke': 'ke',
    'afribook.co.tz': 'tz',
    'afribook.co.ug': 'ug',
    'afribook.co.za': 'za',
    'afribook.com.eg': 'eg',
    'afribook.ae': 'ae',
    'afribook.com.gh': 'gh',
    'afribook.mw': 'mw',
  };

  return knownDomains[hostname] ?? 'ng';
}

function countryFromIpHeaders(headers: Headers): string | null {
  const cfCountry = headers.get('cf-ipcountry')
  if (cfCountry) return cfCountry.toLowerCase()

  const vercelCountry = headers.get('x-vercel-ip-country')
  if (vercelCountry) return vercelCountry.toLowerCase()

  return null
}

function parseCountryFromAcceptLanguage(acceptLanguage: string): string | null {
  const langCountryMap: Record<string, string> = {
    'en-us': 'us', 'en-ca': 'ca', 'en-gb': 'gb',
    'fr-fr': 'fr', 'de-de': 'de', 'en-in': 'in',
    'en-ng': 'ng', 'en-gh': 'gh', 'en-ke': 'ke',
    'en-tz': 'tz', 'en-ug': 'ug', 'en-mw': 'mw',
    'en-za': 'za', 'ar-eg': 'eg', 'ar-ae': 'ae',
  };

  const locales = acceptLanguage.split(',').map((l) => l.split(';')[0].toLowerCase().trim());
  for (const locale of locales) {
    const mapped = langCountryMap[locale];
    if (mapped) return mapped;
  }
  return null;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host') ?? '';
  const countryCookie = req.cookies.get('country')?.value;
  const acceptLanguage = req.headers.get('accept-language') ?? '';

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isApiPath = pathname.startsWith('/api');
  const isStaticPath = pathname.startsWith('/_next') || pathname.startsWith('/images');

  // ─── Rate Limiting (API routes only) ────────────────────────
  // See src/lib/rate-limit.ts for the honest limitation on serverless —
  // this is a real starting point, not a complete global limiter.
  if (isApiPath) {
    const bucket = getRateLimitBucket(pathname);
    if (bucket) {
      // x-forwarded-for is set by Vercel/Cloudflare at the edge and isn't
      // client-spoofable through them; if this ever runs behind a
      // different proxy that doesn't set it, this falls back to a shared
      // bucket rather than silently disabling the limit.
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
      const key = `${ip}:${bucket.prefix}`;
      const result = checkRateLimit(key, bucket.limit, bucket.windowMs);
      if (!result.allowed) {
        return NextResponse.json(
          { success: false, error: 'Too many requests, please try again shortly.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(result.retryAfterSeconds),
              'X-RateLimit-Limit': String(result.limit),
              'X-RateLimit-Remaining': '0',
            },
          },
        );
      }
    }
  }

  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // ─── Country Detection ──────────────────────────────────────
  const detectedFromHost = detectCountry(hostname);
  const languageCountry = parseCountryFromAcceptLanguage(acceptLanguage);
  const ipCountry = countryFromIpHeaders(req.headers);

  const isValid = (c: string): c is CountryCode =>
    COUNTRY_CODES.includes(c as CountryCode);

  const resolvedCountry: CountryCode =
    (countryCookie && isValid(countryCookie) ? countryCookie as CountryCode : undefined)
    ?? (isValid(detectedFromHost) ? detectedFromHost as CountryCode : undefined)
    ?? (ipCountry && isValid(ipCountry) ? ipCountry as CountryCode : undefined)
    ?? (languageCountry && isValid(languageCountry) ? languageCountry as CountryCode : undefined)
    ?? 'ng';

  // Set country cookie if not present or different
  if (!countryCookie || countryCookie !== resolvedCountry) {
    response.cookies.set('country', resolvedCountry, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  response.headers.set('X-Detected-Country', resolvedCountry);

  // ─── Country-based redirect for homepage ────────────────────
  if (pathname === '/' && !isStaticPath && !isApiPath) {
    const url = req.nextUrl.clone();
    url.pathname = `/${resolvedCountry}`;
    return NextResponse.redirect(url);
  }

  // ─── Auth Protection ───────────────────────────────────────
  if (!isPublicPath && !isStaticPath && !isApiPath) {
    const { createServerClient } = await import('@supabase/ssr');
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          },
        },
      },
    );

    const { data: { user } } = await supabase.auth.getUser();
    const needsAuth = AUTH_PROTECTED_ROUTES.some((r) => pathname.startsWith(r));

    if (needsAuth && !user) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user) {
      // BUG FOUND DURING THIS AUDIT: this queried a `users` table, which
      // does not exist anywhere in the schema — every migration defines
      // the profile/role table as `profiles`. Since `.from('users')` would
      // error, `profile` was always null, `role` always fell back to
      // 'customer', and every vendor/admin/driver was being redirected
      // away from their own dashboards by this exact check. This is the
      // most severe bug found in this whole audit — it would have made
      // every dashboard built this session inaccessible in production.
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single() as unknown as { data: { role: string } | null };

      const role = profile?.role ?? 'customer';

      if (VENDOR_ROUTES.some((r) => pathname.startsWith(r)) && role !== 'vendor' && role !== 'admin' && role !== 'super_admin') {
        return NextResponse.redirect(new URL('/?error=unauthorized', req.url));
      }

      if (ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && role !== 'admin' && role !== 'super_admin') {
        return NextResponse.redirect(new URL('/?error=unauthorized', req.url));
      }

      if (DRIVER_ROUTES.some((r) => pathname.startsWith(r)) && role !== 'driver') {
        return NextResponse.redirect(new URL('/?error=unauthorized', req.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico)$).*)',
  ],
};
