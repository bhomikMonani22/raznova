// EasyBuckets Hoops: the ball. Fixed-step physics (1/240 s) against the floor, the glass and the rim (a torus),
// net drag after a make, and a solver that finds a launch for a planned outcome by simulating the same physics
// forward, so what you see is exactly what the physics did.
import * as THREE from './three.module.min.js';
import { COURT, rng } from './world.js';

export const BR = 0.12, G = 9.81, DT = 1 / 240;
const E_FLOOR = 0.78, E_BOARD = 0.72, E_RIM = 0.56;

function ballTexture(skin) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const S = {
    classic: { base: '#d9631e', hi: '#f08a3c', seam: '#1a0d06' },
    street: { base: '#2a2a2a', hi: '#464646', seam: '#ff7a1a' },
    retro: { base: '#c8102e', hi: '#ffffff', seam: '#0b2a6b', tri: true },
    glow: { base: '#18c8ff', hi: '#9af0ff', seam: '#062033' },
    gold: { base: '#c99a2e', hi: '#ffe08a', seam: '#3a2700' },
    ice: { base: '#cfe9ff', hi: '#ffffff', seam: '#2a6fb3' },
    lava: { base: '#ff4b12', hi: '#ffc24b', seam: '#2a0700' },
  }[skin] || { base: '#d9631e', hi: '#f08a3c', seam: '#1a0d06' };
  g.fillStyle = S.base; g.fillRect(0, 0, 1024, 512);
  if (S.tri) {                                     // tri-colour panels
    g.fillStyle = S.hi; g.fillRect(0, 0, 341, 512);
    g.fillStyle = S.seam; g.fillRect(682, 0, 342, 512);
  }
  const R = rng(99);
  for (let i = 0; i < 26000; i++) {               // pebbling
    g.fillStyle = R() < 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.07)';
    g.fillRect(R() * 1024, R() * 512, 2, 2);
  }
  g.strokeStyle = S.seam; g.lineWidth = 9;
  // equator and one meridian great circle
  g.beginPath(); g.moveTo(0, 256); g.lineTo(1024, 256); g.stroke();
  g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 512); g.moveTo(768, 0); g.lineTo(768, 512); g.stroke();
  // two curved seams: small circles around the axes at longitude 0 and pi
  const rho = 0.95;
  for (const lon0 of [0, Math.PI]) {
    for (const sgn of [1, -1]) {
      g.beginPath(); let first = true;
      for (let k = 0; k <= 200; k++) {
        const lat = -Math.PI / 2 + Math.PI * k / 200;
        const c0 = Math.cos(rho) / Math.cos(lat);
        if (Math.abs(c0) > 1) { first = true; continue; }
        const lon = lon0 + sgn * Math.acos(c0);
        const x = ((lon / (Math.PI * 2)) % 1 + 1) % 1 * 1024, y = (0.5 - lat / Math.PI) * 512;
        if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x, y);
      }
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

export class Ball {
  constructor(scene) {
    this.mat = new THREE.MeshStandardMaterial({ roughness: 0.72, metalness: 0.0 });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(BR, 32, 22), this.mat);
    this.mesh.castShadow = true; this.mesh.layers.enable(1);
    scene.add(this.mesh);
    this.setSkin('classic');
    this.p = new THREE.Vector3(0, 1, 4); this.v = new THREE.Vector3();
    this.state = 'held';
    this.spin = new THREE.Vector3();
    this.acc = 0;
    this.events = [];
    this.shot = null;
    this.trail = null;
    this._a = new THREE.Vector3(); this._b = new THREE.Vector3();
  }
  setSkin(skin) {
    if (this.mat.map) this.mat.map.dispose();
    this.mat.map = ballTexture(skin);
    this.mat.emissive = new THREE.Color(skin === 'glow' ? 0x0a4a66 : skin === 'lava' ? 0x501000 : 0x000000);
    this.mat.metalness = skin === 'gold' ? 0.55 : 0;
    this.mat.roughness = skin === 'gold' ? 0.35 : 0.72;
    this.mat.needsUpdate = true;
    this.skin = skin;
  }

  // start a free flight (shot, pass, deflection)
  launch(p, v, shot) {
    this.p.copy(p); this.v.copy(v); this.state = 'flight'; this.acc = 0;
    this.shot = shot ? Object.assign({ rim: 0, board: false, made: false, swish: false, t: 0, crossed: false, ended: false }, shot) : null;
    // backspin about the horizontal axis across the flight
    const h = Math.hypot(v.x, v.z) || 1;
    this.spin.set(-v.z / h, 0, v.x / h).multiplyScalar(-14);
  }

  // one physics step on a plain state object {p, v, s} (shared by the live ball and the solver)
  static step(st, dt, ev) {
    const p = st.p, v = st.v, s = st.s;
    const py = p.y;
    v.y -= G * dt;
    if (s && s.made && p.y < COURT.RIM.y && p.y > COURT.RIM.y - 0.5) {         // through the net: drag and centring
      v.x *= 0.93; v.z *= 0.93; v.y *= 0.992;
      p.x *= 0.97; p.z = COURT.RIM.z + (p.z - COURT.RIM.z) * 0.97;
    }
    p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
    // glass (front face)
    const bz = COURT.BOARD_Z;
    if (v.z < 0 && p.z - BR < bz && p.z > bz - 0.25 && Math.abs(p.x) < COURT.BOARD_HW + BR * 0.4
        && p.y > COURT.BOARD_Y0 - BR * 0.4 && p.y < COURT.BOARD_Y1 + BR * 0.4 && !(s && s.made)) {
      p.z = bz + BR; v.z = -v.z * E_BOARD; v.x *= 0.88; v.y *= 0.9;
      if (s) s.board = true;
      if (ev) ev.push(['board', Math.abs(v.z)]);
    }
    // rim: nearest point on the ring
    const rx = p.x - COURT.RIM.x, rz = p.z - COURT.RIM.z, h = Math.hypot(rx, rz) || 1e-9;
    const cx = COURT.RIM.x + COURT.R * rx / h, cz = COURT.RIM.z + COURT.R * rz / h;
    const dx = p.x - cx, dy = p.y - COURT.RIM.y, dz = p.z - cz, d = Math.hypot(dx, dy, dz), lim = BR + COURT.RT;
    if (d < lim && !(s && s.made && p.y < COURT.RIM.y)) {
      const nx = dx / d, ny = dy / d, nz = dz / d, vn = v.x * nx + v.y * ny + v.z * nz;
      if (vn < 0) {
        v.x -= (1 + E_RIM) * vn * nx; v.y -= (1 + E_RIM) * vn * ny; v.z -= (1 + E_RIM) * vn * nz;
        v.x *= 0.94; v.z *= 0.94;
        if (s) s.rim++;
        if (ev) ev.push(['rim', -vn]);
      }
      p.x = cx + nx * lim; p.y = COURT.RIM.y + ny * lim; p.z = cz + nz * lim;
    }
    // through the ring
    if (s && !s.crossed && py >= COURT.RIM.y && p.y < COURT.RIM.y && v.y < 0) {
      const hh = Math.hypot(p.x - COURT.RIM.x, p.z - COURT.RIM.z);
      if (hh < COURT.R - 0.012) {
        s.crossed = true; s.made = true; s.swish = s.rim === 0 && !s.board;
        if (ev) ev.push(['made', s.swish ? 1 : 0]);
      } else if (hh < COURT.R + 0.4) s.crossedOut = true;
    }
    // floor
    if (p.y < BR) {
      p.y = BR;
      if (v.y < -0.4) { if (ev) ev.push(['floor', -v.y]); v.y = -v.y * E_FLOOR; if (s) s.floor = (s.floor || 0) + 1; }
      else v.y = 0;
      v.x *= 0.97; v.z *= 0.97;
    }
    if (p.y <= BR + 1e-4 && Math.abs(v.y) < 0.05) { v.x *= 1 - 1.4 * dt; v.z *= 1 - 1.4 * dt; }
    if (s) s.t += dt;
  }

  // forward simulation for the solver: how does this launch end?
  static simulate(p0, v0, maxT = 3.5) {
    const st = { p: p0.clone(), v: v0.clone(), s: { rim: 0, board: false, made: false, swish: false, t: 0, crossed: false } };
    const n = Math.round(maxT / DT);
    for (let i = 0; i < n; i++) {
      Ball.step(st, DT, null);
      const s = st.s;
      if (s.made && st.p.y < COURT.RIM.y - 0.3) break;
      if (!s.made && s.floor) break;
      if (!s.made && s.t > 0.5 && st.p.y < COURT.RIM.y - 0.6 && st.v.y < 0) break;
    }
    return st.s;
  }

  // launch velocity through a target point at a given launch elevation (radians)
  static solve(p0, target, elev) {
    const dx = target.x - p0.x, dz = target.z - p0.z, D = Math.hypot(dx, dz) || 1e-6, dy = target.y - p0.y;
    let th = elev;
    for (let k = 0; k < 20; k++) {
      const den = 2 * Math.cos(th) ** 2 * (D * Math.tan(th) - dy);
      if (den > 1e-4) {
        const v = Math.sqrt(G * D * D / den);
        return new THREE.Vector3(v * Math.cos(th) * dx / D, v * Math.sin(th), v * Math.cos(th) * dz / D);
      }
      th += 0.05;
    }
    return new THREE.Vector3(0, 6, -3);
  }

  // find a launch that ends the way the shot model decided ('swish', 'make' or 'miss'); kind = 'jump'|'layup'|'ft'
  static plan(p0, want, kind, R) {
    const u = new THREE.Vector3(COURT.RIM.x - p0.x, 0, COURT.RIM.z - p0.z);
    const D = u.length(); u.normalize();
    const side = new THREE.Vector3(-u.z, 0, u.x);
    const elev = (kind === 'layup' ? 58 : kind === 'ft' ? 51 : 49 + Math.min(6, D * 0.5)) * Math.PI / 180;
    let best = null;
    for (let tries = 0; tries < 18; tries++) {
      let a = 0, b = 0, ty = COURT.RIM.y + 0.02, bank = false;
      if (want === 'swish') { const r = R() * 0.055, t = R() * 6.283; a = Math.cos(t) * r; b = Math.sin(t) * r; }
      else if (want === 'make') {
        if (kind === 'layup' && R() < 0.5) { bank = true; }
        else { const r = 0.06 + R() * 0.07, t = R() * 6.283; a = Math.cos(t) * r; b = Math.sin(t) * r; }
      } else {
        const m = R();
        if (m < 0.32) b = -(0.2 + R() * 0.14);                  // front rim
        else if (m < 0.62) b = 0.2 + R() * 0.16;                // back rim
        else if (m < 0.86) { a = (R() < 0.5 ? -1 : 1) * (0.2 + R() * 0.12); b = (R() - 0.5) * 0.1; }   // side
        else if (m < 0.94) b = -(0.4 + R() * 0.35);             // short
        else b = 0.42 + R() * 0.3;                              // long, off the glass or back iron
      }
      let target;
      if (bank) {
        // aim at the glass above the rim on the shooter's side so it drops in
        const bx = THREE.MathUtils.clamp(-u.x * 0.18 + (R() - 0.5) * 0.12, -0.35, 0.35);
        target = new THREE.Vector3(bx, COURT.RIM.y + 0.32 + R() * 0.12, COURT.BOARD_Z + BR + 0.002);
      } else {
        target = new THREE.Vector3(COURT.RIM.x + u.x * b + side.x * a, ty, COURT.RIM.z + u.z * b + side.z * a);
      }
      const v0 = Ball.solve(p0, target, elev + (R() - 0.5) * 0.06);
      const s = Ball.simulate(p0, v0);
      const got = s.made ? (s.swish ? 'swish' : 'make') : 'miss';
      const ok = want === got || (want === 'make' && got === 'swish');
      if (ok) return { v: v0, s };
      if (!best) best = { v: v0, s };
    }
    return best;
  }

  update(dt) {
    this.events.length = 0;
    if (this.state === 'flight' || this.state === 'loose') {
      this.acc += dt;
      const st = this._st || (this._st = { p: null, v: null, s: null });
      st.p = this.p; st.v = this.v; st.s = this.shot;
      let n = 0;
      while (this.acc >= DT && n < 40) { Ball.step(st, DT, this.events); this.acc -= DT; n++; }
      // spin: decays, picks up roll on the floor
      if (this.p.y <= BR + 1e-3) { const h = Math.hypot(this.v.x, this.v.z); if (h > 0.05) this.spin.set(this.v.z, 0, -this.v.x).multiplyScalar(1 / BR); }
      this.spin.multiplyScalar(1 - 0.3 * dt);
    }
    this.mesh.position.copy(this.p);
    const w = this.spin.length();
    if (w > 1e-3) this.mesh.rotateOnWorldAxis(this._a.copy(this.spin).divideScalar(w), w * dt);
  }
}
