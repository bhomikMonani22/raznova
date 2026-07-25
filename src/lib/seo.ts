import type { Locale } from "@/i18n/locales";

export const SITE_URL = "https://raznova.in";

/** Trademark-safe fitment wording per OEM brand — never "genuine <brand>".
 * Used in titles, descriptions and H1s wherever a vehicle brand is named. */
const FITMENT_LABEL: Record<string, { en: string; es: string }> = {
  Hero: { en: "Hero-Fitment", es: "Compatibles con Hero" },
  Bajaj: { en: "Bajaj-Compatible", es: "Compatibles con Bajaj" },
  TVS: { en: "TVS-Pattern", es: "Patrón TVS" },
  Honda: { en: "Honda-Fitment", es: "Compatibles con Honda" },
};

export function fitmentLabel(brand: string, locale: Locale): string {
  const entry = FITMENT_LABEL[brand];
  if (!entry) return locale === "es" ? `Compatibles con ${brand}` : `${brand}-Compatible`;
  return locale === "es" ? entry.es : entry.en;
}

export function canonical(locale: Locale, path = ""): string {
  return `${SITE_URL}/${locale}${path}`;
}

/** hreflang map for a page that exists in all three real locales. Only en,
 * es and en-ZA are declared — every one is a genuinely translated or
 * region-adapted route; no locales are fabricated. x-default points at the
 * English route, which is what an unmatched visitor should land on. */
export function languageAlternates(path = ""): Record<string, string> {
  return {
    en: `${SITE_URL}/en${path}`,
    es: `${SITE_URL}/es${path}`,
    "en-ZA": `${SITE_URL}/en-ZA${path}`,
    "x-default": `${SITE_URL}/en${path}`,
  };
}

/** Per-locale home metadata — keyword-led, ≤60-char titles, ≤155-char
 * descriptions with IEC-registered exporter phrasing. */
export const HOME_META: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Motorcycle Spare Parts Exporter India | Raznova Exports",
    description:
      "IEC-registered two-wheeler spare parts exporter in Pune, India. Hero-fitment, Bajaj-compatible & TVS-pattern ranges shipped worldwide from Nhava Sheva.",
  },
  es: {
    title: "Exportador de Repuestos de Motos — India | Raznova",
    description:
      "Exportador registrado (IEC) de repuestos para motos desde Pune, India. Líneas compatibles con Hero, Bajaj y TVS enviadas a América Latina.",
  },
  "en-ZA": {
    title: "Two-Wheeler Spare Parts Exporter to Africa | Raznova",
    description:
      "IEC-registered exporter shipping two-wheeler spare parts from India to Southern & East Africa. Hero-fitment, Bajaj-compatible and TVS-pattern ranges.",
  },
};

export const QUOTE_META: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Request a Wholesale Parts Quote | Raznova Exports",
    description:
      "Request a wholesale quote for two-wheeler spare parts export from India. Line-by-line pricing within 24 hours from IEC-registered Raznova Exports.",
  },
  es: {
    title: "Solicitar Cotización Mayorista | Raznova Exports",
    description:
      "Solicite una cotización mayorista de repuestos para motos desde India. Precios línea por línea en 24 horas. Exportador registrado (IEC).",
  },
  "en-ZA": {
    title: "Request a Wholesale Parts Quote | Raznova Exports",
    description:
      "Request a wholesale quote for two-wheeler spare parts shipped from India to Africa. Line-by-line pricing within 24 hours from an IEC-registered exporter.",
  },
};

export const PARTS_META: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Two-Wheeler Spare Parts Index | Raznova Exports",
    description:
      "Full index of two-wheeler spare parts stocked for export from India — engine, electrical, transmission, brakes and body, by motorcycle platform.",
  },
  es: {
    title: "Índice de Repuestos para Motos | Raznova Exports",
    description:
      "Índice completo de repuestos para motos en stock para exportación desde India — motor, eléctrico, transmisión, frenos y carrocería, por plataforma.",
  },
  "en-ZA": {
    title: "Two-Wheeler Spare Parts Index | Raznova Exports",
    description:
      "Full index of two-wheeler spare parts stocked for export from India to Africa — engine, electrical, transmission, brakes and body, by platform.",
  },
};

export function catalogMeta(brand: string, locale: Locale): { title: string; description: string } {
  const label = fitmentLabel(brand, locale);
  if (locale === "es") {
    return {
      title: `Catálogos de Repuestos ${label} | Raznova`,
      description: `Catálogos PDF de repuestos ${label.toLowerCase()} para motos. Suministro mayorista de exportación desde India — Raznova Exports, registrado IEC.`,
    };
  }
  return {
    title: `${label} Spare Parts Catalogues | Raznova Exports`,
    description: `Download ${label.toLowerCase()} two-wheeler spare parts catalogues (PDF). Wholesale export supply from IEC-registered Raznova Exports, Pune, India.`,
  };
}

/** The Phase-3 landing page that matches an OEM vehicle brand, so catalog
 * pages can link out to the deeper market/fitment content (and pass link
 * equity both ways). Returns null for brands without a landing page. */
const BRAND_LANDING: Record<string, { slug: string; label: string }> = {
  Hero: { slug: "hero-spare-parts-exporter", label: "Hero-fitment spare parts exporter" },
  Bajaj: { slug: "bajaj-spare-parts-exporter", label: "Bajaj-compatible spare parts supplier" },
  TVS: { slug: "tvs-spare-parts-exporter", label: "TVS-pattern spare parts exporter" },
  Honda: { slug: "honda-fitment-spare-parts-exporter", label: "Honda-fitment spare parts exporter" },
};

export function brandLanding(brand: string): { slug: string; label: string } | null {
  return BRAND_LANDING[brand] ?? null;
}

export function partBrandMeta(brand: string, locale: Locale): { title: string; description: string } {
  if (locale === "es") {
    return {
      title: `Catálogo ${brand} — Exportación | Raznova`,
      description: `Catálogo de repuestos ${brand} para exportación mayorista. Suministro nivel distribuidor desde Raznova Exports, Pune, India (registrado IEC).`,
    };
  }
  return {
    title: `${brand} Parts Catalogue — Export Supply | Raznova Exports`,
    description: `${brand} two-wheeler parts catalogue for wholesale export. Distributor-grade supply from IEC-registered Raznova Exports, Pune, India.`,
  };
}
