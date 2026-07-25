import Link from "next/link";
import type { Landing } from "@/lib/landings";
import { SITE_URL } from "@/lib/seo";
import JsonLd from "./JsonLd";
import Breadcrumbs from "./Breadcrumbs";
import { landingWebPage, faqPage, breadcrumbs } from "@/lib/schema";
import { whatsappLink, mailtoLink } from "@/lib/config";

/** Renders a Phase-3 B2B landing page from its Landing data: one H1, market
 * copy, visible FAQ (native <details> — accessible, crawlable, zero JS), an
 * internal-link mesh and a WhatsApp CTA, plus WebPage / BreadcrumbList /
 * FAQPage JSON-LD. Server component. */
export default function LandingPage({ data }: { data: Landing }) {
  const pageUrl = `${SITE_URL}/${data.slug}`;

  return (
    <div className="mx-auto max-w-4xl px-5 py-14 md:py-20">
      <JsonLd data={landingWebPage(data.slug, data.metaTitle, data.metaDescription)} />
      <JsonLd data={faqPage(data.faqs)} />
      <JsonLd
        data={breadcrumbs([
          { name: "Home", url: `${SITE_URL}/en` },
          { name: data.h1, url: pageUrl },
        ])}
      />

      <Breadcrumbs items={[{ name: "Home", href: "/en" }, { name: data.h1 }]} />

      <header className="mt-6">
        <p className="eyebrow">{data.eyebrow}</p>
        <h1 className="font-display mt-3 text-display-1 font-bold text-[var(--ink)]">{data.h1}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--ink)]/80">{data.lead}</p>
      </header>

      {/* Primary CTA above the fold. */}
      <div className="mt-8 flex flex-wrap gap-4">
        <a
          data-magnetic
          href={whatsappLink("Hi Raznova, I'd like a wholesale quote.")}
          target="_blank"
          rel="noopener noreferrer"
          className="magnetic inline-flex min-h-12 items-center gap-2.5 rounded-[var(--radius-md)] bg-[var(--accent)] px-7 py-3.5 text-base font-semibold text-[var(--accent-ink)]"
        >
          Get a Quote on WhatsApp
        </a>
        <a
          href={mailtoLink("Wholesale Quote Request")}
          className="inline-flex min-h-12 items-center rounded-[var(--radius-md)] border border-[var(--line-strong)] px-7 py-3.5 text-base font-semibold text-[var(--ink)] transition-colors hover:border-[var(--ink)]/40"
        >
          Email us
        </a>
      </div>

      <div className="mt-14 space-y-12">
        {data.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-display-3 font-bold text-[var(--ink)]">
              {section.heading}
            </h2>
            <div className="mt-3 space-y-4">
              {section.body.map((p, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-[var(--muted)]">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* FAQ — native details/summary, mirrored by FAQPage JSON-LD. */}
      <section className="mt-14">
        <h2 className="font-display text-display-3 font-bold text-[var(--ink)]">
          Frequently asked questions
        </h2>
        <div className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {data.faqs.map((faq) => (
            <details key={faq.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-[var(--ink)]">
                {faq.q}
                <span
                  aria-hidden="true"
                  className="text-[var(--accent)] transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Internal-link mesh. */}
      <section className="mt-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Explore further
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.related.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] card-surface px-5 py-4 text-[15px] font-medium text-[var(--ink)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                {link.label}
                <span aria-hidden="true" className="text-[var(--accent)]">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
