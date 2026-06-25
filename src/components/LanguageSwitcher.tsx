"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALES, type Locale } from "@/i18n/locales";

const LABELS: Record<Locale, string> = {
  en: "EN",
  es: "ES",
  "en-ZA": "EN-ZA",
};

export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: Locale) {
    const rest = pathname.split("/").slice(2).join("/");
    router.push(`/${next}${rest ? `/${rest}` : ""}`);
  }

  return (
    <select
      aria-label="Language"
      value={locale}
      onChange={(e) => switchTo(e.target.value as Locale)}
      className="rounded border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-sm font-medium text-[var(--ink)]"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LABELS[l]}
        </option>
      ))}
    </select>
  );
}
