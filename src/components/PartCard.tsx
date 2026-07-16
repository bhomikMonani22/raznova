import Image from "next/image";
import { motion } from "framer-motion";
import type { ShowcasePart } from "@/lib/types";
import type { Locale } from "@/i18n/locales";
import { cardHover } from "@/lib/motion";

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
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={cardHover}
      className="flex h-full flex-col overflow-hidden card-surface"
    >
      {/* Part photos are shot on white — a warm light panel keeps them
          reading as product imagery inside the dark card. */}
      <div className="relative m-2.5 aspect-[4/3] rounded-[10px] bg-[var(--cream)]">
        <Image
          src={part.image_url}
          alt={`${part.brand} ${part.model} — ${description}`}
          fill
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
          quality={70}
          className="object-contain p-3"
        />
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          {part.category}
        </p>
        <p className="mt-1.5 text-[15px] leading-snug text-[var(--ink)]">
          {part.brand} {part.model} {description}
        </p>
      </div>
    </motion.div>
  );
}
