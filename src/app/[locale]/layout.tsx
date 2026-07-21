import { notFound } from "next/navigation";
import { LOCALES, isLocale } from "@/i18n/locales";
import { getTranslations } from "@/i18n/translations";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SetHtmlLang from "@/components/SetHtmlLang";
import JsonLd from "@/components/JsonLd";
import { organizationAndWebsite } from "@/lib/schema";
import catalogs from "@/data/catalogs.json";
import type { CatalogEntry } from "@/lib/types";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = getTranslations(locale);

  return (
    <>
      <JsonLd data={organizationAndWebsite(locale)} />
      <SetHtmlLang locale={locale} />
      <Header locale={locale} t={t} catalogs={catalogs as CatalogEntry[]} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} t={t} />
    </>
  );
}
