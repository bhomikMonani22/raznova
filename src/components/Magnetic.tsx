"use client";

import { useRef } from "react";

const MAX_PULL = 6;

/** Magnetic cursor pull for CTAs — desktop (fine pointer) only, max 6px
 * offset, scale 0.97 on press for instant (<100ms) feedback. Vanilla
 * transforms + CSS transitions: no animation library in the critical path.
 * Touch devices and reduced-motion users get the press scale only. */
export default function Magnetic({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function allowed() {
    return (
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function onMouseMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || !allowed()) return;
    const rect = el.getBoundingClientRect();
    const relX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const relY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    const x = Math.max(-1, Math.min(1, relX)) * MAX_PULL;
    const y = Math.max(-1, Math.min(1, relY)) * MAX_PULL;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  }

  function onMouseLeave() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <div
      ref={ref}
      className={`magnetic inline-block ${className ?? ""}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}
