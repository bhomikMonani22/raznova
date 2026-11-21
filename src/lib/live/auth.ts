// Access: a PIN for people (the first PIN ever used claims the app, as on raznova.in/tracker), the PC app's token lives in
// secrets.ts. Nothing is logged.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { Store } from "./store";

const AUTH = "live:auth";
type Auth = { salt: string; hash: string; createdAt: number };
const hash = (pin: string, salt: string) => scryptSync(pin, salt, 32).toString("hex");

export async function checkPin(store: Store, pin: unknown): Promise<{ ok: boolean; claimed: boolean }> {
  if (typeof pin !== "string" || pin.length < 4 || pin.length > 64) return { ok: false, claimed: false };
  const raw = await store.get(AUTH);
  if (!raw) {
    const salt = randomBytes(16).toString("hex");
    const rec: Auth = { salt, hash: hash(pin, salt), createdAt: Date.now() };
    const won = await store.cas(AUTH, null, JSON.stringify(rec));
    if (won) return { ok: true, claimed: true };
    return checkPin(store, pin);
  }
  const a = JSON.parse(raw) as Auth;
  const ok = timingSafeEqual(Buffer.from(hash(pin, a.salt), "hex"), Buffer.from(a.hash, "hex"));
  return { ok, claimed: false };
}

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" },
  });
}
