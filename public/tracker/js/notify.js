// Notification center + arrangements (Ticket D). Subscribes to events.js through the api handed over by app.js.
//   initNotify(api)                      log wanted events, keep the bells' unread badge, wire the bells
//   openNotifications('list' | 'prefs')  open the panel (Settings → Notifications · Manage opens 'prefs')
// Log: localStorage 'ebl.notifs.v1' = { v: 1, items: [...] }, newest first, ≤300 items, ≤14 days, deduped by event id.
// Panel: below 900px a full-height sheet from the right; from 900px (where .desk-actions shows) a 400px dropdown
// anchored under the bell. System notifications go through the service worker registration (sw.js opens data.url).

const KEY = 'ebl.notifs.v1';
const PREF_KEY = 'ebl.notif.prefs.v1'; // owned by events.js; only watched here for changes made in another tab
const CAP = 300;
const DAY = 86400000;
const KEEP = 14 * DAY;
const ICON = '/tracker/icons/icon-192.png';
const DESK_MQ = '(min-width: 900px)';
const headshot = (id) => `https://a.espncdn.com/i/headshots/nba/players/full/${encodeURIComponent(id)}.png`;

let api = null;
let items = []; // newest first
let deskMQ = null;
const badImg = new Set(); // image URLs that failed once: render initials / abbreviations instead
const ui = {
  open: false, view: 'list', filter: 'all', acct: 'all', confirm: false,
  layer: null, panel: null, opener: null, tick: 0,
  fresh: new Set(), leaving: new Set(), drag: null, dragEnd: 0, permBusy: false, note: '',
};
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => api.esc(s);

/* ---------- icons (inline SVG, 24 grid, stroked) ---------- */
const P = {
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M7 7l10 10M17 7 7 17"/>',
  pulse: '<path d="M3 12h4l2.2-5 3.6 10 2.2-5H21"/>',
  minus: '<path d="M6 12h12"/>',
  out: '<path d="M7 17 17 7M9 7h8v8"/>',
  play: '<path d="M8 5.8v12.4L18 12z" fill="currentColor"/>',
  flag: '<path d="M6 21V4M6 4h11l-2.5 4 2.5 4H6"/>',
  ticket: '<path d="M4 6.5h16a1 1 0 0 1 1 1V10a2 2 0 0 0 0 4v2.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V14a2 2 0 0 0 0-4V7.5a1 1 0 0 1 1-1z"/><path d="M15 7v1.6M15 11.2v1.6M15 15.4v1.6"/>',
  send: '<path d="M21 3 10 14"/><path d="M21 3l-6.5 18-4.5-7-7-4.5z"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${P[n]}</svg>`;

// state glyph + tone for every event type (the avatar shows who/what, the small badge shows what happened)
const KIND = {
  'leg:hit': ['check', 'good'], 'leg:bust': ['x', 'bad'], 'leg:close': ['pulse', 'warn'], 'leg:void': ['minus', 'info'],
  'slip:won': ['check', 'good'], 'slip:lost': ['x', 'bad'], 'slip:void': ['minus', 'info'], 'slip:cashout': ['out', 'info'],
  'slip:oneaway': ['pulse', 'warn'], 'game:start': ['play', 'info'], 'game:final': ['flag', 'info'],
};
const FILTERS = [
  ['all', 'All', () => true],
  ['hits', 'Hits', (i) => i.type === 'leg:hit' || i.type === 'slip:won'],
  ['busts', 'Busts', (i) => i.type === 'leg:bust' || i.type === 'slip:lost'],
  ['slips', 'Slips', (i) => i.type.startsWith('slip:')],
  ['games', 'Games', (i) => i.type.startsWith('game:')],
];
const FILTER_TYPES = { hits: ['leg:hit', 'slip:won'], busts: ['leg:bust', 'slip:lost'], slips: ['slip:won', 'slip:lost', 'slip:void', 'slip:cashout', 'slip:oneaway'], games: ['game:start', 'game:final'] };
const HINT = {
  'leg:hit': 'A leg clears its line',
  'leg:bust': 'A leg is dead',
  'leg:close': 'Live leg within 1 of its line, 2 for points',
  'leg:void': 'Player sat out and the leg is voided',
  'slip:won': 'Every leg in, slip cashes',
  'slip:lost': 'A slip busts',
  'slip:void': 'Stake comes back',
  'slip:cashout': 'You take a cash-out',
  'slip:oneaway': 'A multi is waiting on its last leg',
  'game:start': 'A game you have slips on tips off',
  'game:final': 'Final score of a game you have slips on',
};
// what matters most when several system notifications land at once
const RANK = { 'slip:won': 9, 'slip:cashout': 8, 'slip:lost': 7, 'slip:oneaway': 6, 'leg:hit': 5, 'leg:bust': 4, 'slip:void': 3, 'leg:close': 3, 'leg:void': 2, 'game:start': 2, 'game:final': 1 };

/* =========================================================
   Log (localStorage)
   ========================================================= */
function prune(list) {
  const cut = Date.now() - KEEP;
  const seen = new Set();
  const out = [];
  for (const i of list) {
    if (!i || !i.id || !i.type || seen.has(i.id) || !(i.at > cut)) continue;
    seen.add(i.id);
    out.push(i);
  }
  out.sort((a, b) => b.at - a.at);
  return out.slice(0, CAP);
}
function load() {
  try {
    const j = JSON.parse(localStorage.getItem(KEY));
    return prune(Array.isArray(j?.items) ? j.items : []);
  } catch { return []; }
}
function save() {
  let list = items;
  for (let n = 0; n < 3; n++) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, items: list })); return; } catch { list = list.slice(0, Math.floor(list.length / 2)); }
  }
}
const team = (t) => (t ? { abbr: t.abbr || '', name: t.name || '', score: t.score ?? null, logo: t.logo || null } : null);
function slim(ev) {
  const g = ev.game;
  const st = ev.stat && ev.stat.value != null && ev.stat.line != null ? { label: ev.stat.label || '', value: ev.stat.value, line: ev.stat.line, side: ev.stat.side || 'O' } : null;
  return {
    id: String(ev.id), type: ev.type, at: Number(ev.at) || Date.now(), tone: ev.tone || KIND[ev.type]?.[1] || 'info',
    acct: ev.acct || null, lab: !!ev.lab, demo: !!ev.demo, catchup: !!ev.catchup,
    betId: ev.betId || null, labId: ev.labId || null, legId: ev.legId || null, gameId: ev.gameId || null,
    title: String(ev.title || api.EVENT_TYPES[ev.type]?.label || 'Alert'), body: String(ev.body || ''),
    amount: typeof ev.amount === 'number' && isFinite(ev.amount) ? ev.amount : null, amountText: ev.amountText || null,
    player: ev.player && (ev.player.id || ev.player.name) ? { id: ev.player.id || null, name: ev.player.name || '' } : null,
    stat: st, slipTitle: ev.slip?.title || null,
    game: g ? { label: g.label || '', away: team(g.away), home: team(g.home) } : null,
    read: false,
  };
}
const unread = () => items.reduce((n, i) => n + (i.read ? 0 : 1), 0);

