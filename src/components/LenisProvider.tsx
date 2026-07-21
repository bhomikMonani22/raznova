"use client";

import { useEffect } from "react";

/** Lenis smooth scrolling, lerp 0.1 — desktop pointers only. Mobile and
 * reduced-motion users keep native scroll, and the library is imported
 * dynamically at idle so it never sits on the critical path. */
export default function LenisProvider() {
  useEffect(() => {
    if (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const start = async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;
      const lenis = new Lenis({ lerp: 0.1 });
      let rafId = requestAnimationFrame(function loop(time) {
        lenis.raf(time);
        rafId = requestAnimationFrame(loop);
      });
      cleanup = () => {
        cancelAnimationFrame(rafId);
        lenis.destroy();
      };
    };

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 2500 })
      : window.setTimeout(start, 1200);

    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle as number);
      else clearTimeout(idle as number);
      cleanup?.();
    };
  }, []);

  return null;
}
