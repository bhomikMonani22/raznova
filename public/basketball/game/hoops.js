// EasyBuckets Hoops: the app. Renderer, camera, loop, possession and shot resolution, blocks, steals, rebounds,
// replays, progression and the screens. Opened from the hoop in the hero of raznova.in/basketball.
import * as THREE from './three.module.min.js';
import { World, COURT, isThree } from './world.js';
import { Ball, BR } from './ball.js';
import { Agent, Brain, DIFFS, shotChance, greenWindow, grade, rimDist } from './play.js';
import { Controls } from './controls.js';
import { Sound } from './audio.js';
import { Profile, COSMETICS, levelInfo } from './profile.js';
import { UI } from './ui.js';
import { Shootaround, OneOnOne, buildChallenges, fmt } from './modes.js';

const RIM = COURT.RIM;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const JOINTS = ['hips', 'thL', 'shL', 'ftL', 'thR', 'shR', 'ftR', 'spine', 'chest', 'neck', 'head', 'uaL', 'faL', 'haL', 'uaR', 'faR', 'haR'];
const AG_F = 5 + JOINTS.length * 4, NET_F = 72 * 3, REC_N = 330;

class Game {
  constructor(root, roster) {
    this.root = root; this.roster = roster;
    this.time = 0; this.R = Math.random;
    this.sound = new Sound();
    this.profile = new Profile();
    this.ui = new UI(root, this);
    const mobile = matchMedia('(pointer: coarse)').matches;
    this.quality = mobile && Math.min(screen.width, screen.height) < 500 ? 1 : 2;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas: this.ui.canvas, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.quality > 1 ? 2 : 1.75));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);
    this.world = new World(r, this.scene, { quality: this.quality });
    this.ball = new Ball(this.scene); this.ball.holder = null;
    this.controls = new Controls(this.ui.pad);
    this.challenges = buildChallenges(roster);
    this.camPos = new THREE.Vector3(0, 4, 14); this.camLook = new THREE.Vector3(0, 1.5, 3);
    this.fxBuild();
    this.spot = this.makeSpot();
    this.rec = new Float32Array(REC_N * (2 * AG_F + 7 + NET_F)); this.recI = 0; this.recN = 0;
    this.state = 'menu';
    const P = this.profile.d;
    if (!this.player(P.playerId)) { const top = roster.players.slice().sort((a, b) => b.ovr - a.ovr)[0]; P.playerId = top.id; }
    if (!this.player(P.oppId)) P.oppId = roster.players.filter((p) => p.id !== P.playerId).sort((a, b) => b.ovr - a.ovr)[0].id;
    this.buildUser();
    this.resize();
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);
    this.onVis = () => { if (document.hidden && this.state === 'play') this.pause(true); };
    document.addEventListener('visibilitychange', this.onVis);
    this.root.addEventListener('pointerdown', () => this.sound.unlock(), { passive: true });
    this.ui.loaded();
    this.toMenu();
    this.last = performance.now();
    this.running = true;
    const loop = (t) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t;
      try { this.frame(dt); } catch (e) { console.error(e); }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  // ---- data helpers ----
  player(id) { return this.roster.players.find((p) => p.id === +id); }
  teamOf(abbr) { return this.roster.teams.find((t) => t.abbr === abbr) || this.roster.teams[0]; }
  me() { return this.player(this.profile.d.playerId); }
  opp() { return this.player(this.profile.d.oppId); }
  challengeStars() { return Object.values(this.profile.d.ch).reduce((a, b) => a + b, 0); }
  cosName(r) { const c = COSMETICS[r[0]].find((x) => x.id === r[1]); return c ? c.name + ' ' + (r[0] === 'ball' ? 'ball' : r[0] === 'shoe' ? 'shoes' : '') : ''; }
  styleLine(p) {
    const t = p.t || {}, bits = [];
    if ((t.three || 0) > 0.42) bits.push('lives behind the arc'); else if ((t.rim || 0) > 0.42) bits.push('attacks the rim');
    if ((t.stepback || 0) > 0.05) bits.push('step-back threat');
    if ((t.pullup || 0) > 0.22) bits.push('pull-up shooter');
    if ((t.dunk || 0) > 0.1) bits.push('finishes above the rim');
    if (p.r.block >= 85) bits.push('rim protector'); if (p.r.steal >= 85) bits.push('quick hands');
    if (p.r.handle >= 88) bits.push('elite handle');
    return 'Style: ' + (bits.length ? bits.join(', ') : 'all-round') + '. Ratings come from his 2025-26 and 2026-27 box scores and shot charts.';
  }
  cosmetics() {
    const E = this.profile.d.equip, o = {};
    if (E.shoe && E.shoe !== 'team') o.shoe = E.shoe; else o.shoe = 'team';
    if (E.acc.headband) o.headband = true; if (E.acc.sleeve) o.sleeve = 'R'; if (E.acc.knee) o.knee = 'L';
    if (E.acc.wrist) o.wrist = true; if (E.acc.tights) o.tights = true;
    return o;
  }

  // ---- agents ----
  disposeAgent(a) {
    if (!a) return;
    a.dispose();
    a.rig.root.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); const m = o.material; if (m.map) m.map.dispose(); m.dispose(); } });
  }
  buildUser() {
    this.disposeAgent(this.user);
    const d = this.me();
    this.user = new Agent(this, d, this.teamOf(d.team), { cosmetics: this.cosmetics() });
    const E = this.profile.d.equip;
    this.ball.setSkin(E.ball || 'classic');
    const team = this.teamOf(d.team);
    this.world.setTheme(E.court || 'home', team.color, team.alt);
  }
  buildCpu(d) {
    this.disposeAgent(this.cpu);
    const me = this.me(), team = this.teamOf(d.team);
    const clash = d.team === me.team || colorDist(team.color, this.teamOf(me.team).color) < 90;
    this.cpu = new Agent(this, d, team, { cpu: true, white: clash });
    this.brain = new Brain(this.cpu, this, this.profile.d.diff || 0);
  }
  agents() { return this.cpu && this.mode && this.mode.kind === '1v1' ? [this.user, this.cpu] : [this.user]; }
  other(a) { return a === this.user ? (this.mode && this.mode.kind === '1v1' ? this.cpu : null) : this.user; }
  defenderGap(a) { const o = this.other(a); return o ? Math.hypot(o.pos.x - a.pos.x, o.pos.z - a.pos.z) : 99; }

  // ---- screens and actions ----
  toMenu() {
    this.state = 'menu'; this.mode = null; this.freeze = false;
    this.ui.playing(false); this.ui.replayChip(false); this.controls.reset();
    if (this.cpu) { this.disposeAgent(this.cpu); this.cpu = null; this.brain = null; }
    this.user.place(0, 6.2, 0); this.give(this.user, 'menu');
    this.world.setShotClock(null);
    this.setSpot(null);
    this.ui.show('menu');
  }
  action(a, v, el) {
    const P = this.profile.d;
    switch (a) {
      case 'exit': this.close(); break;
      case 'menu': this.toMenu(); break;
      case 'shootaround': this.startMode({ kind: 'drill', spec: { time: 60, title: 'Shootaround' } }); break;
      case 'practice': this.startMode({ kind: 'drill', spec: { time: 0, title: 'Practice' } }); break;
      case '1v1': this.ui.show('setup'); break;
      case 'challenges': this.ui.show('challenges'); break;
      case 'locker': this.ui.show('locker'); break;
      case 'career': this.ui.show('career'); break;
      case 'players': this.ui.show('players', { team: this.me().team, back: this.ui.screenName === 'setup' ? 'back1v1' : 'menu' }); break;
      case 'pickOpp': this.ui.show('players', { team: this.opp().team, pick: 'opp', back: 'back1v1' }); break;
      case 'back1v1': this.ui.show('setup'); break;
      case 'team': this.ui.show('players', { ...this.ui.data, team: v, sel: null }); break;
      case 'pick': {
        const d = this.ui.data;
        this.ui.show('players', { ...d, sel: +v });
        if (d.pick !== 'opp') this.previewPlayer(+v);
        const det = this.ui.screen.querySelector('.hx-detail'); if (det) det.scrollIntoView({ block: 'nearest' });
        break;
      }
      case 'confirm': P.playerId = +v; if (P.oppId === +v) P.oppId = this.roster.players.find((p) => p.id !== +v).id; this.profile.save(); this.buildUser(); this.user.place(0, 6.2, 0); this.give(this.user, 'menu'); this.ui.show(this.ui.data.back === 'back1v1' ? 'setup' : 'menu'); break;
      case 'confirmOpp': P.oppId = +v; this.profile.save(); this.ui.show('setup'); break;
      case 'diff': P.diff = +v; this.profile.save(); this.ui.show('setup'); break;
      case 'to': P.to = +v; this.profile.save(); this.ui.show('setup'); break;
      case 'start1v1': this.startMode({ kind: '1v1', spec: { diff: P.diff || 0, to: P.to || 11 } }); break;
      case 'challenge': this.startChallenge(this.challenges.find((c) => c.id === v)); break;
      case 'locked': this.ui.toast('Finish an earlier challenge first'); break;
      case 'lockedItem': this.ui.toast('Locked: level up or finish its challenge'); break;
      case 'equip': {
        const k = el.getAttribute('data-k');
        if (k === 'acc') P.equip.acc[v] = !P.equip.acc[v]; else P.equip[k] = v;
        this.profile.save(); this.buildUser(); this.user.place(0, 6.2, 0); this.give(this.user, 'menu');
        this.ui.show('locker'); break;
      }
      case 'resume': this.pause(false); break;
      case 'restart': this.pause(false); this.startMode(this.lastStart); break;
      case 'quit': this.toMenu(); break;
      case 'rematch': this.startMode(this.lastStart); break;
      case 'replay': this.playReplay(); break;
    }
  }
  previewPlayer(id) {
    const P = this.profile.d, keep = P.playerId;
    P.playerId = id; this.buildUser(); P.playerId = keep;
    this.user.place(0, 6.2, 0); this.give(this.user, 'menu');
  }
  pause(on) {
    if (on && this.state === 'play') { this.state = 'pause'; this.controls.reset(); this.ui.show('pause'); this.ui.hideMeter(); }
    else if (!on && this.state === 'pause') { this.state = 'play'; this.ui.hide(); this.ui.playing(true); this.last = performance.now(); }
  }
  startChallenge(c) {
    if (!c) return;
    const P = this.profile.d;
    this.challenge = c;
    if (c.player && P.playerId !== c.player) { this.restoreId = P.playerId; P.playerId = c.player; this.buildUser(); }
    if (c.vs) { P.oppId = c.vs; this.startMode({ kind: '1v1', spec: { ...c.spec }, challenge: c }); }
    else this.startMode({ kind: 'drill', spec: { ...c.spec, title: c.title }, challenge: c });
  }
  startMode(s) {
    this.lastStart = s;
    if (this.sideView) { this.sideView = false; this.resize(); }
    this.challenge = s.challenge || null;
    this.ui.hide(); this.ui.playing(true); this.ui.replayChip(false);
    this.controls.reset(); this.state = 'play'; this.freeze = false; this.fire = false;
    this.recN = 0; this.highlight = null; this.feedT = 0; this.passing = false; this.looseFor = 0;
    if (this.cpu) { this.disposeAgent(this.cpu); this.cpu = null; this.brain = null; }
    if (s.kind === '1v1') {
      this.buildCpu(this.opp());
      this.brain = new Brain(this.cpu, this, s.spec.diff || 0);
      this.mode = new OneOnOne(this, s.spec);
      const team = this.teamOf(this.me().team);
      this.world.setTheme(this.profile.d.equip.court || 'home', team.color, team.alt);
    } else {
      this.mode = new Shootaround(this, s.spec);
    }
    this.setMode('offense');
    this.mode.begin();
    this.profile.d.stats.sessions++;
    this.sound.unlock();
  }
  setMode(m) {
    const c = this.controls, u = this.user;
    const clear = this.mode && this.mode.needClear ? this.mode.needClear(u) : false;
    if (m === 'defense') { c.setMode('defense'); u.def = 1; } else { c.setMode('offense', { shootDim: clear, shootLabel: clear ? 'CLEAR' : 'SHOOT', noMove: this.mode && this.mode.ftOnly }); u.def = 0; }
    if (this.cpu) this.cpu.def = m === 'offense' ? 1 : 0;
    this.side = m;
  }

  // ---- possession ----
  give(a, how) {
    const b = this.ball;
    for (const x of [this.user, this.cpu]) if (x) x.has = false;
    b.holder = a; b.state = 'held'; b.shot = null; b.spin.set(0, 0, 0);
    a.has = true; a.hand = 'R'; a.dph = 0.05; a.act = a.act && a.act.type === 'block' ? a.act : null;
    this.lastTouch = a; this.passing = false; this.looseFor = 0;
    if (this.mode && how !== 'start' && how !== 'check') this.mode.onPossession && this.mode.onPossession(a, how);
    if (this.mode && this.mode.kind === '1v1' && (how === 'reb' || how === 'steal' || how === 'loose')) {
      this.setMode(a === this.user ? 'offense' : 'defense');
    }
  }
  shotLive() { const s = this.ball.shot; return !!(s && !s.ended) || (this.user.act && this.user.act.type && ['shot', 'layup', 'dunk'].includes(this.user.act.type) && !this.user.act.released); }
  shotInfo(a, variant) {
    const act = a.act && ['shot', 'layup', 'dunk'].includes(a.act.type) ? a.act : null;
    const kind = act ? act.kind : 'jump';
    return { kind, variant: act ? act.variant : variant, dist: a.distRim(), three: kind !== 'ft' && isThree(a.pos.x, a.pos.z), x: a.pos.x, z: a.pos.z };
  }
  contestOn(sh, info) {
    const d = this.other(sh);
    if (!d) return 0;
    const dx = d.pos.x - sh.pos.x, dz = d.pos.z - sh.pos.z, dist = Math.hypot(dx, dz) || 1;
    const tr = sh.toRim(new THREE.Vector3());
    const front = clamp((dx * tr.x + dz * tr.z) / dist + 0.35, 0, 1);
    let c = clamp((2.1 - dist) / 1.5, 0, 1) * (0.35 + 0.65 * front);
    c *= 0.62 + 0.38 * d.r.defense / 99 * (d.cpu ? DIFFS[this.mode.spec.diff || 0].contest : 1);
    if (d.airborne || (d.act && d.act.type === 'block')) c *= 1.35;
    c *= 1 + (d.H - sh.H) * 0.9;
    if (d.stun > 0) c *= 0.15;
    if (info.kind === 'dunk' || info.kind === 'layup') c *= 0.85 + 0.3 * d.r.block / 99;
    return clamp(c, 0, 1);
  }
  release(a, forced) {
    const act = a.act;
    if (!act || act.released || !a.has) return;
    act.released = true; act.relAt = act.t;
    const ideal = act.type === 'layup' ? act.take + 0.28 : act.rel;
    const e = forced ? 0.6 : act.t - ideal;
    const info = this.shotInfo(a);
    const rating = info.kind === 'ft' ? a.r.ft : info.kind === 'layup' ? a.r.layup : info.three ? a.r.three : info.dist < 3.6 ? a.r.close : a.r.mid;
    const diffIdx = this.mode && this.mode.spec && this.mode.spec.diff !== undefined && !a.cpu ? this.mode.spec.diff : 1;
    const w = greenWindow(rating, info.kind, diffIdx) * (a.cpu ? [0.5, 0.62, 0.74, 0.86, 1.0][this.mode.spec.diff || 0] : 1);
    let tm = grade(e, w);
    if (a.cpu && tm.g !== 'green') {                                // the CPU misses its timing more gently than a thumb does
      const ae = Math.abs(e);
      tm = ae <= 2.4 * w ? { g: 'good', text: '', mult: 1.0 } : ae <= 5 * w ? { g: 'ok', text: '', mult: 0.84 } : { g: 'bad', text: '', mult: 0.58 };
    }
    const contest = this.contestOn(a, info);
    const p = shotChance(a, info, tm, contest);
    const made = this.R() < p;
    const want = made ? (tm.g === 'green' || this.R() < 0.55 ? 'swish' : 'make') : 'miss';
    const p0 = this.ballPosNow(a);
    const plan = Ball.plan(p0, want, info.kind === 'layup' ? 'layup' : info.kind === 'ft' ? 'ft' : 'jump', this.R);
    const b = this.ball;
    a.has = false; b.holder = null;
    const shot = { shooter: a, info, tm, p, want, contest, uncleared: this.mode && this.mode.needClear ? this.mode.needClear(a) : false, at: this.time };
    b.launch(p0, plan.v, shot);
    this.lastTouch = a;
    if (this.mode && this.mode.onRelease) this.mode.onRelease(a, info);
    const def = this.other(a);
    this.blockWatch = def ? { by: def, until: this.time + (info.kind === 'layup' ? 0.6 : 0.45), shooter: a } : null;
    if (a === this.user) {
      const cs = contest > 0.6 ? 'SMOTHERED' : contest > 0.32 ? 'CONTESTED' : contest > 0.1 ? 'LIGHTLY CONTESTED' : 'WIDE OPEN';
      this.ui.callout(tm.text, tm.g === 'green' ? 'good' : tm.g === 'bad' ? 'warn' : '', `${cs} · ${Math.round(p * 100)}%`);
      this.meterDone = { t: 0.7, green: tm.g === 'green', e, w, ideal };
      if (tm.g === 'green') { this.sfx('green'); this.burst(p0, 'release'); }
    }
  }
  ballPosNow(a) { return a.ballPos.clone(); }
  dunk(a) {
    const act = a.act;
    if (act.released) return;
    act.released = true; act.relAt = act.t;
    const info = this.shotInfo(a);
    const contest = this.contestOn(a, info);
    const def = this.other(a);
    const b = this.ball;
    a.has = false; b.holder = null; this.lastTouch = a;
    const shot = { shooter: a, info, tm: { g: 'good', text: 'DUNK', mult: 1 }, p: 0, contest, uncleared: this.mode && this.mode.needClear ? this.mode.needClear(a) : false, at: this.time, dunk: true };
    // a defender up at the rim can stuff it
    if (def && def.airborne && Math.hypot(def.pos.x - RIM.x, def.pos.z - RIM.z) < 1.6) {
      const pb = clamp(0.12 + 0.45 * (def.r.block - 40) / 59 + (def.H - a.H) * 1.2 - 0.25 * (a.r.dunk - 60) / 39, 0.04, 0.6);
      if (this.R() < pb) { b.launch(this.ballPosNow(a), new THREE.Vector3(a.pos.x * 0.6, 1.5, a.pos.z * 0.6 + 2.5), shot); this.blocked(def, shot); return; }
    }
    const p = shotChance(a, info, shot.tm, contest);
    shot.p = p;
    const u = new THREE.Vector3(RIM.x - a.pos.x, 0, RIM.z - a.pos.z).normalize();
    if (this.R() < p) {
      b.launch(new THREE.Vector3(RIM.x - u.x * 0.05, RIM.y + 0.22, RIM.z - u.z * 0.05), new THREE.Vector3(u.x * 0.2, -5.5, u.z * 0.2), shot);
      act.hang = 0.38;
      this.world.rimHit(0.5); this.sfx('rim', 0.7);
      this.shake = 0.35;
    } else {
      b.launch(new THREE.Vector3(RIM.x - u.x * 0.1, RIM.y + 0.28, RIM.z - u.z * 0.1), new THREE.Vector3(u.x * 2.6, -2.2, u.z * 2.6), shot);
      this.world.rimHit(0.6);
    }
    shot.want = 'dunk';
  }
  blocked(by, shot) {
    const b = this.ball;
    if (shot) { shot.blocked = true; this.endShot(shot, false); }
    const dir = new THREE.Vector3(b.p.x - by.pos.x, 0, b.p.z - by.pos.z).normalize();
    b.v.set(dir.x * 3.4 + (this.R() - 0.5) * 2, -1.2 + this.R(), dir.z * 3.4 + (this.R() - 0.5) * 2);
    b.state = 'loose'; b.shot = null;
    this.lastTouch = by; this.blockWatch = null;
    this.sfx('board', 0.6); this.sfx('roar', 0.7);
    this.world.cheer(1);
    if (this.mode && this.mode.onBlock) this.mode.onBlock(by);
    this.ui.callout('BLOCKED', by === this.user ? 'good' : 'warn');
    this.markHighlight('block');
  }
  feed(a) { this.feedSoon(a, 0); }
  feedSoon(a, t) { this.feedT = t + 0.001; this.feedTo = a; }
  doFeed() {
    const a = this.feedTo, b = this.ball;
    if (!a || a.has) return;
    const T = 0.75;
    const tgt = new THREE.Vector3(a.pos.x + a.vel.x * T * 0.6, a.H * 0.62, a.pos.z + a.vel.z * T * 0.6);
    const from = new THREE.Vector3(Math.sign(tgt.x || 1) * 0.5, 1.3, 0.7);
    const v = new THREE.Vector3((tgt.x - from.x) / T, (tgt.y - from.y + 0.5 * 9.81 * T * T) / T, (tgt.z - from.z) / T);
    b.holder = null; b.launch(from, v, null); b.state = 'loose';
    this.passing = true; this.passT = 0;
  }

  // ---- frame ----
  frame(dt) {
    this.time += dt;
    const input = this.controls.take();
    if (this.state === 'replay') { this.replayStep(dt); this.draw(); return; }
    if (this.state !== 'play') {
      if (input.pause && this.state === 'pause') this.pause(false);
      this.idle(dt);
      this.draw(); return;
    }
    if (input.pause) { this.pause(true); this.draw(); return; }
    const mode = this.mode;
    mode.update(dt);
    if (this.state !== 'play') { this.draw(); return; }
    const u = this.user, cpu = this.cpu;
    // user intent
    if (!this.freeze && !(mode.started === false && mode.countdown > 0)) {
      const dir = this.stickToWorld(input.x, input.y);
      let mag = mode.locked ? 0 : input.mag;
      this.idleT = mag < 0.15 ? (this.idleT || 0) + dt : 0;
      if (this.side === 'defense' && cpu && cpu.has && this.idleT > 0.35) {        // drift to the guard spot when the stick is idle
        const d = rimDist(cpu.pos.x, cpu.pos.z) || 1, gw = d < 3 ? 0.9 : 1.2;
        const gx = cpu.pos.x - cpu.pos.x / d * gw, gz = cpu.pos.z - (cpu.pos.z - RIM.z) / d * gw;
        const dx = gx - u.pos.x, dz = gz - u.pos.z, L = Math.hypot(dx, dz);
        if (L > 0.15) { dir.set(dx / L, 0, dz / L); mag = Math.min(0.38, L); }
      }
      u.drive(dir, mag, input.sprint, dt);
      u.faceTarget = this.side === 'defense' && cpu && cpu.has ? cpu.pos : null;
      if (u.has) {
        if (input.shootDown) {
          if (mode.needClear && mode.needClear(u)) this.ui.toast('Take it back past the arc first');
          else { const a = u.pressShoot(this); if (a && a.type !== 'dunk') this.meterDone = null; }
        }
        if (input.shootUp && u.act && (u.act.type === 'shot' || u.act.type === 'layup') && !u.act.released) this.release(u, false);
        if (input.moveDown) { const a = u.pressMove(dir, input.mag); if (a && a.type !== 'hesi') this.sfx('squeak', 0.8); }
      } else {
        if (input.shootDown) u.pressBlock();
        if (input.moveDown && cpu && cpu.has) u.pressSteal(this.ball.p);
      }
    } else { u.drive(new THREE.Vector3(), 0, false, dt); }
    // cpu
    if (cpu && this.brain && !this.freeze) {
      const it = this.brain.intent(dt, u);
      cpu.drive(it.dir, it.mag, it.sprint, dt);
      if (!cpu.has && !(this.side === 'offense' && u.has)) cpu.faceTarget = null;
    } else if (cpu) cpu.drive(new THREE.Vector3(), 0, false, dt);
    for (const a of this.agents()) a.update(dt, this);
    this.bodies();
    this.ballFrame(dt);
    this.world.update(dt, this.ball.holder ? null : this.ball.p);
    for (const a of this.agents()) a.animate(dt, this);
    if (this.ball.holder) this.ball.mesh.position.copy(this.ball.p);
    this.fxUpdate(dt);
    this.camFollow(dt);
    this.hudFrame(dt);
    this.record();
    if (this.highlight && this.time > this.highlight.t + 0.9 && !this.highlight.shown) { this.highlight.shown = true; this.ui.replayChip(true); this.chipT = 4; }
    if (this.chipT > 0) { this.chipT -= dt; if (this.chipT <= 0) this.ui.replayChip(false); }
    this.draw();
  }

  stickToWorld(x, y) {
    const f = new THREE.Vector3(); this.camera.getWorldDirection(f); f.y = 0; f.normalize();
    const r = new THREE.Vector3(-f.z, 0, f.x);
    const d = new THREE.Vector3().addScaledVector(r, x).addScaledVector(f, -y);
    const L = d.length(); if (L > 1e-3) d.divideScalar(L);
    return d;
  }
  bodies() {
    const A = this.agents();
    if (A.length < 2) return;
    const [a, b] = A;
    const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz), min = a.radius + b.radius;
    if (d < min && d > 1e-4) {
      const o = (min - d) / d, wa = b.r.strength / (a.r.strength + b.r.strength);
      a.pos.x -= dx * o * wa; a.pos.z -= dz * o * wa; b.pos.x += dx * o * (1 - wa); b.pos.z += dz * o * (1 - wa);
    }
  }

  ballFrame(dt) {
    const b = this.ball;
    if (b.holder) {
      // steals and ankle-breakers
      for (const a of this.agents()) {
        if (a === b.holder || !a.act) continue;
        if (a.act.type === 'steal' && !a.act.tried) {
          const palm = a.rig.palm('R', new THREE.Vector3());
          if (palm.distanceTo(b.p) < 0.5) {
            a.act.tried = true;
            const h = b.holder;
            const exposed = (h.act && (h.act.type === 'cross' || h.act.type === 'spin')) ? 0.16 : 0;
            const low = Math.abs(Math.cos(Math.PI * h.dph)) < 0.5 ? 0.06 : 0;
            const ps = clamp(0.1 + 0.36 * (a.r.steal - 40) / 59 - 0.24 * (h.r.handle - 40) / 59 + exposed + low, 0.04, 0.72);
            if (this.R() < ps) {
              a.act.won = true; h.has = false; b.holder = null;
              b.launch(b.p.clone(), new THREE.Vector3(a.act.dir.x * -0.5 + (this.R() - 0.5), 1.6, a.act.dir.z * -0.5 + (this.R() - 0.5)), null);
              b.state = 'loose'; b.stealBy = a; b.stealT = this.time; this.lastTouch = a;
              this.ui.callout('STEAL', a === this.user ? 'good' : 'warn'); this.sfx('cheer', 0.6); this.world.cheer(0.7);
              this.markHighlight('steal');
            }
          }
        }
      }
      const h = b.holder;
      if (h && h.act && (h.act.type === 'cross' || h.act.type === 'spin') && !h.act.checked && h.act.t > h.act.dur * 0.5) {
        h.act.checked = true;
        const d = this.other(h);
        if (d && Math.hypot(d.pos.x - h.pos.x, d.pos.z - h.pos.z) < 1.7 && !d.airborne) {
          const lunging = d.act && d.act.type === 'steal' ? 0.35 : 0;
          const pa = clamp(0.03 + 0.3 * (h.r.handle - 60) / 39 - 0.15 * (d.r.speed - 50) / 49 + lunging - (d.cpu ? 0.04 * (this.mode.spec.diff || 0) : 0), 0.02, 0.6);
          if (this.R() < pa) { d.stumble(0.85 + this.R() * 0.35); this.ui.callout('ANKLES', h === this.user ? 'fire' : 'warn'); this.sfx('roar', 0.8); this.world.cheer(1); this.markHighlight('ankles'); }
        }
      }
      return;
    }
    b.update(dt);
    // sounds, rim shake, made
    for (const [ev, k] of b.events) {
      if (ev === 'floor') this.sfx('bounce', clamp(k / 5, 0.1, 1));
      if (ev === 'rim') { this.sfx('rim', clamp(k / 4, 0.15, 1)); this.world.rimHit(k / 6); if (b.shot) b.shot.touched = true; }
      if (ev === 'board') { this.sfx('board', clamp(k / 4, 0.2, 1)); if (b.shot) b.shot.touched = true; }
      if (ev === 'made') this.made(b.shot);
    }
    const s = b.shot;
    // blocks: the defender's hands meet the ball early in its flight
    const bw = this.blockWatch;
    if (s && !s.ended && bw && this.time < bw.until && bw.by.airborne) {
      const pl = bw.by.rig.palm('L', new THREE.Vector3()), pr = bw.by.rig.palm('R', new THREE.Vector3());
      const dd = Math.min(pl.distanceTo(b.p), pr.distanceTo(b.p));
      if (dd < 0.32) {
        const sh = bw.shooter;
        const pb = clamp(0.2 + 0.5 * (bw.by.r.block - 40) / 59 + (bw.by.H - sh.H) * 1.1 + (s.info.kind === 'layup' ? 0.12 : 0) - 0.12 * (sh.r.three - 60) / 39 * (s.info.kind === 'jump' ? 1 : 0), 0.05, 0.85);
        this.blockWatch = null;
        if (this.R() < pb) { this.blocked(bw.by, s); return; }
      }
    }
    if (s && !s.ended) {
      const below = b.p.y < RIM.y - 0.7 && b.v.y < 0 && (s.touched || s.crossedOut || s.t > 0.7);
      if (!s.made && (s.floor || below || s.t > 4.5)) this.endShot(s, false);
    }
    // loose ball: rebounds, pickups, passes
    if (!b.holder && (b.state === 'loose' || (s && (s.ended || s.touched)))) {
      this.looseFor += dt;
      if (s && s.made && b.p.y > 1.0) return;                      // through the net: dead until the mode resets
      let best = null, bestScore = -1;
      for (const a of this.agents()) {
        if (a.stun > 0.2 || (a.act && ['shot', 'layup', 'dunk'].includes(a.act.type) && !a.act.released)) continue;
        if (s && s.shooter === a && this.time - s.at < 0.35) continue;
        const pl = a.rig.palm('L', new THREE.Vector3()), pr = a.rig.palm('R', new THREE.Vector3());
        const hd = Math.min(pl.distanceTo(b.p), pr.distanceTo(b.p));
        const horiz = Math.hypot(b.p.x - a.pos.x, b.p.z - a.pos.z);
        const ok = hd < 0.32 || (b.p.y < 1.25 && horiz < 0.6) || (b.p.y < a.reach + a.air && horiz < 0.42);
        if (this.passing && a !== this.feedTo) continue;
        if (ok || (this.passing && a === this.feedTo && horiz < 0.95 && b.p.y < a.H * 1.1)) {
          const sc = (a.r.rebound + (b.stealBy === a && this.time - b.stealT < 0.4 ? 200 : 0)) / (0.3 + hd);
          if (sc > bestScore) { bestScore = sc; best = a; }
        }
      }
      if (best) {
        const how = this.passing ? 'pass' : b.stealBy === best && this.time - b.stealT < 1.5 ? 'steal' : s && s.ended && !s.made ? 'reb' : 'loose';
        if (s && !s.ended) this.endShot(s, false);
        b.stealBy = null;
        this.give(best, how);
        if (how === 'reb' && best !== this.user && this.mode.kind === '1v1') this.sfx('cheer', 0.3);
        return;
      }
      if (this.passing) { this.passT += dt; if (this.passT > 2.0) this.passing = false; }
      // out of bounds
      if (b.p.y < 2.2 && (Math.abs(b.p.x) > COURT.SIDE_X + 0.15 || b.p.z < COURT.BASE_Z - 0.15 || b.p.z > COURT.HALF_Z + 0.15)) {
        if (s && !s.ended) this.endShot(s, false);
        b.state = 'dead'; this.passing = false;
        if (this.mode.onOut) this.mode.onOut(this.lastTouch);
        b.state = 'loose';
        b.p.set(clamp(b.p.x, -7.4, 7.4), BR, clamp(b.p.z, -1.4, 12.5)); b.v.set(0, 0, 0);
      }
    }
    if (this.feedT > 0) { this.feedT -= dt; if (this.feedT <= 0) { this.feedT = 0; if (!this.user.has) this.doFeed(); } }
  }
  made(s) {
    if (!s || s.ended) return;
    s.made = true;
    const big = s.dunk || (s.tm && s.tm.g === 'green') || s.info.three;
    this.sfx(s.swish && !s.dunk ? 'swish' : 'swish', 0.9);
    this.sfx(big ? 'roar' : 'cheer', big ? 1 : 0.6);
    this.world.cheer(big ? 1 : 0.6);
    if (s.tm && s.tm.g === 'green') this.burst(new THREE.Vector3(RIM.x, RIM.y, RIM.z), 'rim');
    if (s.dunk) { this.ui.callout('SLAM', s.shooter === this.user ? 'fire' : 'warn'); this.markHighlight('dunk'); }
    else if (s.tm && s.tm.g === 'green' && s.info.three) this.markHighlight('green');
    if (s.shooter && s.shooter.celebrate && !s.dunk) s.shooter.celebrate();
    this.endShot(s, true);
  }
  endShot(s, made) {
    if (s.ended) return;
    s.ended = true; s.made = made;
    if (!made && s.touched && (s.rim || 0) >= 2) this.sfx('ooh', 0.6);
    if (this.mode && this.mode.onShotEnd) this.mode.onShotEnd(s);
  }
  predictLanding(t) {
    const b = this.ball;
    if (b.holder) return b.p;
    const st = { p: b.p.clone(), v: b.v.clone(), s: null };
    const n = Math.round(t / (1 / 240));
    for (let i = 0; i < n; i++) Ball.step(st, 1 / 240, null);
    return st.p;
  }
  markHighlight(kind) { this.highlight = { t: this.time, kind, shown: false }; this.hlFrames = this.recN; }

  // ---- end of a mode: XP, stats, stars ----
  endMode(r) {
    if (this.state !== 'play') return;
    const P = this.profile, S = P.d.stats, B = P.d.bests, c = this.challenge;
    this.state = 'results'; this.controls.reset(); this.ui.playing(false); this.ui.replayChip(false);
    const st = r.kind === '1v1' ? r.st[0] : r.st;
    S.fgm += st.fgm; S.fga += st.fga; S.tpm += st.tpm; S.tpa += st.tpa; S.greens += st.greens; S.dunks += st.dunks;
    S.blocks += st.blocks || 0; S.steals += st.steals || 0; S.rebs += st.rebs || 0; S.streak = Math.max(S.streak, st.best || 0);
    const per = P.per(this.me().id); per.fgm += st.fgm; per.fga += st.fga;
    let xp = 15 + st.fgm * 8 + st.tpm * 4 + st.greens * 6 + st.dunks * 5 + (st.blocks || 0) * 6 + (st.steals || 0) * 6;
    const out = { ...r };
    if (r.kind === '1v1') {
      S.games++; per.games++; per.pts += r.s[0]; S.pts += r.s[0];
      if (r.win) { S.wins++; per.wins++; } else S.losses++;
      xp += (r.win ? 120 : 35) * (1 + 0.35 * (r.diff || 0));
      out.opp = r.opp;
    } else {
      S.pts += r.score || 0; per.pts += r.score || 0;
      const f = r.spec.filter;
      let best = false;
      if (!f && r.spec.time) { if (r.score > B.shootaround) { B.shootaround = r.score; best = true; } out.headline = 'Time'; out.valueText = r.score + ' pts'; }
      else if (!f) { out.headline = 'Practice'; out.valueText = st.fgm + '/' + st.fga; }
      else if (f === 'three') { if (r.value > B.threes) { B.threes = r.value; best = true; } out.headline = 'Splash Zone'; out.valueText = r.value + ' threes'; }
      else if (f === 'ft') { if (r.value > B.ft) { B.ft = r.value; best = true; } out.headline = 'Free throws'; out.valueText = r.value + '/' + (r.spec.n || 10); }
      else if (f === 'atw') { if (r.done && (!B.atw || r.value < B.atw)) { B.atw = r.value; best = true; } out.headline = r.done ? 'World toured' : 'Out of time'; out.valueText = r.done ? fmt(r.value) : `${r.value}`; }
      else if (f === 'contest') { if (r.value > B.contest) { B.contest = r.value; best = true; } out.headline = '3PT Contest'; out.valueText = r.value + ' pts'; }
      else { out.headline = r.title; out.valueText = String(r.value); }
      out.best = best;
      xp += (r.score || 0) * 2;
    }
    if (c) {
      let stars = 0;
      if (c.vs) {
        const margin = r.s[0] - r.s[1];
        if (c.lockdown) stars = r.win && r.s[1] <= 4 ? 3 : 0;
        else stars = !r.win ? 0 : margin >= c.stars[2] ? 3 : margin >= c.stars[1] ? 2 : 1;
      } else if (c.lower) stars = !r.done ? 0 : r.value <= c.stars[2] ? 3 : r.value <= c.stars[1] ? 2 : r.value <= c.stars[0] ? 1 : 0;
      else stars = r.value >= c.stars[2] ? 3 : r.value >= c.stars[1] ? 2 : r.value >= c.stars[0] ? 1 : 0;
      const prev = P.stars(c.id);
      if (stars > prev) { xp += (stars - prev) * Math.round(c.xp / 3); P.setStars(c.id, stars); }
      out.stars = stars;
      if (c.reward && stars >= 2 && P.unlock(c.reward[0], c.reward[1])) out.unlocks = [{ kind: c.reward[0], name: this.cosName(c.reward) }];
      if (this.restoreId) { P.d.playerId = this.restoreId; this.restoreId = null; }
    }
    const before = levelInfo(P.d.xp);
    const lv = P.addXp(xp);
    const after = levelInfo(P.d.xp);
    out.xp = Math.round(xp); out.level = after.level; out.levelUp = lv.to > lv.from;
    out.unlocks = (out.unlocks || []).concat(lv.unlocks);
    out.fromPct = after.level > before.level ? 0 : before.into / before.need * 100;
    out.replay = this.highlight ? true : false;
    P.save();
    this.ui.show('results', out);
    this.ui.animateXp(after.into / after.need * 100);
    if (out.levelUp) this.sfx('level');
    if (c && this.profile.d.playerId !== this.user.d.id) this.buildUser();
  }

  // ---- camera ----
  resize() {
    const w = this.root.clientWidth || window.innerWidth, h = this.root.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.portrait = h > w * 1.05;
    this.camera.fov = this.portrait ? 64 : 46;
    this.vw = w; this.vh = h;
    this.camera.clearViewOffset(); this.sideView = false;
    if (this.portrait) this.camera.setViewOffset(w, h * 1.2, 0, h * 0.1, w, h);
    this.camera.updateProjectionMatrix();
  }
  camFollow(dt) {
    const b = this.ball, u = this.user;
    const focus = b.holder ? b.holder.pos : (b.shot && !b.shot.ended ? (b.shot.shooter ? b.shot.shooter.pos : b.p) : b.p);
    const fx = focus.x, fz = Math.max(focus.z, 0.3);
    // behind the ball handler, on the line from the rim through him, a little wider than him toward the middle
    let ang = Math.atan2(fx, fz + 2.0);
    ang = clamp(ang, -0.75, 0.75);
    const D = this.portrait ? 4.9 : 4.3, Hc = this.portrait ? 3.5 : 2.9;
    const want = new THREE.Vector3(fx * 0.85 + Math.sin(ang) * D, Hc, fz + Math.cos(ang) * D);
    const look = new THREE.Vector3(fx * 0.5, this.portrait ? 1.55 : 1.7, fz * 0.45 - 0.2);
    const k = 1 - Math.exp(-3.2 * dt);
    this.camPos.lerp(want, k); this.camLook.lerp(look, k);
    this.camera.position.copy(this.camPos);
    if (this.shake > 0) { this.shake -= dt; this.camera.position.x += (this.R() - 0.5) * this.shake * 0.25; this.camera.position.y += (this.R() - 0.5) * this.shake * 0.25; }
    this.camera.lookAt(this.camLook);
    void u;
  }
  idle(dt) {
    // menus: the player dribbles at the top of the key while the camera drifts around him
    const u = this.user;
    u.vel.set(0, 0, 0); u.def = 0; u.faceTarget = null;
    if (!u.has) this.give(u, 'menu');
    u.update(dt, this);
    u.face = 0.25 * Math.sin(this.time * 0.4);
    this.world.update(dt, null);
    u.animate(dt, this);
    this.ball.mesh.position.copy(this.ball.p);
    const t = this.time * 0.18;
    const r = this.portrait ? 3.9 : 3.3, scr = this.ui.screenName;
    const close = scr === 'players' || scr === 'locker' ? 0.82 : 1;
    const want = new THREE.Vector3(u.pos.x + Math.sin(t) * r * close, 1.55 + 0.25 * Math.sin(t * 0.7), u.pos.z + Math.cos(t) * r * close + 0.2);
    const look = new THREE.Vector3(u.pos.x, this.portrait ? (scr === 'menu' ? 0.95 : 1.05) : 1.15, u.pos.z);
    const k = 1 - Math.exp(-2.5 * dt);
    if (!this.fixedCam) { this.camPos.lerp(want, k); this.camLook.lerp(look, k); }
    const side = !this.portrait && (scr === 'menu' || scr === 'players' || scr === 'locker');
    if (side !== this.sideView) {
      this.sideView = side; this.camera.clearViewOffset();
      if (side) this.camera.setViewOffset(this.vw * 1.5, this.vh, 0, 0, this.vw, this.vh);
      else if (this.portrait) this.camera.setViewOffset(this.vw, this.vh * 1.2, 0, this.vh * 0.1, this.vw, this.vh);
      this.camera.updateProjectionMatrix();
    }
    this.camera.position.copy(this.camPos); this.camera.lookAt(this.camLook);
    this.fxUpdate(dt);
  }
  render() { this.renderer.render(this.scene, this.camera); }
  draw() { if (!this.noRender) this.render(); }
  // tests: run the game logic without drawing
  sim(seconds, dt = 1 / 60) { const n = Math.round(seconds / dt); for (let i = 0; i < n; i++) this.frame(dt); }

  // ---- HUD ----
  project(v) {
    const p = v.clone().project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * this.vw, y: (-p.y * 0.5 + 0.5) * this.vh, ok: p.z < 1 };
  }
  hudFrame(dt) {
    this.ui.setHud(this.mode.hud());
    const u = this.user, a = u.act;
    if (a && (a.type === 'shot' || a.type === 'layup') && !a.released) {
      const info = this.shotInfo(u);
      const rating = info.kind === 'ft' ? u.r.ft : info.kind === 'layup' ? u.r.layup : info.three ? u.r.three : info.dist < 3.6 ? u.r.close : u.r.mid;
      const diffIdx = this.mode.spec && this.mode.spec.diff !== undefined ? this.mode.spec.diff : 1;
      const w = greenWindow(rating, info.kind, diffIdx);
      const ideal = a.type === 'layup' ? a.take + 0.28 : a.rel, span = ideal + 0.22;
      const head = u.rig.headTop(new THREE.Vector3()), s = this.project(head);
      this.ui.showMeter(s.x + 46, s.y + 20, a.t / span, (ideal - w) / span, (ideal + w) / span, false, false);
    } else if (this.meterDone && this.meterDone.t > 0) {
      this.meterDone.t -= dt;
      if (this.meterDone.t <= 0) this.ui.hideMeter(); else this.ui.meter.classList.add('done'), this.ui.meter.classList.toggle('green', this.meterDone.green);
    } else this.ui.hideMeter();
  }
  popup(text, cls) { const s = this.project(new THREE.Vector3(RIM.x, RIM.y + 0.6, RIM.z)); this.ui.pop(text, s.x, s.y, cls); }
  sfx(n, k) { this.sound.play(n, k); }

  // ---- floor marker for drills ----
  makeSpot() {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.55, 40), new THREE.MeshBasicMaterial({ color: 0xffc24b, transparent: true, opacity: 0.85, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.012; m.visible = false; this.scene.add(m);
    return m;
  }
  setSpot(p) { this.spot.visible = !!p; if (p) this.spot.position.set(p[0], 0.012, p[1]); }

  // ---- particles: green release, rim burst, on-fire trail ----
  fxBuild() {
    const N = 360;
    const geo = new THREE.BufferGeometry();
    this.fxP = new Float32Array(N * 3); this.fxV = new Float32Array(N * 3); this.fxL = new Float32Array(N); this.fxC = new Float32Array(N * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(this.fxP, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.fxC, 3));
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const mat = new THREE.PointsMaterial({ size: 0.13, map: new THREE.CanvasTexture(c), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.fx = new THREE.Points(geo, mat); this.fx.frustumCulled = false; this.scene.add(this.fx);
    this.fxI = 0;
    for (let i = 0; i < N; i++) this.fxP[i * 3 + 1] = -10;
  }
  emit(p, v, col, life) {
    const i = this.fxI = (this.fxI + 1) % this.fxL.length;
    this.fxP.set([p.x, p.y, p.z], i * 3); this.fxV.set([v.x, v.y, v.z], i * 3); this.fxC.set(col, i * 3); this.fxL[i] = life;
  }
  burst(p, where) {
    const fxk = this.profile.d.equip.fx || 'spark';
    const n = where === 'rim' ? 70 : 40;
    for (let i = 0; i < n; i++) {
      const a = this.R() * Math.PI * 2, s = 1 + this.R() * (where === 'rim' ? 3.2 : 2);
      const col = fxk === 'fireworks' ? [[1, 0.8, 0.2], [0.3, 1, 0.6], [1, 0.3, 0.6], [0.4, 0.7, 1]][i % 4] : fxk === 'lightning' ? [0.5, 0.8, 1] : [0.25, 1, 0.6];
      this.emit(p, { x: Math.cos(a) * s, y: (where === 'rim' ? 2 : 1) + this.R() * 2.5, z: Math.sin(a) * s }, col, 0.6 + this.R() * 0.6);
    }
  }
  fxUpdate(dt) {
    const P = this.fxP, V = this.fxV, L = this.fxL, C = this.fxC;
    if (this.fire && !this.ball.holder && this.ball.shot && !this.ball.shot.ended) {
      for (let k = 0; k < 3; k++) this.emit(this.ball.p, { x: (this.R() - 0.5) * 0.6, y: this.R() * 0.6, z: (this.R() - 0.5) * 0.6 }, [1, 0.35 + this.R() * 0.3, 0.05], 0.35);
    }
    for (let i = 0; i < L.length; i++) {
      if (L[i] <= 0) continue;
      L[i] -= dt;
      V[i * 3 + 1] -= 6 * dt;
      P[i * 3] += V[i * 3] * dt; P[i * 3 + 1] += V[i * 3 + 1] * dt; P[i * 3 + 2] += V[i * 3 + 2] * dt;
      if (L[i] <= 0) P[i * 3 + 1] = -10;
      else if (L[i] < 0.25) { C[i * 3] *= 0.9; C[i * 3 + 1] *= 0.9; C[i * 3 + 2] *= 0.9; }
    }
    this.fx.geometry.attributes.position.needsUpdate = true; this.fx.geometry.attributes.color.needsUpdate = true;
  }

  // ---- replays: the last few seconds of every joint, the ball and the net, played back slow ----
  frameSize() { return 2 * AG_F + 7 + NET_F; }
  record() {
    const F = this.frameSize(), o = (this.recI % REC_N) * F, R = this.rec;
    let k = o;
    for (const a of [this.user, this.cpu]) {
      if (!a) { k += AG_F; continue; }
      R[k++] = a.pos.x; R[k++] = a.air; R[k++] = a.pos.z; R[k++] = a.face; R[k++] = a.rig.j.hips.position.y;
      for (const n of JOINTS) { const q = a.rig.j[n].quaternion; R[k++] = q.x; R[k++] = q.y; R[k++] = q.z; R[k++] = q.w; }
    }
    const m = this.ball.mesh;
    R[k++] = m.position.x; R[k++] = m.position.y; R[k++] = m.position.z;
    R[k++] = m.quaternion.x; R[k++] = m.quaternion.y; R[k++] = m.quaternion.z; R[k++] = m.quaternion.w;
    this.world.net.dump(R, k);
    this.recI++; this.recN = Math.min(this.recN + 1, REC_N);
  }
  apply(idx) {
    const F = this.frameSize(), o = (((idx % REC_N) + REC_N) % REC_N) * F, R = this.rec;
    let k = o;
    for (const a of [this.user, this.cpu]) {
      if (!a) { k += AG_F; continue; }
      a.rig.root.position.set(R[k], R[k + 1], R[k + 2]); a.rig.root.rotation.y = R[k + 3]; a.rig.j.hips.position.y = R[k + 4]; k += 5;
      for (const n of JOINTS) { a.rig.j[n].quaternion.set(R[k], R[k + 1], R[k + 2], R[k + 3]); k += 4; }
    }
    this.ball.mesh.position.set(R[k], R[k + 1], R[k + 2]); this.ball.mesh.quaternion.set(R[k + 3], R[k + 4], R[k + 5], R[k + 6]); k += 7;
    this.world.net.setAll(R, k);
  }
  playReplay() {
    if (!this.highlight || this.recN < 30) return;
    const end = this.recI - 1, len = Math.min(this.recN - 1, 210, Math.max(60, this.recI - this.hlFrames + 50));
    const endAt = Math.min(end, this.hlFrames + 50);
    this.rp = { from: endAt - len, to: endAt, i: endAt - len, back: this.state, resume: end, ang: this.R() < 0.5 ? -1 : 1 };
    this.state = 'replay'; this.ui.replayChip(false); this.ui.replaying(true); this.ui.hideMeter();
    this.ui.hud.hidden = true; this.ui.pad.hidden = true; this.ui.screen.hidden = true;
    const skip = () => { if (this.state === 'replay') this.endReplay(); };
    this.root.addEventListener('pointerdown', skip, { once: true });
  }
  replayStep(dt) {
    const rp = this.rp;
    rp.i += dt * 60 * 0.45;
    if (rp.i >= rp.to) { this.endReplay(); return; }
    this.apply(Math.floor(rp.i));
    const bp = this.ball.mesh.position;
    const k = (rp.i - rp.from) / (rp.to - rp.from);
    const ang = rp.ang * (0.9 - 0.7 * k);
    const want = new THREE.Vector3(Math.sin(ang) * 4.6, 1.6 + k * 0.8, 1.2 + Math.cos(ang) * 4.6);
    this.camPos.lerp(want, 1 - Math.exp(-2 * dt)); this.camLook.lerp(new THREE.Vector3(bp.x * 0.5, Math.max(1.6, bp.y * 0.7 + 0.9), bp.z * 0.5), 1 - Math.exp(-4 * dt));
    this.camera.position.copy(this.camPos); this.camera.lookAt(this.camLook);
  }
  endReplay() {
    const rp = this.rp;
    this.apply(rp.resume);
    this.ui.replaying(false);
    this.state = rp.back;
    if (this.state === 'play') { this.ui.hud.hidden = false; this.ui.pad.hidden = false; }
    else this.ui.screen.hidden = false;
    this.last = performance.now();
  }

  close() {
    this.running = false; cancelAnimationFrame(this.raf);
    this.controls.reset();
    if (this.onExit) this.onExit();
  }
  reopen() {
    if (this.running) return;
    this.running = true; this.last = performance.now();
    this.resize();
    if (this.state === 'play') this.pause(true);
    const loop = (t) => { if (!this.running) return; const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t; try { this.frame(dt); } catch (e) { console.error(e); } this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }
}

function colorDist(a, b) {
  const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2);
}

let game = null;
export async function open(el, opts = {}) {
  el.hidden = false;
  if (game) { game.onExit = opts.onExit; game.reopen(); return game; }
  let roster;
  try { if (document.fonts) await Promise.race([document.fonts.load('900 64px "Big Shoulders Display"'), new Promise((r) => setTimeout(r, 1500))]); } catch (_) {}
  try {
    const r = await fetch(new URL('./roster.json', import.meta.url), { cache: 'no-cache' });
    roster = await r.json();
  } catch (e) {
    el.innerHTML = '<div style="padding:40px;color:#eef2f8;font:16px sans-serif">Couldn\'t load the rosters. Check your connection and try again.</div>';
    throw e;
  }
  game = new Game(el, roster);
  game.onExit = opts.onExit;
  window.__hoops = game;
  return game;
}
export function close() { if (game) game.close(); }
