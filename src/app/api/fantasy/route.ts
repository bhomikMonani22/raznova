import { NextRequest, NextResponse } from "next/server";
import {
  applyPick, cleanName, hashToken, League, MAX_MEMBERS, newCode, newId, newToken, onClock, pickError,
  publicView, SEASON_END, shuffled, validCode,
} from "@/lib/fantasy";
import { getStore, Store } from "@/lib/fantasyStore";

// The Raznova fantasy league API (raznova.in/fantasy): a free, points-only NBA + IPL draft league for friends.
// GET ?code=XXXXXX           the league as any member's phone sees it (no token hashes)
// GET ?ping=1                whether a database is connected and answering (no details)
// POST {action, ...}         create | join | start | pick | undo | kick; members send their token in x-fantasy-token
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LEAGUES = 200;
const key = (code: string) => `fantasy:league:${code}`;
const now = () => new Date().toISOString();

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" },
  });
}
const fail = (error: string, status: number) => json({ error }, status);

function memberOf(l: League, req: NextRequest): string | null {
  const t = req.headers.get("x-fantasy-token");
  if (!t || t.length > 100) return null;
  const h = hashToken(t);
  return l.members.find((m) => m.th === h)?.id ?? null;
}

type Outcome = { league: League; extra?: Record<string, unknown> } | { error: string; status: number };

async function mutate(store: Store, code: string, fn: (l: League) => Outcome): Promise<Outcome> {
  for (let i = 0; i < 6; i++) {
    const raw = await store.get(key(code));
    if (!raw) return { error: "No league with that code.", status: 404 };
    const res = fn(JSON.parse(raw) as League);
    if ("error" in res) return res;
    if (await store.cas(key(code), raw, JSON.stringify(res.league))) return res;
  }
  return { error: "Someone else was saving at the same moment. Try again.", status: 409 };
}

export async function GET(req: NextRequest) {
  const store = getStore();
  const sp = req.nextUrl.searchParams;
  if (sp.get("ping")) {
    if (!store) return json({ storage: null, ok: false });
    try {
      await store.get("fantasy:ping");
      return json({ storage: store.kind, ok: true });
    } catch {
      return json({ storage: store.kind, ok: false });
    }
  }
  if (!store) return fail("The league database isn't connected yet.", 503);
  const code = (sp.get("code") || "").toUpperCase();
  if (!validCode(code)) return fail("That league code doesn't look right.", 400);
  try {
    const raw = await store.get(key(code));
    if (!raw) return fail("No league with that code.", 404);
    const l = JSON.parse(raw) as League;
    return json({ league: publicView(l, memberOf(l, req)) });
  } catch {
    return fail("The league database didn't answer. Try again in a moment.", 503);
  }
}

export async function POST(req: NextRequest) {
  const store = getStore();
  if (!store) return fail("The league database isn't connected yet.", 503);
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.action !== "string") return fail("Bad request.", 400);
  const action = body.action;
  try {
    if (action === "create") {
      const leagueName = cleanName(body.league, 40);
      const name = cleanName(body.name, 20);
      if (!leagueName || !name) return fail("Give the league a name and your name.", 400);
      if ((await store.incr("fantasy:created")) > MAX_LEAGUES) return fail("League limit reached.", 429);
      const token = newToken();
      const me = { id: newId(), name, th: hashToken(token), joined: now() };
      for (let i = 0; i < 5; i++) {
        const code = newCode();
        const l: League = {
          v: 1, code, name: leagueName, created: now(), comm: me.id, status: "lobby",
          members: [me], order: [], picks: [], to: SEASON_END,
        };
        if (await store.cas(key(code), null, JSON.stringify(l))) {
          return json({ code, member: me.id, token, league: publicView(l, me.id) });
        }
      }
      return fail("Couldn't find a free league code. Try again.", 409);
    }

    const code = typeof body.code === "string" ? body.code.toUpperCase() : "";
    if (!validCode(code)) return fail("That league code doesn't look right.", 400);

    if (action === "join") {
      const name = cleanName(body.name, 20);
      if (!name) return fail("Type your name.", 400);
      const token = newToken();
      const me = { id: newId(), name, th: hashToken(token), joined: now() };
      const res = await mutate(store, code, (l) => {
        if (l.status !== "lobby") return { error: "The draft has started; ask the commissioner.", status: 409 };
        if (l.members.length >= MAX_MEMBERS) return { error: `The league is full (${MAX_MEMBERS}).`, status: 409 };
        if (l.members.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
          return { error: "Someone in the league already uses that name.", status: 409 };
        }
        return { league: { ...l, members: [...l.members, me] } };
      });
      if ("error" in res) return fail(res.error, res.status);
      return json({ code, member: me.id, token, league: publicView(res.league, me.id) });
    }

    let actor: string | null = null;
    const res = await mutate(store, code, (l) => {
      actor = memberOf(l, req);
      if (!actor) return { error: "This phone isn't a member of the league.", status: 401 };
      const isComm = actor === l.comm;
      if (action === "start") {
        if (!isComm) return { error: "Only the commissioner can start the draft.", status: 403 };
        if (l.status !== "lobby") return { error: "The draft has already started.", status: 409 };
        if (l.members.length < 2) return { error: "Get at least one friend in first.", status: 409 };
        return { league: { ...l, status: "drafting", order: shuffled(l.members.map((m) => m.id)), started: now() } };
      }
      if (action === "pick") {
        const player = typeof body.player === "string" ? body.player : "";
        // the pick number the phone saw: a double tap or a stale screen can't land a second pick
        if (typeof body.n === "number" && body.n !== l.picks.length + 1) {
          return { error: "That pick was already made. The board has been refreshed.", status: 409 };
        }
        const err = pickError(l, actor, player);
        if (err) return { error: err, status: 409 };
        return { league: applyPick(l, actor, player, now()) };
      }
      if (action === "undo") {
        if (!isComm) return { error: "Only the commissioner can undo a pick.", status: 403 };
        if (!l.picks.length) return { error: "No picks to undo.", status: 409 };
        const picks = l.picks.slice(0, -1);
        return { league: { ...l, picks, status: "drafting", done: undefined, from: undefined } };
      }
      if (action === "kick") {
        if (!isComm) return { error: "Only the commissioner can remove members.", status: 403 };
        if (l.status !== "lobby") return { error: "Members can only be removed before the draft.", status: 409 };
        const target = typeof body.member === "string" ? body.member : "";
        if (target === l.comm) return { error: "The commissioner can't be removed.", status: 409 };
        if (!l.members.some((m) => m.id === target)) return { error: "No such member.", status: 404 };
        return { league: { ...l, members: l.members.filter((m) => m.id !== target) } };
      }
      return { error: "Unknown action.", status: 400 };
    });
    if ("error" in res) return fail(res.error, res.status);
    return json({ league: publicView(res.league, actor), clock: onClock(res.league) });
  } catch {
    return fail("The league database didn't answer. Try again in a moment.", 503);
  }
}
