import { motion } from "framer-motion";
import type { ShowcasePart } from "@/lib/types";
import type { Locale } from "@/i18n/locales";
import { fadeUp, cardHover } from "@/lib/motion";

export default function PartCard({
  part,
  locale,
}: {
  part: ShowcasePart;
  locale: Locale;
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
      className="flex flex-col card-surface p-4"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={part.image_url} alt={part.category} className="h-36 w-full object-contain" />
      <p className="mt-3 text-sm font-semibold uppercase text-[var(--accent-2)]">{part.category}</p>
      <p className="mt-1 text-base leading-snug text-[var(--ink)]">{part.brand} {part.model} {description}</p>
    </motion.div>
  );
}
