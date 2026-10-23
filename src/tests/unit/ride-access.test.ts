import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), query: vi.fn() }));
vi.mock('@/lib/neon/server', () => ({ requireAuthenticatedUser: mocks.auth }));
vi.mock('@/lib/neon/admin', () => ({ query: mocks.query }));
import { requireRideActor } from '@/lib/ridely/ride-access';
describe('ride participant ownership', () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.query.mockResolvedValue([]); });
  it('rejects anonymous callers before any driver or guardian lookup', async () => {
    mocks.auth.mockRejectedValue(Object.assign(new Error('Authentication required'), { status: 401 }));
    await expect(requireRideActor({ rider_id: 'rider', driver_id: 'driver' })).rejects.toMatchObject({ status: 401 });
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it('allows the rider without treating them as a driver', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'rider' } });
    expect(await requireRideActor({ rider_id: 'rider', driver_id: 'driver' })).toBe('rider');
  });
  it('requires the assigned driver record to belong to the authenticated account', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'driver-user' } }); mocks.query.mockResolvedValueOnce([{ id: 'assigned-driver' }]);
    expect(await requireRideActor({ rider_id: 'rider', driver_id: 'assigned-driver' })).toBe('driver');
    expect(mocks.query).toHaveBeenCalledWith(expect.stringContaining('profile_id = $2'), ['assigned-driver', 'driver-user']);
  });
  it('denies another authenticated account', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'stranger' } });
    await expect(requireRideActor({ rider_id: 'rider', driver_id: 'driver' })).rejects.toMatchObject({ status: 403 });
  });
  it('allows an authenticated guardian only after checking their relationship', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'guardian' } }); mocks.query.mockResolvedValueOnce([{ id: 'rider' }]);
    expect(await requireRideActor({ rider_id: 'rider', driver_id: null })).toBe('rider');
    expect(mocks.query).toHaveBeenCalledWith(expect.stringContaining('guardian_id = $2'), ['rider', 'guardian']);
  });
});
