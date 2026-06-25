// Pulls raznova_catalogs + raznova_showcase from Supabase and writes
// committed snapshots to src/data/*.json. The site renders from these
// snapshots (fast, SEO-friendly, no build-time network dependency).
// Run this after uploading PDFs or importing showcase data, then commit + push.
//
// Usage: node scripts/sync_content.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Anon key is enough since these tables allow public SELECT.
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, ANON_KEY);
const dataDir = path.join(__dirname, "..", "src", "data");
fs.mkdirSync(dataDir, { recursive: true });

const { data: catalogs, error: catalogsError } = await supabase
  .from("raznova_catalogs")
  .select("id, vehicle_type, brand, model, title, pdf_url, sort_order")
  .order("sort_order");
if (catalogsError) throw catalogsError;

const { data: showcase, error: showcaseError } = await supabase
  .from("raznova_showcase")
  .select("id, brand, model, part_no, category, image_url, description_en, description_es, sort_order")
  .order("sort_order");
if (showcaseError) throw showcaseError;

fs.writeFileSync(path.join(dataDir, "catalogs.json"), JSON.stringify(catalogs, null, 2));
fs.writeFileSync(path.join(dataDir, "showcase.json"), JSON.stringify(showcase, null, 2));

console.log(`Wrote ${catalogs.length} catalog rows and ${showcase.length} showcase rows to src/data/.`);
