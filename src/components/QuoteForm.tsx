"use client";

import { useState, FormEvent } from "react";
import type { Locale } from "@/i18n/locales";
import type { Translations } from "@/i18n/translations";
import { supabase } from "@/lib/supabaseClient";
import { CONTACT_EMAIL, whatsappLink, mailtoLink } from "@/lib/config";

type Status = "idle" | "submitting" | "success" | "error";

export default function QuoteForm({ locale, t }: { locale: Locale; t: Translations }) {
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({
    name: "",
    company: "",
    country: "",
    email: "",
    whatsapp: "",
    parts_list: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    const { error } = await supabase.from("raznova_quote_requests").insert({
      name: form.name.slice(0, 200),
      company: form.company.slice(0, 200),
      country: form.country.slice(0, 100),
      email: form.email.slice(0, 200),
      whatsapp: form.whatsapp.slice(0, 50),
      parts_list: form.parts_list.slice(0, 4000),
      locale,
    });
    setStatus(error ? "error" : "success");
  }

  if (status === "success") {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--accent)]/40 bg-[var(--accent-soft)] p-6 text-[var(--ink)]">
        {t.quote.success}
      </div>
    );
  }

  const fieldCls =
    "min-h-12 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[var(--ink)] placeholder:text-[var(--muted)]/70 outline-none transition-colors focus:border-[var(--accent)]/60";

  return (
    <div>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <input
          required
          placeholder={t.quote.name}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className={fieldCls}
        />
        <input
          required
          placeholder={t.quote.company}
          value={form.company}
          onChange={(e) => update("company", e.target.value)}
          className={fieldCls}
        />
        <input
          required
          placeholder={t.quote.country}
          value={form.country}
          onChange={(e) => update("country", e.target.value)}
          className={fieldCls}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="email"
            placeholder={t.quote.email}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className={fieldCls}
          />
          <input
            placeholder={t.quote.whatsapp}
            value={form.whatsapp}
            onChange={(e) => update("whatsapp", e.target.value)}
            className={fieldCls}
          />
        </div>
        <textarea
          required
          rows={5}
          placeholder={t.quote.partsListPlaceholder}
          value={form.parts_list}
          onChange={(e) => update("parts_list", e.target.value)}
          className={fieldCls}
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="min-h-12 rounded-[var(--radius-md)] bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--accent-ink)] transition-transform duration-200 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
        >
          {status === "submitting" ? t.quote.submitting : t.quote.submit}
        </button>
        {status === "error" && <p className="text-sm text-red-400">{t.quote.error}</p>}
      </form>

      <div className="mt-8 border-t border-[var(--line)] pt-6">
        <p className="text-sm font-medium text-[var(--muted)]">{t.quote.orContact}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href={whatsappLink("Hi Raznova, I'd like a quote.")}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-11 rounded-[var(--radius-md)] border border-[var(--accent)]/50 px-4 py-2.5 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)]"
          >
            {t.quote.whatsappButton}
          </a>
          <a
            href={mailtoLink("Quote Request")}
            className="min-h-11 rounded-[var(--radius-md)] border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)]/85 transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
          >
            {t.quote.emailButton} ({CONTACT_EMAIL})
          </a>
        </div>
      </div>
    </div>
  );
}
