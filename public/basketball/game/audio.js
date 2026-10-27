// EasyBuckets Hoops: sound, synthesised with Web Audio (no files): ball on hardwood, swish, rim, glass, sneakers,
// buzzer, the green-release chime and a crowd that breathes, roars and groans. Starts on the first tap (iOS rule).
export class Sound {
  constructor() {
    this.ctx = null; this.muted = false;
    try { this.muted = localStorage.getItem('eb.hoops.mute') === '1'; } catch (_) {}
  }
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(c.destination);
    const n = c.sampleRate * 2, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    // brown noise for the crowd bed
    const bb = c.createBuffer(1, n, c.sampleRate), bd = bb.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; bd[i] = last * 3.5; }
    const src = c.createBufferSource(); src.buffer = bb; src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    this.crowdGain = c.createGain(); this.crowdGain.gain.value = 0.0;
    src.connect(lp).connect(this.crowdGain).connect(this.master); src.start();
    this.crowdGain.gain.setTargetAtTime(0.12, c.currentTime, 1.5);
  }
  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem('eb.hoops.mute', m ? '1' : '0'); } catch (_) {}
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
  }
  ok() { return this.ctx && !this.muted && this.ctx.state === 'running'; }
  env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  noiseSrc(t, dur) { const s = this.ctx.createBufferSource(); s.buffer = this.noise; s.start(t, Math.random() * 1.5, dur + 0.05); return s; }
  osc(type, f, t, dur) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(t + dur + 0.05); return o; }

  play(name, k = 1) {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime, M = this.master;
    k = Math.max(0.05, Math.min(1.5, k));
    if (name === 'bounce') {
      const o = this.osc('sine', 150, t, 0.16); o.frequency.exponentialRampToValueAtTime(55, t + 0.12);
      const g = c.createGain(); this.env(g, t, 0.004, 0.55 * k, 0.14); o.connect(g).connect(M);
      const n = this.noiseSrc(t, 0.04), f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
      const g2 = c.createGain(); this.env(g2, t, 0.002, 0.25 * k, 0.03); n.connect(f).connect(g2).connect(M);
    } else if (name === 'swish') {
      const n = this.noiseSrc(t, 0.3), f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.8;
      f.frequency.setValueAtTime(4200, t); f.frequency.exponentialRampToValueAtTime(1300, t + 0.22);
      const g = c.createGain(); this.env(g, t, 0.01, 0.5 * k, 0.24); n.connect(f).connect(g).connect(M);
    } else if (name === 'rim') {
      for (const [f0, a] of [[612, 0.32], [1388, 0.22], [2291, 0.14], [3407, 0.08]]) {
        const o = this.osc('sine', f0 * (0.98 + Math.random() * 0.04), t, 0.6);
        const g = c.createGain(); this.env(g, t, 0.002, a * k, 0.5); o.connect(g).connect(M);
      }
      const n = this.noiseSrc(t, 0.05), g2 = c.createGain(); this.env(g2, t, 0.001, 0.3 * k, 0.04); n.connect(g2).connect(M);
    } else if (name === 'board') {
      const o = this.osc('sine', 95, t, 0.2); const g = c.createGain(); this.env(g, t, 0.003, 0.5 * k, 0.16); o.connect(g).connect(M);
      const n = this.noiseSrc(t, 0.25), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = 2;
      const g2 = c.createGain(); this.env(g2, t, 0.002, 0.3 * k, 0.22); n.connect(f).connect(g2).connect(M);
    } else if (name === 'squeak') {
      const o = this.osc('sine', 2500 + Math.random() * 500, t, 0.09); o.frequency.linearRampToValueAtTime(3500, t + 0.07);
      const g = c.createGain(); this.env(g, t, 0.005, 0.07 * k, 0.07); o.connect(g).connect(M);
    } else if (name === 'buzzer') {
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28, t + 0.02);
      g.gain.setValueAtTime(0.28, t + 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
      for (const [ty, f0] of [['sawtooth', 220], ['square', 331]]) this.osc(ty, f0, t, 0.95).connect(f);
      f.connect(g).connect(M);
    } else if (name === 'green') {
      [[1318.5, 0], [1975.5, 0.07], [2637, 0.14]].forEach(([f0, dt]) => {
        const o = this.osc('sine', f0, t + dt, 0.4); const g = c.createGain(); this.env(g, t + dt, 0.004, 0.2, 0.35); o.connect(g).connect(M);
      });
    } else if (name === 'click') {
      const o = this.osc('square', 880, t, 0.04); const g = c.createGain(); this.env(g, t, 0.002, 0.06, 0.03); o.connect(g).connect(M);
    } else if (name === 'level') {
      [523.25, 659.25, 783.99, 1046.5].forEach((f0, i) => {
        const o = this.osc('triangle', f0, t + i * 0.09, 0.35); const g = c.createGain(); this.env(g, t + i * 0.09, 0.005, 0.22, 0.3); o.connect(g).connect(M);
      });
    } else if (name === 'cheer' || name === 'roar') {
      const dur = name === 'roar' ? 3.2 : 2.0;
      const n = this.noiseSrc(t, dur), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1000; f.Q.value = 0.6;
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.32 * k, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      n.connect(f).connect(g).connect(M);
      const n2 = this.noiseSrc(t, dur), f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 2600; f2.Q.value = 1.2;
      const g2 = c.createGain(); g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.12 * k, t + 0.3); g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.8);
      n2.connect(f2).connect(g2).connect(M);
    } else if (name === 'ooh') {
      const o = this.osc('sawtooth', 170, t, 1.3); o.frequency.linearRampToValueAtTime(140, t + 1.2);
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.1 * k, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);
      const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 450; f1.Q.value = 4;
      const f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 900; f2.Q.value = 5;
      o.connect(f1).connect(g); o.connect(f2).connect(g); g.connect(M);
      const n = this.noiseSrc(t, 1.2), f3 = c.createBiquadFilter(); f3.type = 'bandpass'; f3.frequency.value = 600; f3.Q.value = 1;
      const g3 = c.createGain(); g3.gain.setValueAtTime(0.0001, t); g3.gain.exponentialRampToValueAtTime(0.1 * k, t + 0.2); g3.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      n.connect(f3).connect(g3).connect(M);
    }
  }
}
