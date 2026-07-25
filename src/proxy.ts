import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/locales";
import { LANDING_SLUGS } from "@/lib/landings";

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};

// Top-level English landing pages (Phase-3 SEO) are served at un-prefixed
// URLs, so they must not be redirected into the /[locale] tree.
const LANDING_PATHS = new Set(LANDING_SLUGS.map((s) => `/${s}`));

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  if (hasLocale || LANDING_PATHS.has(pathname)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.redirect(url);
}