function onEvent(ev) {
  if (!ev || !api.EVENT_TYPES[ev.type] || !api.wants(ev)) return;
  items = load(); // another tab may have logged it already
  if (items.some((i) => i.id === String(ev.id))) return;
  const it = slim(ev);
  items = prune([it, ...items]);
  save();
  ui.fresh.add(it.id);
  setTimeout(() => ui.fresh.delete(it.id), 1600);
  updateBadge();
  ring();
  if (ui.open) render({ anchor: true });
  if (!ev.demo) queuePush(ev);
}

/* =========================================================
   Bells: badge, ring, aria
   ========================================================= */
const bells = () => [...document.querySelectorAll('[data-notif="toggle"]')];
const visibleBell = () => bells().find((b) => b.getClientRects().length) || bells()[0] || null;
function updateBadge() {
  const n = unread();
  for (const b of bells()) {
    const badge = b.querySelector('.notif-badge');
    if (badge) { badge.textContent = n > 9 ? '9+' : String(n); badge.hidden = n === 0; }
    b.classList.toggle('notif-has', n > 0);
    b.setAttribute('aria-label', n ? `Alerts, ${n} unread` : 'Alerts');
  }
}
let ringT = 0, ringQ = 0;
function ring() {
  if (ringQ) return; // several events from one scan: ring once
  ringQ = setTimeout(() => {
    ringQ = 0;
    for (const b of bells()) { b.classList.remove('notif-ring'); void b.offsetWidth; b.classList.add('notif-ring'); }
    clearTimeout(ringT);
    ringT = setTimeout(() => bells().forEach((b) => b.classList.remove('notif-ring')), 1100);
  }, 30);
}
function setExpanded(on) {
  for (const b of bells()) {
    b.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) b.setAttribute('aria-controls', 'notif-panel'); else b.removeAttribute('aria-controls');
  }
}

/* =========================================================
   Formatting
   ========================================================= */
