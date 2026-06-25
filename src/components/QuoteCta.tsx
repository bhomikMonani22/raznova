"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Locale } from "@/i18n/locales";
import type { Translations } from "@/i18n/translations";
import { fadeUp } from "@/lib/motion";

export default function QuoteCta({ locale, t }: { locale: Locale; t: Translations }) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      className="px-4 py-16"
    >
      <div className="mx-auto max-w-3xl rounded-[var(--radius-lg)] bg-[var(--accent)] px-6 py-12 text-center shadow-[var(--shadow-lift)]">
        <h2 className="font-display text-display-2 font-bold text-white">{t.quoteCta.title}</h2>
        <p className="mt-3 text-[var(--accent-2)]">{t.quoteCta.subtitle}</p>
        <Link
          href={`/${locale}/quote`}
          className="mt-6 inline-block rounded-[var(--radius-md)] bg-white px-6 py-3 text-base font-semibold text-[var(--accent)] transition-transform duration-200 hover:scale-[1.02]"
        >
          {t.quoteCta.button}
        </Link>
      </div>
    </motion.section>
  );
}
