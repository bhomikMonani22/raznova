// Pure logic: stat definitions, live leg evaluation, settlement, P&L and analytics.

export const STATS = {
  PTS: { label: 'Points', parts: ['PTS'] },
  REB: { label: 'Rebounds', parts: ['REB'] },
  AST: { label: 'Assists', parts: ['AST'] },
  '3PM': { label: 'Threes made', parts: ['3PM'] },
  PRA: { label: 'Pts + Reb + Ast', parts: ['PTS', 'REB', 'AST'] },
  PR: { label: 'Pts + Reb', parts: ['PTS', 'REB'] },
  PA: { label: 'Pts + Ast', parts: ['PTS', 'AST'] },
  RA: { label: 'Reb + Ast', parts: ['REB', 'AST'] },
  STL: { label: 'Steals', parts: ['STL'] },
  BLK: { label: 'Blocks', parts: ['BLK'] },
  SB: { label: 'Steals + Blocks', parts: ['STL', 'BLK'] },
  TO: { label: 'Turnovers', parts: ['TO'] },
  DD: { label: 'Double-double', special: 'dd' },
  TD: { label: 'Triple-double', special: 'td' },
};

export const MARKETS = {
  prop: 'Player prop',
  ml: 'Moneyline',
  spread: 'Spread',
  total: 'Game total',
  other: 'Other (manual)',
};

export const norm = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, '')
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function findPlayer(players, leg) {
  if (!players?.length) return null;
  if (leg.playerId) {
    const p = players.find((x) => String(x.id) === String(leg.playerId));
    if (p) return p;
  }
  const n = norm(leg.player);
  if (!n) return null;
  let p = players.find((x) => norm(x.name) === n);
  if (p) return p;
  const toks = n.split(' ');
  const last = toks[toks.length - 1];
  const cands = players.filter((x) => norm(x.name).split(' ').pop() === last);
  if (cands.length === 1) return cands[0];
  if (cands.length > 1 && toks.length > 1) {
    const fi = toks[0][0];
    const c2 = cands.filter((x) => norm(x.name)[0] === fi);
    if (c2.length === 1) return c2[0];
  }
  return players.find((x) => norm(x.name).includes(n)) || null;
}

export function statValue(p, stat) {
  const d = STATS[stat];
  if (!d || !p) return 0;
  if (d.special) {
    const cats = ['PTS', 'REB', 'AST', 'STL', 'BLK'].filter((k) => (p[k] || 0) >= 10).length;
    return d.special === 'dd' ? (cats >= 2 ? 1 : 0) : cats >= 3 ? 1 : 0;
  }
  return d.parts.reduce((s, k) => s + (p[k] || 0), 0);
}

export function gameElapsed(g) {
  // fraction of regulation elapsed (0..1+); OT counts beyond 1
  const st = g?.status;
  if (!st) return 0;
  if (st.state === 'post') return 1;
  if (st.state !== 'in') return 0;
  const per = st.period || 1;
  let secLeft = st.clockSec;
  if (secLeft == null) {
    const m = String(st.clock || '').split(':');
    secLeft = m.length === 2 ? Number(m[0]) * 60 + Number(m[1]) : Number(m[0]) || 0;
  }
  const perLen = per > 4 ? 300 : 720;
  const before = per <= 4 ? (per - 1) * 720 : 4 * 720 + (per - 5) * 300;
  return Math.max(0.001, (before + (perLen - secLeft)) / 2880);
}

const teamMatch = (t, s) => {
  if (!t || !s) return false;
  const n = norm(s);
  return [t.abbr, t.name, t.short, t.nick].some((x) => x && (norm(x) === n || n.includes(norm(x))));
};

