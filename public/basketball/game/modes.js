// EasyBuckets Hoops: game modes. Shootaround (timed, streak multipliers, a rebounder feeds you), 1v1 against the CPU
// (to 11 with 2s and 3s, check ball, take it back past the arc after a stop, 12-second shot clock) and the drills the
// challenges use (threes only, step-backs, dunks, free throws, around the world, the three-point contest).
import { COURT, isThree } from './world.js';
import { DIFFS } from './play.js';

export function newStats() { return { pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, greens: 0, dunks: 0, blocks: 0, steals: 0, rebs: 0, tov: 0, streak: 0, best: 0 }; }

const ATW = [[-6.9, 0.5], [-5.2, 5.0], [0, 7.6], [5.2, 5.0], [6.9, 0.5]];
const RACKS = [[-6.95, 0.6], [-5.3, 5.1], [0, 7.6], [5.3, 5.1], [6.95, 0.6]];

export class Shootaround {
  constructor(g, spec = {}) {
    this.g = g; this.spec = spec; this.kind = 'drill';
    this.time = spec.time === undefined ? 60 : spec.time;
    this.score = 0; this.count = 0; this.mult = 1; this.st = newStats(); this.over = false; this.started = false;
    this.ftOnly = spec.filter === 'ft'; this.noDunk = spec.filter === 'three' || spec.filter === 'step' || spec.filter === 'contest';
    this.noDunkLayup = spec.filter === 'three' || spec.filter === 'contest' || spec.filter === 'atw';
    this.atw = 0; this.rack = 0; this.inRack = 0; this.balls = 0; this.attempts = 0;
    this.title = spec.title || 'Shootaround';
  }
  begin() {
    const g = this.g, u = g.user;
    if (this.ftOnly) u.place(0, COURT.FT_Z + 0.25);
    else if (this.spec.filter === 'atw') u.place(ATW[0][0], ATW[0][1] + 0.4);
    else if (this.spec.filter === 'contest') u.place(RACKS[0][0], RACKS[0][1] + 0.4);
    else if (this.spec.filter === 'dunk') u.place(0, 6.0);
    else u.place(0, 7.9);
    g.give(u, 'start');
    this.countdown = 1.6;
    g.ui.callout('READY', 'big');
    this.marker();
  }
  marker() {
    const g = this.g;
    if (this.spec.filter === 'atw') g.setSpot(ATW[this.atw]);
    else if (this.spec.filter === 'contest') g.setSpot(RACKS[this.rack]);
    else if (this.ftOnly) g.setSpot([0, COURT.FT_Z + 0.25]);
    else g.setSpot(null);
  }
  get locked() { return this.ftOnly; }
  update(dt) {
    const g = this.g;
    if (this.countdown > 0) { this.countdown -= dt; if (this.countdown <= 0) { g.ui.callout('GO', 'big'); this.started = true; } return; }
    if (this.over) return;
    if (this.time > 0 && !this.ftOnly) {
      this.time -= dt;
      if (this.time <= 0) { this.time = 0; if (!g.shotLive()) this.finish(); else this.pendingEnd = true; }
    }
    if (this.pendingEnd && !g.shotLive()) this.finish();
    // keep the drill moving: a loose ball comes back to you
    if (!g.user.has && g.ball.holder === null && !g.shotLive() && !g.passing && g.looseFor > 1.4) g.feed(g.user);
  }
  shotInfoOk(info) {
    const f = this.spec.filter;
    if (f === 'three' || f === 'contest') return info.three;
    if (f === 'mid') return !info.three && info.dist >= 3.6 && info.kind === 'jump';
    if (f === 'dunk') return info.kind === 'dunk';
    if (f === 'step') return info.variant === 'step';
    if (f === 'atw') return Math.hypot(info.x - ATW[this.atw][0], info.z - ATW[this.atw][1]) < 1.3;
    return true;
  }
  onShotEnd(shot) {
    const g = this.g, st = this.st;
    if (this.over && !this.pendingEnd) return;
    const info = shot.info, made = shot.made;
    st.fga++; if (info.three) st.tpa++;
    if (made) { st.fgm++; if (info.three) st.tpm++; if (info.kind === 'dunk') st.dunks++; }
    if (shot.tm && shot.tm.g === 'green') st.greens++;
    const f = this.spec.filter;
    let counts = made && this.shotInfoOk(info);
    if (f === 'green') counts = made && shot.tm && shot.tm.g === 'green';
    if (made) { st.streak++; st.best = Math.max(st.best, st.streak); } else st.streak = 0;
    if (f === 'contest') {
      this.balls++;
      const money = this.inRack === 4;
      if (made && info.three) { this.score += money ? 2 : 1; g.popup(money ? '+2' : '+1', money ? 'money' : ''); }
      this.inRack++;
      if (this.inRack >= 5) { this.inRack = 0; this.rack++; if (this.rack >= 5) { this.finish(); return; } this.marker(); g.ui.toast('Next rack'); }
    } else if (f === 'atw') {
      if (counts) { this.atw++; g.popup('✓', 'money'); if (this.atw >= ATW.length) { this.finish(); return; } this.marker(); }
    } else if (this.ftOnly) {
      this.attempts++;
      if (made) { this.count++; g.popup('+1', ''); }
      if (this.attempts >= (this.spec.n || 10)) { this.finish(); return; }
    } else {
      this.mult = st.streak >= 6 ? 3 : st.streak >= 3 ? 2 : 1;
      if (counts || (!f && made)) {
        const pts = (info.three ? 3 : 2) * (f ? 1 : this.mult) + (shot.tm && shot.tm.g === 'green' && !f ? 1 : 0);
        this.score += f ? 1 : pts; this.count++;
        g.popup('+' + (f ? 1 : pts), this.mult > 1 && !f ? 'fire' : '');
        if (st.streak === 3 && !f) g.ui.callout('HEATING UP', 'fire');
        if (st.streak === 6 && !f) g.ui.callout('ON FIRE', 'fire');
      }
    }
    g.fire = !f && st.streak >= 6;
    if (this.time > 0 || this.ftOnly || f === 'contest') g.feedSoon(g.user, 0.5);
  }
  onPossession() {}
  onOut() { this.g.feedSoon(this.g.user, 0.4); }
  hud() {
    const f = this.spec.filter;
    const clock = this.ftOnly ? `${this.attempts}/${this.spec.n || 10}` : f === 'atw' ? `${Math.min(this.atw + 1, 5)}/5` : fmt(this.time);
    const left = f === 'contest' ? `RACK ${Math.min(this.rack + 1, 5)} · BALL ${this.inRack + 1}` : f === 'atw' ? 'SPOT' : f === 'ft' ? 'MADE' : f ? 'MADE' : 'SCORE';
    const val = this.ftOnly ? this.count : f === 'atw' ? fmt(this.elapsed()) : f ? (f === 'contest' ? this.score : this.count) : this.score;
    return { left, lval: val, center: clock, warn: !this.ftOnly && f !== 'atw' && this.time < 10, right: this.mult > 1 && !f ? `x${this.mult}` : `STREAK ${this.st.streak}`, rval: '' };
  }
  elapsed() { return (this.spec.time || 90) - this.time; }
  finish() {
    if (this.over) return;
    this.over = true; this.pendingEnd = false;
    const f = this.spec.filter;
    let value = this.score;
    if (this.ftOnly) value = this.count;
    else if (f === 'atw') value = this.atw >= ATW.length ? this.elapsed() : 0;
    else if (f && f !== 'contest') value = this.count;
    this.g.endMode({ kind: 'drill', title: this.title, value, score: this.score, st: this.st, spec: this.spec, done: f === 'atw' ? this.atw >= ATW.length : true });
  }
}

