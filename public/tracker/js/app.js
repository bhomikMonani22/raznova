import {
  STATS, MARKETS, evalLeg, autoSettle, betProfit, betReturn, isSettled, potential, settleTime,
  portfolio, dailyPnL, insights, discipline, betTitle, legLabel, findPlayer, norm,
} from './engine.js';
import { parseSlip } from './parser.js';
import { equityChart, heatmap, ring, hbar } from './charts.js';
import { flexCard } from './flex.js';

/* =========================================================
   State
   ========================================================= */
const KEY = 'ebl.v1';
const LKEY = 'ebl.local.v1';
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

const DEFAULT_SETTINGS = { currency: '₹', unit: 500, lossLimit: 0, people: ['Bhoomik', 'Tanay'], autoSettle: true, handle: '', updatedAt: 0 };

let S = load(KEY, { bets: [], txns: [], settings: { ...DEFAULT_SETTINGS } });
S.settings = { ...DEFAULT_SETTINGS, ...S.settings };
if (JSON.stringify(S.settings.people) === '["Bhoomik","Cousin"]') S.settings.people = ['Bhoomik', 'Tanay'];
let L = load(LKEY, { mode: null, pin: '', notify: false, auto: true, lastSync: 0, period: 'all', slipFilter: 'all', profile: 'all' });

function load(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } }
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }
function saveL() { localStorage.setItem(LKEY, JSON.stringify(L)); }
// Accounts: every slip and cash entry belongs to one Stake account (placedBy / account). 'all' = combined view.
const acct = () => L.profile || 'all';
const inAcct = (name) => acct() === 'all' || (name || S.settings.people?.[0]) === acct();
const bets = () => S.bets.filter((b) => !b.deleted && inAcct(b.placedBy));
const txns = () => S.txns.filter((t) => !t.deleted && inAcct(t.account));
const allBets = () => S.bets.filter((b) => !b.deleted);

function commit(rec) {
  if (rec) rec.updatedAt = Date.now();
  save();
  queuePush();
  render();
}

/* =========================================================
   Formatting
   ========================================================= */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cur = () => S.settings.currency || '₹';
