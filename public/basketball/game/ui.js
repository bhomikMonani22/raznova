// EasyBuckets Hoops: menus and HUD (HTML over the WebGL canvas). Main menu, player and team select with ratings,
// 1v1 setup, challenges, locker (cosmetics), career stats, results with XP, pause; in play: scoreboard, shot meter,
// callouts, points pop-ups, replay chip.
import { COSMETICS, levelInfo } from './profile.js';
import { DIFFS } from './play.js';
import { fmt } from './modes.js';

const CSS = `
.hx{position:fixed;inset:0;z-index:45;background:#060b16;color:#eef2f8;font:15px/1.4 var(--body,"Archivo",system-ui,sans-serif);
  overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
.hx[hidden]{display:none}
.hx canvas.hx-gl{position:absolute;inset:0;width:100%;height:100%;display:block}
.hx .d{font-family:var(--display,"Big Shoulders Display",Impact,sans-serif);font-weight:900;text-transform:uppercase;letter-spacing:.02em}
.hx button{font:inherit;color:inherit;-webkit-tap-highlight-color:transparent}
.hx-load{position:absolute;inset:0;display:grid;place-items:center;background:#060b16;z-index:9}
.hx-load .d{font-size:34px;color:#ffc24b}
.hx-load .bar{width:160px;height:6px;border-radius:3px;background:#1b2e50;margin-top:12px;overflow:hidden}
.hx-load .bar i{display:block;height:100%;width:30%;background:#f47b20;animation:hxload 1s ease-in-out infinite alternate}
@keyframes hxload{from{transform:translateX(-30%)}to{transform:translateX(260%)}}
.hx-hud{position:absolute;left:0;right:0;top:0;padding:calc(env(safe-area-inset-top) + 8px) 12px 0;pointer-events:none;z-index:3}
.hx-hud[hidden]{display:none}
.hx-sb{display:grid;grid-template-columns:1fr auto 1fr;align-items:stretch;max-width:560px;margin:0 auto;border-radius:12px;overflow:hidden;
  background:radial-gradient(rgba(255,255,255,.05) 1px,transparent 1.3px) 0 0/5px 5px,rgba(8,17,31,.86);border:1px solid #22385f;backdrop-filter:blur(6px)}
.hx-sb>div{padding:5px 10px;min-width:0}
.hx-sb .n{font-size:12px;color:#94a5bf;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hx-sb .v{font-size:28px;line-height:1;color:#ffc24b;text-shadow:0 0 12px rgba(255,194,75,.4);font-variant-numeric:tabular-nums}
.hx-sb .r{text-align:right}
.hx-sb .c{text-align:center;border-left:1px solid #1a2c4b;border-right:1px solid #1a2c4b;min-width:74px}
.hx-sb .c .v{color:#36d399;text-shadow:0 0 12px rgba(54,211,153,.45)}
.hx-sb .c.warn .v{color:#ff5b61;text-shadow:0 0 12px rgba(255,91,97,.5)}
.hx-sub{text-align:center;font-size:11px;color:#94a5bf;margin-top:4px;letter-spacing:.06em}
.hx-ib{position:absolute;top:calc(env(safe-area-inset-top) + 8px);width:44px;height:44px;border-radius:50%;border:1px solid #27406a;
  background:rgba(12,24,48,.8);display:grid;place-items:center;pointer-events:auto;cursor:pointer;z-index:4}
.hx-ib svg{width:20px;height:20px}
.hx-ib.l{left:10px}.hx-ib.r{right:10px}.hx-ib[hidden]{display:none}
@media (max-width:520px){.hx-sb{margin:0 52px}}
.hx-meter{position:absolute;width:14px;height:96px;border-radius:7px;background:rgba(6,11,22,.75);border:1px solid rgba(255,255,255,.35);
  overflow:hidden;pointer-events:none;z-index:2;transform:translate(-50%,-50%)}
.hx-meter[hidden]{display:none}
.hx-meter .f{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(#fff,#ffc24b)}
.hx-meter .gz{position:absolute;left:0;right:0;background:rgba(54,211,153,.95);box-shadow:0 0 10px #36d399}
.hx-meter.done.green{border-color:#36d399;box-shadow:0 0 18px #36d399}
.hx-meter.done.green .f{background:#36d399}
.hx-call{position:absolute;left:0;right:0;top:34%;text-align:center;pointer-events:none;z-index:3;font-size:48px;line-height:1;opacity:0}
.hx-call.show{animation:hxpop 1.3s cubic-bezier(.2,.8,.2,1) both}
.hx-call.big{font-size:64px;color:#ffc24b}.hx-call.good{color:#36d399;text-shadow:0 0 26px rgba(54,211,153,.7)}
.hx-call.warn{color:#ff5b61}.hx-call.fire{color:#ff7a1a;text-shadow:0 0 26px rgba(255,90,20,.8)}
.hx-call small{display:block;font-size:16px;letter-spacing:.12em;color:#eef2f8;margin-top:6px;opacity:.9}
@keyframes hxpop{0%{opacity:0;transform:scale(.6)}15%{opacity:1;transform:scale(1.08)}28%{transform:scale(1)}75%{opacity:1}100%{opacity:0;transform:translateY(-16px)}}
.hx-pop{position:absolute;z-index:3;pointer-events:none;font-size:34px;color:#ffc24b;transform:translate(-50%,-50%);animation:hxrise 1.1s ease-out both;text-shadow:0 2px 0 rgba(0,0,0,.4)}
.hx-pop.fire{color:#ff7a1a}.hx-pop.money{color:#36d399}.hx-pop.opp{color:#ff5b61}
@keyframes hxrise{0%{opacity:0;margin-top:10px}20%{opacity:1}100%{opacity:0;margin-top:-60px}}
.hx-toast{position:absolute;left:50%;top:calc(env(safe-area-inset-top) + 92px);transform:translateX(-50%);z-index:4;background:rgba(12,24,48,.92);
  border:1px solid #27406a;border-radius:999px;padding:7px 14px;font-size:13px;pointer-events:none;opacity:0;transition:opacity .25s;white-space:nowrap}
.hx-toast.show{opacity:1}
.hx-chip{position:absolute;right:12px;top:calc(env(safe-area-inset-top) + 92px);z-index:4;border:0;border-radius:999px;padding:9px 14px;background:#ffc24b;color:#1a0b02;
  font-size:15px;cursor:pointer;pointer-events:auto}
.hx-chip[hidden]{display:none}
.hx-replay{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom) + 18px);text-align:center;z-index:4;pointer-events:none;font-size:22px;color:#ffc24b;letter-spacing:.2em}
.hx-replay[hidden]{display:none}
.hx-pad{position:absolute;inset:0;z-index:2;touch-action:none}
.hx-pad[hidden]{display:none}
.hx-stick{position:absolute;left:0;top:0;width:120px;height:120px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:rgba(12,24,48,.35);pointer-events:none}
.hx-stick[hidden]{display:none}
.hx-stick.sprint{border-color:#ffc24b}
.hx-knob{position:absolute;left:36px;top:36px;width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.85);box-shadow:0 2px 10px rgba(0,0,0,.4)}
.hx-stick-hint{position:absolute;left:calc(env(safe-area-inset-left) + 28px);bottom:calc(env(safe-area-inset-bottom) + 46px);width:92px;height:92px;border-radius:50%;
  border:2px dashed rgba(255,255,255,.28);display:grid;place-items:center;font:800 14px var(--display,Impact);letter-spacing:.1em;color:rgba(255,255,255,.55);pointer-events:none;transition:opacity .4s}
.hx-stick-hint.gone{opacity:0}
.hx-btn{position:absolute;border-radius:50%;border:2px solid rgba(255,255,255,.4);display:grid;place-items:center;cursor:pointer;touch-action:none;
  font:900 15px var(--display,Impact);letter-spacing:.06em;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.hx-btn[hidden]{display:none}
.hx-btn.on{transform:scale(.93);filter:brightness(1.2)}
.hx-shoot{right:calc(env(safe-area-inset-right) + 18px);bottom:calc(env(safe-area-inset-bottom) + 30px);width:92px;height:92px;background:rgba(244,123,32,.88);color:#1a0b02;font-size:18px}
.hx-move{right:calc(env(safe-area-inset-right) + 122px);bottom:calc(env(safe-area-inset-bottom) + 40px);width:68px;height:68px;background:rgba(27,46,80,.85);color:#eef2f8}
.hx-btn.dim{background:rgba(80,80,80,.6);color:#ddd}
@media (orientation:landscape) and (max-height:520px){
  .hx-shoot{bottom:calc(env(safe-area-inset-bottom) + 22px);width:84px;height:84px}
  .hx-move{right:calc(env(safe-area-inset-right) + 112px);bottom:calc(env(safe-area-inset-bottom) + 26px)}
  .hx-call{top:28%;font-size:40px}.hx-call.big{font-size:52px}
}
.hx-screen{position:absolute;inset:0;z-index:5;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;
  padding:calc(env(safe-area-inset-top) + 12px) 16px calc(env(safe-area-inset-bottom) + 20px)}
.hx-screen[hidden]{display:none}
.hx-screen.in{animation:hxin .28s cubic-bezier(.2,.8,.2,1) both}
@keyframes hxin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.hx-screen.in{animation:none}}
.hx-screen.solid{background:rgba(6,11,22,.94)}
.hx-screen.fade{background:linear-gradient(180deg,rgba(6,11,22,.86) 0%,rgba(6,11,22,0) 30%,rgba(6,11,22,0) 46%,rgba(6,11,22,.94) 70%)}
.hx-wrap{max-width:640px;margin:0 auto}
.hx-top{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.hx-top .t{flex:1;font-size:30px}
.hx-x{width:44px;height:44px;border-radius:50%;border:1px solid #27406a;background:rgba(12,24,48,.85);font-size:22px;cursor:pointer;flex:none}
.hx-title{font-size:min(56px,14vw);line-height:.86;margin:4px 0 0}.hx-title span{display:block;color:#f47b20}
.hx-lvl{display:flex;align-items:center;gap:10px;margin:12px 0 0;font-size:13px;color:#94a5bf}
.hx-lvl .b{flex:1;height:8px;border-radius:4px;background:#1b2e50;overflow:hidden}.hx-lvl .b i{display:block;height:100%;background:linear-gradient(90deg,#f47b20,#ffc24b)}
.hx-lvl .lv{font:900 22px var(--display,Impact);color:#ffc24b}
.hx-menu{position:absolute;left:0;right:0;bottom:0;padding:0 16px calc(env(safe-area-inset-bottom) + 18px)}
.hx-me{display:flex;align-items:center;gap:12px;padding:10px;border-radius:14px;background:rgba(19,35,63,.9);border:1px solid #27406a;margin-bottom:10px;cursor:pointer;text-align:left;width:100%}
.hx-face{width:48px;height:48px;border-radius:50%;background:#1b2e50;overflow:hidden;flex:none;display:grid;place-items:center;font:900 18px var(--display,Impact)}
.hx-face img{width:140%;margin-top:14%;display:block}
.hx-me .nm{font-size:22px;line-height:1}.hx-me .sm{font-size:12px;color:#94a5bf}
.hx-ovr{margin-left:auto;font:900 26px var(--display,Impact);min-width:52px;height:44px;border-radius:10px;display:grid;place-items:center;
  background:linear-gradient(160deg,#3a4a66,#1b2e50);color:#fff}
.hx-ovr.t1{background:linear-gradient(160deg,#ffe08a,#c99a2e);color:#2a1a00}.hx-ovr.t2{background:linear-gradient(160deg,#cfe3ff,#6f8fb8);color:#0b1a30}
.hx-ovr.t3{background:linear-gradient(160deg,#e3a26b,#8a5526);color:#1a0b02}
.hx-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.hx-big{min-height:64px;border-radius:14px;border:1px solid #27406a;background:rgba(19,35,63,.92);font-size:22px;cursor:pointer;padding:10px 12px;text-align:left;display:flex;flex-direction:column;justify-content:center}
.hx-big small{font:500 12px var(--body,Archivo);color:#94a5bf;text-transform:none;letter-spacing:0;margin-top:2px}
.hx-big.hot{background:linear-gradient(160deg,#f47b20,#c4520d);border-color:#ff9a4a;color:#1a0b02}.hx-big.hot small{color:#3a1a05}
.hx-big:active{transform:scale(.98)}
@media (orientation:landscape) and (max-height:560px){.hx-menu{top:0;right:auto;width:min(440px,56vw);overflow-y:auto;padding-top:calc(env(safe-area-inset-top) + 62px)}.hx-screen.fade{background:linear-gradient(90deg,rgba(6,11,22,.94) 0%,rgba(6,11,22,.8) 50%,rgba(6,11,22,0) 72%)}.hx-screen.fade>.hx-wrap:first-child{position:absolute;right:16px;top:calc(env(safe-area-inset-top) + 58px);width:38vw;text-align:right}.hx-screen.fade>.hx-wrap:first-child .hx-top{position:fixed;left:16px;top:calc(env(safe-area-inset-top) + 10px)}.hx-title{font-size:38px}.hx-lvl{justify-content:flex-end}.hx-big{min-height:54px;font-size:19px}}
.hx-tabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:10px;scrollbar-width:none}
.hx-tab{flex:none;padding:8px 13px;border-radius:999px;border:1px solid #27406a;background:rgba(19,35,63,.9);font:900 16px var(--display,Impact);cursor:pointer}
.hx-tab.on{border-color:transparent;color:#fff}
.hx-list{display:grid;grid-template-columns:1fr 1fr;gap:8px}
@media (min-width:600px){.hx-list{grid-template-columns:1fr 1fr 1fr}}
.hx-card{position:relative;border-radius:12px;border:1px solid #27406a;background:rgba(19,35,63,.92);padding:8px;cursor:pointer;text-align:left;min-height:96px;overflow:hidden}
.hx-card.on{border-color:#ffc24b;box-shadow:0 0 0 2px rgba(255,194,75,.35)}
.hx-card .num{position:absolute;right:8px;top:4px;font:900 30px var(--display,Impact);opacity:.25}
.hx-card .nm{font:900 17px/1 var(--display,Impact);text-transform:uppercase;margin:6px 0 2px}
.hx-card .sm{font-size:11px;color:#94a5bf}
.hx-card .ovr{font:900 22px var(--display,Impact);color:#ffc24b}
.hx-card .tag{display:inline-block;font-size:10px;padding:1px 5px;border-radius:4px;background:rgba(255,91,97,.2);color:#ff9a9e;margin-left:4px}
.hx-attrs{display:grid;grid-template-columns:1fr 1fr;gap:4px 14px;margin:10px 0}
.hx-attr{display:grid;grid-template-columns:64px 1fr 28px;align-items:center;gap:8px;font-size:12px;color:#94a5bf}
.hx-attr .b{height:6px;border-radius:3px;background:#1b2e50;overflow:hidden}.hx-attr .b i{display:block;height:100%}
.hx-attr b{color:#eef2f8;text-align:right;font-variant-numeric:tabular-nums}
.hx-detail{position:sticky;bottom:-20px;margin:12px -16px -20px;padding:12px 16px calc(env(safe-area-inset-bottom) + 16px);background:rgba(8,15,28,.98);border-top:1px solid #27406a}
.hx-cta{display:block;width:100%;min-height:54px;border:0;border-radius:14px;background:#f47b20;color:#1a0b02;font:900 22px var(--display,Impact);text-transform:uppercase;cursor:pointer;margin-top:8px}
.hx-cta.alt{background:rgba(19,35,63,.95);color:#eef2f8;border:1px solid #27406a}
.hx-row{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
.hx-opt{padding:9px 12px;border-radius:10px;border:1px solid #27406a;background:rgba(19,35,63,.9);cursor:pointer;font-size:14px}
.hx-opt.on{border-color:#ffc24b;color:#ffc24b}.hx-opt.lock{opacity:.45}
.hx-sec{font:900 18px var(--display,Impact);text-transform:uppercase;margin:18px 0 6px;color:#94a5bf;letter-spacing:.04em}
.hx-ch{display:block;width:100%;text-align:left;border-radius:14px;border:1px solid #27406a;background:rgba(19,35,63,.92);padding:12px;margin-bottom:8px;cursor:pointer}
.hx-ch .t{font:900 20px var(--display,Impact);text-transform:uppercase}.hx-ch .s{font-size:13px;color:#94a5bf;margin-top:2px}
.hx-ch .st{float:right;color:#ffc24b;font-size:18px;letter-spacing:2px}.hx-ch.lock{opacity:.5}
.hx-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.hx-stat{border-radius:12px;background:rgba(19,35,63,.92);border:1px solid #27406a;padding:8px;text-align:center}
.hx-stat .v{font:900 26px var(--display,Impact);color:#ffc24b}.hx-stat .l{font-size:11px;color:#94a5bf}
.hx-res .big{font-size:72px;line-height:.9;text-align:center;margin-top:8vh}
.hx-res .big.win{color:#36d399;text-shadow:0 0 30px rgba(54,211,153,.5)}.hx-res .big.loss{color:#ff5b61}
.hx-res .sc{text-align:center;font:900 44px var(--display,Impact);margin:6px 0 14px}
.hx-res .stars{text-align:center;font-size:40px;letter-spacing:6px;color:#ffc24b}.hx-res .stars .off{color:#2a3a58}
.hx-tbl{width:100%;border-collapse:collapse;font-size:14px;margin:10px 0}.hx-tbl td,.hx-tbl th{padding:6px 4px;border-bottom:1px solid #1a2c4b;text-align:center}
.hx-tbl th{color:#94a5bf;font-weight:600;font-size:12px}.hx-tbl td:first-child,.hx-tbl th:first-child{text-align:left}
.hx-unl{margin:10px 0;padding:10px 12px;border-radius:12px;background:rgba(255,194,75,.12);border:1px solid rgba(255,194,75,.4);color:#ffc24b;font-size:14px}
.hx-help{font-size:13px;color:#94a5bf;margin:8px 0 0}
`;

