"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import type { Translations } from "@/i18n/translations";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { IEC, GSTIN } from "@/lib/config";

/** Counts 0 → target once when scrolled into view, 1.2s ease-out,
 * tabular-nums. Reduced motion jumps straight to the final value. */
function CountUp({ target, suffix }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReducedMotion = useReducedMotion();
  const [value, setValue] = useState(prefersReducedMotion ? target : 0);

  useEffect(() => {
    if (!inView) return;
    // Reduced motion: duration 0 jumps straight to the final value.
    const controls = animate(0, target, {
      duration: prefersReducedMotion ? 0 : 1.2,
      ease: "easeOut",
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, target, prefersReducedMotion]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {value}
      {suffix}
    </span>
  );
}

export default function TrustStrip({ t }: { t: Translations }) {
  const cells = [
    {
      key: "brands",
      value: <CountUp target={4} suffix="+" />,
      label: t.trust.brandsLabel,
      sub: t.trust.brandsSub,
      mono: false,
    },
    {
      key: "iec",
      value: IEC,
      label: t.trust.iecLabel,
      sub: null,
      mono: true,
    },
    {
      key: "gstin",
      value: GSTIN,
      label: t.trust.gstinLabel,
      sub: null,
      mono: true,
    },
    {
      key: "port",
      value: t.trust.portValue,
      label: t.trust.portLabel,
      sub: null,
      mono: false,
    },
  ];

  return (
    <section className="border-y border-[var(--line)] bg-[var(--surface)]/40">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={staggerContainer(0.08)}
        className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-[var(--line)] lg:grid-cols-4"
      >
        {cells.map((cell) => (
          <motion.div
            key={cell.key}
            variants={fadeUp}
            className="flex min-h-[104px] flex-col justify-center gap-1 px-5 py-6"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              {cell.label}
            </p>
            <p
              className={`${
                cell.mono
                  ? "font-mono-credentials text-base md:text-lg"
                  : "font-display text-xl font-bold md:text-2xl"
              } text-[var(--ink)]`}
            >
              {cell.value}
            </p>
            {cell.sub && <p className="text-xs text-[var(--muted)]">{cell.sub}</p>}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
