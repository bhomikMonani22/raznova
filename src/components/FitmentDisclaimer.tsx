import type { Translations } from "@/i18n/translations";

export default function FitmentDisclaimer({ t }: { t: Translations }) {
  return <p className="mx-auto max-w-3xl px-4 text-xs text-[var(--muted)]">{t.disclaimer.fitment}</p>;
}
