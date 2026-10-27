// Raznova fantasy league (raznova.in/fantasy): a free, points-only NBA + IPL league for friends. No money, no prizes.
// One league = one JSON document in Upstash Redis. Every write is a compare-and-swap of the whole document (a short
// Lua script), so two phones picking at the same moment can never both land.
import { createHash, randomBytes, randomInt } from "node:crypto";

export const ROUNDS = 15;
export const MIN_EACH = 5;
export const MAX_MEMBERS = 12;
export const SEASON_END = "2027-05-31T23:59:59Z";

export type Sport = "nba" | "ipl";
export interface Member {
  id: string;
  name: string;
  th: string; // sha256 of the member's token; the token itself lives only on the member's phone
  joined: string;
}
export interface Pick {
  n: number;
  m: string; // member id
  p: string; // player id, "nba:<ESPN id>" or "ipl:<Cricsheet id>"
  at: string;
  by?: string; // set when the commissioner picked for an absent member
}
export interface League {
  v: 1;
  code: string;
  name: string;
  created: string;
  comm: string; // commissioner's member id
  status: "lobby" | "drafting" | "done";
  members: Member[];
  order: string[];
  picks: Pick[];
  started?: string;
  done?: string;
  from?: string; // scoring starts: when the draft finished
  to: string;
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");
export const newId = () => randomBytes(6).toString("base64url");
export const newToken = () => randomBytes(24).toString("base64url");
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
export const validCode = (c: unknown): c is string => typeof c === "string" && /^[A-Z2-9]{6}$/.test(c);

export function cleanName(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
  return t.length ? t : null;
}

export function sportOf(playerId: string): Sport | null {
  if (/^nba:\d{1,12}$/.test(playerId)) return "nba";
  if (/^ipl:[0-9a-f]{8}$/.test(playerId)) return "ipl";
  return null;
}

/** Member on the clock for the next pick (snake order), or null when the draft is not running. */
export function onClock(l: League): string | null {
  if (l.status !== "drafting" || !l.order.length) return null;
  const n = l.picks.length;
  const size = l.order.length;
  if (n >= size * ROUNDS) return null;
  const round = Math.floor(n / size);
  const pos = n % size;
  return l.order[round % 2 === 0 ? pos : size - 1 - pos];
}

/** Can this member still reach 5 of each sport after taking a player of this sport? */
export function sportRuleOk(l: League, memberId: string, sport: Sport): boolean {
  const mine = l.picks.filter((p) => p.m === memberId);
  const count = { nba: 0, ipl: 0 } as Record<Sport, number>;
  for (const p of mine) {
    const s = sportOf(p.p);
    if (s) count[s] += 1;
  }
  count[sport] += 1;
  const left = ROUNDS - (count.nba + count.ipl);
  if (left < 0) return false;
  return Math.max(0, MIN_EACH - count.nba) + Math.max(0, MIN_EACH - count.ipl) <= left;
}

/** Why a pick is refused, or null when it is fine. */
export function pickError(l: League, actor: string, playerId: string): string | null {
  if (l.status !== "drafting") return "The draft is not running.";
  const clock = onClock(l);
  if (!clock) return "The draft is complete.";
  if (actor !== clock && actor !== l.comm) return "It is not your turn.";
  const sport = sportOf(playerId);
  if (!sport) return "Unknown player.";
  if (l.picks.some((p) => p.p === playerId)) return "That player is already taken.";
  if (!sportRuleOk(l, clock, sport)) {
    return `Every team needs at least ${MIN_EACH} NBA and ${MIN_EACH} IPL players: pick ${sport === "nba" ? "an IPL" : "an NBA"} player now.`;
  }
  return null;
}

export function applyPick(l: League, actor: string, playerId: string, now: string): League {
  const clock = onClock(l) as string;
  const pick: Pick = { n: l.picks.length + 1, m: clock, p: playerId, at: now };
  if (actor !== clock) pick.by = actor;
  const picks = [...l.picks, pick];
  const done = picks.length >= l.order.length * ROUNDS;
  return { ...l, picks, status: done ? "done" : "drafting", ...(done ? { done: now, from: now } : {}) };
}

export function shuffled<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** What any phone may see: no token hashes. */
export function publicView(l: League, me: string | null) {
  return {
    code: l.code,
    name: l.name,
    created: l.created,
    status: l.status,
    comm: l.comm,
    members: l.members.map((m) => ({ id: m.id, name: m.name })),
    order: l.order,
    picks: l.picks,
    clock: onClock(l),
    started: l.started ?? null,
    done: l.done ?? null,
    from: l.from ?? null,
    to: l.to,
    rules: { rounds: ROUNDS, minEach: MIN_EACH, maxMembers: MAX_MEMBERS },
    me,
  };
}
