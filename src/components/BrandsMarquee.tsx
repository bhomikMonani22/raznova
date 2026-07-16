"use client";

import { motion } from "framer-motion";
import type { Translations } from "@/i18n/translations";
import { CARRIED_BRANDS, getBrandLogo } from "@/lib/brandLogos";
import { fadeUp } from "@/lib/motion";

function LogoChip({ brand }: { brand: string }) {
  const logo = getBrandLogo(brand);
  return (
    <div className="mx-4 flex h-16 w-36 shrink-0 items-center justify-center">
      {logo ? (
        <div className="flex h-14 w-full items-center justify-center rounded-[10px] bg-[var(--cream)] px-4 opacity-85 transition-opacity duration-300 hover:opacity-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt={`${brand} logo`}
            loading="lazy"
            className="h-8 w-auto max-w-full object-contain"
          />
        </div>
      ) : (
        <span className="font-display flex h-14 w-full items-center justify-center rounded-[10px] border border-[var(--line)] text-sm font-bold text-[var(--muted)]">
          {brand}
        </span>
      )}
    </div>
  );
}

export default function BrandsMarquee({ t }: { t: Translations }) {
  // Duplicate the list so the 50%-translateX loop in globals.css is seamless.
  const brands = [...CARRIED_BRANDS, ...CARRIED_BRANDS];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      className="border-t border-[var(--line)] px-5 py-16"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          {t.brandsMarquee.title}
        </p>
        <div className="marquee-viewport relative mt-8 overflow-hidden">
          {/* Edge fades keep the loop cinematic instead of clipped. */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[var(--bg)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[var(--bg)] to-transparent" />
          <div className="marquee-track">
            {brands.map((brand, i) => (
              <LogoChip key={`${brand}-${i}`} brand={brand} />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
