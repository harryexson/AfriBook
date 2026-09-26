// ─── Vendor Business Profile Service ──────────────────────────
//
// The typed Database in @/types models businesses with the camelCase
// Business interface, but the real table uses snake_case columns
// (owner_id, country_code). Use a loosely-typed client for snake_case
// reads/writes here — mirrors the same workaround already used in
// api/vendor/domain/route.ts and lib/payments/db.ts's createPaymentDb.
//
// This intentionally writes a narrow field set: `name`, `description`, and
// `media` (logo/cover/gallery — the actual ask this module exists for).
// `category` is a UUID foreign key into business_categories in the real
// schema, and nothing in the live app currently resolves that FK from the
// plain category strings the UI works with everywhere else (the
// customer-facing pages all render from the static seed data in
// countries-curated.ts, not this table) — so category/subcategory/address/
// hours stay read-only here rather than risk writing a plausible-looking
// value into the wrong shape. Widen this once that resolution exists.

import { createClient } from '@/lib/neon/server';

export interface BusinessMedia {
  logoUrl?: string;
  coverUrl?: string;
  galleryUrls?: string[];
}

export interface VendorBusinessRecord {
  id: string;
  name: string;
  description: string | null;
  media: BusinessMedia;
  status: string;
  createdAt: string;
  updatedAt: string;
}

type LooseRow = Record<string, unknown>;
type LooseDb = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: LooseRow | null; error: { message: string } | null }>;
      };
    };
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => {
        select: (columns: string) => {
          maybeSingle: () => Promise<{ data: LooseRow | null; error: { message: string } | null }>;
        };
      };
    };
  };
};

function toRecord(row: LooseRow): VendorBusinessRecord {
  const media = (row.media && typeof row.media === 'object' && !Array.isArray(row.media)
    ? (row.media as BusinessMedia)
    : {}) as BusinessMedia;

  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    media,
    status: (row.status as string) ?? 'pending',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Resolves the current signed-in vendor and their business row (single
 * business per vendor, matching how onboarding creates one). Returns a
 * typed error string instead of throwing, so route handlers can map it to
 * the right HTTP status without a try/catch per caller.
 */
export async function getVendorBusiness(): Promise<
  | { business: VendorBusinessRecord; error: null }
  | { business: null; error: 'unauthorized' | 'not_found' | string }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { business: null, error: 'unauthorized' };

  const db = supabase as unknown as LooseDb;
  const { data, error } = await db
    .from('businesses')
    .select('id, name, description, media, status, created_at, updated_at')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (error) return { business: null, error: error.message };
  if (!data) return { business: null, error: 'not_found' };

  return { business: toRecord(data), error: null };
}

export interface VendorBusinessPatch {
  name?: string;
  description?: string;
  media?: BusinessMedia;
}

export async function updateVendorBusiness(
  patch: VendorBusinessPatch,
): Promise<
  | { business: VendorBusinessRecord; error: null }
  | { business: null; error: 'unauthorized' | 'not_found' | string }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { business: null, error: 'unauthorized' };

  const db = supabase as unknown as LooseDb;

  // Merge into the existing `media` object rather than overwrite it — a
  // logo-only save must not silently wipe out a previously saved cover.
  let mediaToWrite = patch.media;
  if (patch.media) {
    const current = await getVendorBusiness();
    if (current.business) {
      mediaToWrite = { ...current.business.media, ...patch.media };
    }
  }

  const values: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) values.name = patch.name;
  if (patch.description !== undefined) values.description = patch.description;
  if (mediaToWrite !== undefined) values.media = mediaToWrite;

  const { data, error } = await db
    .from('businesses')
    .update(values)
    .eq('owner_id', user.id)
    .select('id, name, description, media, status, created_at, updated_at')
    .maybeSingle();

  if (error) return { business: null, error: error.message };
  if (!data) return { business: null, error: 'not_found' };

  return { business: toRecord(data), error: null };
}
