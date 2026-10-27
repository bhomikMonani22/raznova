// EasyBuckets Hoops: the arena. A regulation half court in metres (rim centre at the origin's x/z, 3.05 m up; the
// shooter looks down -z), glass backboard, rim, a cloth net that reacts to the ball, the stanchion and shot clock,
// lights, an instanced crowd and LED ribbon boards. Everything is drawn from code: no image assets.
import * as THREE from './three.module.min.js';

export const COURT = {
  RIM: new THREE.Vector3(0, 3.05, 0), R: 0.2286, RT: 0.0095,
  BOARD_Z: -0.381, BOARD_HW: 0.9145, BOARD_Y0: 2.9, BOARD_Y1: 3.967,
  BASE_Z: -1.6, HALF_Z: 12.725, SIDE_X: 7.62,
  THREE_R: 7.24, CORNER_X: 6.71, CORNER_Z: 2.72,
  KEY_HW: 2.44, FT_Z: 4.191, FT_R: 1.83, RA_R: 1.22,
};

// three-point test on the floor (x, z): beyond the arc, or in the corner beyond the straight line
export function isThree(x, z) {
  if (z < COURT.CORNER_Z) return Math.abs(x) > COURT.CORNER_X;
  return Math.hypot(x, z) > COURT.THREE_R;
}

