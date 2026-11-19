// Live stat motion — Ticket B of the "Courtside" release.
//
// app.js re-renders the whole view with innerHTML and calls afterRender(root, ctx) synchronously after every render,
// before paint. Animatable nodes carry data-fx="<kind>" data-k="<stable key>" data-v="<value>" (TICKETS.md, DOM hooks).
//
// How it works
// - We remember what the previous render showed per kind+key. When the same route+account renders again, whatever
//   moved gets an effect; effects start in document order with a short stagger.
// - Effects are keyed by data, not by DOM node. Every render takes in-flight effects off the replaced nodes and
//   re-mounts them on the fresh ones with their original start time, so a re-render mid-animation (the next poll, the
//   Lab's follow-up render) neither restarts nor drops anything. Finished effects put the DOM back exactly as app.js
//   rendered it.
// - First render, route switch, account switch, the first moments of a view (boot: history + first poll land inside
//   that window) and renders while the tab is hidden only record a baseline.
// - Counters share one rAF loop that exists only while something counts. Everything else is WAAPI, mostly on
//   transform/opacity (bars scale from their old width, chips float, digits roll), plus tiny colour/clip/dash tweens.
// - prefers-reduced-motion: values swap and flash once in their state colour; nothing counts, rolls, pops or shakes.

const BIG = new Set(['PTS', 'PR', 'PA', 'PRA']); // close zone: within 2 of the line for these, 1 otherwise (= events.js leg:close)
const SETTLE = 800; // ms — a view's first renders are its baseline
const STEP = 55; // ms between changed items (≤ 60)
const SPREAD = 440; // …and a burst never spreads wider than this
const BEAT = 1800; // close-zone heartbeat period; fx.css uses the same 1.8s
const BOOT = performance.now() + 6000; // while the page boots, summaries filling in "from 0" are data arriving, not change
const ROLL = 'cubic-bezier(.3,.75,.25,1)'; // digit drum: visibly travels, then settles (the token ease-out is too front-loaded here)

let scope = null; // `${route}|${acct}` of the last render
let armAt = 0; // timeline ms from which this scope animates
let mem = new Map(); // last render: `${kind}|${key}` -> { kind, key, els, vals, order }
const effects = new Map(); // effect id -> Fx
const counters = new Set(); // running count-ups (one shared rAF loop)
let raf = 0;
let reapTimer = 0;
let K = null; // design tokens, resolved lazily per render
let reduce = false;
let ROOT = null;

/* ---------- small helpers ---------- */
const now = () => {
  const t = document.timeline && document.timeline.currentTime;
  return typeof t === 'number' ? t : performance.now();
};
const num = (v) => {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease3 = (p) => 1 - (1 - p) ** 3;
const px = (v) => parseFloat(v) || 0;
const dec = (s) => {
  const m = /\.(\d+)/.exec(String(s));
  return m ? Math.min(m[1].length, 2) : 0;
};
const toneOf = (st) => ({ hit: 'hit', dead: 'bust', live: 'live', push: 'mute' })[st] || 'info';
const money = (ctx, v, o) => {
  try { return ctx && ctx.money ? ctx.money(v, o) : String(v); } catch { return String(v); }
};
function node(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  n.setAttribute('aria-hidden', 'true');
  return n;
}

function tokens() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n, d = '') => cs.getPropertyValue(n).trim() || d;
  const ms = (n, d) => {
    const s = v(n);
    const x = parseFloat(s);
    return Number.isFinite(x) ? (/[^m]s$/.test(s) ? x * 1000 : x) : d;
  };
  return {
    out: v('--ease-out', 'ease-out'),
    spring: v('--ease-spring', 'ease-out'),
    d3: ms('--dur-3', 520),
    hit: v('--hit', 'currentcolor'), bust: v('--bust', 'currentcolor'), live: v('--live', 'currentcolor'),
    mute: v('--mute', 'currentcolor'), info: v('--info', 'currentcolor'), accent: v('--accent', 'currentcolor'),
  };
}