// Evaluate one leg against a slim game object. Returns live view model.
export function evalLeg(leg, g) {
  const out = { state: 'pending', value: null, target: leg.line, pct: 0, pace: null, note: '', player: null };
  if (leg.result && leg.result !== 'pending' && leg.manual) {
    out.state = leg.result === 'won' ? 'hit' : leg.result === 'lost' ? 'dead' : 'push';
    out.note = 'Manually settled';
    return out;
  }
  if (!g) {
    out.note = leg.gameId ? 'Loading game…' : 'No game linked';
    return out;
  }
  const st = g.status.state;
  const final = st === 'post';
  const live = st === 'in';
  if (st === 'pre') {
    out.note = 'Tip-off ' + new Date(g.date).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
    return out;
  }
  const frac = gameElapsed(g);
  const line = Number(leg.line);
  const over = leg.side !== 'under';

  if (leg.market === 'prop') {
    const p = findPlayer(g.players, leg);
    out.player = p;
    if (!p) {
      out.note = final ? 'Player not in boxscore' : 'Player not found yet';
      if (final) out.state = 'push';
      return out;
    }
    if (final && (p.dnp || p.MIN === 0)) {
      out.state = 'push';
      out.note = 'DNP — leg void';
      return out;
    }
    const v = statValue(p, leg.stat);
    out.value = v;
    const special = STATS[leg.stat]?.special;
    if (special) {
      out.target = 1;
      out.pct = v ? 100 : Math.min(95, frac * 100);
      if (over) out.state = v ? 'hit' : final ? 'dead' : 'live';
      else out.state = v ? 'dead' : final ? 'hit' : 'live';
      out.note = v ? 'Achieved' : `${p.PTS}p ${p.REB}r ${p.AST}a`;
      return out;
    }
    out.pct = line > 0 ? Math.min(100, (v / line) * 100) : 0;
    const pace = frac > 0.04 && !final ? v / Math.min(frac, 1) : v;
    out.pace = Math.round(pace * 10) / 10;
    const mins = p.MIN ? `${p.MIN} min` : '';
    if (over) {
      if (v > line) { out.state = 'hit'; out.note = `Cleared · ${mins}`; }
      else if (final) { out.state = v === line ? 'push' : 'dead'; out.note = `Finished ${v} · ${mins}`; }
      else { out.state = 'live'; out.good = pace > line; out.note = `Needs ${fmtN(Math.ceil(line + 0.0001) - v)} more · pace ${out.pace} · ${mins}`; }
    } else {
      if (v > line) { out.state = 'dead'; out.note = `Went over · ${mins}`; }
      else if (final) { out.state = v === line ? 'push' : 'hit'; out.note = `Finished ${v} · ${mins}`; }
      else { out.state = 'live'; out.good = pace < line; out.note = `Cushion ${fmtN(line - v)} · pace ${out.pace} · ${mins}`; }
    }
    return out;
  }

  const home = g.home, away = g.away;
  const hs = home?.score || 0, as = away?.score || 0;
  if (leg.market === 'total') {
    const v = hs + as;
    out.value = v;
    out.pct = line ? Math.min(100, (v / line) * 100) : 0;
    out.pace = final ? v : Math.round((v / Math.min(frac || 1, 1)) * 10) / 10;
    if (over) {
      if (v > line) out.state = 'hit';
      else if (final) out.state = v === line ? 'push' : 'dead';
      else { out.state = 'live'; out.good = out.pace > line; }
    } else {
      if (v > line) out.state = 'dead';
      else if (final) out.state = v === line ? 'push' : 'hit';
      else { out.state = 'live'; out.good = out.pace < line; }
    }
    out.note = `${away?.abbr} ${as} – ${hs} ${home?.abbr} · pace ${out.pace}`;
    return out;
  }
  if (leg.market === 'ml' || leg.market === 'spread') {
    const mine = teamMatch(home, leg.team) ? home : teamMatch(away, leg.team) ? away : null;
    if (!mine) { out.note = 'Pick team not matched'; return out; }
    const opp = mine === home ? away : home;
    const ms = mine.score || 0, os = opp.score || 0;
    const adj = leg.market === 'spread' ? Number(leg.line || 0) : 0;
    const margin = ms + adj - os;
    out.value = ms - os;
    out.pct = Math.max(0, Math.min(100, 50 + margin * 3));
    if (final) out.state = margin > 0 ? 'hit' : margin === 0 ? 'push' : 'dead';
    else { out.state = 'live'; out.good = margin > 0; }
    out.note = `${mine.abbr} ${ms} – ${os} ${opp.abbr}${adj ? ` (${adj > 0 ? '+' : ''}${adj})` : ''}`;
    return out;
  }
  out.note = 'Settle manually';
  return out;
}

const fmtN = (n) => (Math.round(n * 10) / 10).toString();

