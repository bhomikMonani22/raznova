// Editable list of HOME page showcase bikes. Confirmed 2026-06-25 against
// real Colombia 2025 sales data (TVS Raider/Apache, Bajaj Boxer/Pulsar, Hero Hunk/HF).
export type FeaturedBike = {
  brand: "TVS" | "Bajaj" | "Hero";
  model: string;
  catalogModel?: string; // matching `model` in pdf_manifest.json, if a catalog exists
};

export const FEATURED_BIKES: FeaturedBike[] = [
  { brand: "TVS",   model: "Apache RTR 160",        catalogModel: "Apache RTR 160" },
  { brand: "TVS",   model: "Star HLX 125" },
  { brand: "TVS",   model: "HLX 150" },
  { brand: "Bajaj", model: "Boxer (CT100 / BM150)", catalogModel: "Boxer CT100" },
  { brand: "Bajaj", model: "Pulsar 150/180",         catalogModel: "Pulsar 150 UG4" },
  { brand: "Bajaj", model: "Discover / Platina",     catalogModel: "Discover 100" },
  { brand: "Hero",  model: "Hunk" },
  { brand: "Hero",  model: "Eco Deluxe" },
  { brand: "Hero",  model: "Splendor NXG" },
];
