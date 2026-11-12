// "Flex card": a 1080x1350 PNG of a slip for Instagram / X / WhatsApp status.
import { legLabel, betProfit, potential } from './engine.js';

export async function flexCard(bet, { cur = '₹', handle = '' } = {}) {
  const W = 1080, H = 1350;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const won = bet.status === 'won' || bet.status === 'cashout';
  const lost = bet.status === 'lost';
  const accent = won ? '#22c55e' : lost ? '#f43f5e' : '#ff7a1a';

  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#120c06'); g.addColorStop(0.45, '#07090d'); g.addColorStop(1, '#07090d');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const rg = x.createRadialGradient(W * 0.85, 120, 10, W * 0.85, 120, 520);
  rg.addColorStop(0, accent + '55'); rg.addColorStop(1, 'transparent');
  x.fillStyle = rg; x.fillRect(0, 0, W, H);

  const mono = 'ui-monospace, "JetBrains Mono", Consolas, monospace';
  const sans = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  x.fillStyle = '#8b98a5'; x.font = `600 30px ${sans}`;
  x.fillText('EASYBUCKETS LEDGER', 80, 120);
  x.fillStyle = accent; x.font = `800 92px ${sans}`;
  const head = won ? 'CASHED' : lost ? 'BUSTED' : 'LIVE SWEAT';
  x.fillText(head, 80, 225);
  x.fillStyle = '#e6edf3'; x.font = `600 34px ${sans}`;
  const n = bet.legs.length;
  x.fillText(`${n === 1 ? 'Single' : n + '-leg ' + (bet.type === 'sgm' ? 'SGM' : 'multi')}  ·  @${Number(bet.odds).toFixed(2)}`, 80, 285);

  let y = 360;
  const maxLegs = Math.min(n, 9);
  const rowH = Math.min(92, Math.floor(640 / maxLegs));
  for (let i = 0; i < maxLegs; i++) {
    const l = bet.legs[i];
    const r = l.result;
    const col = r === 'won' ? '#22c55e' : r === 'lost' ? '#f43f5e' : r === 'void' ? '#5b6876' : '#38bdf8';
    x.fillStyle = '#0d1218'; roundRect(x, 80, y, W - 160, rowH - 14, 20); x.fill();
    x.fillStyle = col; x.beginPath(); x.arc(122, y + (rowH - 14) / 2, 16, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#07090d'; x.font = `900 20px ${sans}`; x.textAlign = 'center';
    x.fillText(r === 'won' ? '✓' : r === 'lost' ? '✕' : r === 'void' ? '–' : '•', 122, y + (rowH - 14) / 2 + 7);
    x.textAlign = 'left'; x.fillStyle = '#e6edf3'; x.font = `600 ${rowH > 80 ? 32 : 26}px ${sans}`;
    x.fillText(trim(x, legLabel(l), W - 420), 160, y + (rowH - 14) / 2 + 11);
    if (l.odds) { x.textAlign = 'right'; x.fillStyle = '#8b98a5'; x.font = `500 28px ${mono}`; x.fillText(Number(l.odds).toFixed(2), W - 110, y + (rowH - 14) / 2 + 10); x.textAlign = 'left'; }
    y += rowH;
  }
  if (n > maxLegs) { x.fillStyle = '#8b98a5'; x.font = `500 28px ${sans}`; x.fillText(`+${n - maxLegs} more legs`, 80, y + 20); y += 50; }

  const by = H - 300;
  x.fillStyle = '#121a23'; roundRect(x, 80, by, W - 160, 190, 28); x.fill();
  const stake = Number(bet.stake) || 0;
  const ret = won ? stake + betProfit(bet) : potential(bet);
  col3(x, 120, by + 70, 'STAKE', `${cur}${fmt(stake)}`, '#e6edf3', sans, mono);
  col3(x, 430, by + 70, won ? 'RETURNED' : 'TO WIN', `${cur}${fmt(ret)}`, won ? '#22c55e' : '#e6edf3', sans, mono);
  col3(x, 760, by + 70, 'ODDS', `${Number(bet.odds).toFixed(2)}x`, accent, sans, mono);

  x.fillStyle = '#5b6876'; x.font = `500 26px ${sans}`;
  const dt = new Date(bet.placedAt || Date.now()).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  x.fillText(`${dt}${handle ? '  ·  ' + handle : ''}`, 80, H - 60);
  x.textAlign = 'right'; x.fillText('NBA', W - 80, H - 60); x.textAlign = 'left';

  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  return blob;
}

function col3(x, X, Y, lbl, val, color, sans, mono) {
  x.fillStyle = '#8b98a5'; x.font = `600 24px ${sans}`; x.fillText(lbl, X, Y);
  x.fillStyle = color; x.font = `700 50px ${mono}`; x.fillText(val, X, Y + 66);
}
function fmt(n) { return Math.round(n).toLocaleString('en-IN'); }
function trim(x, s, max) { if (x.measureText(s).width <= max) return s; while (s.length > 3 && x.measureText(s + '…').width > max) s = s.slice(0, -1); return s + '…'; }
function roundRect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
