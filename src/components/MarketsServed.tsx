"use client";

import { motion } from "framer-motion";
import type { Translations } from "@/i18n/translations";
import { fadeUp, staggerContainer } from "@/lib/motion";

export default function MarketsServed({ t }: { t: Translations }) {
  const regions = [
    { title: t.markets.latamTitle, body: t.markets.latamBody },
    { title: t.markets.africaTitle, body: t.markets.africaBody },
  ];

  return (
    <section className="bg-[var(--surface)] px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-center text-display-2 font-bold text-[var(--ink)]">{t.markets.title}</h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer(0.1)}
          className="mt-10 grid gap-6 sm:grid-cols-2"
        >
          {regions.map((region) => (
            <motion.div key={region.title} variants={fadeUp} className="card-surface p-6 text-center">
              <h3 className="font-display text-display-3 font-bold text-[var(--accent)]">{region.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{region.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
