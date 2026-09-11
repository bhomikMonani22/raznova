import Link from "next/link";
import { whatsappLink } from "@/lib/config";

// Compact secondary nudge: on the Bajaj/TVS catalogue pages and the quote
// page, invite the buyer to add a Hero line to their order. Smaller than the
// homepage spotlight / Colombia block on purpose — it's a cross-sell, not the
// main event. Trademark-safe ("Hero-fitment" / OEM-pattern), no pricing on
// the page. The wa.me click is captured by the analytics listener.

type Locale = "en" | "es";

const COPY: Record<
  Locale,
  { label: string; body: string; cta: string; wa: string; browse: string }
> = {
  en: {
    label: "Also stocking Hero?",
    body: "We export 11,251 Hero-fitment references — OEM-pattern and aftermarket compatible, factory-direct. Add a Hero line to your order.",
    cta: "Ask about Hero on WhatsApp",
    wa: "Hi Raznova, I'd also like to add OEM-pattern Hero-fitment spare parts to my order. Please send your Hero catalogue and FOB/CIF pricing.",
    browse: "Hero catalogue",
  },
  es: {
    label: "¿También surte Hero?",
    body: "Exportamos 11.251 referencias con fitment Hero — patrón OEM y compatibles, directo de fábrica. Sume una línea Hero a su pedido.",
    cta: "Consultar Hero por WhatsApp",
    wa: "Hola Raznova, también quiero agregar repuestos con fitment Hero (patrón OEM) a mi pedido. ¿Me envían el catálogo Hero y precios FOB/CIF?",
    browse: "Catálogo Hero",
  },
};

/** No data-reveal: it's a conversion element, so it must always be visible. */
export default function HeroCrossSell({ locale }: { locale: string }) {
  const c = COPY[locale === "es" ? "es" : "en"];
  const heroHref = `/${locale}/catalog/motorcycle/Hero`;

  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-5 md:flex md:items-center md:justify-between md:gap-6 md:p-6">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          {c.label}
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink)]/85">{c.body}</p>
      </div>
      <div className="mt-4 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 md:mt-0">
        <a
          href={whatsappLink(c.wa)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-ink)] transition-transform duration-200 hover:scale-[1.02]"
        >
          {c.cta}
        </a>
        <Link
          href={heroHref}
          className="inline-flex min-h-10 items-center text-sm font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
        >
          {c.browse} →
        </Link>
      </div>
    </section>
  );
}
