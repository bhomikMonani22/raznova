"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Locale } from "@/i18n/locales";
import type { Translations } from "@/i18n/translations";
import { fadeUp, staggerContainer } from "@/lib/motion";
import {
  whatsappLink,
  mailtoLink,
  telLink,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  IEC,
  GSTIN,
} from "@/lib/config";
import Magnetic from "./Magnetic";

export default function ContactFinale({ locale, t }: { locale: Locale; t: Translations }) {
  return (
    <section className="relative overflow-hidden border-t border-[var(--line)]">
      {/* Dot-matrix background drifting very slowly (transform-only).
          Oversized so the drift loop never exposes an edge. */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="dot-matrix dot-drift absolute -inset-14" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--bg)_78%)]" />
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={staggerContainer(0.1)}
        className="relative mx-auto flex max-w-4xl flex-col items-center px-5 py-24 text-center md:py-32"
      >
        <motion.p variants={fadeUp} className="eyebrow">
          {t.contactFinale.eyebrow}
        </motion.p>
        <motion.h2
          variants={fadeUp}
          className="font-display mt-3 max-w-3xl text-display-1 font-bold text-[var(--ink)]"
        >
          {t.contactFinale.title}
        </motion.h2>

        <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Magnetic>
            <a
              href={whatsappLink("Hi Raznova, I'd like a quote.")}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-glow inline-flex min-h-14 items-center gap-3 rounded-[var(--radius-md)] bg-[var(--accent)] px-9 py-4 text-lg font-semibold text-[var(--accent-ink)]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2.05 22l5.27-1.38a9.87 9.87 0 0 0 4.72 1.2h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.83 9.83 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.05-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.23 8.24Zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.16-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
              </svg>
              {t.contactFinale.whatsappCta}
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href={mailtoLink("Quote Request")}
              className="inline-flex min-h-14 items-center rounded-[var(--radius-md)] border border-[var(--line-strong)] px-9 py-4 text-lg font-semibold text-[var(--ink)] transition-colors hover:border-[var(--ink)]/40"
            >
              {t.contactFinale.emailCta}
            </a>
          </Magnetic>
        </motion.div>

        {/* Phone in large one-thumb-tappable type. */}
        <motion.div variants={fadeUp} className="mt-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            {t.contactFinale.callLabel}
          </p>
          <a
            href={telLink()}
            className="font-display mt-1 inline-block py-2 text-3xl font-bold tracking-tight text-[var(--ink)] transition-colors hover:text-[var(--accent)] md:text-4xl"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {CONTACT_PHONE_DISPLAY}
          </a>
        </motion.div>

        {/* Credentials block — buyers screenshot this. */}
        <motion.div
          variants={fadeUp}
          className="font-mono-credentials mt-12 w-full max-w-xl rounded-[var(--radius-md)] border border-[var(--line-strong)] bg-[var(--surface)]/70 px-6 py-6 text-left text-[13px] leading-7 text-[var(--ink)]/90"
        >
          <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">
            {t.contactFinale.credsTitle}
          </p>
          <p>Raznova Exports</p>
          <p className="text-[var(--muted)]">A unit of Shrinath Ji Enterprises · Pune, India</p>
          <p className="mt-2">
            IEC&nbsp;&nbsp;&nbsp;&nbsp;{IEC}
            <br />
            GSTIN&nbsp;&nbsp;{GSTIN}
          </p>
          <p className="mt-2">
            <a href={mailtoLink("Quote Request")} className="hover:text-[var(--accent)]">
              {CONTACT_EMAIL}
            </a>
            <br />
            <a href={telLink()} className="hover:text-[var(--accent)]">
              {CONTACT_PHONE_DISPLAY}
            </a>
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-8">
          <Link
            href={`/${locale}/quote`}
            className="text-sm font-medium text-[var(--muted)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:underline"
          >
            {t.quoteCta.subtitle}
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
