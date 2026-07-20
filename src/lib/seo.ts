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
