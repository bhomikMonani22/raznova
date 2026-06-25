// Replaces showcase placeholders with real part data from a CSV/Excel export.
// Expected columns: brand, model, part_no, category, image_filename, description_en, description_es
// Images (if image_filename is set and exists locally next to the CSV) are uploaded
// to the raznova-catalogs bucket under parts/<filename>.
//
// Usage: node scripts/import_showcase.mjs path/to/parts.csv
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "raznova-catalogs";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/import_showcase.mjs path/to/parts.csv");
  process.exit(1);
}
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const csvDir = path.dirname(path.resolve(csvPath));
const records = parse(fs.readFileSync(csvPath, "utf8"), {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

let sortOrder = 0;
for (const row of records) {
  sortOrder += 1;
  let image_url = null;

  if (row.image_filename) {
    const localImagePath = path.join(csvDir, row.image_filename);
    if (fs.existsSync(localImagePath)) {
      const storagePath = `parts/${row.image_filename}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fs.readFileSync(localImagePath), { upsert: true });
      if (uploadError) {
        console.error(`IMAGE UPLOAD FAILED: ${row.image_filename}`, uploadError.message);
      } else {
        image_url = supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
      }
    } else {
      console.warn(`Image not found, skipping: ${localImagePath}`);
    }
  }

  const { error } = await supabase.from("raznova_showcase").upsert(
    {
      brand: row.brand,
      model: row.model,
      part_no: row.part_no,
      category: row.category,
      image_url: image_url ?? "/placeholder-part.svg",
      description_en: row.description_en,
      description_es: row.description_es,
      sort_order: sortOrder,
    },
    { onConflict: "brand,model,part_no" }
  );

  if (error) {
    console.error(`UPSERT FAILED: ${row.part_no}`, error.message);
  } else {
    console.log(`OK  ${row.brand} ${row.model} — ${row.part_no}`);
  }
}

console.log(`\nDone. ${records.length} rows processed.`);
console.log("Run `node scripts/sync_content.mjs` then commit + push to publish.");
