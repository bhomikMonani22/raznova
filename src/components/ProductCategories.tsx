"use client";

import { motion } from "framer-motion";
import type { Translations } from "@/i18n/translations";
import { fadeUp, staggerContainer } from "@/lib/motion";
import SectionHeading from "./SectionHeading";

const ICONS = [
  // Engine — piston
  <path key="engine" d="M9 3h6v5l2 2v4h-2.5M9 3v5l-2 2v4h2.5M9.5 14v4M14.5 14v4M7 21h10" />,
  // Electricals — bolt
  <path key="cdi" d="M13 2 5 13.5h5L9.5 22 18 10h-5.5L13 2Z" />,
  // Clutch & transmission — gear
  <g key="gear">
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" />
  </g>,
  // Cables & controls — cable curve with ends
  <path key="cables" d="M4 18c0-6 4-4 8-8s0-6 8-6M3 18h2v3H3zM19 3h2v3h-2z" />,
  // Brakes & suspension — disc
  <g key="brakes">
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" />
  </g>,
  // Filters & service — funnel layers
  <path key="filters" d="M4 5h16l-6 7v7l-4-2v-5L4 5ZM8 5.2c1.2 1 6.8 1 8 0" />,
  // Body & visors — mirror/shield
  <path key="body" d="M12 3c3 2 6 2.5 7 2.5 0 8.5-3.5 13-7 15.5-3.5-2.5-7-7-7-15.5 1 0 4-.5 7-2.5Z" />,
  // Batteries & tyres — battery
  <g key="battery">
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M8 5.5h3v2.5M13 5.5h3v2.5M7.5 13.5h4M9.5 11.5v4M14.5 13.5h3" />
  </g>,
];

export default function ProductCategories({ t }: { t: Translations }) {
  return (
    <section className="px-5 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={t.categories.eyebrow}
          title={t.categories.title}
          subtitle={t.categories.subtitle}
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer(0.08)}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {t.categories.items.map((item, i) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              className="group relative rounded-[var(--radius-lg)] glass-panel p-6"
            >
              {/* Purple accent traces around the border on hover. */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  className="trace-rect"
                  pathLength={100}
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                  style={{
                    x: "1px",
                    y: "1px",
                    width: "calc(100% - 2px)",
                    height: "calc(100% - 2px)",
                    rx: "15px",
                  }}
                />
              </svg>

              <div className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)] transition-transform duration-300 group-hover:-rotate-6">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  aria-hidden="true"
                >
                  {ICONS[i % ICONS.length]}
                </svg>
              </div>
              <h3 className="font-display mt-4 text-lg font-bold text-[var(--ink)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
