import Image from "next/image";
import type { Translations } from "@/i18n/translations";
import { whatsappLink, mailtoLink, IEC, GSTIN } from "@/lib/config";

const WORD_STAGGER = 0.05;

/** Full-viewport cinematic hero. Entrance choreography is pure CSS
 * (.hero-rise + per-element --rise-delay) so the headline and subtitle
 * paint at first render — LCP is never gated on hydration. Fully server
 * rendered: the magnetic CTA pull is handled by the shared boot script. */
export default function Hero({ t }: { t: Translations }) {
  const words = t.hero.title.split(" ");
  const afterHeadline = words.length * WORD_STAGGER + 0.35;

  return (
    <section className="relative -mt-16 flex min-h-[100svh] flex-col justify-end overflow-hidden">
      {/* Full-bleed warehouse photo, slow Ken Burns (CSS, transform-only,
          disabled under reduced motion via globals). */}
      <div className="absolute inset-0">
        <div className="ken-burns absolute inset-0">
          <Image
            src="/warehouse/floor-wide.jpg"
            alt="Raznova Exports warehouse in Pune with two-wheeler spare parts cartons staged for export dispatch"
            fill
            priority
            sizes="100vw"
            quality={65}
            className="object-cover"
          />
        </div>
        {/* Dark gradient: ~80% black at bottom → ~30% at top. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(5,5,6,0.88) 0%, rgba(5,5,6,0.55) 45%, rgba(5,5,6,0.34) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 pt-40 md:pb-28">
        <p
          className="eyebrow hero-rise mb-5 hidden sm:block"
          style={{ "--rise-delay": "0.05s" } as React.CSSProperties}
        >
          {t.positioning.line}
        </p>

        <h1 className="font-display max-w-4xl text-display-1 font-bold text-[var(--ink)]">
          {/* Word-by-word rise is transform-only: the full headline is
              painted (and LCP-recorded) on the first frame. */}
          {words.map((word, i) => (
            <span
              key={`${word}-${i}`}
              className="hero-rise-solid inline-block"
              style={{ "--rise-delay": `${i * WORD_STAGGER}s` } as React.CSSProperties}
            >
              {word}&nbsp;
            </span>
          ))}
        </h1>

        <p
          className="font-mono-credentials hero-rise-solid mt-5 text-[13px] tracking-wide text-[var(--muted)]"
          style={{ "--rise-delay": `${afterHeadline}s` } as React.CSSProperties}
        >
          {t.trust.iecLabel} {IEC} · {t.trust.gstinLabel} {GSTIN} · Pune, India
        </p>

        {/* This is the page's LCP element: no entrance animation and system
            font, so its paint waits on nothing but HTML + CSS (budget rule:
            perf wins). */}
        <p className="font-system mt-4 max-w-2xl text-base text-[var(--ink)]/80">
          {t.hero.subtitle}
        </p>

        <div
          className="hero-rise-solid mt-8 flex flex-wrap items-center gap-4"
          style={{ "--rise-delay": `${afterHeadline + 0.2}s` } as React.CSSProperties}
        >
          <a
              data-magnetic
              href={whatsappLink("Hi Raznova, I'd like a quote.")}
              target="_blank"
              rel="noopener noreferrer"
              className="magnetic cta-glow inline-flex min-h-12 items-center gap-2.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-7 py-3.5 text-base font-semibold text-[var(--accent-ink)]"
            >
              <WhatsAppIcon />
              {t.hero.ctaWhatsapp}
            </a>
            <a
              data-magnetic
              href={mailtoLink("Quote Request")}
              className="magnetic inline-flex min-h-12 items-center rounded-[var(--radius-md)] border border-[var(--line-strong)] px-7 py-3.5 text-base font-semibold text-[var(--ink)] transition-colors hover:border-[var(--ink)]/40"
            >
              {t.hero.ctaEmail}
            </a>
        </div>
      </div>

      {/* Thin scroll-indicator line, bottom center. */}
      <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2" aria-hidden="true">
        <div className="h-12 w-px overflow-hidden">
          <div className="scroll-hint-line h-full w-full bg-[var(--ink)]/60" />
        </div>
      </div>
    </section>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2.05 22l5.27-1.38a9.87 9.87 0 0 0 4.72 1.2h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.83 9.83 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.05-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.23 8.24Zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.16-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}
