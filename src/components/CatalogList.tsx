"use client";

import { useState } from "react";
import type { CatalogEntry } from "@/lib/types";
import type { Translations } from "@/i18n/translations";
import FitmentDisclaimer from "./FitmentDisclaimer";

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
        <div className="mb-8">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            {t.catalog.filterByModel}
          </p>
          <div className="flex flex-wrap gap-2">
            {models.map((model) => (
              <label
                key={model}
                className={`min-h-10 cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors duration-200 ${
                  selected.has(model)
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
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
                className="min-h-10 rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((entry, i) => (
              <div
                key={entry.id}
                data-reveal
                style={{ "--reveal-i": i % 3 } as React.CSSProperties}
                className="flex flex-col card-surface p-5 transition-transform duration-300 hover:-translate-y-1"
              >
                <p className="font-display font-bold text-[var(--ink)]">
                  {entry.model ?? entry.brand}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">{entry.title}</p>
                <div className="mt-5 flex gap-3">
                  <a
                    href={entry.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)] transition-transform duration-200 hover:scale-[1.02]"
                  >
                    {t.catalog.viewPdf}
                  </a>
                  <a
                    href={entry.pdf_url}
                    download
                    className="rounded-[var(--radius-md)] border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--ink)]/85 transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
                  >
                    {t.catalog.download}
                  </a>
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="mt-10">
        <FitmentDisclaimer t={t} />
      </div>
    </div>
  );
}
