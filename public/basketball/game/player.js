// EasyBuckets Hoops: players. Each roster player gets an original procedural model (no likeness): body scale from
// position and the stat-based size estimate, a seeded look (skin tone, hair, beard, accessories) that stays the same
// for him on every visit, and his team's colours, number and name on the jersey. Arms are driven by two-bone IK
// toward targets the gameplay sets (ball, rim, defender); legs and torso by procedural gait, stance and jump poses.
import * as THREE from './three.module.min.js';
import { rng, hexToRgb } from './world.js';

const SKINS = ['#f2d0b0', '#e6b68c', '#d29a6c', '#b67b50', '#93603b', '#73452a', '#55301d', '#3d2114'];
const HAIRS = ['#120e0b', '#1d140d', '#2c1d12', '#47301c', '#6e4c2a', '#a9844f', '#6a2c14'];
const STYLES = ['buzz', 'fade', 'afro', 'twists', 'bald', 'curly', 'waves', 'locs', 'flat', 'bun'];

export function lookFor(p, cosmetics) {
  const R = rng((p.id || 7) * 2654435761);
  const skin = SKINS[Math.floor(R() * SKINS.length)];
  const style = STYLES[Math.floor(R() * STYLES.length)];
  const hairColor = R() < 0.82 ? HAIRS[Math.floor(R() * 4)] : HAIRS[4 + Math.floor(R() * 3)];
  const beards = ['none', 'none', 'stubble', 'short', 'full', 'goatee'];
  const look = {
    skin, style, hairColor, beard: beards[Math.floor(R() * beards.length)],
    headband: R() < 0.12, sleeve: R() < 0.16 ? (R() < 0.7 ? 'R' : 'L') : null, knee: R() < 0.2 ? (R() < 0.5 ? 'L' : 'R') : null,
    tights: R() < 0.1, wrist: R() < 0.3, socks: R() < 0.6 ? 'white' : (R() < 0.5 ? 'black' : 'team'),
    shoe: R() < 0.45 ? 'white' : (R() < 0.5 ? 'black' : 'team'),
    brow: 0.85 + R() * 0.3, jaw: 0.92 + R() * 0.16, nose: 0.85 + R() * 0.35, ear: 0.9 + R() * 0.2,
    form: Math.floor(R() * 4),                 // shot form variant
    rel: 0.5 + R() * 0.12,                     // seconds from press to the ideal release
  };
  if (cosmetics) Object.assign(look, cosmetics);
  return look;
}