// Start a WAAPI animation at an absolute timeline time (so a re-mount continues exactly where it was).
function play(h, el, frames, dur, at, o = {}) {
  if (!el || !el.animate || !(dur > 0) || now() >= at + dur) return null;
  const opts = { duration: dur, easing: o.easing || 'linear', fill: o.fill || 'backwards' };
  let a;
  try { a = el.animate(frames, opts); } catch {
    try { a = el.animate(frames, { ...opts, easing: 'ease-out' }); } catch { return null; }
  }
  try { a.startTime = at; } catch {}
  h.anims.push(a);
  return a;
}
const addCls = (h, el, ...cls) => {
  for (const c of cls) if (!el.classList.contains(c)) { el.classList.add(c); h.undo.push(() => el.classList.remove(c)); }
};
const setSty = (h, el, prop, val) => {
  const old = el.style[prop];
  el.style[prop] = val;
  h.undo.push(() => { el.style[prop] = old; });
};
// Hold an inline number at its final width while it counts (no jitter when 9 → 10). An inline-block with clipped
// overflow would take its baseline from its bottom edge, so overflow stays visible for the duration.
function fixWidth(h, n, w, clip) {
  setSty(h, n, 'display', 'inline-block');
  setSty(h, n, 'minWidth', `${Math.ceil(w)}px`);
  setSty(h, n, 'textAlign', 'right');
  if (clip) setSty(h, n, 'overflow', 'visible');
}
const strip = (n) => {
  for (const e of [n, ...n.querySelectorAll('[data-fx]')]) ['data-fx', 'data-k', 'data-v'].forEach((a) => e.removeAttribute(a));
};

/* ---------- effects ---------- */
// Lifecycle per render: snap() → teardown() (old nodes) → prep(next) → measure() (reads only) → mount(t) (writes only).
class Fx {
  constructor(id, key, t0, dur) { this.id = id; this.key = key; this.t0 = t0; this.end = t0 + dur; this.h = null; }
  prep() { return false; }
  measure() {}
  mount() {}
  snap() {}
  drop() {}
  begin() { this.teardown(); this.h = { anims: [], nodes: [], undo: [] }; return this.h; }
  teardown() {
    const h = this.h;
    this.h = null;
    if (!h) return;
    for (const a of h.anims) { try { a.cancel(); } catch {} }
    for (const n of h.nodes) n.remove();
    for (let i = h.undo.length - 1; i >= 0; i--) { try { h.undo[i](); } catch {} }
  }
}

// val (live stat, summary count) and money (bankroll): count old → new, tint, "+N" chip.
class Count extends Fx {
  constructor(r, from, to, t0, tone, ctx, prev) {
    const isMoney = r.kind === 'money';
    const shown = prev instanceof Count && t0 < prev.t0 + prev.cdur ? prev.at(t0) : from; // keep counting from what's on screen
    const cdur = isMoney ? 950 : clamp(280 + 110 * Math.min(Math.abs(to - shown), 4), 360, 700);
    super(`count|${r.id}`, r.key, t0, Math.max(cdur + 480, 1240));
    Object.assign(this, { r, isMoney, from: shown, to, tone, ctx, cdur, last: null, els: [] });
    this.dp = isMoney ? (Math.abs(to) < 100000 && Math.abs(to - Math.round(to)) > 0.004 ? 2 : 0) : Math.max(dec(r.vals[0]), dec(from));
    const d = to - from;
    this.chipText = isMoney ? money(ctx, d, { sign: true }) : `${d > 0 ? '+' : '−'}${+Math.abs(d).toFixed(1)}`;
    this.counter = { t0, dur: cdur, draw: (t) => this.draw(t) };
  }
  at(t) { return this.from + (this.to - this.from) * ease3(clamp((t - this.t0) / this.cdur, 0, 1)); }
  draw(t) {
    if (!this.els.length) return;
    let s;
    if (t >= this.t0 + this.cdur) s = this.final;
    else if (t <= this.t0) s = this.isMoney ? money(this.ctx, this.from) : this.from.toFixed(this.dp);
    else {
      const v = +this.at(t).toFixed(this.dp);
      s = this.isMoney ? money(this.ctx, v, { dp: this.dp }) : v.toFixed(this.dp);
    }
    if (s === this.last) return;
    this.last = s;
    for (const n of this.els) n.textContent = s;
  }
  prep(next) {
    const r = next.get(this.r.id);
    if (!r || num(r.vals[0]) !== this.to) return false;
    this.targets = r.els;
    return true;
  }
  measure() {
    this.m = this.targets.map((n) => {
      const cs = getComputedStyle(n);
      return { n, w: n.getBoundingClientRect().width, color: cs.color, html: n.innerHTML, inline: cs.display === 'inline', clip: cs.overflow !== 'visible' };
    });
    this.final = this.targets[0].textContent;
    this.spot = chipSpot(this.targets[0], this.chipText, this.isMoney);
  }
  mount(t) {
    const h = this.begin();
    const c = K[this.tone];
    for (const { n, w, color, html, inline, clip } of this.m) {
      h.undo.push(() => { n.innerHTML = html; });
      if (reduce) { play(h, n, [{ color: c }, { color }], 900, this.t0, { easing: 'ease-in', fill: 'none' }); continue; }
      setSty(h, n, 'fontVariantNumeric', 'tabular-nums');
      if (!this.isMoney && inline) fixWidth(h, n, w, clip);
      play(h, n, [{ color: c }, { color: c, offset: 0.6 }, { color }], this.cdur + 450, this.t0, { easing: 'ease-in-out', fill: 'none' });
    }
    if (!reduce) {
      this.els = this.targets;
      this.last = null;
      this.draw(t);
      if (t < this.t0 + this.cdur) counters.add(this.counter);
    }
    if (this.spot) chip(h, this.spot, this.chipText, this.tone, this.t0, this.isMoney);
  }
  teardown() { this.els = []; super.teardown(); }
  drop() { counters.delete(this.counter); }
}

