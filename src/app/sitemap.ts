import type { MetadataRoute } from "next";
import catalogs from "@/data/catalogs.json";
import type { CatalogEntry } from "@/lib/types";
import { LOCALES } from "@/i18n/locales";
import { SITE_URL } from "@/lib/seo";

// Every indexable page across all three locales. lastModified is the build
// date — the site is fully static, so content only changes on deploy.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const all = catalogs as CatalogEntry[];

  const vehiclePaths = Array.from(
    new Set(
      all
        .filter((c) => c.catalog_type === "vehicle")
        .map((c) => `/catalog/${c.vehicle_type}/${encodeURIComponent(c.brand)}`)
    )
  );
  const brandPaths = Array.from(
    new Set(
      all
        .filter((c) => c.catalog_type === "brand")
        .map((c) => `/brands/${encodeURIComponent(c.brand)}`)
    )
  );

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of LOCALES) {
    entries.push({
      url: `${SITE_URL}/${locale}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    });
    for (const path of vehiclePaths) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.9,
      });
    }
    for (const path of brandPaths) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
    entries.push({
      url: `${SITE_URL}/${locale}/quote`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }
  return entries;
}
