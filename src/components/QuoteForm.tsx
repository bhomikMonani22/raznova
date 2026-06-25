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
      <div className="rounded-md border border-green-200 bg-green-50 p-6 text-green-800">
        {t.quote.success}
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <input
          required
          placeholder={t.quote.name}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          required
          placeholder={t.quote.company}
          value={form.company}
          onChange={(e) => update("company", e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          required
          placeholder={t.quote.country}
          value={form.country}
          onChange={(e) => update("country", e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="email"
            placeholder={t.quote.email}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
          <input
            placeholder={t.quote.whatsapp}
            value={form.whatsapp}
            onChange={(e) => update("whatsapp", e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <textarea
          required
          rows={5}
          placeholder={t.quote.partsListPlaceholder}
          value={form.parts_list}
          onChange={(e) => update("parts_list", e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-md bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {status === "submitting" ? t.quote.submitting : t.quote.submit}
        </button>
        {status === "error" && <p className="text-sm text-red-600">{t.quote.error}</p>}
      </form>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <p className="text-sm font-medium text-slate-600">{t.quote.orContact}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href={whatsappLink("Hi Raznova, I'd like a quote.")}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-green-600 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
          >
            {t.quote.whatsappButton}
          </a>
          <a
            href={mailtoLink("Quote Request")}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t.quote.emailButton} ({CONTACT_EMAIL})
          </a>
        </div>
      </div>
    </div>
  );
}