// bar: grow (or shrink) from the old width — scaleX on the fill, from its left edge.
class Bar extends Fx {
  constructor(r, from, to, t0, prev) {
    super(`bar|${r.id}`, r.key, t0, 720);
    this.r = r;
    this.from = prev instanceof Bar && prev.cur != null ? prev.cur : from;
    this.to = to;
  }
  snap() {
    const a = this.h && this.h.anims[0];
    let p = 1;
    if (a) {
      try { const ct = a.effect.getComputedTiming(); p = ct.progress == null ? (now() < this.t0 ? 0 : 1) : ct.progress; } catch {}
    }
    this.cur = this.from + (this.to - this.from) * p;
  }
  prep(next) {
    const r = next.get(this.r.id);
    if (!r || Math.abs((num(r.vals[0]) ?? -1) - this.to) > 0.01) return false;
    this.targets = r.els;
    return true;
  }
  mount() {
    const h = this.begin();
    for (const n of this.targets) {
      if (reduce) play(h, n, [{ filter: 'brightness(1.8)' }, { filter: 'brightness(1)' }], 900, this.t0, { easing: 'ease-in', fill: 'none' });
      else if (this.to >= 1) {
        const o = '0 50%';
        play(h, n, [{ transform: `scaleX(${clamp(this.from / this.to, 0, 8).toFixed(4)})`, transformOrigin: o }, { transform: 'scaleX(1)', transformOrigin: o }], 700, this.t0, { easing: K.out });
      } else play(h, n, [{ width: `${this.from}%` }, { width: `${this.to}%` }], 700, this.t0, { easing: K.out });
    }
  }
}

// row state change, from live: → hit (sweep, ic pops, tick draws), → dead (ic shake, strike draws), → push (fade to muted).
const SHAKE = [0, -3, 3, -2, 1, 0].map((x, i, a) => ({ transform: `translateX(${x}px)`, offset: i / (a.length - 1) }));
class State extends Fx {
  constructor(r, to, t0, prev) {
    super(`state|${r.key}`, r.key, t0, to === 'hit' ? 1150 : to === 'dead' ? 920 : 660);
    this.to = to;
    this.old = { ic: prev.get(`ic|${r.key}`)?.els[0] || null, bar: prev.get(`bar|${r.key}`)?.els[0] || null };
  }
  prep(next) {
    const r = next.get(`row|${this.key}`);
    if (!r || r.vals.some((v) => v !== this.to)) return false;
    this.rows = r.els;
    this.ics = next.get(`ic|${this.key}`)?.els || [];
    this.bars = next.get(`bar|${this.key}`)?.els || [];
    return true;
  }
  measure() {
    this.names = this.to === 'dead' && !reduce ? this.rows.map(strikeInfo).filter(Boolean) : [];
    this.op = this.to === 'push' ? this.rows.map((n) => parseFloat(getComputedStyle(n).opacity)) : [];
  }
  mount() {
    const h = this.begin();
    const t0 = this.t0;
    if (this.to === 'hit') {
      for (const row of this.rows) sweep(h, row, 'hit', t0, !reduce);
      if (!reduce) {
        for (const ic of this.ics) {
          play(h, ic, [{ transform: 'scale(.4)' }, { transform: 'scale(1)' }], 520, t0, { easing: K.spring });
          const g = wrapGlyph(h, ic);
          if (g) play(h, g, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], 300, t0 + 150, { easing: 'ease-out' });
          addCls(h, ic, 'fx-host');
          const p = node('fx-ping');
          ic.append(p);
          h.nodes.push(p);
          play(h, p, [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'scale(1.1)', offset: 0.28 }, { opacity: 0, transform: 'scale(1.9)' }], 900, t0 + 40, { easing: 'ease-out' });
        }
      }
    } else if (this.to === 'dead') {
      for (const row of this.rows) sweep(h, row, 'bust', t0, false);
      if (!reduce) for (const ic of this.ics) play(h, ic, SHAKE, 420, t0, { easing: 'ease-out' });
      for (const s of this.names) strike(h, s, t0 + 100);
    } else {
      this.rows.forEach((row, i) => {
        if (this.op[i] < 0.98) play(h, row, [{ opacity: 1 }, { opacity: this.op[i] }], 620, t0, { easing: 'ease-in-out', fill: 'none' });
      });
      if (this.old.ic) for (const ic of this.ics) ghost(h, ic, this.old.ic, t0);
      if (this.old.bar) for (const b of this.bars) ghostFill(h, b, this.old.bar, t0);
    }
  }
}

