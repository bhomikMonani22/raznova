"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";

/** Consistent section header: uppercase micro-label eyebrow, display
 * headline, optional supporting line. Reveals once on scroll. */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  onCream = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  onCream?: boolean;
}) {
  const alignCls = align === "center" ? "text-center items-center" : "text-left items-start";
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={staggerContainer(0.1)}
      className={`flex flex-col gap-3 ${alignCls}`}
    >
      <motion.p variants={fadeUp} className="eyebrow">
        {eyebrow}
      </motion.p>
      <motion.h2
        variants={fadeUp}
        className={`font-display text-display-2 font-bold ${onCream ? "text-[var(--cream-ink)]" : "text-[var(--ink)]"}`}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          variants={fadeUp}
          className={`max-w-2xl text-[15px] ${onCream ? "text-[var(--cream-muted)]" : "text-[var(--muted)]"}`}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}
