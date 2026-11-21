// The page's data: POST { pin } -> the live document (signals, SB ledger, real bets, engine status).
// GET ?ping=1 -> whether storage is connected (no details).
import { NextRequest } from "next/server";
import { checkPin, json } from "@/lib/live/auth";
import { fresh, LiveState, view } from "@/lib/live/state";
import { getStore } from "@/lib/live/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const store = getStore();
  if (req.nextUrl.searchParams.get("ping")) return json({ storage: !!store });
  return json({ error: "use POST" }, 405);
}

export async function POST(req: NextRequest) {
  const store = getStore();
  if (!store) return json({ error: "no storage connected" }, 503);
  const body = (await req.json().catch(() => ({}))) as { pin?: string };
  const auth = await checkPin(store, body.pin);
  if (!auth.ok) return json({ error: "wrong PIN" }, 401);
  const raw = await store.get("live:state");
  const state = raw ? (JSON.parse(raw) as LiveState) : fresh();
  return json({ ...view(state, Date.now()), claimed: auth.claimed });
}
