import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Password-gated analytics endpoint for the private /insights dashboard.
// Runs ONE fixed, parameterised aggregate (the insights_summary function) via
// the service-role key — never arbitrary SQL, never exposed to the browser.
// The only accepted input is the password and a whitelisted range.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.INSIGHTS_PASSWORD;

const admin =
  SUPABASE_URL && SERVICE_KEY
    ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
    : null;

// Whitelisted windows → hours of lookback (null = all-time).
const RANGES: Record<string, number | null> = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
  all: null,
};

/** Constant-time-ish string compare so the password check doesn't leak length
 * or position via early exit. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(req: NextRequest) {
  let body: { password?: unknown; range?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }

  if (!PASSWORD) {
    return NextResponse.json(
      { ok: false, error: "dashboard not configured (INSIGHTS_PASSWORD unset)" },
      { status: 503 }
    );
  }
  const password = typeof body.password === "string" ? body.password : "";
  if (!safeEqual(password, PASSWORD)) {
    return NextResponse.json({ ok: false, error: "wrong password" }, { status: 401 });
  }

  const rangeKey = typeof body.range === "string" && body.range in RANGES ? body.range : "7d";
  const hours = RANGES[rangeKey];
  const since = hours === null ? null : new Date(Date.now() - hours * 3600 * 1000).toISOString();

  if (!admin) {
    return NextResponse.json({ ok: false, error: "backend unavailable" }, { status: 503 });
  }

  const { data, error } = await admin.rpc("insights_summary", { p_since: since });
  if (error) {
    console.error("insights_summary failed:", error.message);
    return NextResponse.json({ ok: false, error: "query failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, range: rangeKey, data });
}
