// Native clients store only Neon's signed session token in the OS keychain.
// Identity is always resolved by Neon; this header never supplies a user ID/role.
export const MOBILE_COOKIE_NAME = '__Secure-neon-auth.session_token';

export function mobileSessionCookie(authorization: string | null): string | null {
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice(7);
  if (!token || token.length > 4096 || !/^[A-Za-z0-9._~%+/=-]+$/.test(token)) return null;
  return `${MOBILE_COOKIE_NAME}=${token}`;
}

export function sessionTokenFromCookies(cookies: string[]): string | null {
  for (const cookie of cookies) {
    const pair = cookie.split(';', 1)[0];
    const prefix = `${MOBILE_COOKIE_NAME}=`;
    if (pair.startsWith(prefix)) return pair.slice(prefix.length) || null;
  }
  return null;
}
