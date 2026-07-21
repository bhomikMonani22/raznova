/** Consistent section header: uppercase micro-label eyebrow, display
 * headline, optional supporting line. Server component — reveal is driven
 * by the shared [data-reveal] observer, not a client animation library. */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  onCream = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  onCream?: boolean;
}) {
  const alignCls = align === "center" ? "text-center items-center" : "text-left items-start";
  return (
    <div className={`flex flex-col gap-3 ${alignCls}`}>
      <p data-reveal className="eyebrow">
        {eyebrow}
      </p>
      <h2
        data-reveal
        style={{ "--reveal-i": 1 } as React.CSSProperties}
        className={`font-display text-display-2 font-bold ${onCream ? "text-[var(--cream-ink)]" : "text-[var(--ink)]"}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          data-reveal
          style={{ "--reveal-i": 2 } as React.CSSProperties}
          className={`max-w-2xl text-[15px] ${onCream ? "text-[var(--cream-muted)]" : "text-[var(--muted)]"}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
