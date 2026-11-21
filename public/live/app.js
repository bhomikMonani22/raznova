// EasyBuckets Live: signals, Skibidi Bucks, real bets. Plain JS, no build step.
// Polls /api/live/feed every 5 s while the page is visible. Everything from the feed is escaped before it is shown.
(() => {
  "use strict";
  const API = "/api/live";
  const LABEL = { player_points: "Points", player_rebounds: "Rebounds", player_assists: "Assists", player_threes: "3-pointers",
    player_points_rebounds_assists: "Pts+Reb+Ast", player_points_rebounds: "Pts+Reb", player_points_assists: "Pts+Ast",
    player_rebounds_assists: "Reb+Ast" };
  const TIER_ORDER = { strong: 0, moderate: 1, early: 2 };
  const ACCOUNTS = ["Bhoomik acc", "Tanay acc"];
  const root = document.getElementById("app");

  const S = { pin: ls("eb_live_pin"), draft: "", feed: null, err: "", tab: "signals", kind: "pregame",
    forms: {}, msg: "", token: "", dirty: false };

  // ---------- helpers
  function ls(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v);
    } catch (_) { /* storage blocked: the PIN is asked again next time */ }
    return null;
  }
  const esc = (x) => String(x ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pct = (x) => (x == null || !isFinite(x) ? "–" : `${(x * 100).toFixed(1)}%`);
  const num = (x, d = 2) => (typeof x === "number" && isFinite(x) ? x.toFixed(d) : "–");
  const inr = (x) => Number(x ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const ist = (iso) => (iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", hour: "2-digit", minute: "2-digit" }) : "");
  const istTime = (ms) => (ms ? new Date(ms).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }) : "");
  const label = (m, l) => l || LABEL[m] || m;
  const safeStake = (u) => (typeof u === "string" && /^https:\/\/stake\.com\//.test(u) ? u : "");
  async function post(path, body) {
    const r = await fetch(`${API}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, j };
  }

  // ---------- data
  async function load() {
    if (!S.pin) return;
    try {
      const { ok, status, j } = await post("feed", { pin: S.pin });
      if (status === 401) { ls("eb_live_pin", null); S.pin = null; S.feed = null; S.err = "Wrong PIN"; }
      else if (!ok) S.err = j.error || `HTTP ${status}`;
      else { S.err = ""; S.feed = j; }
    } catch (_) { S.err = "Offline: retrying"; }
    render();
  }

  // ---------- views
  function pinView() {
    return `<form class="pin" data-form="pin">
      <h1>EasyBuckets Live</h1>
      <input name="pin" inputmode="numeric" type="password" placeholder="PIN" autocomplete="current-password" autofocus />
      <button class="btn" type="submit">Open</button>
      <div class="note">The first PIN ever used becomes the PIN.</div>
      ${S.err ? `<div class="err">${esc(S.err)}</div>` : ""}
    </form>`;
  }

  function header() {
    const f = S.feed;
    const cls = f ? (f.online ? "on" : "off") : "";
    const txt = !f ? "…" : f.online ? "Engine on" : f.heartbeat ? `Engine off since ${istTime(f.heartbeat.at)}` : "Engine never seen";
    const bal = f?.sb?.summary?.balance ?? 10000;
    return `<header class="top"><h1>EasyBuckets Live</h1><span class="pill ${cls}">${esc(txt)}</span><span class="sb">SB ${inr(bal)}</span></header>`;
  }

  function signalsView() {
    const all = Object.values(S.feed.signals || {})
      .filter((s) => (S.kind === "live" ? s.kind === "live" : s.kind !== "live"))
      .sort((a, b) => (a.status === "active" ? 0 : 1) - (b.status === "active" ? 0 : 1)
        || (TIER_ORDER[a.tier] ?? 3) - (TIER_ORDER[b.tier] ?? 3) || b.edge - a.edge);
    const shown = S.kind === "live" ? [...all.filter((s) => s.status === "active").slice(0, 3), ...all.filter((s) => s.status !== "active")] : all;
    const empty = S.kind === "live" ? "Live signals arrive in P2."
      : S.feed.online ? "No edges right now. The scanner checks every few minutes." : "Open the PC app to start scanning.";
    return `<div class="seg">
        <button data-act="kind" data-v="pregame" class="${S.kind === "pregame" ? "act" : ""}">Pre-game</button>
        <button data-act="kind" data-v="live" class="${S.kind === "live" ? "act" : ""}">Live</button>
      </div>
      ${shown.length ? shown.map(card).join("") : `<div class="empty">${esc(empty)}</div>`}`;
  }

  function card(s) {
    const id = esc(s.id);
    const url = safeStake(s.stake_url);
    const f = S.forms[s.id];
    const books = s.books ?? 0;
    return `<div class="card ${esc(s.status)}">
      <div class="row"><span class="tier ${esc(s.tier)}">${esc(s.status === "active" ? String(s.tier).toUpperCase() : String(s.status).toUpperCase())}</span>
        <span class="nums">${s.strategy === "sharp_gap" ? "Sharp gap · 1/1" : esc(s.strategy)} · ${esc(s.game)} · ${esc(ist(s.tip))}</span></div>
      <div class="pick">${esc(s.player)} ${s.side === "over" ? "Over" : "Under"} ${esc(s.line)} ${esc(label(s.market, s.label))} @ ${num(s.odds)}</div>
      <div class="nums">Fair <b>${pct(s.fair)}</b> vs Stake <b>${pct(1 / s.odds)}</b> · edge <b>${pct(s.edge)}</b>${s.edge_low != null ? ` (worst book ${pct(s.edge_low)})` : ""} · ${esc(books)} sharp book${books === 1 ? "" : "s"}</div>
      ${s.why ? `<div class="why">${esc(s.why)}${s.book_names?.length ? ` (${esc(s.book_names.join(", "))})` : ""}</div>` : ""}
      ${s.status === "active" ? `<div class="actions">
          ${url ? `<a class="btn" href="${esc(url)}" target="_blank" rel="noreferrer">Open Stake</a>` : ""}
          <button class="btn ghost" data-act="toggle" data-id="${id}">Record real bet</button></div>` : ""}
      ${f ? recordForm(s, f) : ""}
    </div>`;
  }

  function recordForm(s, f) {
    const id = esc(s.id);
    const opt = ACCOUNTS.map((a) => `<option${a === f.account ? " selected" : ""}>${esc(a)}</option>`).join("");
    return `<form class="rb" data-form="real" data-id="${id}">
      <label>Stake ₹<input data-f="stake" inputmode="decimal" value="${esc(f.stake)}" /></label>
      <label>Odds taken<input data-f="odds" inputmode="decimal" value="${esc(f.odds)}" /></label>
      <label>Account<select data-f="account">${opt}</select></label>
      <label>Slip ID (optional)<input data-f="slip" value="${esc(f.slip)}" /></label>
      <button class="btn" type="submit">Save</button>
      ${f.err ? `<span class="err">${esc(f.err)}</span>` : ""}
    </form>`;
  }

  function ledgerView() {
    const s = S.feed.sb?.summary || {};
    const t = s.by_tier || {};
    const tier = (k) => `${t[k]?.won ?? 0}/${t[k]?.bets ?? 0} (${pct(t[k]?.roi)})`;
    const bets = Object.values(S.feed.sb?.bets || {}).sort((a, b) => b.placed_at - a.placed_at);
    const rows = bets.map((b) => `<tr>
        <td>${esc(b.player)} ${b.side === "over" ? "O" : "U"} ${esc(b.line)} ${esc(label(b.market, b.label))}<div class="note">${esc(b.game)} · ${esc(b.tier)}</div></td>
        <td>${num(b.odds)}</td><td>${esc(b.stake)}</td>
        <td class="${esc(b.status)}">${esc(b.status)}${b.actual != null ? ` (${esc(b.actual)})` : ""}${b.profit ? ` ${b.profit > 0 ? "+" : ""}${num(b.profit, 0)}` : ""}</td></tr>`).join("");
    return `<div class="stats">
        <div class="stat"><div class="k">Balance</div><div class="v">${inr(s.balance ?? 10000)}</div></div>
        <div class="stat"><div class="k">ROI</div><div class="v">${pct(s.roi)}</div></div>
        <div class="stat"><div class="k">Won</div><div class="v">${esc(s.won ?? 0)}/${esc(s.settled ?? 0)}</div></div>
      </div>
      <div class="note" style="margin-bottom:8px">Moderate ${tier("moderate")} · Strong ${tier("strong")} · ${esc(s.open ?? 0)} open</div>
      ${bets.length ? `<table><thead><tr><th>Bet</th><th>Odds</th><th>SB</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table>`
        : `<div class="empty">No Skibidi Bucks bets yet. Every Moderate and Strong signal is bet here automatically.</div>`}`;
  }

  function realView() {
    const bets = Object.values(S.feed.real || {}).sort((a, b) => b.at - a.at);
    const staked = bets.reduce((a, b) => a + (b.result === "won" || b.result === "lost" ? b.stake_inr : 0), 0);
    const pl = bets.reduce((a, b) => a + (b.result === "won" ? b.stake_inr * (b.odds - 1) : b.result === "lost" ? -b.stake_inr : 0), 0);
    const cards = bets.map((b) => `<div class="card">
        <div class="pick">${esc(b.player)} ${b.side === "over" ? "Over" : "Under"} ${esc(b.line)} ${esc(label(b.market))} @ ${num(b.odds)}</div>
        <div class="nums">₹${esc(b.stake_inr)} · ${esc(b.account)}${b.slip ? ` · ${esc(b.slip)}` : ""} · <span class="${esc(b.result)}">${esc(b.result)}</span></div>
        ${b.result === "open" ? `<div class="actions">${["won", "lost", "void"].map((r) =>
          `<button class="btn ghost" data-act="mark" data-id="${esc(b.id)}" data-v="${r}">${r[0].toUpperCase() + r.slice(1)}</button>`).join("")}</div>` : ""}
      </div>`).join("");
    return `<div class="stats">
        <div class="stat"><div class="k">Bets</div><div class="v">${bets.length}</div></div>
        <div class="stat"><div class="k">P&amp;L ₹</div><div class="v">${num(pl, 0)}</div></div>
        <div class="stat"><div class="k">ROI</div><div class="v">${staked ? pct(pl / staked) : "–"}</div></div>
      </div>
      ${bets.length ? cards : `<div class="empty">Real bets you record from a signal card show here. Skibidi Bucks never mix with them.</div>`}`;
  }

  function settingsView() {
    const snippet = S.token ? JSON.stringify({ ingest_url: `${location.origin}${API}/engine`, ingest_token: S.token }, null, 2) : "";
    return `<div class="card">
        <div class="actions"><button class="btn" data-act="push">Turn on push for this phone</button></div>
        <p class="note">Install: Chrome menu → Add to Home screen (or Install app).</p>
      </div>
      <div class="card">
        <p class="note">Connect the PC app: these two lines go into settings.json (tray → Settings).</p>
        ${S.token ? `<pre class="snippet">${esc(snippet)}</pre>
          <div class="actions"><button class="btn" data-act="copy">Copy</button><button class="btn ghost" data-act="rotate">New token</button></div>`
          : `<div class="actions"><button class="btn ghost" data-act="token">Show PC app token</button></div>`}
      </div>
      ${S.msg ? `<p class="note">${esc(S.msg)}</p>` : ""}
      <div class="actions"><button class="btn ghost" data-act="signout">Sign out of this device</button></div>`;
  }

  function render() {
    // never wipe a field the user is typing in; redraw when they leave it
    const a = document.activeElement;
    if (a && root.contains(a) && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName) && S.pin) { S.dirty = true; return; }
    S.dirty = false;
    if (!S.pin) { root.innerHTML = pinView(); root.querySelector("input[name=pin]")?.focus(); return; }
    const body = !S.feed ? "" : S.tab === "signals" ? signalsView() : S.tab === "ledger" ? ledgerView()
      : S.tab === "real" ? realView() : settingsView();
    const tabs = [["signals", "Signals"], ["ledger", "Ledger"], ["real", "My bets"], ["settings", "Settings"]]
      .map(([k, t]) => `<button data-act="tab" data-v="${k}" class="${S.tab === k ? "act" : ""}">${t}</button>`).join("");
    root.innerHTML = `${header()}${S.err ? `<div class="err">${esc(S.err)}</div>` : ""}${S.tab === "settings" && !S.feed ? settingsView() : body}<nav class="tabs">${tabs}</nav>`;
  }

  // ---------- actions
  function urlB64(s) {
    const pad = "=".repeat((4 - (s.length % 4)) % 4);
    const raw = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  }

  async function enablePush() {
    try {
      const k = (await (await fetch(`${API}/push`, { cache: "no-store" })).json()).publicKey;
      if (!k) { S.msg = "Storage is not connected on the server yet."; return render(); }
      if ((await Notification.requestPermission()) !== "granted") { S.msg = "Notifications are blocked for this site."; return render(); }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64(k) });
      const r = await post("push", { pin: S.pin, subscription: sub.toJSON() });
      S.msg = r.ok ? "Push on for this phone: Moderate and Strong signals." : "Could not save the subscription.";
    } catch (_) { S.msg = "This browser cannot do push. On Android use Chrome."; }
    render();
  }

  async function getToken(rotate) {
    if (rotate && !window.confirm("Make a new token? The PC app stops sending until you paste the new one.")) return;
    const r = await post("token", { pin: S.pin, rotate: !!rotate });
    if (r.ok) S.token = r.j.token; else S.msg = r.j.error || "Could not get the token.";
    render();
  }

  async function copyToken() {
    const text = root.querySelector(".snippet")?.textContent || "";
    try { await navigator.clipboard.writeText(text); S.msg = "Copied. Paste into settings.json on the PC, then restart the app."; }
    catch (_) { S.msg = "Copy failed: select the text and copy it."; }
    render();
  }

  async function saveReal(sid) {
    const s = S.feed?.signals?.[sid]; const f = S.forms[sid];
    if (!s || !f) return;
    const bet = { id: `${s.id}|${Date.now()}`, at: Date.now(), signal_id: s.id, player: s.player, market: s.market, line: s.line,
      side: s.side, odds: Number(f.odds), stake_inr: Number(f.stake), account: f.account, slip: f.slip };
    const r = await post("real", { pin: S.pin, bet });
    if (r.ok) { delete S.forms[sid]; S.tab = "real"; await load(); }
    else { f.err = r.j.error || "Could not save"; render(); }
  }

  async function mark(id, result) {
    const b = S.feed?.real?.[id];
    if (!b) return;
    await post("real", { pin: S.pin, bet: { ...b, result } });
    load();
  }

  root.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const { act, v, id } = el.dataset;
    if (act === "tab") { S.tab = v; S.msg = ""; render(); }
    else if (act === "kind") { S.kind = v; render(); }
    else if (act === "toggle") {
      if (S.forms[id]) delete S.forms[id];
      else S.forms[id] = { stake: "500", odds: String(S.feed?.signals?.[id]?.odds ?? ""), account: ACCOUNTS[0], slip: "", err: "" };
      render();
    }
    else if (act === "mark") mark(id, v);
    else if (act === "push") enablePush();
    else if (act === "token") getToken(false);
    else if (act === "rotate") getToken(true);
    else if (act === "copy") copyToken();
    else if (act === "signout") { ls("eb_live_pin", null); S.pin = null; S.feed = null; S.token = ""; S.msg = ""; render(); }
  });

  root.addEventListener("input", (e) => {
    const el = e.target;
    const form = el.closest("form[data-form='real']");
    if (form && el.dataset.f && S.forms[form.dataset.id]) S.forms[form.dataset.id][el.dataset.f] = el.value;
  });

  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    if (form.dataset.form === "pin") {
      const p = form.elements.pin.value;
      if (p.length < 4) { S.err = "PIN: at least 4 characters"; return render(); }
      ls("eb_live_pin", p); S.pin = p; S.err = ""; render(); load();
    } else if (form.dataset.form === "real") {
      document.activeElement?.blur?.();
      saveReal(form.dataset.id);
    }
  });

  root.addEventListener("focusout", () => setTimeout(() => {
    const a = document.activeElement;
    if (S.dirty && !(a && root.contains(a) && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName))) render();
  }, 0));

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/live/sw.js", { scope: "/live" }).catch(() => {});
  setInterval(() => { if (document.visibilityState === "visible") load(); }, 5000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") load(); });
  render();
  load();
})();
