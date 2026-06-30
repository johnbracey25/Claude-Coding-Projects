/**
 * Central place to read configuration and check whether external services are
 * wired up yet. Lets pages degrade gracefully (show a setup notice) instead of
 * crashing when env vars are missing — important while the project is still
 * being configured by non-technical operators.
 */

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("YOUR-PROJECT");

export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
