import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getTranslations } from "@/i18n/translations";
import catalogs from "@/data/catalogs.json";
import type { CatalogEntry } from "@/lib/types";
import CatalogList from "@/components/CatalogList";
import { getBrandLogo } from "@/lib/brandLogos";
import { partBrandMeta, canonical } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; brand: string }>;
}): Promise<Metadata> {
  const { locale, brand } = await params;
  if (!isLocale(locale)) return {};
  const brandName = decodeURIComponent(brand);
  const meta = partBrandMeta(brandName, locale);
  const path = `/brands/${encodeURIComponent(brandName)}`;
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
    new Set(all.filter((c) => c.catalog_type === "brand").map((c) => c.brand))
  ).map((brand) => ({ brand }));
}

export default async function PartBrandPage({
  params,
}: {
  params: Promise<{ locale: string; brand: string }>;
}) {
  const { locale, brand } = await params;
  if (!isLocale(locale)) notFound();
  const t = getTranslations(locale);

  const brandName = decodeURIComponent(brand);
  const entries = (catalogs as CatalogEntry[]).filter(
    (c) => c.catalog_type === "brand" && c.brand === brandName
  );

  if (entries.length === 0) notFound();

  const logo = getBrandLogo(brandName);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <Link
        href={`/${locale}`}
        className="text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
      >
        ← {t.catalog.backToBrands}
      </Link>
      <div className="mt-5 flex items-center gap-4">
        {logo ? (
          <span className="flex h-12 w-28 items-center justify-center rounded-[8px] bg-[var(--cream)] px-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt={`${brandName} logo`}
              className="h-7 w-auto max-w-full object-contain"
            />
          </span>
        ) : (
          <span className="font-display rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-lg font-bold text-[var(--accent)]">
            {brandName}
          </span>
        )}
        <h1 className="font-display text-display-2 font-bold text-[var(--ink)]">
          {brandName} — {t.catalog.title}
        </h1>
      </div>
      <div className="mt-8">
        <CatalogList entries={entries} t={t} />
      </div>
    </div>
  );
}
