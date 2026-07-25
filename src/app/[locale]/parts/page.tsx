import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getTranslations } from "@/i18n/translations";
import showcase from "@/data/showcase.json";
import catalogs from "@/data/catalogs.json";
import type { CatalogEntry, ShowcasePart } from "@/lib/types";
import { FEATURED_BIKES } from "@/lib/featuredBikes";
import { PARTS_META, canonical, languageAlternates, SITE_URL } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { webPage, breadcrumbs } from "@/lib/schema";
import FitmentDisclaimer from "@/components/FitmentDisclaimer";

// The homepage showcase only renders the active tab, so 225 of our 254 part
// names never reach the HTML. This page is the crawlable, text-first index
// of the complete range — genuinely useful as a buyer reference list, and it
// makes every part name indexable without loading 254 images.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const meta = PARTS_META[locale];
  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: {
      canonical: canonical(locale, "/parts"),
      languages: languageAlternates("/parts"),
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonical(locale, "/parts"),
    },
  };
}

export default async function PartsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getTranslations(locale);
  const meta = PARTS_META[locale];

  const parts = showcase as ShowcasePart[];
  const all = catalogs as CatalogEntry[];

  const groups = FEATURED_BIKES.map((bike) => {
    const match = bike.catalogModel
      ? all.find(
          (c) =>
            c.catalog_type === "vehicle" &&
            c.brand === bike.brand &&
            c.model === bike.catalogModel
        )
      : undefined;
    return {
      brand: bike.brand,
      model: bike.model,
      catalogHref: match
        ? `/${locale}/catalog/${match.vehicle_type}/${encodeURIComponent(match.brand)}`
        : null,
      items: parts
        .filter((p) => p.brand === bike.brand && p.model === bike.model)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((p) => ({
          id: p.id,
          category: p.category,
          description: locale === "es" ? p.description_es : p.description_en,
        })),
    };
  });

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <JsonLd data={webPage(locale, "/parts", meta.title, meta.description)} />
      <JsonLd
        data={breadcrumbs([
          { name: t.nav.home, url: `${SITE_URL}/${locale}` },
          { name: t.partsIndex.title, url: `${SITE_URL}/${locale}/parts` },
        ])}
      />

      <Breadcrumbs items={[{ name: t.nav.home, href: `/${locale}` }, { name: t.partsIndex.title }]} />

      <header className="mt-6">
        <p className="eyebrow">{t.partsIndex.eyebrow}</p>
        <h1 className="font-display mt-3 text-display-2 font-bold text-[var(--ink)]">
          {t.partsIndex.title}
        </h1>
        <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-[var(--muted)]">
          {t.partsIndex.lead}
        </p>
        <p className="font-mono-credentials mt-4 text-xs text-[var(--accent)]">
          {total} {t.partsIndex.partsFor}
        </p>
      </header>

      <div className="mt-12 space-y-12">
        {groups.map((group) => (
          <section key={`${group.brand}-${group.model}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--line)] pb-3">
              <h2 className="font-display text-display-3 font-bold text-[var(--ink)]">
                {group.brand} {group.model} — {t.partsIndex.partsFor}
              </h2>
              {group.catalogHref && (
                <Link
                  href={group.catalogHref}
                  className="text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                >
                  {t.partsIndex.viewCatalogue} →
                </Link>
              )}
            </div>
            <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <li key={item.id} className="text-sm leading-relaxed text-[var(--muted)]">
                  <span className="text-[var(--ink)]/90">{item.description}</span>
                  {item.category !== item.description && (
                    <span className="text-[var(--muted)]"> · {item.category}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-14 max-w-3xl text-[15px] leading-relaxed text-[var(--muted)]">
        {t.partsIndex.note}
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href={`/${locale}/quote`}
          className="inline-flex min-h-12 items-center rounded-[var(--radius-md)] bg-[var(--accent)] px-7 py-3.5 text-base font-semibold text-[var(--accent-ink)]"
        >
          {t.nav.requestQuote}
        </Link>
        <Link
          href={`/${locale}#showcase`}
          className="inline-flex min-h-12 items-center rounded-[var(--radius-md)] border border-[var(--line-strong)] px-7 py-3.5 text-base font-semibold text-[var(--ink)] transition-colors hover:border-[var(--ink)]/40"
        >
          {t.showcase.title}
        </Link>
      </div>

      <div className="mt-12">
        <FitmentDisclaimer t={t} />
      </div>
    </div>
  );
}
