"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// The scroll-reveal / magnetic setup lives in the root layout's inline BOOT
// script and runs once on hard load. This site is an App-Router SPA, so
// client-side navigations never re-run it — leaving the new page's
// [data-reveal] elements stuck at opacity:0 (they only become visible when the
// IntersectionObserver adds .is-visible). That showed up as catalog/brand
// pages rendering "just the heading and text" and the home page's below-fold
// sections blacking out after navigating back.
//
// On every route change we re-invoke the scan exposed as window.__rzScan. It is
// idempotent: reveal() only observes :not(.is-visible), magnetic() skips
// already-bound nodes, and countups skip [data-counted].
export default function RevealRescan() {
  const pathname = usePathname();

  useEffect(() => {
    const scan = () =>
      (window as unknown as { __rzScan?: () => void }).__rzScan?.();
    // Run immediately after commit so the observer is attached even when the
    // tab is backgrounded (rAF is throttled/paused there); then once more on
    // the next frame so anything still settling into layout is caught too.
    scan();
    const id = requestAnimationFrame(scan);
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
