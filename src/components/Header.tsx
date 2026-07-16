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
      setScrolled(window.scrollY > 80);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const motorcycleBrands = uniqueVehicleBrands(catalogs, "motorcycle");
  const threeWheelerBrands = uniqueVehicleBrands(catalogs, "three_wheeler");
  const partBrands = uniquePartBrands(catalogs);

  const solid = scrolled || mobileOpen;

  return (
    <header
      className={`sticky top-0 z-50 h-16 transition-all duration-300 ${
        solid
          ? "glass-panel border-x-0 border-t-0 border-b border-[var(--line)]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5">
        <Link
          href={`/${locale}`}
          className="font-display text-xl font-bold tracking-tight text-[var(--ink)]"
        >
          {BRAND_NAME}
          <span className="text-[var(--accent)]">.</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <Link
            href={`/${locale}`}
            className="text-sm font-medium text-[var(--ink)]/85 transition-colors hover:text-[var(--accent)]"
          >
            {t.nav.home}
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setOpen("motorcycle")}
            onMouseLeave={() => setOpen(null)}
          >
            <button className="py-5 text-sm font-medium text-[var(--ink)]/85 transition-colors hover:text-[var(--accent)]">
              {t.nav.motorcycle}
            </button>
            {open === "motorcycle" && motorcycleBrands.length > 0 && (
              <div className="glass-panel absolute left-0 top-full w-48 rounded-[var(--radius-md)] py-2 shadow-[var(--shadow-lift)]">
                {motorcycleBrands.map((brand) => (
                  <Link
                    key={brand}
                    href={`/${locale}/catalog/motorcycle/${encodeURIComponent(brand)}`}
                    className="block px-4 py-2 text-sm text-[var(--ink)]/85 transition-colors hover:bg-white/5 hover:text-[var(--accent)]"
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
              <button className="py-5 text-sm font-medium text-[var(--ink)]/85 transition-colors hover:text-[var(--accent)]">
                {t.nav.threeWheeler}
              </button>
              {open === "three_wheeler" && (
                <div className="glass-panel absolute left-0 top-full w-48 rounded-[var(--radius-md)] py-2 shadow-[var(--shadow-lift)]">
                  {threeWheelerBrands.map((brand) => (
                    <Link
                      key={brand}
                      href={`/${locale}/catalog/three_wheeler/${encodeURIComponent(brand)}`}
                      className="block px-4 py-2 text-sm text-[var(--ink)]/85 transition-colors hover:bg-white/5 hover:text-[var(--accent)]"
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
              <button className="py-5 text-sm font-medium text-[var(--ink)]/85 transition-colors hover:text-[var(--accent)]">
                {t.nav.partBrands}
              </button>
              {open === "part_brands" && (
                <div className="glass-panel absolute left-0 top-full w-48 rounded-[var(--radius-md)] py-2 shadow-[var(--shadow-lift)]">
                  {partBrands.map((brand) => (
                    <Link
                      key={brand}
                      href={`/${locale}/brands/${encodeURIComponent(brand)}`}
                      className="block px-4 py-2 text-sm text-[var(--ink)]/85 transition-colors hover:bg-white/5 hover:text-[var(--accent)]"
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
            className="rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)] transition-transform duration-200 hover:scale-[1.02]"
          >
            {t.nav.requestQuote}
          </Link>
        </div>

        <button
          className="flex h-11 w-11 items-center justify-center text-[var(--ink)] md:hidden"
          aria-label="Menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="glass-panel max-h-[calc(100vh-4rem)] overflow-y-auto border-x-0 border-b border-t border-[var(--line)] px-5 py-4 md:hidden">
          <Link
            href={`/${locale}`}
            onClick={() => setMobileOpen(false)}
            className="block py-2.5 text-sm font-medium text-[var(--ink)]"
          >
            {t.nav.home}
          </Link>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            {t.nav.motorcycle}
          </p>
          {motorcycleBrands.map((brand) => (
            <Link
              key={brand}
              href={`/${locale}/catalog/motorcycle/${encodeURIComponent(brand)}`}
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 pl-2 text-sm text-[var(--ink)]/85"
            >
              {brand}
            </Link>
          ))}
          {threeWheelerBrands.length > 0 && (
            <>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                {t.nav.threeWheeler}
              </p>
              {threeWheelerBrands.map((brand) => (
                <Link
                  key={brand}
                  href={`/${locale}/catalog/three_wheeler/${encodeURIComponent(brand)}`}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 pl-2 text-sm text-[var(--ink)]/85"
                >
                  {brand}
                </Link>
              ))}
            </>
          )}
          {partBrands.length > 0 && (
            <>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                {t.nav.partBrands}
              </p>
              {partBrands.map((brand) => (
                <Link
                  key={brand}
                  href={`/${locale}/brands/${encodeURIComponent(brand)}`}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 pl-2 text-sm text-[var(--ink)]/85"
                >
                  {brand}
                </Link>
              ))}
            </>
          )}
          <div className="mt-4 flex items-center gap-3 border-t border-[var(--line)] pt-4">
            <LanguageSwitcher locale={locale} />
            <Link
              href={`/${locale}/quote`}
              onClick={() => setMobileOpen(false)}
              className="rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-ink)]"
            >
              {t.nav.requestQuote}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
