import { createClient } from '@/lib/neon/server';
import type { Vehicle } from '@/types';

// Server-side counterpart to getVehicle() in vehicle-rental.ts. That module
// builds a browser client at import time, so a Server Component importing it
// fails `next build` ("createClient is on the client").

function toCamelCase<T>(obj: unknown): T {
  if (!obj || typeof obj !== 'object') return obj as T;
  if (Array.isArray(obj)) return obj.map((v) => toCamelCase(v)) as T;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())] = toCamelCase(value);
  }
  return result as T;
}

export async function getVehicleServer(vehicleId: string): Promise<Vehicle | null> {
  const client = (await createClient()) as any;
  const { data, error } = await client.from('rental_vehicles').select('*').eq('id', vehicleId).single();
  if (error || !data) return null;
  return toCamelCase<Vehicle>(data);
}
