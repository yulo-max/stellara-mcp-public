// Builds data/gazetteer.tsv.gz from GeoNames dumps (CC BY 4.0, https://www.geonames.org/).
// Usage: node scripts/build-gazetteer.mjs <dir with cities1000.txt, admin1CodesASCII.txt, countryInfo.txt>
// Output columns: name, alt names (|), country code, admin1 name, lat, lon, IANA tz, population.
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
const dir = process.argv[2] ?? "./geonames";
const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
const admin1 = new Map();
for (const l of readFileSync(join(dir, "admin1CodesASCII.txt"), "utf8").split("\n")) { const c = l.split("\t"); if (c[0]) admin1.set(c[0], c[1]); }
const latin = /^[\p{Script=Latin}0-9 '’.\-()]+$/u;
const rows = [];
for (const l of readFileSync(join(dir, "cities1000.txt"), "utf8").split("\n")) {
  const c = l.split("\t"); if (c.length < 19) continue;
  const [, name, ascii, alts, lat, lon, , , cc, , a1, , , , pop, , , tz] = c;
  // Exonyms matter for larger places; small villages keep only a couple of variants (memory).
  const max = +pop >= 15000 ? 30 : 2;
  const seen = new Set([norm(name)]); const keep = [];
  for (const n of [ascii, ...alts.split(",")]) {
    if (!n || n.length > 40 || !latin.test(n) || /^[A-Z0-9]{2,4}$/.test(n) || /https?|www\./.test(n)) continue;
    const k = norm(n); if (!k || seen.has(k)) continue; seen.add(k); keep.push(n.replace(/[\t|]/g, " ")); if (keep.length >= max) break;
  }
  rows.push([name, keep.join("|"), cc, admin1.get(`${cc}.${a1}`) ?? "", (+lat).toFixed(4), (+lon).toFixed(4), tz, pop || "0"].join("\t"));
}
const out = gzipSync(rows.join("\n"), { level: 9 });
writeFileSync(new URL("../data/gazetteer.tsv.gz", import.meta.url), out);
// country names (English + Dutch for common ones) for ", country" hints
const countries = {};
for (const l of readFileSync(join(dir, "countryInfo.txt"), "utf8").split("\n")) { if (l.startsWith("#")) continue; const c = l.split("\t"); if (c[0]) countries[c[0]] = c[4]; }
writeFileSync(new URL("../data/countries.json", import.meta.url), JSON.stringify(countries));
console.log(rows.length, "places,", (out.length / 1e6).toFixed(1), "MB gz");
