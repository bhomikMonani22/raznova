import type { ShowcasePart } from "@/lib/types";
import type { Locale } from "@/i18n/locales";
import type { Translations } from "@/i18n/translations";

export default function PartCard({
  part,
  locale,
  t,
}: {
  part: ShowcasePart;
  locale: Locale;
  t: Translations;
}) {
  const description =
    locale === "es" ? part.description_es : part.description_en;

  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={part.image_url} alt={part.category} className="h-24 w-full object-contain" />
      <p className="mt-2 text-xs font-semibold uppercase text-orange-600">{part.category}</p>
      <p className="mt-1 text-xs text-slate-400">
        {t.showcase.fitmentRef}: {part.part_no}
      </p>
      <p className="mt-1 text-sm text-slate-700">{description}</p>
    </div>
  );
}
