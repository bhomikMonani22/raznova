import Link from "next/link";
import { whatsappLink } from "@/lib/config";
import { getOemLogo } from "@/lib/brandLogos";

// Homepage spotlight that makes the Hero-fitment range the star of the site
// while Bajaj/TVS stay available elsewhere. Server component — the motion is
// CSS-only (glow, ring, count-up, sheen) so there's no hydration cost and the
// mobile performance budget holds. Trademark-safe throughout: "Hero-fitment"
// language only, and the Hero OEM logo carries a fitment-reference caption
// (the one context brandLogos.ts permits it in). Copy is self-contained per
// locale; en-ZA reuses the English copy.

type Locale = "en" | "es";

// Real Hero model names, referenced for fitment identification only.
const HERO_MODELS = [
  "Splendor",
  "HF Deluxe",
  "Passion Pro",
  "Super Splendor",
  "Glamour",
  "Xtreme 160R",
  "Xpulse 200",
  "Karizma",
  "Destini 125",
  "Maestro Edge",
  "Pleasure+",
  "Xtreme 125R",
];

const COPY: Record<
  Locale,
  {
    eyebrow: string;
    heading: string;
    accent: string;
    refsLabel: string;
    body: string;
    cta: string;
    wa: string;
    browse: string;
    fitmentCaption: string;
    modelsLabel: string;
  }
> = {
  en: {
    eyebrow: "Featured range · Hero-fitment",
    heading: "The widest Hero-fitment range we export",
    accent: "Hero",
    refsLabel: "Hero-fitment part references, export-ready",
    body: "Splendor, HF Deluxe, Passion, Glamour, Xtreme, Xpulse and more — engine, clutch, brake, electrical and body service parts across the Hero platforms your market rides most. OEM-pattern and aftermarket compatible, at factory-direct FOB/CIF pricing. Bajaj and TVS ship on the same container.",
    cta: "Get Hero pricing on WhatsApp",
    wa: "Hi Raznova, I'd like to import OEM-pattern Hero-fitment spare parts in bulk. Please send your Hero catalogue and FOB/CIF pricing for my market.",
    browse: "Browse the full Hero catalogue",
    fitmentCaption: "Hero logo shown for fitment reference · Raznova is an independent exporter, not affiliated with Hero MotoCorp",
    modelsLabel: "Coverage across Hero models",
  },
  es: {
    eyebrow: "Gama destacada · fitment Hero",
    heading: "La gama con fitment Hero más amplia que exportamos",
    accent: "Hero",
    refsLabel: "referencias con fitment Hero, listas para exportar",
    body: "Splendor, HF Deluxe, Passion, Glamour, Xtreme, Xpulse y más — repuestos de motor, embrague, frenos, eléctricos y carrocería para las plataformas Hero que más se mueven en su mercado. Patrón OEM y compatibles, con precios FOB/CIF directos de fábrica. Bajaj y TVS viajan en el mismo contenedor.",
    cta: "Cotizar Hero por WhatsApp",
    wa: "Hola Raznova, quiero importar al por mayor repuestos con fitment Hero (patrón OEM). ¿Me envían el catálogo Hero y precios FOB/CIF para mi mercado?",
    browse: "Ver el catálogo completo de Hero",
    fitmentCaption: "Logo Hero mostrado como referencia de compatibilidad · Raznova es un exportador independiente, no afiliado a Hero MotoCorp",
    modelsLabel: "Cobertura en modelos Hero",
  },
};

export default function HeroSpotlight({ locale }: { locale: string }) {
  const c = COPY[locale === "es" ? "es" : "en"];
  const heroHref = `/${locale}/catalog/motorcycle/Hero`;
  const logo = getOemLogo("Hero");
  // Duplicate the model list so the marquee scrolls seamlessly (-50%).
  const marquee = [...HERO_MODELS, ...HERO_MODELS];

  return (
    <section className="px-5 py-16 md:py-24">
      <div
        data-reveal
        className="hero-spotlight mx-auto max-w-6xl rounded-[var(--radius-lg)] border border-[var(--accent)]/25 bg-[var(--surface)]/70 p-7 md:p-12"
      >
        <div className="grid items-center gap-10 md:grid-cols-[1.15fr_1fr]">
          {/* Left: message + CTAs */}
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              {c.eyebrow}
            </p>
            <h2 className="font-display mt-3 text-display-2 font-bold leading-[1.05] text-[var(--ink)]">
              {c.heading}
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
              {c.body}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <a
                href={whatsappLink(c.wa)}
                target="_blank"
                rel="noopener noreferrer"
                className="spotlight-cta inline-flex min-h-12 items-center gap-2.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-7 py-3.5 text-base font-semibold text-[var(--accent-ink)] transition-transform duration-200 hover:scale-[1.02]"
              >
                {c.cta}
              </a>
              <Link
                href={heroHref}
                className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
              >
                {c.browse} →
              </Link>
            </div>
          </div>

          {/* Right: animated count-up + logo */}
          <div className="relative flex flex-col items-center gap-5 text-center">
            <div className="spotlight-ring relative inline-flex items-center justify-center rounded-full px-4 py-2">
              <span
                data-countup="11251"
                className="font-display text-[3.4rem] font-bold leading-none text-[var(--ink)] md:text-[4.5rem]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                11,251
              </span>
            </div>
            <p className="max-w-[16rem] text-sm text-[var(--muted)]">{c.refsLabel}</p>

            {logo && (
              <span className="mt-1 flex flex-col items-center gap-2">
                <span className="flex h-9 items-center justify-center rounded-[8px] bg-[var(--cream)] px-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo}
                    alt="Hero (fitment reference)"
                    loading="lazy"
                    className="h-5 w-auto max-w-24 object-contain"
                  />
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Hero model marquee */}
        <div className="mt-10 border-t border-[var(--line)] pt-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            {c.modelsLabel}
          </p>
          <div className="marquee-viewport mt-3 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
            <div className="marquee-track gap-2.5">
              {marquee.map((m, i) => (
                <span
                  key={`${m}-${i}`}
                  className="whitespace-nowrap rounded-full border border-[var(--line)] px-3.5 py-1.5 text-sm text-[var(--ink)]/80"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-[var(--muted)]/70">{c.fitmentCaption}</p>
      </div>
    </section>
  );
}
