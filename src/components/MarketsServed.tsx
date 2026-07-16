"use client";

import { motion } from "framer-motion";
import type { Translations } from "@/i18n/translations";
import { fadeUp, staggerContainer } from "@/lib/motion";
import SectionHeading from "./SectionHeading";

export default function MarketsServed({ t }: { t: Translations }) {
  const regions = [
    { title: t.markets.latamTitle, body: t.markets.latamBody },
    { title: t.markets.africaTitle, body: t.markets.africaBody },
  ];

  return (
    <section className="border-t border-[var(--line)] px-5 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="LatAm · Africa" title={t.markets.title} />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer(0.1)}
          className="mt-12 grid gap-4 sm:grid-cols-2"
        >
          {regions.map((region) => (
            <motion.div key={region.title} variants={fadeUp} className="card-surface p-8 text-center">
              <h3 className="font-display text-display-3 font-bold text-[var(--accent)]">
                {region.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{region.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
