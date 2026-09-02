// ─── Driver Auth Helper ──────────────────────────────────────
// Every driver-facing API route needs to turn the authenticated user's
// profile ID into their `drivers.id` row. This was previously copy-pasted
// inline in `earnings/route.ts`; pulled out here so the new status route
// (and any future one) doesn't duplicate it a third time.
// ──────────────────────────────────────────────────────────────

export async function resolveDriverId(supabase: any, profileId: string): Promise<string | null> {
  const { data: driver } = await supabase
    .from('drivers')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle();
  return (driver?.id as string | undefined) ?? null;
}