// Decide whether a bet can be auto-settled from leg evaluations.
export function autoSettle(bet, evals) {
  const res = evals.map((e) => e.state);
  if (res.includes('dead')) return { status: 'lost' };
  if (res.every((s) => s === 'hit' || s === 'push')) {
    if (res.every((s) => s === 'push')) return { status: 'void' };
    const voids = bet.legs.filter((l, i) => res[i] === 'push');
    let odds = Number(bet.odds) || 0;
    let review = false;
    for (const v of voids) {
      if (Number(v.odds) > 1) odds = odds / Number(v.odds);
      else review = true;
    }
    return { status: 'won', odds: Math.round(odds * 1000) / 1000, review };
  }
  return null;
}

// ---------- money ----------
export function betProfit(b) {
  const stake = Number(b.stake) || 0;
  switch (b.status) {
    case 'won': {
      const pay = b.payout != null && b.payout !== '' ? Number(b.payout) : stake * (Number(b.settledOdds || b.odds) || 0);
      return pay - stake;
    }
    case 'lost': return -stake;
    case 'cashout': return (Number(b.cashout) || 0) - stake;
    default: return 0;
  }
}
export const betReturn = (b) => (Number(b.stake) || 0) + betProfit(b);
export const isSettled = (b) => ['won', 'lost', 'void', 'cashout'].includes(b.status);
export const potential = (b) => (Number(b.stake) || 0) * (Number(b.odds) || 0) * (1 + (Number(b.boost) || 0) / 100);
export const settleTime = (b) => b.settledAt || b.placedAt || b.createdAt || 0;

export function periodStart(key) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (key === 'today') return d.getTime();
  if (key === '7d') return d.getTime() - 6 * 864e5;
  if (key === '30d') return d.getTime() - 29 * 864e5;
  if (key === 'season') return new Date(now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1, 9, 1).getTime();
  return 0;
}

export function portfolio(bets, txns, period = 'all') {
  const start = periodStart(period);
  const live = bets.filter((b) => !b.deleted);
  const settled = live.filter((b) => isSettled(b) && settleTime(b) >= start);
  const open = live.filter((b) => b.status === 'open');
  const deposits = txns.filter((t) => !t.deleted && t.kind === 'deposit').reduce((s, t) => s + Number(t.amount || 0), 0);
  const withdrawals = txns.filter((t) => !t.deleted && t.kind === 'withdraw').reduce((s, t) => s + Number(t.amount || 0), 0);
  const allSettled = live.filter(isSettled);
  const realizedAll = allSettled.reduce((s, b) => s + betProfit(b), 0);
  const openStake = open.reduce((s, b) => s + Number(b.stake || 0), 0);
  const bankroll = deposits - withdrawals + realizedAll - openStake;

  const staked = settled.filter((b) => b.status !== 'void').reduce((s, b) => s + Number(b.stake || 0), 0);
  const profit = settled.reduce((s, b) => s + betProfit(b), 0);
  const graded = settled.filter((b) => b.status === 'won' || b.status === 'lost' || b.status === 'cashout');
  const wins = graded.filter((b) => betProfit(b) > 0).length;
  const avgOdds = graded.length ? graded.reduce((s, b) => s + Number(b.odds || 0), 0) / graded.length : 0;
  const impl = graded.length ? graded.reduce((s, b) => s + 1 / (Number(b.odds) || 1), 0) / graded.length : 0;

  // equity curve + drawdown (by settle time)
  const sorted = [...allSettled].sort((a, b) => settleTime(a) - settleTime(b));
  let cum = 0, peak = 0, maxDD = 0;
  const curve = [];
  for (const b of sorted) {
    cum += betProfit(b);
    peak = Math.max(peak, cum);
    maxDD = Math.max(maxDD, peak - cum);
    if (settleTime(b) >= start) curve.push({ t: settleTime(b), v: cum, b });
  }
  const startVal = curve.length ? curve[0].v - betProfit(curve[0].b) : cum;

  // streak
  let streak = 0, streakType = null;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = betProfit(sorted[i]);
    if (p === 0) continue;
    const t = p > 0 ? 'W' : 'L';
    if (!streakType) streakType = t;
    if (t !== streakType) break;
    streak++;
  }
  const best = graded.reduce((m, b) => (betProfit(b) > (m ? betProfit(m) : -Infinity) ? b : m), null);

  return {
    bankroll, deposits, withdrawals, realizedAll, openStake,
    openCount: open.length, openPotential: open.reduce((s, b) => s + potential(b), 0),
    staked, profit, roi: staked ? (profit / staked) * 100 : 0,
    count: settled.length, graded: graded.length, wins, hitRate: graded.length ? (wins / graded.length) * 100 : 0,
    avgOdds, implied: impl * 100, maxDD, streak, streakType, best,
    curve, startVal,
  };
}

