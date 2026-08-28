import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { detectBot, deviceType } from "@/lib/botDetection";

// Server-side analytics collector. This is the ONLY path that writes to
// visitor_events, using the service-role key which never leaves the server.
// Country/region/city come from Vercel's edge geo headers (derived from the
// visitor's IP by Vercel) — the raw IP is never read or stored here.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "quote_page_view",
  "whatsapp_click",
  "quote_submit",
  "email_click",
]);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Reused across warm invocations. Null when env is unset (e.g. local dev
// without the key) so the route degrades gracefully instead of crashing.
const admin =
  SUPABASE_URL && SERVICE_KEY
    ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
    : null;

const str = (v: unknown, max = 512): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

/** Sanitise caller-supplied metadata: flat object, primitive values only,
 * capped in count and size. Prevents storing anything unexpected/sensitive. */
function cleanMetadata(input: unknown): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (!input || typeof input !== "object") return out;
  let n = 0;
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (n >= 12) break;
    if (!/^[a-z0-9_]{1,40}$/i.test(k)) continue;
    if (typeof v === "string") out[k] = v.slice(0, 200);
    else if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    else if (typeof v === "boolean") out[k] = v;
    else continue;
    n++;
  }
  return out;
}

export async function POST(req: NextRequest) {
  // Respond 204 no matter what — the client must never see an analytics error.
  try {
    const body = await req.json().catch(() => null);
    const eventType = typeof body?.event_type === "string" ? body.event_type : "";
    if (!ALLOWED_EVENTS.has(eventType)) {
      return new NextResponse(null, { status: 204 });
    }

    const ua = req.headers.get("user-agent");
    const bot = detectBot(ua);

    // Vercel edge geo headers — coarse, server-derived, no raw IP persisted.
    const country = str(req.headers.get("x-vercel-ip-country"), 4);
    const region = str(req.headers.get("x-vercel-ip-country-region"), 8);
    const rawCity = req.headers.get("x-vercel-ip-city");
    let city: string | null = null;
    try {
      city = rawCity ? str(decodeURIComponent(rawCity), 120) : null;
    } catch {
      city = str(rawCity, 120);
    }

    const row = {
      session_id: str(body?.session_id, 80),
      country,
      region,
      city,
      pathname: str(body?.pathname, 300),
      referrer: str(body?.referrer, 400),
      user_agent: str(ua, 400),
      device_type: deviceType(ua),
      is_bot: bot.isBot,
      bot_reason: bot.reason,
      event_type: eventType,
      metadata: cleanMetadata(body?.metadata),
    };

    if (admin) {
      // Do not await network failures into an error response.
      const { error } = await admin.from("visitor_events").insert(row);
      if (error) console.error("visitor_events insert failed:", error.message);
    } else {
      console.warn("visitor_events: SUPABASE_SERVICE_ROLE_KEY not configured; event dropped");
    }
  } catch (e) {
    console.error("track route error:", e);
  }
  return new NextResponse(null, { status: 204 });
}
