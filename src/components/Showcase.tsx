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
    <section id="showcase" className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        {/* OEM "Compatible fitment for:" strip — fitment reference only, never
            site identity. Logos + disclaimer text sit together so the
            context is unambiguous. */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            {t.fitmentStrip.label}
          </p>
          <div className="flex items-center gap-6">
            {OEM_BRANDS.map((brand) => {
              const logo = getOemLogo(brand);
              if (!logo) return null;
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={brand}
                  src={logo}
                  alt={`${brand} (fitment reference)`}
                  className="h-6 w-auto object-contain opacity-70 grayscale"
                />
              );
            })}
          </div>
          <FitmentDisclaimer t={t} />
        </div>

        <h2 className="font-display text-center text-display-2 font-bold text-[var(--ink)]">{t.showcase.title}</h2>
        <p className="mt-2 text-center text-[var(--muted)]">{t.showcase.subtitle}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {FEATURED_BIKES.map((bike, idx) => (
            <button
              key={`${bike.brand}-${bike.model}`}
              onClick={() => setActiveIdx(idx)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                idx === activeIdx
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--bg)]"
              }`}
            >
              {bike.brand} {bike.model}
            </button>
          ))}
        </div>

        {catalogMatch && (
          <div className="mt-4 text-center">
            <Link
              href={`/${locale}/catalog/${catalogMatch.vehicle_type}/${encodeURIComponent(catalogMatch.brand)}`}
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              {t.showcase.viewCatalog} →
            </Link>
          </div>
        )}

        <motion.div
          key={activeIdx}
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.06)}
          className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6"
        >
          {parts.map((part) => (
            <motion.div key={part.id} variants={fadeUp}>
              <PartCard part={part} locale={locale} t={t} />
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-8">
          <FitmentDisclaimer t={t} />
        </div>
      </div>
    </section>
  );
}
