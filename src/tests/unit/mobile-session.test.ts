import { describe, expect, it } from 'vitest';
import { mobileSessionCookie, sessionTokenFromCookies } from '@/lib/neon/mobile-session';
describe('native session transport', () => {
  it('forwards a signed session value only under the fixed Neon cookie name', () => {
    expect(mobileSessionCookie('Bearer abc.DEF%2F123')).toBe('__Secure-neon-auth.session_token=abc.DEF%2F123');
  });
  it.each([null, '', 'Basic secret', 'Bearer ', 'Bearer token; role=admin', 'Bearer token\r\nx-user: admin', `Bearer ${'a'.repeat(4097)}`])('rejects invalid and injected authorization: %s', value => {
    expect(mobileSessionCookie(value)).toBeNull();
  });
  it('extracts only the session token, without returning cached session data or cookie attributes', () => {
    expect(sessionTokenFromCookies(['__Secure-neon-auth.session_data=private; Secure', '__Secure-neon-auth.session_token=signed%2Ftoken; HttpOnly; Secure'])).toBe('signed%2Ftoken');
    expect(sessionTokenFromCookies(['arbitrary.session_token=attacker'])).toBeNull();
    expect(sessionTokenFromCookies(['__Secure-neon-auth.session_token=; Max-Age=0'])).toBeNull();
  });
});
