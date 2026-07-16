import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { CONTACT_EMAIL } from "@/lib/config";

// Called by a Supabase database trigger whenever a row lands in
// raznova_quote_requests. Guarded by a shared secret header so only the
// trigger can invoke it. Sends a plain-text email (form values are
// untrusted input — never rendered as HTML) to the business inbox.
//
// Required Vercel env vars:
//   QUOTE_HOOK_SECRET   — must match the secret baked into the DB trigger
//   GMAIL_USER          — Gmail address used to send (raznovaexports@gmail.com)
//   GMAIL_APP_PASSWORD  — Google App Password for that account (not the login password)

const field = (v: unknown) => String(v ?? "—").slice(0, 500);

export async function POST(req: NextRequest) {
  const secret = process.env.QUOTE_HOOK_SECRET;
  if (!secret || req.headers.get("x-quote-secret") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    return NextResponse.json({ ok: false, error: "email not configured" }, { status: 503 });
  }

  let record: Record<string, unknown>;
  try {
    const body = await req.json();
    record = body?.record ?? {};
  } catch {
    return NextResponse.json({ ok: false, error: "bad payload" }, { status: 400 });
  }

  const text = [
    "New quote request from raznova.in",
    "",
    `Name:      ${field(record.name)}`,
    `Company:   ${field(record.company)}`,
    `Country:   ${field(record.country)}`,
    `Email:     ${field(record.email)}`,
    `WhatsApp:  ${field(record.whatsapp)}`,
    `Locale:    ${field(record.locale)}`,
    `Received:  ${field(record.created_at)}`,
    "",
    "Parts list:",
    String(record.parts_list ?? "—").slice(0, 4000),
    "",
    "—",
    "View all requests: https://supabase.com/dashboard/project/lsnudhxlyypugunlgwxi (Table Editor → raznova_quote_requests)",
  ].join("\n");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"Raznova Website" <${user}>`,
      to: CONTACT_EMAIL,
      subject: `New quote request — ${field(record.name)} (${field(record.country)})`,
      text,
      replyTo: typeof record.email === "string" && record.email.includes("@") ? record.email : undefined,
    });
  } catch (e) {
    console.error("quote notification email failed:", e);
    return NextResponse.json({ ok: false, error: "send failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