const ICON = {
  pause: '<svg viewBox="0 0 24 24"><path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4zM16 8c2 2 2 6 0 8M18.5 5.5c3.5 3.5 3.5 9.5 0 13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  mute: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="2"/></svg>',
};
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function tier(o) { return o >= 90 ? 't1' : o >= 80 ? 't2' : o >= 70 ? 't3' : ''; }
const ATTR = [['three', '3PT'], ['mid', 'MID'], ['close', 'CLOSE'], ['layup', 'LAYUP'], ['dunk', 'DUNK'], ['ft', 'FT'], ['handle', 'HANDLE'],
  ['speed', 'SPEED'], ['steal', 'STEAL'], ['block', 'BLOCK'], ['rebound', 'REB'], ['defense', 'DEF']];
const barCol = (v) => v >= 85 ? '#36d399' : v >= 70 ? '#ffc24b' : v >= 55 ? '#f47b20' : '#ff5b61';

export class UI {
  constructor(root, g) {
    this.root = root; this.g = g;
    if (!document.getElementById('hx-css')) { const s = document.createElement('style'); s.id = 'hx-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.classList.add('hx');
    root.innerHTML = `
      <canvas class="hx-gl"></canvas>
      <div class="hx-hud" hidden><div class="hx-sb"><div class="l"><div class="n"></div><div class="v d"></div></div>
        <div class="c"><div class="n">TIME</div><div class="v d"></div></div><div class="r"><div class="n"></div><div class="v d"></div></div></div>
        <div class="hx-sub"></div></div>
      <button class="hx-ib l hx-pause" type="button" aria-label="Pause" hidden>${ICON.pause}</button>
      <button class="hx-ib r hx-mute" type="button" aria-label="Sound"></button>
      <div class="hx-meter" hidden><div class="gz"></div><div class="f"></div></div>
      <div class="hx-call d"></div><div class="hx-toast"></div>
      <button class="hx-chip d" type="button" hidden>▶ Replay</button>
      <div class="hx-replay d" hidden>Replay · tap to skip</div>
      <div class="hx-pad" hidden></div>
      <div class="hx-screen" hidden></div>
      <div class="hx-load"><div><div class="d">EasyBuckets Hoops</div><div class="bar"><i></i></div></div></div>`;
    const q = (s) => root.querySelector(s);
    this.canvas = q('.hx-gl'); this.hud = q('.hx-hud'); this.meter = q('.hx-meter'); this.call = q('.hx-call'); this.toastEl = q('.hx-toast');
    this.chip = q('.hx-chip'); this.replayEl = q('.hx-replay'); this.pad = q('.hx-pad'); this.screen = q('.hx-screen'); this.load = q('.hx-load');
    this.pauseBtn = q('.hx-pause'); this.muteBtn = q('.hx-mute');
    this.sb = { ln: q('.hx-sb .l .n'), lv: q('.hx-sb .l .v'), c: q('.hx-sb .c'), cv: q('.hx-sb .c .v'), cn: q('.hx-sb .c .n'), rn: q('.hx-sb .r .n'), rv: q('.hx-sb .r .v'), sub: q('.hx-sub') };
    this.pauseBtn.addEventListener('click', () => g.pause(true));
    this.muteBtn.addEventListener('click', () => { g.sound.setMuted(!g.sound.muted); this.setMute(); });
    this.chip.addEventListener('click', () => g.playReplay());
    this.screen.addEventListener('click', (e) => this.onClick(e));
    this.setMute();
    this.last = {};
  }
  setMute() { this.muteBtn.innerHTML = this.g.sound.muted ? ICON.mute : ICON.sound; }
  loaded() { this.load.remove(); }

  // ---- in play ----
  playing(on) { this.hud.hidden = !on; this.pad.hidden = !on; this.pauseBtn.hidden = !on; if (on) this.screen.hidden = true; if (!on) this.meter.hidden = true; }
  setHud(h) {
    const L = this.last;
    const set = (el, k, v) => { if (L[k] !== v) { L[k] = v; el.textContent = v; } };
    set(this.sb.ln, 'ln', h.left || ''); set(this.sb.lv, 'lv', String(h.lval ?? ''));
    set(this.sb.cv, 'cv', h.center || ''); set(this.sb.rn, 'rn', h.right || ''); set(this.sb.rv, 'rv', String(h.rval ?? ''));
    set(this.sb.cn, 'cn', h.cname || (this.g.mode && this.g.mode.kind === '1v1' ? 'SHOT' : 'TIME'));
    set(this.sb.sub, 'sub', h.sub || '');
    if (L.warn !== !!h.warn) { L.warn = !!h.warn; this.sb.c.classList.toggle('warn', !!h.warn); }
  }
  showMeter(x, y, fill, gz0, gz1, done, green) {
    const m = this.meter;
    m.hidden = false;
    m.style.left = x + 'px'; m.style.top = y + 'px';
    m.querySelector('.f').style.height = (Math.min(1, fill) * 100) + '%';
    const gz = m.querySelector('.gz'); gz.style.bottom = (gz0 * 100) + '%'; gz.style.height = Math.max(2, (gz1 - gz0) * 100) + '%';
    m.classList.toggle('done', !!done); m.classList.toggle('green', !!green);
  }
  hideMeter() { this.meter.hidden = true; }
  callout(text, cls, sub) {
    const c = this.call;
    c.className = 'hx-call d'; void c.offsetWidth;
    c.innerHTML = esc(text) + (sub ? `<small>${esc(sub)}</small>` : '');
    c.className = 'hx-call d show ' + (cls || '');
  }
  toast(t) {
    const e = this.toastEl; e.textContent = t; e.classList.add('show');
    clearTimeout(this._tt); this._tt = setTimeout(() => e.classList.remove('show'), 1800);
  }
  pop(text, x, y, cls) {
    const e = document.createElement('div'); e.className = 'hx-pop d ' + (cls || ''); e.textContent = text;
    e.style.left = x + 'px'; e.style.top = y + 'px';
    this.root.appendChild(e); setTimeout(() => e.remove(), 1200);
  }
  replayChip(on) { this.chip.hidden = !on; }
  replaying(on) { this.replayEl.hidden = !on; }

  // ---- screens ----
  show(name, data) {
    this.screenName = name; this.data = data || {};
    const s = this.screen;
    const changed = this.screenName !== this._shown; this._shown = name;
    s.hidden = false; s.className = 'hx-screen ' + (name === 'menu' ? 'fade' : name === 'players' ? 'fade' : 'solid') + (changed ? ' in' : '');
    s.innerHTML = this['s_' + name](this.data);
    s.scrollTop = 0;
  }
  hide() { this.screen.hidden = true; this.screenName = null; this._shown = null; }
  face(p, cls = '') {
    const ini = p.name.split(' ').map((w) => w[0]).join('').slice(0, 2);
    return `<div class="hx-face ${cls}">${p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}${p.img ? '' : esc(ini)}</div>`;
  }
  s_menu() {
    const g = this.g, P = g.profile, me = g.me(), team = g.teamOf(me.team);
    const li = levelInfo(P.d.xp);
    return `<div class="hx-wrap">
      <div class="hx-top"><button class="hx-x" data-a="exit" aria-label="Close">×</button><div style="flex:1"></div></div>
      <h1 class="hx-title d">EasyBuckets<span>Hoops</span></h1>
      <div class="hx-lvl"><span class="lv">LV ${li.level}</span><span class="b"><i style="width:${(li.into / li.need * 100).toFixed(1)}%"></i></span><span>${li.into}/${li.need} XP</span></div>
    </div>
    <div class="hx-menu"><div class="hx-wrap">
      <button class="hx-me" data-a="players">${this.face(me)}<div><div class="nm d">${esc(me.name)}</div><div class="sm">${esc(team.short)} · #${esc(me.num || '–')} · ${esc(me.pos)} · tap to change</div></div><div class="hx-ovr ${tier(me.ovr)}">${me.ovr}</div></button>
      <div class="hx-grid">
        <button class="hx-big hot d" data-a="shootaround">Shootaround<small>60 seconds, streaks multiply</small></button>
        <button class="hx-big d" data-a="1v1">1v1<small>To 11 against the CPU</small></button>
        <button class="hx-big d" data-a="challenges">Challenges<small>${g.challengeStars()} stars earned</small></button>
        <button class="hx-big d" data-a="players">Players<small>6 teams, ${g.roster.players.length} players</small></button>
        <button class="hx-big d" data-a="locker">Locker<small>Balls, shoes, gear</small></button>
        <button class="hx-big d" data-a="career">Career<small>Stats and bests</small></button>
      </div>
      <div class="hx-row" style="margin:8px 0 0"><button class="hx-cta alt" data-a="practice" style="min-height:44px;font-size:17px;flex:1;margin:0">Free practice</button>
      <button class="hx-cta alt" data-a="howto" style="min-height:44px;font-size:17px;flex:1;margin:0">How to play</button></div>
    </div></div>`;
  }
  s_players(d) {
    const g = this.g, teams = g.roster.teams, cur = d.team || g.me().team;
    const sel = d.sel ? g.player(d.sel) : (d.pick === 'opp' ? g.opp() : g.me());
    const list = g.roster.players.filter((p) => p.team === cur);
    const team = g.teamOf(cur);
    return `<div class="hx-wrap">
      <div class="hx-top"><button class="hx-x" data-a="${d.back || 'menu'}" aria-label="Back">‹</button><div class="t d">${d.pick === 'opp' ? 'Pick opponent' : 'Pick your player'}</div></div>
      <div class="hx-tabs">${teams.map((t) => `<button class="hx-tab ${t.abbr === cur ? 'on' : ''}" data-a="team" data-v="${t.abbr}" style="${t.abbr === cur ? `background:${t.color}` : ''}">${esc(t.short)}</button>`).join('')}</div>
      <div class="hx-list">${list.map((p) => `<button class="hx-card ${sel && p.id === sel.id ? 'on' : ''}" data-a="pick" data-v="${p.id}" style="border-left:4px solid ${team.color}">
        <div class="num">${esc(p.num || '')}</div><span class="ovr">${p.ovr}</span><span class="sm"> ${esc(p.pos)}</span>${p.status === 'Out' ? '<span class="tag">OUT</span>' : ''}
        <div class="nm">${esc(p.name)}</div><div class="sm">3PT ${p.r.three} · DNK ${p.r.dunk} · SPD ${p.r.speed}</div></button>`).join('')}</div>
      ${sel ? this.detail(sel, d) : ''}
    </div>`;
  }
  detail(p, d) {
    const team = this.g.teamOf(p.team);
    const style = this.g.styleLine(p);
    return `<div class="hx-detail">
      <div style="display:flex;align-items:center;gap:12px">${this.face(p)}<div style="flex:1;min-width:0"><div class="d" style="font-size:24px;line-height:1">${esc(p.name)}</div>
      <div class="hx-help" style="margin:2px 0 0">${esc(team.name)} · #${esc(p.num || '–')} · ${esc(p.pos)}${p.status ? ' · injury report: ' + esc(p.status) : ''}</div></div><div class="hx-ovr ${tier(p.ovr)}">${p.ovr}</div></div>
      <div class="hx-attrs">${ATTR.map(([k, l]) => `<div class="hx-attr">${l}<span class="b"><i style="width:${p.r[k]}%;background:${barCol(p.r[k])}"></i></span><b>${p.r[k]}</b></div>`).join('')}</div>
      <div class="hx-help">${esc(style)}</div>
      <button class="hx-cta" data-a="${d.pick === 'opp' ? 'confirmOpp' : 'confirm'}" data-v="${p.id}">${d.pick === 'opp' ? 'Face ' + esc(p.name.split(' ').slice(-1)[0]) : 'Play as ' + esc(p.name.split(' ').slice(-1)[0])}</button>
    </div>`;
  }
  s_setup() {
    const g = this.g, me = g.me(), opp = g.opp(), P = g.profile.d;
    return `<div class="hx-wrap">
      <div class="hx-top"><button class="hx-x" data-a="menu" aria-label="Back">‹</button><div class="t d">1v1</div></div>
      <button class="hx-me" data-a="players">${this.face(me)}<div><div class="sm">YOU</div><div class="nm d">${esc(me.name)}</div></div><div class="hx-ovr ${tier(me.ovr)}">${me.ovr}</div></button>
      <button class="hx-me" data-a="pickOpp">${this.face(opp)}<div><div class="sm">CPU · tap to change</div><div class="nm d">${esc(opp.name)}</div></div><div class="hx-ovr ${tier(opp.ovr)}">${opp.ovr}</div></button>
      <div class="hx-sec">Difficulty</div>
      <div class="hx-row">${DIFFS.map((d, i) => `<button class="hx-opt ${P.diff === i ? 'on' : ''}" data-a="diff" data-v="${i}">${d.name}</button>`).join('')}</div>
      <div class="hx-sec">Game to</div>
      <div class="hx-row">${[7, 11, 15, 21].map((n) => `<button class="hx-opt ${(P.to || 11) === n ? 'on' : ''}" data-a="to" data-v="${n}">${n}</button>`).join('')}</div>
      <p class="hx-help">2s and 3s. Check ball at the top after every basket. After a stop, take it back past the arc. 12-second shot clock.</p>
      <button class="hx-cta" data-a="start1v1">Tip off</button>
    </div>`;
  }
  s_challenges() {
    const g = this.g, P = g.profile;
    let open = true;
    return `<div class="hx-wrap"><div class="hx-top"><button class="hx-x" data-a="menu" aria-label="Back">‹</button><div class="t d">Challenges</div></div>
      ${g.challenges.map((c, i) => {
        const st = P.stars(c.id), lock = !open;
        if (i >= 2 && st === 0) open = false;
        const pl = c.player ? g.player(c.player) : c.vs ? g.player(c.vs) : null;
        return `<button class="hx-ch ${lock ? 'lock' : ''}" data-a="${lock ? 'locked' : 'challenge'}" data-v="${c.id}"><span class="st">${'★'.repeat(st)}<span style="color:#2a3a58">${'★'.repeat(3 - st)}</span></span>
          <div class="t">${esc(c.title)}</div><div class="s">${esc(c.desc)}</div>
          <div class="s" style="color:#ffc24b">${c.lower ? `★ under ${c.stars[0]}s · ★★ under ${c.stars[1]}s · ★★★ under ${c.stars[2]}s` : c.margin ? 'Win: ★ · by 4+: ★★ · by 7+: ★★★' : c.lockdown ? 'Win allowing 4 or fewer' : `★ ${c.stars[0]} · ★★ ${c.stars[1]} · ★★★ ${c.stars[2]}`} · ${c.xp} XP${c.reward ? ' · unlocks ' + esc(this.g.cosName(c.reward)) : ''}${pl && c.player ? ' · plays as ' + esc(pl.name) : ''}${lock ? ' · finish an earlier challenge to unlock' : ''}</div></button>`;
      }).join('')}</div>`;
  }
  s_locker() {
    const g = this.g, P = g.profile, E = P.d.equip;
    const sec = (kind, title) => `<div class="hx-sec">${title}</div><div class="hx-row">${COSMETICS[kind].map((c) => {
      const has = P.has(kind, c.id), on = kind === 'acc' ? !!E.acc[c.id] : E[kind] === c.id;
      return `<button class="hx-opt ${on ? 'on' : ''} ${has ? '' : 'lock'}" data-a="${has ? 'equip' : 'lockedItem'}" data-k="${kind}" data-v="${c.id}">${esc(c.name)}${has ? '' : c.lvl ? ' · LV ' + c.lvl : ' · challenge'}</button>`;
    }).join('')}</div>`;
    return `<div class="hx-wrap"><div class="hx-top"><button class="hx-x" data-a="menu" aria-label="Back">‹</button><div class="t d">Locker</div></div>
      <p class="hx-help">Gear shows on your player in every mode. Level up and finish challenges to unlock more.</p>
      ${sec('ball', 'Ball')}${sec('shoe', 'Shoes')}${sec('acc', 'Gear')}${sec('fx', 'Green release')}${sec('court', 'Court')}</div>`;
  }
  s_career() {
    const g = this.g, P = g.profile.d, S = P.stats, B = P.bests;
    const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '–';
    const st = (v, l) => `<div class="hx-stat"><div class="v">${v}</div><div class="l">${l}</div></div>`;
    const per = Object.entries(P.per).sort((a, b) => b[1].games - a[1].games).slice(0, 8);
    return `<div class="hx-wrap"><div class="hx-top"><button class="hx-x" data-a="menu" aria-label="Back">‹</button><div class="t d">Career</div></div>
      <div class="hx-stats">${st('LV ' + levelInfo(P.xp).level, P.xp + ' XP')}${st(S.wins + '-' + S.losses, '1v1 record')}${st(S.pts, 'points')}
      ${st(pct(S.fgm, S.fga), 'FG ' + S.fgm + '/' + S.fga)}${st(pct(S.tpm, S.tpa), '3PT ' + S.tpm + '/' + S.tpa)}${st(S.greens, 'greens')}
      ${st(S.dunks, 'dunks')}${st(S.blocks, 'blocks')}${st(S.steals, 'steals')}${st(S.rebs, 'rebounds')}${st(S.streak, 'best streak')}${st(S.sessions, 'sessions')}</div>
      <div class="hx-sec">Personal bests</div>
      <div class="hx-stats">${st(B.shootaround, 'shootaround')}${st(B.threes, 'splash zone')}${st(B.ft + '/10', 'free throws')}${st(B.atw ? fmt(B.atw) : '–', 'around the world')}${st(B.contest, '3pt contest')}${st(g.challengeStars(), 'challenge stars')}</div>
      ${per.length ? `<div class="hx-sec">By player</div><table class="hx-tbl"><tr><th>Player</th><th>G</th><th>W</th><th>PTS</th><th>FG</th></tr>
      ${per.map(([id, s]) => { const p = g.player(+id); return p ? `<tr><td>${esc(p.name)}</td><td>${s.games}</td><td>${s.wins}</td><td>${s.pts}</td><td>${pct(s.fgm, s.fga)}</td></tr>` : ''; }).join('')}</table>` : ''}
      <p class="hx-help">Saved on this device.</p></div>`;
  }
  s_howto(d) {
    const row = (t, b) => `<div class="hx-ch" style="cursor:default"><div class="t">${t}</div><div class="s" style="color:#eef2f8">${b}</div></div>`;
    return `<div class="hx-wrap"><div class="hx-top"><button class="hx-x" data-a="${d.then ? 'gotit' : 'menu'}" aria-label="Close">×</button><div class="t d">How to play</div></div>
      ${row('Move', 'Left thumb anywhere on the left half. Push to the edge of the ring to sprint.')}
      ${row('Shoot', 'Hold SHOOT, let go when the meter fills to the green band. Green is an EXCELLENT release and almost always drops. Better shooters get a wider green.')}
      ${row('Attack the rim', 'Drive at the basket and press SHOOT: a layup, or a dunk if he can dunk. Slashers euro-step, bigs go to a hook close in.')}
      ${row('Dribble moves', 'MOVE with the stick sideways: crossover. Stick away from the rim: step-back. No stick: hesitation. Flying downhill: spin.')}
      ${row('Defence', 'BLOCK jumps with both hands up, STEAL reaches for the ball. Stay between him and the rim; a lunge that misses leaves you off balance.')}
      ${row('1v1 rules', 'First to 11, 2s and 3s. Check ball at the top after a score. After a stop or a steal, take it back past the arc. 12-second shot clock.')}
      <button class="hx-cta" data-a="${d.then ? 'gotit' : 'menu'}">${d.then ? "Let's go" : 'Back'}</button></div>`;
  }
  s_pause() {
    return `<div class="hx-wrap" style="margin-top:18vh"><div class="d" style="font-size:52px;text-align:center">Paused</div>
      <button class="hx-cta" data-a="resume">Resume</button><button class="hx-cta alt" data-a="restart">Restart</button>
      <button class="hx-cta alt" data-a="quit">Quit to menu</button>
      <p class="hx-help" style="text-align:center">Keyboard: WASD or arrows move, Shift sprint, Space shoot (hold and release), K move or steal.</p></div>`;
  }
  s_results(r) {
    const stars = r.stars !== undefined ? `<div class="stars">${'★'.repeat(r.stars)}<span class="off">${'★'.repeat(3 - r.stars)}</span></div>` : '';
    const head = r.kind === '1v1' ? `<div class="big d ${r.win ? 'win' : 'loss'}">${r.win ? 'Win' : 'Loss'}</div><div class="sc">${r.s[0]} – ${r.s[1]}</div>`
      : `<div class="big d">${esc(r.headline)}</div><div class="sc">${esc(r.valueText)}</div>`;
    const S = r.kind === '1v1' ? r.st : [r.st];
    const row = (n, s) => `<tr><td>${esc(n)}</td><td>${s.pts !== undefined && r.kind === '1v1' ? s.pts : '–'}</td><td>${s.fgm}/${s.fga}</td><td>${s.tpm}/${s.tpa}</td><td>${s.greens}</td><td>${s.rebs || 0}</td><td>${s.steals || 0}</td><td>${s.blocks || 0}</td></tr>`;
    return `<div class="hx-wrap hx-res">${head}${stars}
      ${r.best ? '<div class="hx-unl">New personal best</div>' : ''}
      <table class="hx-tbl"><tr><th></th><th>PTS</th><th>FG</th><th>3PT</th><th>GRN</th><th>REB</th><th>STL</th><th>BLK</th></tr>
      ${row(this.g.me().name, S[0])}${S[1] ? row(r.opp.name, S[1]) : ''}</table>
      <div class="hx-lvl"><span class="lv">+${r.xp} XP</span><span class="b"><i class="xpbar" style="width:${r.fromPct}%"></i></span><span>LV ${r.level}</span></div>
      ${r.levelUp ? `<div class="hx-unl">Level up! You are level ${r.level}.</div>` : ''}
      ${(r.unlocks || []).map((u) => `<div class="hx-unl">Unlocked: ${esc(u.name)} (${esc(u.kind)})</div>`).join('')}
      <button class="hx-cta" data-a="rematch">${r.kind === '1v1' ? 'Rematch' : 'Run it back'}</button>
      ${r.replay ? '<button class="hx-cta alt" data-a="replay">Watch the last highlight</button>' : ''}
      <button class="hx-cta alt" data-a="menu">Menu</button></div>`;
  }
  animateXp(toPct) { const b = this.screen.querySelector('.xpbar'); if (b) requestAnimationFrame(() => { b.style.transition = 'width 1.2s cubic-bezier(.2,.8,.2,1)'; b.style.width = toPct + '%'; }); }

  onClick(e) {
    const t = e.target.closest('[data-a]');
    if (!t) return;
    this.g.sound.unlock();
    this.g.sfx('click');
    this.g.action(t.getAttribute('data-a'), t.getAttribute('data-v'), t);
  }
}