function dayStart(offset = 0) { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset).getTime(); }
const clock = (t) => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
function rel(at, grouped) {
  const d = Date.now() - at;
  if (d < 45000) return 'Just now';
  if (d < 3600000) return `${Math.max(1, Math.round(d / 60000))}m ago`;
  if (at >= dayStart()) return d < 6 * 3600000 ? `${Math.floor(d / 3600000)}h ago` : clock(at);
  if (at >= dayStart(-1)) return grouped ? clock(at) : `Yesterday ${clock(at)}`;
  if (d < 6 * DAY) return `${new Date(at).toLocaleDateString([], { weekday: 'short' })} ${clock(at)}`;
  return new Date(at).toLocaleDateString([], { day: 'numeric', month: 'short' });
}
const fullTime = (at) => new Date(at).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
function initials(name) {
  const w = String(name || '').replace(/[^\p{L}\s'-]/gu, '').split(/[\s-]+/).filter(Boolean);
  if (!w.length) return '?';
  return (w.length === 1 ? w[0].slice(0, 2) : w[0][0] + w[w.length - 1][0]).toUpperCase();
}
const num = (v) => (Math.round(Number(v) * 10) / 10).toString();
const okUrl = (u) => typeof u === 'string' && /^https:\/\//.test(u) && !badImg.has(u);
const img = (u, cls) => (okUrl(u) ? `<img class="${cls}" src="${esc(u)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : '');

/* =========================================================
   Filtering + grouping
   ========================================================= */
const accounts = () => (api.accounts() || []).filter(Boolean);
// a specific account shows its own alerts plus the shared game alerts; Lab (paper) lives under "All accounts"
const acctMatch = (i) => ui.acct === 'all' || i.acct === ui.acct || (!i.acct && !i.lab && i.type.startsWith('game:'));
const filterFn = () => (FILTERS.find((f) => f[0] === ui.filter) || FILTERS[0])[2];
const visible = () => items.filter((i) => !ui.leaving.has(i.id) && acctMatch(i) && filterFn()(i));

function byTime(list) {
  const t0 = dayStart(), y0 = dayStart(-1);
  const g = [['Today', []], ['Yesterday', []], ['Earlier', []]];
  for (const i of list) g[i.at >= t0 ? 0 : i.at >= y0 ? 1 : 2][1].push(i);
  return g.filter(([, xs]) => xs.length).map(([title, xs]) => ({ key: title, title, items: xs, grouped: title !== 'Earlier' }));
}
function slipName(i) {
  if (i.slipTitle) return i.slipTitle;
  const m = / — (.+)$/.exec(i.body || '');
  return m ? m[1] : i.title;
}
const STATUS = { 'slip:won': ['Cashed', 'good'], 'slip:lost': ['Busted', 'bad'], 'slip:void': ['Voided', 'info'], 'slip:cashout': ['Cashed out', 'info'] };
function bySlip(list) {
  const map = new Map();
  for (const i of list) {
    const k = i.demo ? 'demo' : i.type.startsWith('game:') ? 'games' : i.lab ? `lab:${i.labId || slipName(i)}` : i.betId ? `bet:${i.betId}` : `one:${i.id}`;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(i);
  }
  return [...map.entries()].map(([k, xs]) => {
    if (k === 'games') return { key: k, title: 'Games', items: xs };
    if (k === 'demo') return { key: k, title: 'Test alerts', items: xs };
    const settled = xs.find((i) => STATUS[i.type]);
    const named = xs.find((i) => i.slipTitle) || xs.find((i) => / — /.test(i.body)) || xs[xs.length - 1];
    const st = settled ? STATUS[settled.type] : xs.some((i) => i.type === 'slip:oneaway') ? ['One leg away', 'warn'] : ['Open', 'mute'];
    return {
      key: k, title: slipName(named), items: xs, acct: xs[0].acct, lab: xs[0].lab,
      status: st, amountText: settled && settled.amountText && settled.amount ? settled.amountText : null,
    };
  });
}

/* =========================================================
   Templates
   ========================================================= */
function teamDisc(t, pos) {
  if (!t) return '';
  return `<span class="notif-team notif-team-${pos}"><span class="notif-abbr">${esc(t.abbr)}</span>${img(t.logo, 'notif-logo')}</span>`;
}
function avatar(i) {
  const [glyph, tone] = KIND[i.type] || ['minus', 'info'];
  const badge = `<span class="notif-st notif-t-${tone}">${icon(glyph)}</span>`;
  const g = i.game;
  if (i.player) {
    return `<span class="notif-av"><span class="notif-ini">${esc(initials(i.player.name))}</span>${i.player.id ? img(headshot(i.player.id), 'notif-shot') : ''}${badge}</span>`;
  }
  if (g && i.type.startsWith('leg:')) {
    // team markets (ML / spread): the picked team's logo; totals: both teams
    const t = [g.away, g.home].find((x) => x && x.name && i.title.startsWith(x.name));
    if (t) return `<span class="notif-av notif-av-team"><span class="notif-abbr">${esc(t.abbr)}</span>${img(t.logo, 'notif-logo')}${badge}</span>`;
  }
  if (g && (g.away || g.home)) return `<span class="notif-av notif-av-game">${teamDisc(g.away, 'a')}${teamDisc(g.home, 'h')}${badge}</span>`;
  return `<span class="notif-av notif-av-slip">${icon('ticket')}${badge}</span>`;
}
function figure(i) {
  if (i.amountText && !(i.type === 'slip:void' && !i.amount)) return `<span class="notif-num notif-c-${i.tone}">${esc(i.amountText)}</span>`;
  if (i.stat) return `<span class="notif-num notif-c-${i.tone}">${esc(num(i.stat.value))}<span class="notif-of">/${esc(num(i.stat.line))}</span></span>`;
  return '';
}
function itemHTML(i, grouped, showAcct, awayInline = true, slipName = '') {
  const body = slipName && i.body.endsWith(` — ${slipName}`) ? i.body.slice(0, -(slipName.length + 3)) : i.body; // the group header names the slip
  const tags = [];
  if (showAcct && i.acct) tags.push(`<span class="notif-who">${esc(i.acct)}</span>`);
  if (i.lab) tags.push('<span class="notif-tag">Lab</span>');
  if (i.demo) tags.push('<span class="notif-tag">Test</span>');
  if (i.catchup) tags.push(awayInline ? '<span class="notif-away">While you were away</span>' : '<span class="notif-vh">While you were away</span>');
  const id = esc(i.id);
  return `<li class="notif-item${i.read ? '' : ' is-unread'}" data-id="${id}">
    <span class="notif-under" aria-hidden="true"><span>${icon('x')}Remove</span><span>Remove${icon('x')}</span></span>
    <div class="notif-slide${ui.fresh.has(i.id) ? ' is-fresh' : ''}">
      <button type="button" class="notif-main" data-n="open" data-nk="item:${id}">
        <span class="notif-dot" aria-hidden="true"></span>
        ${avatar(i)}
        <span class="notif-txt">
          <span class="notif-ttl">${i.read ? '' : '<span class="notif-vh">Unread: </span>'}${esc(i.title)}</span>${figure(i)}
          ${body ? `<span class="notif-bd">${esc(body)}</span>` : ''}
          <span class="notif-meta"><time datetime="${new Date(i.at).toISOString()}" data-at="${i.at}" data-g="${grouped ? 1 : 0}" title="${esc(fullTime(i.at))}">${esc(rel(i.at, grouped))}</time>${tags.join('')}</span>
        </span>
      </button>
      <button type="button" class="notif-x" data-n="remove" data-nk="x:${id}" aria-label="Remove alert: ${esc(i.title)}">${icon('close')}</button>
    </div>
  </li>`;
}
function groupHead(g, idx) {
  if (!g.status) return `<h3 class="notif-grp-h" id="notif-g${idx}">${esc(g.title)}</h3>`;
  const [label, tone] = g.status;
  const sub = [g.acct && accounts().length > 1 ? esc(g.acct) : '', g.lab ? 'Lab' : ''].filter(Boolean).map((s) => `<span>${s}</span>`).join('');
  return `<h3 class="notif-grp-h notif-grp-slip" id="notif-g${idx}">
    <span class="notif-grp-t">${esc(g.title)}${sub ? `<span class="notif-grp-sub">${sub}</span>` : ''}</span>
    <span class="notif-grp-st notif-c-${tone}">${label}${g.amountText ? ` <b>${esc(g.amountText)}</b>` : ''}</span>
  </h3>`;
}
function headHTML() {
  if (ui.view === 'prefs') {
    return `<div class="notif-bar is-sub">
      <button type="button" class="notif-ibtn" data-n="back" data-nk="back" aria-label="Back to alerts">${icon('back')}</button>
      <h2 class="notif-title" id="notif-title">Arrange alerts</h2>
      <button type="button" class="notif-ibtn" data-n="close" data-nk="close" aria-label="Close">${icon('close')}</button>
    </div>`;
  }
  const n = unread();
  const accts = accounts();
  if (ui.acct !== 'all' && !accts.includes(ui.acct)) ui.acct = 'all';
  const base = items.filter(acctMatch);
  const chips = FILTERS.map(([k, label, fn]) => `<button type="button" class="notif-chip" data-n="filter" data-v="${k}" data-nk="filter:${k}" aria-pressed="${ui.filter === k}">${label}<span class="notif-chip-n">${base.filter(fn).length}</span></button>`).join('');
  const seg = accts.length > 1
    ? `<div class="notif-seg" role="group" aria-label="Account">${['all', ...accts].map((a) => `<button type="button" data-n="acct" data-v="${esc(a)}" data-nk="acct:${esc(a)}" aria-pressed="${ui.acct === a}"><span>${a === 'all' ? 'All accounts' : esc(a)}</span></button>`).join('')}</div>`
    : '';
  return `<div class="notif-bar">
      <h2 class="notif-title" id="notif-title">Alerts${n ? `<span class="notif-unread">${n} unread</span>` : ''}</h2>
      ${items.length ? `<button type="button" class="notif-tbtn is-accent" data-n="readall" data-nk="readall"${n ? '' : ' aria-disabled="true"'}>Mark all read</button>` : ''}
      <button type="button" class="notif-ibtn" data-n="prefs" data-nk="prefs" aria-label="Arrange alerts">${icon('gear')}</button>
      <button type="button" class="notif-ibtn" data-n="close" data-nk="close" aria-label="Close alerts">${icon('close')}</button>
    </div>
    ${items.length ? `<div class="notif-filters"><div class="notif-chips" role="group" aria-label="Show">${chips}</div>${seg}</div>` : ''}`;
}
function emptyHTML() {
  if (!items.length) {
    return `<div class="notif-empty">
      <span class="notif-empty-ic">${icon('bell')}</span>
      <p class="notif-empty-t">No alerts yet</p>
      <p class="notif-empty-b">Leg hits, busts, cash-outs and tip-offs on your slips land here as they happen.</p>
      <button type="button" class="notif-tbtn is-outline" data-n="prefs" data-nk="empty-prefs">Arrange alerts</button>
    </div>`;
  }
  const what = { all: 'alerts', hits: 'hits', busts: 'busts', slips: 'slip alerts', games: 'game alerts' }[ui.filter];
  const who = ui.acct !== 'all' ? ` for ${esc(ui.acct)}` : '';
  const types = FILTER_TYPES[ui.filter] || [];
  const prefs = api.getPrefs();
  const off = types.length && types.every((t) => prefs.types[t] === false);
  const offNames = types.map((t) => api.EVENT_TYPES[t]?.label).filter(Boolean).join(' and ');
  return `<div class="notif-empty">
    <span class="notif-empty-ic">${icon('bell')}</span>
    <p class="notif-empty-t">No ${what}${who}</p>
    <p class="notif-empty-b">${off ? `${esc(offNames)} alerts are turned off.` : 'Nothing in the last 14 days.'}</p>
    ${off ? '<button type="button" class="notif-tbtn is-outline" data-n="prefs" data-nk="empty-prefs">Arrange alerts</button>' : '<button type="button" class="notif-tbtn is-outline" data-n="showall" data-nk="showall">Show all alerts</button>'}
  </div>`;
}
function listHTML() {
  const list = visible();
  if (!list.length) return emptyHTML();
  const showAcct = accounts().length > 1;
  const slipMode = api.getPrefs().groupBy === 'slip';
  const groups = slipMode ? bySlip(list) : byTime(list);
  // time view: alerts found on reopening the app sit under one "While you were away" divider per run
  const rows = (g) => {
    let prev = false;
    return g.items.map((i) => {
      const run = !slipMode && i.catchup && !prev ? '<li class="notif-run" aria-hidden="true"><span>While you were away</span></li>' : '';
      prev = i.catchup;
      return run + itemHTML(i, !slipMode && g.grouped, showAcct && !(slipMode && g.status), slipMode, slipMode && g.status ? g.title : '');
    }).join('');
  };
  const html = groups.map((g, idx) => `<section class="notif-grp" aria-labelledby="notif-g${idx}">${groupHead(g, idx)}
    <ul class="notif-list" role="list">${rows(g)}</ul></section>`).join('');
  const foot = ui.confirm
    ? `<div class="notif-foot is-confirm" role="group" aria-labelledby="notif-cq">
        <p id="notif-cq">Clear all ${items.length} alert${items.length === 1 ? '' : 's'} on this device?</p>
        <span class="notif-foot-a"><button type="button" class="notif-tbtn" data-n="clear-no" data-nk="clear-no">Cancel</button><button type="button" class="notif-tbtn is-danger" data-n="clear-yes" data-nk="clear-yes">Clear all</button></span>
      </div>`
    : `<div class="notif-foot"><p>Alerts stay on this device for 14 days.</p><button type="button" class="notif-tbtn" data-n="clear" data-nk="clear">Clear all</button></div>`;
  return html + foot;
}

/* ---------- arrangements ---------- */
function sw(on, attrs, label, hint, id, disabled = false) {
  return `<button type="button" class="notif-row" role="switch" aria-checked="${on}" aria-labelledby="${id}-l"${hint ? ` aria-describedby="${id}-h"` : ''}${disabled ? ' aria-disabled="true"' : ''} ${attrs}>
    <span class="notif-row-txt"><span class="notif-row-l" id="${id}-l">${label}</span>${hint ? `<span class="notif-row-h" id="${id}-h">${hint}</span>` : ''}</span>
    <span class="notif-sw" aria-hidden="true"></span>
  </button>`;
}
function pushState() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  return Notification.permission === 'granted' && api.getPrefs().push ? 'on' : 'off';
}
function prefsHTML() {
  const p = api.getPrefs();
  const T = api.EVENT_TYPES;
  const sec = (title, id, body) => `<section class="notif-sec" aria-labelledby="np-${id}"><h3 class="notif-sec-h" id="np-${id}">${title}</h3>${body}</section>`;
  const types = (group) => Object.entries(T).filter(([, d]) => d.group === group)
    .map(([t, d]) => sw(p.types[t] !== false, `data-n="type" data-v="${t}" data-nk="type:${t}"`, esc(d.label), HINT[t] || '', `np-t-${t.replace(':', '-')}`)).join('');
  const accts = accounts();
  const following = (a) => !p.accounts.length || p.accounts.includes(a);
  const follow = accts.map((a, k) => sw(following(a), `data-n="follow" data-v="${esc(a)}" data-nk="follow:${esc(a)}"`, esc(a), '', `np-a-${k}`)).join('')
    + sw(!!p.lab, 'data-n="bool" data-v="lab" data-nk="bool:lab"', 'Lab paper legs', 'Boards and paper slips from the Lab', 'np-lab');
  const ps = pushState();
  const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(matchMedia('(display-mode: standalone)').matches || navigator.standalone);
  const psLabel = ui.permBusy ? 'Waiting for your answer…' : { on: 'On', off: 'Off', blocked: 'Blocked by browser', unsupported: 'Not available in this browser' }[ps];
  const psFix = ps === 'blocked' ? 'Allow notifications for this site in your browser settings, then come back here.'
    : ps === 'unsupported' ? (iOS ? 'On iPhone, add the app to your Home Screen first.' : 'This browser can’t show system notifications.') : '';
  const group = p.groupBy === 'slip' ? 'slip' : 'time';
  return `<div class="notif-prefs">
    ${sec('Legs', 'legs', types('legs'))}
    ${sec('Slips', 'slips', types('slips'))}
    ${sec('Games', 'games', types('games'))}
    ${sec('Accounts to follow', 'follow', accts.length ? follow : sw(!!p.lab, 'data-n="bool" data-v="lab" data-nk="bool:lab"', 'Lab paper legs', 'Boards and paper slips from the Lab', 'np-lab'))}
    <p class="notif-hint-line" id="np-follow-msg" role="status">${ui.note === 'follow' ? 'Follow at least one account.' : ''}</p>
    ${sec('While the app is open', 'open', sw(!!p.popups, 'data-n="bool" data-v="popups" data-nk="bool:popups"', 'Pop-ups', 'Hit and settle pop-ups on screen', 'np-pop')
      + sw(!!p.sound, 'data-n="bool" data-v="sound" data-nk="bool:sound"', 'Sound', 'A short sound with pop-ups', 'np-snd')
      + sw(!!p.haptics, 'data-n="bool" data-v="haptics" data-nk="bool:haptics"', 'Haptics', 'Vibrate on hits and wins (phones)', 'np-hap'))}
    ${sec('Alert list', 'list', `<div class="notif-row is-static"><span class="notif-row-txt"><span class="notif-row-l" id="np-grp-l">Group alerts by</span></span>
      <span class="notif-seg is-inline" role="group" aria-labelledby="np-grp-l">
        <button type="button" data-n="group" data-v="time" data-nk="group:time" aria-pressed="${group === 'time'}"><span>Time</span></button>
        <button type="button" data-n="group" data-v="slip" data-nk="group:slip" aria-pressed="${group === 'slip'}"><span>Slip</span></button>
      </span></div>`)}
    ${sec('Outside the app', 'push', sw(ps === 'on', 'data-n="push" data-nk="push"', 'System notifications', `<span class="notif-ps notif-ps-${ps}">${psLabel}</span>`, 'np-push', ps === 'blocked' || ps === 'unsupported' || ui.permBusy)
      + `<p class="notif-row-note">${psFix ? `<b>${psFix}</b> ` : ''}Phones only alert while the app is open or in the background.</p>`)}
    <div class="notif-test">
      <button type="button" class="notif-testbtn" data-n="test" data-nk="test">${icon('send')}Send test alert</button>
      <p class="notif-note" role="status">${ui.note && ui.note !== 'follow' ? esc(ui.note) : 'Fires a demo cashed slip through pop-ups, this list and system notifications.'}</p>
    </div>
  </div>`;
}

// Keep the arrangements DOM and only flip states, so a toggle animates instead of being re-rendered
function patchPrefs() {
  if (!ui.panel || ui.view !== 'prefs') return;
  const p = api.getPrefs();
  const following = (a) => !p.accounts.length || p.accounts.includes(a);
  for (const el of ui.panel.querySelectorAll('[data-n]')) {
    const v = el.dataset.v;
    switch (el.dataset.n) {
      case 'type': el.setAttribute('aria-checked', String(p.types[v] !== false)); break;
      case 'follow': el.setAttribute('aria-checked', String(following(v))); break;
      case 'bool': el.setAttribute('aria-checked', String(!!p[v])); break;
      case 'group': el.setAttribute('aria-pressed', String((p.groupBy === 'slip' ? 'slip' : 'time') === v)); break;
      case 'push': if (el.getAttribute('aria-checked') !== String(pushState() === 'on')) { render(); return; } break;
    }
  }
  const msg = ui.panel.querySelector('#np-follow-msg');
  if (msg) msg.textContent = ui.note === 'follow' ? 'Follow at least one account.' : '';
}

/* =========================================================
   Panel
   ========================================================= */
function render({ anchor = false, reset = false, focus = null } = {}) {
  if (!ui.open || !ui.panel) return;
  const head = ui.panel.querySelector('.notif-head');
  const body = ui.panel.querySelector('.notif-body');
  const ae = document.activeElement;
  const key = focus || (ae && ui.panel.contains(ae) ? ae.dataset?.nk : null);
  const top = body.scrollTop, h = body.scrollHeight;
  ui.panel.dataset.view = ui.view;
  head.innerHTML = headHTML();
  body.innerHTML = ui.view === 'prefs' ? prefsHTML() : listHTML();
  body.scrollTop = reset ? 0 : anchor && top > 0 ? top + (body.scrollHeight - h) : top;
  if (key) {
    const el = [...ui.panel.querySelectorAll('[data-nk]')].find((x) => x.dataset.nk === key);
    (el || ui.panel).focus({ preventScroll: true });
    if (el && focus) el.scrollIntoView?.({ block: 'nearest' });
  }
}

function place() {
  if (!ui.layer) return;
  const desk = deskMQ.matches;
  ui.layer.classList.toggle('is-drop', desk);
  ui.layer.classList.toggle('is-sheet', !desk);
  document.documentElement.classList.toggle('notif-lock', !desk);
  const s = ui.panel.style;
  if (!desk) { s.top = s.right = s.maxHeight = ''; return; }
  const b = visibleBell();
  const r = b && b.getClientRects().length ? b.getBoundingClientRect() : { bottom: 56, right: innerWidth - 24 };
  const vw = document.documentElement.clientWidth;
  const top = Math.round(r.bottom + 8);
  s.top = `${top}px`;
  s.right = `${Math.max(8, Math.round(vw - r.right))}px`;
  s.maxHeight = `${Math.max(260, Math.min(720, innerHeight - top - 16))}px`;
}

function open(view = 'list', opener = null) {
  ui.view = view === 'prefs' ? 'prefs' : 'list';
  ui.confirm = false;
  if (ui.note === 'follow') ui.note = '';
  if (ui.open) { render({ reset: true }); ui.panel.focus({ preventScroll: true }); return; }
  items = load();
  ui.open = true;
  const ae = document.activeElement;
  ui.opener = opener || (ae && ae !== document.body && !ui.layer?.contains(ae) ? ae : visibleBell());
  const layer = document.createElement('div');
  layer.className = 'notif-layer';
  layer.innerHTML = `<div class="notif-scrim" data-n="scrim"></div>
    <section class="notif-panel" id="notif-panel" role="dialog" aria-modal="true" aria-labelledby="notif-title" tabindex="-1">
      <header class="notif-head"></header>
      <div class="notif-body"></div>
    </section>`;
  api.root.appendChild(layer);
  ui.layer = layer;
  ui.panel = layer.querySelector('.notif-panel');
  layer.addEventListener('click', onClick);
  layer.addEventListener('keydown', onKey);
  layer.addEventListener('pointerdown', onDown);
  layer.addEventListener('pointermove', onMove);
  layer.addEventListener('pointerup', onUp);
  layer.addEventListener('pointercancel', onCancel);
  document.addEventListener('pointerdown', onOutside, true);
  window.addEventListener('resize', place);
  window.addEventListener('scroll', place, { passive: true });
  place();
  render({ reset: true });
  setExpanded(true);
  ui.panel.focus({ preventScroll: true });
  clearInterval(ui.tick);
  ui.tick = setInterval(tickTimes, 30000);
  api.pushBack?.('notif', () => close({ fromBack: true })); // Android back / browser back closes the panel
}

function close({ restore = true, fromBack = false } = {}) {
  if (!ui.open) return;
  if (!fromBack) api.popBack?.('notif');
  ui.open = false;
  ui.confirm = false;
  ui.drag = null;
  const layer = ui.layer;
  ui.layer = null;
  ui.panel = null;
  clearInterval(ui.tick);
  document.removeEventListener('pointerdown', onOutside, true);
  window.removeEventListener('resize', place);
  window.removeEventListener('scroll', place);
  document.documentElement.classList.remove('notif-lock');
  setExpanded(false);
  if (layer) {
    layer.inert = true;
    layer.classList.add('is-leaving');
    let gone = false;
    const done = () => { if (!gone) { gone = true; layer.remove(); } };
    if (reduceMotion()) done(); else { layer.addEventListener('animationend', done); setTimeout(done, 320); }
  }
  const op = ui.opener;
  ui.opener = null;
  if (restore) {
    const t = op && op.isConnected && op.getClientRects().length && !op.closest('.notif-layer') ? op : visibleBell();
    t?.focus({ preventScroll: true });
  }
}

function tickTimes() {
  if (!ui.panel) return;
  for (const t of ui.panel.querySelectorAll('time[data-at]')) t.textContent = rel(Number(t.dataset.at), t.dataset.g === '1');
}

/* ---------- actions ---------- */
function markRead(id) {
  let changed = false;
  for (const i of items) if ((id == null || i.id === id) && !i.read) { i.read = true; changed = true; }
  if (changed) { save(); updateBadge(); }
  return changed;
}
function openItem(id) {
  const it = items.find((i) => i.id === id);
  if (!it) return;
  markRead(id);
  close();
  if (it.demo) return;
  if (it.lab) api.go('lab');
  else if (it.betId) api.openSlip(it.betId);
  else api.go('live');
}
function neighbourKey(id) {
  const ids = [...(ui.panel?.querySelectorAll('.notif-item') || [])].map((li) => li.dataset.id);
  const k = ids.indexOf(id);
  const n = ids[k + 1] ?? ids[k - 1];
  return n ? `item:${n}` : null;
}
function removeItem(id, dir = 0) {
  const li = ui.panel && [...ui.panel.querySelectorAll('.notif-item')].find((x) => x.dataset.id === id);
  const focusKey = neighbourKey(id) || (items.length > 1 ? 'clear' : 'prefs');
  const finish = () => {
    ui.leaving.delete(id);
    items = items.filter((i) => i.id !== id);
    save();
    updateBadge();
    render({ focus: ui.panel?.contains(document.activeElement) || document.activeElement === document.body ? focusKey : null });
  };
  if (!li || reduceMotion()) return finish();
  ui.leaving.add(id);
  li.style.height = `${li.offsetHeight}px`;
  void li.offsetHeight; // commit the measured height so the collapse transitions from it
  li.classList.add('is-leaving');
  const slide = li.querySelector('.notif-slide');
  if (dir) slide.style.transform = `translateX(${dir < 0 ? -100 : 100}%)`;
  li.style.height = '0px';
  setTimeout(finish, 270);
}
function clearAll() {
  items = [];
  ui.confirm = false;
  ui.filter = 'all';
  save();
  updateBadge();
  render({ reset: true, focus: 'empty-prefs' });
}
function setFollow(name) {
  const p = api.getPrefs();
  const accts = accounts();
  const cur = p.accounts.length ? accts.filter((a) => p.accounts.includes(a)) : accts.slice();
  const next = cur.includes(name) ? cur.filter((a) => a !== name) : [...cur, name];
  if (!next.length) { ui.note = 'follow'; patchPrefs(); return; }
  ui.note = '';
  api.setPrefs({ accounts: next.length === accts.length ? [] : accts.filter((a) => next.includes(a)) });
}
function askPermission() {
  return new Promise((resolve) => {
    try {
      const r = Notification.requestPermission((v) => resolve(v)); // old Safari: callback only
      if (r && typeof r.then === 'function') r.then(resolve, () => resolve(Notification.permission));
    } catch { resolve(Notification.permission); }
  });
}
async function togglePush() {
  const st = pushState();
  if (ui.permBusy) return;
  if (st === 'unsupported' || st === 'blocked') { render(); return; } // permission changed under us: show it
  if (st === 'on') { api.setPrefs({ push: false }); return; }
  const ask = askPermission(); // inside the tap, before any await
  ui.permBusy = true;
  render();
  const res = await ask;
  ui.permBusy = false;
  if (res === 'granted') api.setPrefs({ push: true });
  else render();
}
function sendTest() {
  const p = api.getPrefs();
  const accts = accounts();
  const acct = (p.accounts.length ? accts.find((a) => p.accounts.includes(a)) : null) || accts[0] || null;
  const stake = 20, odds = 3.4, payout = stake * odds, profit = payout - stake;
  const m = api.money;
  const ev = {
    type: 'slip:won', id: `demo|slip:won|${Date.now()}`, demo: true, at: Date.now(), catchup: false, tone: 'good',
    acct, lab: false, betId: null, legId: null, labId: null, gameId: null,
    title: 'Slip cashed · 2-leg SGM', body: `${m(stake)} @${odds.toFixed(2)} → ${m(payout)}`,
    amount: profit, amountText: m(profit, { sign: true }),
    player: null, stat: null, game: null,
    slip: { title: '2-leg SGM', stake, odds, legsHit: 2, legsTotal: 2, potential: payout, potentialText: m(payout) },
  };
  const wanted = api.wants(ev);
  api.emit(ev);
  const pushed = wanted && pushState() === 'on';
  if (pushed) showSystem([{ ...ev, title: `Test · ${ev.title}` }]);
  ui.note = !wanted ? 'Slip won alerts are off, so the test was skipped. Turn them on above.'
    : !p.popups ? `Sent to your alert list. Pop-ups are off${pushed ? '; a system notification was sent too' : ''}.`
    : `Sent. Watch for the pop-up${pushed ? ' and the system notification' : ''}; it’s in your alert list too.`;
  render({ focus: 'test' });
}

/* ---------- events on the panel ---------- */
function onClick(e) {
  const t = e.target.closest('[data-n]');
  if (!t || !ui.layer || !ui.layer.contains(t)) return;
  if (t.getAttribute('aria-disabled') === 'true') return;
  const v = t.dataset.v;
  switch (t.dataset.n) {
    case 'scrim': case 'close': close(); break;
    case 'prefs': ui.view = 'prefs'; ui.confirm = false; render({ reset: true, focus: 'back' }); break;
    case 'back': ui.view = 'list'; ui.note = ui.note === 'follow' ? '' : ui.note; render({ reset: true, focus: 'prefs' }); break;
    case 'readall': markRead(null); render(); break;
    case 'filter': ui.filter = v; render(); break;
    case 'acct': ui.acct = v; render(); break;
    case 'showall': ui.filter = 'all'; ui.acct = 'all'; render({ focus: 'filter:all' }); break;
    case 'open': if (performance.now() - ui.dragEnd > 350) openItem(t.closest('.notif-item')?.dataset.id); break;
    case 'remove': removeItem(t.closest('.notif-item')?.dataset.id); break;
    case 'clear': ui.confirm = true; render({ focus: 'clear-no' }); break;
    case 'clear-no': ui.confirm = false; render({ focus: 'clear' }); break;
    case 'clear-yes': clearAll(); break;
    case 'type': { const on = api.getPrefs().types[v] !== false; api.setPrefs({ types: { [v]: !on } }); break; }
    case 'follow': setFollow(v); break;
    case 'bool': api.setPrefs({ [v]: !api.getPrefs()[v] }); break;
    case 'group': api.setPrefs({ groupBy: v === 'slip' ? 'slip' : 'time' }); break;
    case 'push': togglePush(); break;
    case 'test': sendTest(); break;
  }
}
function focusables() {
  return [...ui.panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.disabled && el.getClientRects().length);
}
function onKey(e) {
  if (!ui.panel) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation(); // one Esc closes one layer: don't also close a sheet underneath
    if (ui.confirm) { ui.confirm = false; render({ focus: 'clear' }); return; }
    close();
    return;
  }
  e.stopPropagation(); // keep app.js shortcuts (N = new slip, Enter = unlock) out of the dialog
  if (e.key === 'Tab') {
    const f = focusables();
    if (!f.length) return;
    const a = document.activeElement;
    if (e.shiftKey && (a === f[0] || a === ui.panel)) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && a === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    return;
  }
  const main = e.target.closest?.('.notif-main');
  if (!main) return;
  const all = [...ui.panel.querySelectorAll('.notif-main')];
  const k = all.indexOf(main);
  const to = { ArrowDown: k + 1, ArrowUp: k - 1, Home: 0, End: all.length - 1 }[e.key];
  if (to != null) { e.preventDefault(); all[Math.max(0, Math.min(all.length - 1, to))]?.focus(); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeItem(main.closest('.notif-item').dataset.id); }
}
function onOutside(e) {
  if (!ui.open || !ui.layer || ui.layer.classList.contains('is-sheet')) return;
  if (ui.panel.contains(e.target) || e.target.closest?.('[data-notif="toggle"]')) return;
  close({ restore: false });
}

/* ---------- swipe to remove ---------- */
function onDown(e) {
  if (e.button !== 0 || e.target.closest('.notif-x')) return;
  const slide = e.target.closest('.notif-slide');
  if (!slide) return;
  ui.drag = { slide, li: slide.closest('.notif-item'), x: e.clientX, y: e.clientY, dx: 0, t: performance.now(), id: e.pointerId, on: false };
}
function onMove(e) {
  const d = ui.drag;
  if (!d || e.pointerId !== d.id) return;
  const dx = e.clientX - d.x, dy = e.clientY - d.y;
  if (!d.on) {
    if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { ui.drag = null; return; }
    if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    d.on = true;
    try { d.slide.setPointerCapture(e.pointerId); } catch {}
    d.li.classList.add('is-drag');
  }
  e.preventDefault();
  d.dx = dx;
  d.slide.style.transform = `translateX(${dx}px)`;
  d.li.classList.toggle('is-armed', Math.abs(dx) > d.li.offsetWidth * 0.35);
}
function onUp(e) {
  const d = ui.drag;
  ui.drag = null;
  if (!d || !d.on || e.pointerId !== d.id) return;
  ui.dragEnd = performance.now();
  d.li.classList.remove('is-drag', 'is-armed');
  const w = d.li.offsetWidth;
  const v = Math.abs(d.dx) / Math.max(1, performance.now() - d.t);
  if (Math.abs(d.dx) > w * 0.35 || (v > 0.65 && Math.abs(d.dx) > 48)) removeItem(d.li.dataset.id, Math.sign(d.dx));
  else d.slide.style.transform = '';
}
function onCancel() {
  const d = ui.drag;
  ui.drag = null;
  if (d?.on) { d.li.classList.remove('is-drag', 'is-armed'); d.slide.style.transform = ''; }
}

/* =========================================================
   System notifications
   ========================================================= */
let pushQ = [], pushT = 0;
const pushOn = () => api.getPrefs().push && 'Notification' in window && Notification.permission === 'granted';
const away = () => document.visibilityState !== 'visible' || !document.hasFocus();
function queuePush(ev) {
  if (!pushOn() || !away()) return;
  pushQ.push(ev);
  clearTimeout(pushT);
  pushT = setTimeout(() => { const q = pushQ.splice(0); if (pushOn() && away()) showSystem(q); }, 500);
}
function swReady(ms = 3000) {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null);
  return Promise.race([navigator.serviceWorker.ready.catch(() => null), new Promise((r) => setTimeout(() => r(null), ms))]);
}
function sysOpts(ev) {
  const extra = [ev.amountText && !`${ev.title} ${ev.body}`.includes(ev.amountText) ? ev.amountText : '', ev.acct && followsSeveral() ? ev.acct : ''].filter(Boolean);
  return {
    body: [ev.body, ...extra].filter(Boolean).join(' · '),
    tag: String(ev.id), icon: ICON, badge: ICON, timestamp: ev.at || Date.now(),
    data: { url: ev.lab ? '/tracker#/lab' : '/tracker#/live' },
  };
}
function followsSeveral() {
  const p = api.getPrefs();
  return accounts().length > 1 && (!p.accounts.length || p.accounts.length > 1);
}
async function showSystem(list) {
  if (!list.length) return;
  const q = [...list].sort((a, b) => (RANK[b.type] || 0) - (RANK[a.type] || 0));
  const solo = q.length > 3 ? q.slice(0, 2) : q;
  const rest = q.length > 3 ? q.slice(2) : [];
  const notes = solo.map((ev) => [ev.title, sysOpts(ev)]);
  if (rest.length) {
    const counts = new Map();
    for (const ev of rest) { const l = api.EVENT_TYPES[ev.type]?.label || 'Alert'; counts.set(l, (counts.get(l) || 0) + 1); }
    notes.push([`${rest.length} more alerts`, {
      body: [...counts].map(([l, n]) => (n > 1 ? `${l} ×${n}` : l)).join(' · '),
      tag: 'ebl-more', icon: ICON, badge: ICON, timestamp: Date.now(),
      data: { url: rest.every((ev) => ev.lab) ? '/tracker#/lab' : '/tracker#/live' },
    }]);
  }
  let reg = null;
  try { reg = await swReady(); } catch {}
  for (const [title, opts] of notes) {
    try {
      if (reg && typeof reg.showNotification === 'function') { await reg.showNotification(title, opts); continue; }
    } catch {}
    try { // no active service worker (first visit, desktop without install): page notification, same click target
      const n = new Notification(title, opts);
      n.onclick = () => { try { window.focus(); location.hash = opts.data.url.split('#')[1] || '/live'; n.close(); } catch {} };
    } catch {} // Android Chrome only allows the service worker path; nothing else to do
  }
}

/* =========================================================
   Public
   ========================================================= */
export function initNotify(a) {
  if (api) return;
  api = a;
  deskMQ = matchMedia(DESK_MQ);
  items = load();
  save();
  updateBadge();
  setExpanded(false);
  api.on('*', onEvent);
  api.on('prefs', () => {
    if (!ui.open) return;
    if (ui.note === 'follow') ui.note = '';
    if (ui.view === 'prefs') patchPrefs(); else render();
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('[data-notif="toggle"]');
    if (!b) return;
    e.preventDefault();
    if (ui.open) close();
    else open('list', visibleBell());
  });
  const flip = () => { if (ui.open) { place(); render(); } };
  if (deskMQ.addEventListener) deskMQ.addEventListener('change', flip); else deskMQ.addListener?.(flip);
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) { items = load(); updateBadge(); if (ui.open) render(); }
    if (e.key === PREF_KEY && ui.open) render();
  });
  // a failed headshot / logo: drop it and remember, so the initials or team abbreviation show from now on
  api.root.addEventListener('error', (e) => {
    const t = e.target;
    if (t && t.tagName === 'IMG') { badImg.add(t.currentSrc || t.src); t.remove(); }
  }, true);
  try {
    navigator.permissions?.query({ name: 'notifications' }).then((s) => { s.onchange = () => { if (ui.open) render(); }; }).catch(() => {});
  } catch {}
}

export function openNotifications(view = 'list') {
  if (!api) return;
  open(view);
}
