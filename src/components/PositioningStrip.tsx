"use client";

import { motion } from "framer-motion";
import type { Translations } from "@/i18n/translations";
import { fadeUp } from "@/lib/motion";

export default function PositioningStrip({ t }: { t: Translations }) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      className="border-y border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-center"
    >
      <p className="text-sm font-medium tracking-wide text-[var(--muted)]">{t.positioning.line}</p>
    </motion.section>
  );
}
