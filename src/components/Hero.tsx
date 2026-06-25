"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/i18n/locales";
import type { Translations } from "@/i18n/translations";
import { REVEAL_EASE } from "@/lib/motion";

export default function Hero({ locale, t }: { locale: Locale; t: Translations }) {
  const prefersReducedMotion = useReducedMotion();
  const words = t.hero.title.split(" ");

  const stats = [t.hero.statFitment, t.hero.statShipping, t.hero.statExport];

  return (
    <section className="bg-gradient-to-b from-[var(--accent)]/5 to-[var(--bg)] px-4 py-20 text-center">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-display-1 font-bold tracking-tight text-[var(--ink)]">
          {prefersReducedMotion ? (
            t.hero.title
          ) : (
            words.map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: REVEAL_EASE, delay: i * 0.04 }}
                className="inline-block"
              >
                {word}&nbsp;
              </motion.span>
            ))
          )}
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: REVEAL_EASE, delay: 0.3 }}
          className="mt-5 text-lg text-[var(--muted)]"
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: REVEAL_EASE, delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href={`/${locale}#showcase`}
            className="inline-block rounded-[var(--radius-md)] bg-[var(--accent)] px-6 py-3 text-base font-semibold text-white shadow-[var(--shadow-soft)] transition-transform duration-200 hover:scale-[1.02]"
          >
            {t.hero.ctaBrowse}
          </Link>
          <Link
            href={`/${locale}/quote`}
            className="inline-block rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] px-6 py-3 text-base font-semibold text-[var(--ink)] transition-transform duration-200 hover:scale-[1.02]"
          >
            {t.hero.ctaQuote}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: REVEAL_EASE, delay: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {stats.map((stat) => (
            <span
              key={stat}
              className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-1.5 text-sm font-medium text-[var(--muted)] shadow-[var(--shadow-soft)]"
            >
              {stat}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
