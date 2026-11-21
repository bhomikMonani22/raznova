// The PC app's uplink: POST { items: [{ kind, at, ... }] } with Authorization: Bearer <engine token from Settings>.
// Kinds: heartbeat, games, signal, sb_bet, sb_summary. New Moderate/Strong signals are pushed to installed phones.
import { NextRequest } from "next/server";
import { json } from "@/lib/live/auth";
import { engineAuthorized, vapid } from "@/lib/live/secrets";
import { sendAll } from "@/lib/live/push";
import { applyBatch, fresh, Item, LiveState, shouldPush, Signal } from "@/lib/live/state";
import { getStore, update } from "@/lib/live/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const KEY = "live:state";
const MAX_BYTES = 2_000_000;

export async function POST(req: NextRequest) {
  const store = getStore();
  if (!store) return json({ error: "no storage connected" }, 503);
  if (!(await engineAuthorized(store, req.headers.get("authorization")))) return json({ error: "unauthorized" }, 401);
  const text = await req.text();
  if (text.length > MAX_BYTES) return json({ error: "too large" }, 413);
  let items: Item[];
  try {
    items = (JSON.parse(text) as { items?: Item[] }).items || [];
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const now = Date.now();
  let toPush: Signal[] = [];
  const state = await update<LiveState>(store, KEY, fresh, (cur) => {
    const r = applyBatch(cur, items, now);
    toPush = r.fresh.filter((s) => shouldPush(s, now));
    return r.state;
  });
  const gone = toPush.length ? await sendAll(state, toPush, await vapid(store)) : [];
  if (gone.length) {
    await update<LiveState>(store, KEY, fresh, (cur) => {
      const push = { ...cur.push };
      for (const g of gone) delete push[g];
      return { ...cur, push };
    });
  }
  return json({ ok: true, signals: Object.keys(state.signals).length, pushed: toPush.length });
}
