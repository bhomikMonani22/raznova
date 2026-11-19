// Hit & settle pop-ups (Ticket C). Subscribes to events.js through the api handed over by app.js.
//
// Three surfaces, all rendered into api.root (#fx-root):
//   top lane     compact pops: leg hit / close call / bust / void, one leg away, tip-off, final, voided slips and
//                small cash-outs, plus the single "While you were away" card. At most 3 on screen, newest on top.
//                They slide out from under the top bar (desktop: under the header row, right-aligned below the bell).
//   bottom lane  the quiet lost card, just above the tab bar.
//   stage        the big CASHED card (slip won, cash-out in profit) over a dimmed backdrop, one at a time. While it
//                is up the lanes are held (hidden, timers paused) and come back when it closes.
// Rules: only with prefs.popups and api.wants(ev); catch-up events never pop one by one (one summary card instead);
// 3+ leg events within 1.5s collapse into one pop; haptics/sound only for hits and wins; reduced motion = fades.

const POP_MS = 3500; // compact pop
const LOST_MS = 5000; // quiet lost card
const AWAY_MS = 9000; // "While you were away"
const BIG_MS = 6000; // CASHED card
const BIG_QUEUED_MS = 4500; // CASHED card while another one waits behind it
const MAX_TOP = 3;
const GAP = 8;
const COLLAPSE_AT = 3;
const WINDOW_MS = 1500; // leg collapse window, catch-up collection, lost-card merge
const STAGGER_IN = 90; // pops of one batch enter one after another
const STAGGER_OUT = 600; // ...and drain bottom-up
const IMPACT_MS = 380; // stamp lands → burst, haptics, chord, count-up
const SHOT = (id) => `https://a.espncdn.com/i/headshots/nba/players/full/${encodeURIComponent(id)}.png`;
const BAD_IMG_KEY = 'ebl.cel.badimg';

let A = null; // api from app.js
let R = null; // #fx-root
let laneTop = null, laneBot = null, srEl = null, probe = null;
const top = { max: MAX_TOP, items: [], queue: [] };
const bot = { max: 1, items: [], queue: [] };
const big = { cur: null, queue: [], stage: null };
let held = false;
let inbox = [], flushT = 0;
let legWin = null; // { at, evs, singles, group }
let cu = null; // catch-up collector { evs, timer, rec }
let awayEvs = []; // live events that arrived while the tab was hidden
const seen = new Map(); // ev.id → time first handled
let seq = 0;
let lastFeedback = 0;
let audioCtx = null;

