#!/usr/bin/env node
/*
  raznova_prepare_images.mjs
  --------------------------------------------------------------------------
  Matches real photo files against the showcase CSV (tolerant: ignores
  extension differences, case, spaces/_/-, and up to 2-char typos),
  copies matched images into public/parts/ (frontend-hosted, NOT Supabase
  storage), and writes src/data/showcase.json directly — bypassing the
  Supabase import/sync flow entirely.

  Run from repo root:
      node scripts/raznova_prepare_images.mjs
  --------------------------------------------------------------------------
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PHOTOS_DIR    = 'D:\\raznova\\photos';
const CSV_IN        = path.join(ROOT, 'raznova_showcase_import.csv');
const PUBLIC_PARTS  = path.join(ROOT, 'public', 'parts');
const SHOWCASE_JSON = path.join(ROOT, 'src', 'data', 'showcase.json');
const REPORT_OUT    = path.join(ROOT, 'image_match_report.txt');
const FUZZY_MAX     = 2;   // max Levenshtein distance for typo fallback

const IMG_RE = /\.(png|jpe?g|webp)$/i;

// Normalise a filename for comparison: lowercase, strip extension, strip non-alphanum
const norm = s => String(s).toLowerCase()
  .replace(IMG_RE, '')
  .replace(/(png|jpe?g|webp)$/, '')
  .replace(/[^a-z0-9]/g, '');

function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1,
                         d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return d[m][n];
}

// Minimal RFC4180 CSV parser (handles quoted fields, commas, CRLF)
function parseCSV(text) {
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i+1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length && r.some(x => x !== ''));
}

// ---- load photo files ----
if (!fs.existsSync(PHOTOS_DIR)) {
  console.error('Photos folder not found:', PHOTOS_DIR);
  process.exit(1);
}
const files = fs.readdirSync(PHOTOS_DIR).filter(f => IMG_RE.test(f));
const normToFile = new Map();
for (const f of files) {
  const k = norm(f);
  if (!normToFile.has(k)) normToFile.set(k, f);
}
const normKeys = [...normToFile.keys()];

// ---- parse CSV ----
// Header bug: column 2 is a duplicate 'description_en' where part_no should be.
// We use lastIdx() to grab the LAST description_en (the real one in col 5).
const raw = parseCSV(fs.readFileSync(CSV_IN, 'utf8'));
const hdr = raw[0].map(h => h.trim().toLowerCase());
const lastIdx = name => {
  let idx = -1;
  hdr.forEach((h, i) => { if (h === name) idx = i; });
  return idx;
};
const col = {
  brand:    hdr.indexOf('brand'),
  model:    hdr.indexOf('model'),
  part_no:  hdr.indexOf('part_no'),        // -1 (missing from buggy header)
  category: hdr.indexOf('category'),
  image:    hdr.indexOf('image_filename'),
  desc_en:  lastIdx('description_en'),     // last occurrence = real description
  desc_es:  hdr.indexOf('description_es'),
};

// ---- match photos and build showcase rows ----
fs.mkdirSync(PUBLIC_PARTS, { recursive: true });

const showcaseRows = [];
const matched = [], dropped = [], usedFiles = new Set();
let id = 0;

for (const r of raw.slice(1)) {
  const brand    = (r[col.brand]    || '').trim();
  const model    = (r[col.model]    || '').trim();
  const category = (r[col.category] || '').trim();
  const wanted   = (r[col.image]    || '').trim();
  const k        = norm(wanted);
  const label    = `${brand} ${model} — ${category}`;

  // Exact normalised match first, then fuzzy fallback
  let real = k ? normToFile.get(k) : null;
  if (!real && k) {
    let best = null, bd = FUZZY_MAX + 1;
    for (const nk of normKeys) {
      const d = lev(k, nk);
      if (d < bd) { bd = d; best = nk; }
    }
    if (best && bd <= FUZZY_MAX) real = normToFile.get(best);
  }

  if (!real) {
    dropped.push(`DROPPED  ${label}   [${wanted || '(blank)'}] — no matching photo`);
    continue;
  }

  usedFiles.add(real);
  id += 1;
  showcaseRows.push({
    id,
    brand,
    model,
    part_no:        col.part_no >= 0 ? (r[col.part_no] || '') : '',
    category,
    image_url:      `/parts/${real}`,
    description_en: (r[col.desc_en] || category).trim(),
    description_es: (r[col.desc_es] || '').trim(),
    sort_order:     id,
  });
  matched.push(`OK       ${label}   [${wanted} -> ${real}]`);
}

// ---- copy matched images (deduped) into public/parts/ ----
for (const f of usedFiles) {
  fs.copyFileSync(path.join(PHOTOS_DIR, f), path.join(PUBLIC_PARTS, f));
}

// ---- write showcase.json ----
fs.writeFileSync(SHOWCASE_JSON, JSON.stringify(showcaseRows, null, 2) + '\n', 'utf8');

// ---- write match report ----
const unused = files.filter(f => !usedFiles.has(f));
fs.writeFileSync(REPORT_OUT, [
  'RAZNOVA image match report — ' + new Date().toISOString(),
  `Photos folder : ${PHOTOS_DIR}  (${files.length} image files)`,
  `CSV rows read : ${raw.length - 1}`,
  `Matched       : ${matched.length}   (photo found — card will render)`,
  `Dropped       : ${dropped.length}   (no photo match — card hidden)`,
  `Images copied : ${usedFiles.size} files -> public/parts/`,
  `JSON rows     : ${showcaseRows.length} -> src/data/showcase.json`,
  '',
  '--- DROPPED ROWS (fix the filename or add the photo, then re-run) ---',
  ...dropped,
  '',
  '--- PHOTOS NEVER REFERENCED BY ANY CSV ROW ---',
  ...unused.map(f => `UNUSED   ${f}`),
  '',
  '--- MATCHED (csv filename -> actual file used) ---',
  ...matched,
].join('\n'), 'utf8');

console.log(`Matched ${matched.length}, dropped ${dropped.length}. Copied ${usedFiles.size} images.`);
console.log(`Wrote ${showcaseRows.length} rows to src/data/showcase.json`);
console.log(`Full report: image_match_report.txt`);
