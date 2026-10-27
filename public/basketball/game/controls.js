// EasyBuckets Hoops: input. A floating joystick on the left half of the screen (it appears under the thumb), big
// SHOOT and MOVE buttons on the right, all multi-touch through pointer events; WASD/arrows, Shift, Space/J and K on a
// keyboard. Push the stick to the rim of its ring to sprint.
export class Controls {
  constructor(pad) {
    this.pad = pad;
    this.s = { x: 0, y: 0, mag: 0, sprint: false, shoot: false, shootDown: false, shootUp: false, shootHeld: 0,
      move: false, moveDown: false, pause: false, any: false };
    this.enabled = true;
    pad.innerHTML = `
      <div class="hx-stick" hidden><div class="hx-knob"></div></div>
      <div class="hx-stick-hint">MOVE</div>
      <button type="button" class="hx-btn hx-move" aria-label="Move"><span>MOVE</span></button>
      <button type="button" class="hx-btn hx-shoot" aria-label="Shoot"><span>SHOOT</span></button>`;
    this.stick = pad.querySelector('.hx-stick'); this.knob = pad.querySelector('.hx-knob');
    this.hint = pad.querySelector('.hx-stick-hint');
    this.bShoot = pad.querySelector('.hx-shoot'); this.bMove = pad.querySelector('.hx-move');
    this.joy = null; this.keys = new Set();
    const R = () => pad.getBoundingClientRect();
    pad.addEventListener('pointerdown', (e) => {
      if (!this.enabled || e.target.closest('.hx-btn')) return;
      const r = R();
      if (e.clientX - r.left > r.width * 0.55 || this.joy) return;
      e.preventDefault();
      this.joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY };
      try { pad.setPointerCapture(e.pointerId); } catch (_) {}
      this.stick.hidden = false; this.hint.classList.add('gone');
      this.stick.style.transform = `translate(${e.clientX - r.left - 60}px, ${e.clientY - r.top - 60}px)`;
      this.knob.style.transform = 'translate(0px, 0px)';
      this.s.any = true;
    });
    pad.addEventListener('pointermove', (e) => {
      if (!this.joy || e.pointerId !== this.joy.id) return;
      const dx = e.clientX - this.joy.x0, dy = e.clientY - this.joy.y0, L = Math.hypot(dx, dy), max = 52;
      const k = L > max ? max / L : 1;
      this.knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      const m = Math.min(1, L / max);
      this.s.x = L > 4 ? dx / L * m : 0; this.s.y = L > 4 ? dy / L * m : 0; this.s.mag = L > 4 ? m : 0;
      this.s.sprint = L > max * 1.15;
      this.stick.classList.toggle('sprint', this.s.sprint);
    });
    const endJoy = (e) => {
      if (!this.joy || e.pointerId !== this.joy.id) return;
      this.joy = null; this.stick.hidden = true;
      this.s.x = this.s.y = this.s.mag = 0; this.s.sprint = false;
    };
    pad.addEventListener('pointerup', endJoy); pad.addEventListener('pointercancel', endJoy);
    const btn = (el, down, up) => {
      el.addEventListener('pointerdown', (e) => { if (!this.enabled) return; e.preventDefault(); e.stopPropagation(); try { el.setPointerCapture(e.pointerId); } catch (_) {} el.classList.add('on'); down(); this.s.any = true; });
      const off = (e) => { if (!el.classList.contains('on')) return; e.preventDefault(); el.classList.remove('on'); up(); };
      el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', off);
      el.addEventListener('contextmenu', (e) => e.preventDefault());
    };
    btn(this.bShoot, () => { this.s.shoot = true; this.s.shootDown = true; }, () => { this.s.shoot = false; this.s.shootUp = true; });
    btn(this.bMove, () => { this.s.move = true; this.s.moveDown = true; }, () => { this.s.move = false; });
    this.onKey = (e) => {
      if (!this.enabled || e.target.tagName === 'INPUT') return;
      const k = e.key.toLowerCase(), down = e.type === 'keydown';
      const map = { w: 1, a: 1, s: 1, d: 1, arrowup: 1, arrowdown: 1, arrowleft: 1, arrowright: 1, shift: 1 };
      if (map[k]) { if (down) this.keys.add(k); else this.keys.delete(k); this.keyStick(); e.preventDefault(); }
      if (k === ' ' || k === 'j') { e.preventDefault(); if (down && !this.s.shoot) { this.s.shoot = true; this.s.shootDown = true; } if (!down && this.s.shoot) { this.s.shoot = false; this.s.shootUp = true; } }
      if (k === 'k' || k === 'e') { if (down && !this.s.move) { this.s.move = true; this.s.moveDown = true; } if (!down) this.s.move = false; }
      if ((k === 'escape' || k === 'p') && down) this.s.pause = true;
      if (down) this.s.any = true;
    };
    window.addEventListener('keydown', this.onKey); window.addEventListener('keyup', this.onKey);
  }
  keyStick() {
    const K = this.keys;
    let x = (K.has('d') || K.has('arrowright') ? 1 : 0) - (K.has('a') || K.has('arrowleft') ? 1 : 0);
    let y = (K.has('s') || K.has('arrowdown') ? 1 : 0) - (K.has('w') || K.has('arrowup') ? 1 : 0);
    const L = Math.hypot(x, y);
    if (L > 0) { x /= L; y /= L; }
    this.s.x = x; this.s.y = y; this.s.mag = L > 0 ? 1 : 0; this.s.sprint = K.has('shift');
  }
  setMode(mode, opts = {}) {
    this.mode = mode;
    const sh = this.bShoot.querySelector('span'), mv = this.bMove.querySelector('span');
    if (mode === 'defense') { sh.textContent = 'BLOCK'; mv.textContent = 'STEAL'; }
    else { sh.textContent = opts.shootLabel || 'SHOOT'; mv.textContent = opts.moveLabel || 'MOVE'; }
    this.bShoot.classList.toggle('dim', !!opts.shootDim);
    this.bMove.hidden = !!opts.noMove;
    this.pad.hidden = mode === 'none';
  }
  // read-and-clear the one-shot edges
  take() {
    const s = this.s, out = { ...s };
    s.shootDown = s.shootUp = s.moveDown = s.pause = false;
    return out;
  }
  reset() {
    Object.assign(this.s, { x: 0, y: 0, mag: 0, sprint: false, shoot: false, shootDown: false, shootUp: false, move: false, moveDown: false, pause: false });
    this.keys.clear(); this.joy = null; this.stick.hidden = true;
    this.bShoot.classList.remove('on'); this.bMove.classList.remove('on');
  }
  dispose() { window.removeEventListener('keydown', this.onKey); window.removeEventListener('keyup', this.onKey); }
}
