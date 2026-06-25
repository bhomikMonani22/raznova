// Editable list of HOME page showcase bikes. Confirmed 2026-06-25 against
// real Colombia 2025 sales data (TVS Raider/Apache, Bajaj Boxer/Pulsar, Hero Hunk/HF).
export type FeaturedBike = {
  brand: "TVS" | "Bajaj" | "Hero";
  model: string;
  catalogModel?: string; // matching `model` in pdf_manifest.json, if a catalog exists
};

export const FEATURED_BIKES: FeaturedBike[] = [
  { brand: "TVS", model: "Raider 125" },
  { brand: "TVS", model: "Apache RTR 160 4V", catalogModel: "Apache RTR 160" },
  { brand: "TVS", model: "Apache RTR 200 4V", catalogModel: "Apache RTR 200" },
  { brand: "Bajaj", model: "Boxer CT100", catalogModel: "Boxer CT100" },
  { brand: "Bajaj", model: "Boxer CT125" },
  { brand: "Bajaj", model: "Pulsar NS200" },
  { brand: "Hero", model: "Hunk 125R" },
  { brand: "Hero", model: "Hunk 160" },
  { brand: "Hero", model: "HF 100", catalogModel: "HF 100" },
];
