import { NextRequest } from "next/server";

// ESPN NBA proxy for the owner's private bet tracker (raznova.in/tracker). Trims payloads to what the
// tracker needs (a 450 KB boxscore becomes ~6 KB) and lets Vercel's edge cache absorb repeat polls.
// GET ?fn=scoreboard[&date=YYYYMMDD]   that day's games (ESPN's current day if no date)
// GET ?fn=game&id=EVENT_ID              status, score and every player's line for one game
// GET ?fn=players&date=YYYYMMDD         every rostered player on that day's teams, for name matching
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const UA = { "User-Agent": "Mozilla/5.0 RaznovaTracker/1.0", Accept: "application/json" };

type J = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function getJSON(url: string): Promise<J> {
  const r = await fetch(url, { headers: UA, cache: "no-store" });
  if (!r.ok) throw new Error(`ESPN ${r.status}`);
  return (await r.json()) as J;
}

function team(c: J) {
  return {
    id: c.team?.id,
    abbr: c.team?.abbreviation,
    name: c.team?.displayName,
    short: c.team?.shortDisplayName,
    nick: c.team?.name,
    logo: c.team?.logo || c.team?.logos?.[0]?.href || null,
    score: c.score != null ? Number(c.score) : null,
    record: c.records?.[0]?.summary || c.record?.[0]?.summary || null,
  };
}

function statusOf(s: J | undefined) {
  return {
    state: (s?.type?.state as string) || "pre",
    completed: !!s?.type?.completed,
    detail: (s?.type?.shortDetail || s?.type?.detail || "") as string,
    period: (s?.period as number) || 0,
    clock: (s?.displayClock as string) || "",
    clockSec: typeof s?.clock === "number" ? (s.clock as number) : null,
  };
}

function slimEvent(e: J) {
  const c: J = e.competitions?.[0] || {};
  const comps: J[] = c.competitors || [];
  const home = comps.find((x) => x.homeAway === "home") || comps[0];
  const away = comps.find((x) => x.homeAway === "away") || comps[1];
  return {
    id: e.id as string,
    date: e.date as string,
    name: (e.shortName || e.name) as string,
    status: statusOf(c.status || e.status),
    home: home ? team(home) : null,
    away: away ? team(away) : null,
    broadcast: c.broadcasts?.[0]?.names?.[0] || null,
  };
}

function num(v: unknown) {
  if (v == null || v === "" || v === "--") return 0;
  const n = Number(String(v).split("-")[0]);
  return Number.isFinite(n) ? n : 0;
}

function slimGame(d: J, id: string) {
  const h: J = d.header?.competitions?.[0] || {};
  const comps: J[] = h.competitors || [];
  const home = comps.find((x) => x.homeAway === "home") || comps[0];
  const away = comps.find((x) => x.homeAway === "away") || comps[1];
  const players: J[] = [];
  for (const tb of (d.boxscore?.players || []) as J[]) {
    const s: J | undefined = tb.statistics?.[0];
    if (!s) continue;
    const keys: string[] = s.keys || [];
    const labels: string[] = s.labels || s.names || [];
    const idx = (k: string, l: string) => {
      const i = keys.indexOf(k);
      return i >= 0 ? i : labels.indexOf(l);
    };
    const I = {
      MIN: idx("minutes", "MIN"), PTS: idx("points", "PTS"),
      FG: idx("fieldGoalsMade-fieldGoalsAttempted", "FG"),
      TPM: idx("threePointFieldGoalsMade-threePointFieldGoalsAttempted", "3PT"),
      FT: idx("freeThrowsMade-freeThrowsAttempted", "FT"),
      REB: idx("rebounds", "REB"), AST: idx("assists", "AST"), TO: idx("turnovers", "TO"),
      STL: idx("steals", "STL"), BLK: idx("blocks", "BLK"), PF: idx("fouls", "PF"), PM: idx("plusMinus", "+/-"),
    };
    for (const a of (s.athletes || []) as J[]) {
      const st: string[] = a.stats || [];
      const g = (i: number) => (i >= 0 ? st[i] : null);
      players.push({
        id: a.athlete?.id, name: a.athlete?.displayName, team: tb.team?.abbreviation, teamId: tb.team?.id,
        starter: !!a.starter, dnp: !!a.didNotPlay || st.length === 0,
        MIN: num(g(I.MIN)), PTS: num(g(I.PTS)), REB: num(g(I.REB)), AST: num(g(I.AST)), "3PM": num(g(I.TPM)),
        STL: num(g(I.STL)), BLK: num(g(I.BLK)), TO: num(g(I.TO)), PF: num(g(I.PF)),
        FG: g(I.FG) || "", "3PT": g(I.TPM) || "", FT: g(I.FT) || "", PM: g(I.PM) || "",
      });
    }
  }
  return {
    id, date: h.date as string, status: statusOf(h.status),
    home: home ? team(home) : null, away: away ? team(away) : null, players, fetchedAt: Date.now(),
  };
}

function send(body: unknown, maxAge: number, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=0, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const fn = sp.get("fn") || "scoreboard";
  const date = (sp.get("date") || "").replace(/\D/g, "").slice(0, 8);
  const q = date ? `?dates=${date}` : "";
  try {
    if (fn === "scoreboard") {
      const d = await getJSON(`${BASE}/scoreboard${q}`);
      const events = ((d.events || []) as J[]).map(slimEvent);
      const live = events.some((e) => e.status.state === "in");
      return send({ date: date || null, events, fetchedAt: Date.now() }, live ? 10 : 60);
    }
    if (fn === "game") {
      const id = (sp.get("id") || "").replace(/\D/g, "");
      if (!id) return send({ error: "id required" }, 5, 400);
      const g = slimGame(await getJSON(`${BASE}/summary?event=${id}`), id);
      return send(g, g.status.state === "in" ? 8 : g.status.state === "post" ? 300 : 60);
    }
    if (fn === "players") {
      const d = await getJSON(`${BASE}/scoreboard${q}`);
      const events = ((d.events || []) as J[]).map(slimEvent);
      const teams: { t: J; opp: J | null; gameId: string }[] = [];
      for (const e of events) {
        if (e.home) teams.push({ t: e.home, opp: e.away, gameId: e.id });
        if (e.away) teams.push({ t: e.away, opp: e.home, gameId: e.id });
      }
      const rosters = await Promise.all(
        teams.map(async ({ t, opp, gameId }) => {
          try {
            const r = await getJSON(`${BASE}/teams/${t.id}/roster`);
            return ((r.athletes || []) as J[]).map((a) => ({
              id: a.id, name: a.displayName, pos: a.position?.abbreviation || "",
              team: t.abbr, teamId: t.id, opp: opp?.abbr, gameId,
            }));
          } catch {
            return [];
          }
        })
      );
      return send({ date, events, players: rosters.flat(), fetchedAt: Date.now() }, 3600);
    }
    return send({ error: "unknown fn" }, 5, 400);
  } catch (err) {
    return send({ error: String((err as Error)?.message || err) }, 5, 502);
  }
}
