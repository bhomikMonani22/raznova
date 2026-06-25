"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { Translations } from "@/i18n/translations";
import type { CatalogEntry } from "@/lib/types";
import LanguageSwitcher from "./LanguageSwitcher";
import { BRAND_NAME } from "@/lib/config";

function uniqueBrands(catalogs: CatalogEntry[], vehicleType: string) {
  const brands = catalogs
    .filter((c) => c.vehicle_type === vehicleType)
    .map((c) => c.brand);
  return Array.from(new Set(brands)).sort();
}

export default function Header({
  locale,
  t,
  catalogs,
}: {
  locale: Locale;
  t: Translations;
  catalogs: CatalogEntry[];
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const motorcycleBrands = uniqueBrands(catalogs, "motorcycle");
  const threeWheelerBrands = uniqueBrands(catalogs, "three_wheeler");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={`/${locale}`} className="text-xl font-bold tracking-tight text-orange-600">
          {BRAND_NAME}
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href={`/${locale}`} className="text-sm font-medium text-slate-700 hover:text-orange-600">
            {t.nav.home}
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setOpen("motorcycle")}
            onMouseLeave={() => setOpen(null)}
          >
            <button className="text-sm font-medium text-slate-700 hover:text-orange-600">
              {t.nav.motorcycle}
            </button>
            {open === "motorcycle" && motorcycleBrands.length > 0 && (
              <div className="absolute left-0 top-full w-48 rounded-md border border-slate-200 bg-white py-2 shadow-lg">
                {motorcycleBrands.map((brand) => (
                  <Link
                    key={brand}
                    href={`/${locale}/catalog/motorcycle/${encodeURIComponent(brand)}`}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    {brand}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {threeWheelerBrands.length > 0 && (
            <div
              className="relative"
              onMouseEnter={() => setOpen("three_wheeler")}
              onMouseLeave={() => setOpen(null)}
            >
              <button className="text-sm font-medium text-slate-700 hover:text-orange-600">
                {t.nav.threeWheeler}
              </button>
              {open === "three_wheeler" && (
                <div className="absolute left-0 top-full w-48 rounded-md border border-slate-200 bg-white py-2 shadow-lg">
                  {threeWheelerBrands.map((brand) => (
                    <Link
                      key={brand}
                      href={`/${locale}/catalog/three_wheeler/${encodeURIComponent(brand)}`}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                    >
                      {brand}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher locale={locale} />
          <Link
            href={`/${locale}/quote`}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            {t.nav.requestQuote}
          </Link>
        </div>

        <button
          className="md:hidden"
          aria-label="Menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <Link href={`/${locale}`} className="block py-2 text-sm font-medium text-slate-700">
            {t.nav.home}
          </Link>
          <p className="mt-2 text-xs font-semibold uppercase text-slate-400">{t.nav.motorcycle}</p>
          {motorcycleBrands.map((brand) => (
            <Link
              key={brand}
              href={`/${locale}/catalog/motorcycle/${encodeURIComponent(brand)}`}
              className="block py-2 pl-2 text-sm text-slate-700"
            >
              {brand}
            </Link>
          ))}
          {threeWheelerBrands.length > 0 && (
            <>
              <p className="mt-2 text-xs font-semibold uppercase text-slate-400">{t.nav.threeWheeler}</p>
              {threeWheelerBrands.map((brand) => (
                <Link
                  key={brand}
                  href={`/${locale}/catalog/three_wheeler/${encodeURIComponent(brand)}`}
                  className="block py-2 pl-2 text-sm text-slate-700"
                >
                  {brand}
                </Link>
              ))}
            </>
          )}
          <div className="mt-3 flex items-center gap-3">
            <LanguageSwitcher locale={locale} />
            <Link
              href={`/${locale}/quote`}
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {t.nav.requestQuote}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
