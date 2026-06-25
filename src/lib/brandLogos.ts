// Maps brand names (as stored in raznova_catalogs.brand / shown in the
// "brands we carry" marquee) to a logo file under /public/assets/logos.
//
// OEM vehicle brands (Hero, Bajaj, TVS) live under /assets/logos/oem and must
// only ever be rendered in clearly fitment-disclaimed contexts — never in the
// site's own identity (nav/footer/hero).
//
// Aftermarket carried brands live under /assets/logos/brands. Suprajit and MK
// have logos but currently no catalog PDFs — they still appear in the
// brands-we-carry marquee, just without a link. UCAL has a catalog but no
// logo on file — components should fall back to a text wordmark when
// getBrandLogo() returns null.

export type BrandLogoEntry = {
  brand: string;
  src: string;
  alt: string;
};

const OEM_LOGOS: Record<string, string> = {
  Hero: "/assets/logos/oem/hero.png",
  Bajaj: "/assets/logos/oem/bajaj.png",
  TVS: "/assets/logos/oem/tvs.png",
};

const BRAND_LOGOS: Record<string, string> = {
  Varroc: "/assets/logos/brands/varroc.png",
  "Uno Minda": "/assets/logos/brands/uno-minda.png",
  Endurance: "/assets/logos/brands/endurance.png",
  Suprajit: "/assets/logos/brands/suprajit.png",
  "JK Tyre": "/assets/logos/brands/jk-tyre.png",
  MK: "/assets/logos/brands/mk.png",
};

/** Carried aftermarket brands shown in the "Brands we carry" marquee, even
 * ones without a logo file (UCAL) or without a catalog (Suprajit, MK). */
export const CARRIED_BRANDS = [
  "Endurance",
  "Uno Minda",
  "UCAL",
  "Varroc",
  "JK Tyre",
  "Suprajit",
  "MK",
] as const;

/** Returns the logo path for a carried aftermarket brand, or null if no logo
 * file exists (caller should render a text wordmark fallback). */
export function getBrandLogo(brand: string): string | null {
  return BRAND_LOGOS[brand] ?? null;
}

/** Returns the logo path for an OEM vehicle brand (Hero/Bajaj/TVS), or null.
 * Only render these in fitment-disclaimed contexts, never as site identity. */
export function getOemLogo(brand: string): string | null {
  return OEM_LOGOS[brand] ?? null;
}
