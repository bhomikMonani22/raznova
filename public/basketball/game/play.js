// EasyBuckets Hoops: players on the floor. Movement, dribbling and dribble moves, jumpers / layups / dunks with a
// release meter, blocks, steals, rebounds, and the shot model: every rating changes something you can feel (speed,
// handle, release window, make chance by zone, contest, block and steal odds). The CPU uses the same actions.
import * as THREE from './three.module.min.js';
import { COURT, isThree } from './world.js';
import { Rig, lookFor } from './player.js';
import { BR } from './ball.js';

const RIM = COURT.RIM;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const k01 = (x) => clamp((x - 25) / 74, 0, 1);
const ease = (t) => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
const lerp = THREE.MathUtils.lerp;
const _v = () => new THREE.Vector3();

export function rimDist(x, z) { return Math.hypot(x - RIM.x, z - RIM.z); }

// skill helpers from the player's real tendencies
export function skills(d) {
  const t = d.t || {}, pct = d.pct || {};
  return {
    pullup: clamp((t.pullup || 0) * 2.4 + ((pct.pullup || 0.37) - 0.34) * 6, 0, 1),
    stepback: clamp((t.stepback || 0) * 6 + ((pct.stepback || 0.36) - 0.33) * 6, 0, 1),
    fade: clamp((t.fade || 0) * 5, 0, 1),
    floater: clamp((t.floater || 0) * 4, 0, 1),
  };
}

// timing: error e (s, release minus ideal) against a half-window w from the rating
export function greenWindow(rating, kind, diff) {
  const base = kind === 'layup' ? 0.05 : kind === 'ft' ? 0.034 : 0.019;
  return (base + (kind === 'layup' ? 0.02 : 0.026) * k01(rating)) * [1.35, 1.15, 1, 0.9, 0.8][diff || 0];
}
export function grade(e, w) {
  const a = Math.abs(e);
  if (a <= w) return { g: 'green', text: 'EXCELLENT', mult: null };
  if (a <= 2.4 * w) return { g: 'good', text: e < 0 ? 'SLIGHTLY EARLY' : 'SLIGHTLY LATE', mult: 1.04 };
  if (a <= 5 * w) return { g: 'ok', text: e < 0 ? 'EARLY' : 'LATE', mult: 0.6 };
  return { g: 'bad', text: e < 0 ? 'VERY EARLY' : 'VERY LATE', mult: 0.2 };
}

// make probability for a shot, from ratings, spot, movement, timing and the contest
export function shotChance(sh, info, tm, contest) {
  const r = sh.r, sk = sh.sk;
  let p;
  const k = info.kind;
  if (k === 'dunk') p = 0.8 + 0.18 * k01(r.dunk);
  else if (k === 'layup') p = 0.46 + 0.42 * k01(r.layup) + (info.dist < 1.2 ? 0.04 : 0);
  else if (k === 'ft') p = clamp((r.ft - 6) / 100, 0.3, 0.97);
  else if (info.three) p = 0.17 + 0.45 * k01(r.three) - Math.max(0, info.dist - 8.0) * 0.07;
  else if (info.dist < 3.6) p = 0.32 + 0.4 * k01(r.close) + 0.06 * sk.floater;
  else p = 0.22 + 0.44 * k01(r.mid);
  if (info.variant === 'pull') p *= 0.82 + 0.18 * sk.pullup;
  if (info.variant === 'step') p *= 0.78 + 0.24 * sk.stepback;
  if (info.variant === 'fade') p *= 0.86 + 0.14 * sk.fade;
  if (info.variant === 'hook') p = Math.max(p, 0.36 + 0.4 * k01(r.close));
  if (k === 'dunk') {
    p = p * (1 - 0.45 * contest);
  } else if (tm.g === 'green') {
    p = 0.97 - 0.5 * contest * (1 - 0.25 * k01(info.three ? r.three : r.mid));
  } else {
    p *= tm.mult * (1 - 0.55 * contest);
  }
  return clamp(p, 0.02, 0.98);
}

export class Agent {
  constructor(game, d, team, opts = {}) {
    this.g = game; this.d = d; this.r = d.r; this.team = team; this.sk = skills(d);
    this.look = lookFor(d, opts.cosmetics);
    this.rig = new Rig(d, team, { white: opts.white, look: this.look });
    game.scene.add(this.rig.root);
    this.rig.root.traverse((o) => { if (o.isMesh) o.layers.enable(1); });
    this.H = this.rig.H; this.reach = this.H * 1.32;
    this.pos = new THREE.Vector3(0, 0, 6); this.vel = new THREE.Vector3(); this.face = Math.PI;
    this.air = 0; this.vy = 0; this.act = null; this.has = false; this.hand = 'R'; this.dph = 0; this.gait = 0;
    this.stun = 0; this.burst = 0; this.sbT = 9; this.cd = 0; this.crouch = 0; this.def = 0;
    this.cpu = !!opts.cpu; this.name = d.name;
    this.radius = 0.3 + 0.04 * (this.rig.bulk - 0.92) / 0.16;
    const sp = this.r.speed / 99;
    this.vMax = 5.6 + 1.9 * sp; this.vJog = 3.9 + 1.0 * sp;
    this.jumpV = 2.55 + 0.75 * (this.r.vertical / 99);
    this.rel = clamp(this.look.rel - 0.06 * (this.r.three - 60) / 40, 0.44, 0.66);
    this.headYaw = 0;
    this.tmp = [_v(), _v(), _v(), _v(), _v(), _v()];
    this.ballPos = _v(); this.lastBounce = 0;
  }
  dispose() { this.g.scene.remove(this.rig.root); }

