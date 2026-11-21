// Push subscriptions. GET -> { publicKey } (null until storage is connected). POST { pin, subscription } saves this phone.
import { NextRequest } from "next/server";
import { checkPin, json } from "@/lib/live/auth";
import { vapid } from "@/lib/live/secrets";
import { fresh, LiveState } from "@/lib/live/state";
import { getStore, update } from "@/lib/live/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  return json({ publicKey: store ? (await vapid(store)).publicKey : null });
}

export async function POST(req: NextRequest) {
  const store = getStore();
  if (!store) return json({ error: "no storage connected" }, 503);
  const body = (await req.json().catch(() => ({}))) as {
    pin?: string; subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  };
  if (!(await checkPin(store, body.pin)).ok) return json({ error: "wrong PIN" }, 401);
  const sub = body.subscription;
  if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys?.auth) return json({ error: "bad subscription" }, 400);
  const rec = { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }, at: Date.now() };
  await update<LiveState>(store, "live:state", fresh, (cur) => ({ ...cur, push: { ...cur.push, [rec.endpoint]: rec } }));
  return json({ ok: true });
}
