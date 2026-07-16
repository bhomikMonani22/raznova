import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { Translations } from "@/i18n/translations";
import {
  BRAND_NAME,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  IEC,
  GSTIN,
  whatsappLink,
  mailtoLink,
  telLink,
} from "@/lib/config";

export default function Footer({ locale, t }: { locale: Locale; t: Translations }) {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--bg)]">
      <div className="mx-auto max-w-6xl px-5 py-12 text-sm text-[var(--muted)]">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <p className="font-display text-lg font-bold text-[var(--ink)]">
              {BRAND_NAME}
              <span className="text-[var(--accent)]">.</span>
            </p>
            <p className="mt-2 max-w-sm leading-relaxed">{t.footer.regions}</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <Link
              href={`/${locale}/quote`}
              className="font-medium text-[var(--accent)] transition-colors hover:text-[var(--ink)]"
            >
              {t.nav.requestQuote}
            </Link>
            <a
              href={whatsappLink("Hi Raznova, I'd like a quote.")}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--ink)]"
            >
              {t.quote.whatsappButton}
            </a>
            <a href={mailtoLink("Quote Request")} className="transition-colors hover:text-[var(--ink)]">
              {CONTACT_EMAIL}
            </a>
            <a
              href={telLink()}
              className="transition-colors hover:text-[var(--ink)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {CONTACT_PHONE_DISPLAY}
            </a>
          </div>
        </div>

        {/* Credentials line — every page, mono, perfectly aligned. */}
        <div className="mt-10 border-t border-[var(--line)] pt-6">
          <p className="font-mono-credentials text-xs leading-6 text-[var(--muted)]">
            Raznova Exports · A unit of Shrinath Ji Enterprises · IEC: {IEC} · GSTIN: {GSTIN} ·{" "}
            {CONTACT_EMAIL} · {CONTACT_PHONE_DISPLAY} · Pune, India
          </p>
          <p className="mt-3 text-xs text-[var(--muted)]/80">{t.footer.disclaimer}</p>
          <p className="mt-1 text-xs text-[var(--muted)]/80">
            © {new Date().getFullYear()} {BRAND_NAME} Exports. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
