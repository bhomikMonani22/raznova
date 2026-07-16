"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";
import type { Translations } from "@/i18n/translations";
import { fadeUp, staggerContainer } from "@/lib/motion";
import SectionHeading from "./SectionHeading";

export default function HowWeWork({ t }: { t: Translations }) {
  const railRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Purple progress line draws itself across as the section scrolls by.
  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 0.85", "end 0.45"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });

  return (
    <section className="border-t border-[var(--line)] px-5 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow={t.howWeWork.eyebrow} title={t.howWeWork.title} />

        <div ref={railRef} className="relative mt-14">
          {/* Track + scroll-linked progress line (transform-only). */}
          <div className="absolute inset-x-0 top-0 h-px bg-[var(--line)]" aria-hidden="true" />
          <motion.div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px origin-left bg-[var(--accent)]"
            style={{ scaleX: prefersReducedMotion ? 1 : progress }}
          />

          <motion.ol
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer(0.1)}
            className="grid gap-10 pt-10 sm:grid-cols-2 lg:grid-cols-4"
          >
            {t.howWeWork.steps.map((step, i) => (
              <motion.li key={step.title} variants={fadeUp} className="relative">
                <span
                  className="font-display pointer-events-none block text-[64px] font-bold leading-none md:text-[76px]"
                  style={{
                    WebkitTextStroke: "1px rgba(245, 241, 234, 0.28)",
                    color: "transparent",
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display mt-4 text-lg font-bold text-[var(--ink)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{step.body}</p>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </div>
    </section>
  );
}
