import { NextRequest, NextResponse } from "next/server";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getStore, Store } from "@/lib/fantasyStore";

// Cloud vault for the owner's private bet tracker (raznova.in/tracker), shared by his devices and his cousin's.
// POST { pin, action: "pull" | "push", data?: { bets, txns, settings } }
// The first PIN ever used claims the vault. Records merge one by one; the newer updatedAt wins.
// GET ?ping=1  whether storage is connected and answering (no details).
// Storage: the same Redis the fantasy league uses (compare-and-swap writes, nothing logged).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTH = "tracker:auth";
const STATE = "tracker:state";
const MAX_BYTES = 4_000_000;

type Rec = { id?: string; updatedAt?: number } & Record<string, unknown>;
type Vault = { bets: Record<string, Rec>; txns: Record<string, Rec>; settings: Rec; updatedAt: number };
type Auth = { salt: string; hash: string; createdAt: number };

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" },
  });
}

const hash = (pin: string, salt: string) => scryptSync(pin, salt, 32).toString("hex");

function toMap(x: unknown): Record<string, Rec> {
  if (!x || typeof x !== "object") return {};
  if (Array.isArray(x)) return Object.fromEntries((x as Rec[]).filter((r) => r && r.id).map((r) => [String(r.id), r]));
  return x as Record<string, Rec>;
}

function mergeMap(a: Record<string, Rec>, b: Record<string, Rec>) {
  const out = { ...a };
  for (const [id, rec] of Object.entries(b)) {
    if (!rec || typeof rec !== "object") continue;
    const cur = out[id];
    if (!cur || (rec.updatedAt || 0) >= (cur.updatedAt || 0)) out[id] = rec;
  }
  return out;
}

function merge(server: Vault | null, incoming: Partial<Vault> | undefined): Vault {
  const s: Vault = server || { bets: {}, txns: {}, settings: {}, updatedAt: 0 };
  const i = incoming || {};
  const settings = ((i.settings?.updatedAt || 0) > (s.settings?.updatedAt || 0) ? i.settings : s.settings) || {};
  return {
    bets: mergeMap(toMap(s.bets), toMap(i.bets)),
    txns: mergeMap(toMap(s.txns), toMap(i.txns)),
    settings,
    updatedAt: Date.now(),
  };
}

async function checkPin(store: Store, pin: string): Promise<{ ok: boolean; claimed: boolean }> {
  const raw = await store.get(AUTH);
  if (!raw) {
    const salt = randomBytes(16).toString("hex");
    const auth: Auth = { salt, hash: hash(pin, salt), createdAt: Date.now() };
    if (await store.cas(AUTH, null, JSON.stringify(auth))) return { ok: true, claimed: true };
    return checkPin(store, pin); // someone claimed it in the same instant: verify against theirs
  }
  const auth = JSON.parse(raw) as Auth;
  const a = Buffer.from(auth.hash, "hex");
  const b = Buffer.from(hash(pin, auth.salt), "hex");
  return { ok: a.length === b.length && timingSafeEqual(a, b), claimed: false };
}

export async function GET(req: NextRequest) {
  if (!req.nextUrl.searchParams.get("ping")) return json({ ok: true, method: "POST" });
  const store = getStore();
  if (!store) return json({ storage: null, ok: false });
  try {
    await store.get(STATE);
    return json({ storage: store.kind, ok: true });
  } catch {
    return json({ storage: store.kind, ok: false });
  }
}

export async function POST(req: NextRequest) {
  const text = await req.text();
  if (text.length > MAX_BYTES) return json({ error: "Too large" }, 413);
  let body: { pin?: string; action?: string; data?: Partial<Vault> };
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "Bad JSON" }, 400);
  }
  const pin = String(body.pin || "");
  if (!/^\d{4,8}$/.test(pin)) return json({ error: "PIN must be 4–8 digits" }, 400);

  const store = getStore();
  if (!store) return json({ error: "Cloud storage is not connected" }, 503);

  try {
    // brute-force brake: at most 15 wrong PINs per 10 minutes across everyone
    const bucket = `tracker:fail:${Math.floor(Date.now() / 600_000)}`;
    const fails = Number((await store.get(bucket)) || 0);
    if (fails >= 15) return json({ error: "Too many wrong PINs. Try again in 10 minutes." }, 429);

    const { ok, claimed } = await checkPin(store, pin);
    if (!ok) {
      await store.incr(bucket);
      await new Promise((r) => setTimeout(r, 500));
      return json({ error: "Wrong PIN" }, 401);
    }

    if (body.action === "push") {
      for (let i = 0; i < 6; i++) {
        const raw = await store.get(STATE);
        const next = merge(raw ? (JSON.parse(raw) as Vault) : null, body.data);
        if (await store.cas(STATE, raw, JSON.stringify(next))) return json({ ok: true, claimed, state: next });
      }
      return json({ error: "Another device was saving at the same moment. Try again." }, 409);
    }

    const raw = await store.get(STATE);
    return json({ ok: true, claimed, state: raw ? JSON.parse(raw) : { bets: {}, txns: {}, settings: {}, updatedAt: 0 } });
  } catch {
    return json({ error: "Cloud storage isn't answering right now" }, 503);
  }
}
