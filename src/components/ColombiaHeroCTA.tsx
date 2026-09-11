import Link from "next/link";
import { whatsappLink } from "@/lib/config";

// Colombia is the site's live lane (analytics show it's where the real
// browsing is). This block foregrounds the Hero-fitment opportunity while
// keeping Bajaj/TVS, and its WhatsApp CTA is pre-filled with a bulk Hero
// enquiry so a distributor converts in one tap. Trademark-safe throughout
// ("Hero-fitment" / OEM-pattern, never "genuine Hero"); no fabricated market
// figures — the growth angle is the true aftermarket logic (an ageing fleet
// drives replacement-parts demand). The wa.me click is picked up by the
// site's analytics listener, so these conversions show in /insights.

type Locale = "en" | "es";

const COPY: Record<
  Locale,
  { eyebrow: string; heading: string; body: string; cta: string; wa: string; secondary: string }
> = {
  en: {
    eyebrow: "Colombia · early-mover opportunity",
    heading: "Get ahead on Hero-fitment parts",
    body: "Hero, Bajaj and TVS are among the most common Indian-made motorcycles on Colombian roads — and as that fleet ages, replacement-parts demand only grows. Stock OEM-pattern, Hero-fitment spare parts now and hold the early-mover position in your city. Bajaj and TVS ranges ship on the same container, at factory-direct FOB/CIF pricing.",
    cta: "Build a Hero bulk order on WhatsApp",
    wa: "Hi Raznova, I'm a distributor in Colombia. I'd like to import OEM-pattern Hero-fitment spare parts in bulk — and Bajaj/TVS too. Please send your catalogue and FOB/CIF pricing for my market.",
    secondary: "See the full Hero-fitment catalogue — 11,251 references",
  },
  es: {
    eyebrow: "Colombia · ventaja de ser el primero",
    heading: "Adelántese con repuestos con fitment Hero",
    body: "Los modelos Hero, Bajaj y TVS están entre las motos indias más comunes en las vías de Colombia, y a medida que ese parque envejece, la demanda de repuestos solo crece. Importe ahora repuestos con fitment Hero (patrón OEM / compatibles) y tome la ventaja de ser el primero en su ciudad. También surtimos Bajaj y TVS en el mismo contenedor, con precios FOB/CIF directos de fábrica.",
    cta: "Arme un pedido Hero al por mayor por WhatsApp",
    wa: "Hola Raznova. Soy distribuidor en Colombia. Quiero importar al por mayor repuestos con fitment Hero (patrón OEM / compatibles), y también Bajaj y TVS. ¿Me envían catálogo y precios FOB/CIF para mi mercado?",
    secondary: "Ver el catálogo completo con fitment Hero — 11.251 referencias",
  },
};

/** Conversion block for the Colombia lane. No data-reveal on purpose: this is
 *  the primary CTA, so it must always be visible, never gated on the scroll
 *  observer. */
export default function ColombiaHeroCTA({
  locale,
  heroHref,
}: {
  locale: Locale;
  heroHref: string;
}) {
  const c = COPY[locale];
  return (
    <section className="mt-8 rounded-[var(--radius-md)] border border-[var(--accent)]/40 bg-[var(--accent-soft)] p-6 md:p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        {c.eyebrow}
      </p>
      <h2 className="font-display mt-2 text-display-3 font-bold text-[var(--ink)]">{c.heading}</h2>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[var(--ink)]/80">{c.body}</p>
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <a
          href={whatsappLink(c.wa)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center gap-2.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-7 py-3.5 text-base font-semibold text-[var(--accent-ink)] transition-transform duration-200 hover:scale-[1.02]"
        >
          {c.cta}
        </a>
        <Link
          href={heroHref}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
        >
          {c.secondary} →
        </Link>
      </div>
    </section>
  );
}