export class OneOnOne {
  constructor(g, spec) {
    this.g = g; this.spec = spec; this.kind = '1v1'; this.to = spec.to || 11;
    this.s = [0, 0]; this.st = [newStats(), newStats()]; this.over = false; this.shotClock = 12;
    this.cleared = true; this.offense = null; this.title = '1v1';
  }
  begin() { this.check(this.g.user); }
  check(off) {
    const g = this.g, def = off === g.user ? g.cpu : g.user;
    off.place(0.0, 8.4); def.place(0.0, 6.7, 0);
    def.face = Math.atan2(off.pos.x - def.pos.x, off.pos.z - def.pos.z);
    g.give(off, 'check');
    this.offense = off; this.cleared = true; this.shotClock = 12; this.pause = 0.9;
    g.ui.callout(off === g.user ? 'YOUR BALL' : 'DEFENCE', off === g.user ? '' : 'warn');
    g.setMode(off === g.user ? 'offense' : 'defense');
  }
  needClear(a) { return a === this.offense && !this.cleared; }
  get i() { return this.g.user === this.offense ? 0 : 1; }
  update(dt) {
    const g = this.g;
    if (this.over) return;
    if (this.pause > 0) { this.pause -= dt; g.freeze = this.pause > 0; return; }
    g.freeze = false;
    const off = this.offense;
    if (!this.cleared && off && off.has) {
      const d = Math.hypot(off.pos.x, off.pos.z);
      if (isThree(off.pos.x, off.pos.z) && d > COURT.THREE_R - 0.1) { this.cleared = true; if (off === g.user) g.ui.toast('Cleared'); g.setMode('offense'); }
    }
    if (off && off.has && !g.shotLive()) {
      this.shotClock -= dt;
      if (this.shotClock <= 0) { this.shotClock = 0; g.sfx('buzzer'); g.ui.callout('SHOT CLOCK', 'warn'); this.st[this.idx(off)].tov++; this.later(() => this.check(this.other(off)), 0.9); this.offense = null; }
    }
    if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0 && this.then) { const f = this.then; this.then = null; f(); } }
  }
  later(f, t) { this.wait = t; this.then = f; }
  other(a) { return a === this.g.user ? this.g.cpu : this.g.user; }
  idx(a) { return a === this.g.user ? 0 : 1; }
  onRelease(shooter, info) {
    // a shot from inside the arc before clearing it does not count
    this.uncleared = !this.cleared && shooter === this.offense;
  }
  onShotEnd(shot) {
    const g = this.g, a = shot.shooter, i = this.idx(a), st = this.st[i];
    if (this.over) return;
    st.fga++; if (shot.info.three) st.tpa++;
    if (shot.tm && shot.tm.g === 'green') st.greens++;
    if (shot.made && !shot.blocked) {
      if (shot.uncleared) { g.ui.callout('NO GOOD: CLEAR IT', 'warn'); this.later(() => this.check(this.other(a)), 1.0); this.offense = null; return; }
      const pts = shot.info.three ? 3 : 2;
      this.s[i] += pts; st.pts += pts; st.fgm++; if (shot.info.three) st.tpm++; if (shot.info.kind === 'dunk') st.dunks++;
      st.streak++; st.best = Math.max(st.best, st.streak);
      g.popup('+' + pts, a === g.user ? '' : 'opp');
      if (this.s[i] >= this.to) { this.finishSoon(a); return; }
      this.offense = null;
      this.later(() => this.check(this.other(a)), 1.1);
    } else {
      st.streak = 0;
      this.shotClock = 12;
    }
  }
  onPossession(a, how) {
    const g = this.g;
    if (this.over || !a) return;
    if (how === 'reb' || how === 'steal' || how === 'loose') {
      if (how === 'reb') this.st[this.idx(a)].rebs++;
      if (how === 'steal') this.st[this.idx(a)].steals++;
      if (a !== this.offense) {
        this.offense = a; this.cleared = false; this.shotClock = 12;
        if (how !== 'steal' && a === g.user) g.ui.toast('Take it back past the arc');
      } else this.shotClock = 12;
      g.setMode(a === g.user ? 'offense' : 'defense');
    }
  }
  onBlock(by) { this.st[this.idx(by)].blocks++; }
  onOut(lastTouch) {
    const g = this.g;
    if (this.over) return;
    const to = lastTouch ? this.other(lastTouch) : this.other(this.offense || g.user);
    g.ui.callout('OUT OF BOUNDS', 'warn');
    this.offense = null;
    this.later(() => this.check(to), 0.8);
  }
  finishSoon(winner) {
    this.over = true;
    const g = this.g;
    g.ui.callout(winner === g.user ? 'GAME!' : 'GAME OVER', winner === g.user ? 'big' : 'warn');
    g.sfx(winner === g.user ? 'roar' : 'buzzer', 1);
    setTimeout(() => g.endMode({ kind: '1v1', title: '1v1', win: winner === g.user, s: this.s.slice(), st: this.st, spec: this.spec,
      opp: g.cpu.d, diff: this.spec.diff }), 1600);
  }
  hud() {
    const g = this.g;
    return { left: short(g.user.d.name), lval: this.s[0], center: this.offense ? String(Math.ceil(this.shotClock)) : '--', warn: this.offense && this.shotClock < 4,
      right: short(g.cpu.d.name), rval: this.s[1], sub: `FIRST TO ${this.to} · ${DIFFS[this.spec.diff].name.toUpperCase()}` };
  }
}