// score: changed digits roll like a drum (old up and out, new in from below); the leader's score gets a short pop.
class Roll extends Fx {
  constructor(r, from, to, t0, lead) {
    super(`roll|${r.id}`, r.key, t0, lead ? 1060 : 720);
    Object.assign(this, { r, from: String(from), to: String(to), lead });
  }
  prep(next) {
    const r = next.get(this.r.id);
    if (!r || r.vals[0] !== this.to) return false;
    this.targets = r.els;
    return true;
  }
  measure() {
    this.m = this.targets.map((n) => {
      const cs = getComputedStyle(n);
      return { n, text: n.textContent, color: cs.color, inline: cs.display === 'inline', clip: cs.overflow !== 'visible' };
    });
  }
  mount() {
    const h = this.begin();
    const t0 = this.t0;
    for (const { n, text, color, inline, clip } of this.m) {
      if (text.trim() !== this.to) continue;
      if (reduce) { play(h, n, [{ color: K.accent }, { color }], 900, t0, { easing: 'ease-in', fill: 'none' }); continue; }
      h.undo.push(() => { n.textContent = text; });
      setSty(h, n, 'fontVariantNumeric', 'tabular-nums');
      if (inline && this.lead) { setSty(h, n, 'display', 'inline-block'); if (clip) setSty(h, n, 'overflow', 'visible'); }
      rollDigits(h, n, this.from, this.to, t0);
      if (this.lead) {
        play(h, n, [{ transform: 'scale(1)' }, { transform: 'scale(1.18)', offset: 0.35 }, { transform: 'scale(1)' }], 560, t0 + 170, { easing: 'ease-in-out' });
        play(h, n, [{ color }, { color: K.accent, offset: 0.25 }, { color: K.accent, offset: 0.55 }, { color }], 880, t0 + 120, { fill: 'none' });
      }
    }
  }
}

// ring: arcs sweep from their old length to the new one; the count in the middle pops.
const parseDash = (s) => {
  if (!s) return null;
  const a = s.trim().split(/[\s,]+/).map(Number);
  return a.length && a.every(Number.isFinite) ? a : null;
};
const dashes = (svg) => (svg ? [...svg.querySelectorAll('[stroke-dasharray]')].map((c) => parseDash(c.getAttribute('stroke-dasharray'))) : []);
class Ring extends Fx {
  constructor(r, p, t0) {
    super(`ring|${r.key}`, r.key, t0, 900);
    this.r = r;
    this.v = r.vals[0];
    this.up = (num(r.vals[0]) ?? 0) > (num(p.vals[0]) ?? 0);
    this.oldDash = dashes(p.els[0]);
    this.oldText = p.els[0].querySelector('text')?.textContent ?? null;
  }
  prep(next) {
    const r = next.get(this.r.id);
    if (!r || r.vals[0] !== this.v) return false;
    this.targets = r.els;
    return true;
  }
  measure() { this.fills = this.targets.map((s) => { const tx = s.querySelector('text'); return tx ? getComputedStyle(tx).fill : null; }); }
  mount() {
    const h = this.begin();
    const t0 = this.t0;
    this.targets.forEach((svg, k) => {
      if (!reduce) {
        [...svg.querySelectorAll('[stroke-dasharray]')].forEach((c, i) => {
          const o = this.oldDash[i];
          const nv = parseDash(c.getAttribute('stroke-dasharray'));
          if (!o || !nv || Math.abs(o[0] - nv[0]) < 0.25) return;
          const gap = nv[1] ?? o[1] ?? 0;
          play(h, c, [{ strokeDasharray: `${o[0]} ${gap}` }, { strokeDasharray: `${nv[0]} ${gap}` }], 720, t0, { easing: K.out });
        });
      }
      const tx = svg.querySelector('text');
      if (tx && tx.textContent !== this.oldText) {
        if (reduce) { if (this.fills[k]) play(h, tx, [{ fill: K.hit }, { fill: this.fills[k] }], 900, t0, { easing: 'ease-in', fill: 'none' }); }
        else play(h, tx, [{ transform: 'scale(.5)', opacity: 0.25 }, { transform: 'scale(1)', opacity: 1 }], 520, t0 + 180, { easing: K.spring });
      }
      if (this.up && !reduce) play(h, svg, [{ transform: 'scale(1)' }, { transform: 'scale(1.09)', offset: 0.4 }, { transform: 'scale(1)' }], 600, t0 + 120, { easing: 'ease-in-out' });
    });
  }
}

