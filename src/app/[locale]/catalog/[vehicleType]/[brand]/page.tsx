import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getTranslations } from "@/i18n/translations";
import catalogs from "@/data/catalogs.json";
import type { CatalogEntry } from "@/lib/types";
import CatalogList from "@/components/CatalogList";

export function generateStaticParams() {
  const all = catalogs as CatalogEntry[];
  return Array.from(
    new Set(all.map((c) => `${c.vehicle_type}__${c.brand}`))
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
    (c) => c.vehicle_type === vehicleType && c.brand === brandName
  );

  if (entries.length === 0) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link href={`/${locale}`} className="text-sm font-medium text-orange-600 hover:underline">
        ← {t.catalog.backToBrands}
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        {brandName} — {t.catalog.title}
      </h1>
      <div className="mt-6">
        <CatalogList entries={entries} t={t} />
      </div>
    </div>
  );
}