  place(x, z, face) { this.pos.set(x, 0, z); this.vel.set(0, 0, 0); this.face = face === undefined ? Math.atan2(RIM.x - x, RIM.z - z) : face; this.air = 0; this.vy = 0; this.act = null; this.stun = 0; }
  get busy() { return !!this.act && !['cross', 'hesi'].includes(this.act.type); }
  get airborne() { return this.air > 0.01 || this.vy > 0; }
  fwd(out) { return out.set(Math.sin(this.face), 0, Math.cos(this.face)); }
  toRim(out) { return out.set(RIM.x - this.pos.x, 0, RIM.z - this.pos.z).normalize(); }
  distRim() { return rimDist(this.pos.x, this.pos.z); }

  // ---- intents (user input or CPU) ----
  // move: world direction (x, z) with magnitude 0..1; sprint flag
  drive(dir, mag, sprint, dt) {
    const stunF = this.stun > 0 ? 0.15 : 1;
    let target = (sprint ? this.vMax : this.vJog) * mag * stunF * (this.has ? 0.93 : 1) * (this.burst > 0 ? 1.28 : 1);
    // a defender body-to-body slows the dribbler (stronger defenders more)
    if (this.has && this.g.defenderGap) { const gap = this.g.defenderGap(this); if (gap < 0.85) { const o = this.g.other(this); target *= 0.72 + 0.2 * clamp((this.r.strength - (o ? o.r.strength : 50)) / 60 + 0.5, 0, 1); } }
    if (this.act && (this.act.type === 'shot' || this.act.type === 'dunkHang')) target = 0;
    if (this.act && this.act.type === 'layup' && this.act.t > this.act.take) target = 0;
    if (this.act && this.act.type === 'steal') target *= 0.4;
    const ax = dir.x * target, az = dir.z * target;
    const acc = (this.airborne ? 2 : 16 + 10 * this.r.speed / 99) * dt;
    const dx = ax - this.vel.x, dz = az - this.vel.z, dl = Math.hypot(dx, dz);
    if (dl > acc) { this.vel.x += dx / dl * acc; this.vel.z += dz / dl * acc; } else { this.vel.x = ax; this.vel.z = az; }
  }

  // jumper, layup or dunk depending on where and how he is moving
  pressShoot(game) {
    if (!this.has || this.busy || this.stun > 0) return null;
    const d = this.distRim(), tr = this.toRim(this.tmp[0]);
    const vToward = this.vel.x * tr.x + this.vel.z * tr.z, speed = Math.hypot(this.vel.x, this.vel.z);
    if (game.mode && game.mode.ftOnly) return this.startJumper('ft', d);
    if (game.mode && game.mode.noDunkLayup) return this.startJumper(this.variant(speed, vToward), d);
    if (d < 2.7 && vToward > 2.2 && this.r.dunk >= 58 && !(game.mode && game.mode.noDunk)) return this.startDunk();
    if (d < 3.4 && (vToward > 1.4 || d < 1.5)) return this.startLayup(game);
    // signature: bigs and post scorers go to a hook shot close in
    if (d < 4.2 && (this.d.grp === 'C' || this.r.close >= 88) && Math.hypot(this.vel.x, this.vel.z) < 2.5) return this.startJumper('hook', d);
    return this.startJumper(this.variant(speed, vToward), d);
  }
  variant(speed, vToward) {
    if (this.sbT < 0.75) return 'step';
    if (vToward < -1.6) return 'fade';
    if (speed > 2.4) return 'pull';
    return 'set';
  }
  startJumper(variant, d) {
    const kind = variant === 'ft' ? 'ft' : 'jump';
    if (variant === 'hook') { this.act = { type: 'shot', t: 0, rel: this.rel - 0.04, kind, variant, released: false, jumpAt: Math.max(0.12, this.rel - 0.26), from: this.ballPos.clone(), dist: d, held: true }; this.vel.multiplyScalar(0.3); return this.act; }
    const rel = kind === 'ft' ? this.rel + 0.06 : this.rel + (variant === 'pull' ? 0.03 : 0);
    this.act = { type: 'shot', t: 0, rel, kind, variant, released: false, jumpAt: Math.max(0.12, rel - 0.22),
      from: this.ballPos.clone(), dist: d, held: true };
    if (kind === 'ft') this.act.jumpAt = 99;                      // free throws: a set shot with a little rise
    this.vel.multiplyScalar(variant === 'pull' ? 0.35 : 0.2);
    return this.act;
  }
  startLayup(game) {
    const tr = this.toRim(this.tmp[0]);
    this.act = { type: 'layup', t: 0, take: 0.22, rel: 0.5, kind: 'layup', variant: 'layup', released: false,
      from: this.ballPos.clone(), dist: this.distRim(), held: true, dir: tr.clone() };
    // signature: slashers with a good finish euro-step away from the defender during the gather
    if (this.r.layup >= 76 && ((this.d.t || {}).drive || 0) > 0.1) {
      const o = game && game.other ? game.other(this) : null;
      const side = new THREE.Vector3(-tr.z, 0, tr.x);
      const s = o ? -Math.sign((o.pos.x - this.pos.x) * side.x + (o.pos.z - this.pos.z) * side.z) || 1 : 1;
      this.act.euro = s; this.act.side = side; this.act.take = 0.3; this.act.variant = 'euro';
    }
    return this.act;
  }
  startDunk() {
    const tr = this.toRim(this.tmp[0]);
    this.act = { type: 'dunk', t: 0, take: 0.18, kind: 'dunk', variant: 'dunk', released: false, from: this.ballPos.clone(),
      dist: this.distRim(), dir: tr.clone(), held: true };
    return this.act;
  }
  // dribble moves: crossover, step-back, spin, hesitation, from the stick direction relative to the rim
  pressMove(dir, mag) {
    if (this.busy || this.stun > 0 || this.cd > 0 || this.airborne) return null;
    if (!this.has) return null;
    const tr = this.toRim(this.tmp[0]);
    const along = mag > 0.3 ? dir.x * tr.x + dir.z * tr.z : 0;
    const speed = Math.hypot(this.vel.x, this.vel.z);
    let type;
    if (mag < 0.3) type = 'hesi';
    else if (along < -0.55) type = 'step';
    else if (along > 0.55 && speed > 3.2) type = 'spin';
    else type = 'cross';
    const side = new THREE.Vector3(-tr.z, 0, tr.x);
    const lat = mag > 0.3 ? Math.sign(dir.x * side.x + dir.z * side.z) || 1 : (this.hand === 'R' ? 1 : -1);
    this.act = { type, t: 0, dur: { hesi: 0.34, step: 0.34, spin: 0.46, cross: 0.3 }[type], lat, side, tr: tr.clone(),
      from: this.hand, startPos: this.pos.clone() };
    this.cd = 0.45;
    if (type === 'step') { const k = 3.2 + 1.5 * this.sk.stepback; this.vel.set(-tr.x * k, 0, -tr.z * k); this.sbT = 0; }
    if (type === 'spin') { this.vel.addScaledVector(side, lat * 2.2); }
    if (type === 'cross') { this.vel.addScaledVector(side, lat * 2.6); }
    return this.act;
  }
  pressBlock() {
    if (this.airborne || this.stun > 0 || (this.act && this.act.type !== 'steal')) return false;
    this.act = { type: 'block', t: 0 };
    this.vy = this.jumpV * 1.08;
    return true;
  }
  pressSteal(target) {
    if (this.airborne || this.stun > 0 || this.busy || this.cd > 0) return false;
    const d = this.tmp[1].set(target.x - this.pos.x, 0, target.z - this.pos.z);
    const L = d.length() || 1;
    this.act = { type: 'steal', t: 0, dur: 0.4, dir: d.divideScalar(L).clone(), tried: false };
    this.vel.addScaledVector(this.act.dir, 3.2);
    this.cd = 0.7;
    return true;
  }
  stumble(t) { this.act = { type: 'stumble', t: 0, dur: t }; this.stun = t; this.vel.multiplyScalar(0.3); }
  celebrate() { if (!this.act) this.act = { type: 'celebrate', t: 0, dur: 1.0 }; }

