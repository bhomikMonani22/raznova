// Leg-level pick history and matchup context (pure functions, no DOM).
import { STATS, norm, isSettled } from './engine.js';

export const FAMILY = (stat) =>
  ['PTS', 'PR', 'PA', 'PRA'].includes(stat) ? 'scoring' : ['REB', 'RA'].includes(stat) ? 'boards' : stat === 'AST' ? 'assists' : 'small';

// Opponent of the player's team in "AWY @ HOM"
export function oppOf(l) {
  const [a, h] = String(l.gameLabel || '').split('@').map((s) => s.trim());
  if (!a || !h || !l.teamAbbr) return null;
  return l.teamAbbr === a ? h : l.teamAbbr === h ? a : null;
}

// Signed cushion: positive = beat the line by that much
export function margin(l) {
  if (l.finalValue == null || l.line === '' || l.line == null) return null;
  return l.side === 'under' ? Number(l.line) - l.finalValue : l.finalValue - Number(l.line);
}

// One entry per unique pick: the same leg placed in several slips counts once.
export function gradedLegs(bets) {
  const out = [];
  const seen = new Set();
  for (const b of bets) {
    if (b.deleted || !isSettled(b) || b.status === 'void') continue;
    for (const l of b.legs || []) {
      if (l.market !== 'prop' || !STATS[l.stat] || STATS[l.stat].special) continue;
      if (l.result !== 'won' && l.result !== 'lost') continue;
      const key = [l.playerId || norm(l.player), l.stat, l.side, l.line, l.gameId || l.gameLabel || b.gameDate].join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ...l, bet: b, at: b.settledAt || b.placedAt || 0, opp: oppOf(l), m: margin(l) });
    }
  }
  return out;
}

const avg = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);

export function lineBucket(stat, line) {
  const f = FAMILY(stat);
  const L = Number(line);
  if (f === 'scoring') return L < 10 ? '<10' : L < 20 ? '10–19.5' : L < 30 ? '20–29.5' : L < 40 ? '30–39.5' : '40+';
  if (f === 'boards' || f === 'assists') return L < 5 ? '<5' : L < 8 ? '5–7.5' : L < 11 ? '8–10.5' : '11+';
  return L < 1 ? '0.5' : L < 2 ? '1.5' : L < 3 ? '2.5' : '3.5+';
}
const BUCKET_ORDER = ['<10', '10–19.5', '20–29.5', '30–39.5', '40+', '<5', '5–7.5', '8–10.5', '11+', '0.5', '1.5', '2.5', '3.5+'];

function agg(list) {
  const w = list.filter((l) => l.result === 'won').length;
  const ms = list.map((l) => l.m).filter((x) => x != null);
  return {
    n: list.length, w, hit: list.length ? (w / list.length) * 100 : 0,
    avgLine: r1(avg(list.map((l) => Number(l.line)))), avgFinal: r1(avg(list.map((l) => l.finalValue).filter((x) => x != null))),
    avgMargin: r1(avg(ms)),
    winCushion: r1(avg(list.filter((l) => l.result === 'won' && l.m != null).map((l) => l.m))),
    lossMiss: r1(avg(list.filter((l) => l.result === 'lost' && l.m != null).map((l) => l.m))),
  };
}
const nearMiss = (l) => l.result === 'lost' && l.m != null && l.m >= (FAMILY(l.stat) === 'small' ? -1 : FAMILY(l.stat) === 'scoring' ? -2 : -1.5);

function groupBy(list, key) {
  const m = new Map();
  for (const x of list) { const k = key(x); if (k == null) continue; if (!m.has(k)) m.set(k, []); m.get(k).push(x); }
  return m;
}

export function legHistory(bets) {
  const legs = gradedLegs(bets);
  const combos = [...groupBy(legs, (l) => `${l.player}|${l.stat}|${l.side}`)].map(([k, list]) => {
    list.sort((a, b) => b.at - a.at);
    const [player, stat, side] = k.split('|');
    return { player, stat, side, ...agg(list), last: list[0], playerId: list.find((l) => l.playerId)?.playerId };
  });
  const best = combos.filter((c) => c.n >= 2 && c.hit >= 60).sort((a, b) => b.w - a.w || b.hit - a.hit || (b.avgMargin ?? 0) - (a.avgMargin ?? 0)).slice(0, 10);
  const worst = combos.filter((c) => c.n >= 2 && c.hit <= 40).sort((a, b) => a.hit - b.hit || b.n - a.n).slice(0, 8);
  const byStat = [...groupBy(legs, (l) => l.stat)].map(([stat, list]) => ({ stat, label: STATS[stat].label, ...agg(list), near: list.filter(nearMiss).length }))
    .sort((a, b) => b.n - a.n);
  const bySide = [...groupBy(legs, (l) => `${FAMILY(l.stat)}|${l.side}`)].map(([k, list]) => { const [fam, side] = k.split('|'); return { fam, side, ...agg(list) }; });
  const buckets = [...groupBy(legs, (l) => `${FAMILY(l.stat)}|${lineBucket(l.stat, l.line)}`)].map(([k, list]) => { const [fam, b] = k.split('|'); return { fam, b, ...agg(list) }; })
    .sort((a, b) => BUCKET_ORDER.indexOf(a.b) - BUCKET_ORDER.indexOf(b.b));
  const byOpp = [...groupBy(legs, (l) => l.opp)].map(([opp, list]) => ({ opp, ...agg(list) })).filter((o) => o.n >= 3).sort((a, b) => b.hit - a.hit || b.n - a.n);
  const near = legs.filter(nearMiss).sort((a, b) => b.m - a.m);
  return { legs, combos, best, worst, byStat, bySide, buckets, byOpp, near };
}

