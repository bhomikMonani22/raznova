import type { Translations } from "@/i18n/translations";
import SectionHeading from "./SectionHeading";

/** Server component — reveal via the shared [data-reveal] observer. */
export default function MarketsServed({ t }: { t: Translations }) {
  const regions = [
    { title: t.markets.latamTitle, body: t.markets.latamBody },
    { title: t.markets.africaTitle, body: t.markets.africaBody },
  ];

  return (
    <section className="border-t border-[var(--line)] px-5 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="LatAm · Africa" title={t.markets.title} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {regions.map((region, i) => (
            <div
              key={region.title}
              data-reveal
              style={{ "--reveal-i": i } as React.CSSProperties}
              className="card-surface p-8 text-center"
            >
              <h3 className="font-display text-display-3 font-bold text-[var(--accent)]">
                {region.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{region.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
