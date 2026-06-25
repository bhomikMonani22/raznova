import { isLocale } from "@/i18n/locales";
import { getTranslations } from "@/i18n/translations";
import { notFound } from "next/navigation";
import Hero from "@/components/Hero";
import PositioningStrip from "@/components/PositioningStrip";
import BrandsMarquee from "@/components/BrandsMarquee";
import Showcase from "@/components/Showcase";
import WhyRaznova from "@/components/WhyRaznova";
import HowToOrder from "@/components/HowToOrder";
import MarketsServed from "@/components/MarketsServed";
import QuoteCta from "@/components/QuoteCta";
import catalogs from "@/data/catalogs.json";
import showcase from "@/data/showcase.json";
import type { CatalogEntry, ShowcasePart } from "@/lib/types";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getTranslations(locale);

  return (
    <>
      <Hero locale={locale} t={t} />
      <PositioningStrip t={t} />
      <BrandsMarquee t={t} />
      <Showcase
        locale={locale}
        t={t}
        showcase={showcase as ShowcasePart[]}
        catalogs={catalogs as CatalogEntry[]}
      />
      <WhyRaznova t={t} />
      <HowToOrder t={t} />
      <MarketsServed t={t} />
      <QuoteCta locale={locale} t={t} />
    </>
  );
}