/* ---------- Today: matchup context ---------- */

// Which team metric matters for a stat, read from the OPPONENT's season numbers.
// rank 1 = gives up the most (softest) for "allowed" metrics; for chances, rank 1 = most missed shots in their games.
export function metricFor(stat) {
  const f = FAMILY(stat);
  if (f === 'boards') return { key: 'chances', label: 'rebound chances', unit: 'missed FG/g in their games' };
  if (stat === 'AST') return { key: 'oppAst', label: 'assists allowed', unit: 'AST/g' };
  if (stat === '3PM') return { key: 'oppTpm', label: '3s allowed', unit: '3PM/g' };
  return { key: 'oppPts', label: 'points allowed', unit: 'PTS/g' };
}

export function softness(rank, n = 30) {
  if (rank == null) return { tag: 'n/a', cls: '' };
  if (rank <= Math.round(n / 3)) return { tag: 'soft', cls: 'pos' };
  if (rank > n - Math.round(n / 3)) return { tag: 'tough', cls: 'neg' };
  return { tag: 'average', cls: 'amber' };
}

// Compare the opponent from your last pick with tonight's opponent for the stat you usually bet.
export function compareOpp(league, stat, lastOpp, tonightOpp, side = 'over') {
  const m = metricFor(stat);
  const T = league?.teams || {};
  const a = lastOpp && T[lastOpp], b = tonightOpp && T[tonightOpp];
  const n = Object.keys(T).length || 30;
  const cur = b ? { opp: tonightOpp, v: b[m.key], rank: b.rank[m.key], ...softness(b.rank[m.key], n) } : null;
  const prev = a ? { opp: lastOpp, v: a[m.key], rank: a.rank[m.key], ...softness(a.rank[m.key], n) } : null;
  let shift = null;
  if (cur && prev) {
    const d = prev.rank - cur.rank; // positive = tonight's opponent gives up more
    shift = Math.abs(d) <= 4 ? 'similar' : d > 0 ? 'softer' : 'tougher';
    if (side === 'under' && shift !== 'similar') shift = shift === 'softer' ? 'tougher for unders' : 'softer for unders';
  }
  return { metric: m, cur, prev, shift };
}

export function formFromLog(log, stat, line, side = 'over') {
  const parts = STATS[stat]?.parts;
  if (!log?.games?.length || !parts) return null;
  const g = log.games.filter((x) => x.MIN > 0).slice(0, 5);
  if (!g.length) return null;
  const vals = g.map((x) => parts.reduce((s, k) => s + (x[k] || 0), 0));
  const L = Number(line);
  const hits = vals.filter((v) => (side === 'under' ? v < L : v > L)).length;
  return { vals: vals.reverse(), opps: g.map((x) => x.opp).reverse(), avg: r1(avg(vals)), hits, n: vals.length, mins: r1(avg(g.map((x) => x.MIN))) };
}

// Auto-generated matchup angles for a game card
export function gameAngles(league, away, home) {
  const T = league?.teams || {};
  const A = T[away], H = T[home];
  if (!A || !H) return [];
  const n = Object.keys(T).length || 30;
  const out = [];
  const total = (A.total + H.total) / 2;
  if (total >= (league.avg.total || 0) + 4) out.push({ cls: 'pos', t: `High-scoring pairing: their games average ${total.toFixed(1)} total points (league ${league.avg.total}).` });
  else if (total <= (league.avg.total || 0) - 4) out.push({ cls: 'neg', t: `Low-scoring pairing: their games average ${total.toFixed(1)} total points (league ${league.avg.total}).` });
  for (const [def, att] of [[A, H], [H, A]]) {
    if (def.rank.oppPts <= 5) out.push({ cls: 'pos', t: `${def.abbr} give up ${def.oppPts} PTS/g (#${def.rank.oppPts} most) → ${att.abbr} scorers' overs get a boost.` });
    if (def.rank.oppPts > n - 5) out.push({ cls: 'neg', t: `${def.abbr} allow only ${def.oppPts} PTS/g (#${n + 1 - def.rank.oppPts} stingiest) → careful with ${att.abbr} points overs.` });
    if (def.rank.oppAst <= 5) out.push({ cls: 'pos', t: `${def.abbr} allow ${def.oppAst} AST/g (#${def.rank.oppAst} most) → ${att.abbr} playmakers' assist lines.` });
    if (def.rank.oppTpm <= 5) out.push({ cls: 'pos', t: `${def.abbr} allow ${def.oppTpm} threes/g (#${def.rank.oppTpm} most) → ${att.abbr} 3PM overs.` });
  }
  const cold = [A, H].filter((t) => t.rank.fgPct > n - 8);
  if (cold.length) {
    out.push({ cls: 'pos', t: `${cold.map((t) => `${t.abbr} shoot ${t.fgPct}% (#${t.rank.fgPct} of ${n})`).join(', ')} → more misses = more rebounds for ${cold.length === 2 ? 'both sides' : 'the other side\'s bigs'}.` });
  }
  const chances = (A.chances + H.chances) / 2;
  if (chances >= (league.avg.chances || 0) + 3) out.push({ cls: 'pos', t: `Rebound-rich matchup: ${chances.toFixed(1)} missed FG per game in their games (league ${league.avg.chances}).` });
  return out.slice(0, 5);
}

export function nameKey(s) { return norm(s); }
