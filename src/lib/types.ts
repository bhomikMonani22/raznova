export type CatalogEntry = {
  id: number;
  catalog_type: "vehicle" | "brand";
  vehicle_type: "motorcycle" | "three_wheeler" | null;
  brand: string;
  model: string | null;
  title: string;
  pdf_url: string;
  sort_order: number;
};

export type ShowcasePart = {
  id: number;
  brand: string;
  model: string;
  part_no: string;
  category: string;
  image_url: string;
  description_en: string;
  description_es: string;
  sort_order: number;
};

/** What actually crosses to the client: one locale's description and only
 * the fields the card renders. Halves the serialized showcase payload. */
export type ShowcasePartLite = {
  id: number;
  brand: string;
  model: string;
  category: string;
  image_url: string;
  description: string;
};
