import { NextRequest } from "next/server";

// ESPN NBA proxy for the owner's private bet tracker (raznova.in/tracker). Trims payloads to what the
// tracker needs (a 450 KB boxscore becomes ~6 KB) and lets Vercel's edge cache absorb repeat polls.
// GET ?fn=scoreboard[&date=YYYYMMDD]   that day's games (ESPN's current day if no date)
// GET ?fn=game&id=EVENT_ID              status, score and every player's line for one game
// GET ?fn=players&date=YYYYMMDD         every rostered player on that day's teams, for name matching
// GET ?fn=league                        season-to-date team offence/defence per game + league ranks (1 = most)
// GET ?fn=gamelog&id=ATHLETE_ID         a player's last 10 regular-season games
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

const TEAM_KEYS = ["pts", "oppPts", "fgPct", "oppFgPct", "reb", "oppReb", "ast", "oppAst", "tpm", "oppTpm", "miss", "oppMiss", "total", "chances"] as const;
type TeamAgg = Record<(typeof TEAM_KEYS)[number], number> & { gp: number; abbr: string; name: string; id: string; rank: Record<string, number> };

function statOf(c: J, name: string) {
  const s = ((c.statistics || []) as J[]).find((x) => x.name === name);
  return s ? Number(s.displayValue) || 0 : 0;
}

async function leagueStats() {
  const now = new Date();
  const startYear = now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  const months: string[] = [];
  for (let d = new Date(Date.UTC(startYear, 9, 1)); d <= now; d.setUTCMonth(d.getUTCMonth() + 1)) {
    months.push(`${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const boards = await Promise.all(months.map((m) => getJSON(`${BASE}/scoreboard?dates=${m}&limit=500`).catch(() => ({ events: [] }))));
  const sums = new Map<string, J>();
  let games = 0;
  for (const b of boards) {
    for (const e of (b.events || []) as J[]) {
      if (!e.status?.type?.completed || (e.season?.type && e.season.type !== 2)) continue;
      const cs: J[] = e.competitions?.[0]?.competitors || [];
      if (cs.length !== 2 || !cs.every((c) => c.statistics?.length)) continue;
      games++;
      for (const [me, op] of [[cs[0], cs[1]], [cs[1], cs[0]]]) {
        const k = me.team.abbreviation as string;
        const t = sums.get(k) || { gp: 0, abbr: k, name: me.team.displayName, id: me.team.id, pts: 0, oppPts: 0, fgm: 0, fga: 0, ofgm: 0, ofga: 0, reb: 0, oppReb: 0, ast: 0, oppAst: 0, tpm: 0, oppTpm: 0 };
        t.gp++;
        t.pts += Number(me.score) || statOf(me, "points");
        t.oppPts += Number(op.score) || statOf(op, "points");
        t.fgm += statOf(me, "fieldGoalsMade"); t.fga += statOf(me, "fieldGoalsAttempted");
        t.ofgm += statOf(op, "fieldGoalsMade"); t.ofga += statOf(op, "fieldGoalsAttempted");
        t.reb += statOf(me, "rebounds"); t.oppReb += statOf(op, "rebounds");
        t.ast += statOf(me, "assists"); t.oppAst += statOf(op, "assists");
        t.tpm += statOf(me, "threePointFieldGoalsMade"); t.oppTpm += statOf(op, "threePointFieldGoalsMade");
        sums.set(k, t);
      }
    }
  }
  const r1 = (x: number) => Math.round(x * 10) / 10;
  const teams: Record<string, TeamAgg> = {};
  for (const t of sums.values()) {
    const g = t.gp || 1;
    const miss = (t.fga - t.fgm) / g, oppMiss = (t.ofga - t.ofgm) / g;
    teams[t.abbr] = {
      gp: t.gp, abbr: t.abbr, name: t.name, id: t.id, rank: {},
      pts: r1(t.pts / g), oppPts: r1(t.oppPts / g),
      fgPct: r1((t.fgm / (t.fga || 1)) * 100), oppFgPct: r1((t.ofgm / (t.ofga || 1)) * 100),
      reb: r1(t.reb / g), oppReb: r1(t.oppReb / g), ast: r1(t.ast / g), oppAst: r1(t.oppAst / g),
      tpm: r1(t.tpm / g), oppTpm: r1(t.oppTpm / g), miss: r1(miss), oppMiss: r1(oppMiss),
      total: r1((t.pts + t.oppPts) / g), chances: r1(miss + oppMiss),
    };
  }
  // rank 1 = highest value (for "opp*" that means the most generous defence)
  const list = Object.values(teams);
  for (const k of TEAM_KEYS) {
    [...list].sort((a, b) => b[k] - a[k]).forEach((t, i) => { t.rank[k] = i + 1; });
  }
  const avg: Record<string, number> = {};
  for (const k of TEAM_KEYS) avg[k] = r1(list.reduce((s, t) => s + t[k], 0) / (list.length || 1));
  return { season: `${startYear}-${String(startYear + 1).slice(2)}`, games, teams, avg, fetchedAt: Date.now() };
}

async function gamelog(id: string) {
  const d = await getJSON(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${id}/gamelog`);
  const names: string[] = d.names || [];
  const ix = (n: string) => names.indexOf(n);
  const I = { MIN: ix("minutes"), PTS: ix("points"), REB: ix("totalRebounds"), AST: ix("assists"), STL: ix("steals"), BLK: ix("blocks"), TO: ix("turnovers"), TPM: ix("threePointFieldGoalsMade-threePointFieldGoalsAttempted") };
  const reg = ((d.seasonTypes || []) as J[]).find((s) => /regular/i.test(s.displayName || "")) || (d.seasonTypes || [])[0];
  const rows: J[] = [];
  for (const cat of (reg?.categories || []) as J[]) {
    for (const ev of (cat.events || []) as J[]) {
      const meta: J = d.events?.[ev.eventId] || {};
      const st: string[] = ev.stats || [];
      const n = (i: number) => (i >= 0 ? num(st[i]) : 0);
      rows.push({
        id: ev.eventId, date: meta.gameDate, opp: meta.opponent?.abbreviation, at: meta.atVs, res: meta.gameResult, score: meta.score,
        MIN: n(I.MIN), PTS: n(I.PTS), REB: n(I.REB), AST: n(I.AST), STL: n(I.STL), BLK: n(I.BLK), TO: n(I.TO), "3PM": n(I.TPM),
      });
    }
  }
  rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return { id, games: rows.slice(0, 10), fetchedAt: Date.now() };
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
    if (fn === "league") return send(await leagueStats(), 21600);
    if (fn === "gamelog") {
      const id = (sp.get("id") || "").replace(/\D/g, "");
      if (!id) return send({ error: "id required" }, 5, 400);
      return send(await gamelog(id), 10800);
    }
    return send({ error: "unknown fn" }, 5, 400);
  } catch (err) {
    return send({ error: String((err as Error)?.message || err) }, 5, 502);
  }
}
