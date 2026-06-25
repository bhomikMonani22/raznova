// One-off cleanup: removes orphaned objects left under the old
// <vehicleType>/<brand>/file storage path scheme (motorcycle/, three_wheeler/)
// after upload_pdfs.mjs switched to <catalogType>/<brand>/file (vehicle/, brand/).
// Safe to delete since no raznova_catalogs.pdf_url row points at these paths.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = "raznova-catalogs";
const OLD_PREFIXES = ["motorcycle", "three_wheeler"];

for (const prefix of OLD_PREFIXES) {
  const { data: brandDirs, error } = await supabase.storage.from(BUCKET).list(prefix);
  if (error) {
    console.error(`LIST FAILED: ${prefix}`, error.message);
    continue;
  }
  for (const dir of brandDirs ?? []) {
    const { data: files, error: listErr } = await supabase.storage
      .from(BUCKET)
      .list(`${prefix}/${dir.name}`);
    if (listErr) {
      console.error(`LIST FAILED: ${prefix}/${dir.name}`, listErr.message);
      continue;
    }
    const paths = (files ?? []).map((f) => `${prefix}/${dir.name}/${f.name}`);
    if (paths.length === 0) continue;
    const { error: removeErr } = await supabase.storage.from(BUCKET).remove(paths);
    if (removeErr) {
      console.error(`REMOVE FAILED: ${prefix}/${dir.name}`, removeErr.message);
    } else {
      console.log(`Removed ${paths.length} object(s) under ${prefix}/${dir.name}`);
    }
  }
}