function money(v, { sign = false, dp } = {}) {
  const n = Number(v) || 0;
  const a = Math.abs(n);
  const d = dp ?? (a !== 0 && a < 100000 && Math.abs(a - Math.round(a)) > 0.004 ? 2 : 0);
  const s = a.toLocaleString(cur() === '₹' ? 'en-IN' : 'en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  return `${n < 0 ? '−' : sign && n > 0 ? '+' : ''}${cur()}${s}`;
}
const pct = (v, dp = 1) => `${(Number(v) || 0).toFixed(dp)}%`;
const spct = (v, dp = 1) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(Number(v) || 0).toFixed(dp)}%`;
const cls = (v) => (v > 0 ? 'pos' : v < 0 ? 'neg' : '');
const odds = (o) => (Number(o) ? Number(o).toFixed(2) : '—');
const when = (t) => new Date(t).toLocaleString([], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const dateOnly = (t) => new Date(t).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
const etYMD = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const addDays = (ymd, n) => { const d = new Date(ymd + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const ago = (t) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : `${Math.round(s / 3600)}h ago`; };

/* =========================================================
   Icons
   ========================================================= */
const I = {
  portfolio: '<svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>',
  live: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5"/></svg>',
  slips: '<svg viewBox="0 0 24 24"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>',
  insights: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/><path d="M9 21h6"/></svg>',
  tools: '<svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h4"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
};
const ROUTES = { portfolio: 'Portfolio', live: 'Live', slips: 'Slips', insights: 'Insights', tools: 'Tools', settings: 'Settings' };

/* =========================================================
   Navigation
   ========================================================= */
let route = (location.hash.replace('#/', '') || 'portfolio').split('?')[0];
if (!ROUTES[route]) route = 'portfolio';

function navHTML() {
  const live = liveBadge();
  const side = ['portfolio', 'live', 'slips', 'insights', 'tools', 'settings']
    .map((r) => `<button class="side-link ${route === r ? 'active' : ''}" data-go="${r}">${I[r]}<span>${ROUTES[r]}</span>${r === 'live' && live ? `<span class="badge">${live}</span>` : ''}</button>`)
    .join('');
  const tabs = ['portfolio', 'live', 'add', 'slips', 'insights']
    .map((r) =>
      r === 'add'
        ? `<button class="tab fab" data-act="add" aria-label="New slip"><span class="plus">${I.plus}</span></button>`
        : `<button class="tab ${route === r ? 'active' : ''}" data-go="${r}">${I[r]}<span>${ROUTES[r]}</span>${r === 'live' && live ? `<span class="badge">${live}</span>` : ''}</button>`
    )
    .join('');
  document.getElementById('nav-side').innerHTML = side;
  document.getElementById('nav-tab').innerHTML = tabs;
  document.getElementById('top-title').textContent = ROUTES[route];
}

function go(r) {
  if (!ROUTES[r]) return;
  route = r;
  history.replaceState(null, '', '#/' + r);
  render();
  window.scrollTo({ top: 0 });
  if (r === 'live') pollLive(true);
}
window.addEventListener('hashchange', () => { const r = location.hash.replace('#/', ''); if (ROUTES[r] && r !== route) go(r); });

/* =========================================================
   Toast / sheet
   ========================================================= */
function toast(msg, kind = '', ms = 3200) {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.innerHTML = msg;
  document.getElementById('toast-root').appendChild(el);
  setTimeout(() => el.remove(), ms);
}

let sheetState = null;
function openSheet(kind, data = {}) { sheetState = { kind, ...data }; renderSheet(); document.body.style.overflow = 'hidden'; }
function closeSheet() { sheetState = null; document.getElementById('sheet-root').innerHTML = ''; document.body.style.overflow = ''; }

/* =========================================================
   API
   ========================================================= */
async function api(path, opts) {
  const r = await fetch(path, opts);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || r.statusText); e.status = r.status; throw e; }
  return j;
}

const playersCache = {};
async function playersFor(ymd) {
  if (playersCache[ymd]) return playersCache[ymd];
  const p = api(`/api/tracker/nba?fn=players&date=${ymd.replace(/-/g, '')}`).catch((e) => { delete playersCache[ymd]; throw e; });
  playersCache[ymd] = p;
  return p;
}

/* =========================================================
   Sync
   ========================================================= */
let syncState = 'local';
let pushTimer = null;
function setSync(s, title = '') {
  syncState = s;
  const d = document.getElementById('sync-dot');
  if (d) { d.className = 'sync-dot ' + s; d.title = title || s; }
  const sd = document.getElementById('sync-side');
  if (sd) sd.innerHTML = `<span class="sync-dot ${s}"></span>${L.mode === 'cloud' ? (s === 'ok' ? 'Synced ' + (L.lastSync ? ago(L.lastSync) : '') : s === 'busy' ? 'Syncing…' : s === 'err' ? 'Sync pending · saved locally' : 'Cloud') : 'This device only'}`;
}
function queuePush() {
  if (L.mode !== 'cloud') return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => syncNow('push'), 1200);
}
const toMap = (arr) => Object.fromEntries(arr.map((r) => [r.id, r]));
function mergeArr(local, remote) {
  const m = toMap(local);
  let localNewer = false;
  const rm = remote || {};
  for (const [id, r] of Object.entries(rm)) {
    const l = m[id];
    if (!l || (r.updatedAt || 0) > (l.updatedAt || 0)) m[id] = r;
  }
  for (const l of local) { const r = rm[l.id]; if (!r || (l.updatedAt || 0) > (r.updatedAt || 0)) localNewer = true; }
  return { list: Object.values(m), localNewer };
}
async function syncNow(action = 'push') {
  if (L.mode !== 'cloud' || !L.pin) return;
  if (!navigator.onLine) { setSync('err', 'Offline — will sync later'); return; }
  setSync('busy');
  try {
    const body = { pin: L.pin, action };
    if (action === 'push') body.data = { bets: toMap(S.bets), txns: toMap(S.txns), settings: S.settings };
    const j = await api('/api/tracker/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const st = j.state || {};
    const a = mergeArr(S.bets, st.bets);
    const b = mergeArr(S.txns, st.txns);
    S.bets = a.list;
    S.txns = b.list;
    if ((st.settings?.updatedAt || 0) > (S.settings.updatedAt || 0)) S.settings = { ...DEFAULT_SETTINGS, ...st.settings };
    save();
    L.lastSync = Date.now(); saveL();
    setSync('ok');
    if (j.claimed) toast('🔐 Cloud vault created. Share this PIN with your cousin to sync.', 'good', 6000);
    if (action === 'pull' && (a.localNewer || b.localNewer || (S.settings.updatedAt || 0) > (st.settings?.updatedAt || 0))) queuePush();
    return true;
  } catch (e) {
    if (e.status === 401) { setSync('err', 'Wrong PIN'); toast('Wrong PIN — sync paused', 'bad'); L.pin = ''; L.mode = null; saveL(); render(); return false; }
    setSync('err', e.status === 503 ? 'Cloud storage offline — saved on this device' : e.message);
    return false;
  } finally { if (action === 'pull') render(); }
}

/* =========================================================
   Live engine
   ========================================================= */
const games = {}; // id -> slim game
let board = null; // scoreboard
let lastLive = 0;
let liveTimer = null;
const legPrev = {};

const openBets = () => allBets().filter((b) => b.status === 'open');
function liveBadge() {
  let n = 0;
  for (const b of openBets()) if (b.legs.some((l) => games[l.gameId]?.status.state === 'in')) n++;
  return n;
}

async function pollLive(force = false) {
  clearTimeout(liveTimer);
  // auto-link legs missing a game (rosters are edge-cached, so this is cheap after the first call)
  const hasOrphans = openBets().some((b) => b.legs.some((l) => !l.gameId));
  if (hasOrphans) await Promise.race([linkOrphans(), new Promise((r) => setTimeout(r, 4000))]);
  const ids = new Set();
  for (const b of openBets()) for (const l of b.legs) if (l.gameId) ids.add(l.gameId);
  const need = [...ids].filter((id) => force || !games[id] || games[id].status.state !== 'post');
  const tasks = need.map((id) =>
    api(`/api/tracker/nba?fn=game&id=${id}`).then((g) => { games[id] = g; }).catch(() => {})
  );
  if (route === 'live' || !board || Date.now() - (board.fetchedAt || 0) > 60000) {
    tasks.push(api('/api/tracker/nba?fn=scoreboard').then((sb) => { board = sb; }).catch(() => {}));
  }
  await Promise.all(tasks);
  lastLive = Date.now();
  const changed = evaluateAll();
  if (changed || route === 'live' || route === 'portfolio') softRender();
  const anyLive = [...ids].some((id) => games[id]?.status.state === 'in') || board?.events?.some((e) => e.status.state === 'in');
  const soon = [...ids].some((id) => games[id]?.status.state === 'pre' && new Date(games[id].date) - Date.now() < 15 * 60000);
  const delay = anyLive || soon ? 20000 : 120000;
  if (L.auto) liveTimer = setTimeout(() => { if (document.visibilityState === 'visible') pollLive(); else liveTimer = setTimeout(pollLive, 5000); }, delay);
}

async function linkOrphans() {
  for (const b of openBets()) {
    const orphans = b.legs.filter((l) => !l.gameId && (l.player || l.team));
    if (!orphans.length || !b.gameDate) continue;
    try {
      const d = await playersFor(b.gameDate);
      let touched = false;
      for (const l of orphans) {
        if (l.market === 'prop') {
          const p = findPlayer(d.players, l);
          if (p) { l.gameId = p.gameId; l.playerId = p.id; l.teamAbbr = p.team; touched = true; }
        } else {
          const n = norm(l.team);
          const ev = d.events.find((e) => [e.home, e.away].some((t) => t && [t.name, t.short, t.abbr].some((x) => norm(x) === n)));
          if (ev) { l.gameId = ev.id; l.gameLabel = `${ev.away.abbr} @ ${ev.home.abbr}`; touched = true; }
        }
        if (l.gameId) { const ev = d.events.find((e) => e.id === l.gameId); if (ev) { l.gameLabel = `${ev.away.abbr} @ ${ev.home.abbr}`; l.startTime = ev.date; } }
      }
      if (touched) { b.updatedAt = Date.now(); save(); queuePush(); }
    } catch {}
  }
}

function evaluateAll() {
  let changed = false;
  for (const b of openBets()) {
    const evs = b.legs.map((l) => evalLeg(l, games[l.gameId]));
    evs.forEach((e, i) => {
      const l = b.legs[i];
      const k = b.id + ':' + l.id;
      const prev = legPrev[k];
      if (prev && prev !== e.state && (e.state === 'hit' || e.state === 'dead')) {
        notify(e.state === 'hit' ? `✅ ${legLabel(l)} — HIT` : `❌ ${legLabel(l)} — busted`, e.note);
      }
      legPrev[k] = e.state;
      if (!l.manual) {
        const r = e.state === 'hit' ? 'won' : e.state === 'dead' ? 'lost' : e.state === 'push' && games[l.gameId]?.status.state === 'post' ? 'void' : 'pending';
        if (l.result !== r) { l.result = r; if (e.value != null) l.finalValue = e.value; changed = true; b.updatedAt = Date.now(); }
      }
    });
    if (S.settings.autoSettle !== false) {
      const res = autoSettle(b, evs);
      if (res) {
        b.status = res.status;
        b.settledAt = Date.now();
        b.autoSettled = true;
        if (res.odds && res.odds !== Number(b.odds)) b.settledOdds = res.odds;
        if (res.review) b.review = true;
        b.updatedAt = Date.now();
        changed = true;
        const p = betProfit(b);
        notify(res.status === 'won' ? `💰 Slip cashed: ${money(p, { sign: true })}` : res.status === 'lost' ? `Slip lost: ${money(p)}` : 'Slip voided', betTitle(b));
      }
    }
  }
  if (changed) { save(); queuePush(); }
  return changed;
}

function notify(title, body = '') {
  toast(`<div><b>${esc(title)}</b>${body ? `<div class="mute" style="font-size:12px">${esc(body)}</div>` : ''}</div>`, title.includes('❌') || title.includes('lost') ? 'bad' : 'good', 5000);
  if (navigator.vibrate && navigator.userActivation?.hasBeenActive) navigator.vibrate(title.includes('❌') ? [80, 60, 80] : [40]);
  if (L.notify && 'Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
    navigator.serviceWorker?.ready.then((r) => r.showNotification(title, { body, icon: '/tracker/icons/icon-192.png', badge: '/tracker/icons/icon-192.png', tag: title })).catch(() => {});
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { pollLive(); if (L.mode === 'cloud') syncNow('pull'); }
});
setInterval(() => { if (document.visibilityState === 'visible' && L.mode === 'cloud') syncNow('pull'); }, 60000);
window.addEventListener('online', () => { if (L.mode === 'cloud') syncNow('push'); });

/* =========================================================
   Render
   ========================================================= */
const view = () => document.getElementById('view');

function render() {
  navHTML();
  setSync(L.mode === 'cloud' ? (syncState === 'local' ? 'ok' : syncState) : 'local');
  if (!L.mode) { view().innerHTML = lockView(); return; }
  const fn = { portfolio: vPortfolio, live: vLive, slips: vSlips, insights: vInsights, tools: vTools, settings: vSettings }[route];
  view().innerHTML = (['portfolio', 'live', 'slips', 'insights'].includes(route) ? profileBar() : '') + fn();
  after[route]?.();
  if (sheetState?.kind === 'detail') renderSheet();
}
function softRender() {
  const a = document.activeElement;
  if (a && view().contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) { navHTML(); return; }
  render();
}
const after = {};

/* ---------- account switcher ---------- */
function profileBar() {
  const opts = ['all', ...(S.settings.people || [])];
  const count = (p) => S.bets.filter((b) => !b.deleted && (p === 'all' || (b.placedBy || S.settings.people?.[0]) === p)).length;
  return `<div class="row between wrap" style="margin-bottom:14px"><div class="seg" role="tablist" aria-label="Account">${opts
    .map((p) => `<button data-profile="${esc(p)}" class="${acct() === p ? 'on' : ''}">${p === 'all' ? 'Combined' : esc(p) + ' acc'} <span class="dim">${count(p)}</span></button>`)
    .join('')}</div></div>`;
}

/* ---------- lock / onboarding ---------- */
function lockView() {
  return `<div class="lock"><div class="card stack">
    <div class="brand"><img src="/tracker/icons/icon-192.png" width="44" height="44" alt=""><div><b style="font-size:20px">EasyBuckets Ledger</b><small>NBA bet portfolio</small></div></div>
    <p class="mute" style="margin:0">Track every Stake slip, sweat legs live, see your real P&L.</p>
    <label class="f">Cloud PIN (4–8 digits) — same PIN on every device syncs your ledger
      <input class="in pin-in" id="pin" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off" placeholder="••••">
    </label>
    <button class="btn primary wide" data-act="unlock">Unlock & sync</button>
    <button class="btn ghost wide" data-act="localmode">Use on this device only</button>
    <p class="dim" style="font-size:12px;margin:0">First PIN ever entered creates the vault. Keep it private.</p>
  </div></div>`;
}

/* ---------- discipline banner ---------- */
function alertsHTML() {
  const d = discipline(bets(), S.settings);
  return d.flags.map((f) => `<div class="alert ${f.lvl}">⚠️ <span>${esc(f.msg)}</span></div>`).join('');
}

/* ---------- portfolio ---------- */
function vPortfolio() {
  const P = portfolio(bets(), txns(), L.period);
  const periods = [['today', 'Today'], ['7d', '7D'], ['30d', '30D'], ['season', 'Season'], ['all', 'All']];
  const noCash = !txns().length;
  const edge = P.hitRate - P.implied;
  const recent = bets().filter(isSettled).sort((a, b) => settleTime(b) - settleTime(a)).slice(0, 5);
  return `
  <div class="stack">
    ${alertsHTML()}
    ${installBanner()}
    <div class="hero">
      <div class="row between hero-top"><span class="lbl">Bankroll</span><div class="chips">${periods.map(([k, t]) => `<button class="chip ${L.period === k ? 'on' : ''}" data-period="${k}">${t}</button>`).join('')}</div></div>
      <div class="big">${money(P.bankroll)}</div>
      <div class="chg ${cls(P.profit)}">${money(P.profit, { sign: true })} <span style="opacity:.8">(${spct(P.roi)} ROI)</span> <span class="mute" style="font-weight:500">· ${periods.find((p) => p[0] === L.period)[1]}</span></div>
      <div class="meta">
        <div>In play<b>${money(P.openStake)} · ${P.openCount}</b></div>
        <div>Max return<b>${money(P.openPotential)}</b></div>
        <div>Hit rate<b>${pct(P.hitRate, 0)}</b></div>
        <div>Avg odds<b>${odds(P.avgOdds)}</b></div>
      </div>
      ${noCash ? `<div class="alert info" style="margin-top:14px">Add your starting Stake balance so bankroll is real. <button class="btn sm" data-act="txn" data-kind="deposit" style="margin-left:auto">+ Deposit</button></div>` : ''}
    </div>

    <div class="grid g4">
      ${kpi('Net P&L', money(P.profit, { sign: true }), `${P.count} settled`, cls(P.profit))}
      ${kpi('ROI / yield', spct(P.roi), `${money(P.staked)} staked`, cls(P.roi))}
      ${kpi('Edge vs odds', spct(edge), `hit ${pct(P.hitRate, 0)} vs implied ${pct(P.implied, 0)}`, cls(edge))}
      ${kpi('Max drawdown', money(-P.maxDD), 'peak to trough', P.maxDD ? 'neg' : '')}
      ${kpi('Streak', P.streak ? `${P.streak}${P.streakType}` : '—', P.streakType === 'W' ? 'heater 🔥' : P.streakType === 'L' ? 'cold — size down' : '', P.streakType === 'W' ? 'pos' : P.streakType === 'L' ? 'neg' : '')}
      ${kpi('Best hit', P.best ? money(betProfit(P.best), { sign: true }) : '—', P.best ? `@${odds(P.best.odds)} · ${esc(betTitle(P.best))}` : '', 'pos')}
      ${kpi('Deposited', money(P.deposits - P.withdrawals), `${money(P.withdrawals)} withdrawn`)}
      ${kpi('Lifetime P&L', money(P.realizedAll, { sign: true }), 'all settled slips', cls(P.realizedAll))}
    </div>

    <div class="cols">
      <div class="card"><h3>Equity curve <span class="r">cumulative profit</span></h3><div id="eq"></div></div>
      <div class="card"><h3>Daily P&L <span class="r">last 18 weeks</span></h3><div id="heat"></div>
        <div class="divider"></div>
        <h3 style="margin-bottom:8px">Cash <span class="r"><button class="btn sm" data-act="txn" data-kind="deposit">+ Deposit</button> <button class="btn sm" data-act="txn" data-kind="withdraw">− Withdraw</button></span></h3>
        ${txns().sort((a, b) => b.at - a.at).slice(0, 4).map((t) => `<div class="row between" style="padding:6px 0;font-size:13px"><span class="mute">${dateOnly(t.at)} · ${acct() === 'all' && t.account ? esc(t.account) + ' · ' : ''}${t.kind === 'deposit' ? 'Deposit' : 'Withdrawal'}${t.note ? ' · ' + esc(t.note) : ''}</span><span class="row"><b class="num ${t.kind === 'deposit' ? 'pos' : 'neg'}">${t.kind === 'deposit' ? '+' : '−'}${money(t.amount)}</b><button class="btn ghost sm" data-act="deltxn" data-id="${t.id}" aria-label="Delete">✕</button></span></div>`).join('') || '<div class="dim" style="font-size:12.5px">No deposits logged.</div>'}
      </div>
    </div>

    <div class="card"><h3>Recently settled <span class="r"><button class="btn sm ghost" data-go="slips">All slips →</button></span></h3>
      <div class="stack">${recent.map((b) => slipCard(b, { compact: true })).join('') || '<div class="empty"><b>No results yet</b>Add a slip with the + button.</div>'}</div>
    </div>
  </div>`;
}
after.portfolio = () => {
  const P = portfolio(bets(), txns(), L.period);
  const eq = document.getElementById('eq');
  if (eq) equityChart(eq, P.curve, { fmt: (v) => money(v), startVal: P.startVal, height: innerWidth < 700 ? 170 : 220 });
  const h = document.getElementById('heat');
  if (h) heatmap(h, dailyPnL(bets()), { fmt: (v) => money(v, { sign: true }), weeks: innerWidth < 500 ? 16 : 18 });
};
const kpi = (l, v, f = '', c = '') => `<div class="card tight kpi"><div class="lbl">${l}</div><div class="val ${c}">${v}</div><div class="foot">${f}</div></div>`;

/* ---------- slip card ---------- */
function legsEval(b) { return b.legs.map((l) => (b.status === 'open' ? evalLeg(l, games[l.gameId]) : settledEval(l))); }
function settledEval(l) {
  const s = l.result === 'won' ? 'hit' : l.result === 'lost' ? 'dead' : l.result === 'void' ? 'push' : 'pending';
  return { state: s, value: l.finalValue ?? null, pct: s === 'hit' ? 100 : l.finalValue != null && l.line ? Math.min(100, (l.finalValue / l.line) * 100) : 0, note: l.finalValue != null ? `Final ${l.finalValue}` : '' };
}

function slipCard(b, { compact = false, open = false } = {}) {
  const ev = legsEval(b);
  const hit = ev.filter((e) => e.state === 'hit').length;
  const liveN = ev.filter((e) => e.state === 'live').length;
  const dead = ev.filter((e) => e.state === 'dead').length;
  const isLive = b.status === 'open' && liveN > 0;
  const stTxt = b.status === 'open' ? (isLive ? 'Live' : dead ? 'Busting' : 'Open') : { won: 'Won', lost: 'Lost', void: 'Void', cashout: 'Cashed out' }[b.status];
  const stCls = b.status === 'open' ? (isLive ? 'live' : 'open') : b.status;
  const p = betProfit(b);
  const amt = isSettled(b)
    ? `<span class="num ${cls(p)}">${money(p, { sign: true })}</span><small>${money(b.stake)} @ ${odds(b.odds)}</small>`
    : `<span class="num">${money(potential(b))}</span><small>${money(b.stake)} @ ${odds(b.odds)}</small>`;
  const showLegs = open || (!compact && (b.status === 'open' || b.legs.length <= 4));
  return `<div class="slip ${isLive ? 'live' : ''} st-${b.status}">
    <div class="slip-head" data-act="detail" data-id="${b.id}">
      ${b.legs.length > 1 ? ring(hit, b.legs.length, liveN) : ''}
      <div class="grow">
        <div class="row" style="gap:8px"><span class="pill ${stCls}"><span class="dot"></span>${stTxt}</span>${b.review ? '<span class="pill cashout">check payout</span>' : ''}<span class="meta">${b.placedBy ? esc(b.placedBy) + ' · ' : ''}${dateOnly(b.placedAt)}</span></div>
        <div class="ttl" style="margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(betTitle(b))}</div>
      </div>
      <div class="slip-amt">${amt}</div>
    </div>
    ${showLegs ? `<div class="legs">${b.legs.map((l, i) => legRow(l, ev[i], b)).join('')}</div>` : ''}
  </div>`;
}

function legRow(l, e, b) {
  const st = e.state;
  const ic = st === 'hit' ? '✓' : st === 'dead' ? '✕' : st === 'push' ? '–' : st === 'live' ? '●' : '';
  const g = games[l.gameId];
  const gl = g ? `${g.away?.abbr} ${g.away?.score ?? ''}${g.status.state !== 'pre' ? '–' : ' @ '}${g.home?.score ?? ''} ${g.home?.abbr}`.replace(/\s+/g, ' ') : l.gameLabel || '';
  const clock = g?.status.state === 'in' ? ` · Q${g.status.period > 4 ? 'OT' : g.status.period} ${g.status.clock}` : g?.status.state === 'post' ? ' · Final' : '';
  const isProp = l.market === 'prop' && !STATS[l.stat]?.special;
  const barCls = st === 'hit' ? 'hit' : st === 'dead' ? 'dead' : st === 'live' ? (e.good ? 'good' : 'bad') : '';
  const under = l.side === 'under';
  return `<div class="leg">
    <span class="ic ${st}">${ic}</span>
    <div style="min-width:0">
      <div class="nm">${esc(legLabel(l))}</div>
      <div class="ds">${esc(gl)}${clock}${e.note ? ' · ' + esc(e.note) : ''}</div>
      ${(isProp || l.market === 'total') && e.value != null ? `<div class="bar"><i class="${barCls}" style="width:${e.pct}%"></i>${under ? '' : ''}</div>` : ''}
    </div>
    <div class="rt">${e.value != null && (isProp || l.market === 'total') ? `<span class="num">${e.value}</span><span class="mute">/${l.line}</span>` : ''}${l.odds ? `<div class="dim num">@${odds(l.odds)}</div>` : ''}</div>
  </div>`;
}

/* ---------- live ---------- */
function vLive() {
  const ob = openBets();
  const evs = ob.map((b) => ({ b, ev: legsEval(b) }));
  const sortKey = ({ ev }) => (ev.some((e) => e.state === 'live') ? 0 : ev.some((e) => e.state === 'pending') ? 1 : 2);
  evs.sort((a, b) => sortKey(a) - sortKey(b));
  const legsAll = evs.flatMap((x) => x.ev);
  const exp = ob.reduce((s, b) => s + Number(b.stake || 0), 0);
  const mx = ob.reduce((s, b) => s + potential(b), 0);
  const alive = evs.filter(({ ev }) => !ev.some((e) => e.state === 'dead'));
  const myGames = new Set(ob.flatMap((b) => b.legs.map((l) => l.gameId)));
  const tk = (board?.events || []).map((e) => {
    const lead = (e.home.score || 0) > (e.away.score || 0) ? 'h' : (e.away.score || 0) > (e.home.score || 0) ? 'a' : '';
    const st = e.status.state === 'pre' ? new Date(e.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : e.status.detail;
    return `<div class="tk ${e.status.state} ${myGames.has(e.id) ? 'mine' : ''}">
      <div class="tr ${lead === 'a' ? 'lead' : ''}"><span>${esc(e.away.abbr)}</span><b>${e.status.state === 'pre' ? '' : e.away.score ?? ''}</b></div>
      <div class="tr ${lead === 'h' ? 'lead' : ''}"><span>${esc(e.home.abbr)}</span><b>${e.status.state === 'pre' ? '' : e.home.score ?? ''}</b></div>
      <div class="st"><span>${esc(st)}</span>${myGames.has(e.id) ? '<span style="color:var(--accent)">●</span>' : ''}</div></div>`;
  }).join('');
  return `<div class="stack">
    <div class="row between wrap">
      <div><h1 class="h1">Sweat board</h1><p class="sub" style="margin:0">Live ESPN data · updates every 20s while games are on</p></div>
      <div class="row"><span class="dim" style="font-size:12px">${lastLive ? 'Updated ' + ago(lastLive) : ''}</span><button class="btn sm" data-act="refresh">↻ Refresh</button>
      ${'Notification' in window && !L.notify ? '<button class="btn sm" data-act="notify">🔔 Alerts</button>' : ''}</div>
    </div>
    ${tk ? `<div class="ticker">${tk}</div>` : '<div class="ticker"><div class="tk skeleton" style="height:66px"></div><div class="tk skeleton" style="height:66px"></div><div class="tk skeleton" style="height:66px"></div></div>'}
    <div class="grid g4">
      ${kpi('Open slips', ob.length, `${alive.length} still alive`)}
      ${kpi('At risk', money(exp), 'total staked')}
      ${kpi('Max return', money(mx), 'if every alive slip hits', 'pos')}
      ${kpi('Legs', `${legsAll.filter((e) => e.state === 'hit').length}/${legsAll.length}`, `${legsAll.filter((e) => e.state === 'live').length} live · ${legsAll.filter((e) => e.state === 'dead').length} dead`)}
    </div>
    <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr))">
      ${evs.map(({ b }) => slipCard(b, { open: true })).join('') || `<div class="card empty"><b>No open slips</b>Paste a Stake slip and it'll track here automatically.<div style="margin-top:12px"><button class="btn primary" data-act="add">+ New slip</button></div></div>`}
    </div>
  </div>`;
}

/* ---------- slips ---------- */
let slipSearch = '';
function vSlips() {
  const f = L.slipFilter;
  let list = bets().sort((a, b) => (b.placedAt || 0) - (a.placedAt || 0));
  if (f !== 'all') list = list.filter((b) => b.status === f);
  if (slipSearch) {
    const q = norm(slipSearch);
    list = list.filter((b) => norm(b.legs.map((l) => `${l.player} ${l.team} ${l.stat} ${l.gameLabel}`).join(' ') + ' ' + (b.notes || '') + ' ' + (b.placedBy || '')).includes(q));
  }
  const groups = new Map();
  for (const b of list) { const k = new Date(b.placedAt).toLocaleDateString([], { month: 'long', year: 'numeric' }); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(b); }
  const counts = { all: bets().length };
  for (const b of bets()) counts[b.status] = (counts[b.status] || 0) + 1;
  return `<div class="stack">
    <div class="row between wrap"><div><h1 class="h1">Slips</h1><p class="sub" style="margin:0">${bets().length} total</p></div>
      <div class="row"><button class="btn sm" data-act="csv">⬇ CSV</button><button class="btn primary sm" data-act="add">+ New slip</button></div></div>
    <input class="in" id="slip-search" placeholder="Search player, team, stat, notes…" value="${esc(slipSearch)}">
    <div class="chips">${['all', 'open', 'won', 'lost', 'void', 'cashout'].map((k) => `<button class="chip ${f === k ? 'on' : ''}" data-filter="${k}">${k[0].toUpperCase() + k.slice(1)} ${counts[k] ? `<span style="opacity:.6">${counts[k]}</span>` : ''}</button>`).join('')}</div>
    ${[...groups].map(([k, arr]) => {
      const pl = arr.reduce((s, b) => s + betProfit(b), 0);
      return `<div class="row between" style="margin-top:6px"><b>${k}</b><span class="num ${cls(pl)}">${money(pl, { sign: true })}</span></div>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,400px),1fr))">${arr.map((b) => slipCard(b, { compact: true })).join('')}</div>`;
    }).join('') || '<div class="card empty"><b>Nothing here</b>Change the filter or add a slip.</div>'}
  </div>`;
}
after.slips = () => {
  const s = document.getElementById('slip-search');
  if (s) s.addEventListener('input', (e) => { slipSearch = e.target.value; const pos = e.target.selectionStart; render(); const n = document.getElementById('slip-search'); n.focus(); n.setSelectionRange(pos, pos); });
};

/* ---------- insights ---------- */
function vInsights() {
  const X = insights(bets());
  if (X.all.n < 1) return `<div class="stack"><h1 class="h1">Insights</h1><div class="card empty"><b>Needs settled slips</b>Insights unlock after your first results — leg killers, odds-bucket edge, player hit rates and more.</div></div>`;
  const tbl = (rows, cols) => `<div class="tscroll"><table class="t"><thead><tr>${cols.map((c) => `<th class="${c.r ? 'r' : ''}">${c.h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td class="${c.r ? 'r num' : ''} ${c.c ? c.c(r) : ''}">${c.f(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const betCols = [
    { h: 'Bucket', f: (r) => esc(r.k) },
    { h: 'Slips', f: (r) => r.n, r: 1 },
    { h: 'Hit', f: (r) => pct(r.hit, 0), r: 1 },
    { h: 'Implied', f: (r) => pct(r.implied, 0), r: 1 },
    { h: 'Edge', f: (r) => spct(r.hit - r.implied, 0), r: 1, c: (r) => cls(r.hit - r.implied) },
    { h: 'P&L', f: (r) => money(r.profit, { sign: true }), r: 1, c: (r) => cls(r.profit) },
    { h: 'ROI', f: (r) => spct(r.roi, 0), r: 1, c: (r) => cls(r.roi) },
  ];
  const maxStat = 100;
  const verdict = (() => {
    const best = [...X.byLegs].sort((a, b) => b.roi - a.roi)[0];
    const worst = [...X.byLegs].sort((a, b) => a.roi - b.roi)[0];
    const lines = [];
    if (best && worst && best.k !== worst.k) lines.push(`Your best format is <b>${esc(best.k)}</b> (${spct(best.roi, 0)} ROI); worst is <b>${esc(worst.k)}</b> (${spct(worst.roi, 0)}).`);
    const st = X.byStat.filter((s) => s.n >= 3).sort((a, b) => b.hit - a.hit);
    if (st.length >= 2) lines.push(`Most reliable stat: <b>${esc(st[0].label)}</b> legs hit ${pct(st[0].hit, 0)}. Weakest: <b>${esc(st[st.length - 1].label)}</b> at ${pct(st[st.length - 1].hit, 0)}.`);
    if (X.beats) lines.push(`<b>${X.beats}</b> slip${X.beats > 1 ? 's' : ''} died by one leg — ${money(X.beatsMissed)} in missed payouts.`);
    const o = X.bySide.find((s) => s.k === 'Over'), u = X.bySide.find((s) => s.k === 'Under');
    if (o && u && o.n >= 3 && u.n >= 3) lines.push(`Overs hit ${pct(o.hit, 0)} vs unders ${pct(u.hit, 0)}.`);
    return lines;
  })();
  return `<div class="stack">
    <div><h1 class="h1">Insights</h1><p class="sub">${X.all.n} settled slips · ${X.legCount} graded legs · leg hit rate ${pct(X.legHit, 0)}</p></div>
    ${verdict.length ? `<div class="card" style="border-color:rgba(255,122,26,.35)"><h3>Desk read</h3>${verdict.map((v) => `<p style="margin:6px 0">${v}</p>`).join('')}</div>` : ''}
    <div class="cols t2">
      <div class="card"><h3>By number of legs <span class="r">is the parlay tax real?</span></h3>${tbl(X.byLegs, betCols)}</div>
      <div class="card"><h3>By odds bucket <span class="r">hit vs implied = edge</span></h3>${tbl(X.byOdds, betCols)}</div>
    </div>
    <div class="cols t2">
      <div class="card"><h3>Leg hit rate by stat</h3>${X.byStat.map((s) => hbar(esc(s.label), s.hit, maxStat, `${pct(s.hit, 0)} <span class="dim">${s.w}/${s.n}</span>`)).join('') || '<div class="dim">No prop legs yet.</div>'}
        <div class="divider"></div>${X.bySide.map((s) => hbar(s.k, s.hit, 100, `${pct(s.hit, 0)} <span class="dim">${s.w}/${s.n}</span>`)).join('')}
        ${X.byMarket.length > 1 ? '<div class="divider"></div>' + X.byMarket.map((s) => hbar(esc(s.k), s.hit, 100, `${pct(s.hit, 0)} <span class="dim">${s.w}/${s.n}</span>`)).join('') : ''}
      </div>
      <div class="card"><h3>Leg killers <span class="r">sole loser in a multi</span></h3>
        ${X.killerList.length ? X.killerList.map((k) => `<div class="row between" style="padding:7px 0;border-bottom:1px solid var(--line)"><span>${esc(k.k)}</span><b class="num neg">${k.n}×</b></div>`).join('') : '<div class="dim">No one-leg busts yet. Keep it that way.</div>'}
        <div class="grid g2" style="margin-top:12px">${kpi('Bad beats', X.beats, 'lost by 1 leg', X.beats ? 'neg' : '')}${kpi('Missed payout', money(X.beatsMissed), money(X.beatsStake) + ' staked', X.beats ? 'neg' : '')}</div>
      </div>
    </div>
    <div class="cols t2">
      <div class="card"><h3>Players <span class="r">2+ graded legs</span></h3>${X.byPlayer.length ? tbl(X.byPlayer.slice(0, 15), [
        { h: 'Player', f: (r) => esc(r.k) }, { h: 'Legs', f: (r) => r.n, r: 1 }, { h: 'Hit', f: (r) => `${r.w}/${r.n}`, r: 1 }, { h: '%', f: (r) => pct(r.hit, 0), r: 1, c: (r) => (r.hit >= 60 ? 'pos' : r.hit < 45 ? 'neg' : '') },
      ]) : '<div class="dim">Bet the same guys twice to see trends.</div>'}</div>
      <div class="card"><h3>Splits</h3>
        ${tbl(X.byType, betCols.filter((c) => !['Implied', 'Edge'].includes(c.h)).map((c) => (c.h === 'Bucket' ? { ...c, h: 'Type' } : c)))}
        <div class="divider"></div>
        ${tbl(X.byPerson, betCols.filter((c) => !['Implied', 'Edge'].includes(c.h)).map((c) => (c.h === 'Bucket' ? { ...c, h: 'Account' } : c)))}
        <div class="divider"></div>
        ${(() => { const m = Math.max(1, ...X.byDow.map((d) => Math.abs(d.profit))); return X.byDow.map((d) => hbar(d.k, d.profit, m, money(d.profit, { sign: true }), true)).join(''); })()}
      </div>
    </div>
  </div>`;
}

/* ---------- tools ---------- */
function vTools() {
  return `<div class="stack">
    <div><h1 class="h1">Tools</h1><p class="sub">Quick math before you lock a slip.</p></div>
    <div class="cols t2">
      <div class="card"><h3>Parlay builder</h3>
        <label class="f">Leg odds (decimal, comma or space separated)<input class="in num" id="t-legs" value="1.85, 1.72, 2.10"></label>
        <div class="grid g2" style="margin-top:10px"><label class="f">Stake<input class="in num" id="t-stake" inputmode="decimal" value="${S.settings.unit || 500}"></label><label class="f">Boost %<input class="in num" id="t-boost" inputmode="decimal" value="0"></label></div>
        <div id="t-parlay" style="margin-top:12px"></div></div>
      <div class="card"><h3>Cash-out check <span class="r">take Stake's offer?</span></h3>
        <div class="grid g2"><label class="f">Potential payout<input class="in num" id="c-pot" inputmode="decimal" value="3340"></label><label class="f">Cash-out offer<input class="in num" id="c-off" inputmode="decimal" value="1500"></label></div>
        <label class="f" style="margin-top:10px">Your win chance for the rest (%)<input class="in num" id="c-p" inputmode="decimal" value="50"></label>
        <div id="t-cash" style="margin-top:12px"></div></div>
      <div class="card"><h3>Kelly sizing</h3>
        <div class="grid g2"><label class="f">Odds (decimal)<input class="in num" id="k-o" inputmode="decimal" value="1.91"></label><label class="f">Your win % <input class="in num" id="k-p" inputmode="decimal" value="56"></label></div>
        <div class="grid g2" style="margin-top:10px"><label class="f">Bankroll<input class="in num" id="k-b" inputmode="decimal" value="${Math.max(0, Math.round(portfolio(bets(), txns()).bankroll)) || 10000}"></label>
        <label class="f">Fraction<select class="in" id="k-f"><option value="1">Full Kelly</option><option value="0.5">½ Kelly</option><option value="0.25" selected>¼ Kelly</option></select></label></div>
        <div id="t-kelly" style="margin-top:12px"></div></div>
      <div class="card"><h3>Odds converter</h3>
        <div class="grid g3"><label class="f">Decimal<input class="in num" id="o-d" inputmode="decimal" value="1.91"></label><label class="f">American<input class="in num" id="o-a" value=""></label><label class="f">Implied %<input class="in num" id="o-i" inputmode="decimal" value=""></label></div>
        <p class="dim" style="font-size:12px;margin:10px 0 0">Edit any box. Stake shows decimal odds.</p></div>
    </div>
  </div>`;
}
after.tools = () => {
  const $ = (id) => document.getElementById(id);
  const n = (id) => Number(String($(id).value).replace(',', '.')) || 0;
  const parlay = () => {
    const legs = $('t-legs').value.split(/[\s,;]+/).map((x) => Number(x)).filter((x) => x > 1);
    const o = legs.reduce((a, b) => a * b, 1) * (1 + n('t-boost') / 100);
    const st = n('t-stake');
    const imp = legs.reduce((a, b) => a * (1 / b), 1) * 100;
    $('t-parlay').innerHTML = `<div class="grid g3">${kpi('Total odds', odds(o))}${kpi('Pays', money(st * o), money(st * o - st, { sign: true }) + ' profit', 'pos')}${kpi('Implied', pct(imp, 1), 'all legs hit')}</div>
      <p class="dim" style="font-size:12px;margin:8px 0 0">Each leg you add multiplies the bookie margin. ${legs.length} legs ≈ ${pct((1 - Math.pow(0.955, legs.length)) * 100, 0)} vig drag at 4.5%/leg.</p>`;
  };
  const cash = () => {
    const pot = n('c-pot'), off = n('c-off'), p = n('c-p') / 100;
    const ev = pot * p;
    const be = pot ? (off / pot) * 100 : 0;
    $('t-cash').innerHTML = `<div class="grid g2">${kpi('Hold EV', money(ev))}${kpi('Break-even win %', pct(be, 1))}</div>
      <div class="alert ${ev > off ? 'info' : 'warn'}" style="margin-top:10px">${ev > off ? `Hold. Offer is ${money(ev - off)} below your EV.` : `Cash out. Offer beats your EV by ${money(off - ev)}.`}</div>`;
  };
  const kelly = () => {
    const o = n('k-o'), p = n('k-p') / 100, b = o - 1, f = Number($('k-f').value);
    const k = b > 0 ? (b * p - (1 - p)) / b : 0;
    const st = Math.max(0, k * f * n('k-b'));
    $('t-kelly').innerHTML = k <= 0 ? `<div class="alert bad">No edge at these odds. Implied ${pct(100 / (o || 1))} vs your ${pct(p * 100)}. Pass.</div>`
      : `<div class="grid g2">${kpi('Stake', money(st), pct(k * f * 100, 2) + ' of bankroll', 'pos')}${kpi('Edge', spct((p * o - 1) * 100), 'expected ROI')}</div>`;
  };
  ['t-legs', 't-stake', 't-boost'].forEach((id) => $(id).addEventListener('input', parlay));
  ['c-pot', 'c-off', 'c-p'].forEach((id) => $(id).addEventListener('input', cash));
  ['k-o', 'k-p', 'k-b', 'k-f'].forEach((id) => $(id).addEventListener('input', kelly));
  const conv = (src) => {
    let d;
    if (src === 'd') d = n('o-d');
    if (src === 'a') { const a = n('o-a'); d = a > 0 ? 1 + a / 100 : a < 0 ? 1 + 100 / -a : 0; }
    if (src === 'i') { const i = n('o-i'); d = i > 0 ? 100 / i : 0; }
    if (!d || d <= 1) return;
    if (src !== 'd') $('o-d').value = d.toFixed(3);
    if (src !== 'a') $('o-a').value = d >= 2 ? '+' + Math.round((d - 1) * 100) : Math.round(-100 / (d - 1));
    if (src !== 'i') $('o-i').value = (100 / d).toFixed(1);
  };
  $('o-d').addEventListener('input', () => conv('d')); $('o-a').addEventListener('input', () => conv('a')); $('o-i').addEventListener('input', () => conv('i'));
  parlay(); cash(); kelly(); conv('d');
};

/* ---------- settings ---------- */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; if (route === 'portfolio' || route === 'settings') render(); });
window.addEventListener('appinstalled', () => { deferredInstall = null; toast('Installed ✓', 'good'); render(); });
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
function installBanner() {
  if (standalone() || localStorage.getItem('ebl.hideInstall')) return '';
  if (!deferredInstall && !/iphone|ipad/i.test(navigator.userAgent)) return '';
  return `<div class="card tight install-cta"><img src="/tracker/icons/icon-192.png" width="40" height="40" style="border-radius:10px" alt=""><div class="grow"><b>Install the app</b><div class="mute" style="font-size:12px">${deferredInstall ? 'Home-screen icon, full screen, live alerts.' : 'Safari: Share → Add to Home Screen.'}</div></div>${deferredInstall ? '<button class="btn primary sm" data-act="install">Install</button>' : ''}<button class="btn ghost sm" data-act="hideinstall" aria-label="Dismiss">✕</button></div>`;
}

function vSettings() {
  const s = S.settings;
  return `<div class="stack">
    <div><h1 class="h1">Settings</h1><p class="sub">Shared settings sync to every device on your PIN.</p></div>
    <div class="cols t2">
      <div class="card stack"><h3>Bankroll rules</h3>
        <div class="grid g2">
          <label class="f">Currency symbol<select class="in" data-set="currency">${['₹', '$', '€', '£', 'kr '].map((c) => `<option ${s.currency === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
          <label class="f">Unit size<input class="in num" data-set="unit" inputmode="decimal" value="${esc(s.unit)}"></label>
          <label class="f">Daily loss limit (0 = off)<input class="in num" data-set="lossLimit" inputmode="decimal" value="${esc(s.lossLimit)}"></label>
          <label class="f">Flex-card handle<input class="in" data-set="handle" placeholder="@easybuckets" value="${esc(s.handle)}"></label>
        </div>
        <label class="f">Stake accounts (comma separated)<input class="in" data-set="people" value="${esc((s.people || []).join(', '))}"></label>
        <label class="row" style="gap:8px;font-size:13px"><input type="checkbox" data-set="autoSettle" ${s.autoSettle !== false ? 'checked' : ''}> Auto-settle slips from live boxscores</label>
      </div>
      <div class="card stack"><h3>App</h3>
        <div class="row between"><span>Sync</span><span class="mute">${L.mode === 'cloud' ? `Cloud · PIN ••••${L.pin.slice(-2)} · ${L.lastSync ? ago(L.lastSync) : 'never'}` : 'This device only'}</span></div>
        <div class="row wrap">${L.mode === 'cloud' ? '<button class="btn sm" data-act="syncnow">↻ Sync now</button><button class="btn sm" data-act="lock">Lock / switch PIN</button>' : '<button class="btn sm primary" data-act="lock">Turn on cloud sync</button>'}</div>
        <div class="divider"></div>
        <div class="row between"><span>Install</span>${standalone() ? '<span class="pill won">Installed</span>' : deferredInstall ? '<button class="btn sm primary" data-act="install">Install app</button>' : '<span class="mute" style="font-size:12px">Chrome menu ⋮ → Install app</span>'}</div>
        <div class="row between"><span>Leg alerts</span>${'Notification' in window ? `<button class="btn sm" data-act="notify">${L.notify && Notification.permission === 'granted' ? 'On ✓' : 'Enable'}</button>` : '<span class="mute">Not supported</span>'}</div>
        <label class="row" style="gap:8px;font-size:13px"><input type="checkbox" data-local="auto" ${L.auto ? 'checked' : ''}> Auto-refresh live data</label>
        <div class="divider"></div>
        <h3>Data</h3>
        <div class="row wrap"><button class="btn sm" data-act="export">⬇ Backup JSON</button><button class="btn sm" data-act="import">⬆ Restore JSON</button><button class="btn sm" data-act="csv">⬇ CSV</button><button class="btn sm danger" data-act="wipe">Wipe this device</button></div>
        <input type="file" id="import-file" accept="application/json" class="hidden">
      </div>
    </div>
    <p class="dim" style="font-size:12px">Live data: ESPN public scoreboard & boxscores, proxied and cached. Stake has no public API, so slips are pasted or built here. EasyBuckets Ledger is a personal tracker, not affiliated with Stake or the NBA.</p>
  </div>`;
}
after.settings = () => {
  view().querySelectorAll('[data-set]').forEach((el) => el.addEventListener('change', () => {
    const k = el.dataset.set;
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (k === 'people') v = v.split(',').map((x) => x.trim()).filter(Boolean);
    if (k === 'unit' || k === 'lossLimit') v = Number(v) || 0;
    S.settings[k] = v;
    S.settings.updatedAt = Date.now();
    save(); queuePush(); toast('Saved');
    if (k === 'currency') render();
  }));
  view().querySelectorAll('[data-local]').forEach((el) => el.addEventListener('change', () => { L[el.dataset.local] = el.checked; saveL(); if (L.auto) pollLive(); }));
  document.getElementById('import-file').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      const a = mergeArr(S.bets, toMap(j.bets || [])); const b = mergeArr(S.txns, toMap(j.txns || []));
      S.bets = a.list; S.txns = b.list; if (j.settings) S.settings = { ...S.settings, ...j.settings, updatedAt: Date.now() };
      commit(); toast(`Restored ${j.bets?.length || 0} slips`, 'good');
    } catch { toast('Not a valid backup file', 'bad'); }
  });
};

