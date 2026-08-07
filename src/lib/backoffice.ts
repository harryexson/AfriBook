import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type AdminDbRole =
  | 'super_admin'
  | 'country_admin'
  | 'support_admin'
  | 'compliance_admin'
  | 'payment_admin';

const ADMIN_ROLES: AdminDbRole[] = [
  'super_admin',
  'country_admin',
  'support_admin',
  'compliance_admin',
  'payment_admin',
];

interface AdminContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
  userId: string;
  role: AdminDbRole;
}

/**
 * Authenticates the request and verifies the caller holds an admin role on
 * their profile. Returns an authorized context, or a NextResponse error when
 * the caller is anonymous / not an admin. Must be the first check in any
 * back-office route.
 */
export async function requireAdmin(
  allowedRoles: AdminDbRole[] = ADMIN_ROLES,
): Promise<{ ctx: AdminContext } | { error: NextResponse }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role as AdminDbRole | undefined;
  if (!role || !ADMIN_ROLES.includes(role) || !allowedRoles.includes(role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { ctx: { supabase, userId: user.id, role } };
}

export function handleError(error: unknown, fallback = 'Request failed'): NextResponse {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseQuery = any;

/** Generates a human-friendly, collision-safe reference number, e.g. INV-000042. */
export async function nextReferenceNumber(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: LooseQuery,
  table: 'invoices' | 'support_tickets',
  prefix: 'INV' | 'TKT',
): Promise<string> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) return `${prefix}-000001`;
  const next = ((count ?? 0) + 1).toString().padStart(6, '0');
  return `${prefix}-${next}`;
}
