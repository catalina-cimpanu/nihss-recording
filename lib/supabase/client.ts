import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export type NihssSupabaseClient = SupabaseClient<Database>;

let browserClient: NihssSupabaseClient | null = null;

export function getSupabaseClient(): NihssSupabaseClient {
  const env = getPublicSupabaseEnv();

  if (!env) {
    throw new Error(
      "Supabase ist nicht konfiguriert. Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local setzen.",
    );
  }

  if (browserClient) {
    return browserClient;
  }

  browserClient = createClient<Database>(env.url, env.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return browserClient;
}