function jerseyTexture(team, num, name, white) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const base = white ? '#f4f5f7' : team.color, trim = white ? team.color : team.alt;
  const [r, gg, b] = hexToRgb(team.color);
  const darkBase = !white && (0.2126 * r + 0.7152 * gg + 0.0722 * b) / 255 < 0.5;
  g.fillStyle = base; g.fillRect(0, 0, 1024, 512);
  // subtle mesh texture
  g.fillStyle = darkBase ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.035)';
  for (let y = 0; y < 512; y += 6) for (let x = (y / 6) % 2 ? 3 : 0; x < 1024; x += 6) g.fillRect(x, y, 2, 2);
  // collar and armhole trim, side panels
  g.fillStyle = trim;
  g.fillRect(0, 0, 1024, 26);
  for (const u of [0, 512, 1024]) g.fillRect(u - 14, 0, 28, 512);
  g.fillStyle = white ? '#f4f5f7' : (darkBase ? '#ffffff' : '#111111');
  for (const u of [0, 512, 1024]) g.fillRect(u - 3, 0, 6, 512);
  const numCol = white ? team.color : (team.alt.toLowerCase() === '#000000' ? '#ffffff' : team.alt);
  const outline = white ? team.alt : (darkBase ? '#ffffff' : '#111111');
  const txt = (s, x, y, size, w) => {
    g.font = `900 ${size}px "Big Shoulders Display", Impact, "Arial Narrow", sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = w; g.strokeStyle = outline; g.lineJoin = 'round';
    g.strokeText(s, x, y); g.fillStyle = numCol; g.fillText(s, x, y);
  };
  if (num) { txt(num, 768, 240, 170, 14); txt(num, 256, 250, 220, 16); }
  else { txt(team.abbr, 768, 220, 120, 10); }
  if (name) {
    g.save(); g.translate(256, 110); g.scale(0.85, 1);
    g.font = '800 54px "Big Shoulders Display", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = numCol; g.fillText(name.toUpperCase(), 0, 0); g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function shortsTexture(team, white) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = white ? '#f4f5f7' : team.color; g.fillRect(0, 0, 512, 256);
  g.fillStyle = white ? team.color : team.alt;
  g.fillRect(0, 0, 512, 34);                                         // waistband
  for (const u of [0, 256, 512]) g.fillRect(u - 16, 0, 32, 256);       // side stripes
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// a tiled mesh-weave normal map shared by every jersey and pair of shorts
let FABRIC = null;
function fabric() {
  if (FABRIC) return FABRIC;
  const n = 128, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), img = g.createImageData(n, n), R = rng(5150);
  const h = new Float32Array(n * n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const hole = ((x % 8) - 4) ** 2 + ((y % 8) - 4) ** 2 < 5 ? -0.6 : 0;
    h[y * n + x] = 0.35 * Math.sin(x / n * Math.PI * 32) * Math.sin(y / n * Math.PI * 32) + hole + (R() - 0.5) * 0.2;
  }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = h[y * n + (x + 1) % n] - h[y * n + (x + n - 1) % n], dy = h[((y + 1) % n) * n + x] - h[((y + n - 1) % n) * n + x];
    const l = Math.hypot(dx, dy, 2), i = (y * n + x) * 4;
    img.data[i] = (-dx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (-dy / l * 0.5 + 0.5) * 255; img.data[i + 2] = (2 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  FABRIC = new THREE.CanvasTexture(c);
  FABRIC.wrapS = FABRIC.wrapT = THREE.RepeatWrapping; FABRIC.repeat.set(10, 6);
  return FABRIC;
}

// a limb as a lathe hanging down -Y from its joint: radii top to bottom, rounded ends (open tubes for clothing)
function limbGeo(len, radii, open, phi0 = 0) {
  const pts = [], n = radii.length;
  if (!open) for (let i = 0; i <= 4; i++) { const a = (i / 4) * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(a) * radii[0], Math.cos(a) * radii[0] * 0.6)); }
  for (let i = 0; i < n; i++) pts.push(new THREE.Vector2(radii[i], -len * i / (n - 1)));
  if (!open) for (let i = 1; i <= 4; i++) { const a = Math.PI / 2 + (i / 4) * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(0.0005, Math.sin(a) * radii[n - 1]), -len + Math.cos(a) * radii[n - 1] * 0.6)); }
  const g = new THREE.LatheGeometry(pts, 16, phi0);
  if (open) g.computeVertexNormals();
  return g;
}

// a sneaker from its side profile, extruded across the width with rounded edges; sole = the bottom strip
function shoeGeo(L, h, w, sole) {
  const s = new THREE.Shape();
  if (sole) {
    s.moveTo(-0.34 * L, 0); s.lineTo(0.62 * L, 0); s.quadraticCurveTo(0.72 * L, 0, 0.7 * L, h); s.lineTo(-0.35 * L, h); s.quadraticCurveTo(-0.37 * L, 0, -0.34 * L, 0);
  } else {
    s.moveTo(-0.33 * L, 0);
    s.lineTo(0.58 * L, 0);
    s.quadraticCurveTo(0.71 * L, 0.02 * h, 0.69 * L, 0.3 * h);
    s.quadraticCurveTo(0.64 * L, 0.6 * h, 0.36 * L, 0.66 * h);
    s.lineTo(0.06 * L, 0.98 * h);
    s.lineTo(-0.2 * L, 1.06 * h);
    s.quadraticCurveTo(-0.37 * L, 1.0 * h, -0.35 * L, 0.42 * h);
    s.quadraticCurveTo(-0.35 * L, 0.0, -0.33 * L, 0);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: w * 0.62, bevelEnabled: true, bevelThickness: w * 0.19, bevelSize: Math.min(w * 0.16, h * 0.3), bevelSegments: 3, curveSegments: 10 });
  g.translate(0, 0, -w * 0.31);
  g.rotateY(-Math.PI / 2);
  return g;
}


// fewer draw calls: under each joint, meshes that share a material become one mesh (static parts only)
function mergeByJoint(root) {
  const joints = [];
  root.traverse((o) => { if (!o.isMesh) joints.push(o); });
  const m4 = new THREE.Matrix4();
  for (const j of joints) {
    const groups = new Map();
    for (const c of j.children.slice()) {
      if (!c.isMesh || c.material.transparent) continue;
      if (!groups.has(c.material)) groups.set(c.material, []);
      groups.get(c.material).push(c);
    }
    for (const [mat, list] of groups) {
      if (list.length < 2) continue;
      const parts = list.map((m) => { m.updateMatrix(); const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()); g.applyMatrix4(m4.copy(m.matrix)); return g; });
      let n = 0; for (const g of parts) n += g.attributes.position.count;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
      let o = 0;
      for (const g of parts) {
        const c = g.attributes.position.count;
        pos.set(g.attributes.position.array, o * 3);
        if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
        if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
        o += c; g.dispose();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      geo.computeBoundingSphere();
      const merged = new THREE.Mesh(geo, mat); merged.castShadow = true;
      for (const m of list) { j.remove(m); m.geometry.dispose(); }
      j.add(merged);
    }
  }
}

export class Rig {
  constructor(p, team, opts = {}) {
    this.p = p;
    const H = this.H = p.body.h * (opts.scale || 1);
    const bulk = this.bulk = p.body.bulk;
    const look = this.look = opts.look || lookFor(p);
    const R = rng((p.id || 3) * 97 + 11);
    this.root = new THREE.Group();
    this.root.name = 'player-' + p.id;
    const L = this.L = {
      foot: 0.045 * H, shin: 0.245 * H, thigh: 0.245 * H, pelvis: 0.075 * H, spine: 0.1 * H, chest: 0.125 * H,
      neck: 0.035 * H, ua: 0.19 * H, fa: 0.152 * H, hand: 0.085 * H, shX: 0.113 * H * (0.95 + 0.1 * bulk), hipX: 0.058 * H,
    };
    L.hipY = L.foot + L.shin + L.thigh;
    const skin = new THREE.MeshPhysicalMaterial({ color: look.skin, roughness: look.style === 'bald' ? 0.4 : 0.5, metalness: 0.0, sheen: 0.4,
      sheenRoughness: 0.55, sheenColor: new THREE.Color(look.skin).offsetHSL(0, -0.05, 0.12), clearcoat: 0.06, clearcoatRoughness: 0.55 });
    const hair = new THREE.MeshStandardMaterial({ color: look.hairColor, roughness: 0.92 });
    const white = !!opts.white;
    const jersey = new THREE.MeshStandardMaterial({ map: jerseyTexture(team, p.num, p.name.split(' ').slice(-1)[0], white), roughness: 0.74,
      normalMap: fabric(), normalScale: new THREE.Vector2(0.45, 0.45) });
    const shortsM = new THREE.MeshStandardMaterial({ map: shortsTexture(team, white), roughness: 0.66, side: THREE.DoubleSide,
      normalMap: fabric(), normalScale: new THREE.Vector2(0.4, 0.4) });
    const teamCol = white ? team.color : team.color;
    const shoeCol = look.shoe === 'white' ? '#f2f2f2' : look.shoe === 'black' ? '#151515' : look.shoe === 'team' ? teamCol : look.shoe;
    const shoeM = new THREE.MeshStandardMaterial({ color: shoeCol, roughness: 0.55 });
    const soleM = new THREE.MeshStandardMaterial({ color: look.shoe === 'white' ? '#d9d9d9' : '#f4f4f4', roughness: 0.7 });
    const sockM = new THREE.MeshStandardMaterial({ color: look.socks === 'white' ? '#f3f3f3' : look.socks === 'black' ? '#141414' : teamCol, roughness: 0.85 });
    const accM = new THREE.MeshStandardMaterial({ color: look.accColor || (white ? team.color : '#f3f3f3'), roughness: 0.8 });
    this.mats = { skin, hair, jersey, shortsM, shoeM, soleM, sockM, accM };
    const mesh = (geo, mat, parent, pos, rot, scale) => {
      const m = new THREE.Mesh(geo, mat);
      if (pos) m.position.copy(pos);
      if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
      if (scale) m.scale.copy(scale);
      m.castShadow = true;
      parent.add(m); return m;
    };
    const joint = (parent, pos, name) => { const j = new THREE.Object3D(); j.position.copy(pos); j.name = name; parent.add(j); return j; };
    const j = this.j = {};
    j.hips = joint(this.root, V(0, L.hipY, 0), 'hips');
    const hb = H * bulk;
    // legs: tapered thighs and calves, long baggy shorts, socks, sneakers
    for (const s of ['L', 'R']) {
      const sx = s === 'L' ? 1 : -1;
      const th = j['th' + s] = joint(j.hips, V(sx * L.hipX, 0, 0), 'th' + s);
      const sh = j['sh' + s] = joint(th, V(0, -L.thigh, 0), 'sh' + s);
      const ft = j['ft' + s] = joint(sh, V(0, -L.shin, 0), 'ft' + s);
      const legMat = look.tights ? sockM : skin;
      mesh(limbGeo(L.thigh * 1.02, [0.06, 0.059, 0.056, 0.051, 0.045, 0.039, 0.035].map((r) => r * hb)), legMat, th, V(0, 0, 0));
      mesh(limbGeo(L.thigh * 0.84, [0.075, 0.075, 0.074, 0.073, 0.072, 0.072].map((r) => r * hb), true, Math.PI / 2), shortsM, th, V(0, 0.02 * H, 0.004 * H));
      mesh(new THREE.SphereGeometry(0.031 * hb, 14, 10), legMat, sh, V(0, 0.004 * H, 0.0));                     // knee
      mesh(limbGeo(L.shin * 1.0, [0.034, 0.038, 0.039, 0.035, 0.03, 0.025, 0.022, 0.021].map((r) => r * hb)), legMat, sh, V(0, 0.01 * H, 0));
      if (look.knee === s) mesh(limbGeo(L.shin * 0.34, [0.041, 0.042, 0.042, 0.04].map((r) => r * hb), true), accM, sh, V(0, 0.02 * H, 0));
      const sockLen = look.socks === 'white' ? 0.4 : 0.5;
      mesh(limbGeo(L.shin * sockLen, [0.031, 0.029, 0.026, 0.024, 0.023].map((r) => r * hb * 1.04), true), sockM, sh, V(0, -L.shin * (1 - sockLen) + 0.005 * H, 0));
      const sl = 0.158 * H, sw = 0.054 * H, shH = 0.062 * H;
      mesh(shoeGeo(sl, shH, sw), shoeM, ft, V(0, -L.foot + 0.012 * H, 0.01 * H));
      mesh(shoeGeo(sl * 1.03, shH * 0.26, sw * 1.08, true), soleM, ft, V(0, -L.foot, 0.01 * H));
    }
    // torso
    j.spine = joint(j.hips, V(0, L.pelvis, 0), 'spine');
    j.chest = joint(j.spine, V(0, L.spine, 0), 'chest');
    j.neck = joint(j.chest, V(0, L.chest, 0), 'neck');
    j.head = joint(j.neck, V(0, L.neck, 0), 'head');
    // shorts: waist to crotch, flaring over the hips
    const waist = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, y = 0.07 - 0.2 * t;
      waist.push(new THREE.Vector2((0.097 + 0.016 * Math.sin(Math.min(1, t * 1.4) * Math.PI / 2)) * H, y * H));
    }
    const shorts = mesh(new THREE.LatheGeometry(waist, 28, Math.PI / 2), shortsM, j.hips, V(0, 0.02 * H, 0));
    shorts.scale.set(bulk * 1.02, 1, 0.68 * bulk);
    // jersey: V-taper from a tucked waist to broad shoulders; rows evenly spaced so the number is not stretched
    const prof = (y) => {                                   // y in units of H above the spine joint
      if (y < 0.0) return 0.097;
      if (y < 0.06) return 0.097 + y * 0.06;
      if (y < 0.16) return 0.1006 + (y - 0.06) * 0.2;
      if (y < 0.2) return 0.1206;
      if (y < 0.232) return 0.1206 - (y - 0.2) * 0.75;
      return 0.0966 - (y - 0.232) * 2.6;
    };
    const pts = [];
    for (let i = 0; i <= 18; i++) { const y = -0.1 + (0.252 + 0.1) * i / 18; pts.push(new THREE.Vector2(Math.max(0.035, prof(y)) * H, y * H)); }
    const torso = mesh(new THREE.LatheGeometry(pts, 36, Math.PI / 2), jersey, j.spine, V(0, 0, 0));
    torso.scale.set(bulk * 1.05, 1, 0.6 * bulk);
    this.torso = torso;
    // trapezius and neck
    mesh(new THREE.SphereGeometry(0.075 * H, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), skin, j.chest, V(0, L.chest - 0.035 * H, -0.006 * H), null, V(1.15 * bulk, 0.42, 0.62 * bulk));
    mesh(limbGeo(L.neck * 2.6, [0.036, 0.034, 0.034, 0.036].map((r) => r * hb)), skin, j.neck, V(0, L.neck * 1.7, 0.002 * H));
    this.buildHead(j.head, H, skin, hair, accM, look, R);
    // arms: deltoid, tapered upper arm and forearm, hand
    for (const s of ['L', 'R']) {
      const sx = s === 'L' ? 1 : -1;
      const ua = j['ua' + s] = joint(j.chest, V(sx * L.shX, L.chest - 0.032 * H, -0.004 * H), 'ua' + s);
      const fa = j['fa' + s] = joint(ua, V(0, -L.ua, 0), 'fa' + s);
      const ha = j['ha' + s] = joint(fa, V(0, -L.fa, 0), 'ha' + s);
      mesh(new THREE.SphereGeometry(0.04 * hb, 16, 12), skin, ua, V(sx * 0.004 * H, -0.01 * H, 0), null, V(1.0, 0.95, 0.92));
      const sleeve = look.sleeve === s;
      mesh(limbGeo(L.ua * 1.02, [0.039, 0.038, 0.037, 0.035, 0.031, 0.027, 0.025].map((r) => r * hb)), sleeve ? accM : skin, ua, V(0, 0, 0));
      mesh(limbGeo(L.fa * 1.0, [0.026, 0.029, 0.028, 0.025, 0.021, 0.019, 0.018].map((r) => r * hb)), sleeve ? accM : skin, fa, V(0, 0.004 * H, 0));
      mesh(new THREE.SphereGeometry(0.022 * hb, 12, 8), sleeve ? accM : skin, fa, V(0, 0.002 * H, 0));                 // elbow
      if (look.wrist) mesh(limbGeo(0.045 * H, [0.022, 0.022, 0.022].map((r) => r * hb * 1.08), true), accM, fa, V(0, -L.fa + 0.05 * H, 0));
      // hand: palm block with fingers together and a thumb
      mesh(new THREE.SphereGeometry(1, 14, 10), skin, ha, V(0, -L.hand * 0.4, 0.002 * H), null, V(0.026 * H, L.hand * 0.52, 0.013 * H));
      mesh(new THREE.CapsuleGeometry(0.0075 * H, 0.028 * H, 3, 6), skin, ha, V(sx * -0.004 * H, -0.024 * H, 0.016 * H), [0.5, 0, sx * 0.35]);
    }
    mergeByJoint(this.root);
    this.root.traverse((o) => { if (o.isMesh) o.receiveShadow = false; });
    // state
    this.phase = 0; this.lean = 0; this.look2 = { yaw: 0, pitch: 0 };
    this._m = new THREE.Matrix4(); this._v = [V(0, 0, 0), V(0, 0, 0), V(0, 0, 0), V(0, 0, 0), V(0, 0, 0)];
    this._q = new THREE.Quaternion(); this._mb = new THREE.Matrix4();
  }

  buildHead(hj, H, skin, hair, accM, look, R) {
    const rh = 0.064 * H;
    this.rh = rh;
    const g = new THREE.Group(); g.position.y = rh * 0.95; hj.add(g);
    this.headGroup = g;
    const mk = (geo, mat, pos, scale, rot) => { const m = new THREE.Mesh(geo, mat); m.position.copy(pos); if (scale) m.scale.copy(scale); if (rot) m.rotation.set(rot[0], rot[1], rot[2]); m.castShadow = true; g.add(m); return m; };
    mk(new THREE.SphereGeometry(rh, 24, 18), skin, V(0, 0, 0), V(0.86, 1.06, 0.96));                          // cranium
    mk(new THREE.SphereGeometry(rh * 0.72, 18, 12), skin, V(0, -rh * 0.42, rh * 0.18), V(0.92 * look.jaw, 0.8, 0.92)); // jaw and cheeks
    mk(new THREE.SphereGeometry(rh * 0.2, 10, 8), skin, V(0, -rh * 0.12, rh * 0.9), V(0.85, 1.1 * look.nose, 0.9));   // nose
    for (const sx of [-1, 1]) {
      mk(new THREE.SphereGeometry(rh * 0.2, 10, 8), skin, V(sx * rh * 0.86, -rh * 0.08, 0), V(0.45, 1.05 * look.ear, 0.8)); // ears
      const eye = mk(new THREE.SphereGeometry(rh * 0.11, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.3 }),
        V(sx * rh * 0.32, rh * 0.08, rh * 0.86), V(1, 0.62, 0.5));
      mk(new THREE.SphereGeometry(rh * 0.06, 8, 6), new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.2 }),
        V(sx * rh * 0.32, rh * 0.08, rh * 0.915), V(1, 1, 0.5));
      mk(new THREE.BoxGeometry(rh * 0.36, rh * 0.075 * look.brow, rh * 0.1), hair, V(sx * rh * 0.32, rh * 0.25, rh * 0.88), null, [0.15, 0, sx * -0.12]);
      void eye;
    }
    mk(new THREE.BoxGeometry(rh * 0.42, rh * 0.06, rh * 0.06), new THREE.MeshStandardMaterial({ color: 0x5a2a22, roughness: 0.6 }),
      V(0, -rh * 0.5, rh * 0.885));                                                                                   // mouth
    // hair
    const st = look.style;
    if (st === 'buzz' || st === 'fade' || st === 'waves' || st === 'flat') {
      const cap = mk(new THREE.SphereGeometry(rh * 1.035, 22, 14, 0, Math.PI * 2, 0, Math.PI * (st === 'fade' ? 0.36 : 0.5)), hair,
        V(0, rh * 0.06, -rh * 0.04), V(0.88, 1.06, 0.99));
      if (st === 'flat') mk(new THREE.CylinderGeometry(rh * 0.74, rh * 0.8, rh * 0.5, 16), hair, V(0, rh * 0.95, -rh * 0.05), V(1, 1, 1.05));
      if (st === 'fade') mk(new THREE.SphereGeometry(rh * 1.02, 22, 14, 0, Math.PI * 2, Math.PI * 0.36, Math.PI * 0.14), hair,
        V(0, rh * 0.06, -rh * 0.04), V(0.88, 1.06, 0.99)).material = new THREE.MeshStandardMaterial({ color: look.hairColor, roughness: 1, transparent: true, opacity: 0.55 });
      void cap;
    } else if (st === 'afro') {
      const geo = new THREE.IcosahedronGeometry(rh * 1.35, 3);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) { const k = 1 + (R() - 0.5) * 0.08; pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k); }
      geo.computeVertexNormals();
      mk(geo, hair, V(0, rh * 0.42, -rh * 0.22), V(0.92, 0.82, 0.9));
    } else if (st === 'curly') {
      mk(new THREE.SphereGeometry(rh * 1.04, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), hair, V(0, rh * 0.08, -rh * 0.04), V(0.88, 1.06, 0.99));
      for (let i = 0; i < 26; i++) {
        const a = R() * Math.PI * 2, el = R() * 1.0;
        const p = V(Math.cos(a) * Math.sin(el) * rh * 0.9, rh * (0.55 + Math.cos(el) * 0.42), Math.sin(a) * Math.sin(el) * rh * 0.9 - rh * 0.08);
        mk(new THREE.SphereGeometry(rh * 0.2, 8, 6), hair, p);
      }
    } else if (st === 'twists' || st === 'locs') {
      mk(new THREE.SphereGeometry(rh * 1.04, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, V(0, rh * 0.06, -rh * 0.04), V(0.88, 1.06, 0.99));
      const n = st === 'locs' ? 22 : 30, len = st === 'locs' ? rh * 1.5 : rh * 0.55;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + R() * 0.2;
        if (Math.sin(a) > (st === 'locs' ? 0.55 : 0.35)) continue;            // keep the face clear
        const el = st === 'locs' ? 0.9 + R() * 0.5 : 0.3 + R() * 0.8;
        const p = V(Math.cos(a) * Math.sin(el) * rh * 0.92, rh * (0.25 + Math.cos(el) * 0.75), Math.sin(a) * Math.sin(el) * rh * 0.92 - rh * 0.05);
        const m = mk(new THREE.CapsuleGeometry(rh * 0.075, len, 3, 5), hair, p);
        if (st === 'locs') { m.position.y -= len * 0.42; m.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25); }
        else m.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6);
      }
    } else if (st === 'bun') {
      mk(new THREE.SphereGeometry(rh * 1.04, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), hair, V(0, rh * 0.06, -rh * 0.04), V(0.88, 1.06, 0.99));
      mk(new THREE.SphereGeometry(rh * 0.38, 12, 10), hair, V(0, rh * 0.8, -rh * 0.6));
    }
    // facial hair
    const b = look.beard;
    if (b === 'stubble' || b === 'short' || b === 'full') {
      // jaw line and chin, leaving the mouth clear
      const m = mk(new THREE.SphereGeometry(rh * 0.76, 20, 12, Math.PI * 0.02, Math.PI * 0.96, Math.PI * 0.6, Math.PI * 0.3), hair,
        V(0, -rh * 0.36, rh * 0.16), V(0.96 * look.jaw, b === 'full' ? 1.0 : 0.9, b === 'full' ? 1.04 : 0.98));
      if (b !== 'stubble') mk(new THREE.BoxGeometry(rh * 0.5, rh * 0.07, rh * 0.08), hair, V(0, -rh * 0.38, rh * 0.86));
      if (b === 'stubble') m.material = new THREE.MeshStandardMaterial({ color: look.hairColor, roughness: 1, transparent: true, opacity: 0.4 });
    } else if (b === 'goatee') {
      mk(new THREE.SphereGeometry(rh * 0.19, 10, 8), hair, V(0, -rh * 0.8, rh * 0.62), V(1, 0.8, 0.6));
      mk(new THREE.BoxGeometry(rh * 0.46, rh * 0.06, rh * 0.06), hair, V(0, -rh * 0.38, rh * 0.86));
    }
    if (look.headband) {
      mk(new THREE.TorusGeometry(rh * 0.93, rh * 0.11, 8, 28), accM, V(0, rh * 0.42, -rh * 0.02), V(0.9, 1, 1.02), [Math.PI / 2 - 0.12, 0, 0]);
    }
  }

  // ---- poses ----
  // lower body and torso: gait, stance, jump
  base(o) {
    const j = this.j, L = this.L, H = this.H;
    const s = Math.min(1, (o.speed || 0) / 7.5), ph = o.phase || 0;
    const crouch = o.crouch || 0, air = o.air || 0, def = o.defense || 0;
    const lat = o.lateral || 0;                            // -1..1 sideways component of motion (defence slides)
    const fwdS = s * (1 - Math.abs(lat) * def);
    const sw = Math.sin(ph), cw = Math.cos(ph);
    const thighSwing = 0.78 * fwdS;
    const kneeL = 0.18 + crouch * 1.15 + fwdS * 1.25 * Math.pow(Math.max(0, Math.cos(ph)), 1.6) + air * 0.6;
    const kneeR = 0.18 + crouch * 1.15 + fwdS * 1.25 * Math.pow(Math.max(0, -Math.cos(ph)), 1.6) + air * 0.6;
    const slide = def * Math.abs(lat) * s;
    j.thL.rotation.set(-thighSwing * sw - 0.12 - crouch * 0.75 - air * 0.45, 0, 0.06 + def * 0.32 + slide * 0.2 * Math.max(0, sw));
    j.thR.rotation.set(thighSwing * sw - 0.12 - crouch * 0.75 - air * 0.3, 0, -0.06 - def * 0.32 - slide * 0.2 * Math.max(0, -sw));
    j.shL.rotation.set(kneeL, 0, -(0.04 + def * 0.2));
    j.shR.rotation.set(kneeR, 0, 0.04 + def * 0.2);
    // feet stay flat-ish
    j.ftL.rotation.set(-(j.thL.rotation.x + kneeL) * 0.85 + air * 0.5, 0, -(j.thL.rotation.z + j.shL.rotation.z));
    j.ftR.rotation.set(-(j.thR.rotation.x + kneeR) * 0.85 + air * 0.5, 0, -(j.thR.rotation.z + j.shR.rotation.z));
    // hips height from knee bend so feet stay on the floor
    const legL = Math.cos(j.thL.rotation.x) * L.thigh + Math.cos(j.thL.rotation.x + kneeL) * L.shin;
    const legR = Math.cos(j.thR.rotation.x) * L.thigh + Math.cos(j.thR.rotation.x + kneeR) * L.shin;
    const stand = Math.max(legL, legR) * Math.cos(0.06 + def * 0.32);
    const bob = fwdS * 0.022 * H * Math.abs(cw);
    j.hips.position.y = L.foot + stand - bob * (1 - air);
    j.hips.rotation.set(0, sw * 0.12 * fwdS, 0);
    // torso: lean with speed and crouch, counter-twist
    const lean = 0.06 + fwdS * 0.24 + crouch * 0.4 + def * 0.26 + (o.lean || 0);
    j.spine.rotation.set(lean * 0.6, -sw * 0.1 * fwdS + (o.twist || 0) * 0.5, 0);
    j.chest.rotation.set(lean * 0.4 + (o.breath || 0), -sw * 0.08 * fwdS + (o.twist || 0) * 0.5, 0);
    // head looks at the target (yaw relative to the body, limited)
    const yaw = THREE.MathUtils.clamp(o.headYaw || 0, -1.1, 1.1), pitch = THREE.MathUtils.clamp(o.headPitch || 0, -0.6, 0.5);
    j.neck.rotation.set(-lean * 0.5 + pitch * 0.4, yaw * 0.4, 0);
    j.head.rotation.set(-lean * 0.3 + pitch * 0.6, yaw * 0.6, 0);
  }

  // simple arm swing used while running without the ball (or the off arm while dribbling)
  armSwing(side, o) {
    const j = this.j, ph = o.phase || 0, s = Math.min(1, (o.speed || 0) / 7.5);
    const sx = side === 'L' ? 1 : -1;
    const swing = (side === 'L' ? 1 : -1) * Math.sin(ph) * 0.65 * s;
    const ua = j['ua' + side], fa = j['fa' + side], ha = j['ha' + side];
    ua.quaternion.setFromEuler(new THREE.Euler(swing - 0.08 - (o.def || 0) * 0.5, 0, sx * (0.14 + (o.def || 0) * 1.0), 'XYZ'));
    fa.quaternion.setFromEuler(new THREE.Euler(-(0.35 + s * 0.95 + (o.def || 0) * 0.4), 0, 0, 'XYZ'));
    ha.rotation.set(0.1, 0, 0);
  }

  // two-bone IK: reach the palm to a world point; pole is a world point the elbow bends toward
  reach(side, target, pole, wrist = 0) {
    const j = this.j, L = this.L;
    const ua = j['ua' + side], fa = j['fa' + side], ha = j['ha' + side];
    const [T, P, D, Wv, E] = this._v;
    const inv = this._m.copy(j.chest.matrixWorld).invert();
    T.copy(target).applyMatrix4(inv);
    P.copy(pole).applyMatrix4(inv);
    const S = ua.position;
    const a = L.ua, b = L.fa + L.hand * 0.45;
    D.copy(T).sub(S);
    let d = D.length();
    const dmin = Math.abs(a - b) + 1e-3, dmax = (a + b) * 0.999;
    d = Math.min(Math.max(d, dmin), dmax);
    D.normalize();
    Wv.copy(P).sub(S); Wv.addScaledVector(D, -Wv.dot(D));
    if (Wv.lengthSq() < 1e-8) Wv.set(0, 0, -1).addScaledVector(D, -D.z);
    Wv.normalize();
    const cosA = (a * a + d * d - b * b) / (2 * a * d), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    E.copy(S).addScaledVector(D, a * cosA).addScaledVector(Wv, a * sinA);       // elbow, chest space
    const uaDir = E.clone().sub(S).normalize();
    const hand = S.clone().addScaledVector(D, d);
    const faDir = hand.sub(E).normalize();
    // upper-arm basis: local -Y along the upper arm, local X across the bend plane
    let X = new THREE.Vector3().crossVectors(uaDir, faDir);
    if (X.lengthSq() < 1e-6) X.crossVectors(uaDir, Wv);
    X.normalize();
    const Y = uaDir.clone().negate();
    const Z = new THREE.Vector3().crossVectors(X, Y).normalize();
    X.crossVectors(Y, Z).normalize();
    this._mb.makeBasis(X, Y, Z);
    ua.quaternion.setFromRotationMatrix(this._mb);
    // forearm: flex about the local X axis
    const fl = faDir.clone().applyQuaternion(this._q.copy(ua.quaternion).invert());
    const th = Math.atan2(-fl.z, -fl.y);
    fa.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), th);
    ha.rotation.set(wrist, 0, 0);
  }

  palm(side, out) {
    const ha = this.j['ha' + side];
    return out.set(0, -this.L.hand * 0.45, 0).applyMatrix4(ha.matrixWorld);
  }
  headTop(out) { return out.set(0, this.rh * 2.1, 0).applyMatrix4(this.j.head.matrixWorld); }
  chestPos(out) { return out.set(0, this.L.chest * 0.55, this.H * 0.07).applyMatrix4(this.j.chest.matrixWorld); }
}