function short(n) { const p = n.split(' '); return p.length > 1 ? (p[0][0] + '. ' + p.slice(1).join(' ')).toUpperCase() : n.toUpperCase(); }
export function fmt(t) { t = Math.max(0, t); const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + String(s).padStart(2, '0'); }

// challenges: some for anyone, some tied to a roster player picked from the data (best step-back taker, best dunker...)
export function buildChallenges(roster) {
  const P = roster.players;
  const by = (f) => P.slice().sort((a, b) => f(b) - f(a))[0];
  const tops = (f, n) => P.slice().sort((a, b) => f(b) - f(a)).slice(0, n);
  const sb = by((p) => (p.t.stepback || 0) * 2 + p.r.three / 300);
  const dk = by((p) => p.r.dunk + p.r.vertical / 3);
  const shooter = by((p) => p.r.three + (p.t.three || 0) * 30);
  const mid = by((p) => p.r.mid);
  const ft = by((p) => p.r.ft);
  const stars = tops((p) => p.ovr, 4);
  const L = [
    { id: 'splash', title: 'Splash Zone', desc: 'Make as many threes as you can in 45 seconds.', spec: { filter: 'three', time: 45 }, stars: [4, 7, 10], xp: 120 },
    { id: 'ice-water', title: 'Ice Water', desc: '10 free throws. Ice the pressure.', spec: { filter: 'ft', n: 10 }, stars: [6, 8, 10], xp: 120, reward: ['ball', 'ice'] },
    { id: 'atw', title: 'Around the World', desc: 'Make one from each of the five spots, in order. Fastest time wins.', spec: { filter: 'atw', time: 90 }, stars: [70, 50, 35], lower: true, xp: 150 },
    { id: 'green-machine', title: 'Green Machine', desc: 'Green releases only count. 60 seconds.', spec: { filter: 'green', time: 60 }, stars: [3, 6, 9], xp: 160, reward: ['shoe', '#36d399'] },
    { id: 'step-' + sb.id, title: 'Step-back: ' + sb.name, desc: `${sb.name} takes more step-backs than anyone here. Make 4 step-back jumpers in 60 seconds (MOVE away from the rim, then shoot).`, player: sb.id, spec: { filter: 'step', time: 60 }, stars: [2, 4, 6], xp: 180 },
    { id: 'rim-rocker', title: 'Rim Rocker: ' + dk.name, desc: `Dunk it. 5 dunks in 40 seconds with ${dk.name}: drive at the rim and press SHOOT.`, player: dk.id, spec: { filter: 'dunk', time: 40 }, stars: [3, 5, 7], xp: 180, reward: ['ball', 'lava'] },
    { id: 'mid-' + mid.id, title: 'Midrange: ' + mid.name, desc: `Pull-ups between the paint and the arc. 8 in 60 seconds with ${mid.name}.`, player: mid.id, spec: { filter: 'mid', time: 60 }, stars: [4, 6, 8], xp: 180 },
    { id: 'contest', title: 'Three-Point Contest', desc: 'Five racks, five balls each, the last ball of each rack is worth 2. 60 seconds.', player: shooter.id, spec: { filter: 'contest', time: 60 }, stars: [10, 15, 20], xp: 220 },
    { id: 'ft-' + ft.id, title: 'Charity Stripe: ' + ft.name, desc: `The best free-throw shooter on these rosters. 10 for 10?`, player: ft.id, spec: { filter: 'ft', n: 10 }, stars: [8, 9, 10], xp: 150 },
  ];
  const diffs = [1, 2, 3, 4];
  stars.forEach((s, i) => L.push({ id: 'beat-' + s.id, title: 'Beat ' + s.name, desc: `1v1 to 11 against ${s.name} (${s.team}, ${s.ovr} OVR) on ${DIFFS[diffs[i]].name}.`, vs: s.id, spec: { diff: diffs[i], to: 11 }, stars: [1, 4, 7], margin: true, xp: 250 + i * 80 }));
  L.push({ id: 'lockdown', title: 'Lockdown', desc: 'Win a 1v1 to 11 on Pro allowing 4 points or fewer.', vs: tops((p) => p.r.three, 1)[0].id, spec: { diff: 1, to: 11 }, stars: [1, 1, 1], lockdown: true, xp: 300 });
  return L;
}