/* ---------- effect parts ---------- */
function sweep(h, row, tone, t0, moving) {
  addCls(h, row, 'fx-host', 'fx-iso');
  const s = node('fx-sweep', `fx-${tone}${moving ? '' : ' fx-flat'}`);
  row.append(s);
  h.nodes.push(s);
  const o = '0 50%';
  if (moving) {
    play(h, s, [
      { opacity: 1, transform: 'scaleX(0)', transformOrigin: o, offset: 0, easing: 'cubic-bezier(.2,.8,.2,1)' },
      { opacity: 1, transform: 'scaleX(1)', transformOrigin: o, offset: 0.36, easing: 'ease-in' },
      { opacity: 0, transform: 'scaleX(1)', transformOrigin: o, offset: 1 },
    ], 1100, t0);
  } else play(h, s, [{ opacity: 1 }, { opacity: 0 }], tone === 'bust' ? 820 : 900, t0, { easing: 'ease-in' });
}

function wrapGlyph(h, ic) {
  const kids = [...ic.childNodes];
  if (!kids.length) return null;
  const g = document.createElement('fx-glyph');
  for (const k of kids) g.append(k);
  ic.append(g);
  h.undo.push(() => { for (const k of [...g.childNodes]) ic.insertBefore(k, g); g.remove(); });
  return g;
}

// The design strikes dead names with text-decoration; we draw our own line left → right, then cross-fade to theirs.
// (Name element: .sr-nm on Live/Lab rows, .nm in slip cards. Only animates where styles.css strikes the name.)
function strikeInfo(row) {
  const nm = row.querySelector('.sr-nm, .nm');
  if (!nm) return null;
  const cs = getComputedStyle(nm);
  if (!/line-through/.test(cs.textDecorationLine || '')) return null;
  const rg = document.createRange();
  rg.selectNodeContents(nm);
  const tr = rg.getBoundingClientRect();
  const br = nm.getBoundingClientRect();
  if (!tr.width) return null;
  const th = parseFloat(cs.textDecorationThickness) || Math.max(1, Math.round((parseFloat(cs.fontSize) || 14) * 0.08));
  return {
    nm, color: cs.textDecorationColor, th,
    x: tr.left - br.left - px(cs.borderLeftWidth),
    y: tr.top - br.top - px(cs.borderTopWidth) + tr.height * 0.56 - th / 2,
    w: Math.max(0, Math.min(tr.width, br.right - tr.left - px(cs.paddingRight))),
  };
}
function strike(h, s, at) {
  addCls(h, s.nm, 'fx-host');
  const l = node('fx-strike');
  l.style.cssText = `left:${s.x.toFixed(1)}px;top:${s.y.toFixed(1)}px;width:${s.w.toFixed(1)}px;height:${s.th}px;background:${s.color}`;
  s.nm.append(l);
  h.nodes.push(l);
  const o = '0 50%';
  play(h, l, [
    { opacity: 1, transform: 'scaleX(0)', transformOrigin: o, offset: 0, easing: 'cubic-bezier(.3,.7,.2,1)' },
    { opacity: 1, transform: 'scaleX(1)', transformOrigin: o, offset: 0.6 },
    { opacity: 1, transform: 'scaleX(1)', transformOrigin: o, offset: 0.78 },
    { opacity: 0, transform: 'scaleX(1)', transformOrigin: o, offset: 1 },
  ], 760, at);
  play(h, s.nm, [{ textDecorationColor: 'transparent' }, { textDecorationColor: 'transparent', offset: 0.78 }, { textDecorationColor: s.color }], 760, at);
}

// push: the previous (live) icon / fill sit on top of the new muted ones and fade away.
function ghost(h, ic, oldIc, t0) {
  const g = node('fx-ghost');
  const c = oldIc.cloneNode(true);
  strip(c);
  g.append(c);
  addCls(h, ic, 'fx-host');
  ic.append(g);
  h.nodes.push(g);
  play(h, g, [{ opacity: 1 }, { opacity: 0 }], 620, t0, { easing: 'ease-in-out' });
}
function ghostFill(h, fill, oldFill, t0) {
  const track = fill.parentElement;
  if (!track) return;
  const c = oldFill.cloneNode(true);
  strip(c);
  c.setAttribute('aria-hidden', 'true');
  c.style.opacity = '0';
  track.append(c);
  h.nodes.push(c);
  play(h, c, [{ opacity: 1 }, { opacity: 0 }], 620, t0, { easing: 'ease-in-out' });
}

