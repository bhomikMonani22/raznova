"use client";

import { useState } from "react";
import Link from "next/link";
import type { ShowcasePart, CatalogEntry } from "@/lib/types";
import type { Locale } from "@/i18n/locales";
import type { Translations } from "@/i18n/translations";
import { FEATURED_BIKES } from "@/lib/featuredBikes";
import PartCard from "./PartCard";
import FitmentDisclaimer from "./FitmentDisclaimer";

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
    ? catalogs.find((c) => c.brand === active.brand && c.model === active.catalogModel)
    : undefined;

  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold text-slate-900">{t.showcase.title}</h2>
        <p className="mt-2 text-center text-slate-600">{t.showcase.subtitle}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {FEATURED_BIKES.map((bike, idx) => (
            <button
              key={`${bike.brand}-${bike.model}`}
              onClick={() => setActiveIdx(idx)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                idx === activeIdx
                  ? "bg-orange-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
              className="text-sm font-medium text-orange-600 hover:underline"
            >
              {t.showcase.viewCatalog} →
            </Link>
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {parts.map((part) => (
            <PartCard key={part.id} part={part} locale={locale} t={t} />
          ))}
        </div>

        <div className="mt-8">
          <FitmentDisclaimer t={t} />
        </div>
      </div>
    </section>
  );
}
