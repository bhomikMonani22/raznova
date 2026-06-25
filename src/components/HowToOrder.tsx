"use client";

import { motion } from "framer-motion";
import type { Translations } from "@/i18n/translations";
import { fadeUp, staggerContainer } from "@/lib/motion";

export default function HowToOrder({ t }: { t: Translations }) {
  const steps = [
    { title: t.howToOrder.step1Title, body: t.howToOrder.step1Body },
    { title: t.howToOrder.step2Title, body: t.howToOrder.step2Body },
    { title: t.howToOrder.step3Title, body: t.howToOrder.step3Body },
  ];

  return (
    <section className="bg-[var(--surface)] px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-center text-display-2 font-bold text-[var(--ink)]">{t.howToOrder.title}</h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer(0.09)}
          className="mt-10 grid gap-6 sm:grid-cols-3"
        >
          {steps.map((step, i) => (
            <motion.div key={step.title} variants={fadeUp} className="flex flex-col items-center text-center">
              <span className="font-display flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-lg font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-display-3 font-display font-bold text-[var(--ink)]">{step.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{step.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
