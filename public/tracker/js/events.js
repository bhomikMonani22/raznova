// Live-tracking event engine.
// app.js hands over a list of observations (legs, slips, games) after every evaluation; this module diffs them
// against the last snapshot it saw on this device and emits typed events. Everything that reacts to "something
// happened" (pop-ups, the notification center, system notifications) subscribes here; nothing reaches into app.js.
//
// Contract (keep stable — fx.js / celebrate.js / notify.js depend on it):
//   on(type | '*', fn) -> unsubscribe        subscribe to one event type or to all of them
//   emit(event)                              publish an event (also used for demo / test alerts)
//   getPrefs() / setPrefs(patch)             notification arrangements (localStorage, per device)
//   wants(event, prefs?) -> bool             should this event be surfaced under the current prefs?
//   EVENT_TYPES                              type -> { group, label, tone }

const SNAP_KEY = 'ebl.events.snap.v1';
const PREF_KEY = 'ebl.notif.prefs.v1';
// Until the first live poll after opening the app completes, every change we find happened while you were away
// ("catch-up"): log it, summarise it, don't fire a pop-up per item. app.js calls markLive() after that poll.
let live = false;
export function markLive() { live = true; }

export const EVENT_TYPES = {
  'leg:hit': { group: 'legs', label: 'Leg hit', tone: 'good' },
  'leg:bust': { group: 'legs', label: 'Leg busted', tone: 'bad' },
  'leg:close': { group: 'legs', label: 'Close call', tone: 'warn' },
  'leg:void': { group: 'legs', label: 'Leg voided', tone: 'info' },
  'slip:won': { group: 'slips', label: 'Slip won', tone: 'good' },
  'slip:lost': { group: 'slips', label: 'Slip lost', tone: 'bad' },
  'slip:void': { group: 'slips', label: 'Slip voided', tone: 'info' },
  'slip:cashout': { group: 'slips', label: 'Cashed out', tone: 'info' },
  'slip:oneaway': { group: 'slips', label: 'One leg away', tone: 'warn' },
  'game:start': { group: 'games', label: 'Tip-off', tone: 'info' },
  'game:final': { group: 'games', label: 'Final', tone: 'info' },
};

export const DEFAULT_PREFS = {
  types: {
    'leg:hit': true, 'leg:bust': true, 'leg:close': true, 'leg:void': false,
    'slip:won': true, 'slip:lost': true, 'slip:void': true, 'slip:cashout': true, 'slip:oneaway': true,
    'game:start': true, 'game:final': false,
  },
  accounts: [], // Stake accounts to follow; [] = every account
  lab: true, // include Lab (paper) legs
  popups: true, // in-app pop-ups while the app is open
  sound: false, // short synthesized sound with pop-ups
  haptics: true, // vibration on phones
  push: false, // system notifications (needs browser permission); also keeps live polling on in a background tab
  groupBy: 'time', // notification center arrangement: 'time' | 'slip'
  updatedAt: 0,
};

/* ---------- pub/sub ---------- */
const listeners = new Map();
export function on(type, fn) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(fn);
  return () => listeners.get(type)?.delete(fn);
}
export function emit(ev) {
  const e = { at: Date.now(), catchup: false, lab: false, acct: null, tone: EVENT_TYPES[ev.type]?.tone || 'info', ...ev };
  if (!e.id) e.id = `${e.type}|${e.at}|${Math.random().toString(36).slice(2, 7)}`;
  for (const t of [e.type, '*']) for (const fn of listeners.get(t) || []) { try { fn(e); } catch (err) { console.error('[events]', err); } }
  return e;
}

