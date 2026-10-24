import 'server-only';
import { query } from '@/lib/neon/admin';
import { getCurrencyForCountry } from '@/lib/money';

export async function publicProducts(filters: { id?: string; country?: string; search?: string; category?: string }) {
  // This is intentionally a public read model: no owner IDs, private metadata,
  // draft listings or general-purpose privileged query access is exposed.
  const rows = await query(`SELECT p.id,p.business_id,p.name,p.description,p.price,p.compare_price,
    p.currency,p.stock,p.images,p.variants,p.category,p.tags,p.is_available,
    b.name AS business_name,b.country_code,b.rating,b.address
    FROM products p JOIN businesses b ON b.id = p.business_id
    WHERE p.is_available = true AND b.status = 'active'
    AND ($1::uuid IS NULL OR p.id = $1::uuid)
    AND ($2::text IS NULL OR b.country_code = $2)
    AND ($3::text IS NULL OR p.category = $3)
    AND ($4::text IS NULL OR strpos(lower(p.name || ' ' || coalesce(p.description,'') || ' ' || b.name), lower($4)) > 0)
    ORDER BY b.rating DESC NULLS LAST,p.name LIMIT 100`,
  [filters.id || null, filters.country || null, filters.category || null, filters.search || null]);
  return rows.map(row => ({
    id: row.id, businessId: row.business_id, businessName: row.business_name,
    name: row.name, description: row.description ?? '', price: Number(row.price),
    comparePrice: row.compare_price == null ? null : Number(row.compare_price),
    currency: row.currency || getCurrencyForCountry(row.country_code), stock: Number(row.stock ?? 0),
    images: row.images ?? [], variants: row.variants ?? [], category: row.category ?? '', tags: row.tags ?? [],
    isAvailable: true, rating: Number(row.rating ?? 0), countryCode: row.country_code,
    location: String(row.address?.formatted ?? row.business_name),
  }));
}
