// EasyBuckets Hoops: progression saved on this device (localStorage, wrapped so private browsing still plays): XP and
// levels, unlockable cosmetics, career stats, personal bests and challenge stars.
const KEY = 'eb.hoops.v1';

export const COSMETICS = {
  ball: [
    { id: 'classic', name: 'Classic', lvl: 1 }, { id: 'street', name: 'Street', lvl: 2 }, { id: 'retro', name: 'Retro', lvl: 5 },
    { id: 'ice', name: 'Ice', ch: 'ice-water' }, { id: 'glow', name: 'Glow', lvl: 9 }, { id: 'lava', name: 'Lava', ch: 'rim-rocker' },
    { id: 'gold', name: 'Gold', lvl: 14 },
  ],
  shoe: [
    { id: 'team', name: 'Team', lvl: 1 }, { id: 'white', name: 'White', lvl: 1 }, { id: 'black', name: 'Black', lvl: 1 },
    { id: '#ff4b12', name: 'Lava', lvl: 3 }, { id: '#7fd6ff', name: 'Ice', lvl: 7 }, { id: '#d4a537', name: 'Gold', lvl: 12 },
    { id: '#36d399', name: 'Mint', ch: 'green-machine' },
  ],
  acc: [
    { id: 'wrist', name: 'Wristbands', lvl: 2 }, { id: 'headband', name: 'Headband', lvl: 4 }, { id: 'sleeve', name: 'Arm sleeve', lvl: 6 },
    { id: 'knee', name: 'Knee sleeve', lvl: 8 }, { id: 'tights', name: 'Tights', lvl: 10 },
  ],
  fx: [
    { id: 'spark', name: 'Spark', lvl: 1 }, { id: 'fireworks', name: 'Fireworks', lvl: 10 }, { id: 'lightning', name: 'Lightning', lvl: 16 },
  ],
  court: [
    { id: 'home', name: 'Home', lvl: 1 }, { id: 'midnight', name: 'Midnight', lvl: 11 }, { id: 'classic', name: 'Classic', lvl: 13 },
    { id: 'neon', name: 'Neon', lvl: 18 },
  ],
};

export function xpToNext(level) { return Math.round(150 * Math.pow(level, 1.35)); }
export function levelInfo(xp) {
  let lvl = 1, left = xp;
  while (left >= xpToNext(lvl) && lvl < 99) { left -= xpToNext(lvl); lvl++; }
  return { level: lvl, into: left, need: xpToNext(lvl) };
}

const fresh = () => ({
  v: 1, xp: 0, playerId: null, team: null, oppId: null, diff: 1,
  equip: { ball: 'classic', shoe: 'team', acc: {}, fx: 'spark', court: 'home' },
  stats: { games: 0, wins: 0, losses: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, greens: 0, dunks: 0, blocks: 0, steals: 0,
    rebs: 0, streak: 0, sessions: 0 },
  bests: { shootaround: 0, threes: 0, ft: 0, atw: 0, contest: 0 },
  ch: {}, unlocked: [], per: {},
});

export class Profile {
  constructor() {
    this.d = fresh();
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && s.v === 1) this.d = Object.assign(fresh(), s, { stats: Object.assign(fresh().stats, s.stats), bests: Object.assign(fresh().bests, s.bests), equip: Object.assign(fresh().equip, s.equip) }); } catch (_) {}
    try { const old = JSON.parse(localStorage.getItem('eb.shoot') || 'null'); if (old && old.best && !this.d.stats.streak) this.d.stats.streak = old.best; } catch (_) {}
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.d)); } catch (_) {} }
  get level() { return levelInfo(this.d.xp).level; }
  has(kind, id) {
    const c = COSMETICS[kind].find((x) => x.id === id);
    if (!c) return false;
    if (c.ch) return this.d.unlocked.includes(kind + ':' + id);
    return this.level >= c.lvl;
  }
  // add XP; returns {levels gained, newly unlocked cosmetics}
  addXp(n) {
    const before = this.level;
    this.d.xp += Math.max(0, Math.round(n));
    const after = this.level;
    const unlocks = [];
    if (after > before) for (const kind of Object.keys(COSMETICS)) for (const c of COSMETICS[kind]) if (c.lvl && c.lvl > before && c.lvl <= after) unlocks.push({ kind, ...c });
    this.save();
    return { from: before, to: after, unlocks };
  }
  unlock(kind, id) { const k = kind + ':' + id; if (!this.d.unlocked.includes(k)) { this.d.unlocked.push(k); this.save(); return true; } return false; }
  stars(id) { return this.d.ch[id] || 0; }
  setStars(id, n) { if (n > (this.d.ch[id] || 0)) { this.d.ch[id] = n; this.save(); return true; } return false; }
  per(id) { return this.d.per[id] || (this.d.per[id] = { games: 0, wins: 0, pts: 0, fgm: 0, fga: 0 }); }
}