/* ---------- prefs ---------- */
export function getPrefs() {
  let p = {};
  try { p = JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch {}
  return { ...DEFAULT_PREFS, ...p, types: { ...DEFAULT_PREFS.types, ...(p.types || {}) }, accounts: Array.isArray(p.accounts) ? p.accounts : [] };
}
export function setPrefs(patch) {
  const cur = getPrefs();
  const next = { ...cur, ...patch, types: { ...cur.types, ...(patch.types || {}) }, updatedAt: Date.now() };
  try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch {}
  for (const fn of listeners.get('prefs') || []) { try { fn(next); } catch {} }
  return next;
}
export function wants(ev, prefs = getPrefs()) {
  if (!EVENT_TYPES[ev.type]) return false;
  if (prefs.types[ev.type] === false) return false;
  if (ev.lab && !prefs.lab) return false;
  if (ev.acct && prefs.accounts.length && !prefs.accounts.includes(ev.acct)) return false;
  return true;
}

/* ---------- snapshot diffing ---------- */
let snap = (() => { try { return JSON.parse(localStorage.getItem(SNAP_KEY)); } catch { return null; } })();
let fmt = { money: (v) => String(v) };
export function configure(o) { fmt = { ...fmt, ...o }; }

// How close counts as a sweat: combined-points stats move in bigger steps than boards or dimes.
const BIG = new Set(['PTS', 'PR', 'PA', 'PRA']);
const closeGap = (stat) => (BIG.has(stat) ? 2 : 1);
function inCloseZone(o) {
  if (o.kind !== 'leg' || o.state !== 'live' || o.value == null || o.line == null || o.market !== 'prop') return false;
  const gap = o.side === 'under' ? o.line - o.value : o.line - o.value; // over: still needed; under: cushion left
  return gap > 0 && gap <= closeGap(o.stat);
}
const n1 = (v) => (Math.round(v * 10) / 10).toString();

function slim(o) {
  if (o.kind === 'leg') return { kind: 'leg', state: o.state, value: o.value, close: inCloseZone(o), seen: Date.now() };
  if (o.kind === 'slip') return { kind: 'slip', status: o.status, left: o.legsLeft, dead: o.anyDead, seen: Date.now() };
  return { kind: 'game', state: o.state, seen: Date.now() };
}

function legEvent(type, o, extra = {}) {
  const side = o.side === 'under' ? 'U' : 'O';
  const stat = o.market === 'prop' && o.line != null ? { label: o.statLabel || o.stat, value: o.value, line: o.line, side } : null;
  const prog = o.multi ? ` · ${o.legsHit}/${o.legsTotal} legs in` : '';
  const body = {
    'leg:hit': o.value != null && o.market === 'prop' ? `${o.side === 'under' ? 'Finished' : 'Cleared at'} ${o.value}${prog}` : `Hit${prog}`,
    'leg:bust': o.value != null && o.market === 'prop' ? `${o.side === 'under' ? 'Went over at' : 'Finished at'} ${o.value} · needed ${side === 'O' ? 'over' : 'under'} ${o.line}` : 'Busted',
    'leg:close': o.side === 'under' ? `Cushion ${n1(o.line - o.value)} · at ${o.value}/${o.line}` : `Needs ${n1(Math.ceil(o.line + 0.0001) - o.value)} more · at ${o.value}/${o.line}`,
    'leg:void': 'Did not play · leg voided',
  }[type];
  return {
    type, id: `${type}|${o.key}`, acct: o.acct || null, lab: !!o.lab,
    betId: o.betId || null, legId: o.legId || null, gameId: o.gameId || null, labId: o.labId || null,
    title: o.label, body: o.slipTitle && o.multi ? `${body} — ${o.slipTitle}` : body,
    amount: null, amountText: null,
    player: o.player?.id || o.player?.name ? o.player : null,
    stat, slip: o.slip || null, game: o.game || null, ...extra,
  };
}

function slipEvent(type, o) {
  const money = fmt.money;
  const lab = !!o.lab;
  const paper = lab && !o.stake; // Lab watchlist without a paper stake: talk in legs and odds, not money
  const od = `@${(+o.odds || 0).toFixed(2)}`;
  const k = o.killers?.[0];
  const lostBody = o.legsTotal === 1 && k && k.value != null && k.line != null
    ? `Finished ${k.value} · needed ${k.side === 'under' ? 'under' : 'over'} ${k.line}`
    : o.killer ? `Busted by ${o.killer}` : `${money(o.stake)} ${od}`;
  const t = {
    'slip:won': { title: lab ? `Paper slip would have won · ${o.title}` : `Slip cashed · ${o.title}`, body: paper ? `${o.legsTotal}/${o.legsTotal} legs ${od}` : `${money(o.stake)} ${od} → ${money(o.payout)}`, amount: paper ? null : o.profit, sign: true },
    'slip:lost': { title: lab ? `Paper slip busted · ${o.title}` : `Slip lost · ${o.title}`, body: lostBody, amount: paper ? null : o.profit, sign: true },
    'slip:void': { title: `Slip voided · ${o.title}`, body: paper ? 'Every leg voided' : `${money(o.stake)} refunded`, amount: paper ? null : 0, sign: false },
    'slip:cashout': { title: `Cashed out · ${o.title}`, body: `${money(o.payout)} back on ${money(o.stake)}`, amount: o.profit, sign: true },
    'slip:oneaway': { title: paper ? `One leg from a paper win · ${o.title}` : `One leg from ${money(o.potential)} · ${o.title}`, body: o.lastLeg ? `Waiting on ${o.lastLeg}` : `${o.legsHit}/${o.legsTotal} legs in`, amount: paper ? null : o.potential, sign: false },
  }[type];
  return {
    type, id: `${type}|${o.key}`, acct: o.acct || null, lab, betId: o.betId || null, labId: o.labId || null, legId: null, gameId: null,
    title: t.title, body: t.body, amount: t.amount ?? null, amountText: t.amount != null ? money(t.amount, { sign: t.sign }) : null,
    player: null, stat: null, game: null,
    slip: { title: o.title, stake: o.stake, odds: o.odds, legsHit: o.legsHit, legsTotal: o.legsTotal, potential: o.potential, potentialText: money(o.potential) },
  };
}

function gameEvent(type, o) {
  const sc = o.away && o.home ? `${o.away.abbr} ${o.away.score ?? 0} – ${o.home.score ?? 0} ${o.home.abbr}` : o.label;
  return {
    type, id: `${type}|${o.key}`, acct: null, lab: false, betId: null, legId: null, labId: null, gameId: o.gameId,
    title: type === 'game:start' ? `Tip-off · ${o.label}` : `Final · ${sc}`,
    body: `${o.betCount} slip${o.betCount === 1 ? '' : 's'} riding on it`,
    amount: null, amountText: null, player: null, stat: null, slip: null,
    game: { label: o.label, away: o.away, home: o.home, detail: o.detail },
  };
}

function diff(p, o) {
  const out = [];
  if (o.kind === 'leg') {
    if (p.state !== o.state) {
      if (o.state === 'hit') out.push(legEvent('leg:hit', o));
      else if (o.state === 'dead') out.push(legEvent('leg:bust', o));
      else if (o.state === 'push') out.push(legEvent('leg:void', o));
    }
    if (!p.close && inCloseZone(o)) out.push(legEvent('leg:close', o));
  } else if (o.kind === 'slip') {
    if (p.status === 'open' && o.status !== 'open') {
      const ty = { won: 'slip:won', lost: 'slip:lost', void: 'slip:void', cashout: 'slip:cashout' }[o.status];
      if (ty) out.push(slipEvent(ty, o));
    } else if (o.status === 'open' && o.legsReady && o.legsTotal > 1 && !o.anyDead && o.legsLeft === 1 && (p.left == null || p.left > 1)) {
      out.push(slipEvent('slip:oneaway', o));
    }
  } else if (o.kind === 'game') {
    if (p.state === 'pre' && o.state === 'in') out.push(gameEvent('game:start', o));
    if (p.state !== 'post' && o.state === 'post') out.push(gameEvent('game:final', o));
  }
  return out;
}

// observations: [{ key, kind: 'leg'|'slip'|'game', ready?: false, ... }]
// Returns the events emitted. The very first scan on a device only records a baseline.
export function scan(observations) {
  const first = !snap;
  const prev = snap?.items || {};
  const next = { ...prev };
  const events = [];
  for (const o of observations) {
    if (!o || o.ready === false) continue; // not loaded yet: keep the last known state
    const p = prev[o.key];
    next[o.key] = slim(o);
    if (first || !p) continue; // never seen it: baseline, no event
    events.push(...diff(p, o));
  }
  const cutoff = Date.now() - 4 * 86400000;
  for (const [k, v] of Object.entries(next)) if ((v.seen || 0) < cutoff) delete next[k];
  snap = { v: 1, at: Date.now(), items: next };
  try { localStorage.setItem(SNAP_KEY, JSON.stringify(snap)); } catch {}
  const catchup = !live;
  // a slip that settled in this scan tells the story itself: drop its own leg events from the same scan
  const settled = new Set(events.filter((e) => e.type.startsWith('slip:') && e.type !== 'slip:oneaway').map((e) => e.betId || e.labId));
  return events
    .filter((e) => !(e.type.startsWith('leg:') && settled.has(e.betId || e.labId)))
    .map((e) => emit({ ...e, catchup }));
}

// Test hook: forget the snapshot so the next scan re-baselines.
export function resetSnapshot() { snap = null; try { localStorage.removeItem(SNAP_KEY); } catch {} }
