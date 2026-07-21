import type { Translations } from "@/i18n/translations";
import SectionHeading from "./SectionHeading";

/** Server component — reveal via the shared [data-reveal] observer,
 * hover lift via CSS. No client JS. */
export default function WhyRaznova({ t }: { t: Translations }) {
  const cards = [
    { title: t.whyRaznova.sourcingTitle, body: t.whyRaznova.sourcingBody },
    { title: t.whyRaznova.workhorseTitle, body: t.whyRaznova.workhorseBody },
    { title: t.whyRaznova.moqTitle, body: t.whyRaznova.moqBody },
    { title: t.whyRaznova.termsTitle, body: t.whyRaznova.termsBody },
  ];

  return (
    <section className="px-5 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Raznova" title={t.whyRaznova.title} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <div
              key={card.title}
              data-reveal
              style={{ "--reveal-i": i } as React.CSSProperties}
              className="card-surface flex flex-col p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="font-mono-credentials text-xs text-[var(--accent)]" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display mt-3 text-lg font-bold text-[var(--ink)]">{card.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted)]">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
