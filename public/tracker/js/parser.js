// Heuristic parser for slips copied from Stake (or typed shorthand).
// Works with text like:
//   "LeBron James - Points  Over 25.5  1.85"
//   "Nikola Jokic\nTotal Rebounds\nOver 11.5\n1.72"
//   "Curry o4.5 3pm @1.9"  ·  "Jalen Brunson 25+ points"
//   "Lakers -4.5 1.91"  ·  "Celtics Moneyline 1.55"  ·  "Lakers v Warriors Total Over 228.5"
import { norm } from './engine.js';

const STAT_RX = [
  [/(pts|points)\s*(\+|&|and|,)\s*(reb|rebounds)\s*(\+|&|and|,)\s*(ast|assists)|\bpra\b|p\+r\+a/i, 'PRA'],
  [/(pts|points)\s*(\+|&|and)\s*(reb|rebounds)|\bp\+r\b|\bpr\b/i, 'PR'],
  [/(pts|points)\s*(\+|&|and)\s*(ast|assists)|\bp\+a\b|\bpa\b/i, 'PA'],
  [/(reb|rebounds)\s*(\+|&|and)\s*(ast|assists)|\br\+a\b|\bra\b/i, 'RA'],
  [/(stl|steals)\s*(\+|&|and)\s*(blk|blocks)|\bs\+b\b|stocks/i, 'SB'],
  [/three|3[\s-]?p(oint|t)?s?|3pm|\b3s\b|threes/i, '3PM'],
  [/double[\s-]?double/i, 'DD'],
  [/triple[\s-]?double/i, 'TD'],
  [/\b(reb|rebs|rebounds)\b/i, 'REB'],
  [/\b(ast|asts|assists)\b/i, 'AST'],
  [/\b(stl|steals)\b/i, 'STL'],
  [/\b(blk|blocks)\b/i, 'BLK'],
  [/\b(to|turnovers)\b/i, 'TO'],
  [/\b(pts|points|pt)\b/i, 'PTS'],
];

const detectStat = (s) => {
  for (const [rx, k] of STAT_RX) if (rx.test(s)) return k;
  return null;
};

const ODDS_LINE = /^@?\s*(\d{1,3}(?:[.,]\d{1,3})?)$/;
const money = (s) => Number(String(s).replace(/[^\d.]/g, ''));

