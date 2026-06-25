// Uploads every PDF in D:\catalog to the raznova-catalogs Supabase Storage
// bucket, then upserts a matching row into raznova_catalogs.
// Idempotent: safe to re-run (re-uploads overwrite, upserts match on pdf_url).
//
// Usage: node scripts/upload_pdfs.mjs
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CATALOG_DIR = "D:\\catalog";
const BUCKET = "raznova-catalogs";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, "pdf_manifest.json"), "utf8")
);

let totalBytes = 0;

for (const [i, entry] of manifest.entries()) {
  const localPath = path.join(CATALOG_DIR, entry.sourcePath);
  if (!fs.existsSync(localPath)) {
    console.warn(`SKIP (not found): ${localPath}`);
    continue;
  }

  const stat = fs.statSync(localPath);
  totalBytes += stat.size;

  const storagePath = `${entry.vehicleType}/${entry.brand}/${entry.sourcePath}`;
  const fileBuffer = fs.readFileSync(localPath);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    console.error(`UPLOAD FAILED: ${storagePath}`, uploadError.message);
    continue;
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);
  const pdf_url = publicUrlData.publicUrl;

  const { error: upsertError } = await supabase
    .from("raznova_catalogs")
    .upsert(
      {
        vehicle_type: entry.vehicleType,
        brand: entry.brand,
        model: entry.model,
        title: entry.title,
        pdf_url,
        sort_order: i,
      },
      { onConflict: "pdf_url" }
    );

  if (upsertError) {
    console.error(`DB UPSERT FAILED: ${entry.title}`, upsertError.message);
    continue;
  }

  console.log(`OK  (${(stat.size / 1024 / 1024).toFixed(1)} MB)  ${entry.title}`);
}

console.log(`\nTotal source size: ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
