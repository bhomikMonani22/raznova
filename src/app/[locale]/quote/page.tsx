import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getTranslations } from "@/i18n/translations";
import QuoteForm from "@/components/QuoteForm";

export default async function QuotePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getTranslations(locale);

  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
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
