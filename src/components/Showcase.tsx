"use client";

import { useState } from "react";
import Link from "next/link";
import type { ShowcasePartLite } from "@/lib/types";
import type { Locale } from "@/i18n/locales";
import type { Translations } from "@/i18n/translations";
import PartCard from "./PartCard";
import FitmentDisclaimer from "./FitmentDisclaimer";

export type ShowcaseGroup = {
  brand: string;
  model: string;
  catalogHref: string | null;
  parts: ShowcasePartLite[];
};

/** Client component only because of the bike tabs. Data arrives pre-grouped
 * and locale-resolved from the server so the payload stays lean. */
export default function Showcase({
  t,
  groups,
  oemLogos,
}: {
  t: Translations;
  locale: Locale;
  groups: ShowcaseGroup[];
  oemLogos: { brand: string; src: string }[];
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = groups[activeIdx];

  return (
    <section id="showcase" className="border-t border-[var(--line)] px-5 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        {/* OEM "Compatible fitment for:" strip — fitment reference only, never
            site identity. Logos + disclaimer text sit together so the
            context is unambiguous. */}
        <div className="mb-12 flex flex-col items-center gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            {t.fitmentStrip.label}
          </p>
          <div className="flex items-center gap-3">
            {oemLogos.map((logo) => (
              <div
                key={logo.brand}
                className="flex h-10 w-24 items-center justify-center rounded-[8px] bg-[var(--cream)] px-3 opacity-85"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.src}
                  alt={`${logo.brand} (fitment reference)`}
                  loading="lazy"
                  className="h-5 w-auto max-w-full object-contain"
                />
              </div>
            ))}
          </div>
          <FitmentDisclaimer t={t} />
        </div>

        <p className="eyebrow text-center">{t.categories.eyebrow}</p>
        <h2 className="font-display mt-3 text-center text-display-2 font-bold text-[var(--ink)]">
          {t.showcase.title}
        </h2>
        <p className="mt-3 text-center text-[var(--muted)]">{t.showcase.subtitle}</p>

        <div className="mt-9 flex flex-wrap justify-center gap-2">
          {groups.map((bike, idx) => (
            <button
              key={`${bike.brand}-${bike.model}`}
              onClick={() => setActiveIdx(idx)}
              className={`min-h-10 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                idx === activeIdx
                  ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                  : "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]/85 hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
              }`}
            >
              {bike.brand} {bike.model}
            </button>
          ))}
        </div>

        {active?.catalogHref && (
          <div className="mt-5 text-center">
            <Link
              href={active.catalogHref}
              className="text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
            >
              {t.showcase.viewCatalog} →
            </Link>
          </div>
        )}

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {active?.parts.map((part) => (
            <PartCard key={part.id} part={part} />
          ))}
        </div>

        <div className="mt-10">
          <FitmentDisclaimer t={t} />
        </div>
      </div>
    </section>
  );
}
