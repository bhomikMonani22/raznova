// Tiny dependency-free SVG charts.

export function equityChart(el, points, { fmt = (v) => v, startVal = 0, height = 200 } = {}) {
  const w = Math.max(280, el.clientWidth || 600);
  const h = height;
  const pad = { l: 8, r: 8, t: 14, b: 22 };
  if (!points.length) {
    el.innerHTML = `<div class="empty" style="padding:50px 0"><b>No settled slips yet</b>Your equity curve shows up after the first result.</div>`;
    return;
  }
  const pts = [{ t: points[0].t - 1, v: startVal }, ...points];
  const xs = pts.map((p, i) => i);
  const vs = pts.map((p) => p.v);
  let min = Math.min(0, ...vs), max = Math.max(0, ...vs);
  if (min === max) { min -= 1; max += 1; }
  const rng = max - min;
  min -= rng * 0.08; max += rng * 0.08;
  const X = (i) => pad.l + (i / Math.max(1, xs.length - 1)) * (w - pad.l - pad.r);
  const Y = (v) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);
  const last = vs[vs.length - 1];
  const up = last >= startVal;
  const col = up ? 'var(--green)' : 'var(--red)';
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`).join('');
  const area = `${d}L${X(pts.length - 1).toFixed(1)},${Y(min).toFixed(1)}L${X(0).toFixed(1)},${Y(min).toFixed(1)}Z`;
  const zeroY = Y(0);
  const gid = 'g' + Math.random().toString(36).slice(2, 7);
  const fd = (t) => new Date(t).toLocaleDateString([], { day: 'numeric', month: 'short' });
  el.innerHTML = `
  <div class="chart-wrap">
    <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" role="img" aria-label="Cumulative profit">
      <defs><linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="${up ? '#22c55e' : '#f43f5e'}" stop-opacity=".28"/>
        <stop offset="1" stop-color="${up ? '#22c55e' : '#f43f5e'}" stop-opacity="0"/></linearGradient></defs>
      <line x1="${pad.l}" x2="${w - pad.r}" y1="${zeroY}" y2="${zeroY}" stroke="var(--line2)" stroke-dasharray="3 4"/>
      <path d="${area}" fill="url(#${gid})"/>
      <path d="${d}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      <circle cx="${X(pts.length - 1)}" cy="${Y(last)}" r="4" fill="${col}"/>
      <text x="${pad.l}" y="${h - 6}" fill="var(--dim)" font-size="11">${fd(pts[1].t)}</text>
      <text x="${w - pad.r}" y="${h - 6}" fill="var(--dim)" font-size="11" text-anchor="end">${fd(pts[pts.length - 1].t)}</text>
      <line class="cx" x1="0" x2="0" y1="${pad.t}" y2="${h - pad.b}" stroke="var(--mute)" stroke-width="1" opacity="0"/>
      <circle class="cd" r="4" fill="var(--text)" opacity="0"/>
    </svg>
    <div class="chart-tip hidden"></div>
  </div>`;
  const svg = el.querySelector('svg');
  const tip = el.querySelector('.chart-tip');
  const cx = el.querySelector('.cx');
  const cd = el.querySelector('.cd');
  const move = (ev) => {
    const r = svg.getBoundingClientRect();
    const px = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) * (w / r.width);
    let i = Math.round(((px - pad.l) / (w - pad.l - pad.r)) * (pts.length - 1));
    i = Math.max(1, Math.min(pts.length - 1, i));
    const p = pts[i];
    cx.setAttribute('x1', X(i)); cx.setAttribute('x2', X(i)); cx.setAttribute('opacity', 0.4);
    cd.setAttribute('cx', X(i)); cd.setAttribute('cy', Y(p.v)); cd.setAttribute('opacity', 1);
    tip.classList.remove('hidden');
    tip.style.left = (X(i) / w) * r.width + 'px';
    tip.style.top = (Y(p.v) / h) * r.height + 'px';
    const delta = p.v - pts[i - 1].v;
    tip.innerHTML = `<b class="num ${p.v >= 0 ? 'pos' : 'neg'}">${fmt(p.v)}</b> <span class="mute">${fd(p.t)}</span><br><span class="num ${delta >= 0 ? 'pos' : 'neg'}">${delta >= 0 ? '+' : ''}${fmt(delta)}</span> <span class="dim">${p.b?.legs?.length > 1 ? p.b.legs.length + '-leg' : 'single'}</span>`;
  };
  const leave = () => { tip.classList.add('hidden'); cx.setAttribute('opacity', 0); cd.setAttribute('opacity', 0); };
  svg.addEventListener('mousemove', move);
  svg.addEventListener('touchmove', move, { passive: true });
  svg.addEventListener('mouseleave', leave);
  svg.addEventListener('touchend', () => setTimeout(leave, 1200));
}

export function heatmap(el, dayMap, { weeks = 18, fmt = (v) => v } = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1) - start.getDay());
  const vals = [...dayMap.values()].map(Math.abs);
  const maxAbs = Math.max(1, ...vals);
  const cells = [];
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const v = dayMap.get(k);
    let bg = 'var(--panel3)';
    if (v != null && v !== 0) {
      const a = 0.25 + 0.75 * Math.min(1, Math.abs(v) / maxAbs);
      bg = v > 0 ? `rgba(34,197,94,${a})` : `rgba(244,63,94,${a})`;
    } else if (v === 0) bg = 'var(--line2)';
    cells.push(`<i style="background:${bg}" title="${d.toDateString()}${v != null ? ' · ' + fmt(v) : ''}"></i>`);
  }
  el.innerHTML = `<div class="heat">${cells.join('')}</div>
    <div class="heat-legend">Loss <i style="background:rgba(244,63,94,.9)"></i><i style="background:rgba(244,63,94,.4)"></i><i style="background:var(--panel3)"></i><i style="background:rgba(34,197,94,.4)"></i><i style="background:rgba(34,197,94,.9)"></i> Profit</div>`;
  const h = el.querySelector('.heat');
  h.scrollLeft = h.scrollWidth;
}

export function ring(done, total, live = 0) {
  const r = 16, c = 2 * Math.PI * r;
  const f = total ? done / total : 0;
  const l = total ? live / total : 0;
  return `<svg class="prog-ring" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="${r}" fill="none" stroke="var(--panel3)" stroke-width="4"/>
    <circle cx="20" cy="20" r="${r}" fill="none" stroke="var(--amber)" stroke-width="4" stroke-dasharray="${c * (f + l)} ${c}" transform="rotate(-90 20 20)" stroke-linecap="round" opacity=".55"/>
    <circle cx="20" cy="20" r="${r}" fill="none" stroke="var(--green)" stroke-width="4" stroke-dasharray="${c * f} ${c}" transform="rotate(-90 20 20)" stroke-linecap="round"/>
    <text x="20" y="24" text-anchor="middle" font-size="11" font-weight="700" fill="var(--text)" font-family="ui-monospace,monospace">${done}/${total}</text></svg>`;
}

export function hbar(label, value, maxAbs, txt, centered = false) {
  const pct = maxAbs ? Math.min(100, (Math.abs(value) / maxAbs) * 100) : 0;
  const color = value >= 0 ? 'var(--green)' : 'var(--red)';
  const style = centered
    ? value >= 0 ? `left:50%;width:${pct / 2}%;background:${color}` : `right:50%;width:${pct / 2}%;background:${color}`
    : `left:0;width:${pct}%;background:${color}`;
  return `<div class="hbar"><span class="mute" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${label}</span><div class="track">${centered ? '<span class="mid"></span>' : ''}<i style="${style}"></i></div><span class="num">${txt}</span></div>`;
}
