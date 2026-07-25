import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { Translations } from "@/i18n/translations";
import { LANDINGS } from "@/lib/landings";
import SectionHeading from "./SectionHeading";

/** Crawlable prose block: the rest of the homepage is imagery, motion and
 * short display copy, so this carries the indexable text that states who we
 * are, what we export and where we ship. It is also the homepage's link hub
 * into the Phase-3 landing pages, giving each of them a link from the
 * site's strongest page. Server component. */
export default function AboutBlock({ locale, t }: { locale: Locale; t: Translations }) {
  return (
    <section className="border-t border-[var(--line)] px-5 py-20 md:py-28">
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow={t.about.eyebrow} title={t.about.title} align="left" />

        <div className="mt-8 space-y-5">
          {t.about.paragraphs.map((p, i) => (
            <p
              key={i}
              data-reveal
              style={{ "--reveal-i": i } as React.CSSProperties}
              className="text-[15px] leading-relaxed text-[var(--muted)]"
            >
              {p}
            </p>
          ))}
        </div>

        <p className="mt-12 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          {t.about.linksTitle}
        </p>
        <ul className="mt-4 flex flex-wrap gap-2.5">
          {LANDINGS.map((landing) => (
            <li key={landing.slug}>
              <Link
                href={`/${landing.slug}`}
                className="inline-flex min-h-10 items-center rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)]/85 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {landing.h1}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={`/${locale}/quote`}
              className="inline-flex min-h-10 items-center rounded-full border border-[var(--accent)]/50 bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/20"
            >
              {t.nav.requestQuote}
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
