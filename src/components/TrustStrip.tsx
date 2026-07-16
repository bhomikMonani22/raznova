"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import type { Translations } from "@/i18n/translations";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { IEC, GSTIN } from "@/lib/config";
import { getOemLogo } from "@/lib/brandLogos";

// Fitment-reference brands shown as logo chips (text chip when no logo file).
const FITMENT_BRANDS = ["Hero", "Bajaj", "TVS", "Honda"] as const;

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

/** OEM fitment logos on small light chips (logos have opaque light
 * backgrounds, so a cream chip is the uniform treatment). */
function FitmentChips({ label }: { label: string }) {
  return (
    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
      <span className="sr-only">{label}</span>
      {FITMENT_BRANDS.map((brand) => {
        const logo = getOemLogo(brand);
        return logo ? (
          <span
            key={brand}
            className="flex h-6 items-center justify-center rounded-[6px] bg-[var(--cream)] px-2 opacity-85"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt={`${brand} (fitment reference)`}
              loading="lazy"
              className="h-3.5 w-auto max-w-16 object-contain"
            />
          </span>
        ) : (
          <span
            key={brand}
            className="flex h-6 items-center rounded-[6px] bg-[var(--cream)] px-2 text-[10px] font-bold tracking-wide text-[var(--cream-ink)] opacity-85"
          >
            {brand.toUpperCase()}
          </span>
        );
      })}
    </span>
  );
}

export default function TrustStrip({ t }: { t: Translations }) {
  const cells = [
    {
      key: "brands",
      value: <CountUp target={4} suffix="+" />,
      label: t.trust.brandsLabel,
      sub: <FitmentChips label={t.trust.brandsSub} />,
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
            {cell.sub}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