export function parseSlip(text, ctx = {}) {
  const players = ctx.players || [];
  const events = ctx.events || [];
  const raw = String(text || '').replace(/\r/g, '');
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const out = { legs: [], stake: null, odds: null, payout: null, warnings: [] };

  // slip-level numbers
  const flat = lines.join(' \n ');
  const mStake = flat.match(/(?:bet amount|stake|amount|wager|bet)\s*[:\-]?\s*[₹$€£]?\s*([\d,]+(?:\.\d+)?)/i);
  if (mStake) out.stake = money(mStake[1]);
  const mPay = flat.match(/(?:est\.?\s*payout|estimated payout|potential (?:win|payout|return)|payout|to win|returns?)\s*[:\-]?\s*[₹$€£]?\s*([\d,]+(?:\.\d+)?)/i);
  if (mPay) out.payout = money(mPay[1]);
  const mOdds = flat.match(/(?:total odds|odds|multiplier)\s*[:\-]?\s*x?\s*(\d+(?:[.,]\d+)?)/i);
  if (mOdds) out.odds = Number(mOdds[1].replace(',', '.'));

  // name index
  const pIndex = players.map((p) => ({ p, n: norm(p.name), last: norm(p.name).split(' ').pop() }));
  const teamIndex = [];
  for (const e of events) for (const t of [e.home, e.away]) if (t) teamIndex.push({ t, e, keys: [t.name, t.short, t.nick, t.abbr].filter(Boolean).map(norm) });

  const findPlayerIn = (s) => {
    const n = ' ' + norm(s) + ' ';
    let hit = pIndex.find((x) => x.n && n.includes(' ' + x.n + ' '));
    if (hit) return hit.p;
    const lastHits = pIndex.filter((x) => x.last.length > 2 && n.includes(' ' + x.last + ' '));
    if (lastHits.length === 1) return lastHits[0].p;
    return null;
  };
  const findTeamIn = (s) => {
    const n = ' ' + norm(s) + ' ';
    return teamIndex.find((x) => x.keys.some((k) => k.length >= 3 && n.includes(' ' + k + ' '))) || null;
  };

  // anchors: lines with over/under/milestone/spread/moneyline
  const isAnchor = (l) =>
    /\b(over|under)\b\s*\d|\b[ou]\s?\d+(\.\d)?\b|\b\d+\+\s*(?=[a-z])|\d+\+$|\bmoneyline\b|\bml\b|\bto win\b(?!\s*[:\-]?\s*[₹$\d])|\bwinner\b|[+-]\d+(\.5)?\b|\bdouble[\s-]?double\b|\btriple[\s-]?double\b/i.test(l) &&
    !/^(total odds|odds|bet amount|stake|payout|est)/i.test(l) && !/\d{4}-\d{2}-\d{2}/.test(l);

  const anchors = [];
  lines.forEach((l, i) => { if (isAnchor(l)) anchors.push(i); });

  let prev = -1;
  anchors.forEach((ai, k) => {
    const nextA = anchors[k + 1] ?? lines.length;
    const ctxLines = lines.slice(prev + 1, ai + 1);
    const ctxText = ctxLines.join(' ');
    const tail = lines.slice(ai + 1, Math.min(nextA, ai + 3));
    const L = lines[ai];
    const leg = { market: 'prop', side: 'over', line: null, stat: null, player: '', playerId: null, team: '', gameId: null, gameLabel: '', odds: null };

    // odds: inline "@1.85" or trailing number on anchor or next line
    const inl = L.match(/@\s*(\d+(?:[.,]\d+)?)/);
    if (inl) leg.odds = Number(inl[1].replace(',', '.'));
    else {
      for (const t of tail) {
        const m = t.match(ODDS_LINE);
        if (m && Number(m[1].replace(',', '.')) > 1) { leg.odds = Number(m[1].replace(',', '.')); break; }
        if (isAnchor(t)) break;
      }
      if (!leg.odds) {
        const trail = L.match(/(?:^|\s)(\d{1,3}\.\d{1,3})\s*$/);
        const ou = L.match(/(over|under|[ou])\s*(\d+(\.\d)?)/i);
        if (trail && (!ou || trail[1] !== ou[2]) && Number(trail[1]) > 1 && Number(trail[1]) < 100) leg.odds = Number(trail[1]);
      }
    }

    const ou = L.match(/\b(over|under)\b\s*(\d+(?:\.\d)?)/i) || L.match(/\b([ou])\s?(\d+(?:\.\d)?)\b/i);
    const ms = L.match(/\b(\d+)\+/);
    const p = findPlayerIn(ctxText) || findPlayerIn(L);
    const stat = detectStat(L) || detectStat(ctxText);
    const team = findTeamIn(ctxText);

    if (/double[\s-]?double|triple[\s-]?double/i.test(ctxText) && p) {
      leg.stat = /triple/i.test(ctxText) ? 'TD' : 'DD';
      leg.side = /\bno\b/i.test(L) ? 'under' : 'over';
      leg.line = 0.5;
    } else if (p && (ou || ms)) {
      leg.stat = stat || 'PTS';
      if (ou) { leg.side = /^u/i.test(ou[1]) ? 'under' : 'over'; leg.line = Number(ou[2]); }
      else { leg.side = 'over'; leg.line = Number(ms[1]) - 0.5; }
      if (!stat) out.warnings.push(`Stat not detected for ${p.name} — defaulted to Points`);
    } else if (!p && ou && team) {
      leg.market = 'total';
      leg.side = /^u/i.test(ou[1]) ? 'under' : 'over';
      leg.line = Number(ou[2]);
    } else if (!p && team && /moneyline|\bml\b|winner|to win/i.test(ctxText)) {
      leg.market = 'ml';
      leg.team = team.t.name;
    } else if (!p && team && /([+-]\d+(?:\.\d)?)/.test(L)) {
      leg.market = 'spread';
      leg.team = team.t.name;
      leg.line = Number(L.match(/([+-]\d+(?:\.\d)?)/)[1]);
    } else if (ou && !p) {
      // unknown player — keep raw name guess
      const guess = ctxText.replace(/\b(over|under)\b.*$/i, '').replace(/[-–|:]/g, ' ').replace(/\b(points?|rebounds?|assists?|total|player|threes?|made)\b/gi, '').trim();
      leg.player = guess.split(/\s+/).slice(0, 3).join(' ');
      leg.stat = stat || 'PTS';
      leg.side = /^u/i.test(ou[1]) ? 'under' : 'over';
      leg.line = Number(ou[2]);
      out.warnings.push(`Couldn't match "${leg.player}" to a roster — check the name`);
    } else {
      prev = ai;
      return;
    }

    if (p) {
      leg.player = p.name; leg.playerId = p.id; leg.gameId = p.gameId; leg.teamAbbr = p.team;
    }
    const ev = p ? events.find((e) => e.id === p.gameId) : team?.e;
    if (ev) { leg.gameId = ev.id; leg.gameLabel = `${ev.away?.abbr} @ ${ev.home?.abbr}`; leg.startTime = ev.date; }
    out.legs.push(leg);
    prev = ai;
  });

  // derive odds/stake if missing
  const legOdds = out.legs.map((l) => l.odds).filter((x) => x > 1);
  if (!out.odds && legOdds.length === out.legs.length && legOdds.length) out.odds = Math.round(legOdds.reduce((a, b) => a * b, 1) * 100) / 100;
  if (!out.odds && out.stake && out.payout) out.odds = Math.round((out.payout / out.stake) * 100) / 100;
  if (!out.legs.length) out.warnings.push('No legs found. Try one leg per line, e.g. "Jokic over 11.5 rebounds @1.8".');
  return out;
}
