import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { Translations } from "@/i18n/translations";
import { BRAND_NAME, CONTACT_EMAIL, whatsappLink, mailtoLink } from "@/lib/config";

export default function Footer({ locale, t }: { locale: Locale; t: Translations }) {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-[var(--muted)]">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div>
            <p className="font-display text-lg font-bold text-[var(--accent)]">{BRAND_NAME}</p>
            <p className="mt-2 max-w-sm">{t.footer.regions}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link href={`/${locale}/quote`} className="font-medium text-[var(--accent)] hover:underline">
              {t.nav.requestQuote}
            </Link>
            <a href={whatsappLink("Hi Raznova, I'd like a quote.")} className="hover:underline">
              {t.quote.whatsappButton}
            </a>
            <a href={mailtoLink("Quote Request")} className="hover:underline">
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
        <div className="mt-8 border-t border-[var(--line)] pt-6 text-xs text-[var(--muted)]">
          <p>{t.footer.brandLine} {t.footer.gstin}.</p>
          <p className="mt-1">{t.footer.disclaimer}</p>
          <p className="mt-1">© {new Date().getFullYear()} {BRAND_NAME}. {t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
