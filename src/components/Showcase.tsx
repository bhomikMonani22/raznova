"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { ShowcasePart, CatalogEntry } from "@/lib/types";
import type { Locale } from "@/i18n/locales";
import type { Translations } from "@/i18n/translations";
import { FEATURED_BIKES } from "@/lib/featuredBikes";
import PartCard from "./PartCard";
import FitmentDisclaimer from "./FitmentDisclaimer";
import { getOemLogo } from "@/lib/brandLogos";
import { fadeUp, staggerContainer } from "@/lib/motion";

const OEM_BRANDS = ["Hero", "Bajaj", "TVS"] as const;

export default function Showcase({
  locale,
  t,
  showcase,
  catalogs,
}: {
  locale: Locale;
  t: Translations;
  showcase: ShowcasePart[];
  catalogs: CatalogEntry[];
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = FEATURED_BIKES[activeIdx];

  const parts = showcase
    .filter((p) => p.brand === active.brand && p.model === active.model)
    .sort((a, b) => a.sort_order - b.sort_order);

  const catalogMatch = active.catalogModel
    ? catalogs.find(
        (c) => c.catalog_type === "vehicle" && c.brand === active.brand && c.model === active.catalogModel
      )
    : undefined;

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
            {OEM_BRANDS.map((brand) => {
              const logo = getOemLogo(brand);
              if (!logo) return null;
              return (
                <div
                  key={brand}
                  className="flex h-10 w-24 items-center justify-center rounded-[8px] bg-[var(--cream)] px-3 opacity-85"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo}
                    alt={`${brand} (fitment reference)`}
                    loading="lazy"
                    className="h-5 w-auto max-w-full object-contain"
                  />
                </div>
              );
            })}
          </div>
          <FitmentDisclaimer t={t} />
        </div>

        <p className="eyebrow text-center">{t.catalog.title}</p>
        <h2 className="font-display mt-3 text-center text-display-2 font-bold text-[var(--ink)]">
          {t.showcase.title}
        </h2>
        <p className="mt-3 text-center text-[var(--muted)]">{t.showcase.subtitle}</p>

        <div className="mt-9 flex flex-wrap justify-center gap-2">
          {FEATURED_BIKES.map((bike, idx) => (
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

        {catalogMatch && (
          <div className="mt-5 text-center">
            <Link
              href={`/${locale}/catalog/${catalogMatch.vehicle_type}/${encodeURIComponent(catalogMatch.brand)}`}
              className="text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
            >
              {t.showcase.viewCatalog} →
            </Link>
          </div>
        )}

        <motion.div
          key={activeIdx}
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.05)}
          className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {parts.map((part) => (
            <motion.div key={part.id} variants={fadeUp}>
              <PartCard part={part} locale={locale} />
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-10">
          <FitmentDisclaimer t={t} />
        </div>
      </div>
    </section>
  );
}
