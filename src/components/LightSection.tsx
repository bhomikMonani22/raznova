import type { Translations } from "@/i18n/translations";

/** The one light-contrast section. The cream panel is always fully opaque —
 * dark text must never land on a dark background — and gradient strips at
 * the top and bottom blend it into the neighbouring near-black sections so
 * the transition reads as a crossfade, not a seam. Server component. */
export default function LightSection({ t }: { t: Translations }) {
  return (
    <section className="relative overflow-hidden bg-[var(--cream)]">
      <div
        aria-hidden="true"
        className="cream-edge-top pointer-events-none absolute inset-x-0 top-0 h-24"
      />
      <div
        aria-hidden="true"
        className="cream-edge-bottom pointer-events-none absolute inset-x-0 bottom-0 h-24"
      />

      <div className="relative mx-auto max-w-4xl px-5 py-24 text-center md:py-32">
        <p data-reveal className="eyebrow">
          {t.lightSection.eyebrow}
        </p>
        <h2
          data-reveal
          style={{ "--reveal-i": 1 } as React.CSSProperties}
          className="font-display mt-3 text-display-2 font-bold text-[var(--cream-ink)]"
        >
          {t.lightSection.title}
        </h2>
        <p
          data-reveal
          style={{ "--reveal-i": 2 } as React.CSSProperties}
          className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--cream-muted)]"
        >
          {t.lightSection.body}
        </p>

        <blockquote
          data-reveal
          style={{ "--reveal-i": 3 } as React.CSSProperties}
          className="mx-auto mt-12 max-w-2xl border-t border-[var(--cream-line)] pt-10"
        >
          <p className="font-serif-quote text-2xl leading-snug text-[var(--cream-ink)] md:text-[1.75rem]">
            &ldquo;{t.lightSection.quote}&rdquo;
          </p>
          <footer className="font-mono-credentials mt-6 text-xs uppercase tracking-[0.18em] text-[var(--cream-muted)]">
            Raznova Exports · Pune, India
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