const RM = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
const reduced = () => RM.matches;
const esc = (s) => (A?.esc ? A.esc(s) : String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`));
const txt = (s) => esc(s).replace(/(\d+-leg)\b/g, '<span class="cel-nw">$1</span>'); // "3-leg SGM" never breaks at the hyphen
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? String(Math.round(n * 10) / 10) : ''; };
const money = (v, o) => (A?.money ? A.money(v, o) : String(v));
const isLeg = (ev) => ev.type.startsWith('leg:');
const isBig = (ev) => ev.type === 'slip:won' || (ev.type === 'slip:cashout' && Number(ev.amount) > 0);
const alive = (r) => r && (r.state === 'queued' || r.state === 'entering' || r.state === 'shown');

const svg = (d) => `<svg class="cel-i" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d}</svg>`;
const I = {
  x: svg('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
  hit: svg('<path d="M5 12.6l4.3 4.3L19 7.4"/>'),
  bust: svg('<path d="M7 7l10 10M17 7L7 17"/>'),
  close: svg('<path d="M12 6.2v7.4"/><path d="M12 17.8v.01"/>'),
  void: svg('<path d="M6.5 12h11"/>'),
  out: svg('<path d="M4 12h12M12 7l5 5-5 5"/><path d="M20 5v14"/>'),
  share: svg('<path d="M12 14.5V3.8M7.6 8.2L12 3.8l4.4 4.4"/><path d="M5 12.5v5.8A2.2 2.2 0 0 0 7.2 20.5h9.6a2.2 2.2 0 0 0 2.2-2.2v-5.8"/>'),
  chev: svg('<path d="M9.5 6l6 6-6 6"/>'),
  arrow: svg('<path d="M4 12h15M14 7l5 5-5 5"/>'),
};
const BADGE = { 'leg:hit': 'hit', 'leg:bust': 'bust', 'leg:close': 'close', 'leg:void': 'void' };
const xBtn = `<button type="button" class="cel-x" data-cel="x" aria-label="Dismiss">${I.x}</button>`;

/* =========================================================
   Boot
   ========================================================= */
export function initCelebrate(api) {
  if (!api || !api.root || A) return;
  A = api;
  R = api.root;
  R.classList.add('cel-root');
  laneTop = div('cel-lane cel-top');
  laneBot = div('cel-lane cel-bot');
  srEl = div('cel-sr');
  srEl.setAttribute('role', 'status');
  srEl.setAttribute('aria-live', 'polite');
  srEl.setAttribute('aria-atomic', 'true');
  R.append(laneTop, laneBot, srEl);
  measure();
  let rz = 0;
  addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(onResize); }, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  addEventListener('keydown', onKey, true);
  addEventListener('pointerdown', primeAudio, { capture: true, passive: true });
  A.on('*', receive);
  A.on('prefs', (p) => { if (p && p.popups === false) clearAll(); });
}

function div(cls) { const d = document.createElement('div'); d.className = cls; return d; }

/* =========================================================
   Intake: filter, dedupe, batch
   ========================================================= */
function receive(ev) {
  if (!ev || typeof ev.type !== 'string' || !A.EVENT_TYPES?.[ev.type]) return;
  const prefs = A.getPrefs();
  if (!prefs.popups || !A.wants(ev, prefs)) return;
  const now = Date.now();
  if (ev.id) {
    const t = seen.get(ev.id);
    if (t && now - t < 60000) return;
    seen.set(ev.id, now);
    if (seen.size > 300) seen.delete(seen.keys().next().value);
  }
  if (ev.catchup) return collectCatchup(ev);
  if (document.visibilityState === 'hidden') { awayEvs.push(ev); return; }
  inbox.push(ev);
  if (!flushT) flushT = setTimeout(flush, 30); // everything from one scan arrives in the same tick
}

function flush() {
  flushT = 0;
  const batch = inbox.splice(0);
  if (!batch.length) return;
  try {
    const bigs = [], losts = [], legs = [], rest = [];
    for (const ev of batch) (isBig(ev) ? bigs : ev.type === 'slip:lost' ? losts : isLeg(ev) ? legs : rest).push(ev);
    // the big moment goes first and holds the lanes, so everything else waits behind it instead of flashing
    if (bigs.length) {
      bigs.sort((a, b) => (+!!a.lab) - (+!!b.lab) || (Number(b.amount) || 0) - (Number(a.amount) || 0));
      big.queue.push(...bigs);
      if (!big.cur && !big.next) nextBig(); else updateNextPill();
    }
    if (losts.length) addLost(losts);
    if (legs.length) addLegs(legs);
    if (rest.length) addTop(rest.map((ev) => rec('pop', [ev])));
    if (!bigs.length && !held && legs.some((e) => e.type === 'leg:hit' && !e.lab)) feedback('hit');
  } catch (err) { console.error('[celebrate]', err); }
}

/* =========================================================
   Records + lanes
   ========================================================= */
function rec(kind, evs) {
  return { key: ++seq, kind, evs, prio: prioOf(kind, evs), state: 'queued', el: null, card: null, h: 0, timer: 0, left: 0, t0: 0, why: new Set(), lane: null, shownAt: 0, rank: 0, dragged: false };
}

function prioOf(kind, evs) {
  if (kind === 'catchup') return 10;
  const P = { 'slip:oneaway': 6, 'leg:hit': 5, 'leg:bust': 4, 'slip:cashout': 3, 'slip:void': 3, 'leg:close': 3, 'leg:void': 1, 'game:start': 1, 'game:final': 1 };
  const one = (e) => (P[e.type] ?? 1) - (e.lab ? 3 : 0);
  return kind === 'group' ? Math.max(...evs.map(one)) + 0.5 : one(evs[0]);
}

function msOf(r) {
  if (r.kind === 'catchup') return AWAY_MS;
  if (r.kind === 'lost') return LOST_MS;
  return r.kind === 'group' ? POP_MS + 1000 : POP_MS;
}

function addTop(recs) {
  for (const r of recs) { r.lane = top; enqueue(top, r); }
  pump(top);
}

function enqueue(L, r) {
  let i = L.queue.findIndex((x) => x.prio < r.prio);
  if (i < 0) i = L.queue.length;
  L.queue.splice(i, 0, r);
}

// Fill free slots from the queue. Highest priority ends up on top: the batch enters bottom-up, each new pop pushing
// the previous ones down, and drains bottom-up too.
function pump(L) {
  if (held) return;
  const busy = L.items.filter((r) => r.state === 'shown').length + L.queue.filter((r) => r.state === 'entering').length;
  const free = L.max - busy;
  const waiting = L.queue.filter((r) => r.state === 'queued');
  if (free <= 0 || !waiting.length) return;
  const take = waiting.slice(0, free);
  measure();
  take.forEach((r) => { r.state = 'entering'; });
  for (let i = take.length - 1, k = 0; i >= 0; i--, k++) {
    const r = take[i];
    r.rank = i;
    if (k === 0) show(r); else setTimeout(() => show(r), k * STAGGER_IN);
  }
}

function show(r) {
  if (r.state !== 'entering') return;
  const L = r.lane;
  L.queue = L.queue.filter((x) => x !== r);
  if (held) { r.state = 'queued'; enqueue(L, r); return; }
  r.state = 'shown';
  r.shownAt = Date.now();
  const el = (r.el = document.createElement('div'));
  el.className = 'cel-pop';
  r.card = document.createElement('div');
  r.card.setAttribute('role', 'status');
  r.card.setAttribute('aria-live', 'polite');
  r.card.setAttribute('aria-atomic', 'true');
  el.appendChild(r.card);
  paint(r);
  (L === top ? laneTop : laneBot).appendChild(el);
  wire(r);
  r.h = el.offsetHeight;
  L.items.unshift(r);
  layout(L);
  startTimer(r, msOf(r) + r.rank * STAGGER_OUT);
  if (document.visibilityState === 'hidden') pause(r, 'hidden');
}

function paint(r) {
  const tone = toneOf(r);
  r.card.className = `cel-card cel-${tone} cel-k-${r.kind}`;
  r.card.innerHTML = html(r);
  hydrate(r.card);
}

// Content changed while visible (more legs joined a collapsed pop, more catch-up events): repaint in place, re-arm.
function refresh(r) {
  if (r.state !== 'shown') return;
  r.prio = prioOf(r.kind, r.evs);
  paint(r);
  r.el.classList.add('cel-bump');
  setTimeout(() => r.el && r.el.classList.remove('cel-bump'), 400);
  r.h = r.el.offsetHeight;
  layout(r.lane);
  if (!r.why.size) startTimer(r, msOf(r));
  else r.left = Math.max(r.left, msOf(r));
}

function layout(L) {
  let y = 0;
  for (const r of L.items) {
    if (r.state !== 'shown') continue;
    r.el.style.setProperty('--y', `${L === top ? y : -y}px`);
    y += r.h + GAP;
  }
}

function dismiss(r, how = 'auto') {
  if (!r) return;
  if (r.state === 'queued' || r.state === 'entering') {
    r.state = 'gone';
    r.lane.queue = r.lane.queue.filter((x) => x !== r);
    return;
  }
  if (r.state !== 'shown') return;
  clearTimeout(r.timer);
  r.timer = 0;
  r.state = 'leaving';
  const L = r.lane, el = r.el;
  L.items = L.items.filter((x) => x !== r);
  layout(L);
  if (el.contains(document.activeElement)) focusAfterPop(L);
  el.classList.remove('cel-drag');
  if (how === 'swipe' && !reduced()) {
    const y = parseFloat(el.style.getPropertyValue('--y')) || 0;
    el.style.setProperty('--dy', L === top ? `${-(y + r.h + 32)}px` : `${r.h + 32}px`);
    el.classList.add('cel-fling');
  } else {
    el.classList.add(how === 'merge' || how === 'clear' ? 'cel-out-fast' : 'cel-out');
  }
  setTimeout(() => { el.remove(); r.state = 'gone'; }, dur('--dur-2', 260) + 40);
  pump(L);
}

function focusAfterPop(L) {
  const next = L.items.find((x) => x.state === 'shown');
  const t = next?.el.querySelector('.cel-main') || document.getElementById('view');
  try { t?.focus({ preventScroll: true }); } catch {}
}

/* ---------- timers: one deadline per pop, paused for any number of reasons (hover, focus, drag, hold, hidden) ---------- */
function startTimer(r, ms) {
  clearTimeout(r.timer);
  r.left = ms;
  r.t0 = Date.now();
  r.timer = r.why.size ? 0 : setTimeout(() => dismiss(r, 'auto'), ms);
}
function pause(r, why) {
  r.why.add(why);
  if (r.timer) { clearTimeout(r.timer); r.timer = 0; r.left = Math.max(0, r.left - (Date.now() - r.t0)); }
}
function resume(r, why, min = 1600) {
  r.why.delete(why);
  if (r.why.size || r.timer || r.state !== 'shown') return;
  startTimer(r, Math.max(r.left, min));
}

/* ---------- holding the lanes while the big card is up ---------- */
function hold() {
  if (held) return;
  held = true;
  for (const r of [...top.items, ...bot.items]) {
    if (r.state !== 'shown') continue;
    pause(r, 'hold');
    r.el.classList.add('cel-held');
    r.el.setAttribute('aria-hidden', 'true');
    r.el.inert = true;
  }
}
function release() {
  if (!held) return;
  held = false;
  for (const r of [...top.items, ...bot.items]) {
    if (r.state !== 'shown') continue;
    r.el.classList.remove('cel-held');
    r.el.removeAttribute('aria-hidden');
    r.el.inert = false;
    resume(r, 'hold', 2200);
  }
  pump(top);
  pump(bot); // pops that waited behind the big card come back silently: a tick 6s late would mean nothing
}

/* =========================================================
   Legs: show individually, collapse when 3+ land within 1.5s
   ========================================================= */
function addLegs(legs) {
  const now = Date.now();
  if (!legWin || now - legWin.at > WINDOW_MS || (legWin.group && !alive(legWin.group))) legWin = { at: now, evs: [], singles: [], group: null };
  legWin.evs.push(...legs);
  if (legWin.group) {
    legWin.group.evs = legWin.evs.slice();
    if (legWin.group.state === 'shown') refresh(legWin.group);
    return;
  }
  if (legWin.evs.length >= COLLAPSE_AT) {
    for (const r of legWin.singles) dismiss(r, 'merge');
    legWin.singles = [];
    legWin.group = rec('group', legWin.evs.slice());
    addTop([legWin.group]);
  } else {
    const rs = legs.map((ev) => rec('pop', [ev]));
    legWin.singles.push(...rs);
    addTop(rs);
  }
}

/* =========================================================
   Lost: one quiet card at the bottom; several in one go merge into one
   ========================================================= */
function addLost(evs) {
  const open = bot.items.find((r) => r.state === 'shown' && Date.now() - r.shownAt < WINDOW_MS) || bot.queue.find((r) => r.state === 'queued');
  if (open) {
    open.evs.push(...evs);
    if (open.state === 'shown') refresh(open);
    return;
  }
  const r = rec('lost', evs);
  r.lane = bot;
  enqueue(bot, r);
  pump(bot);
}

/* =========================================================
   Catch-up: everything found before the first live poll becomes ONE card
   ========================================================= */
function collectCatchup(ev) {
  if (cu?.rec && alive(cu.rec)) {
    cu.rec.evs.push(ev);
    if (cu.rec.state === 'shown') refresh(cu.rec);
    return;
  }
  if (!cu || !cu.timer) cu = { evs: [], timer: setTimeout(endCatchup, WINDOW_MS), rec: null };
  cu.evs.push(ev);
}
function endCatchup() {
  if (!cu) return;
  cu.timer = 0;
  if (!cu.evs.length) return;
  cu.rec = rec('catchup', cu.evs.slice());
  addTop([cu.rec]);
}

/* =========================================================
   Markup
   ========================================================= */
function toneOf(r) {
  if (r.kind === 'catchup') return 'cu';
  if (r.kind === 'lost') return 'lost';
  const types = new Set(r.evs.map((e) => e.type));
  if (r.kind === 'group') return types.has('leg:hit') ? 'hit' : types.has('leg:bust') ? 'bust' : types.has('leg:close') ? 'close' : 'void';
  const t = r.evs[0].type;
  return { 'leg:hit': 'hit', 'leg:bust': 'bust', 'leg:close': 'close', 'leg:void': 'void', 'slip:oneaway': 'away', 'slip:void': 'void', 'slip:cashout': 'void', 'game:start': 'info', 'game:final': 'info' }[t] || 'info';
}

function html(r) {
  if (r.kind === 'group') return groupHTML(r.evs);
  if (r.kind === 'lost') return lostHTML(r.evs);
  if (r.kind === 'catchup') return catchupHTML(r.evs);
  return popHTML(r.evs[0]);
}

function showAcct() {
  try { return (A.accounts() || []).length > 1 && A.getPrefs().accounts.length !== 1; } catch { return false; }
}
// whose slip, said the way the sweat board says it: "Tanay · Needs 1 more …"
function tagHTML(ev) {
  if (ev.lab) return '<span class="cel-tag">Lab</span> · ';
  return ev.acct && showAcct() ? `<span class="cel-tag">${esc(ev.acct)}</span> · ` : '';
}

function popHTML(ev) {
  const t = ev.type;
  const title = t === 'slip:oneaway' ? `One leg away${ev.slip?.title ? ` · ${ev.slip.title}` : ''}` : ev.title || A.EVENT_TYPES[t]?.label || '';
  return `<button type="button" class="cel-main" data-cel="open">${avatarHTML(ev)}<span class="cel-tx"><span class="cel-ttl">${txt(title)}</span><span class="cel-bd">${tagHTML(ev)}${txt(ev.body || '')}</span></span>${chipHTML(ev)}</button>${xBtn}`;
}

function chipHTML(ev) {
  const t = ev.type, st = ev.stat;
  if (isLeg(ev)) {
    if (st && st.value != null && st.line != null) return `<span class="cel-chip"><b>${num(st.value)}</b><i>/${num(st.line)}</i></span>`;
    const g = ev.game;
    if (g?.away && g?.home && g.away.score != null && g.home.score != null) return `<span class="cel-chip cel-chip-sm">${num(g.away.score)}–${num(g.home.score)}</span>`;
    return '';
  }
  if (t === 'slip:oneaway') {
    if (ev.amountText) return `<span class="cel-chip"><b>${esc(ev.amountText)}</b></span>`;
    const o = Number(ev.slip?.odds);
    return o > 0 ? `<span class="cel-chip"><b>@${o.toFixed(2)}</b></span>` : '';
  }
  if (t === 'game:start' && ev.game?.detail) return `<span class="cel-chip cel-chip-sm">${esc(ev.game.detail)}</span>`;
  if (t === 'slip:cashout' && ev.amountText) return `<span class="cel-chip cel-chip-sm">${esc(ev.amountText)}</span>`;
  return '';
}

function initials(name) {
  const w = String(name || '').split(/[\s.]+/).filter((x) => x && !/^(jr|sr|ii|iii|iv)$/i.test(x));
  if (!w.length) return '?';
  return (w.length === 1 ? w[0].slice(0, 2) : w[0][0] + w[w.length - 1][0]).toUpperCase();
}
function faceHTML(text, src, cls = '') {
  return `<span class="cel-face ${cls}"><span class="cel-ini">${esc(text)}</span>${src ? `<img alt="" data-src="${esc(src)}">` : ''}</span>`;
}
const playerFace = (p) => faceHTML(initials(p.name), p.id ? SHOT(p.id) : '');
const teamFace = (t) => faceHTML(String(t.abbr || t.name || '?').slice(0, 3).toUpperCase(), t.logo || '', 'cel-team');

function teamOf(ev) {
  const g = ev.game;
  if (!g) return null;
  const t = String(ev.title || '').toLowerCase();
  return [g.away, g.home].find((x) => x && ((x.name && t.includes(String(x.name).toLowerCase())) || (x.abbr && new RegExp(`(^|\\W)${String(x.abbr).toLowerCase()}(\\W|$)`).test(t)))) || null;
}

function ringHTML(hit, total) {
  const n = Math.max(1, Math.min(Number(total) || 1, 12));
  const h = Math.max(0, Math.min(n, Number(hit) || 0));
  const r = 16.5, c = 2 * Math.PI * r, gap = n > 1 ? 2.6 : 0, seg = c / n - gap;
  let arcs = '';
  for (let i = 0; i < n; i++) arcs += `<circle class="${i < h ? 'cel-on' : 'cel-off'}" cx="20" cy="20" r="${r}" stroke-dasharray="${seg.toFixed(2)} ${(c - seg).toFixed(2)}" stroke-dashoffset="${(-(i * c) / n - gap / 2).toFixed(2)}"/>`;
  return `<span class="cel-av"><svg class="cel-ring" viewBox="0 0 40 40" aria-hidden="true"><g transform="rotate(-90 20 20)">${arcs}</g><text x="20" y="20" dy=".36em" text-anchor="middle">${h}/${n}</text></svg></span>`;
}

function avatarHTML(ev) {
  const t = ev.type;
  if (t === 'slip:oneaway') return ringHTML(ev.slip?.legsHit, ev.slip?.legsTotal);
  if (t.startsWith('game:')) {
    const g = ev.game || {};
    if (g.away && g.home) return `<span class="cel-av cel-duo">${teamFace(g.away)}${teamFace(g.home)}</span>`;
    return `<span class="cel-av">${faceHTML('NBA', '', 'cel-glyph')}</span>`;
  }
  if (isLeg(ev)) {
    const badge = `<span class="cel-badge">${I[BADGE[t]]}</span>`;
    if (ev.player && (ev.player.name || ev.player.id)) return `<span class="cel-av">${playerFace(ev.player)}${badge}</span>`;
    const tm = teamOf(ev);
    if (tm) return `<span class="cel-av">${teamFace(tm)}${badge}</span>`;
    return `<span class="cel-av"><span class="cel-face cel-glyph">${I[BADGE[t]]}</span></span>`;
  }
  return `<span class="cel-av"><span class="cel-face cel-glyph">${t === 'slip:cashout' ? I.out : I.void}</span></span>`;
}

function shortName(ev) {
  const n = ev.player?.name;
  if (n) {
    const w = String(n).trim().split(/\s+/);
    if (w.length < 2) return n;
    const last = w[w.length - 1];
    return w.length > 2 && /^(jr|sr|ii|iii|iv)\.?$/i.test(last) ? `${w[w.length - 2]} ${last}` : last;
  }
  const tm = teamOf(ev);
  if (tm?.abbr) return `${tm.abbr} ML`;
  const s = String(ev.title || '');
  return s.length > 18 ? `${s.slice(0, 17)}…` : s;
}

const LEG_ORDER = { 'leg:hit': 0, 'leg:bust': 1, 'leg:close': 2, 'leg:void': 3 };
function groupTitle(evs) {
  const n = (t) => evs.filter((e) => e.type === t).length;
  const hit = n('leg:hit'), bust = n('leg:bust'), close = n('leg:close'), vd = n('leg:void');
  const parts = [];
  const legs = (k) => (k === 1 ? 'leg' : 'legs');
  if (hit) parts.push(`${hit} ${legs(hit)} cleared`);
  if (bust) parts.push(parts.length ? `${bust} busted` : `${bust} ${legs(bust)} busted`);
  if (close) parts.push(`${close} close ${close === 1 ? 'call' : 'calls'}`);
  if (vd) parts.push(parts.length ? `${vd} voided` : `${vd} ${legs(vd)} voided`);
  return parts.join(' · ');
}
function groupHTML(evs) {
  const xs = [...evs].sort((a, b) => LEG_ORDER[a.type] - LEG_ORDER[b.type] || (+!!a.lab) - (+!!b.lab));
  const faces = [];
  const keys = new Set();
  for (const e of xs) {
    const k = e.player?.id || e.player?.name || teamOf(e)?.abbr;
    if (!k || keys.has(k)) continue;
    keys.add(k);
    faces.push(e.player ? playerFace(e.player) : teamFace(teamOf(e)));
    if (faces.length === 2) break;
  }
  const av = faces.length === 2 ? `<span class="cel-av cel-duo">${faces.join('')}</span>` : faces.length ? `<span class="cel-av">${faces[0]}</span>` : `<span class="cel-av"><span class="cel-face cel-glyph">${I.hit}</span></span>`;
  const MAX = 4;
  const items = xs.slice(0, xs.length > MAX ? MAX - 1 : MAX).map((e) => {
    const k = BADGE[e.type];
    const st = e.stat;
    const v = st && st.value != null && st.line != null ? `<span class="cel-li-v"><b>${num(st.value)}</b>/${st.side === 'U' ? 'U' : ''}${num(st.line)}</span>` : '';
    return `<span class="cel-li cel-li-${k}${e.lab ? ' cel-li-lab' : ''}">${I[k]}<span class="cel-li-n">${esc(shortName(e))}</span>${v}${e.lab ? '<span class="cel-li-tag">Lab</span>' : ''}</span>`;
  });
  if (xs.length > MAX) items.push(`<span class="cel-li cel-li-more">+${xs.length - (MAX - 1)} more</span>`);
  return `<button type="button" class="cel-main" data-cel="open">${av}<span class="cel-tx"><span class="cel-ttl">${esc(groupTitle(xs))}</span><span class="cel-list">${items.join('')}</span></span></button>${xBtn}`;
}

function lostHTML(evs) {
  const glyph = `<span class="cel-av"><span class="cel-face cel-glyph">${I.bust}</span></span>`;
  if (evs.length === 1) {
    const ev = evs[0];
    // the coral mark and the red amount already say "lost"; the line keeps the slip's own name whole
    const what = ev.lab ? 'Paper slip busted' : 'Slip lost';
    const name = ev.slip?.title || String(ev.title || '').replace(/^[^·]*·\s*/, '') || what;
    const amt = ev.amountText ? `<span class="cel-amt-s">${esc(ev.amountText)}</span>` : '';
    return `<button type="button" class="cel-main" data-cel="open">${glyph}<span class="cel-tx"><span class="cel-ttl"><span class="cel-sr-only">${what}: </span>${txt(name)}</span><span class="cel-bd">${tagHTML(ev)}${txt(ev.body || '')}</span></span>${amt}</button>${xBtn}`;
  }
  const real = evs.filter((e) => !e.lab && e.amount != null);
  const total = real.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const names = evs.map((e) => e.slip?.title || String(e.title || '').replace(/^[^·]*·\s*/, '')).join(', ');
  const amt = real.length ? `<span class="cel-amt-s">${esc(money(total, { sign: true }))}</span>` : '';
  return `<button type="button" class="cel-main" data-cel="open">${glyph}<span class="cel-tx"><span class="cel-ttl">${evs.length} slips lost</span><span class="cel-bd">${txt(names)}</span></span>${amt}</button>${xBtn}`;
}

const NOUN = {
  'leg:hit': ['leg hit', 'legs hit'], 'leg:bust': ['leg busted', 'legs busted'], 'leg:close': ['close call', 'close calls'], 'leg:void': ['leg voided', 'legs voided'],
  'slip:won': ['slip cashed', 'slips cashed'], 'slip:lost': ['slip lost', 'slips lost'], 'slip:void': ['slip voided', 'slips voided'], 'slip:cashout': ['cash-out', 'cash-outs'],
  'slip:oneaway': ['slip one leg away', 'slips one leg away'], 'game:start': ['tip-off', 'tip-offs'], 'game:final': ['final', 'finals'],
};
function catchupHTML(evs) {
  const real = evs.filter((e) => !e.lab);
  const cashed = real.filter(isBig).length;
  const busted = real.filter((e) => e.type === 'slip:lost').length;
  // legs hit while away: leg events, plus legs of slips that cashed in the same scan (those slips report their own legs)
  const legHitsBy = new Map();
  for (const e of real) if (e.type === 'leg:hit') legHitsBy.set(e.betId || e.id, (legHitsBy.get(e.betId || e.id) || 0) + 1);
  for (const e of real) if (isBig(e) && e.betId && e.slip?.legsHit) legHitsBy.set(e.betId, Math.max(legHitsBy.get(e.betId) || 0, Number(e.slip.legsHit) || 0));
  const legs = [...legHitsBy.values()].reduce((a, b) => a + b, 0);
  const settled = real.filter((e) => ['slip:won', 'slip:lost', 'slip:cashout', 'slip:void'].includes(e.type) && e.amount != null && Number.isFinite(Number(e.amount)));
  const net = settled.reduce((s, e) => s + Number(e.amount), 0);
  let body;
  if (cashed || busted || legs || settled.length) {
    const stat = (n, one, many) => `<span class="cel-cu-stat${n ? '' : ' cel-zero'}"><b>${n}</b><small>${n === 1 ? one : many}</small></span>`;
    const netHTML = settled.length ? `<span class="cel-cu-net ${net > 0 ? 'cel-pos' : net < 0 ? 'cel-neg' : ''}"><b>${esc(money(net, { sign: true }))}</b><small>net</small></span>` : '';
    body = `<span class="cel-cu-row">${netHTML}${stat(cashed, 'cashed', 'cashed')}${stat(busted, 'busted', 'busted')}${stat(legs, 'leg hit', 'legs hit')}</span>`;
  } else {
    const counts = new Map();
    for (const e of evs) counts.set(e.type, (counts.get(e.type) || 0) + 1);
    const line = [...counts].map(([t, n]) => `${n} ${(NOUN[t] || [t, t])[n === 1 ? 0 : 1]}`).join(' · ');
    body = `<span class="cel-bd">${esc(line)}</span>`;
  }
  const n = evs.length;
  return `<button type="button" class="cel-main" data-cel="open"><span class="cel-tx"><span class="cel-cu-h">While you were away</span>${body}<span class="cel-cu-f">See all ${n} alert${n === 1 ? '' : 's'}${I.chev}</span></span></button>${xBtn}`;
}

/* ---------- headshots / logos: initials underneath, image fades in on load, a 404 is never retried this session ---------- */
let badImg = null;
function hydrate(scope) {
  if (!badImg) { badImg = new Set(); try { for (const s of JSON.parse(sessionStorage.getItem(BAD_IMG_KEY) || '[]')) badImg.add(s); } catch {} }
  for (const img of scope.querySelectorAll('img[data-src]')) {
    const src = img.dataset.src;
    img.removeAttribute('data-src');
    if (badImg.has(src)) { img.remove(); continue; }
    const face = img.parentElement;
    img.decoding = 'async';
    img.draggable = false;
    img.addEventListener('load', () => face.classList.add('cel-ok'), { once: true });
    img.addEventListener('error', () => {
      badImg.add(src);
      try { sessionStorage.setItem(BAD_IMG_KEY, JSON.stringify([...badImg].slice(-120))); } catch {}
      img.remove();
    }, { once: true });
    img.src = src;
    if (img.complete && img.naturalWidth) face.classList.add('cel-ok', 'cel-now');
  }
}

/* =========================================================
   Pop interaction: tap opens, ✕ dismisses, swipe away (up for the top lane, down for the lost card)
   ========================================================= */
function wire(r) {
  const el = r.el;
  const dir = r.lane === top ? -1 : 1;
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cel]');
    if (!b || r.state !== 'shown') return;
    if (r.dragged) { r.dragged = false; return; }
    if (b.dataset.cel === 'x') dismiss(r, 'user');
    else if (b.dataset.cel === 'open') { dismiss(r, 'user'); openTarget(r); }
  });
  el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') pause(r, 'hover'); });
  el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') resume(r, 'hover'); });
  el.addEventListener('focusin', () => pause(r, 'focus'));
  el.addEventListener('focusout', (e) => { if (!el.contains(e.relatedTarget)) resume(r, 'focus'); });
  let pid = null, sx = 0, sy = 0, st = 0, drag = false;
  el.addEventListener('pointerdown', (e) => {
    if (r.state !== 'shown' || (e.pointerType === 'mouse' && e.button !== 0) || e.target.closest('.cel-x')) return;
    pid = e.pointerId; sx = e.clientX; sy = e.clientY; st = performance.now(); drag = false;
  });
  el.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pid || r.state !== 'shown') return;
    const dy = e.clientY - sy, dx = e.clientX - sx;
    if (!drag) {
      if (Math.abs(dy) < 7 || Math.abs(dy) < Math.abs(dx)) return;
      drag = true;
      r.dragged = true;
      try { el.setPointerCapture(pid); } catch {}
      el.classList.add('cel-drag');
      pause(r, 'drag');
    }
    const toward = dir < 0 ? Math.min(0, dy) : Math.max(0, dy);
    const back = dy - toward; // the other way: rubber band
    el.style.setProperty('--dy', `${toward + back * 0.2}px`);
    el.style.setProperty('--drag', Math.min(1, Math.abs(toward) / (r.h + 24)).toFixed(3));
  });
  const end = (e) => {
    if (e.pointerId !== pid) return;
    pid = null;
    if (!drag) return;
    drag = false;
    el.classList.remove('cel-drag');
    const dy = e.clientY - sy, v = dy / Math.max(1, performance.now() - st);
    const gone = e.type !== 'pointercancel' && (dir < 0 ? dy < -28 || v < -0.45 : dy > 28 || v > 0.45);
    if (gone) dismiss(r, 'swipe');
    else { el.style.setProperty('--dy', '0px'); el.style.removeProperty('--drag'); resume(r, 'drag'); }
    setTimeout(() => { r.dragged = false; }, 0);
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

function openTarget(r) {
  if (r.kind === 'catchup') return openBell();
  const evs = r.evs;
  if (evs.every((e) => e.lab)) return A.go('lab');
  if (evs.every((e) => e.type.startsWith('game:'))) return A.go('live');
  const ids = new Set(evs.filter((e) => !e.lab).map((e) => e.betId).filter(Boolean));
  if (ids.size === 1) return A.openSlip([...ids][0]);
  return A.go('live');
}

function openBell() {
  const bells = [...document.querySelectorAll('[data-notif="toggle"]')];
  const bell = bells.find((b) => b.getClientRects().length) || bells[0];
  bell?.click();
}

/* =========================================================
   The big moment: CASHED
   ========================================================= */
function nextBig() {
  big.next = 0;
  const ev = big.queue.shift();
  if (!ev) return closeStage();
  hold();
  openStage();
  showWin(ev);
}

function openStage() {
  if (big.stage) return;
  const st = div('cel-stage');
  st.innerHTML = '<div class="cel-dim" data-cel="dim"></div>';
  st.addEventListener('click', onStageClick);
  R.appendChild(st);
  big.stage = st;
}

function closeStage() {
  const st = big.stage;
  big.stage = null;
  if (st) {
    st.classList.add('cel-stage-out');
    setTimeout(() => st.remove(), dur('--dur-2', 260) + 40);
  }
  release();
}

function showWin(ev) {
  const st = big.stage;
  const paper = !!ev.lab;
  const id = `cel-w${++seq}`;
  const card = div(`cel-win${paper ? ' cel-paper' : ''}`);
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'false');
  card.setAttribute('aria-labelledby', `${id}-h`);
  card.setAttribute('aria-describedby', `${id}-d`);
  card.tabIndex = -1;
  card.innerHTML = winHTML(ev, id);
  st.appendChild(card);
  fitHero(card);
  const c = (big.cur = { ev, card, timer: 0, left: 0, t0: 0, why: new Set(), raf: 0, impact: 0, stopFx: null, prevFocus: null });
  card.addEventListener('pointerdown', () => pauseBig('touch'));
  card.addEventListener('focusin', () => pauseBig('focus'));
  card.addEventListener('focusout', (e) => { if (!card.contains(e.relatedTarget)) resumeBig('focus'); });
  const amtEl = card.querySelector('.cel-amt-n');
  const counts = !paper && ev.amount != null && ev.amountText && !reduced();
  if (amtEl && counts) amtEl.textContent = money(Number(ev.amount) > 0 ? 0.001 : 0, { sign: true, dp: decimals(ev.amountText) });
  c.impact = setTimeout(() => {
    if (big.cur !== c) return;
    if (!paper) {
      if (!reduced()) c.stopFx = burst(st, card);
      feedback('win');
    }
    if (counts) countUp(c, amtEl);
  }, reduced() ? 0 : IMPACT_MS);
  startBig(big.queue.length ? BIG_QUEUED_MS : BIG_MS);
  if (document.visibilityState === 'hidden') pauseBig('hidden');
  const s = ev.slip || {};
  announce(`${paper ? 'Paper win' : ev.type === 'slip:cashout' ? 'Cashed out' : 'Cashed'}${ev.amountText ? ` ${ev.amountText}` : ''} on ${s.title || ev.title || 'a slip'}. Press Escape to close.`);
}

const decimals = (text) => (/\.\d/.test(String(text || '')) ? 2 : 0);

// A ₹1,23,456 cash must still fit the ticket on a 360px phone: shrink the hero number to the space it has.
function fitHero(card) {
  const amt = card.querySelector('.cel-amt'), ghost = card.querySelector('.cel-amt-ghost'), box = card.querySelector('.cel-win-a');
  if (!amt || !ghost || !box) return;
  const cs = getComputedStyle(box);
  const room = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const need = ghost.offsetWidth; // layout width: the card is still mid-entrance (scaled) at this point
  if (room > 0 && need > room) amt.style.fontSize = `${Math.floor(parseFloat(getComputedStyle(amt).fontSize) * (room / need) * 0.98)}px`;
}

function winHTML(ev, id) {
  const s = ev.slip || {};
  const paper = !!ev.lab;
  const out = ev.type === 'slip:cashout';
  const amt = ev.amount != null && ev.amountText ? Number(ev.amount) : null;
  const stake = Number(s.stake);
  const ret = amt != null && stake > 0 ? stake + amt : null;
  const odds = Number(s.odds) > 0 ? `@${Number(s.odds).toFixed(2)}` : '';
  const title = s.title || String(ev.title || '').replace(/^[^·]*·\s*/, '') || 'Slip';
  const who = paper ? 'Lab · paper' : ev.acct || '';
  const stamp = paper ? 'Paper win' : out ? 'Cashed out' : 'Cashed';
  const lt = Number(s.legsTotal) || 0;
  const lh = Math.max(0, Math.min(lt, Number(s.legsHit) || 0));
  const hero = amt != null ? ev.amountText : odds || (lt ? `${lh}/${lt}` : '');
  const pips = lt > 1 ? `<span class="cel-pips" aria-hidden="true" style="--n:${Math.min(lt, 12)}">${Array.from({ length: Math.min(lt, 12) }, (_, i) => `<i class="${i < lh ? 'cel-on' : ''}" style="--i:${i}"></i>`).join('')}</span>` : '';
  // no real slip behind it (Notifications' test alert has demo:true and no betId): no View slip, no Flex card — just Done
  const real = !paper && !!ev.betId && !ev.demo;
  const primary = paper
    ? '<button type="button" class="cel-btn cel-btn-p" data-cel="view">Open Lab</button>'
    : real ? '<button type="button" class="cel-btn cel-btn-p" data-cel="view">View slip</button>' : '<button type="button" class="cel-btn cel-btn-p" data-cel="x">Done</button>';
  const flex = real ? `<button type="button" class="cel-btn" data-act="share" data-id="${esc(ev.betId)}">${I.share}<span>Flex card</span></button>` : '';
  const money1 = ret != null
    ? `<div class="cel-win-m"><span class="cel-sr-only">Staked </span><span>${esc(money(stake))}</span>${I.arrow}<span class="cel-sr-only">, returned </span><b>${esc(money(ret))}</b>${odds ? `<span class="cel-odds">${odds}</span>` : ''}</div>`
    : '';
  // a single is its own leg (the title says it); legs are worth a line from two up
  const legsLine = lt > 1 ? `<div class="cel-win-l">${pips}<span>${lh}/${lt} legs hit</span></div>` : '';
  return `<div class="cel-win-a">
      <div class="cel-win-top"><span class="cel-who">${esc(who)}</span><span class="cel-win-tools"><span class="cel-next-slot">${nextPillHTML()}</span><button type="button" class="cel-x" data-cel="x" aria-label="Close">${I.x}</button></span></div>
      <div class="cel-stamp" id="${id}-h">${esc(stamp)}</div>
      ${hero ? `<div class="cel-amt"><span class="cel-amt-ghost" aria-hidden="true">${esc(hero)}</span><span class="cel-amt-n">${esc(hero)}</span></div>` : ''}
    </div>
    <div class="cel-win-b" id="${id}-d">
      <div class="cel-win-t">${esc(title)}</div>
      ${money1}
      ${legsLine}
      <div class="cel-win-acts">${primary}${flex}</div>
    </div>`;
}

function nextPillHTML() {
  const n = big.queue.length;
  return n ? `<button type="button" class="cel-next" data-cel="next" aria-label="Next: ${n} more">${n} more</button>` : '';
}
function updateNextPill() {
  const slot = big.cur?.card.querySelector('.cel-next-slot');
  if (slot) slot.innerHTML = nextPillHTML();
  if (big.cur && big.queue.length && big.cur.left > BIG_QUEUED_MS && !big.cur.why.size) startBig(BIG_QUEUED_MS);
}

function onStageClick(e) {
  const t = e.target.closest('[data-cel]');
  const c = big.cur;
  if (!t || !c) return;
  const a = t.dataset.cel;
  if (a === 'dim' || a === 'x' || a === 'next') closeBig();
  else if (a === 'view') {
    const ev = c.ev;
    closeBig({ restore: false });
    if (ev.lab) A.go('lab'); else if (ev.betId && !ev.demo) A.openSlip(ev.betId);
  }
}

function closeBig({ restore = true } = {}) {
  const c = big.cur;
  if (!c) return;
  big.cur = null;
  clearTimeout(c.timer);
  clearTimeout(c.impact);
  cancelAnimationFrame(c.raf);
  c.stopFx?.();
  const hadFocus = c.card.contains(document.activeElement);
  c.card.classList.add('cel-win-out');
  c.card.inert = true;
  setTimeout(() => c.card.remove(), dur('--dur-2', 260) + 40);
  if (hadFocus && restore) {
    const back = c.prevFocus && c.prevFocus.isConnected ? c.prevFocus : document.getElementById('view');
    try { back?.focus({ preventScroll: true }); } catch {}
  }
  if (big.queue.length) big.next = setTimeout(nextBig, 180);
  else closeStage();
}

function startBig(ms) {
  const c = big.cur;
  if (!c) return;
  clearTimeout(c.timer);
  c.left = ms;
  c.t0 = Date.now();
  c.timer = c.why.size ? 0 : setTimeout(() => closeBig(), ms);
}
function pauseBig(why) {
  const c = big.cur;
  if (!c) return;
  c.why.add(why);
  if (c.timer) { clearTimeout(c.timer); c.timer = 0; c.left = Math.max(0, c.left - (Date.now() - c.t0)); }
}
function resumeBig(why, min = 2500) {
  const c = big.cur;
  if (!c) return;
  c.why.delete(why);
  if (c.why.size || c.timer) return;
  startBig(Math.max(c.left, min));
}

// payout counts up with ease-out, then lands exactly on the pre-formatted amountText
function countUp(c, el) {
  if (!el) return;
  const to = Number(c.ev.amount) || 0;
  const text = c.ev.amountText;
  const dp = decimals(text);
  const D = 950;
  const t0 = performance.now();
  const tick = (t) => {
    if (big.cur !== c) return;
    const k = Math.min(1, (t - t0) / D);
    if (k < 1) {
      const e = 1 - Math.pow(1 - k, 4);
      el.textContent = money(to * e || (to > 0 ? 0.001 : 0), { sign: true, dp });
      c.raf = requestAnimationFrame(tick);
    } else {
      el.textContent = text;
      el.parentElement.classList.add('cel-land');
    }
  };
  c.raf = requestAnimationFrame(tick);
}

// ≤150 particles in brand orange + hit colour, bursting from behind the stamp; gone in ≤2.2s, canvas removed
function burst(stage, card) {
  const cv = document.createElement('canvas');
  const ctx = cv.getContext && cv.getContext('2d');
  if (!ctx) return null;
  cv.className = 'cel-fx';
  cv.setAttribute('aria-hidden', 'true');
  const W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  stage.insertBefore(cv, card);
  // from behind the ticket, centred under the stamp's line: pieces clear the top and both sides of the card evenly
  const box = card.getBoundingClientRect();
  const at = (card.querySelector('.cel-stamp') || card).getBoundingClientRect();
  const cx = box.left + box.width / 2, cy = at.top + at.height / 2, spread = box.width * 0.7;
  const accent = color('--accent'), hit = color('--hit'), ink = color('--text');
  const N = W < 600 ? 110 : 150;
  const P = [];
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 300 + Math.random() * 760;
    const roll = Math.random();
    P.push({
      x: cx + (Math.random() - 0.5) * spread, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.75 - 280 - Math.random() * 260,
      r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 16, f: Math.random() * 6.28, vf: 7 + Math.random() * 9,
      w: 4 + Math.random() * 3.5, h: 7.5 + Math.random() * 7, round: Math.random() < 0.26,
      c: roll < 0.45 ? accent : roll < 0.9 ? hit : ink, life: 1250 + Math.random() * 900,
    });
  }
  let t0 = 0, last = 0, raf = 0, done = false;
  const G = 640;
  const stop = () => { if (done) return; done = true; cancelAnimationFrame(raf); cv.remove(); };
  const frame = (t) => {
    if (done) return;
    if (!t0) t0 = last = t;
    const dt = Math.min(0.034, (t - last) / 1000);
    last = t;
    const age = t - t0;
    const drag = Math.pow(0.1, dt);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    let live = 0;
    for (const p of P) {
      if (age > p.life) continue;
      live++;
      p.vx *= drag;
      p.vy = p.vy * drag + G * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.r += p.vr * dt;
      p.f += p.vf * dt;
      const k = age / p.life;
      ctx.globalAlpha = k < 0.65 ? 1 : Math.max(0, 1 - (k - 0.65) / 0.35);
      ctx.fillStyle = p.c;
      const co = Math.cos(p.r), si = Math.sin(p.r), fl = Math.cos(p.f);
      ctx.setTransform(co * dpr, si * dpr, -si * fl * dpr, co * fl * dpr, p.x * dpr, p.y * dpr);
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w * 0.42, 0, 6.2832); ctx.fill(); } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    if (live && age < 2200) raf = requestAnimationFrame(frame); else stop();
  };
  raf = requestAnimationFrame(frame);
  return stop;
}

function color(name) {
  if (!probe) { probe = document.createElement('i'); probe.hidden = true; R.appendChild(probe); }
  probe.style.color = `var(${name})`;
  return getComputedStyle(probe).color || '#fff';
}

/* =========================================================
   Feedback: haptics + optional synthesized sound (no files)
   ========================================================= */
function feedback(kind) {
  const now = performance.now();
  if (now - lastFeedback < 650) return;
  lastFeedback = now;
  let p;
  try { p = A.getPrefs(); } catch { return; }
  if (p.haptics) buzz(kind);
  if (p.sound) chime(kind);
}

const activated = () => !navigator.userActivation || navigator.userActivation.hasBeenActive;

function buzz(kind) {
  if (typeof navigator.vibrate !== 'function' || !activated()) return;
  if (typeof matchMedia === 'function' && !matchMedia('(pointer: coarse)').matches) return; // phones only
  try { navigator.vibrate(kind === 'win' ? [26, 70, 38] : 12); } catch {}
}

function primeAudio() {
  if (audioCtx) { if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {}); return; }
  try { if (A?.getPrefs().sound) ctxAudio(); } catch {}
}
function ctxAudio() {
  if (audioCtx) return audioCtx.state === 'closed' ? null : audioCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC || !activated()) return null; // created before any tap, Chrome would warn and keep it muted
  try { audioCtx = new AC(); } catch { audioCtx = null; }
  return audioCtx;
}

function chime(kind) {
  const ac = ctxAudio();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  const t = ac.currentTime + 0.03;
  const out = ac.createGain();
  out.gain.value = 0.9;
  out.connect(ac.destination);
  const tone = (f, at, len, peak, type = 'sine') => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g).connect(out);
    o.start(at);
    o.stop(at + len + 0.05);
  };
  if (kind === 'hit') {
    // swish: a short noise burst swept up through a band-pass, like the net; then a clean ding
    const len = 0.2;
    const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * len), ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf;
    bp.type = 'bandpass';
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(700, t);
    bp.frequency.exponentialRampToValueAtTime(4200, t + len);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(bp).connect(g).connect(out);
    src.start(t);
    src.stop(t + len + 0.02);
    tone(1318.5, t + 0.09, 0.55, 0.09);
    tone(2637, t + 0.09, 0.3, 0.025);
  } else if (kind === 'win') {
    // rising major arpeggio that rings out as a chord
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, t + i * 0.075, 1.0 - i * 0.08, 0.07, 'triangle'));
    tone(2093, t + 0.3, 0.6, 0.02);
  }
}

/* =========================================================
   Page state: keyboard, visibility, resize, prefs
   ========================================================= */
function onKey(e) {
  const c = big.cur;
  if (!c) return;
  if (e.key === 'Escape' || e.key === 'Esc') {
    e.preventDefault();
    e.stopPropagation(); // the top layer closes alone (a sheet or the alert panel underneath stays)
    closeBig();
  } else if (e.key === 'Tab' && !c.card.contains(document.activeElement)) {
    // not modal and never grabs focus on its own; the first Tab while it's up takes you into it
    e.preventDefault();
    c.prevFocus = document.activeElement;
    (c.card.querySelector('.cel-btn') || c.card).focus();
  }
}

function onVisibility() {
  const hidden = document.visibilityState === 'hidden';
  for (const r of [...top.items, ...bot.items]) {
    if (r.state !== 'shown') continue;
    if (hidden) pause(r, 'hidden'); else resume(r, 'hidden', 2500);
  }
  if (big.cur) { if (hidden) pauseBig('hidden'); else resumeBig('hidden', 3500); }
  if (!hidden && awayEvs.length) {
    const evs = awayEvs.splice(0);
    let prefs;
    try { prefs = A.getPrefs(); } catch { return; }
    if (!prefs.popups) return;
    if (evs.length === 1) { inbox.push(evs[0]); if (!flushT) flushT = setTimeout(flush, 30); }
    else addTop([rec('catchup', evs)]);
  }
}

function onResize() {
  measure();
  for (const L of [top, bot]) {
    for (const r of L.items) if (r.state === 'shown') r.h = r.el.offsetHeight;
    layout(L);
  }
}

// Lanes hang off the real chrome: under the top bar (or the desktop header row), above the tab bar.
function measure() {
  if (!R) return;
  const on = (el) => !!el && el.getClientRects().length > 0;
  const tb = document.querySelector('.topbar'), da = document.querySelector('.desk-actions'), tab = document.querySelector('.tabbar'), view = document.getElementById('view');
  const bar = on(da) ? da : on(tb) ? tb : null;
  const topEdge = bar ? Math.max(0, Math.round(bar.getBoundingClientRect().bottom)) : 0;
  let tabTop = innerHeight;
  if (on(tab)) {
    tabTop = tab.getBoundingClientRect().top;
    for (const k of tab.querySelectorAll('*')) { const r = k.getBoundingClientRect(); if (r.height && r.top < tabTop) tabTop = r.top; }
  }
  R.style.setProperty('--cel-top', `${topEdge}px`);
  R.style.setProperty('--cel-bot', `${Math.max(0, Math.round(innerHeight - tabTop))}px`);
  if (on(view)) { const v = view.getBoundingClientRect(); R.style.setProperty('--cel-cx', `${Math.round(v.left + v.width / 2)}px`); }
}

function clearAll() {
  clearTimeout(flushT);
  flushT = 0;
  inbox = [];
  awayEvs = [];
  if (cu) { clearTimeout(cu.timer); cu = null; }
  legWin = null;
  for (const L of [top, bot]) {
    for (const r of L.queue) r.state = 'gone';
    L.queue = [];
    for (const r of [...L.items]) dismiss(r, 'clear');
  }
  big.queue = [];
  clearTimeout(big.next);
  big.next = 0;
  if (big.cur) closeBig(); else if (big.stage) closeStage();
}

function announce(text) {
  if (!srEl) return;
  srEl.textContent = '';
  setTimeout(() => { srEl.textContent = text; }, 80);
}

function dur(name, fb) {
  if (reduced()) return fb;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return fb;
  return /ms$/.test(v) ? n : /s$/.test(v) ? n * 1000 : fb;
}
