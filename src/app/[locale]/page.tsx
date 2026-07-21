import type { Metadata } from "next";
import { isLocale } from "@/i18n/locales";
import { getTranslations } from "@/i18n/translations";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { HOME_META, canonical } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { webPage } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const meta = HOME_META[locale];
  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: { canonical: canonical(locale) },
    openGraph: { title: meta.title, description: meta.description, url: canonical(locale) },
  };
}
import Hero from "@/components/Hero";
import catalogs from "@/data/catalogs.json";
import showcase from "@/data/showcase.json";
import type { CatalogEntry, ShowcasePart } from "@/lib/types";
import type { ShowcaseGroup } from "@/components/Showcase";
import { FEATURED_BIKES } from "@/lib/featuredBikes";
import { getOemLogo } from "@/lib/brandLogos";

const OEM_FITMENT_BRANDS = ["Hero", "Bajaj", "TVS"] as const;

/** Build the showcase payload server-side: pre-grouped per featured bike,
 * one locale's description only, and just the fields the card renders.
 * Keeps the full catalog intact while roughly halving what crosses to the
 * client (LCP/TBT budget). */
function buildShowcaseGroups(locale: string): ShowcaseGroup[] {
  const parts = showcase as ShowcasePart[];
  const all = catalogs as CatalogEntry[];

  return FEATURED_BIKES.map((bike) => {
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
      parts: parts
        .filter((p) => p.brand === bike.brand && p.model === bike.model)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((p) => ({
          id: p.id,
          brand: p.brand,
          model: p.model,
          category: p.category,
          image_url: p.image_url,
          description: locale === "es" ? p.description_es : p.description_en,
        })),
    };
  });
}

// Below-fold sections are code-split: they stay fully server-rendered in the
// HTML, but their hydration JS (framer-motion et al.) loads after the shell,
// keeping the hero's critical path lean (mobile LCP budget).
const TrustStrip = dynamic(() => import("@/components/TrustStrip"));
const InventoryGrid = dynamic(() => import("@/components/InventoryGrid"));
const ProductCategories = dynamic(() => import("@/components/ProductCategories"));
const Showcase = dynamic(() => import("@/components/Showcase"));
const BrandsMarquee = dynamic(() => import("@/components/BrandsMarquee"));
const HowWeWork = dynamic(() => import("@/components/HowWeWork"));
const LightSection = dynamic(() => import("@/components/LightSection"));
const WhyRaznova = dynamic(() => import("@/components/WhyRaznova"));
const MarketsServed = dynamic(() => import("@/components/MarketsServed"));
const ContactFinale = dynamic(() => import("@/components/ContactFinale"));

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getTranslations(locale);

  const meta = HOME_META[locale];

  return (
    <>
      <JsonLd data={webPage(locale, "", meta.title, meta.description)} />
      <Hero t={t} />
      <TrustStrip t={t} />
      <InventoryGrid t={t} />
      <ProductCategories t={t} />
      <Showcase
        locale={locale}
        t={t}
        groups={buildShowcaseGroups(locale)}
        oemLogos={OEM_FITMENT_BRANDS.map((brand) => ({
          brand,
          src: getOemLogo(brand) ?? "",
        })).filter((l) => l.src)}
      />
      <BrandsMarquee t={t} />
      <HowWeWork t={t} />
      <LightSection t={t} />
      <WhyRaznova t={t} />
      <MarketsServed t={t} />
      <ContactFinale locale={locale} t={t} />
    </>
  );
}
