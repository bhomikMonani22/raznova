"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { CatalogEntry } from "@/lib/types";
import type { Translations } from "@/i18n/translations";
import FitmentDisclaimer from "./FitmentDisclaimer";
import { fadeUp, staggerContainer, cardHover } from "@/lib/motion";

// Shared list-of-PDFs renderer used by both the vehicle brand catalog route
// (catalog/[vehicleType]/[brand]) and the aftermarket brand route
// (brands/[brand]). Filters by model when entries carry more than one
// distinct model/title — brand catalogs with a single PDF (most aftermarket
// brands) skip the filter UI entirely since there's nothing to filter.
export default function CatalogList({
  entries,
  t,
}: {
  entries: CatalogEntry[];
  t: Translations;
}) {
  const models = Array.from(
    new Set(entries.map((e) => e.model ?? e.title))
  ).sort();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(model: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(model)) next.delete(model);
      else next.add(model);
      return next;
    });
  }

  const filtered =
    selected.size === 0
      ? entries
      : entries.filter((e) => selected.has(e.model ?? e.title));

  return (
    <div>
      {models.length > 1 && (
        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold text-[var(--ink)]">{t.catalog.filterByModel}</p>
          <div className="flex flex-wrap gap-2">
            {models.map((model) => (
              <label
                key={model}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors ${
                  selected.has(model)
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-[var(--line)] text-[var(--muted)]"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selected.has(model)}
                  onChange={() => toggle(model)}
                />
                {model}
              </label>
            ))}
            {selected.size > 0 && (
              <button
                onClick={() => setSelected(new Set())}
                className="rounded-full border border-[var(--line)] px-3 py-1 text-sm text-[var(--muted)]"
              >
                {t.catalog.clearFilter}
              </button>
            )}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-[var(--muted)]">{t.catalog.noResults}</p>
      ) : (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer(0.07)}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((entry) => (
              <motion.div
                key={entry.id}
                variants={fadeUp}
                initial="rest"
                whileHover="hover"
                animate="rest"
                {...cardHover}
                className="flex flex-col card-surface p-4"
              >
                <p className="font-semibold text-[var(--ink)]">{entry.model ?? entry.brand}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{entry.title}</p>
                <div className="mt-4 flex gap-3">
                  <a
                    href={entry.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-[var(--radius-md)] bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white transition-transform duration-200 hover:scale-[1.02]"
                  >
                    {t.catalog.viewPdf}
                  </a>
                  <a
                    href={entry.pdf_url}
                    download
                    className="rounded-[var(--radius-md)] border border-[var(--line)] px-3 py-1.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--bg)]"
                  >
                    {t.catalog.download}
                  </a>
                </div>
              </motion.div>
            ))}
        </motion.div>
      )}

      <div className="mt-8">
        <FitmentDisclaimer t={t} />
      </div>
    </div>
  );
}
