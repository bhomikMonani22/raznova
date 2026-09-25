// No-loss gate for the catalogue. Walks every entry in src/data/catalogs.json
// and confirms its PDF actually resolves:
//   - http(s) URL  -> must return 200 (Blob / external host)
//   - relative /x  -> file must exist under public/
// Exits non-zero if ANY entry fails. Run before committing catalogue changes:
//   node scripts/check-catalogs.mjs
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalogs = JSON.parse(readFileSync(join(root, "src/data/catalogs.json"), "utf8"));

async function checkUrl(url) {
  try {
    let r = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (r.status === 405 || r.status === 403) {
      r = await fetch(url, { method: "GET", headers: { Range: "bytes=0-0" }, redirect: "follow" });
    }
    const ct = r.headers.get("content-type") || "";
    return { ok: r.ok, code: r.status, note: ct };
  } catch (e) {
    return { ok: false, code: 0, note: e.message };
  }
}

const results = [];
for (const e of catalogs) {
  const u = e.pdf_url;
  if (/^https?:\/\//.test(u)) {
    const r = await checkUrl(u);
    results.push({ id: e.id, brand: e.brand, ok: r.ok, detail: `${r.code} ${r.note}`, u });
  } else {
    const p = join(root, "public", u.replace(/^\//, ""));
    const ok = existsSync(p);
    results.push({ id: e.id, brand: e.brand, ok, detail: ok ? "file present" : "MISSING FILE", u });
  }
}

const fail = results.filter((r) => !r.ok);
for (const r of results) {
  if (!r.ok) console.log(`  FAIL  id=${r.id} ${r.brand}  ${r.detail}\n        ${r.u}`);
}
const host = (u) => (/^https?:/.test(u) ? new URL(u).host : "public/");
const byHost = {};
for (const r of results) byHost[host(r.u)] = (byHost[host(r.u)] || 0) + 1;
console.log(`\ncatalogue entries: ${results.length}  |  passed: ${results.length - fail.length}  |  failed: ${fail.length}`);
console.log("hosts:", JSON.stringify(byHost));
if (fail.length) { console.error(`\nNO-LOSS CHECK FAILED: ${fail.length} entr${fail.length === 1 ? "y" : "ies"} unreachable.`); process.exit(1); }
console.log("NO-LOSS CHECK PASSED: every catalogue PDF resolves.");
