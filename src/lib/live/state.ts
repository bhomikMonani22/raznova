// The live document: everything the page shows, merged from the PC app's batches. Pure functions, unit-tested.

export type Signal = {
  id: string; kind: string; tier: "early" | "moderate" | "strong"; strategy: string; status: string;
  game: string; tip: string | null; team?: string; player: string; market: string; label: string; line: number;
  side: "over" | "under"; odds: number; fair: number; stake_fair?: number; edge: number; edge_low?: number;
  books?: number; book_names?: string[]; why?: string; stake_url?: string | null; first_seen?: number; updated?: number;
};
export type SbBet = {
  id: string; placed_at: number; game: string; player: string; market: string; line: number; side: string;
  odds: number; stake: number; tier: string; edge: number; status: string; actual?: number | null; profit?: number | null;
};
export type RealBet = {
  id: string; at: number; signal_id?: string | null; player: string; market: string; line: number; side: string;
  odds: number; stake_inr: number; account: string; slip?: string; result?: "open" | "won" | "lost" | "void";
};
export type LiveState = {
  heartbeat: { at: number; status: Record<string, unknown> } | null;
  signals: Record<string, Signal>;
  sb: { bets: Record<string, SbBet>; summary: Record<string, unknown> | null };
  games: Record<string, unknown>[];
  real: Record<string, RealBet>;
  push: Record<string, { endpoint: string; keys: { p256dh: string; auth: string }; at: number }>;
  updatedAt: number;
};

export const KEEP_FADED_MS = 6 * 3600 * 1000;
export const MAX_SB = 1000;

export function fresh(): LiveState {
  return { heartbeat: null, signals: {}, sb: { bets: {}, summary: null }, games: [], real: {}, push: {}, updatedAt: 0 };
}

export type Item = { kind: string; at?: number; [k: string]: unknown };

/** Apply one batch from the PC app. Returns the new state and the signals that just became active (for push). */
export function applyBatch(s: LiveState, items: Item[], now: number): { state: LiveState; fresh: Signal[] } {
  const out: LiveState = { ...s, signals: { ...s.signals }, sb: { bets: { ...s.sb.bets }, summary: s.sb.summary } };
  const newly: Signal[] = [];
  for (const it of items) {
    if (it.kind === "heartbeat") {
      out.heartbeat = { at: now, status: (it.status as Record<string, unknown>) || {} };
    } else if (it.kind === "games") {
      out.games = (it.games as Record<string, unknown>[]) || [];
    } else if (it.kind === "signal") {
      const sig = it.signal as Signal;
      if (!sig?.id) continue;
      const prev = out.signals[sig.id];
      out.signals[sig.id] = { ...prev, ...sig, first_seen: prev?.first_seen ?? now, updated: now };
      if (sig.status === "active" && (!prev || prev.status !== "active")) newly.push(out.signals[sig.id]);
    } else if (it.kind === "sb_bet") {
      const b = it.bet as SbBet;
      if (b?.id) out.sb.bets[b.id] = { ...out.sb.bets[b.id], ...b };
    } else if (it.kind === "sb_summary") {
      out.sb.summary = (it.summary as Record<string, unknown>) || null;
    }
  }
  // keep the document small: faded or closed signals for 6 hours, the newest 1,000 SB bets
  for (const [id, sig] of Object.entries(out.signals)) {
    if (sig.status !== "active" && now - (sig.updated || 0) > KEEP_FADED_MS) delete out.signals[id];
  }
  const bets = Object.values(out.sb.bets).sort((a, b) => (b.placed_at || 0) - (a.placed_at || 0));
  if (bets.length > MAX_SB) out.sb.bets = Object.fromEntries(bets.slice(0, MAX_SB).map((b) => [b.id, b]));
  out.updatedAt = now;
  return { state: out, fresh: newly };
}

/** Engine online if a heartbeat arrived in the last 90 s (it beats every 30 s). */
export function engineOnline(s: LiveState, now: number): boolean {
  return !!s.heartbeat && now - s.heartbeat.at < 90_000;
}

/** Push only Moderate and Strong. Optional quiet hours in IST via PUSH_QUIET_IST="0-5" (off by default:
 *  NBA tips land 05:30-09:30 IST, so the best pre-game window is the Indian night). */
export function shouldPush(sig: Signal, now: number, quiet = process.env.PUSH_QUIET_IST || ""): boolean {
  if (sig.tier !== "moderate" && sig.tier !== "strong") return false;
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(quiet.trim());
  if (!m) return true;
  const [from, to] = [Number(m[1]), Number(m[2])];
  const h = new Date(now + 5.5 * 3600 * 1000).getUTCHours();
  return from <= to ? !(h >= from && h < to) : !(h >= from || h < to);
}

/** What the page receives: no push subscriptions. */
export function view(s: LiveState, now: number) {
  const { push: _push, ...rest } = s;
  void _push;
  return { ...rest, online: engineOnline(s, now), now };
}
