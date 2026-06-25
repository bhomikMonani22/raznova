"use client";

import { useState } from "react";
import type { CatalogEntry } from "@/lib/types";
import type { Translations } from "@/i18n/translations";
import FitmentDisclaimer from "./FitmentDisclaimer";

export default function CatalogList({
  entries,
  t,
}: {
  entries: CatalogEntry[];
  t: Translations;
}) {
  const models = Array.from(new Set(entries.map((e) => e.model))).sort();
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
    selected.size === 0 ? entries : entries.filter((e) => selected.has(e.model));

  return (
    <div>
      {models.length > 1 && (
        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold text-slate-700">{t.catalog.filterByModel}</p>
          <div className="flex flex-wrap gap-2">
            {models.map((model) => (
              <label
                key={model}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                  selected.has(model)
                    ? "border-orange-600 bg-orange-50 text-orange-700"
                    : "border-slate-300 text-slate-600"
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
                className="rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-500"
              >
                {t.catalog.clearFilter}
              </button>
            )}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-slate-500">{t.catalog.noResults}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="font-semibold text-slate-900">{entry.model}</p>
                <p className="mt-1 text-sm text-slate-500">{entry.title}</p>
                <div className="mt-4 flex gap-3">
                  <a
                    href={entry.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700"
                  >
                    {t.catalog.viewPdf}
                  </a>
                  <a
                    href={entry.pdf_url}
                    download
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {t.catalog.download}
                  </a>
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="mt-8">
        <FitmentDisclaimer t={t} />
      </div>
    </div>
  );
}
