import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { Translations } from "@/i18n/translations";
import {
  BRAND_NAME,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  IEC,
  GSTIN,
  whatsappLink,
  mailtoLink,
  telLink,
} from "@/lib/config";
import catalogs from "@/data/catalogs.json";
import type { CatalogEntry } from "@/lib/types";
import { LANDINGS } from "@/lib/landings";

// The header's brand dropdowns only render once opened, so their links are
// absent from the server HTML. This footer carries the site's real
// navigational link graph instead: every catalog, aftermarket-brand and
// landing page is reachable from every page, for crawlers and for users.
function navGroups(locale: Locale) {
  const all = catalogs as CatalogEntry[];

  const vehicleBrands = Array.from(
    new Set(all.filter((c) => c.catalog_type === "vehicle").map((c) => c.brand))
  ).sort();
  const partBrands = Array.from(
    new Set(all.filter((c) => c.catalog_type === "brand").map((c) => c.brand))
  ).sort();

  const vehicleLinks = vehicleBrands.map((brand) => {
    const entry = all.find((c) => c.catalog_type === "vehicle" && c.brand === brand)!;
    return {
      label: brand,
      href: `/${locale}/catalog/${entry.vehicle_type}/${encodeURIComponent(brand)}`,
    };
  });

  const partLinks = partBrands.map((brand) => ({
    label: brand,
    href: `/${locale}/brands/${encodeURIComponent(brand)}`,
  }));

  // Landing pages are English-only; link them from the /en tree only.
  const countryLandings = LANDINGS.filter((l) => l.slug.startsWith("motorcycle-spare-parts-") && l.slug !== "motorcycle-spare-parts-exporter-india");
  const rangeLandings = LANDINGS.filter((l) => !countryLandings.includes(l));

  return { vehicleLinks, partLinks, countryLandings, rangeLandings };
}

export default function Footer({ locale, t }: { locale: Locale; t: Translations }) {
  const { vehicleLinks, partLinks, countryLandings, rangeLandings } = navGroups(locale);
  const showLandings = locale === "en";

  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--bg)]">
      <div className="mx-auto max-w-6xl px-5 py-12 text-sm text-[var(--muted)]">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <p className="font-display flex items-center gap-2.5 text-lg font-bold text-[var(--ink)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/raznova-mark-96.png"
                alt=""
                width={26}
                height={26}
                loading="lazy"
                className="h-[26px] w-[26px]"
              />
              {BRAND_NAME}
              <span className="-ml-2.5 text-[var(--accent)]">.</span>
            </p>
            <p className="mt-2 max-w-sm leading-relaxed">{t.footer.regions}</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <Link
              href={`/${locale}/quote`}
              className="font-medium text-[var(--accent)] transition-colors hover:text-[var(--ink)]"
            >
              {t.nav.requestQuote}
            </Link>
            <a
              href={whatsappLink("Hi Raznova, I'd like a quote.")}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--ink)]"
            >
              {t.quote.whatsappButton}
            </a>
            <a href={mailtoLink("Quote Request")} className="transition-colors hover:text-[var(--ink)]">
              {CONTACT_EMAIL}
            </a>
            <a
              href={telLink()}
              className="transition-colors hover:text-[var(--ink)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {CONTACT_PHONE_DISPLAY}
            </a>
          </div>
        </div>

        {/* Navigational link graph — crawlable on every page. */}
        <nav
          aria-label="Footer"
          className="mt-10 grid gap-8 border-t border-[var(--line)] pt-10 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink)]/70">
              {t.nav.motorcycle}
            </p>
            <ul className="mt-3 space-y-2">
              {vehicleLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-[var(--accent)]">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={`/${locale}/parts`}
                  className="font-medium text-[var(--ink)]/85 transition-colors hover:text-[var(--accent)]"
                >
                  {t.partsIndex.linkLabel}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink)]/70">
              {t.nav.partBrands}
            </p>
            <ul className="mt-3 space-y-2">
              {partLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-[var(--accent)]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {showLandings && (
            <>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink)]/70">
                  Fitment ranges
                </p>
                <ul className="mt-3 space-y-2">
                  {rangeLandings.map((l) => (
                    <li key={l.slug}>
                      <Link
                        href={`/${l.slug}`}
                        className="transition-colors hover:text-[var(--accent)]"
                      >
                        {l.h1}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink)]/70">
                  Export markets
                </p>
                <ul className="mt-3 space-y-2">
                  {countryLandings.map((l) => (
                    <li key={l.slug}>
                      <Link
                        href={`/${l.slug}`}
                        className="transition-colors hover:text-[var(--accent)]"
                      >
                        {l.h1}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </nav>

        {/* Credentials line — every page, mono, perfectly aligned. */}
        <div className="mt-10 border-t border-[var(--line)] pt-6">
          <p className="font-mono-credentials text-xs leading-6 text-[var(--muted)]">
            Raznova Exports · A unit of Shrinath Ji Enterprises · IEC: {IEC} · GSTIN: {GSTIN} ·{" "}
            {CONTACT_EMAIL} · {CONTACT_PHONE_DISPLAY} · Pune, India
          </p>
          <p className="mt-3 text-xs text-[var(--muted)]/80">{t.footer.disclaimer}</p>
          <p className="mt-1 text-xs text-[var(--muted)]/80">
            © {new Date().getFullYear()} {BRAND_NAME} Exports. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
