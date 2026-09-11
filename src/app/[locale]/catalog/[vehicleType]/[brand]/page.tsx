import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getTranslations } from "@/i18n/translations";
import catalogs from "@/data/catalogs.json";
import type { CatalogEntry } from "@/lib/types";
import CatalogList from "@/components/CatalogList";
import HeroCrossSell from "@/components/HeroCrossSell";
import Breadcrumbs from "@/components/Breadcrumbs";
import { catalogMeta, canonical, languageAlternates, brandLanding, SITE_URL } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { breadcrumbs, vehicleCatalogProducts } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; vehicleType: string; brand: string }>;
}): Promise<Metadata> {
  const { locale, vehicleType, brand } = await params;
  if (!isLocale(locale)) return {};
  const brandName = decodeURIComponent(brand);
  const meta = catalogMeta(brandName, locale);
  const path = `/catalog/${vehicleType}/${encodeURIComponent(brandName)}`;
  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: { canonical: canonical(locale, path), languages: languageAlternates(path) },
    openGraph: { title: meta.title, description: meta.description, url: canonical(locale, path) },
  };
}

export function generateStaticParams() {
  const all = catalogs as CatalogEntry[];
  return Array.from(
    new Set(
      all
        .filter((c) => c.catalog_type === "vehicle")
        .map((c) => `${c.vehicle_type}__${c.brand}`)
    )
  ).map((key) => {
    const [vehicleType, brand] = key.split("__");
    return { vehicleType, brand };
  });
}

export default async function BrandCatalogPage({
  params,
}: {
  params: Promise<{ locale: string; vehicleType: string; brand: string }>;
}) {
  const { locale, vehicleType, brand } = await params;
  if (!isLocale(locale)) notFound();
  const t = getTranslations(locale);

  const brandName = decodeURIComponent(brand);
  const entries = (catalogs as CatalogEntry[]).filter(
    (c) => c.catalog_type === "vehicle" && c.vehicle_type === vehicleType && c.brand === brandName
  );

  if (entries.length === 0) notFound();

  const pageUrl = `${SITE_URL}/${locale}/catalog/${vehicleType}/${encodeURIComponent(brandName)}`;
  // English-only landing pages, so only surface the cross-link on /en.
  const landing = locale === "en" ? brandLanding(brandName) : null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <JsonLd
        data={breadcrumbs([
          { name: t.nav.home, url: `${SITE_URL}/${locale}` },
          { name: `${brandName} — ${t.catalog.title}`, url: pageUrl },
        ])}
      />
      <JsonLd data={vehicleCatalogProducts(locale, vehicleType, brandName, entries)} />
      <Breadcrumbs
        items={[
          { name: t.nav.home, href: `/${locale}` },
          { name: `${brandName} — ${t.catalog.title}` },
        ]}
      />
      <h1 className="font-display mt-5 text-display-2 font-bold text-[var(--ink)]">
        {brandName} — {t.catalog.title}
      </h1>
      {landing && (
        <p className="mt-4 text-[15px] text-[var(--muted)]">
          <Link
            href={`/${landing.slug}`}
            className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
          >
            {landing.label}
          </Link>{" "}
          — export supply, fitment coverage and shipping details.
          {locale === "en" && brandName === "Hero" && (
            <>
              {" "}
              See also{" "}
              <Link
                href="/hero-fitment-parts-export"
                className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
              >
                Hero-fitment parts for export markets
              </Link>
              .
            </>
          )}
        </p>
      )}
      <div className="mt-8">
        <CatalogList entries={entries} t={t} />
      </div>

      {/* Cross-sell Hero on the other brands' pages (not on Hero's own). */}
      {brandName !== "Hero" && (
        <div className="mt-12">
          <HeroCrossSell locale={locale} />
        </div>
      )}
    </div>
  );
}
