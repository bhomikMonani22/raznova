"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

// Module-level guard so React StrictMode's double-invoke (and quick
// remounts) never send duplicate page_view events for the same path.
let lastTrackedPath = "";

const QUOTE_PATH = /^\/(?:en|es|en-ZA)\/quote\/?$/;

/** Site-wide analytics wiring, mounted once in the root layout:
 *  - page_view (or quote_page_view) on first load and every client-side
 *    navigation, deduped by pathname;
 *  - a single delegated click listener that records whatsapp_click and
 *    email_click for every WhatsApp / mailto link on the site without
 *    touching the links themselves.
 * Rendering nothing, and every call is fail-silent. */
export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname === lastTrackedPath) return;
    // The private /insights dashboard must not record itself as visitor traffic.
    if (pathname.startsWith("/insights")) return;
    lastTrackedPath = pathname;
    track(QUOTE_PATH.test(pathname) ? "quote_page_view" : "page_view");
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      const label = (anchor.textContent || "").trim().slice(0, 60);

      if (/wa\.me\/|api\.whatsapp\.com/i.test(href)) {
        // Never capture the WhatsApp message body — only that a click happened.
        track("whatsapp_click", { label });
      } else if (href.startsWith("mailto:")) {
        track("email_click", { label });
      }
    }
    // Capture phase so the event is recorded even if a handler stops
    // propagation; we never call preventDefault, so the link still works.
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