function rollDigits(h, n, from, to, t0) {
  const a = [...from];
  const b = [...to];
  const len = Math.max(a.length, b.length);
  while (a.length < len) a.unshift('');
  while (b.length < len) b.unshift('');
  n.textContent = '';
  for (let i = 0; i < len; i++) {
    if (!b[i]) continue;
    if (a[i] === b[i]) { n.append(b[i]); continue; }
    const slot = document.createElement('fx-dig');
    const inn = document.createElement('fx-in');
    inn.textContent = b[i];
    slot.append(inn);
    const at = t0 + (len - 1 - i) * 60; // ones first, then tens — like a drum carrying over
    play(h, inn, [{ transform: 'translateY(100%)', opacity: 0.2 }, { transform: 'translateY(0)', opacity: 1 }], 540, at, { easing: ROLL });
    if (a[i]) {
      const out = node('fx-out', '', a[i]);
      slot.append(out);
      play(h, out, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], 540, at, { easing: ROLL, fill: 'both' });
    }
    n.append(slot);
  }
}

/* ---------- "+N" chip placement ---------- */
// Left of the number if its column has room (singles), after the line if the line has room (summary strip,
// bankroll), otherwise just above the number (slip legs, Lab). Hosted by the nearest box that won't clip it.
function lineOf(n) {
  for (let e = n; e && e !== ROOT; e = e.parentElement) {
    const d = getComputedStyle(e).display;
    if (!d.startsWith('inline') && d !== 'contents') return e;
  }
  return ROOT;
}
function hostOf(start, box) {
  for (let e = start; e; e = e.parentElement) {
    if (e === ROOT) return e;
    const cs = getComputedStyle(e);
    if (cs.display === 'inline' || cs.display === 'contents') continue;
    if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
      const r = e.getBoundingClientRect();
      if (box.l < r.left - 1 || box.r > r.right + 1 || box.t < r.top - 1 || box.b > r.bottom + 1) continue;
    }
    return e;
  }
  return ROOT;
}
function lineEnd(line, cy) {
  const rg = document.createRange();
  rg.selectNodeContents(line);
  let end = -Infinity;
  for (const q of rg.getClientRects()) if (q.width && q.top <= cy && q.bottom >= cy) end = Math.max(end, q.right);
  return end === -Infinity ? line.getBoundingClientRect().right : end;
}
const contentBox = (e) => {
  const r = e.getBoundingClientRect();
  const s = getComputedStyle(e);
  return { l: r.left + px(s.borderLeftWidth) + px(s.paddingLeft), r: r.right - px(s.borderRightWidth) - px(s.paddingRight) };
};
function chipSpot(anchor, text, big) {
  if (!text) return null;
  const ar = anchor.getBoundingClientRect();
  if (!ar.width || !ar.height) return null;
  const line = lineOf(anchor);
  // a line stacked in a flex column (number over money, right-aligned) has the column's free width to its left
  const par = line !== anchor && line !== ROOT ? line.parentElement : null;
  const ps = par && getComputedStyle(par);
  const col = ps && ps.display.endsWith('flex') && ps.flexDirection.startsWith('column') ? par : line;
  const inL = contentBox(col).l;
  const inR = contentBox(line).r;
  const w = text.length * (big ? 7.8 : 6.6) + (big ? 16 : 12);
  const hh = big ? 22 : 17;
  const rise = 16;
  const cy = ar.top + ar.height / 2;
  let mode, x, y, box;
  if (line !== anchor && ar.left - inL >= w + 5) {
    mode = 'left'; x = ar.left - 5; y = cy;
    box = { l: x - w, r: x, t: cy - hh / 2 - rise, b: cy + hh / 2 };
  } else {
    const end = lineEnd(line, cy);
    if (inR - end >= w + 8) {
      mode = 'after'; x = end + 7; y = cy;
      box = { l: x, r: x + w, t: cy - hh / 2 - rise, b: cy + hh / 2 };
    } else {
      mode = 'above'; x = ar.left + ar.width / 2; y = ar.top + 3;
      box = { l: x - w / 2, r: x + w / 2, t: y - hh - rise, b: y };
    }
  }
  const host = hostOf(line === anchor ? anchor.parentElement : line, box);
  const hr = host.getBoundingClientRect();
  const hs = getComputedStyle(host);
  return { host, mode, x: x - hr.left - px(hs.borderLeftWidth), y: y - hr.top - px(hs.borderTopWidth) };
}
const CHIP = { left: ['translate(-100%,-50%)', '100% 50%'], after: ['translate(0,-50%)', '0 50%'], above: ['translate(-50%,-100%)', '50% 100%'] };
function chip(h, s, text, tone, t0, big) {
  const c = node('fx-chip', `fx-${tone}${big ? ' fx-chip-lg' : ''}`, text);
  const [base, origin] = CHIP[s.mode];
  addCls(h, s.host, 'fx-host');
  c.style.left = `${s.x.toFixed(1)}px`;
  c.style.top = `${s.y.toFixed(1)}px`;
  c.style.transformOrigin = origin;
  s.host.append(c);
  h.nodes.push(c);
  if (reduce) {
    play(h, c, [{ opacity: 0, transform: base }, { opacity: 1, transform: base, offset: 0.12 }, { opacity: 1, transform: base, offset: 0.62 }, { opacity: 0, transform: base }], 1200, t0);
    return;
  }
  const f = (o, y, sc, offset, easing) => ({ opacity: o, transform: `${base} translateY(${y}px) scale(${sc})`, offset, easing });
  const rise = s.mode === 'above' ? 11 : 15; // above the number there's less room before the row above
  play(h, c, [
    f(0, 5, 0.5, 0, 'cubic-bezier(.2,.9,.3,1.3)'),
    f(1, 0, 1.06, 0.16, 'ease-out'),
    f(1, 0, 1, 0.28, 'linear'),
    f(1, -3, 1, 0.52, 'cubic-bezier(.4,0,.7,1)'),
    f(0, -rise, 0.92, 1, 'linear'),
  ], 1200, t0);
}

