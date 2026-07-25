import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { organizationAndWebsite } from "@/lib/schema";
import { getTranslations } from "@/i18n/translations";
import catalogs from "@/data/catalogs.json";
import type { CatalogEntry } from "@/lib/types";

// Top-level English marketing/landing pages (Phase-3 SEO). They live outside
// the [locale] tree — the URLs are intentionally un-prefixed — so this route
// group supplies the same shell the locale layout does, pinned to English.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const t = getTranslations("en");
  return (
    <>
      <JsonLd data={organizationAndWebsite("en")} />
      <Header locale="en" t={t} catalogs={catalogs as CatalogEntry[]} />
      <main className="flex-1">{children}</main>
      <Footer locale="en" t={t} />
    </>
  );
}
