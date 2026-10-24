import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('@/lib/neon/admin', () => ({ query }));
import { publicProducts } from '@/lib/public-products';
describe('public product catalog', () => {
  beforeEach(() => query.mockReset());
  it('restricts public reads to available products and active businesses with bound filters', async () => {
    query.mockResolvedValue([]);
    await expect(publicProducts({ country: 'MW', search: "x' OR 1=1 --", category: 'Fashion' })).resolves.toEqual([]);
    const [sql, values] = query.mock.calls[0];
    expect(sql).toContain("p.is_available = true AND b.status = 'active'");
    expect(sql).not.toContain("x' OR 1=1");
    expect(values).toEqual([null, 'MW', 'Fashion', "x' OR 1=1 --"]);
  });
  it('preserves merchant prices and excludes private fields from the response', async () => {
    query.mockResolvedValue([{ id: 'p', business_id: 'b', name: 'Dress', price: '12000', currency: 'MWK', country_code: 'MW', business_name: 'Tailor', owner_id: 'private', metadata: { secret: true } }]);
    const [product] = await publicProducts({ id: 'p' });
    expect(product.price).toBe(12000);
    expect(product.currency).toBe('MWK');
    expect(product).not.toHaveProperty('owner_id');
    expect(product).not.toHaveProperty('metadata');
    expect(query.mock.calls[0][1][0]).toBe('p');
  });
});
