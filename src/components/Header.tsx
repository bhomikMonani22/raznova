"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/locales";
import type { Translations } from "@/i18n/translations";
import type { CatalogEntry } from "@/lib/types";
import LanguageSwitcher from "./LanguageSwitcher";
import { BRAND_NAME } from "@/lib/config";

function uniqueVehicleBrands(catalogs: CatalogEntry[], vehicleType: string) {
  const brands = catalogs
    .filter((c) => c.catalog_type === "vehicle" && c.vehicle_type === vehicleType)
    .map((c) => c.brand);
  return Array.from(new Set(brands)).sort();
}

function uniquePartBrands(catalogs: CatalogEntry[]) {
  const brands = catalogs
    .filter((c) => c.catalog_type === "brand")
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const motorcycleBrands = uniqueVehicleBrands(catalogs, "motorcycle");
  const threeWheelerBrands = uniqueVehicleBrands(catalogs, "three_wheeler");
  const partBrands = uniquePartBrands(catalogs);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur-md shadow-[var(--shadow-soft)]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={`/${locale}`} className="font-display text-xl font-bold tracking-tight text-[var(--accent)]">
          {BRAND_NAME}
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href={`/${locale}`} className="text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)]">
            {t.nav.home}
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setOpen("motorcycle")}
            onMouseLeave={() => setOpen(null)}
          >
            <button className="text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)]">
              {t.nav.motorcycle}
            </button>
            {open === "motorcycle" && motorcycleBrands.length > 0 && (
              <div className="absolute left-0 top-full w-48 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] py-2 shadow-[var(--shadow-lift)]">
                {motorcycleBrands.map((brand) => (
                  <Link
                    key={brand}
                    href={`/${locale}/catalog/motorcycle/${encodeURIComponent(brand)}`}
                    className="block px-4 py-2 text-sm text-[var(--ink)] hover:bg-[var(--bg)] hover:text-[var(--accent)]"
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
              <button className="text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)]">
                {t.nav.threeWheeler}
              </button>
              {open === "three_wheeler" && (
                <div className="absolute left-0 top-full w-48 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] py-2 shadow-[var(--shadow-lift)]">
                  {threeWheelerBrands.map((brand) => (
                    <Link
                      key={brand}
                      href={`/${locale}/catalog/three_wheeler/${encodeURIComponent(brand)}`}
                      className="block px-4 py-2 text-sm text-[var(--ink)] hover:bg-[var(--bg)] hover:text-[var(--accent)]"
                    >
                      {brand}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {partBrands.length > 0 && (
            <div
              className="relative"
              onMouseEnter={() => setOpen("part_brands")}
              onMouseLeave={() => setOpen(null)}
            >
              <button className="text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)]">
                {t.nav.partBrands}
              </button>
              {open === "part_brands" && (
                <div className="absolute left-0 top-full w-48 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] py-2 shadow-[var(--shadow-lift)]">
                  {partBrands.map((brand) => (
                    <Link
                      key={brand}
                      href={`/${locale}/brands/${encodeURIComponent(brand)}`}
                      className="block px-4 py-2 text-sm text-[var(--ink)] hover:bg-[var(--bg)] hover:text-[var(--accent)]"
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
            className="rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02] hover:bg-[var(--accent)]/90"
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
        <div className="border-t border-[var(--line)] bg-[var(--surface)] px-4 py-3 md:hidden">
          <Link href={`/${locale}`} className="block py-2 text-sm font-medium text-[var(--ink)]">
            {t.nav.home}
          </Link>
          <p className="mt-2 text-xs font-semibold uppercase text-[var(--muted)]">{t.nav.motorcycle}</p>
          {motorcycleBrands.map((brand) => (
            <Link
              key={brand}
              href={`/${locale}/catalog/motorcycle/${encodeURIComponent(brand)}`}
              className="block py-2 pl-2 text-sm text-[var(--ink)]"
            >
              {brand}
            </Link>
          ))}
          {threeWheelerBrands.length > 0 && (
            <>
              <p className="mt-2 text-xs font-semibold uppercase text-[var(--muted)]">{t.nav.threeWheeler}</p>
              {threeWheelerBrands.map((brand) => (
                <Link
                  key={brand}
                  href={`/${locale}/catalog/three_wheeler/${encodeURIComponent(brand)}`}
                  className="block py-2 pl-2 text-sm text-[var(--ink)]"
                >
                  {brand}
                </Link>
              ))}
            </>
          )}
          {partBrands.length > 0 && (
            <>
              <p className="mt-2 text-xs font-semibold uppercase text-[var(--muted)]">{t.nav.partBrands}</p>
              {partBrands.map((brand) => (
                <Link
                  key={brand}
                  href={`/${locale}/brands/${encodeURIComponent(brand)}`}
                  className="block py-2 pl-2 text-sm text-[var(--ink)]"
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
              className="rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              {t.nav.requestQuote}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
