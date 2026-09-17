import type { Translations } from "@/i18n/translations";
import SectionHeading from "./SectionHeading";

// The land geometry lives in /public/world-map.svg rather than inline: Next
// serializes inline markup twice (HTML + RSC payload), and 18KB of path data
// paid twice measurably cost LCP. As an external file it is fetched once,
// lazily, and cached. The overlay below shares its viewBox so they align.
const VIEWBOX = "0 0 1000 394.4";

// Port coordinates already projected into the map's viewBox
// (x = (lon+180)*1000/360, y = (84-lat)*1000/360).
const ORIGIN = { x: 702.6, y: 180.7 };

type Lane = { x: number; y: number; lift: number; dur: number; label: string };

// Active lanes — order matches t.globalReach.lanes.
const LANES: Omit<Lane, "label">[] = [
  { x: 610.2, y: 244.6, lift: 34, dur: 7 }, // Mombasa
  { x: 586.2, y: 316.3, lift: 46, dur: 8.5 }, // Durban
  { x: 659.7, y: 289.3, lift: 26, dur: 6 }, // Port Louis
  // Cartagena, on Colombia's Caribbean coast — the terminus that matches a
  // westbound Suez/Atlantic routing. (Buenaventura is Pacific-side; an arc
  // drawn this way would have to cross South America to reach it.)
  { x: 290.3, y: 204.4, lift: 150, dur: 13 },
];

// Wider markets named elsewhere on the site — shown as quiet markers, no arc.
const SECONDARY = [
  { x: 285.8, y: 266.8 }, // Callao, Peru
  { x: 278.1, y: 239.4 }, // Guayaquil, Ecuador
  { x: 609.1, y: 252.3 }, // Dar es Salaam, Tanzania
  { x: 509.4, y: 215.4 }, // Lagos, West Africa
];

/** Quadratic arc from the origin to a destination, bowed away from the
 * equator so routes read as great-circle-ish sailings rather than lines. */
function arc(to: { x: number; y: number; lift: number }) {
  const mx = (ORIGIN.x + to.x) / 2;
  const my = (ORIGIN.y + to.y) / 2 - to.lift;
  return `M${ORIGIN.x} ${ORIGIN.y} Q${mx.toFixed(1)} ${my.toFixed(1)} ${to.x} ${to.y}`;
}

/** Animated export-lane map. Pure inline SVG + CSS: the land is a single
 * path node, arcs draw once on scroll-in, and each vessel glyph rides its
 * arc via CSS offset-path (compositor-friendly, no JS, no map library).
 * Server component. */
export default function GlobalReach({ t }: { t: Translations }) {
  const lanes: Lane[] = LANES.map((l, i) => ({
    ...l,
    label: `${t.globalReach.lanes[i]?.port ?? ""}, ${t.globalReach.lanes[i]?.country ?? ""}`,
  }));

  return (
    <section className="border-t border-[var(--line)] px-5 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={t.globalReach.eyebrow}
          title={t.globalReach.title}
          subtitle={t.globalReach.lead}
        />

        <div
          data-reveal
          className="relative mt-12 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[#0a0d18]"
        >
          {/* Land layer — cached external asset, lazily fetched. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/world-map.svg"
            alt=""
            width={1000}
            height={394}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
          />

          {/* Routes layer — shares the land map's viewBox, so the two align
              at any width. Only a few hundred bytes of markup. */}
          <svg
            viewBox={VIEWBOX}
            className="reach-map absolute inset-0 h-full w-full"
            role="img"
            aria-label={`${t.globalReach.title}. ${t.globalReach.lead}`}
          >
            <defs>
              <radialGradient id="reach-glow">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.55" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Wider markets: quiet, unlabelled. */}
            {SECONDARY.map((m) => (
              <circle
                key={`${m.x}-${m.y}`}
                cx={m.x}
                cy={m.y}
                r="2"
                fill="var(--accent)"
                opacity="0.4"
              />
            ))}

            {/* Active lanes. */}
            {lanes.map((lane, i) => {
              const d = arc(lane);
              return (
                <g key={lane.label}>
                  <path
                    className="reach-arc"
                    d={d}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    style={{ "--arc-i": i } as React.CSSProperties}
                  />
                  {/* Vessel riding the lane. */}
                  <g
                    className="reach-vessel"
                    style={
                      {
                        offsetPath: `path("${d}")`,
                        animationDuration: `${lane.dur}s`,
                        animationDelay: `${i * 1.1}s`,
                      } as React.CSSProperties
                    }
                  >
                    <circle r="2.6" fill="var(--accent)" />
                    <circle r="6" fill="url(#reach-glow)" />
                  </g>
                  {/* Destination marker. */}
                  <circle cx={lane.x} cy={lane.y} r="7" fill="url(#reach-glow)" />
                  <circle cx={lane.x} cy={lane.y} r="2.6" fill="var(--accent)" />
                  <text
                    x={lane.x}
                    y={lane.y - 11}
                    className="reach-label"
                    textAnchor="middle"
                    fill="rgba(245,241,234,0.82)"
                  >
                    {lane.label}
                  </text>
                </g>
              );
            })}

            {/* Origin: Nhava Sheva. */}
            <circle className="reach-pulse" cx={ORIGIN.x} cy={ORIGIN.y} r="11" fill="url(#reach-glow)" />
            <circle cx={ORIGIN.x} cy={ORIGIN.y} r="3.4" fill="var(--ink)" />
            <text
              x={ORIGIN.x}
              y={ORIGIN.y - 14}
              className="reach-label reach-label-origin"
              textAnchor="middle"
              fill="var(--ink)"
            >
              {t.globalReach.originLabel}
            </text>
          </svg>
        </div>

        {/* Crawlable lane list — also the mobile substitute for map labels. */}
        <div className="mt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            {t.globalReach.lanesTitle}
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {t.globalReach.lanes.map((lane, i) => (
              <li
                key={lane.port}
                data-reveal
                style={{ "--reveal-i": i } as React.CSSProperties}
                className="card-surface p-4"
              >
                <p className="font-display text-[15px] font-bold text-[var(--ink)]">
                  {lane.port}
                </p>
                <p className="text-sm text-[var(--muted)]">{lane.country}</p>
                <p className="font-mono-credentials mt-2 text-xs text-[var(--accent)]">
                  {lane.transit}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
