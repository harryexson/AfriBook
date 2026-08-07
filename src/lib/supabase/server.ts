import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import type { Database } from "@/types";

export async function createClient() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const authorization = requestHeaders.get("Authorization");
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization
    : null;

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: bearerToken
        ? {
            // Mobile/API clients authenticate via a bearer token instead of
            // session cookies, so skip persistence and URL detection.
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          }
        : undefined,
      global: {
        headers: bearerToken ? { Authorization: bearerToken } : undefined,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}

export async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    const authError = new Error(error.message ?? "Authentication failed");
    (authError as any).status = 401;
    throw authError;
  }

  if (!user) {
    const authError = new Error("Authentication required");
    (authError as any).status = 401;
    throw authError;
  }

  return { supabase, user };
}