/* ---------- render bookkeeping ---------- */
function index(root) {
  const m = new Map();
  let i = 0;
  for (const n of root.querySelectorAll('[data-fx][data-k]')) {
    const kind = n.getAttribute('data-fx');
    const key = n.getAttribute('data-k');
    const id = `${kind}|${key}`;
    let r = m.get(id);
    if (!r) m.set(id, (r = { id, kind, key, els: [], vals: [], order: i }));
    r.els.push(n);
    r.vals.push(n.getAttribute('data-v') ?? '');
    i++;
  }
  return m;
}

function diff(prev, next, t, ctx) {
  const jobs = [];
  const add = (order, group, make) => jobs.push({ order, group, make });
  const boot = performance.now() < BOOT;
  for (const n of next.values()) {
    const p = prev.get(n.id);
    if (!p) continue; // new on screen: nothing to compare with
    const a = p.vals[0];
    const b = n.vals[0];
    if (a === b && n.kind !== 'ring') continue;
    switch (n.kind) {
      case 'val': {
        const x = num(a), y = num(b);
        if (x == null || y == null || y <= x) break; // decreases (stat corrections) just swap
        const row = next.get(`row|${n.key}`);
        if (!row && boot && x === 0) break;
        const tone = row ? toneOf(row.vals[0]) : n.key.startsWith('lsum:hit') ? 'hit' : 'info';
        add(n.order, n.key, (t0) => new Count(n, x, y, t0, tone, ctx, effects.get(`count|${n.id}`)));
        break;
      }
      case 'money': {
        const x = num(a), y = num(b);
        if (x == null || y == null || Math.abs(y - x) < 0.005 || (boot && x === 0)) break;
        add(n.order, n.key, (t0) => new Count(n, x, y, t0, y > x ? 'hit' : 'bust', ctx, effects.get(`count|${n.id}`)));
        break;
      }
      case 'bar': {
        const x = num(a), y = num(b);
        if (x == null || y == null || Math.abs(y - x) < 0.05) break;
        add(n.order, n.key, (t0) => new Bar(n, x, y, t0, effects.get(`bar|${n.id}`)));
        break;
      }
      case 'row':
        // Only from live: "pending → anything" is mostly data arriving (boot, games loading), not a moment.
        if (a === 'live' && (b === 'hit' || b === 'dead' || b === 'push')) add(n.order, n.key, (t0) => new State(n, b, t0, prev));
        break;
      case 'score': {
        if (b === '') break;
        const cut = n.key.lastIndexOf(':');
        const gid = n.key.slice(0, cut);
        const other = num(next.get(`score|${gid}:${n.key.slice(cut + 1) === 'a' ? 'h' : 'a'}`)?.vals[0]);
        const lead = num(b) != null && other != null && num(b) > other;
        add(n.order, `score:${gid}`, (t0) => new Roll(n, a, b, t0, lead));
        break;
      }
      case 'ring': {
        const od = dashes(p.els[0]);
        const nd = dashes(n.els[0]);
        const moved = a !== b || od.length !== nd.length || od.some((d, i) => !d || !nd[i] || Math.abs(d[0] - nd[i][0]) > 0.25);
        if (!moved) break;
        // With its legs on screen, only animate when one of them actually settled from live (not on data arriving).
        const legs = [...next.values()].filter((r) => r.kind === 'row' && r.key.startsWith(`${n.key}:`));
        if (legs.length ? !legs.some((r) => prev.get(r.id)?.vals[0] === 'live' && r.vals[0] !== 'live') : boot && num(a) === 0) break;
        add(n.order, `ring:${n.key}`, (t0) => new Ring(n, p, t0));
        break;
      }
      default:
    }
  }
  if (!jobs.length) return;
  const groups = new Map();
  for (const j of jobs) {
    const g = groups.get(j.group);
    if (g) { g.order = Math.min(g.order, j.order); g.list.push(j); } else groups.set(j.group, { order: j.order, list: [j] });
  }
  const seq = [...groups.values()].sort((x, y) => x.order - y.order);
  const step = seq.length > 1 ? Math.min(STEP, SPREAD / (seq.length - 1)) : 0;
  seq.forEach((g, i) => {
    const t0 = t + i * step;
    for (const j of g.list) {
      let fx = null;
      try { fx = j.make(t0); } catch (e) { console.error('[fx]', e); }
      if (!fx) continue;
      const old = effects.get(fx.id);
      if (old) { old.teardown(); old.drop(); }
      effects.set(fx.id, fx);
    }
  });
}

