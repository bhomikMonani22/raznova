"use client";

import { useEffect } from "react";
import type { Locale } from "@/i18n/locales";

/** The <html> tag lives in the root layout above the [locale] segment, so
 * its lang can't vary server-side without restructuring layouts. This shim
 * corrects document lang on the client — Googlebot renders JS and sees the
 * corrected value; hreflang annotations (Phase 4) are the primary signal. */
export default function SetHtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
