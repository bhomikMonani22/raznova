"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import type { Translations } from "@/i18n/translations";
import { fadeUp, staggerContainer } from "@/lib/motion";

/** The one light-contrast section: cream background crossfades in and out
 * via a scroll-linked opacity layer (no hard edges), dark serif pull-quote
 * for institutional gravitas. */
export default function LightSection({ t }: { t: Translations }) {
  const ref = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.95", "end 0.05"],
  });
  const creamOpacity = useTransform(scrollYProgress, [0, 0.22, 0.82, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-[var(--cream)]"
        style={{ opacity: prefersReducedMotion ? 1 : creamOpacity }}
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer(0.12)}
        className="relative mx-auto max-w-4xl px-5 py-24 text-center md:py-32"
      >
        <motion.p variants={fadeUp} className="eyebrow">
          {t.lightSection.eyebrow}
        </motion.p>
        <motion.h2
          variants={fadeUp}
          className="font-display mt-3 text-display-2 font-bold text-[var(--cream-ink)]"
        >
          {t.lightSection.title}
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--cream-muted)]"
        >
          {t.lightSection.body}
        </motion.p>

        <motion.blockquote
          variants={fadeUp}
          className="mx-auto mt-12 max-w-2xl border-t border-[var(--cream-line)] pt-10"
        >
          <p className="font-serif-quote text-2xl leading-snug text-[var(--cream-ink)] md:text-[1.75rem]">
            &ldquo;{t.lightSection.quote}&rdquo;
          </p>
          <footer className="font-mono-credentials mt-6 text-xs uppercase tracking-[0.18em] text-[var(--cream-muted)]">
            Raznova Exports · Pune, India
          </footer>
        </motion.blockquote>
      </motion.div>
    </section>
  );
}
