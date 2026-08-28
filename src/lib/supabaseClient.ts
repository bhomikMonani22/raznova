import { createClient } from "@supabase/supabase-js";

// The public Supabase URL/key are inlined at build time in every real
// environment (they are NEXT_PUBLIC_*). When a build runs without them —
// e.g. a preview deployment or fork where they are not in scope — fall back
// to harmless placeholders so this module never throws at import/prerender
// time (createClient rejects an empty URL with "supabaseUrl is required",
// which would fail the whole build on any page that imports the client).
//
// In production the true values are always present, so the placeholder is
// never exercised there. If it ever were (a genuinely misconfigured deploy),
// a request would simply fail and the existing error handling in QuoteForm
// shows a friendly message — the build and page render still succeed.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  // Visible in build/runtime logs so a real misconfiguration is easy to spot.
  console.warn(
    "supabaseClient: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set — using placeholder client."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
