"use client";

import { motion } from "framer-motion";
import type { Translations } from "@/i18n/translations";
import { fadeUp, staggerContainer, cardHover } from "@/lib/motion";
import SectionHeading from "./SectionHeading";

export default function WhyRaznova({ t }: { t: Translations }) {
  const cards = [
    { title: t.whyRaznova.sourcingTitle, body: t.whyRaznova.sourcingBody },
    { title: t.whyRaznova.workhorseTitle, body: t.whyRaznova.workhorseBody },
    { title: t.whyRaznova.moqTitle, body: t.whyRaznova.moqBody },
    { title: t.whyRaznova.termsTitle, body: t.whyRaznova.termsBody },
  ];

  return (
    <section className="px-5 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Raznova" title={t.whyRaznova.title} />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer(0.08)}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              variants={fadeUp}
              initial="rest"
              whileHover="hover"
              animate="rest"
              {...cardHover}
              className="card-surface flex flex-col p-6"
            >
              <span
                className="font-mono-credentials text-xs text-[var(--accent)]"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display mt-3 text-lg font-bold text-[var(--ink)]">
                {card.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted)]">{card.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
