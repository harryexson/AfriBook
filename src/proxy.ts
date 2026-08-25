import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COUNTRY_CODES = ['us', 'ca', 'gb', 'fr', 'de', 'ae', 'in', 'ng', 'gh', 'ke', 'tz', 'ug', 'mw', 'za', 'eg', 'ar', 'am'] as const;
type CountryCode = typeof COUNTRY_CODES[number];
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/api', '/_next', '/favicon.ico', '/images'];
const AUTH_PROTECTED_ROUTES = ['/vendor', '/admin', '/driver', '/checkout', '/bookings', '/orders', '/profile', '/payments'];
const VENDOR_ROUTES = ['/vendor'];
const ADMIN_ROUTES = ['/admin'];
const DRIVER_ROUTES = ['/driver'];

function detectCountry(hostname: string): string | null {
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

  return knownDomains[hostname] ?? null;
}

/** Any well-formed ISO-3166 alpha-2 code counts as a deliberate market
 *  selection — NOT limited to the marketing allowlist, so users in markets
 *  like RW/MZ/BW are never silently reset by this proxy. */
function isWellFormedCountryCode(c: string | undefined | null): boolean {
  return typeof c === 'string' && /^[A-Za-z]{2}$/.test(c);
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

  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // ─── Country Detection ──────────────────────────────────────
  // Precedence: explicit cookie (user selection) → host/domain → IP →
  // Accept-Language. A well-formed country cookie is ALWAYS treated as the
  // user's deliberate market selection and is NEVER overwritten by
  // host/IP/language inference on subsequent requests.
  const hasUserSelection = isWellFormedCountryCode(countryCookie);
  const normalizedCookie = countryCookie?.toUpperCase();
  const detectedFromHost = detectCountry(hostname);
  const languageCountry = parseCountryFromAcceptLanguage(acceptLanguage);
  const ipCountry = countryFromIpHeaders(req.headers);

  const isValid = (c: string): c is CountryCode =>
    COUNTRY_CODES.includes(c as CountryCode);

  const inferredCountry: CountryCode | null =
    (detectedFromHost && isValid(detectedFromHost) ? detectedFromHost as CountryCode : null)
    ?? (ipCountry && isValid(ipCountry) ? ipCountry as CountryCode : null)
    ?? (languageCountry && isValid(languageCountry) ? languageCountry as CountryCode : null);

  const resolvedCountry: string =
    (hasUserSelection ? normalizedCookie : undefined)
    ?? inferredCountry
    ?? 'ng';

  // Only set a country cookie when the browser has none — initial detection.
  // Never stomp an existing selection (that was the US-reset bug).
  if (!countryCookie) {
    response.cookies.set('country', resolvedCountry.toUpperCase(), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  response.headers.set('X-Detected-Country', resolvedCountry.toUpperCase());

  // ─── Country-based redirect for homepage ────────────────────
  if (pathname === '/' && !isStaticPath && !isApiPath) {
    const url = req.nextUrl.clone();
    url.pathname = `/${resolvedCountry.toUpperCase()}`;
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
      const { data: profile } = await supabase
        .from('users')
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
