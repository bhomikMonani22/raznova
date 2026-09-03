"use client";

import { useCallback, useEffect, useState } from "react";

// Private, mobile-first analytics dashboard. Enter the password once (kept in
// localStorage for convenience), tap a range, and the whole picture loads
// from /api/insights in one request. No chart libraries — light and fast.

type Totals = {
  human_visitors: number;
  page_views: number;
  whatsapp_clicks: number;
  email_clicks: number;
  quote_submits: number;
  bot_hits: number;
};
type CountryRow = {
  country: string;
  visitors: number;
  page_views: number;
  whatsapp_clicks: number;
  quote_submits: number;
};
type Payload = {
  generated_at: string;
  totals: Totals;
  by_country: CountryRow[];
  top_pages: { pathname: string; views: number; sessions: number }[];
  referrers: { referrer: string; hits: number }[];
  daily: { day: string; visitors: number; page_views: number }[];
  devices: { device_type: string; visitors: number }[];
  top_bots: { bot_reason: string; hits: number }[];
  recent_conversions: { at: string; country: string; event_type: string; pathname: string }[];
};

const RANGES = [
  { key: "24h", label: "24 hours" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "All time" },
] as const;

const PW_KEY = "rz-insights-pw";

// ISO country code → flag emoji (regional indicators). Falls back to the code.
function flag(cc: string): string {
  if (!/^[A-Za-z]{2}$/.test(cc)) return "🌐";
  return String.fromCodePoint(
    ...cc.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}
const EVENT_LABEL: Record<string, string> = {
  whatsapp_click: "WhatsApp",
  email_click: "Email",
  quote_submit: "Quote form",
};

export default function InsightsDashboard() {
  const [password, setPassword] = useState("");
  const [range, setRange] = useState<string>("7d");
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);

  const load = useCallback(async (pw: string, r: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw, range: r }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        if (res.status === 401) {
          setAuthed(false);
          try {
            localStorage.removeItem(PW_KEY);
          } catch {}
        }
        throw new Error(json.error || `Error ${res.status}`);
      }
      setData(json.data as Payload);
      setAuthed(true);
      try {
        localStorage.setItem(PW_KEY, pw);
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load with a remembered password. Deferred so no state is set
  // synchronously during the effect (avoids cascading renders).
  useEffect(() => {
    let saved = "";
    try {
      saved = localStorage.getItem(PW_KEY) || "";
    } catch {}
    if (saved) {
      queueMicrotask(() => {
        setPassword(saved);
        load(saved, "7d");
      });
    }
  }, [load]);

  function selectRange(r: string) {
    setRange(r);
    if (authed && password) load(password, r);
  }

  const t = data?.totals;

  return (
    <main className="mx-auto min-h-[100svh] max-w-3xl px-4 py-8 text-[var(--ink)]">
      <header className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">
          Raznova<span className="text-[var(--accent)]">.</span> Insights
        </h1>
        {authed && (
          <button
            onClick={() => load(password, range)}
            disabled={loading}
            className="min-h-10 rounded-[var(--radius-md)] border border-[var(--line-strong)] px-4 text-sm font-semibold transition-colors hover:border-[var(--accent)] disabled:opacity-50"
          >
            {loading ? "…" : "↻ Refresh"}
          </button>
        )}
      </header>

      {!authed ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(password, range);
          }}
          className="mt-10 flex flex-col gap-3"
        >
          <label className="text-sm text-[var(--muted)]">Enter dashboard password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="min-h-12 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] px-4 text-[var(--ink)] outline-none focus:border-[var(--accent)]/60"
          />
          <button
            type="submit"
            disabled={loading || !password}
            className="min-h-12 rounded-[var(--radius-md)] bg-[var(--accent)] px-6 font-semibold text-[var(--accent-ink)] disabled:opacity-50"
          >
            {loading ? "Checking…" : "Unlock"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      ) : (
        <>
          {/* Range buttons */}
          <div className="mt-6 grid grid-cols-4 gap-2">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => selectRange(r.key)}
                className={`min-h-11 rounded-[var(--radius-md)] px-2 text-sm font-semibold transition-colors ${
                  range === r.key
                    ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]/85"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          {t && (
            <>
              {/* Headline cards */}
              <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat label="Human visitors" value={t.human_visitors} accent />
                <Stat label="Page views" value={t.page_views} />
                <Stat label="WhatsApp clicks" value={t.whatsapp_clicks} accent />
                <Stat label="Quote forms" value={t.quote_submits} />
                <Stat label="Email clicks" value={t.email_clicks} />
                <Stat label="Bot hits" value={t.bot_hits} muted />
              </section>

              <Panel title="By country">
                <Table
                  head={["Country", "Visitors", "Views", "WA", "RFQ"]}
                  rows={data!.by_country.map((c) => [
                    `${flag(c.country)} ${c.country}`,
                    c.visitors,
                    c.page_views,
                    c.whatsapp_clicks || "",
                    c.quote_submits || "",
                  ])}
                  empty="No visitors in this window."
                />
              </Panel>

              <Panel title="Conversions (WhatsApp / email / quote)">
                {data!.recent_conversions.length ? (
                  <ul className="divide-y divide-[var(--line)] text-sm">
                    {data!.recent_conversions.map((c, i) => (
                      <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 py-2.5">
                        <span>{flag(c.country)}</span>
                        <span className="font-medium text-[var(--accent)]">
                          {EVENT_LABEL[c.event_type] || c.event_type}
                        </span>
                        <span className="text-[var(--muted)]">on</span>
                        <span className="font-mono-credentials text-xs">{c.pathname}</span>
                        <span className="ml-auto text-xs text-[var(--muted)]">{c.at}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--muted)]">No conversions in this window yet.</p>
                )}
              </Panel>

              <Panel title="Top pages">
                <Table
                  head={["Page", "Views", "Sessions"]}
                  rows={data!.top_pages.map((p) => [p.pathname, p.views, p.sessions])}
                  mono
                  empty="No page views yet."
                />
              </Panel>

              <Panel title="Referrers">
                <Table
                  head={["Source", "Hits"]}
                  rows={data!.referrers.map((r) => [r.referrer, r.hits])}
                  mono
                  empty="No referrers recorded."
                />
              </Panel>

              <div className="grid gap-4 sm:grid-cols-2">
                <Panel title="Daily">
                  <Table
                    head={["Day", "Visitors", "Views"]}
                    rows={data!.daily.map((d) => [d.day, d.visitors, d.page_views])}
                    empty="No days recorded."
                  />
                </Panel>
                <Panel title="Devices & crawlers">
                  <Table
                    head={["Device", "Visitors"]}
                    rows={data!.devices.map((d) => [d.device_type, d.visitors])}
                    empty="—"
                  />
                  {data!.top_bots.length > 0 && (
                    <Table
                      head={["Crawler", "Hits"]}
                      rows={data!.top_bots.map((b) => [b.bot_reason, b.hits])}
                      empty=""
                    />
                  )}
                </Panel>
              </div>

              <p className="mt-8 text-center text-xs text-[var(--muted)]">
                Updated {new Date(data!.generated_at).toLocaleString()} · humans exclude bots ·
                WA = WhatsApp clicks, RFQ = quote-form submits
              </p>
            </>
          )}
        </>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: number;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="card-surface p-4">
      <p
        className={`font-display text-3xl font-bold ${
          accent ? "text-[var(--accent)]" : muted ? "text-[var(--muted)]" : "text-[var(--ink)]"
        }`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">{label}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        {title}
      </h2>
      <div className="mt-2 card-surface overflow-x-auto p-4">{children}</div>
    </section>
  );
}

function Table({
  head,
  rows,
  mono,
  empty,
}: {
  head: string[];
  rows: (string | number)[][];
  mono?: boolean;
  empty: string;
}) {
  if (!rows.length) return empty ? <p className="text-sm text-[var(--muted)]">{empty}</p> : null;
  return (
    <table className="w-full min-w-[280px] text-left text-sm">
      <thead>
        <tr className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
          {head.map((h, i) => (
            <th key={h} className={`pb-2 font-semibold ${i > 0 ? "text-right" : ""}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--line)]">
        {rows.map((r, ri) => (
          <tr key={ri}>
            {r.map((cell, ci) => (
              <td
                key={ci}
                className={`py-2 ${ci > 0 ? "text-right tabular-nums text-[var(--muted)]" : "text-[var(--ink)]/90"} ${
                  mono && ci === 0 ? "font-mono-credentials text-xs" : ""
                }`}
                style={ci > 0 ? { fontVariantNumeric: "tabular-nums" } : undefined}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
