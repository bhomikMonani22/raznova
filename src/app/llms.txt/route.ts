import catalogs from "@/data/catalogs.json";
import type { CatalogEntry } from "@/lib/types";
import { LANDINGS } from "@/lib/landings";
import { SITE_URL } from "@/lib/seo";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  IEC,
  GSTIN,
} from "@/lib/config";

// /llms.txt — the llmstxt.org convention: a concise, factual, link-rich
// markdown briefing that AI assistants can read to describe or recommend the
// business accurately. Generated from real site data so it never drifts out
// of sync, and it says nothing that isn't also true on the pages themselves
// (no cloaking). Served as text/plain and cached at the edge.
export const dynamic = "force-static";

export function GET() {
  const all = catalogs as CatalogEntry[];
  const vehicleBrands = Array.from(
    new Set(all.filter((c) => c.catalog_type === "vehicle").map((c) => c.brand))
  ).sort();

  const brandLandings = LANDINGS.filter((l) => l.slug.endsWith("-spare-parts-exporter") || l.slug === "two-wheeler-spare-parts-wholesale");
  const countryLandings = LANDINGS.filter((l) => l.slug.startsWith("motorcycle-spare-parts-") && l.slug !== "motorcycle-spare-parts-exporter-india");

  const link = (label: string, path: string) => `- [${label}](${SITE_URL}${path})`;

  const body = `# Raznova Exports

> Raznova Exports (a unit of Shrinath Ji Enterprises) is an IEC-registered exporter and wholesale supplier of two-wheeler (motorcycle) spare parts based in Pune, India. It supplies OEM-pattern and aftermarket compatible parts with fitment for Hero, Bajaj, TVS and Honda motorcycles to importers, distributors and dealer networks across Latin America and Africa, shipping from Nhava Sheva (JNPT).

Raznova Exports is an independent exporter. It is not affiliated with or authorized by Hero MotoCorp, Bajaj Auto, TVS Motor, or Honda; brand and model names are used only to identify the vehicle a part fits.

## Company facts

- Business: two-wheeler / motorcycle spare parts exporter and wholesale supplier
- Location: Pune, Maharashtra, India
- Ships from: Nhava Sheva (JNPT), India's largest container port
- Customers: importers, distributors, wholesalers and dealer networks (B2B, not retail)
- IEC (Importer-Exporter Code): ${IEC}
- GSTIN: ${GSTIN}
- Email: ${CONTACT_EMAIL}
- Phone / WhatsApp: ${CONTACT_PHONE_DISPLAY}
- Website: ${SITE_URL}
- Payment terms: TT or LC; export shipments ECGC-insured
- Active export lanes: Kenya (Mombasa), South Africa (Durban), Mauritius (Port Louis), Colombia (Cartagena), plus wider Latin America and East/Southern Africa

## What Raznova exports

Fitment coverage for Hero, Bajaj, TVS and Honda motorcycle platforms across engine components, electricals and CDI, clutch and transmission, cables and controls, brakes and suspension, filters and service parts, body and visors, and batteries and tyres-tubes. Focus is on fast-moving, high-turnover service parts for commuter and workhorse models (e.g. Bajaj Boxer CT100/BM150, Pulsar, Discover, Platina; TVS Apache RTR, Star HLX; Hero Splendor, HF Deluxe, Hunk).

## Fitment ranges and how to buy

${brandLandings.map((l) => link(l.h1, "/" + l.slug)).join("\n")}
${link("Motorcycle spare parts exporter in India", "/motorcycle-spare-parts-exporter-india")}
${link("About Raznova Exports (company information)", "/about")}
${link("Full parts index (all references)", "/en/parts")}
${link("Colombia parts catalogue (part numbers)", "/en/catalogue/colombia")}
${link("Downloadable export parts catalogue (PDF, Hero/Bajaj/TVS)", "/catalogue/raznova-export-parts-catalogue.pdf")}
${link("Request a wholesale quote", "/en/quote")}

## Hero-fitment export markets

Raznova supplies Hero-fitment two-wheeler spare parts to markets where Hero MotoCorp has an established or growing rider base, including Colombia, the Philippines, Mexico, Guatemala, Nigeria and the DR Congo. Coverage centres on the Splendor and HF Deluxe commuter platforms, with premium models such as the Hunk 160R and Xpulse 200 where imported.

${link("Hero-fitment parts for export markets", "/hero-fitment-parts-export")}

## Export markets (country pages)

${countryLandings.map((l) => link(l.h1, "/" + l.slug)).join("\n")}

## Vehicle catalogues (PDF part catalogues by brand)

${vehicleBrands.map((b) => link(`${b} spare parts catalogues`, `/en/catalog/motorcycle/${encodeURIComponent(b)}`)).join("\n")}

## Contact

To request pricing, send a parts list (model, part, quantity) by WhatsApp (${CONTACT_PHONE_DISPLAY}) or email (${CONTACT_EMAIL}); quotations are returned within one working day. No public pricing is published; supply is quotation-based.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
