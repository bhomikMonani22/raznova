"use client";

import { useEffect, useState } from "react";

/** Once-per-session page-load intro: the wordmark fades in centered on a
 * near-black curtain, then the curtain wipes up to reveal the page.
 * Visibility is decided pre-paint by the inline gate script in the root
 * layout (html.intro-pending + sessionStorage flag), so this never flashes
 * for returning visitors and never runs under prefers-reduced-motion. */
export default function IntroCurtain() {
  const [lifting, setLifting] = useState(false);

  useEffect(() => {
    if (!document.documentElement.classList.contains("intro-pending")) return;

    try {
      sessionStorage.setItem("rz-intro", "1");
    } catch {
      /* private mode — intro just replays next visit */
    }

    const lift = setTimeout(() => setLifting(true), 450);
    const done = setTimeout(() => {
      document.documentElement.classList.remove("intro-pending");
    }, 1000);

    return () => {
      clearTimeout(lift);
      clearTimeout(done);
    };
  }, []);

  return (
    <div
      id="intro-curtain"
      aria-hidden="true"
      className="fixed inset-0 z-[100] items-center justify-center bg-[var(--bg)]"
      style={{
        transform: lifting ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 0.5s cubic-bezier(0.65, 0, 0.35, 1)",
      }}
    >
      <span
        className="font-display text-3xl font-bold tracking-tight text-[var(--ink)]"
        style={{
          opacity: lifting ? 0 : undefined,
          transition: "opacity 0.3s ease",
          animation: "intro-logo 0.4s ease-out both",
        }}
      >
        Raznova<span className="text-[var(--accent)]">.</span>
      </span>
      <style>{`@keyframes intro-logo { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
