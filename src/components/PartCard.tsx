import { motion } from "framer-motion";
import type { ShowcasePart } from "@/lib/types";
import type { Locale } from "@/i18n/locales";
import type { Translations } from "@/i18n/translations";
import { fadeUp, cardHover } from "@/lib/motion";

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
    <motion.div
      variants={fadeUp}
      initial="rest"
      whileHover="hover"
      animate="rest"
      {...cardHover}
      className="flex flex-col card-surface p-3"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={part.image_url} alt={part.category} className="h-24 w-full object-contain" />
      <p className="mt-2 text-xs font-semibold uppercase text-[var(--accent-2)]">{part.category}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {t.showcase.fitmentRef}: {part.part_no}
      </p>
      <p className="mt-1 text-sm text-[var(--ink)]">{description}</p>
    </motion.div>
  );
}
