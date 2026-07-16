import { NextRequest, NextResponse } from "next/server";
import { CONTACT_EMAIL } from "@/lib/config";

// Called by a Supabase database trigger whenever a row lands in
// raznova_quote_requests. Guarded by a shared secret header so only the
// trigger can invoke it. Relays the request to the business inbox via
// FormSubmit (https://formsubmit.co) — no SMTP credentials needed; the
// inbox owner activates the relay once via a confirmation email.
//
// Required Vercel env var:
//   QUOTE_HOOK_SECRET — must match the secret baked into the DB trigger

const field = (v: unknown) => String(v ?? "—").slice(0, 500);

export async function POST(req: NextRequest) {
  const secret = process.env.QUOTE_HOOK_SECRET;
  if (!secret || req.headers.get("x-quote-secret") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let record: Record<string, unknown>;
  try {
    const body = await req.json();
    record = body?.record ?? {};
  } catch {
    return NextResponse.json({ ok: false, error: "bad payload" }, { status: 400 });
  }

  const replyTo =
    typeof record.email === "string" && record.email.includes("@")
      ? record.email.slice(0, 200)
      : undefined;

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
      method: "POST",
      // FormSubmit rejects requests without a web origin.
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: "https://raznova.in",
        Referer: "https://raznova.in/",
      },
      body: JSON.stringify({
        _subject: `New quote request — ${field(record.name)} (${field(record.country)})`,
        _template: "box",
        ...(replyTo ? { _replyto: replyTo } : {}),
        Name: field(record.name),
        Company: field(record.company),
        Country: field(record.country),
        Email: field(record.email),
        WhatsApp: field(record.whatsapp),
        Locale: field(record.locale),
        Received: field(record.created_at),
        Parts_List: String(record.parts_list ?? "—").slice(0, 4000),
        Dashboard:
          "https://supabase.com/dashboard/project/lsnudhxlyypugunlgwxi (Table Editor -> raznova_quote_requests)",
      }),
    });
    const out: { success?: string; message?: string } = await res.json().catch(() => ({}));
    if (!res.ok || out.success === "false") {
      // Pre-activation, FormSubmit responds success:"false" while it sends
      // the one-time activation email — not a failure worth retrying.
      console.error("quote notification relay response:", res.status, out);
      return NextResponse.json(
        { ok: false, relay: out.message ?? "relay failed" },
        { status: res.ok ? 202 : 502 }
      );
    }
  } catch (e) {
    console.error("quote notification relay failed:", e);
    return NextResponse.json({ ok: false, error: "relay failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
