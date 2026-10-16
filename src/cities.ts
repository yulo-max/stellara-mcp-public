// Offline gazetteer built from GeoNames cities1000 (CC BY 4.0, https://www.geonames.org/).
// Loaded once from data/gazetteer.tsv.gz; no external geocoder is ever called.
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface City { name: string; country: string; region: string; lat: number; lon: number; tz: string; population: number; }
export const GAZETTEER_ATTRIBUTION = "Place data: GeoNames (geonames.org), CC BY 4.0.";

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "data");
export const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();

// Dutch (and a few other) country names on top of GeoNames' English names.
const COUNTRY_EXTRA: Record<string, string> = {
  nederland: "NL", holland: "NL", belgie: "BE", duitsland: "DE", frankrijk: "FR", spanje: "ES", italie: "IT", engeland: "GB",
  "verenigd koninkrijk": "GB", uk: "GB", schotland: "GB", oostenrijk: "AT", zwitserland: "CH", denemarken: "DK", zweden: "SE",
  noorwegen: "NO", polen: "PL", griekenland: "GR", turkije: "TR", marokko: "MA", suriname: "SR", indonesie: "ID",
  "verenigde staten": "US", usa: "US", amerika: "US", america: "US", "united states of america": "US", canada: "CA", brazilie: "BR", australie: "AU",
  rusland: "RU", oekraine: "UA", hongarije: "HU", tsjechie: "CZ", ierland: "IE", portugal: "PT", luxemburg: "LU", curacao: "CW", aruba: "AW",
};

let names: string[] = [], countries: string[] = [], regions: string[] = [];
let lat: Float32Array, lon: Float32Array, pop: Uint32Array, tzs: string[] = [];
let index: Map<string, number | number[]>;
let countryByName: Map<string, string>;
let countryName: Record<string, string>;

function load() {
  if (index) return;
  countryName = JSON.parse(readFileSync(path.join(dataDir, "countries.json"), "utf8"));
  countryByName = new Map(Object.entries(COUNTRY_EXTRA));
  for (const [cc, n] of Object.entries(countryName)) { countryByName.set(norm(n), cc); countryByName.set(cc.toLowerCase(), cc); }
  const lines = gunzipSync(readFileSync(path.join(dataDir, "gazetteer.tsv.gz"))).toString("utf8").split("\n");
  const n = lines.length;
  lat = new Float32Array(n); lon = new Float32Array(n); pop = new Uint32Array(n);
  const tzPool = new Map<string, string>(), regPool = new Map<string, string>();
  const intern = (m: Map<string, string>, s: string) => { let v = m.get(s); if (v === undefined) { m.set(s, s); v = s; } return v; };
  index = new Map();
  const add = (k: string, i: number) => { if (!k) return; const a = index.get(k); if (a === undefined) index.set(k, i); else if (typeof a === "number") { if (a !== i) index.set(k, [a, i]); } else if (a[a.length - 1] !== i) a.push(i); };
  for (let i = 0; i < n; i++) {
    const c = lines[i].split("\t");
    names[i] = c[0]; countries[i] = c[2]; regions[i] = intern(regPool, c[3]);
    lat[i] = +c[4]; lon[i] = +c[5]; tzs[i] = intern(tzPool, c[6]); pop[i] = +c[7];
    add(norm(c[0]), i);
    if (c[1]) for (const a of c[1].split("|")) add(norm(a), i);
  }
}

const city = (i: number): City => ({ name: names[i], country: countries[i], region: regions[i], lat: lat[i], lon: lon[i], tz: tzs[i], population: pop[i] });
export const describe = (c: City) => [c.name, c.region, countryName?.[c.country] ?? c.country].filter(Boolean).join(", ");

export type Lookup = { city: City } | { ambiguous: City[] } | { notFound: true };

/** "Place", "Place, Country", "Place, Region, Country". Accent/case-insensitive; prefers official name, then population. */
export function lookupPlace(input: string): Lookup {
  load();
  const parts = input.split(",").map((s) => norm(s)).filter(Boolean);
  if (!parts.length) return { notFound: true };
  const hit = index.get(parts[0]);
  let ids = hit === undefined ? [] : typeof hit === "number" ? [hit] : hit;
  for (const h of parts.slice(1)) {
    const cc = countryByName.get(h);
    const f = ids.filter((i) => (cc && countries[i] === cc) || norm(regions[i]).includes(h) || (h.length >= 4 && norm(countryName[countries[i]] ?? "").includes(h)));
    ids = f;
  }
  if (!ids.length) return { notFound: true };
  // Score: population, with matches on the official name weighted 5x over alternate names
  // (so "Cologne" finds Köln, but "Den Haag" still works via its alternate name).
  const score = (i: number) => (pop[i] + 1) * (norm(names[i]) === parts[0] ? 5 : 1);
  ids = [...ids].sort((a, b) => score(b) - score(a));
  // Ambiguous when another candidate scores at least 25% of the best one.
  const top = ids[0];
  const rivals = ids.slice(1).filter((i) => score(i) >= score(top) * 0.25);
  if (rivals.length) return { ambiguous: ids.slice(0, 5).map(city) };
  return { city: city(top) };
}
/** Back-compat helper: best match or undefined. */
export function findCity(input: string): City | undefined { const r = lookupPlace(input); return "city" in r ? r.city : undefined; }
export function placeCount() { load(); return names.length; }
