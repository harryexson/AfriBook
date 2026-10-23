import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const createNeonAuth = vi.fn(() => ({
  getSession: vi.fn(),
  handler: () => ({ GET: vi.fn(), POST: vi.fn(), PUT: vi.fn(), DELETE: vi.fn(), PATCH: vi.fn() }),
}));

vi.unmock('@/lib/neon/server');
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: vi.fn() }));
vi.mock('@neondatabase/neon-js/auth/next/server', () => ({ createNeonAuth }));
vi.mock('@neondatabase/neon-js', () => ({ createClient: vi.fn() }));

describe('Neon Auth initialization', () => {
  beforeEach(() => {
    vi.resetModules();
    createNeonAuth.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('imports the server module and auth route without a cookie secret', async () => {
    vi.stubEnv('NEON_AUTH_COOKIE_SECRET', '');
    await expect(import('@/lib/neon/server')).resolves.toBeDefined();
    await expect(import('@/app/api/auth/[...path]/route')).resolves.toBeDefined();
    expect(createNeonAuth).not.toHaveBeenCalled();
  });

  it('fails the first use with a clear error when the secret is missing', async () => {
    vi.stubEnv('NEON_AUTH_COOKIE_SECRET', '');
    const { getNeonAuth } = await import('@/lib/neon/server');
    expect(() => getNeonAuth()).toThrow('NEON_AUTH_COOKIE_SECRET is not configured');
    expect(createNeonAuth).not.toHaveBeenCalled();
  });

  it('creates the auth instance once the secret is configured', async () => {
    vi.stubEnv('NEON_AUTH_COOKIE_SECRET', 'test-secret');
    vi.stubEnv('NEON_AUTH_BASE_URL', 'https://auth.example.test');
    const { getNeonAuth } = await import('@/lib/neon/server');
    const first = getNeonAuth();
    const second = getNeonAuth();
    expect(first).toBe(second);
    expect(createNeonAuth).toHaveBeenCalledTimes(1);
    expect(createNeonAuth).toHaveBeenCalledWith({
      baseUrl: 'https://auth.example.test',
      cookies: { secret: 'test-secret' },
    });
  });
});
