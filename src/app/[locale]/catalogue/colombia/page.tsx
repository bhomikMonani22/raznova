import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getTranslations } from "@/i18n/translations";
import catalogue from "@/data/colombiaCatalogue.json";
import { CATALOGUE_META, canonical, languageAlternates, SITE_URL } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import { webPage, breadcrumbs } from "@/lib/schema";
import FitmentDisclaimer from "@/components/FitmentDisclaimer";

type CatalogueItem = {
  partNo: string;
  descEs: string;
  descEn: string;
  category: string;
  models: string[];
};

// Part-number-level catalogue for the Colombian lane, built from our own
// Colombian order and RFQ sheets. Part numbers are reproduced exactly as
// they appear there — never generated — and no pricing is published.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const meta = CATALOGUE_META[locale];
  const path = "/catalogue/colombia";
  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: {
      canonical: canonical(locale, path),
      languages: languageAlternates(path),
    },
    openGraph: { title: meta.title, description: meta.description, url: canonical(locale, path) },
  };
}

// Category labels are stored in English in the data; a Spanish-facing
// catalogue should show them in Spanish.
const CATEGORY_ES: Record<string, string> = {
  Engine: "Motor",
  Brakes: "Frenos",
  "Clutch & transmission": "Embrague y transmisión",
  "Cables & controls": "Cables y mandos",
  "Filters & service": "Filtros y mantenimiento",
  "Electricals & lighting": "Eléctricos e iluminación",
  "Drive & sprockets": "Transmisión final y piñones",
  "Steering & chassis": "Dirección y chasis",
  Exhaust: "Escape",
  "Other components": "Otros componentes",
};

/** Order models by how much of the range they cover, so the platforms a
 * Colombian distributor sells most sit at the top. */
function groupByModel(items: CatalogueItem[]) {
  const map = new Map<string, CatalogueItem[]>();
  for (const item of items) {
    for (const model of item.models) {
      const list = map.get(model) ?? [];
      list.push(item);
      map.set(model, list);
    }
  }
  return [...map.entries()]
    .map(([model, list]) => ({
      model,
      items: list.sort(
        (a, b) => a.category.localeCompare(b.category) || a.partNo.localeCompare(b.partNo)
      ),
    }))
    .sort((a, b) => b.items.length - a.items.length || a.model.localeCompare(b.model));
}

export default async function ColombiaCataloguePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getTranslations(locale);
  const meta = CATALOGUE_META[locale];

  const items = catalogue as CatalogueItem[];
  const groups = groupByModel(items);
  const isEs = locale === "es";

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <JsonLd data={webPage(locale, "/catalogue/colombia", meta.title, meta.description)} />
      <JsonLd
        data={breadcrumbs([
          { name: t.nav.home, url: `${SITE_URL}/${locale}` },
          { name: t.catalogue.title, url: `${SITE_URL}/${locale}/catalogue/colombia` },
        ])}
      />

      <Breadcrumbs items={[{ name: t.nav.home, href: `/${locale}` }, { name: t.catalogue.title }]} />

      <header className="mt-6">
        <p className="eyebrow">{t.catalogue.eyebrow}</p>
        <h1 className="font-display mt-3 text-display-2 font-bold text-[var(--ink)]">
          {t.catalogue.title}
        </h1>
        <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-[var(--muted)]">
          {t.catalogue.lead}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--muted)]/85">
          {t.catalogue.note}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <p className="font-mono-credentials text-xs text-[var(--accent)]">
            {items.length} {t.catalogue.partsCount}
          </p>
          <a
            href="/catalogue/raznova-export-parts-catalogue.pdf"
            download
            className="inline-flex min-h-10 items-center rounded-[var(--radius-md)] border border-[var(--accent)]/60 bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/20"
          >
            {t.catalogue.downloadPdf}
          </a>
          <a
            href="/catalogue/raznova-hero-fitment-colombia.csv"
            download
            className="inline-flex min-h-10 items-center rounded-[var(--radius-md)] border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {t.catalogue.download}
          </a>
          <Link
            href={`/${locale}/quote`}
            className="inline-flex min-h-10 items-center rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)]"
          >
            {t.nav.requestQuote}
          </Link>
        </div>
      </header>

      <div className="mt-12 space-y-12">
        {groups.map((group) => (
          <section key={group.model}>
            <h2 className="font-display border-b border-[var(--line)] pb-3 text-display-3 font-bold text-[var(--ink)]">
              {group.model}
              <span className="ml-3 font-mono-credentials text-xs font-normal text-[var(--muted)]">
                {group.items.length}
              </span>
            </h2>

            {/* Wide tables scroll inside their own container so the page
                never scrolls sideways on a phone. */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                    <th scope="col" className="py-2 pr-4 font-semibold">
                      {t.catalogue.partNo}
                    </th>
                    <th scope="col" className="py-2 pr-4 font-semibold">
                      {t.catalogue.description}
                    </th>
                    <th scope="col" className="py-2 pr-4 font-semibold">
                      {t.catalogue.fits}
                    </th>
                    <th scope="col" className="py-2 font-semibold">
                      {t.catalogue.category}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {group.items.map((item) => (
                    <tr key={`${group.model}-${item.partNo}`} className="align-top">
                      <td className="py-2.5 pr-4">
                        <span className="font-mono-credentials text-[13px] text-[var(--ink)]">
                          {item.partNo}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-[var(--ink)]/90">
                          {isEs ? item.descEs : item.descEn}
                        </span>
                        <span className="block text-xs text-[var(--muted)]">
                          {isEs ? item.descEn : item.descEs}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-[var(--muted)]">{item.models.join(", ")}</td>
                      <td className="py-2.5 text-[var(--muted)]">
                        {isEs ? CATEGORY_ES[item.category] ?? item.category : item.category}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      {/* Other brands: real catalogues that exist on the site today. */}
      <section className="mt-14 card-surface p-6">
        <p className="text-[15px] leading-relaxed text-[var(--muted)]">{t.catalogue.otherBrands}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/catalog/motorcycle/Bajaj`}
            className="inline-flex min-h-10 items-center rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)]/85 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Bajaj — {t.catalog.title}
          </Link>
          <Link
            href={`/${locale}/catalog/motorcycle/TVS`}
            className="inline-flex min-h-10 items-center rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)]/85 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            TVS — {t.catalog.title}
          </Link>
          <Link
            href={`/${locale}/catalog/motorcycle/Hero`}
            className="inline-flex min-h-10 items-center rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)]/85 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Hero — {t.catalog.title}
          </Link>
          <Link
            href={`/${locale}/parts`}
            className="inline-flex min-h-10 items-center rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)]/85 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {t.partsIndex.linkLabel}
          </Link>
        </div>
      </section>

      <div className="mt-12">
        <FitmentDisclaimer t={t} />
      </div>
    </div>
  );
}
