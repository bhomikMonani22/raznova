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
        showcase={showcase as ShowcasePart[]}
        catalogs={catalogs as CatalogEntry[]}
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