function mountAll(next, t) {
  const live = [];
  for (const fx of [...effects.values()]) {
    let ok = false;
    try { ok = t < fx.end && fx.prep(next); } catch (e) { console.error('[fx]', e); }
    if (ok) live.push(fx);
    else { fx.drop(); effects.delete(fx.id); }
  }
  if (live.length) {
    K = K || tokens();
    const ready = live.filter((fx) => { try { fx.measure(); return true; } catch (e) { console.error('[fx]', e); return false; } });
    for (const fx of live) {
      if (ready.includes(fx)) {
        try { fx.mount(t); continue; } catch (e) { console.error('[fx]', e); fx.teardown(); }
      }
      fx.drop();
      effects.delete(fx.id);
    }
  }
  if (counters.size && !raf) raf = requestAnimationFrame(loop);
  else if (!counters.size && raf) { cancelAnimationFrame(raf); raf = 0; }
  reapLater();
}

function loop(ts) {
  raf = 0;
  for (const c of counters) {
    c.draw(ts);
    if (ts >= c.t0 + c.dur) counters.delete(c);
  }
  if (counters.size) raf = requestAnimationFrame(loop);
}

function reapLater() {
  clearTimeout(reapTimer);
  reapTimer = 0;
  let end = Infinity;
  for (const fx of effects.values()) end = Math.min(end, fx.end);
  if (end < Infinity) reapTimer = setTimeout(reap, Math.max(20, end - now() + 40));
}
function reap() {
  reapTimer = 0;
  const t = now();
  for (const fx of [...effects.values()]) if (t >= fx.end) { fx.teardown(); fx.drop(); effects.delete(fx.id); }
  reapLater();
}

// Close zone: a live prop within 1 (2 for PTS/PR/PA/PRA) of its line gets a heartbeat on its bar — pure CSS, it
// stops by itself when a later render no longer marks it. The phase is pinned to the clock so re-renders don't
// restart the beat.
function heartbeat(next, t) {
  let phase = null;
  for (const r of next.values()) {
    if (r.kind !== 'row') continue;
    const v = num(next.get(`val|${r.key}`)?.vals[0]);
    const bars = next.get(`bar|${r.key}`)?.els;
    if (v == null || !bars) continue;
    const close = r.els.some((row) => {
      if (row.getAttribute('data-v') !== 'live' || row.getAttribute('data-market') !== 'prop') return false;
      const line = num(row.getAttribute('data-line'));
      const gap = line == null ? 0 : line - v;
      return gap > 0 && gap <= (BIG.has(row.getAttribute('data-stat')) ? 2 : 1);
    });
    if (!close) continue;
    if (phase == null) phase = `${-Math.round(t % BEAT)}ms`;
    for (const fill of bars) {
      const track = fill.parentElement;
      if (!track || track.querySelector(':scope > fx-beat')) continue;
      track.classList.add('fx-close');
      track.style.setProperty('--fx-phase', phase);
      track.append(node('fx-beat'));
    }
  }
}

export function afterRender(root, ctx = {}) {
  if (!root || !root.querySelectorAll) return;
  ROOT = root;
  K = null;
  reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const t = now();
  const sc = `${ctx.route}|${ctx.acct}`;
  const next = index(root);
  // the previous DOM was just replaced: take everything off it (remember where moving things were first)
  for (const fx of effects.values()) { try { fx.snap(); } catch {} fx.teardown(); }
  if (sc !== scope) {
    scope = sc;
    armAt = t + SETTLE;
    for (const fx of effects.values()) fx.drop();
    effects.clear();
    counters.clear();
  } else if (t >= armAt && document.visibilityState !== 'hidden') {
    diff(mem, next, t, ctx);
  }
  mountAll(next, t);
  heartbeat(next, t);
  mem = next;
}
