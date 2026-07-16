"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/** Lenis smooth scrolling, lerp 0.1 — desktop pointers only. Mobile and
 * reduced-motion users keep native scroll. */
export default function LenisProvider() {
  useEffect(() => {
    if (
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const lenis = new Lenis({ lerp: 0.1 });
    let rafId = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
