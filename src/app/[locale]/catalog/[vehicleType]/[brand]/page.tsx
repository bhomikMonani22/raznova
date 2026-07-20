import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getTranslations } from "@/i18n/translations";
import catalogs from "@/data/catalogs.json";
import type { CatalogEntry } from "@/lib/types";
import CatalogList from "@/components/CatalogList";
import { catalogMeta, canonical } from "@/lib/seo";

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
    alternates: { canonical: canonical(locale, path) },
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

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <Link
        href={`/${locale}`}
        className="text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
      >
        ← {t.catalog.backToBrands}
      </Link>
      <h1 className="font-display mt-5 text-display-2 font-bold text-[var(--ink)]">
        {brandName} — {t.catalog.title}
      </h1>
      <div className="mt-8">
        <CatalogList entries={entries} t={t} />
      </div>
    </div>
  );
}
