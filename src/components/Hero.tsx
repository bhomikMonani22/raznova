import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { Translations } from "@/i18n/translations";

export default function Hero({ locale, t }: { locale: Locale; t: Translations }) {
  return (
    <section className="bg-gradient-to-b from-orange-50 to-white px-4 py-16 text-center">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {t.hero.title}
        </h1>
        <p className="mt-4 text-lg text-slate-600">{t.hero.subtitle}</p>
        <Link
          href={`/${locale}/quote`}
          className="mt-8 inline-block rounded-md bg-orange-600 px-6 py-3 text-base font-semibold text-white hover:bg-orange-700"
        >
          {t.hero.cta}
        </Link>
      </div>
    </section>
  );
}
