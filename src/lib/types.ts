export type CatalogEntry = {
  id: number;
  vehicle_type: "motorcycle" | "three_wheeler";
  brand: string;
  model: string;
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
