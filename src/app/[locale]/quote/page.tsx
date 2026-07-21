import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getTranslations } from "@/i18n/translations";
import QuoteForm from "@/components/QuoteForm";
import { QUOTE_META, canonical } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import { webPage } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const meta = QUOTE_META[locale];
  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: { canonical: canonical(locale, "/quote") },
    openGraph: { title: meta.title, description: meta.description, url: canonical(locale, "/quote") },
  };
}

export default async function QuotePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getTranslations(locale);

  const meta = QUOTE_META[locale];

  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <JsonLd data={webPage(locale, "/quote", meta.title, meta.description)} />
      <p className="eyebrow">{t.contactFinale.eyebrow}</p>
      <h1 className="font-display mt-3 text-display-2 font-bold text-[var(--ink)]">
        {t.quote.title}
      </h1>
      <p className="mt-3 text-[var(--muted)]">{t.quote.subtitle}</p>
      <div className="mt-10">
        <QuoteForm locale={locale} t={t} />
      </div>
    </div>
  );
}