export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function shade(hex, f) {          // f < 0 darker, f > 0 lighter
  const [r, g, b] = hexToRgb(hex);
  const m = (c) => Math.round(f < 0 ? c * (1 + f) : c + (255 - c) * f);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
function luminance(hex) { const [r, g, b] = hexToRgb(hex); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }

// a small seeded generator so the floor, crowd and faces come out the same on every visit
export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

// ---- the floor ----
const TEX = { x0: -9.6, x1: 9.6, z0: -3.4, z1: 14.4 };
function drawCourt(theme, paint, alt, quality) {
  const W = quality > 1 ? 2048 : 1536;
  const ppm = W / (TEX.x1 - TEX.x0);
  const H = Math.round((TEX.z1 - TEX.z0) * ppm);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const R = rng(1977);
  const X = (x) => (x - TEX.x0) * ppm, Z = (z) => (z - TEX.z0) * ppm;
  const T = {
    home: { wood: [214, 160, 104], spread: 26, stain: null, line: '#f7f5f0', apron: shade(paint, -0.25), lane: paint },
    midnight: { wood: [62, 44, 34], spread: 14, stain: null, line: '#7fe3ff', apron: '#0b1220', lane: '#122a52' },
    classic: { wood: [226, 178, 120], spread: 20, stain: null, line: '#1b1b1b', apron: '#7a3b1c', lane: null },
    neon: { wood: [28, 26, 40], spread: 10, stain: null, line: '#ff4fd8', apron: '#120a1f', lane: '#2b1150' },
  }[theme] || null;
  const t = T || { wood: [214, 160, 104], spread: 26, line: '#f7f5f0', apron: shade(paint, -0.25), lane: paint };
  // planks along the length of the court, staggered joints, grain
  const plank = 0.057 * ppm;
  for (let x = 0; x < W; x += plank) {
    let z = -R() * 3 * ppm;
    while (z < H) {
      const len = (1.2 + R() * 2.4) * ppm;
      const v = (R() - 0.5) * t.spread;
      g.fillStyle = `rgb(${t.wood[0] + v | 0},${t.wood[1] + v * 0.8 | 0},${t.wood[2] + v * 0.6 | 0})`;
      g.fillRect(x, z, plank + 0.6, len);
      g.fillStyle = 'rgba(40,20,5,.18)';
      g.fillRect(x, z + len - 1, plank, 1);                       // butt joint
      z += len;
    }
    g.fillStyle = 'rgba(40,20,5,.22)';
    g.fillRect(x, 0, 1, H);                                       // seam between planks
  }
  for (let i = 0; i < W * H / 900; i++) {                        // grain streaks
    const x = R() * W, z = R() * H, l = (6 + R() * 40);
    g.fillStyle = R() < 0.5 ? 'rgba(90,50,20,.07)' : 'rgba(255,235,200,.06)';
    g.fillRect(x, z, 1, l);
  }
  // out-of-bounds apron
  g.fillStyle = t.apron;
  g.fillRect(0, 0, W, Z(COURT.BASE_Z));
  g.fillRect(0, 0, X(-COURT.SIDE_X), H);
  g.fillRect(X(COURT.SIDE_X), 0, W - X(COURT.SIDE_X), H);
  // the paint
  if (t.lane) {
    g.globalAlpha = 0.9;
    g.fillStyle = t.lane;
    g.fillRect(X(-COURT.KEY_HW), Z(COURT.BASE_Z), COURT.KEY_HW * 2 * ppm, (COURT.FT_Z - COURT.BASE_Z) * ppm);
    g.globalAlpha = 1;
  }
  // lines, 5 cm
  const lw = Math.max(3, 0.051 * ppm);
  g.strokeStyle = t.line; g.fillStyle = t.line; g.lineWidth = lw; g.lineCap = 'butt';
  const line = (x0, z0, x1, z1) => { g.beginPath(); g.moveTo(X(x0), Z(z0)); g.lineTo(X(x1), Z(z1)); g.stroke(); };
  line(-COURT.SIDE_X, COURT.BASE_Z, COURT.SIDE_X, COURT.BASE_Z);                 // baseline
  line(-COURT.SIDE_X, COURT.BASE_Z, -COURT.SIDE_X, COURT.HALF_Z);               // sidelines
  line(COURT.SIDE_X, COURT.BASE_Z, COURT.SIDE_X, COURT.HALF_Z);
  line(-COURT.SIDE_X, COURT.HALF_Z, COURT.SIDE_X, COURT.HALF_Z);                 // half-court line
  // three-point line: corners then the arc
  line(-COURT.CORNER_X, COURT.BASE_Z, -COURT.CORNER_X, COURT.CORNER_Z);
  line(COURT.CORNER_X, COURT.BASE_Z, COURT.CORNER_X, COURT.CORNER_Z);
  const a0 = Math.atan2(COURT.CORNER_Z, COURT.CORNER_X);
  g.beginPath(); g.arc(X(0), Z(0), COURT.THREE_R * ppm, a0, Math.PI - a0); g.stroke();
  // the key, free-throw circle (solid outside, dashed inside), restricted area
  g.strokeRect(X(-COURT.KEY_HW), Z(COURT.BASE_Z), COURT.KEY_HW * 2 * ppm, (COURT.FT_Z - COURT.BASE_Z) * ppm);
  g.beginPath(); g.arc(X(0), Z(COURT.FT_Z), COURT.FT_R * ppm, 0, Math.PI); g.stroke();
  g.setLineDash([0.3 * ppm, 0.3 * ppm]);
  g.beginPath(); g.arc(X(0), Z(COURT.FT_Z), COURT.FT_R * ppm, Math.PI, Math.PI * 2); g.stroke();
  g.setLineDash([]);
  g.beginPath(); g.arc(X(0), Z(0), COURT.RA_R * ppm, 0, Math.PI); g.stroke();
  line(-COURT.RA_R, 0, -COURT.RA_R, -0.38); line(COURT.RA_R, 0, COURT.RA_R, -0.38);
  // lane space marks
  for (const z of [0.6, 1.5, 2.4, 3.3]) {
    line(-COURT.KEY_HW - 0.15, z, -COURT.KEY_HW, z); line(COURT.KEY_HW, z, COURT.KEY_HW + 0.15, z);
  }
  // centre circle and an original "EB" ball mark at half court
  g.beginPath(); g.arc(X(0), Z(COURT.HALF_Z), COURT.FT_R * ppm, Math.PI, Math.PI * 2); g.stroke();
  g.save();
  g.translate(X(0), Z(COURT.HALF_Z - 0.95));
  g.fillStyle = t.lane || alt; g.globalAlpha = 0.85;
  g.beginPath(); g.arc(0, 0, 0.7 * ppm, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 1; g.strokeStyle = t.line; g.lineWidth = lw * 0.8;
  g.beginPath(); g.arc(0, 0, 0.7 * ppm, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(-0.7 * ppm, 0); g.lineTo(0.7 * ppm, 0); g.moveTo(0, -0.7 * ppm); g.lineTo(0, 0.7 * ppm); g.stroke();
  g.fillStyle = t.line; g.font = `900 ${0.5 * ppm}px "Big Shoulders Display", Impact, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('EB', 0, 0.02 * ppm);
  g.restore();
  // baseline wordmark on the apron
  g.save();
  g.translate(X(0), Z(COURT.BASE_Z - 0.75));
  g.fillStyle = luminance(paint) > 0.5 ? '#14213d' : 'rgba(255,255,255,.9)';
  if (theme === 'classic' || theme === 'midnight' || theme === 'neon') g.fillStyle = t.line;
  g.font = `900 ${0.62 * ppm}px "Big Shoulders Display", Impact, sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('EASYBUCKETS', 0, 0);
  g.restore();
  return c;
}

// ---- the net: a lattice of points pinned to the rim, Verlet-integrated, pushed by the ball ----
class Net {
  constructor(parent) {
    const N = 12, K = 6;
    this.N = N; this.K = K;
    this.rest = []; this.p = []; this.q = [];
    for (let k = 0; k < K; k++) {
      const f = k / (K - 1);
      const r = COURT.R * (1 - 0.43 * Math.pow(f, 0.85));
      const y = COURT.RIM.y - 0.092 * k;
      for (let i = 0; i < N; i++) {
        const a = (2 * Math.PI * (i + 0.5 * k)) / N;
        const v = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
        this.rest.push(v); this.p.push(v.clone()); this.q.push(v.clone());
      }
    }
    this.links = [];
    const id = (k, i) => k * N + ((i % N) + N) % N;
    for (let k = 0; k < K - 1; k++) for (let i = 0; i < N; i++) {
      this.links.push([id(k, i), id(k + 1, i)]);
      this.links.push([id(k, i), id(k + 1, i - 1)]);
    }
    for (let i = 0; i < N; i++) this.links.push([id(K - 1, i), id(K - 1, i + 1)]);
    for (const l of this.links) l.push(this.rest[l[0]].distanceTo(this.rest[l[1]]));
    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(this.links.length * 6);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.mesh = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xf4f7fb, transparent: true, opacity: 0.95 }));
    this.mesh.frustumCulled = false;
    parent.add(this.mesh);
    this.write();
  }
  write() {
    let j = 0;
    for (const [a, b] of this.links) {
      const A = this.p[a], B = this.p[b];
      this.pos[j++] = A.x; this.pos[j++] = A.y; this.pos[j++] = A.z;
      this.pos[j++] = B.x; this.pos[j++] = B.y; this.pos[j++] = B.z;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }
  // set every point directly (replays)
  setAll(arr, o) { for (let i = 0; i < this.p.length; i++) this.p[i].set(arr[o + i * 3], arr[o + i * 3 + 1], arr[o + i * 3 + 2]); this.write(); }
  dump(arr, o) { for (let i = 0; i < this.p.length; i++) { arr[o + i * 3] = this.p[i].x; arr[o + i * 3 + 1] = this.p[i].y; arr[o + i * 3 + 2] = this.p[i].z; } }
  step(dt, ball, rimDy) {
    const N = this.N, tmp = this._t || (this._t = new THREE.Vector3());
    const g = -9.81 * dt * dt;
    for (let i = 0; i < this.p.length; i++) {
      const p = this.p[i], q = this.q[i], r = this.rest[i];
      if (i < N) { p.set(r.x, r.y + rimDy, r.z); q.copy(p); continue; }
      tmp.copy(p);
      p.x += (p.x - q.x) * 0.965 + (r.x - p.x) * 0.06;
      p.y += (p.y - q.y) * 0.965 + (r.y + rimDy - p.y) * 0.06 + g;
      p.z += (p.z - q.z) * 0.965 + (r.z - p.z) * 0.06;
      q.copy(tmp);
      if (ball) {                                                   // the ball pushes the strings out of its way
        const dx = p.x - ball.x, dy = p.y - ball.y, dz = p.z - ball.z, d = Math.hypot(dx, dy, dz), lim = 0.125;
        if (d < lim && d > 1e-6) { const s = lim / d; p.x = ball.x + dx * s; p.y = ball.y + dy * s; p.z = ball.z + dz * s; }
      }
    }
    for (let it = 0; it < 3; it++) {
      for (const [a, b, len] of this.links) {
        const A = this.p[a], B = this.p[b];
        const dx = B.x - A.x, dy = B.y - A.y, dz = B.z - A.z, d = Math.hypot(dx, dy, dz) || 1e-6;
        const diff = (d - len) / d * 0.5;
        if (a >= N) { A.x += dx * diff; A.y += dy * diff; A.z += dz * diff; }
        if (b >= N) { B.x -= dx * diff; B.y -= dy * diff; B.z -= dz * diff; }
      }
    }
    this.write();
  }
}

// a seated fan: torso, shoulders and arms resting forward, merged into one geometry for instancing
function fanGeo() {
  const parts = [];
  const add = (g, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0) => { g.scale(sx, sy, sz); if (rx) g.rotateX(rx); g.translate(x, y, z); parts.push(g.toNonIndexed()); };
  add(new THREE.CapsuleGeometry(0.17, 0.3, 3, 8), 0, 0, 0, 1.05, 1, 0.75);
  add(new THREE.SphereGeometry(0.2, 10, 6), 0, 0.2, 0, 1.25, 0.45, 0.75);
  add(new THREE.CapsuleGeometry(0.055, 0.3, 2, 6), 0.21, 0.02, 0.06, 1, 1, 1, -0.5);
  add(new THREE.CapsuleGeometry(0.055, 0.3, 2, 6), -0.21, 0.02, 0.06, 1, 1, 1, -0.5);
  let count = 0; for (const p of parts) count += p.attributes.position.count;
  const pos = new Float32Array(count * 3), nor = new Float32Array(count * 3);
  let o = 0;
  for (const p of parts) { pos.set(p.attributes.position.array, o * 3); nor.set(p.attributes.normal.array, o * 3); o += p.attributes.position.count; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return g;
}

// ---- the arena ----
export class World {
  constructor(renderer, scene, opts = {}) {
    this.renderer = renderer; this.scene = scene;
    this.quality = opts.quality || 2;
    this.t = 0; this.cheerLevel = 0; this.rimDy = 0; this.rimV = 0;
    scene.background = new THREE.Color(0x060b16);
    scene.fog = new THREE.Fog(0x060b16, 15, 40);
    this.buildEnv();
    this.buildLights();
    this.floorMat = new THREE.MeshStandardMaterial({ roughness: 0.32, metalness: 0.0, envMapIntensity: 0.55 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(TEX.x1 - TEX.x0, TEX.z1 - TEX.z0), this.floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((TEX.x0 + TEX.x1) / 2, 0, (TEX.z0 + TEX.z1) / 2);
    floor.receiveShadow = true;
    scene.add(floor);
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x0b1222, roughness: 0.9 }));
    outer.rotation.x = -Math.PI / 2; outer.position.y = -0.01;
    scene.add(outer);
    this.buildHoop();
    this.buildStands();
    this.net = new Net(scene);
    this.setTheme('home', '#1d428a', '#e01234');
  }

  buildEnv() {
    // a dark room with bright light banks: gives the floor, the glass and the ball their reflections
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x0a0f1c);
    const room = new THREE.Mesh(new THREE.BoxGeometry(60, 30, 60), new THREE.MeshBasicMaterial({ color: 0x0c1428, side: THREE.BackSide }));
    env.add(room);
    const lamp = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = -2; i <= 2; i++) for (let j = -1; j <= 2; j++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.2), lamp);
      m.position.set(i * 6, 14, j * 7); m.rotation.x = Math.PI / 2;
      env.add(m);
    }
    const warm = new THREE.MeshBasicMaterial({ color: 0xffb36b });
    for (const x of [-28, 28]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 2), warm); m.position.set(x, 4, 0); m.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; env.add(m); }
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(env, 0.035).texture;
    pm.dispose();
  }

  buildLights() {
    const s = this.scene;
    s.add(new THREE.HemisphereLight(0x9cc0ff, 0x3b2a1c, 0.55));
    const key = new THREE.DirectionalLight(0xfff4e6, 2.4);
    key.position.set(3.5, 16, 9);
    key.target.position.set(0, 0, 3.5);
    key.castShadow = true;
    const sh = key.shadow;
    sh.mapSize.set(this.quality > 1 ? 2048 : 1024, this.quality > 1 ? 2048 : 1024);
    sh.camera.left = -9; sh.camera.right = 9; sh.camera.top = 11; sh.camera.bottom = -8;
    sh.camera.near = 4; sh.camera.far = 34; sh.bias = -0.0004; sh.normalBias = 0.025;
    s.add(key, key.target);
    this.key = key;
    const rim = new THREE.DirectionalLight(0x8fb8ff, 0.7);
    rim.position.set(-6, 9, -10);
    s.add(rim);
    for (const x of [-5, 5]) {
      const sp = new THREE.SpotLight(0xffffff, 60, 30, 0.5, 0.6, 1.2);
      sp.position.set(x, 13, 4); sp.target.position.set(x * 0.3, 0, 3);
      s.add(sp, sp.target);
    }
  }

  buildHoop() {
    const s = this.scene;
    const pad = this.padMat = new THREE.MeshStandardMaterial({ color: 0x1d428a, roughness: 0.6 });
    const steel = new THREE.MeshStandardMaterial({ color: 0x1b2233, roughness: 0.45, metalness: 0.5 });
    // stanchion: padded base behind the baseline, post, arm to the glass
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.15, 2.0), pad);
    base.position.set(0, 0.575, -4.05); base.castShadow = true; base.receiveShadow = true;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.4, 0.42), pad);
    post.position.set(0, 2.3, -3.55); post.castShadow = true;
    const armLen = 3.2;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, armLen), steel);
    arm.position.set(0, 3.42, -0.42 - armLen / 2 - 0.05); arm.rotation.x = -0.12; arm.castShadow = true;
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.3), steel);
    brace.position.set(0, 2.85, -2.35); brace.rotation.x = 0.42;
    s.add(base, post, arm, brace);
    // glass
    const hw = COURT.BOARD_HW, y0 = COURT.BOARD_Y0, y1 = COURT.BOARD_Y1, bz = COURT.BOARD_Z;
    const glass = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, y1 - y0, 0.028),
      new THREE.MeshStandardMaterial({ color: 0xd8e9ff, transparent: true, opacity: 0.2, roughness: 0.05, metalness: 0.2,
        envMapIntensity: 1.6, depthWrite: false }));
    glass.position.set(0, (y0 + y1) / 2, bz - 0.014);
    s.add(glass);
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, emissive: 0x222222 });
    const bar = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), white); m.position.set(x, y, bz - 0.012); s.add(m); };
    const e = 0.05;
    bar(hw * 2, e, 0, y1 - e / 2); bar(hw * 2, e, 0, y0 + e / 2); bar(e, y1 - y0, -hw + e / 2, (y0 + y1) / 2); bar(e, y1 - y0, hw - e / 2, (y0 + y1) / 2);
    const sw = 0.305, sy0 = 3.05 + 0.02, sy1 = sy0 + 0.457, se = 0.05;
    bar(sw * 2, se, 0, sy1); bar(sw * 2, se, 0, sy0); bar(se, sy1 - sy0, -sw, (sy0 + sy1) / 2); bar(se, sy1 - sy0, sw, (sy0 + sy1) / 2);
    const bpad = new THREE.Mesh(new THREE.BoxGeometry(hw * 2 + 0.06, 0.07, 0.08), pad);
    bpad.position.set(0, y0 - 0.02, bz - 0.03); s.add(bpad);
    // shot clock on top of the glass
    const sc = document.createElement('canvas'); sc.width = 256; sc.height = 128;
    this.clockCanvas = sc; this.clockTex = new THREE.CanvasTexture(sc); this.clockTex.colorSpace = THREE.SRGBColorSpace;
    const clock = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.3, 0.2), [steel, steel, steel, steel,
      new THREE.MeshBasicMaterial({ map: this.clockTex }), steel]);
    clock.position.set(0, y1 + 0.17, bz - 0.12);
    s.add(clock);
    this.setShotClock(null);
    // rim and its plate
    this.rimGroup = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(COURT.R, COURT.RT * 1.4, 10, 48),
      new THREE.MeshStandardMaterial({ color: 0xff4b12, roughness: 0.32, metalness: 0.55, emissive: 0x3a0d00 }));
    rim.rotation.x = Math.PI / 2; rim.castShadow = true;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.17), rim.material);
    plate.position.set(0, -0.01, -COURT.R - 0.075);
    this.rimGroup.add(rim, plate);
    this.rimGroup.position.copy(COURT.RIM);
    s.add(this.rimGroup);
  }

  buildStands() {
    const s = this.scene;
    const riser = new THREE.MeshStandardMaterial({ color: 0x141b2c, roughness: 0.85 });
    const R = rng(4242);
    const seats = [];
    const rows = 11;
    // baseline stands (behind the stanchion) and both sides
    for (let i = 0; i < rows; i++) {
      const y = 0.55 + i * 0.46, back = 5.2 + i * 0.86;
      const step = new THREE.Mesh(new THREE.BoxGeometry(26, 0.46, 0.86), riser);
      step.position.set(0, y - 0.23, -back - 0.43); s.add(step);
      for (let x = -12.5; x <= 12.5; x += 0.56) seats.push([x + (R() - 0.5) * 0.08, y, -back - 0.3, 0]);
      for (const side of [-1, 1]) {
        const out = 9.9 + i * 0.86;
        const st = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.46, 21), riser);
        st.position.set(side * (out + 0.43), y - 0.23, 5.2); s.add(st);
        for (let z = -4.6; z <= 15; z += 0.56) seats.push([side * (out + 0.3), y, z + (R() - 0.5) * 0.08, side]);
      }
    }
    const fans = seats.filter(() => R() < 0.84);
    const n = fans.length;
    const body = new THREE.InstancedMesh(fanGeo(), new THREE.MeshLambertMaterial({ color: 0x9a9a9a }), n);
    const head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.115, 10, 8), new THREE.MeshLambertMaterial({ color: 0xb0b0b0 }), n);
    const shirts = ['#eeeeee', '#1b1b1b', '#5b6578', '#2f3b52', '#b8c2d1', '#7a1f2b', '#20456b'];
    const skins = ['#f1c9a5', '#e0ac85', '#c68a5f', '#a46a43', '#7d4a2b', '#5a3420', '#3f2416'];
    this.fans = fans.map((f) => ({ x: f[0], y: f[1], z: f[2], side: f[3], ph: R() * 6.28, sp: 5 + R() * 5, en: 0.4 + R() * 0.6, shirt: R() }));
    this.fanBody = body; this.fanHead = head; this.shirts = shirts;
    const col = new THREE.Color();
    this.fans.forEach((f, i) => {
      head.setColorAt(i, col.set(skins[Math.floor(R() * skins.length)]));
      body.setColorAt(i, col.set(shirts[Math.floor(f.shirt * shirts.length)]));
    });
    s.add(body, head);
    this.placeFans(0);
    // LED ribbon boards along the front of the stands
    const lc = document.createElement('canvas'); lc.width = 2048; lc.height = 64;
    this.ledCanvas = lc;
    this.ledTex = new THREE.CanvasTexture(lc); this.ledTex.colorSpace = THREE.SRGBColorSpace;
    this.ledTex.wrapS = THREE.RepeatWrapping; this.ledTex.repeat.set(1.6, 1);
    const ledMat = new THREE.MeshBasicMaterial({ map: this.ledTex, toneMapped: false });
    const led = new THREE.Mesh(new THREE.BoxGeometry(26, 0.62, 0.1), ledMat);
    led.position.set(0, 0.75, -5.05); s.add(led);
    for (const side of [-1, 1]) {
      const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 21), ledMat);
      l2.position.set(side * 9.75, 0.75, 5.2); s.add(l2);
    }
    // scorer's table glow along the far sideline is out of shot; a dark wall above the top rows closes the bowl
    const wall = new THREE.Mesh(new THREE.BoxGeometry(70, 30, 70), new THREE.MeshBasicMaterial({ color: 0x050912, side: THREE.BackSide }));
    wall.position.set(0, 14, 4); s.add(wall);
  }

  placeFans(t) {
    const k = this._k || (this._k = { m: new THREE.Matrix4(), q: new THREE.Quaternion(), sc: new THREE.Vector3(1, 1, 1),
      p: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) });
    const { m, q, sc, p, up } = k;
    const cheer = this.cheerLevel;
    this.fans.forEach((f, i) => {
      const amp = 0.008 + cheer * 0.11 * f.en;
      const stand = cheer > 0.55 && f.en > 0.65 ? 0.22 : 0;
      const bob = Math.abs(Math.sin(t * f.sp * (0.6 + cheer) + f.ph)) * amp;
      const yaw = f.side === 0 ? 0 : (f.side < 0 ? Math.PI / 2 : -Math.PI / 2);
      q.setFromAxisAngle(up, yaw);
      p.set(f.x, f.y + 0.42 + bob + stand, f.z);
      m.compose(p, q, sc); this.fanBody.setMatrixAt(i, m);
      p.y += 0.47; m.compose(p, q, sc); this.fanHead.setMatrixAt(i, m);
    });
    this.fanBody.instanceMatrix.needsUpdate = true;
    this.fanHead.instanceMatrix.needsUpdate = true;
  }

  drawLed(text, a, b) {
    const c = this.ledCanvas, g = c.getContext('2d');
    g.fillStyle = '#05070d'; g.fillRect(0, 0, c.width, c.height);
    g.font = '900 46px "Big Shoulders Display", Impact, sans-serif'; g.textBaseline = 'middle';
    let x = 10, i = 0;
    while (x < c.width) {
      g.fillStyle = i % 2 ? b : a;
      g.fillText(text[i % text.length], x, 34);
      x += g.measureText(text[i % text.length]).width + 46; g.fillStyle = '#3a4a66'; g.fillText('•', x - 30, 34); x += 20; i++;
    }
    this.ledTex.needsUpdate = true;
  }

  setTheme(theme, paint, alt) {
    this.theme = theme; this.paint = paint; this.alt = alt;
    const c = drawCourt(theme, paint, alt, this.quality);
    if (this.floorTex) this.floorTex.dispose();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.floorTex = tex;
    this.floorMat.map = tex;
    this.floorMat.roughness = theme === 'midnight' || theme === 'neon' ? 0.22 : 0.32;
    this.floorMat.needsUpdate = true;
    this.padMat.color.set(theme === 'neon' ? '#2b1150' : paint);
    const col = new THREE.Color();
    const shirts = [paint, paint, paint, alt, '#eeeeee', '#1b1b1b', '#5b6578'];
    this.fans.forEach((f, i) => this.fanBody.setColorAt(i, col.set(shirts[Math.floor(f.shirt * shirts.length)])));
    this.fanBody.instanceColor.needsUpdate = true;
    this.drawLed(['EASYBUCKETS', 'HOOPS', 'SWISH ONLY', 'BUCKETS', 'NO RIM'], luminance(alt) > 0.25 ? alt : '#ffc24b', '#ffffff');
  }

  setShotClock(v, warn) {
    const c = this.clockCanvas, g = c.getContext('2d');
    g.fillStyle = '#05070b'; g.fillRect(0, 0, c.width, c.height);
    g.font = '900 104px "Big Shoulders Display", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = v === null ? '#3a2a10' : (warn ? '#ff5b61' : '#ffc24b');
    g.fillText(v === null ? '--' : String(v), 128, 70);
    this.clockTex.needsUpdate = true;
  }

  cheer(level) { this.cheerLevel = Math.max(this.cheerLevel, level); }
  rimHit(strength) { this.rimV -= Math.min(0.5, strength) * 0.6; }

  update(dt, ball) {
    this.t += dt;
    // rim spring
    this.rimV += (-this.rimDy * 900 - this.rimV * 18) * dt;
    this.rimDy += this.rimV * dt;
    this.rimGroup.position.y = COURT.RIM.y + this.rimDy;
    const sub = 2;
    for (let i = 0; i < sub; i++) this.net.step(dt / sub, ball, this.rimDy);
    this.cheerLevel = Math.max(0, this.cheerLevel - dt * 0.28);
    this._fanT = (this._fanT || 0) + dt;
    if (this._fanT > 1 / 30) { this.placeFans(this.t); this._fanT = 0; }
    this.ledTex.offset.x = (this.ledTex.offset.x + dt * 0.035) % 1;
  }
}
