"use client";

import { motion } from "framer-motion";
import type { Translations } from "@/i18n/translations";
import { fadeUp, staggerContainer, cardHover } from "@/lib/motion";

export default function WhyRaznova({ t }: { t: Translations }) {
  const cards = [
    { title: t.whyRaznova.sourcingTitle, body: t.whyRaznova.sourcingBody },
    { title: t.whyRaznova.workhorseTitle, body: t.whyRaznova.workhorseBody },
    { title: t.whyRaznova.moqTitle, body: t.whyRaznova.moqBody },
    { title: t.whyRaznova.termsTitle, body: t.whyRaznova.termsBody },
  ];

  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-center text-display-2 font-bold text-[var(--ink)]">{t.whyRaznova.title}</h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer(0.08)}
          className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {cards.map((card) => (
            <motion.div
              key={card.title}
              variants={fadeUp}
              initial="rest"
              whileHover="hover"
              animate="rest"
              {...cardHover}
              className="card-surface flex flex-col p-6"
            >
              <h3 className="font-display text-display-3 font-bold text-[var(--ink)]">{card.title}</h3>
              <p className="mt-3 text-sm text-[var(--muted)]">{card.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
