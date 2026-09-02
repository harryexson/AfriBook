import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COUNTRIES } from '@/lib/localization/countries';
import { checkRateLimit, getRateLimitBucket } from '@/lib/rate-limit';

// Every ISO code we actually have pricing/currency/tax data for. Uppercase,
// matching COUNTRIES' own keys and the `country` cookie CountryProvider
// writes client-side (src/components/shared/CountryProvider.tsx) — this
// used to be lowercased here while the client always wrote uppercase, so
// this middleware's `isValid()` check rejected every client-set cookie as
// unrecognized (Array.includes is case-sensitive) and silently overwrote
// it back to a server-detected default on the very next request. A country
// picked in the footer/header would revert on refresh. Previously this was
// also a hand-maintained list of 18 codes, which meant every visitor from
// any of the other ~180 supported countries silently fell back to Nigeria
// pricing/currency below.
const COUNTRY_CODES = Object.keys(COUNTRIES);
type CountryCode = string;
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/api', '/_next', '/favicon.ico', '/images'];
const AUTH_PROTECTED_ROUTES = ['/vendor', '/admin', '/driver', '/checkout', '/bookings', '/orders', '/profile', '/payments'];
const VENDOR_ROUTES = ['/vendor'];
const ADMIN_ROUTES = ['/admin'];
const DRIVER_ROUTES = ['/driver'];

function detectCountry(hostname: string): string {
  const host = hostname.toLowerCase();
  for (const cc of COUNTRY_CODES) {
    if (host.startsWith(`${cc.toLowerCase()}.`)) return cc;
  }

  const knownDomains: Record<string, string> = {
    'afribook.us': 'US',
    'afribook.ca': 'CA',
    'afribook.co.uk': 'GB',
    'afribook.fr': 'FR',
    'afribook.de': 'DE',
    'afribook.in': 'IN',
    'afribook.ng': 'NG',
    'afribook.co.ke': 'KE',
    'afribook.co.tz': 'TZ',
    'afribook.co.ug': 'UG',
    'afribook.co.za': 'ZA',
    'afribook.com.eg': 'EG',
    'afribook.ae': 'AE',
    'afribook.com.gh': 'GH',
    'afribook.mw': 'MW',
  };

  return knownDomains[host] ?? 'NG';
}

function countryFromIpHeaders(headers: Headers): string | null {
  const cfCountry = headers.get('cf-ipcountry')
  if (cfCountry) return cfCountry.toUpperCase()

  const vercelCountry = headers.get('x-vercel-ip-country')
  if (vercelCountry) return vercelCountry.toUpperCase()

  return null
}

function parseCountryFromAcceptLanguage(acceptLanguage: string): string | null {
  const langCountryMap: Record<string, string> = {
    'en-us': 'US', 'en-ca': 'CA', 'en-gb': 'GB',
    'fr-fr': 'FR', 'de-de': 'DE', 'en-in': 'IN',
    'en-ng': 'NG', 'en-gh': 'GH', 'en-ke': 'KE',
    'en-tz': 'TZ', 'en-ug': 'UG', 'en-mw': 'MW',
    'en-za': 'ZA', 'ar-eg': 'EG', 'ar-ae': 'AE',
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
  // Uppercased defensively — a cookie set before this fix (or by a stale
  // client) may still be lowercase; normalizing here means it's honored
  // instead of silently rejected and overwritten below.
  const countryCookie = req.cookies.get('country')?.value?.toUpperCase();
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
    ?? 'NG';

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