/* =========================================================
   Sheets: add / edit / detail / txn
   ========================================================= */
function blankLeg() { return { id: uid(), market: 'prop', player: '', playerId: null, teamAbbr: '', stat: 'PTS', side: 'over', line: '', odds: '', team: '', gameId: null, gameLabel: '', result: 'pending', manual: false }; }

function newDraft() {
  return {
    id: uid(), createdAt: Date.now(), placedAt: Date.now(), gameDate: etYMD(), type: 'single', stake: S.settings.unit || '', odds: '', boost: '',
    status: 'open', payout: '', cashout: '', placedBy: acct() !== 'all' ? acct() : S.settings.people?.[0] || '', notes: '', legs: [blankLeg()], source: 'build',
  };
}

function renderSheet() {
  const root = document.getElementById('sheet-root');
  if (!sheetState) { root.innerHTML = ''; return; }
  let inner = '';
  if (sheetState.kind === 'edit') inner = sheetEdit();
  if (sheetState.kind === 'detail') inner = sheetDetail();
  if (sheetState.kind === 'txn') inner = sheetTxn();
  if (sheetState.kind === 'settle') inner = sheetSettle();
  const scroll = root.querySelector('.sheet')?.scrollTop || 0;
  root.innerHTML = `<div class="sheet-bg" data-act="bg"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${inner}</div></div>`;
  root.querySelector('.sheet').scrollTop = scroll;
  if (sheetState.kind === 'edit') wireEdit();
}

