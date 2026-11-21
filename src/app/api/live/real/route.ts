// Real bets you placed on Stake: POST { pin, bet } adds or updates one (by id). These never touch Skibidi Bucks.
import { NextRequest } from "next/server";
import { checkPin, json } from "@/lib/live/auth";
import { fresh, LiveState, RealBet } from "@/lib/live/state";
import { getStore, update } from "@/lib/live/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const ACCOUNTS = ["Bhoomik acc", "Tanay acc"];

function clean(b: Partial<RealBet>): RealBet | null {
  const num = (x: unknown) => (typeof x === "number" && isFinite(x) ? x : Number(x));
  const odds = num(b.odds), stake = num(b.stake_inr), line = num(b.line);
  if (!b.id || !b.player || !b.market || !(odds > 1) || !(stake > 0) || !isFinite(line)) return null;
  if (!ACCOUNTS.includes(String(b.account))) return null;
  return {
    id: String(b.id).slice(0, 200), at: num(b.at) || Date.now(), signal_id: b.signal_id ? String(b.signal_id).slice(0, 200) : null,
    player: String(b.player).slice(0, 80), market: String(b.market).slice(0, 60), line, side: b.side === "under" ? "under" : "over",
    odds, stake_inr: stake, account: String(b.account), slip: b.slip ? String(b.slip).slice(0, 80) : "",
    result: (["open", "won", "lost", "void"] as const).includes(b.result as "open") ? b.result : "open",
  };
}

export async function POST(req: NextRequest) {
  const store = getStore();
  if (!store) return json({ error: "no storage connected" }, 503);
  const body = (await req.json().catch(() => ({}))) as { pin?: string; bet?: Partial<RealBet> };
  if (!(await checkPin(store, body.pin)).ok) return json({ error: "wrong PIN" }, 401);
  const bet = clean(body.bet || {});
  if (!bet) return json({ error: "bad bet" }, 400);
  const s = await update<LiveState>(store, "live:state", fresh, (cur) => ({ ...cur, real: { ...cur.real, [bet.id]: bet } }));
  return json({ ok: true, real: Object.keys(s.real).length });
}
