import type { Translations } from "@/i18n/translations";
import SectionHeading from "./SectionHeading";

/** Server component. The purple progress line draws itself with a CSS
 * scroll-driven animation (.progress-line); browsers without
 * animation-timeline show it fully drawn. No client JS. */
export default function HowWeWork({ t }: { t: Translations }) {
  return (
    <section className="border-t border-[var(--line)] px-5 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow={t.howWeWork.eyebrow} title={t.howWeWork.title} />

        <div className="relative mt-14">
          {/* Track + scroll-linked progress line (transform-only). */}
          <div className="absolute inset-x-0 top-0 h-px bg-[var(--line)]" aria-hidden="true" />
          <div
            aria-hidden="true"
            className="progress-line absolute inset-x-0 top-0 h-px bg-[var(--accent)]"
          />

          <ol className="grid gap-10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {t.howWeWork.steps.map((step, i) => (
              <li
                key={step.title}
                data-reveal
                style={{ "--reveal-i": i } as React.CSSProperties}
                className="relative"
              >
                <span
                  className="font-display pointer-events-none block text-[64px] font-bold leading-none md:text-[76px]"
                  style={{
                    WebkitTextStroke: "1px rgba(245, 241, 234, 0.28)",
                    color: "transparent",
                  }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display mt-4 text-lg font-bold text-[var(--ink)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
