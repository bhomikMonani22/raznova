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
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">{t.quote.title}</h1>
      <p className="mt-2 text-slate-600">{t.quote.subtitle}</p>
      <div className="mt-8">
        <QuoteForm locale={locale} t={t} />
      </div>
    </div>
  );
}