export function dailyPnL(bets) {
  const map = new Map();
  for (const b of bets) {
    if (b.deleted || !isSettled(b)) continue;
    const k = dayKey(settleTime(b));
    map.set(k, (map.get(k) || 0) + betProfit(b));
  }
  return map;
}

export const dayKey = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ---------- insights ----------
function group(items, keyFn) {
  const m = new Map();
  for (const it of items) {
    const k = keyFn(it);
    if (k == null) continue;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(it);
  }
  return m;
}

function betAgg(list) {
  const graded = list.filter((b) => b.status !== 'void');
  const staked = graded.reduce((s, b) => s + Number(b.stake || 0), 0);
  const profit = list.reduce((s, b) => s + betProfit(b), 0);
  const wins = graded.filter((b) => betProfit(b) > 0).length;
  const implied = graded.length ? (graded.reduce((s, b) => s + 1 / (Number(b.odds) || 1), 0) / graded.length) * 100 : 0;
  return { n: list.length, staked, profit, roi: staked ? (profit / staked) * 100 : 0, hit: graded.length ? (wins / graded.length) * 100 : 0, implied };
}

export function insights(bets) {
  const settled = bets.filter((b) => !b.deleted && isSettled(b) && b.status !== 'void');
  const legs = [];
  for (const b of settled) for (const l of b.legs || []) if (l.result === 'won' || l.result === 'lost') legs.push({ ...l, bet: b });

  const legAgg = (list) => {
    const w = list.filter((l) => l.result === 'won').length;
    return { n: list.length, w, hit: list.length ? (w / list.length) * 100 : 0 };
  };

  const byLegs = [...group(settled, (b) => {
    const n = (b.legs || []).length || 1;
    return n === 1 ? '1 (single)' : n <= 3 ? '2–3 legs' : n <= 5 ? '4–5 legs' : '6+ legs';
  })].map(([k, v]) => ({ k, ...betAgg(v) }));
  const order = ['1 (single)', '2–3 legs', '4–5 legs', '6+ legs'];
  byLegs.sort((a, b) => order.indexOf(a.k) - order.indexOf(b.k));

  const buckets = [[1, 1.5], [1.5, 2], [2, 3], [3, 5], [5, 10], [10, 1e9]];
  const byOdds = buckets
    .map(([lo, hi]) => {
      const v = settled.filter((b) => Number(b.odds) >= lo && Number(b.odds) < hi);
      return { k: hi > 1e8 ? `${lo}+` : `${lo}–${hi}`, ...betAgg(v) };
    })
    .filter((r) => r.n);

  const byStat = [...group(legs.filter((l) => l.market === 'prop'), (l) => l.stat)]
    .map(([k, v]) => ({ k, label: STATS[k]?.label || k, ...legAgg(v) }))
    .sort((a, b) => b.n - a.n);

  const bySide = [...group(legs.filter((l) => l.market === 'prop' || l.market === 'total'), (l) => (l.side === 'under' ? 'Under' : 'Over'))]
    .map(([k, v]) => ({ k, ...legAgg(v) }));

  const byMarket = [...group(legs, (l) => MARKETS[l.market] || l.market)].map(([k, v]) => ({ k, ...legAgg(v) }));

  const byPlayer = [...group(legs.filter((l) => l.player), (l) => l.player)]
    .map(([k, v]) => ({ k, ...legAgg(v) }))
    .filter((r) => r.n >= 2)
    .sort((a, b) => b.n - a.n || b.hit - a.hit);

  // leg killers + bad beats: lost multis where exactly one leg lost
  const killers = new Map();
  let beats = 0, beatsStake = 0, beatsMissed = 0;
  for (const b of settled.filter((b) => b.status === 'lost' && (b.legs || []).length > 1)) {
    const lost = b.legs.filter((l) => l.result === 'lost');
    if (lost.length === 1) {
      beats++;
      beatsStake += Number(b.stake || 0);
      beatsMissed += potential(b);
      const l = lost[0];
      const k = l.market === 'prop' ? `${l.player} ${l.side === 'under' ? 'U' : 'O'} ${STATS[l.stat]?.label || l.stat}` : `${l.team || 'Game'} ${MARKETS[l.market]}`;
      killers.set(k, (killers.get(k) || 0) + 1);
    }
  }
  const killerList = [...killers].map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n).slice(0, 8);

  const dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byDow = dows.map((k, i) => ({ k, ...betAgg(settled.filter((b) => new Date(b.placedAt || b.createdAt).getDay() === i)) })).filter((r) => r.n);

  const byPerson = [...group(settled, (b) => b.placedBy || '—')].map(([k, v]) => ({ k, ...betAgg(v) }));
  const byType = [...group(settled, (b) => ({ single: 'Single', multi: 'Multi', sgm: 'Same-game multi' }[b.type] || b.type))].map(([k, v]) => ({ k, ...betAgg(v) }));

  const all = betAgg(settled);
  return { all, byLegs, byOdds, byStat, bySide, byMarket, byPlayer, killerList, beats, beatsStake, beatsMissed, byDow, byPerson, byType, legCount: legs.length, legHit: legAgg(legs).hit };
}

