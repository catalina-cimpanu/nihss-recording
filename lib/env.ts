import { z } from "zod";

const publicSupabaseEnvSchema = z.object({
  url: z.string().url(),
  publishableKey: z.string().min(1),
});

export type PublicSupabaseEnv = z.infer<typeof publicSupabaseEnvSchema>;

export function getPublicSupabaseEnv(): PublicSupabaseEnv | null {
  const parsed = publicSupabaseEnvSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  return parsed.success ? parsed.data : null;
}

export function isSupabaseConfigured(): boolean {
  return getPublicSupabaseEnv() !== null;
}
