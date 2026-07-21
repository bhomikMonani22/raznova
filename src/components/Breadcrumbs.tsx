import Link from "next/link";

/** Visible breadcrumb trail. Mirrors the BreadcrumbList JSON-LD on the same
 * page — Google expects markup to reflect on-page navigation. The final
 * crumb is the current page and is not linked. */
export default function Breadcrumbs({
  items,
}: {
  items: { name: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--muted)]">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.name} className="flex items-center gap-x-2">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                >
                  {item.name}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined}>{item.name}</span>
              )}
              {!last && (
                <span aria-hidden="true" className="text-[var(--muted)]/50">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