  // ---- per frame ----
  update(dt, game) {
    this.cd = Math.max(0, this.cd - dt); this.stun = Math.max(0, this.stun - dt); this.burst = Math.max(0, this.burst - dt);
    this.sbT += dt;
    const a = this.act;
    if (a) {
      a.t += dt;
      if (a.type === 'shot') {
        if (!a.jumped && a.t >= a.jumpAt) { a.jumped = true; this.vy = a.variant === 'step' ? this.jumpV * 0.95 : this.jumpV * (a.variant === 'fade' ? 0.95 : 0.9); if (a.variant === 'fade') { const tr = this.toRim(this.tmp[2]); this.vel.set(-tr.x * 1.1, 0, -tr.z * 1.1); } }
        if (!a.released && a.t > a.rel + 0.42) game.release(this, true);          // held far too long
        if (a.released && !this.airborne && a.t > a.relAt + 0.12) this.act = null;
      } else if (a.type === 'layup') {
        if (a.euro && !a.jumped) { const k = a.t < a.take * 0.5 ? 1 : -0.4; this.vel.addScaledVector(a.side, a.euro * k * 9 * dt); }
        if (!a.jumped && a.t >= a.take) { a.jumped = true; this.vy = this.jumpV * 1.12; this.vel.set(a.dir.x * 2.6, 0, a.dir.z * 2.6); }
        if (!a.released && a.t > a.take + 0.62) game.release(this, true);
        if (a.released && !this.airborne) this.act = null;
      } else if (a.type === 'dunk') {
        if (!a.jumped && a.t >= a.take) {
          a.jumped = true;
          const d = this.distRim();
          this.vy = this.jumpV * 1.45 + 0.3;
          const tUp = this.vy / 9.81;
          const v = clamp((d - 0.38) / tUp, 1.2, 5.5);
          this.vel.set(a.dir.x * v, 0, a.dir.z * v);
        }
        if (a.jumped && !a.released && (this.vy <= 0.4 || this.distRim() < 0.45)) game.dunk(this);
        if (a.hang) {
          a.hang -= dt;
          this.air = Math.max(this.air, RIM.y - this.reach + 0.05); this.vy = 0; this.vel.set(0, 0, 0);
          if (a.hang <= 0) { a.hang = 0; this.act = { type: 'land', t: 0, dur: 0.3 }; this.vy = -0.5; }
        }
      } else if (a.type === 'block') {
        if (!this.airborne && a.t > 0.15) this.act = null;
      } else if (a.type === 'steal') {
        if (a.t >= a.dur) { this.act = null; if (!a.won) this.stun = Math.max(this.stun, 0.45); }
      } else if (a.dur && a.t >= a.dur) {
        if (a.type === 'cross' || a.type === 'spin') { this.hand = this.hand === 'R' ? 'L' : 'R'; this.burst = 0.45; }
        if (a.type === 'hesi') this.burst = 0.55;
        this.act = null;
      }
      if (a.type === 'spin' && this.act === a) {
        const k = a.t / a.dur;
        this.vel.addScaledVector(a.side, a.lat * 5.5 * Math.sin(k * Math.PI) * dt * 6);
      }
    }
    // jump physics
    if (this.vy !== 0 || this.air > 0) {
      if (!(this.act && this.act.hang)) {
        this.vy -= 9.81 * dt; this.air += this.vy * dt;
        if (this.air <= 0) { this.air = 0; this.vy = 0; if (game.sfx) game.sfx('squeak', 0.4); }
      }
    }
    // move
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt;
    if (!this.airborne && !(this.act && (this.act.type === 'step' || this.act.type === 'steal'))) {
      const f = Math.pow(0.02, dt);
      if (Math.hypot(this.vel.x, this.vel.z) < 0.05) this.vel.multiplyScalar(f);
    }
    this.pos.x = clamp(this.pos.x, -COURT.SIDE_X + 0.25, COURT.SIDE_X - 0.25);
    this.pos.z = clamp(this.pos.z, COURT.BASE_Z + 0.25, COURT.HALF_Z - 0.2);
    // keep out of the post and the glass
    const rd = this.distRim();
    if (rd < 0.25 && this.air < 0.5) { const tr = this.toRim(this.tmp[3]); this.pos.addScaledVector(tr, -(0.25 - rd)); }
    // facing
    const sp = Math.hypot(this.vel.x, this.vel.z);
    let want = this.face;
    if (this.faceTarget) want = Math.atan2(this.faceTarget.x - this.pos.x, this.faceTarget.z - this.pos.z);
    else if (a && (a.type === 'shot' || a.type === 'layup' || a.type === 'dunk')) want = Math.atan2(RIM.x - this.pos.x, RIM.z - this.pos.z);
    else if (sp > 1.2) want = Math.atan2(this.vel.x, this.vel.z);
    else if (this.has) want = Math.atan2(RIM.x - this.pos.x, RIM.z - this.pos.z);
    if (a && a.type === 'spin') want = this.face + dt * Math.PI * 2 / a.dur * a.lat;
    let df = ((want - this.face + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const turn = (a && a.type === 'spin') ? 99 : (this.airborne ? 2 : 11) * dt;
    this.face += clamp(df, -turn, turn);
    // gait
    this.gait += sp * dt / (0.62 + 0.36 * clamp(sp / 7, 0, 1)) * Math.PI;
    this.crouch = lerp(this.crouch, this.targetCrouch(), 1 - Math.pow(0.001, dt));
  }

  targetCrouch() {
    const a = this.act;
    if (a && a.type === 'shot' && !a.jumped && a.kind !== 'ft') return 0.35 + 0.25 * ease(a.t / Math.max(0.05, a.jumpAt));
    if (a && a.type === 'shot' && a.kind === 'ft') return 0.2 * Math.sin(Math.min(1, a.t / a.rel) * Math.PI);
    if (a && (a.type === 'layup' || a.type === 'dunk') && !a.jumped) return 0.45;
    if (a && a.type === 'stumble') return 0.6;
    if (a && a.type === 'land') return 0.45 * (1 - a.t / a.dur);
    if (this.def > 0.5) return 0.35;
    if (this.has) return 0.18 + (a && a.type === 'cross' ? 0.2 : 0);
    return 0.1;
  }

  // the ball while he holds it: dribble cycle, crossovers, gather and release path
  ballLocal(out, dt, game) {
    const H = this.H, a = this.act;
    const sp = Math.hypot(this.vel.x, this.vel.z), sn = clamp(sp / 7, 0, 1);
    const close = game.defenderGap ? game.defenderGap(this) < 1.4 : false;
    const top = H * (close ? 0.36 : 0.43);
    const side = (h) => (h === 'R' ? -1 : 1) * H * 0.15;
    const fwd = H * (0.12 + 0.12 * sn);
    if (a && (a.type === 'cross' || a.type === 'spin')) {
      const k = clamp(a.t / a.dur, 0, 1);
      const from = side(a.from), to = side(a.from === 'R' ? 'L' : 'R');
      out.set(lerp(from, to, ease(k)), BR + (top - BR) * Math.abs(Math.cos(Math.PI * k)), fwd * (a.type === 'spin' ? 0.4 : 0.8));
      if (k > 0.45 && k < 0.6 && this.lastBounce !== 1) { this.lastBounce = 1; game.sfx && game.sfx('bounce', 0.5); }
      return out;
    }
    if (a && (a.type === 'shot' || a.type === 'layup' || a.type === 'dunk') && !a.released) {
      const s = this.shotPath(out, a);
      return s;
    }
    // dribble
    const freq = 1.7 + 1.2 * sn + (close ? 0.5 : 0);
    const prev = this.dph;
    this.dph = (this.dph + dt * freq) % 1;
    if (prev < 0.5 && this.dph >= 0.5) { game.sfx && game.sfx('bounce', 0.35 + 0.3 * sn); this.lastBounce = 0; }
    if (a && a.type === 'hesi') this.dph = Math.min(this.dph, 0.02);
    out.set(side(this.hand), BR + (top - BR) * Math.abs(Math.cos(Math.PI * this.dph)), fwd);
    return out;
  }
  shotPath(out, a) {
    const H = this.H, form = this.look.form;
    const sx = this.hand === 'R' ? -1 : 1;
    const pocket = this.tmp[4].set(sx * 0.05 * H, 0.55 * H, 0.15 * H);
    const set = this.tmp[5].set(sx * 0.04 * H, (0.93 + 0.02 * form) * H, 0.12 * H);
    const relY = (1.08 + [0.04, 0.0, 0.07, 0.02][form]) * H;
    if (a.type === 'shot' && a.variant === 'hook') {
      const s = clamp(a.t / a.rel, 0, 1);
      const side = this.tmp[3].set(sx * 0.32 * H, 0.75 * H, 0.05 * H);
      if (s < 0.4) return out.copy(a.fromLocal || pocket).lerp(side, ease(s / 0.4));
      return out.copy(side).lerp(this.tmp[2].set(sx * 0.12 * H, 1.2 * H, 0.06 * H), ease((s - 0.4) / 0.6));
    }
    if (a.type === 'shot') {
      const s = a.t / a.rel;
      if (s < 0.35) out.copy(a.fromLocal || pocket).lerp(pocket, ease(s / 0.35));
      else if (s < 0.85) out.copy(pocket).lerp(set, ease((s - 0.35) / 0.5));
      else out.copy(set).lerp(this.tmp[3].set(sx * 0.03 * H, relY, 0.1 * H), ease((s - 0.85) / 0.15));
      return out;
    }
    if (a.type === 'layup') {
      const s = a.t / (a.take + 0.4);
      if (s < 0.4) return out.copy(a.fromLocal || pocket).lerp(this.tmp[3].set(0, 0.62 * H, 0.18 * H), ease(s / 0.4));
      return out.set(0, 0.62 * H, 0.18 * H).lerp(this.tmp[3].set(sx * 0.06 * H, 1.2 * H, 0.22 * H), ease((s - 0.4) / 0.6));
    }
    // dunk: ball carried high
    const s = a.t / (a.take + 0.35);
    if (s < 0.4) return out.copy(a.fromLocal || pocket).lerp(this.tmp[3].set(0, 0.7 * H, 0.15 * H), ease(s / 0.4));
    return out.set(0, 0.7 * H, 0.15 * H).lerp(this.tmp[3].set(sx * 0.05 * H, 1.3 * H, 0.32 * H), ease((s - 0.4) / 0.6));
  }
  localToWorld(local, out) {
    const c = Math.cos(this.face), s = Math.sin(this.face);
    return out.set(this.pos.x + local.x * c + local.z * s, this.air + local.y, this.pos.z - local.x * s + local.z * c);
  }

  // ---- pose ----
  animate(dt, game) {
    const rig = this.rig, j = rig.j, H = this.H, a = this.act;
    rig.root.position.set(this.pos.x, this.air, this.pos.z);
    rig.root.rotation.y = this.face;
    const sp = Math.hypot(this.vel.x, this.vel.z);
    const fx = Math.sin(this.face), fz = Math.cos(this.face);
    const lat = sp > 0.3 ? (this.vel.x * fz - this.vel.z * fx) / sp : 0;
    const airK = clamp(this.air / 0.4, 0, 1);
    // head looks at the rim with the ball, at the ball on defence
    const look = this.has || (a && (a.type === 'shot' || a.type === 'layup')) ? RIM : (game.ball ? game.ball.p : RIM);
    const hy = Math.atan2(look.x - this.pos.x, look.z - this.pos.z) - this.face;
    const yaw = ((hy + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    const dist = Math.hypot(look.x - this.pos.x, look.z - this.pos.z) || 1;
    const pitch = -Math.atan2(look.y - (this.air + H * 0.93), dist) * 0.6;
    rig.base({ speed: a && a.type === 'stumble' ? 0 : sp, phase: this.gait, crouch: this.crouch, air: airK * (a && a.type === 'dunk' ? 0.7 : 0.45),
      defense: this.def, lateral: lat, lean: a && a.type === 'stumble' ? -0.5 * Math.sin(a.t / a.dur * Math.PI) : (a && a.type === 'shot' && a.variant === 'fade' ? -0.18 : 0),
      headYaw: yaw, headPitch: pitch, breath: Math.sin(game.time * 2.2) * 0.012, twist: a && a.type === 'steal' ? 0.3 : 0 });
    rig.root.updateMatrixWorld(true);
    const T = this.tmp, P = T[1];
    const pole = (side, back = -0.4, down = -0.6) => {
      const sx = side === 'L' ? 1 : -1;
      return this.localToWorld(T[2].set(sx * 0.5 * H, 0.55 * H + down, back * H), P);
    };
    // ball first (it drives the hands)
    if (this.has && game.ball && game.ball.holder === this) {
      this.ballLocal(T[0], dt, game);
      if (a && (a.type === 'shot' || a.type === 'layup' || a.type === 'dunk') && !a.fromLocal) a.fromLocal = T[0].clone();
      this.localToWorld(T[0], this.ballPos);
      game.ball.p.copy(this.ballPos);
    }
    const holding = this.has && a && (a.type === 'shot' || a.type === 'layup' || a.type === 'dunk') && !a.released;
    if (holding) {
      const b = this.ballPos;
      const sh = this.hand, gd = sh === 'R' ? 'L' : 'R';
      const under = this.localToWorld(this.toLocal(b, T[3]).add(T[4].set((sh === 'R' ? -0.02 : 0.02) * H, -0.055 * H, -0.03 * H)), T[5]);
      rig.reach(sh, under, pole(sh, -0.5, -0.9), -0.5);
      const guide = this.localToWorld(this.toLocal(b, T[3]).add(T[4].set((gd === 'L' ? 0.065 : -0.065) * H, -0.005 * H, 0)), T[5]);
      rig.reach(gd, guide, pole(gd, -0.2, -0.8), 0.2);
    } else if (a && (a.type === 'shot' || a.type === 'layup') && a.released) {
      // follow-through: arm up toward the rim, wrist snapped
      const sh = this.hand, gd = sh === 'R' ? 'L' : 'R';
      const k = clamp((a.t - a.relAt) / 0.12, 0, 1);
      const up = this.localToWorld(T[3].set((sh === 'R' ? -0.06 : 0.06) * H, (1.12 + 0.06 * k) * H, (0.18 + 0.1 * k) * H), T[5]);
      rig.reach(sh, up, pole(sh, -0.3, -0.5), -1.1 * k);
      const g2 = this.localToWorld(T[3].set((gd === 'L' ? 0.16 : -0.16) * H, 1.0 * H, 0.12 * H), T[5]);
      rig.reach(gd, g2, pole(gd, -0.2, -0.6), 0.3);
    } else if (a && (a.type === 'dunk' || a.type === 'land' || a.type === 'dunkHang') && (a.released || a.type === 'land')) {
      const sh = this.hand;
      const rimP = T[3].set(RIM.x + (sh === 'R' ? -0.12 : 0.12) * Math.cos(this.face), RIM.y + 0.04, RIM.z);
      const two = this.r.strength >= 70 || this.rig.bulk >= 1.02;          // big men throw it down with both hands
      if (a.type === 'land') rig.reach(sh, this.localToWorld(T[4].set(-0.15 * H, 0.95 * H, 0.2 * H), T[5]), pole(sh), 0);
      else rig.reach(sh, rimP, pole(sh, -0.3, 0.3), 0.6);
      if (two && a.type !== 'land') {
        const gd = sh === 'R' ? 'L' : 'R';
        const p2 = T[4].set(RIM.x + (gd === 'R' ? -0.12 : 0.12) * Math.cos(this.face), RIM.y + 0.04, RIM.z);
        rig.reach(gd, p2, pole(gd, -0.3, 0.3), 0.6);
      } else rig.armSwing(sh === 'R' ? 'L' : 'R', { phase: this.gait, speed: 0, def: 0.4 });
    } else if (a && a.type === 'block') {
      const tgt = game.ball ? game.ball.p : RIM;
      for (const s of ['L', 'R']) {
        const sx = s === 'L' ? 1 : -1;
        const hi = this.localToWorld(T[3].set(sx * 0.13 * H, 1.26 * H, 0.18 * H), T[5]);
        const tb = T[4].copy(tgt); if (tb.distanceTo(hi) < 0.9) hi.lerp(tb, 0.5);
        rig.reach(s, hi, pole(s, -0.2, 0.4), 0.2);
      }
    } else if (a && a.type === 'steal') {
      const k = Math.sin(clamp(a.t / a.dur, 0, 1) * Math.PI);
      const tgt = game.ball ? T[3].copy(game.ball.p) : this.localToWorld(T[3].set(0, 0.5 * H, 0.6 * H), T[5]);
      const rest = this.localToWorld(T[4].set(-0.25 * H, 0.45 * H, 0.25 * H), T[5]);
      rig.reach('R', rest.lerp(tgt, k), pole('R', -0.2, -0.2), 0.3);
      rig.armSwing('L', { phase: 0, speed: 0, def: 0.8 });
    } else if (a && a.type === 'celebrate') {
      const k = Math.sin(clamp(a.t / a.dur, 0, 1) * Math.PI);
      rig.reach('R', this.localToWorld(T[3].set(-0.2 * H, (0.8 + 0.45 * k) * H, 0.1 * H), T[5]), pole('R', -0.3, 0.2), 0);
      rig.armSwing('L', { phase: this.gait, speed: sp });
    } else if (this.has && game.ball && game.ball.holder === this) {
      // dribble hand rides the ball; off arm protects when a defender is close
      const sh = this.hand, off = sh === 'R' ? 'L' : 'R';
      const b = this.ballPos;
      const c = Math.abs(Math.cos(Math.PI * this.dph));
      const handY = Math.max(b.y + BR * 0.9, this.air + H * (0.4 - 0.05 * (1 - c)));
      const tgt = T[3].set(b.x, handY, b.z);
      if (a && (a.type === 'cross' || a.type === 'spin')) {
        const k = clamp(a.t / a.dur, 0, 1);
        const hand = k < 0.5 ? a.from : (a.from === 'R' ? 'L' : 'R');
        rig.reach(hand, tgt, pole(hand), 0.4);
        rig.armSwing(hand === 'R' ? 'L' : 'R', { phase: this.gait, speed: sp * 0.5 });
      } else {
        rig.reach(sh, tgt, pole(sh), 0.5 * c);
        if (game.defenderGap && game.defenderGap(this) < 1.6) rig.reach(off, this.localToWorld(T[4].set((off === 'L' ? 0.25 : -0.25) * H, 0.62 * H, 0.32 * H), T[5]), pole(off, -0.1, -0.2), 0);
        else rig.armSwing(off, { phase: this.gait, speed: sp });
      }
    } else if (this.def > 0.5) {
      // defensive stance: one hand up to contest, one low for the ball
      for (const s of ['L', 'R']) {
        const sx = s === 'L' ? 1 : -1, hi = s === 'L';
        const wob = Math.sin(game.time * 3 + sx) * 0.02 * H;
        const p = hi ? this.localToWorld(T[3].set(sx * 0.2 * H, 1.1 * H + wob, 0.2 * H), T[5])
                     : this.localToWorld(T[3].set(sx * 0.3 * H, 0.52 * H + wob, 0.3 * H), T[5]);
        rig.reach(s, p, pole(s, -0.2, hi ? 0.1 : -0.5), 0.2);
      }
    } else {
      rig.armSwing('L', { phase: this.gait, speed: sp }); rig.armSwing('R', { phase: this.gait, speed: sp });
    }
    rig.root.updateMatrixWorld(true);
  }
  toLocal(w, out) {
    const c = Math.cos(this.face), s = Math.sin(this.face);
    const dx = w.x - this.pos.x, dz = w.z - this.pos.z;
    return out.set(dx * c - dz * s, w.y - this.air, dx * s + dz * c);
  }
}

// ---- the CPU ----
export const DIFFS = [
  { name: 'Rookie', react: 0.42, sigma: 0.06, q: 0.34, steal: 0.12, contest: 0.6 },
  { name: 'Pro', react: 0.3, sigma: 0.042, q: 0.4, steal: 0.2, contest: 0.8 },
  { name: 'All-Star', react: 0.22, sigma: 0.03, q: 0.45, steal: 0.28, contest: 0.9 },
  { name: 'Superstar', react: 0.16, sigma: 0.022, q: 0.5, steal: 0.34, contest: 1.0 },
  { name: 'Hall of Fame', react: 0.11, sigma: 0.016, q: 0.55, steal: 0.4, contest: 1.08 },
];

export class Brain {
  constructor(me, game, diff) {
    this.me = me; this.g = game; this.D = DIFFS[diff]; this.diff = diff;
    this.think = 0; this.target = new THREE.Vector3(); this.plan = null; this.lag = []; this.shootAt = null;
    this.moveCd = 0; this.bit = 0;
    this.R = game.R;
  }
  // a delayed copy of where the opponent is: the CPU reacts to the past
  seen(other) {
    this.lag.push([this.g.time, other.pos.x, other.pos.z]);
    while (this.lag.length > 2 && this.lag[1][0] < this.g.time - this.D.react) this.lag.shift();
    const l = this.lag[0];
    return { x: l[1], z: l[2] };
  }
  intent(dt, opp) {
    const me = this.me, g = this.g, out = { dir: new THREE.Vector3(), mag: 0, sprint: false };
    this.think -= dt; this.moveCd -= dt; this.bit = Math.max(0, this.bit - dt);
    const ball = g.ball;
    if (me.has) return this.offense(dt, opp, out);
    if (ball.holder === opp) return this.defense(dt, opp, out);
    // loose ball: go get it where it will come down
    const land = g.predictLanding(0.45);
    this.seek(out, land.x, land.z, 1, true);
    if (ball.p.y > me.reach && ball.p.y < me.reach + 0.9 && Math.hypot(ball.p.x - me.pos.x, ball.p.z - me.pos.z) < 1.0 && !me.airborne && this.R() < 0.2) me.pressBlock();
    return out;
  }
  seek(out, x, z, mag, sprint) {
    const dx = x - this.me.pos.x, dz = z - this.me.pos.z, L = Math.hypot(dx, dz);
    if (L > 0.08) { out.dir.set(dx / L, 0, dz / L); out.mag = Math.min(1, L / 0.6) * mag; }
    out.sprint = sprint && L > 1.5;
    return out;
  }
  offense(dt, opp, out) {
    const me = this.me, g = this.g, D = this.D;
    if (me.act && (me.act.type === 'shot' || me.act.type === 'layup')) {
      if (!me.act.released && this.shootAt !== null && me.act.t >= this.shootAt) g.release(me, false);
      return out;
    }
    if (me.busy) return out;
    const d = me.distRim(), gap = Math.hypot(opp.pos.x - me.pos.x, opp.pos.z - me.pos.z);
    const tr = me.toRim(new THREE.Vector3());
    const between = ((opp.pos.x - me.pos.x) * tr.x + (opp.pos.z - me.pos.z) * tr.z) > 0.2;
    const clear = g.mode.needClear ? !g.mode.needClear(me) : true;
    if (!clear) { const p = this.clearSpot(); this.seek(out, p.x, p.z, 1, true); return out; }
    const t = me.d.t || {};
    if (!this.plan || this.think <= 0) {
      this.think = 0.35 + this.R() * 0.3;
      const r = this.R();
      const rimLove = (t.rim || 0.3) + (t.dunk || 0) * 2 + (me.r.layup + me.r.dunk) / 400;
      const threeLove = (t.three || 0.3) + (me.r.three - 50) / 120;
      const midLove = (t.mid || 0.2) + (me.r.mid - 50) / 150;
      const tot = rimLove + threeLove + midLove;
      this.plan = r < rimLove / tot ? 'drive' : r < (rimLove + threeLove) / tot ? 'three' : 'mid';
      this.spot = this.pickSpot(this.plan);
    }
    // shoot?
    const info = g.shotInfo(me, me.variant(Math.hypot(me.vel.x, me.vel.z), 0));
    const contest = g.contestOn(me, info);
    const est = shotChance(me, info, { g: 'good', mult: 1.0 }, contest) * (info.three ? 3 : 2) / 2;
    const clock = g.mode.shotClock !== undefined ? g.mode.shotClock : 99;
    const want = D.q + (this.plan === 'three' && info.three ? -0.04 : 0) + (this.plan === 'drive' && d > 3 ? 0.12 : 0);
    if ((est > want && (info.three || d < 6.5 || this.plan !== 'drive')) || clock < 2.2 || (d < 2.0 && (!between || gap > 1.2))) {
      const a = me.pressShoot(g);
      if (a) { this.shootAt = a.type === 'dunk' ? null : (a.rel || 0.5) + (a.type === 'layup' ? a.take + 0.28 - a.rel : 0) + gauss(this.R) * D.sigma; return out; }
    }
    // a move when the defender is right there
    if (gap < 1.3 && between && this.moveCd <= 0 && this.R() < 0.5 * dt * 10 * (0.4 + me.r.handle / 120)) {
      this.moveCd = 1.2 + this.R();
      const side = new THREE.Vector3(-tr.z, 0, tr.x).multiplyScalar(this.R() < 0.5 ? 1 : -1);
      let dir = side;
      if (this.plan === 'three' && me.sk.stepback > 0.25 && this.R() < 0.6) dir = tr.clone().negate();
      else if (this.R() < 0.25) dir = new THREE.Vector3();
      me.pressMove(dir, dir.lengthSq() > 0 ? 1 : 0);
      return out;
    }
    // go to the plan's spot, or attack the rim around the defender
    if (this.plan === 'drive') {
      const side = new THREE.Vector3(-tr.z, 0, tr.x);
      const s = Math.sign((me.pos.x - opp.pos.x) * side.x + (me.pos.z - opp.pos.z) * side.z) || 1;
      const lane = new THREE.Vector3(RIM.x, 0, RIM.z + 0.6).addScaledVector(side, s * (between && gap < 2 ? 1.3 : 0.3));
      this.seek(out, lane.x, lane.z, 1, gap > 1.0 || !between);
    } else {
      this.seek(out, this.spot.x, this.spot.z, 0.85, false);
      if (Math.hypot(this.spot.x - me.pos.x, this.spot.z - me.pos.z) < 0.6) { out.mag = 0.15; this.think = Math.min(this.think, 0.25); }
    }
    return out;
  }
  pickSpot(plan) {
    const R = this.R;
    if (plan === 'three') {
      const a = (-0.25 + R() * 1.5) * Math.PI / 2 + Math.PI / 4;                // corners to the top
      const ang = THREE.MathUtils.clamp(a, 0.05, Math.PI - 0.05);
      const r = ang < 0.38 || ang > Math.PI - 0.38 ? 6.95 : 7.55;
      return { x: Math.cos(ang) * r, z: Math.max(0.2, Math.sin(ang) * r) };
    }
    if (plan === 'mid') { const ang = 0.3 + R() * (Math.PI - 0.6); return { x: Math.cos(ang) * 4.6, z: Math.sin(ang) * 4.6 + 0.4 }; }
    return { x: 0, z: 1 };
  }
  clearSpot() { const me = this.me; const ang = Math.atan2(me.pos.z, me.pos.x); return { x: Math.cos(ang) * 7.9, z: Math.max(3.0, Math.sin(ang) * 7.9) }; }
  defense(dt, opp, out) {
    const me = this.me, g = this.g, D = this.D;
    me.faceTarget = opp.pos;
    const s = this.seen(opp);
    const d = rimDist(s.x, s.z);
    const shooter = opp.r.three / 99;
    const gapWant = d < 3 ? 0.85 : d > 6.6 ? 1.0 + (1 - shooter) * 0.9 : 1.2;
    const tx = s.x + (RIM.x - s.x) / (d || 1) * gapWant, tz = s.z + (RIM.z - s.z) / (d || 1) * gapWant;
    if (this.bit > 0) return out;                                  // bit on the hesitation
    this.seek(out, tx, tz, 1, Math.hypot(tx - me.pos.x, tz - me.pos.z) > 1.4);
    // contest the shot after the reaction time
    const oa = opp.act;
    if (oa && (oa.type === 'shot' || oa.type === 'layup' || oa.type === 'dunk') && !me.airborne && !me.act) {
      const gap = Math.hypot(opp.pos.x - me.pos.x, opp.pos.z - me.pos.z);
      const jumpAt = (oa.type === 'shot' ? oa.rel - 0.12 : oa.type === 'layup' ? oa.take + 0.1 : oa.take) + D.react * 0.5;
      if (gap < 2.0 * D.contest && oa.t >= jumpAt && this.R() < 0.92) me.pressBlock();
      else if (gap < 3.5) this.seek(out, opp.pos.x, opp.pos.z, 1, true);
    }
    if (oa && oa.type === 'hesi' && this.R() < 0.5 * (1.4 - this.diff * 0.25)) this.bit = 0.35;
    // reach for it now and then
    const gap = Math.hypot(opp.pos.x - me.pos.x, opp.pos.z - me.pos.z);
    if (gap < 1.15 && !me.act && opp.has && this.R() < D.steal * dt * (0.5 + me.r.steal / 99)) me.pressSteal(g.ball.p);
    return out;
  }
}

export function gauss(R) { let u = 0, v = 0; while (u === 0) u = R(); while (v === 0) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
export { isThree };
