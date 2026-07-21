import type { Locale } from "@/i18n/locales";
import type { CatalogEntry } from "@/lib/types";
import {
  BRAND_NAME,
  CONTACT_EMAIL,
  WHATSAPP_NUMBER,
} from "@/lib/config";
import { SITE_URL, fitmentLabel } from "@/lib/seo";

// JSON-LD builders. Every object here must remain valid schema.org and
// trademark-safe: vehicle-brand names appear only as compatible-fitment
// wording inside name/description text, never as a Product `brand` field.

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export function organizationAndWebsite(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: `${BRAND_NAME} Exports`,
        legalName: "Shrinath Ji Enterprises",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/brand/raznova-mark.png`,
          width: 400,
          height: 400,
        },
        image: `${SITE_URL}/brand/og.jpg`,
        email: CONTACT_EMAIL,
        telephone: WHATSAPP_NUMBER,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Pune",
          addressRegion: "Maharashtra",
          addressCountry: "IN",
        },
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "sales",
            telephone: WHATSAPP_NUMBER,
            email: CONTACT_EMAIL,
            availableLanguage: ["en", "es"],
          },
        ],
        sameAs: ["https://www.linkedin.com/company/raznova/"],
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: `${BRAND_NAME} Exports`,
        inLanguage: locale,
        publisher: { "@id": ORG_ID },
      },
    ],
  };
}

export function webPage(locale: Locale, path: string, name: string, description: string) {
  const url = `${SITE_URL}/${locale}${path}`;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: locale,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
  };
}

export function breadcrumbs(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** Catalog entries as an ItemList of Products. Fitment is expressed in
 * name/description text only — no `brand` field, no offers (no public
 * pricing in quote-based B2B; markup is for entity understanding, not
 * price-snippet eligibility). */
export function vehicleCatalogProducts(
  locale: Locale,
  vehicleType: string,
  brand: string,
  entries: CatalogEntry[]
) {
  const pageUrl = `${SITE_URL}/${locale}/catalog/${vehicleType}/${encodeURIComponent(brand)}`;
  const label = fitmentLabel(brand, locale);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${label} spare parts catalogues`,
    itemListElement: entries.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: `${entry.model ?? entry.brand} — ${label} spare parts range`,
        description: `OEM-pattern and aftermarket compatible spare parts with fitment for ${brand} ${entry.model ?? ""}. Wholesale export supply from India. ${entry.title}.`.replace(/\s+/g, " "),
        url: pageUrl,
        category: "Vehicle Parts & Accessories > Motorcycle Parts",
      },
    })),
  };
}

/** Aftermarket carried-brand catalogue page. These are the parts brands we
 * distribute, so `brand` is accurate here (it is the product's own brand). */
export function partBrandProducts(locale: Locale, brand: string, entries: CatalogEntry[]) {
  const pageUrl = `${SITE_URL}/${locale}/brands/${encodeURIComponent(brand)}`;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${brand} two-wheeler parts for export`,
    itemListElement: entries.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: `${brand} two-wheeler parts — export supply`,
        description: `${entry.title}. Distributor-grade ${brand} parts for wholesale export from India.`,
        url: pageUrl,
        brand: { "@type": "Brand", name: brand },
        category: "Vehicle Parts & Accessories > Motorcycle Parts",
      },
    })),
  };
}

/** Serialize for a <script type="application/ld+json"> tag. Escapes `<` so
 * user-derived strings can never break out of the script context. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
