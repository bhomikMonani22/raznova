"use client";

import { motion } from "framer-motion";
import type { Translations } from "@/i18n/translations";
import { CARRIED_BRANDS, getBrandLogo } from "@/lib/brandLogos";
import { fadeUp } from "@/lib/motion";

function LogoChip({ brand }: { brand: string }) {
  const logo = getBrandLogo(brand);
  return (
    <div className="mx-6 flex h-14 w-32 shrink-0 items-center justify-center">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={`${brand} logo`} className="h-10 w-auto max-w-full object-contain" />
      ) : (
        <span className="font-display rounded-[var(--radius-md)] border border-[var(--line)] px-3 py-2 text-sm font-bold text-[var(--accent)]">
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
      className="px-4 py-14"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-center text-display-3 font-bold text-[var(--ink)]">
          {t.brandsMarquee.title}
        </h2>
        <div className="marquee-viewport mt-8 overflow-hidden">
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