// ---------- discipline ----------
export function discipline(bets, settings) {
  const unit = Number(settings.unit) || 0;
  const today = periodStart('today');
  const todays = bets.filter((b) => !b.deleted && (b.placedAt || b.createdAt) >= today);
  const todayLoss = bets
    .filter((b) => !b.deleted && isSettled(b) && settleTime(b) >= today)
    .reduce((s, b) => s + betProfit(b), 0);
  const limit = Number(settings.lossLimit) || 0;
  const flags = [];
  if (limit && -todayLoss >= limit) flags.push({ lvl: 'bad', msg: `Daily loss limit hit (${Math.round(-todayLoss)} of ${limit}). Done for today.` });
  else if (limit && -todayLoss >= limit * 0.7) flags.push({ lvl: 'warn', msg: `${Math.round((-todayLoss / limit) * 100)}% of today's loss limit used.` });
  // tilt: stake up after a loss within 24h
  const recent = bets.filter((b) => !b.deleted).sort((a, b) => (b.placedAt || 0) - (a.placedAt || 0)).slice(0, 6);
  const avgStake = bets.filter((b) => !b.deleted).reduce((s, b, _, arr) => s + Number(b.stake || 0) / arr.length, 0);
  if (recent.length >= 2) {
    const [last, prev] = recent;
    if (prev.status === 'lost' && Number(last.stake) > avgStake * 1.5 && (last.placedAt - (prev.settledAt || prev.placedAt)) < 864e5) {
      flags.push({ lvl: 'warn', msg: 'Tilt check: stake jumped right after a loss.' });
    }
  }
  return { unit, todayCount: todays.length, todayPnL: todayLoss, flags };
}

export function betTitle(b) {
  const n = (b.legs || []).length;
  if (n === 1) return legLabel(b.legs[0]);
  return `${n}-leg ${b.type === 'sgm' ? 'SGM' : 'multi'}`;
}

export function legLabel(l) {
  if (!l) return '—';
  if (l.market === 'prop') {
    const st = STATS[l.stat];
    const sp = st?.special;
    if (sp) return `${l.player} ${l.side === 'under' ? 'No ' : ''}${st.label}`;
    return `${l.player} ${l.side === 'under' ? 'U' : 'O'} ${l.line} ${l.stat}`;
  }
  if (l.market === 'total') return `${l.gameLabel || 'Game'} ${l.side === 'under' ? 'U' : 'O'} ${l.line}`;
  if (l.market === 'spread') return `${l.team} ${Number(l.line) > 0 ? '+' : ''}${l.line}`;
  if (l.market === 'ml') return `${l.team} ML`;
  return l.desc || 'Custom leg';
}