/* ---------- edit ---------- */
function deriveType(d) {
  if (d.legs.length <= 1) return 'single';
  const ids = new Set(d.legs.map((l) => l.gameId).filter(Boolean));
  return ids.size === 1 && d.legs.every((l) => l.gameId) ? 'sgm' : 'multi';
}
function sheetEdit() {
  const d = sheetState.draft;
  const day = sheetState.day;
  const evOpts = (sel) => `<option value="">Pick game…</option>` + (day?.events || []).map((e) => `<option value="${e.id}" ${sel === e.id ? 'selected' : ''}>${esc(e.away.abbr)} @ ${esc(e.home.abbr)} · ${new Date(e.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</option>`).join('');
  const legOddsProd = d.legs.every((l) => Number(l.odds) > 1) ? d.legs.reduce((a, l) => a * Number(l.odds), 1) : 0;
  const totalOdds = Number(d.odds) || legOddsProd;
  const pot = (Number(d.stake) || 0) * totalOdds * (1 + (Number(d.boost) || 0) / 100);
  const disc = discipline(bets(), S.settings);
  const units = disc.unit ? (Number(d.stake) || 0) / disc.unit : 0;
  const flags = [...disc.flags];
  if (units > 2) flags.push({ lvl: 'warn', msg: `That's ${units.toFixed(1)} units — above your 2u max.` });
  const today = etYMD();
  const legsHTML = d.legs.map((l, i) => {
    const g = day?.events?.find((e) => e.id === l.gameId);
    const teamOpts = g ? [g.away, g.home].map((t) => `<option value="${esc(t.name)}" ${l.team === t.name ? 'selected' : ''}>${esc(t.name)}</option>`).join('') : '';
    return `<div class="leg-edit stack" data-leg="${i}">
      <div class="row between"><b style="font-size:13px">Leg ${i + 1}</b>${d.legs.length > 1 ? `<button class="btn ghost sm" data-act="rmleg" data-i="${i}" aria-label="Remove leg">✕</button>` : ''}</div>
      <div class="grid g2">
        <label class="f">Market<select class="in" data-l="market">${Object.entries(MARKETS).map(([k, v]) => `<option value="${k}" ${l.market === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        ${l.market === 'prop'
          ? `<label class="f">Stat<select class="in" data-l="stat">${Object.entries(STATS).map(([k, v]) => `<option value="${k}" ${l.stat === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>`
          : l.market === 'other' ? `<label class="f">Leg odds<input class="in num" data-l="odds" inputmode="decimal" value="${esc(l.odds)}"></label>`
          : `<label class="f">Game<select class="in" data-l="gameId">${evOpts(l.gameId)}</select></label>`}
      </div>
      ${l.market === 'prop' ? `<div class="ac"><label class="f">Player ${l.playerId ? `<span class="pos" style="font-size:11px">✓ ${esc(l.teamAbbr)} · ${esc(l.gameLabel)}</span>` : l.player ? '<span class="amber" style="font-size:11px">not matched to a roster</span>' : ''}<input class="in" data-l="player" autocomplete="off" placeholder="${day ? 'Start typing a name…' : 'Loading rosters…'}" value="${esc(l.player)}"></label><div class="ac-list hidden"></div></div>` : ''}
      ${l.market === 'other' ? `<label class="f">Description<input class="in" data-l="desc" value="${esc(l.desc || '')}" placeholder="e.g. 1st quarter winner"></label>` : ''}
      ${l.market === 'ml' || l.market === 'spread' ? `<label class="f">Team<select class="in" data-l="team"><option value="">Pick team…</option>${teamOpts}</select></label>` : ''}
      ${l.market !== 'other' && l.market !== 'ml' ? `<div class="lrow">
        ${l.market === 'spread' ? '<span></span>' : `<div class="f" style="font-size:12px;color:var(--mute)">Side<div class="seg"><button data-side="over" class="${l.side !== 'under' ? 'on ov' : ''}">${STATS[l.stat]?.special && l.market === 'prop' ? 'Yes' : 'Over'}</button><button data-side="under" class="${l.side === 'under' ? 'on un' : ''}">${STATS[l.stat]?.special && l.market === 'prop' ? 'No' : 'Under'}</button></div></div>`}
        ${STATS[l.stat]?.special && l.market === 'prop' ? '<span></span>' : `<label class="f">Line<input class="in num" data-l="line" inputmode="decimal" value="${esc(l.line)}" placeholder="${l.market === 'spread' ? '-4.5' : '24.5'}"></label>`}
        <label class="f">Leg odds<input class="in num" data-l="odds" inputmode="decimal" value="${esc(l.odds)}" placeholder="1.85"></label></div>` : ''}
      ${l.market === 'ml' ? `<label class="f">Leg odds<input class="in num" data-l="odds" inputmode="decimal" value="${esc(l.odds)}" placeholder="1.55"></label>` : ''}
      ${sheetState.editing ? `<label class="f">Result<select class="in" data-l="result">${['pending', 'won', 'lost', 'void'].map((r) => `<option ${l.result === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label>` : ''}
    </div>`;
  }).join('');
  return `<div class="sheet-h"><h2>${sheetState.editing ? 'Edit slip' : 'New slip'}</h2><button class="btn ghost sm" data-act="close">✕</button></div>
  <div class="stack">
    ${flags.map((f) => `<div class="alert ${f.lvl}">⚠️ ${esc(f.msg)}</div>`).join('')}
    <div class="row wrap between">
      <div class="seg"><button data-mode="paste" class="${sheetState.mode === 'paste' ? 'on' : ''}">Paste Stake slip</button><button data-mode="build" class="${sheetState.mode !== 'paste' ? 'on' : ''}">Build</button></div>
      <div class="row wrap" style="gap:6px"><span class="dim" style="font-size:12px">Game day (US)</span>
        <div class="chips"><button class="chip ${d.gameDate === addDays(today, -1) ? 'on' : ''}" data-day="${addDays(today, -1)}">Yest</button><button class="chip ${d.gameDate === today ? 'on' : ''}" data-day="${today}">Today</button><button class="chip ${d.gameDate === addDays(today, 1) ? 'on' : ''}" data-day="${addDays(today, 1)}">Tmrw</button></div>
        <input type="date" class="in" style="width:auto;padding:6px 8px" id="gday" value="${d.gameDate}"></div>
    </div>
    <div class="dim" style="font-size:12px">${day ? `${day.events.length} games · ${day.players.length} players loaded for ${dateOnly(d.gameDate + 'T12:00:00')}` : sheetState.dayErr ? `<span class="neg">Couldn't load games: ${esc(sheetState.dayErr)}</span>` : 'Loading games & rosters…'}</div>
    ${sheetState.mode === 'paste' ? `<div class="stack">
      <textarea class="in" id="paste" placeholder="Paste from Stake bet slip / My Bets, or type:\nJokic over 11.5 rebounds @1.8\nCurry 4+ threes 2.1\nBet amount 500  Total odds 3.78">${esc(sheetState.pasteText || '')}</textarea>
      <div class="row"><button class="btn primary" data-act="parse" ${day ? '' : 'disabled'}>Parse slip</button>
      <button class="btn ghost sm" data-act="clipboard">📋 From clipboard</button></div>
      ${sheetState.warn?.length ? sheetState.warn.map((w) => `<div class="alert warn">${esc(w)}</div>`).join('') : ''}
    </div>` : ''}
    ${legsHTML}
    <button class="btn" data-act="addleg">+ Add leg</button>
    <div class="divider"></div>
    <div class="grid g3">
      <label class="f">Stake (${esc(cur().trim())})<input class="in num" data-d="stake" inputmode="decimal" value="${esc(d.stake)}"></label>
      <label class="f">Total odds ${legOddsProd && !Number(d.odds) ? `<span class="dim">auto ${odds(legOddsProd)}</span>` : ''}<input class="in num" data-d="odds" inputmode="decimal" value="${esc(d.odds)}" placeholder="${legOddsProd ? odds(legOddsProd) : 'from Stake'}"></label>
      <label class="f">Boost %<input class="in num" data-d="boost" inputmode="decimal" value="${esc(d.boost)}" placeholder="0"></label>
    </div>
    <div class="grid g2">
      <label class="f">Stake account<select class="in" data-d="placedBy">${(S.settings.people || []).map((p) => `<option ${d.placedBy === p ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></label>
      <label class="f">Placed at<input type="datetime-local" class="in" data-d="placedAt" value="${new Date(d.placedAt - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}"></label>
    </div>
    <div class="grid g2">
      <label class="f">Status<select class="in" data-d="status">${['open', 'won', 'lost', 'void', 'cashout'].map((s) => `<option value="${s}" ${d.status === s ? 'selected' : ''}>${s === 'cashout' ? 'cashed out' : s}</option>`).join('')}</select></label>
      ${d.status === 'won' ? `<label class="f">Actual payout (optional)<input class="in num" data-d="payout" inputmode="decimal" value="${esc(d.payout)}" placeholder="${Math.round(pot)}"></label>` : d.status === 'cashout' ? `<label class="f">Cash-out amount<input class="in num" data-d="cashout" inputmode="decimal" value="${esc(d.cashout)}"></label>` : '<span></span>'}
    </div>
    <label class="f">Notes<input class="in" data-d="notes" value="${esc(d.notes)}" placeholder="Why you liked it"></label>
  </div>
  <div class="sumbar"><div class="grow"><div class="dim" style="font-size:11.5px">${d.legs.length} leg${d.legs.length > 1 ? 's' : ''} · ${{ single: 'Single', multi: 'Multi', sgm: 'SGM' }[deriveType(d)]} · @${odds(totalOdds)}${units ? ` · ${units.toFixed(1)}u` : ''}</div><div class="num" style="font-size:18px;font-weight:700">To win ${money(pot)}</div></div>
    <button class="btn primary" data-act="savebet">${sheetState.editing ? 'Save' : 'Track slip'}</button></div>`;
}

async function loadDay(ymd) {
  sheetState.day = null; sheetState.dayErr = null; renderSheet();
  try { const d = await playersFor(ymd); if (sheetState?.kind === 'edit' && sheetState.draft.gameDate === ymd) { sheetState.day = d; relinkDraft(); renderSheet(); } }
  catch (e) { if (sheetState?.kind === 'edit') { sheetState.dayErr = e.message; renderSheet(); } }
}
function relinkDraft() {
  const d = sheetState.draft, day = sheetState.day;
  if (!day) return;
  for (const l of d.legs) {
    if (l.market === 'prop' && l.player && !l.playerId) {
      const p = findPlayer(day.players, l);
      if (p) setLegPlayer(l, p, day);
    }
  }
}
function setLegPlayer(l, p, day) {
  l.player = p.name; l.playerId = p.id; l.teamAbbr = p.team; l.gameId = p.gameId;
  const ev = day.events.find((e) => e.id === p.gameId);
  if (ev) { l.gameLabel = `${ev.away.abbr} @ ${ev.home.abbr}`; l.startTime = ev.date; }
}

function wireEdit() {
  const root = document.getElementById('sheet-root');
  const d = sheetState.draft;
  root.querySelectorAll('[data-d]').forEach((el) => el.addEventListener('change', () => {
    const k = el.dataset.d;
    d[k] = k === 'placedAt' ? new Date(el.value).getTime() : el.value;
    renderSheet();
  }));
  root.querySelectorAll('[data-d="stake"],[data-d="odds"],[data-d="boost"]').forEach((el) => el.addEventListener('input', () => { d[el.dataset.d] = el.value; updateSum(); }));
  root.querySelectorAll('[data-leg]').forEach((box) => {
    const i = Number(box.dataset.leg);
    const l = d.legs[i];
    box.querySelectorAll('[data-l]').forEach((el) => {
      const k = el.dataset.l;
      if (k === 'player') return;
      el.addEventListener('change', () => {
        l[k] = el.value;
        if (k === 'result') l.manual = el.value !== 'pending';
        if (k === 'gameId') { const ev = sheetState.day?.events.find((e) => e.id === el.value); if (ev) { l.gameLabel = `${ev.away.abbr} @ ${ev.home.abbr}`; l.startTime = ev.date; } l.team = ''; }
        if (k === 'market') { l.gameId = l.market === 'prop' ? l.gameId : l.gameId; if (STATS[l.stat]?.special) l.line = 0.5; }
        if (k === 'stat' && STATS[l.stat]?.special) l.line = 0.5;
        renderSheet();
      });
      if (k === 'line' || k === 'odds') el.addEventListener('input', () => { l[k] = el.value; updateSum(); });
    });
    box.querySelectorAll('[data-side]').forEach((b) => b.addEventListener('click', () => { l.side = b.dataset.side; renderSheet(); }));
    const pin = box.querySelector('[data-l="player"]');
    if (pin) {
      const list = box.querySelector('.ac-list');
      let idx = 0, matches = [];
      const show = () => {
        const q = norm(pin.value);
        matches = q.length < 2 || !sheetState.day ? [] : sheetState.day.players.filter((p) => norm(p.name).includes(q) || norm(p.name).split(' ').some((t) => t.startsWith(q))).slice(0, 8);
        list.classList.toggle('hidden', !matches.length);
        list.innerHTML = matches.map((p, j) => `<button type="button" data-pi="${j}" class="${j === idx ? 'on' : ''}"><span>${esc(p.name)}</span><small>${esc(p.team)} vs ${esc(p.opp || '')} · ${esc(p.pos)}</small></button>`).join('');
      };
      const pick = (p) => { setLegPlayer(l, p, sheetState.day); renderSheet(); };
      pin.addEventListener('input', () => { l.player = pin.value; l.playerId = null; idx = 0; show(); });
      pin.addEventListener('keydown', (e) => {
        if (!matches.length) return;
        if (e.key === 'ArrowDown') { idx = Math.min(matches.length - 1, idx + 1); show(); e.preventDefault(); }
        if (e.key === 'ArrowUp') { idx = Math.max(0, idx - 1); show(); e.preventDefault(); }
        if (e.key === 'Enter') { pick(matches[idx]); e.preventDefault(); }
      });
      pin.addEventListener('blur', () => setTimeout(() => { list.classList.add('hidden'); if (l.player && !l.playerId && sheetState?.day) { const p = findPlayer(sheetState.day.players, l); if (p) pick(p); } }, 180));
      list.addEventListener('mousedown', (e) => { const b = e.target.closest('[data-pi]'); if (b) { e.preventDefault(); pick(matches[Number(b.dataset.pi)]); } });
    }
  });
  const gd = root.querySelector('#gday');
  if (gd) gd.addEventListener('change', () => { d.gameDate = gd.value; loadDay(gd.value); });
  const pt = root.querySelector('#paste');
  if (pt) pt.addEventListener('input', () => { sheetState.pasteText = pt.value; });
}
function updateSum() {
  const d = sheetState.draft;
  const prod = d.legs.every((l) => Number(l.odds) > 1) ? d.legs.reduce((a, l) => a * Number(l.odds), 1) : 0;
  const o = Number(d.odds) || prod;
  const pot = (Number(d.stake) || 0) * o * (1 + (Number(d.boost) || 0) / 100);
  const el = document.querySelector('.sumbar .num');
  if (el) el.textContent = 'To win ' + money(pot);
}

function saveDraft() {
  const d = sheetState.draft;
  const legs = d.legs.filter((l) => l.player || l.team || l.desc || l.market === 'total');
  if (!legs.length) return toast('Add at least one leg', 'bad');
  for (const l of legs) {
    if (l.market === 'prop' && !STATS[l.stat]?.special && !(Number(l.line) >= 0 && l.line !== '')) return toast(`Line missing for ${l.player || 'a prop leg'}`, 'bad');
    if ((l.market === 'total' || l.market === 'ml' || l.market === 'spread') && !l.gameId) return toast('Pick the game for every game leg', 'bad');
    l.line = l.line === '' ? '' : Number(l.line);
    l.odds = Number(l.odds) || null;
  }
  const prod = legs.every((l) => l.odds > 1) ? legs.reduce((a, l) => a * l.odds, 1) : 0;
  const o = Number(d.odds) || Math.round(prod * 100) / 100;
  if (!(o > 1)) return toast('Enter the total odds from Stake', 'bad');
  if (!(Number(d.stake) > 0)) return toast('Enter the stake', 'bad');
  const bet = { ...d, legs, odds: o, stake: Number(d.stake), boost: Number(d.boost) || 0, type: deriveType({ legs }) };
  bet.payout = bet.payout === '' ? null : Number(bet.payout);
  bet.cashout = bet.cashout === '' ? null : Number(bet.cashout);
  if (isSettled(bet) && !bet.settledAt) bet.settledAt = bet.placedAt;
  if (bet.status === 'open') { bet.settledAt = null; bet.autoSettled = false; }
  if (isSettled(bet)) for (const l of bet.legs) if (l.result === 'pending' && bet.status === 'won') l.result = 'won';
  const i = S.bets.findIndex((b) => b.id === bet.id);
  if (i >= 0) S.bets[i] = bet; else S.bets.push(bet);
  const wasEditing = sheetState.editing;
  closeSheet();
  commit(bet);
  toast(wasEditing ? 'Slip updated' : `Tracking ${betTitle(bet)} · to win ${money(potential(bet))}`, 'good');
  if (bet.status === 'open') pollLive(true);
}

/* ---------- detail ---------- */
function sheetDetail() {
  const b = S.bets.find((x) => x.id === sheetState.id);
  if (!b) { setTimeout(closeSheet); return ''; }
  const p = betProfit(b);
  return `<div class="sheet-h"><h2 style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(betTitle(b))}</h2><button class="btn ghost sm" data-act="close">✕</button></div>
  <div class="stack">
    ${b.review ? '<div class="alert warn">A leg was voided and its odds weren\'t logged — enter Stake\'s actual payout via Edit.</div>' : ''}
    ${slipCard(b, { open: true })}
    <div class="grid g3">${kpi('Stake', money(b.stake))}${kpi('Odds', odds(b.settledOdds || b.odds), b.boost ? `+${b.boost}% boost` : '')}${isSettled(b) ? kpi('Result', money(p, { sign: true }), money(betReturn(b)) + ' back', cls(p)) : kpi('To win', money(potential(b)), '', 'pos')}</div>
    <div class="dim" style="font-size:12px">Placed ${when(b.placedAt)}${b.placedBy ? ' by ' + esc(b.placedBy) : ''}${b.settledAt ? ' · settled ' + when(b.settledAt) + (b.autoSettled ? ' (auto)' : '') : ''}${b.notes ? '<br>“' + esc(b.notes) + '”' : ''}</div>
    ${b.status === 'open' ? `<div class="row wrap"><button class="btn good sm" data-act="settle" data-id="${b.id}" data-s="won">Mark won</button><button class="btn danger sm" data-act="settle" data-id="${b.id}" data-s="lost">Mark lost</button><button class="btn sm" data-act="settle" data-id="${b.id}" data-s="void">Void</button><button class="btn sm" data-act="cashoutsheet" data-id="${b.id}">Cashed out…</button></div>` : `<div class="row wrap"><button class="btn sm" data-act="reopen" data-id="${b.id}">Reopen</button></div>`}
    <div class="row wrap"><button class="btn sm" data-act="share" data-id="${b.id}">📸 Flex card</button><button class="btn sm" data-act="edit" data-id="${b.id}">✎ Edit</button><button class="btn sm" data-act="dup" data-id="${b.id}">⧉ Duplicate</button><button class="btn sm danger" data-act="del" data-id="${b.id}">Delete</button></div>
  </div>`;
}

function sheetSettle() {
  const b = S.bets.find((x) => x.id === sheetState.id);
  return `<div class="sheet-h"><h2>Cash out</h2><button class="btn ghost sm" data-act="close">✕</button></div>
  <div class="stack"><p class="mute" style="margin:0">${esc(betTitle(b))} · stake ${money(b.stake)} · potential ${money(potential(b))}</p>
  <label class="f">Amount Stake paid you<input class="in num" id="co-amt" inputmode="decimal" autofocus></label>
  <button class="btn primary" data-act="docashout" data-id="${b.id}">Save cash-out</button></div>`;
}

function sheetTxn() {
  const k = sheetState.txnKind;
  return `<div class="sheet-h"><h2>${k === 'deposit' ? 'Deposit' : 'Withdrawal'}</h2><button class="btn ghost sm" data-act="close">✕</button></div>
  <div class="stack">
    <label class="f">Amount (${esc(cur().trim())})<input class="in num" id="tx-amt" inputmode="decimal" autofocus></label>
    <label class="f">Stake account<select class="in" id="tx-acct">${(S.settings.people || []).map((p) => `<option ${acct() === p ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></label>
    <label class="f">Date<input type="date" class="in" id="tx-date" value="${new Date().toISOString().slice(0, 10)}"></label>
    <label class="f">Note<input class="in" id="tx-note" placeholder="${k === 'deposit' ? 'Starting balance' : 'Profit taken'}"></label>
    <button class="btn primary" data-act="savetxn">Save</button>
  </div>`;
}

/* =========================================================
   Actions
   ========================================================= */
document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-act],[data-go],[data-period],[data-filter],[data-mode],[data-day],[data-profile]');
  if (!t) return;
  if (t.dataset.profile) { L.profile = t.dataset.profile; saveL(); return render(); }
  if (t.dataset.go) { if (sheetState) closeSheet(); return go(t.dataset.go); }
  if (t.dataset.period) { L.period = t.dataset.period; saveL(); return render(); }
  if (t.dataset.filter) { L.slipFilter = t.dataset.filter; saveL(); return render(); }
  if (t.dataset.mode) { sheetState.mode = t.dataset.mode; return renderSheet(); }
  if (t.dataset.day) { sheetState.draft.gameDate = t.dataset.day; return loadDay(t.dataset.day); }
  const a = t.dataset.act;
  const id = t.dataset.id;
  const bet = id ? S.bets.find((b) => b.id === id) : null;
  switch (a) {
    case 'bg': if (e.target === t) closeSheet(); break;
    case 'close': closeSheet(); break;
    case 'add': {
      if (!L.mode) return;
      openSheet('edit', { draft: newDraft(), mode: 'paste', day: null });
      loadDay(sheetState.draft.gameDate);
      break;
    }
    case 'unlock': {
      const pin = document.getElementById('pin').value.trim();
      if (!/^\d{4,8}$/.test(pin)) return toast('PIN must be 4–8 digits', 'bad');
      L.pin = pin; L.mode = 'cloud'; saveL();
      t.disabled = true; t.textContent = 'Unlocking…';
      const ok = await syncNow(S.bets.length ? 'push' : 'pull');
      if (L.mode === 'cloud') {
        if (!ok) toast('Cloud storage isn’t answering — everything saves on this device and syncs automatically when it’s back.', '', 7000);
        render(); pollLive(true);
      }
      break;
    }
    case 'localmode': L.mode = 'local'; saveL(); render(); pollLive(true); break;
    case 'lock': L.mode = null; L.pin = ''; saveL(); setSync('local'); render(); break;
    case 'syncnow': await syncNow('push'); toast('Synced', 'good'); render(); break;
    case 'refresh': t.textContent = '↻ …'; await pollLive(true); break;
    case 'notify': {
      if (!('Notification' in window)) return;
      const p = await Notification.requestPermission();
      L.notify = p === 'granted'; saveL();
      toast(L.notify ? 'Leg alerts on — you’ll get pinged when legs hit or bust' : 'Notifications blocked in browser settings', L.notify ? 'good' : 'bad');
      render(); break;
    }
    case 'install': if (deferredInstall) { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; render(); } break;
    case 'hideinstall': localStorage.setItem('ebl.hideInstall', '1'); render(); break;
    case 'detail': openSheet('detail', { id }); break;
    case 'edit': openSheet('edit', { draft: structuredClone(bet), editing: true, mode: 'build', day: null }); loadDay(bet.gameDate || etYMD(new Date(bet.placedAt))); break;
    case 'dup': {
      const c = structuredClone(bet); c.id = uid(); c.createdAt = c.placedAt = Date.now(); c.status = 'open'; c.payout = ''; c.cashout = ''; c.settledAt = null; c.autoSettled = false; c.review = false; c.gameDate = etYMD();
      c.legs.forEach((l) => { l.id = uid(); l.result = 'pending'; l.manual = false; l.gameId = null; l.playerId = null; delete l.finalValue; });
      openSheet('edit', { draft: c, mode: 'build', day: null }); loadDay(c.gameDate); break;
    }
    case 'del': if (confirmInline(t, 'Tap again to delete')) { bet.deleted = true; closeSheet(); commit(bet); toast('Slip deleted'); } break;
    case 'settle': {
      bet.status = t.dataset.s; bet.settledAt = Date.now(); bet.autoSettled = false;
      bet.legs.forEach((l) => { if (l.result === 'pending') { l.result = t.dataset.s === 'won' ? 'won' : t.dataset.s === 'void' ? 'void' : 'pending'; } });
      commit(bet); renderSheet(); break;
    }
    case 'reopen': bet.status = 'open'; bet.settledAt = null; bet.autoSettled = false; bet.review = false; bet.legs.forEach((l) => { if (!l.manual) l.result = 'pending'; }); commit(bet); renderSheet(); pollLive(true); break;
    case 'cashoutsheet': openSheet('settle', { id }); break;
    case 'docashout': {
      const v = Number(document.getElementById('co-amt').value);
      if (!(v >= 0)) return toast('Enter the amount', 'bad');
      bet.status = 'cashout'; bet.cashout = v; bet.settledAt = Date.now(); closeSheet(); commit(bet); toast(`Cashed out ${money(v - bet.stake, { sign: true })}`, 'good'); break;
    }
    case 'share': {
      const blob = await flexCard(bet, { cur: cur(), handle: S.settings.handle });
      const file = new File([blob], `slip-${bet.id.slice(0, 6)}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: betTitle(bet) }); } catch {} }
      else { const u = URL.createObjectURL(blob); const a2 = document.createElement('a'); a2.href = u; a2.download = file.name; a2.click(); setTimeout(() => URL.revokeObjectURL(u), 4000); }
      break;
    }
    case 'addleg': { const nl = blankLeg(); const prev = sheetState.draft.legs.at(-1); if (prev?.market === 'prop') { nl.gameId = null; } sheetState.draft.legs.push(nl); renderSheet(); break; }
    case 'rmleg': sheetState.draft.legs.splice(Number(t.dataset.i), 1); renderSheet(); break;
    case 'clipboard': {
      try { const txt = await navigator.clipboard.readText(); sheetState.pasteText = txt; renderSheet(); } catch { toast('Clipboard blocked — long-press and paste instead', 'bad'); }
      break;
    }
    case 'parse': {
      const r = parseSlip(sheetState.pasteText || '', sheetState.day);
      sheetState.warn = r.warnings;
      if (r.legs.length) {
        const d = sheetState.draft;
        d.legs = r.legs.map((l) => ({ ...blankLeg(), ...l, line: l.line ?? '', odds: l.odds ?? '' }));
        if (r.stake) d.stake = r.stake;
        if (r.odds) d.odds = r.odds;
        if (r.payout && r.stake && !r.odds) d.odds = Math.round((r.payout / r.stake) * 100) / 100;
        d.source = 'paste';
        sheetState.mode = 'build';
        toast(`Parsed ${r.legs.length} leg${r.legs.length > 1 ? 's' : ''} — check and save`, 'good');
      }
      renderSheet(); break;
    }
    case 'savebet': saveDraft(); break;
    case 'txn': openSheet('txn', { txnKind: t.dataset.kind }); break;
    case 'savetxn': {
      const amt = Number(document.getElementById('tx-amt').value);
      if (!(amt > 0)) return toast('Enter an amount', 'bad');
      const tx = { id: uid(), kind: sheetState.txnKind, amount: amt, at: new Date(document.getElementById('tx-date').value + 'T12:00:00').getTime(), note: document.getElementById('tx-note').value.trim(), account: document.getElementById('tx-acct').value };
      S.txns.push(tx); closeSheet(); commit(tx); break;
    }
    case 'deltxn': { const tx = S.txns.find((x) => x.id === id); if (tx && confirmInline(t, '?')) { tx.deleted = true; commit(tx); } break; }
    case 'export': download(`easybuckets-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ bets: S.bets, txns: S.txns, settings: S.settings, exportedAt: Date.now() }, null, 1), 'application/json'); break;
    case 'import': document.getElementById('import-file').click(); break;
    case 'csv': download(`easybuckets-slips-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(), 'text/csv'); break;
    case 'wipe': if (confirmInline(t, 'Tap again — wipes this device')) { localStorage.removeItem(KEY); localStorage.removeItem(LKEY); location.reload(); } break;
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sheetState) closeSheet();
  if (e.key === 'Enter' && e.target.id === 'pin') document.querySelector('[data-act="unlock"]')?.click();
  if ((e.key === 'n' || e.key === 'N') && !sheetState && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) && L.mode) document.querySelector('[data-act="add"]')?.click();
});

function confirmInline(btn, txt) {
  if (btn.dataset.armed) return true;
  const old = btn.textContent;
  btn.dataset.armed = '1'; btn.textContent = txt;
  setTimeout(() => { delete btn.dataset.armed; btn.textContent = old; }, 2500);
  return false;
}
function download(name, content, type) {
  const u = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = u; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(u), 4000);
}
function toCSV() {
  const rows = [['placed_at', 'placed_by', 'type', 'legs', 'selections', 'stake', 'odds', 'status', 'profit', 'notes']];
  for (const b of bets().sort((a, c) => a.placedAt - c.placedAt)) {
    rows.push([new Date(b.placedAt).toISOString(), b.placedBy || '', b.type, b.legs.length, b.legs.map((l) => `${legLabel(l)} [${l.result}]`).join(' | '), b.stake, b.odds, b.status, betProfit(b).toFixed(2), b.notes || '']);
  }
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

/* =========================================================
   Built-in slip history (public/tracker/data/history.json)
   Records keep fixed ids, so loading twice never duplicates; a local edit (newer updatedAt) wins over the file.
   ========================================================= */
async function loadHistory() {
  try {
    const r = await fetch('/tracker/data/history.json', { cache: 'no-store' });
    if (!r.ok) return;
    const h = await r.json();
    let n = 0;
    const up = (arr, list) => {
      for (const rec of list || []) {
        const i = arr.findIndex((x) => x.id === rec.id);
        if (i < 0) { arr.push(rec); n++; } else if ((rec.updatedAt || 0) > (arr[i].updatedAt || 0)) { arr[i] = rec; n++; }
      }
    };
    up(S.bets, h.bets); up(S.txns, h.txns);
    if (n) { save(); render(); if (L.mode) pollLive(true); }
  } catch {}
}

/* =========================================================
   Boot
   ========================================================= */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/tracker/sw.js', { scope: '/tracker' }).then((reg) => {
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw?.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) toast('Update ready — <a href="#" onclick="location.reload()">reload</a>', '', 8000); });
    });
  }).catch(() => {});
}
render();
loadHistory();
if (L.mode && /add=1/.test(location.hash)) { history.replaceState(null, '', '#/portfolio'); setTimeout(() => document.querySelector('[data-act="add"]')?.click(), 50); }
if (L.mode) {
  pollLive(true);
  if (L.mode === 'cloud') syncNow('pull');
}
