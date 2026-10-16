// Real planetary positions via astronomy-engine (MIT). Tropical zodiac, apparent
// geocentric ecliptic longitude of date. Nothing is stored; everything is computed per call.
import * as A from "astronomy-engine";
import { DateTime } from "luxon";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "data");
import { lookupPlace, describe } from "./cities.js";
import { SIGNS } from "./astro.js";

export const PLANETS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"] as const;
export type Planet = (typeof PLANETS)[number];
const BODY: Record<Planet, A.Body> = {
  sun: A.Body.Sun, moon: A.Body.Moon, mercury: A.Body.Mercury, venus: A.Body.Venus, mars: A.Body.Mars,
  jupiter: A.Body.Jupiter, saturn: A.Body.Saturn, uranus: A.Body.Uranus, neptune: A.Body.Neptune, pluto: A.Body.Pluto,
};
// Zodiac order starting at Aries (SIGNS in astro.ts already is in that order).
export const ZODIAC = SIGNS;

export const norm360 = (x: number) => ((x % 360) + 360) % 360;
const rad = Math.PI / 180;

export function longitude(p: Planet, date: Date): number {
  const t = A.MakeTime(date);
  if (p === "moon") return norm360(A.EclipticGeoMoon(t).lon);
  // aberration-corrected geocentric vector (J2000 equator) -> true ecliptic of date
  return norm360(A.Ecliptic(A.GeoVector(BODY[p], t, true)).elon);
}

export function speed(p: Planet, date: Date): number {
  const h = 6 * 3600_000;
  let d = longitude(p, new Date(date.getTime() + h)) - longitude(p, new Date(date.getTime() - h));
  if (d > 180) d -= 360; if (d < -180) d += 360;
  return d * 2; // degrees per day
}

export interface Position { planet: Planet; lon: number; sign: string; degree: number; retrograde: boolean; }
export function signOf(lon: number) { return ZODIAC[Math.floor(norm360(lon) / 30)]; }
export function position(p: Planet, date: Date): Position {
  const lon = longitude(p, date);
  return { planet: p, lon: round(lon, 3), sign: signOf(lon).key, degree: round(lon % 30, 2), retrograde: p !== "sun" && p !== "moon" && speed(p, date) < 0 };
}
export const round = (x: number, n = 2) => Math.round(x * 10 ** n) / 10 ** n;

/** Ascendant and Midheaven (degrees) for a moment and place. */
export function angles(date: Date, lat: number, lon: number) {
  const t = A.MakeTime(date);
  const ramc = norm360(A.SiderealTime(t) * 15 + lon) * rad;
  const eps = A.e_tilt(t).tobl * rad;
  const phi = lat * rad;
  const asc = norm360(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) / rad);
  const mc = norm360(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / rad);
  return { asc, mc };
}

// ---------- input resolution ----------
export interface BirthInput {
  birth_date: string; birth_time?: string; birth_place?: string;
  latitude?: number; longitude?: number; timezone?: string;
}
export interface Resolved {
  utc: Date; timeKnown: boolean; placeKnown: boolean; tzKnown?: boolean;
  place?: { name: string; lat: number; lon: number; tz: string; fromGazetteer?: boolean };
  utcOffset?: string; notes: string[];
}

export class InputError extends Error {}

export function resolveBirth(b: BirthInput, label = "", now = new Date()): Resolved {
  const p = label ? `${label}: ` : "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(b.birth_date?.trim() ?? "");
  if (!m) throw new InputError(`${p}birth_date must be YYYY-MM-DD, for example 1988-03-14.`);
  let time = b.birth_time?.trim();
  if (time && !/^([01]?\d|2[0-3]):[0-5]\d$/.test(time)) throw new InputError(`${p}birth_time must be HH:MM in 24-hour local time, for example 07:45.`);
  const notes: string[] = [];
  let place: Resolved["place"];
  if (b.latitude !== undefined || b.longitude !== undefined) {
    if (b.latitude === undefined || b.longitude === undefined) throw new InputError(`${p}give both latitude and longitude.`);
    if (Math.abs(b.latitude) > 90 || Math.abs(b.longitude) > 180) throw new InputError(`${p}latitude must be -90..90 and longitude -180..180.`);
    if (!b.timezone) throw new InputError(`${p}with latitude/longitude also give an IANA timezone, for example Europe/Amsterdam.`);
    place = { name: b.birth_place?.trim() || `${round(b.latitude, 3)}, ${round(b.longitude, 3)}`, lat: b.latitude, lon: b.longitude, tz: b.timezone };
  } else if (b.birth_place?.trim()) {
    const q = b.birth_place.slice(0, 80);
    const r = lookupPlace(q);
    if ("notFound" in r) throw new InputError(`${p}unknown place "${q}". Check the spelling, add the country (for example "Ootmarsum, Netherlands"), or give latitude, longitude and timezone (for example 52.37, 4.90, Europe/Amsterdam).`);
    if ("ambiguous" in r) throw new InputError(`${p}"${q}" matches several places. Ask which one is meant and pass it as "place, region, country". Top candidates: ${r.ambiguous.map((c) => describe(c)).join("; ")}.`);
    const c = r.city;
    place = { name: describe(c), lat: c.lat, lon: c.lon, tz: b.timezone ?? c.tz, fromGazetteer: true };
  }
  const zone = place?.tz ?? b.timezone ?? "UTC";
  if (!DateTime.local().setZone(zone).isValid) throw new InputError(`${p}unknown timezone "${zone}". Use an IANA name like Europe/Amsterdam.`);
  if (time && !place && !b.timezone) notes.push("Birth time given without place or timezone; it was read as UTC.");
  const timeKnown = !!time;
  if (!time) time = "12:00";
  const dt = DateTime.fromISO(`${b.birth_date.trim()}T${time.padStart(5, "0")}`, { zone });
  if (!dt.isValid) throw new InputError(`${p}this date does not exist.`);
  if (dt.year < 1800) throw new InputError(`${p}pick a birth date from 1800 onwards.`);
  if (dt.toMillis() > now.getTime() + 86400_000) throw new InputError(`${p}the birth date is in the future.`);
  // A local time that falls in a DST gap is shifted forward by luxon; mention it.
  if (timeKnown && dt.toFormat("HH:mm") !== time.padStart(5, "0")) notes.push(`Local time ${time} does not exist in ${zone} on that date (clock change); used ${dt.toFormat("HH:mm")}.`);
  return { utc: dt.toUTC().toJSDate(), timeKnown, placeKnown: !!place, tzKnown: !!place || !!b.timezone, place, utcOffset: dt.toFormat("ZZ"), notes };
}

// ---------- aspects ----------
export const ASPECTS = [
  { key: "conjunction", angle: 0, orb: 8 },
  { key: "opposition", angle: 180, orb: 8 },
  { key: "trine", angle: 120, orb: 7 },
  { key: "square", angle: 90, orb: 7 },
  { key: "sextile", angle: 60, orb: 5 },
] as const;
export type AspectKey = (typeof ASPECTS)[number]["key"];
export const sep = (a: number, b: number) => { const d = Math.abs(norm360(a - b)); return d > 180 ? 360 - d : d; };
export function aspectBetween(a: number, b: number, orbScale = 1) {
  const s = sep(a, b);
  let best: { key: AspectKey; angle: number; orb: number } | undefined;
  for (const x of ASPECTS) {
    const o = Math.abs(s - x.angle);
    if (o <= x.orb * orbScale && (!best || o < best.orb)) best = { key: x.key, angle: x.angle, orb: o };
  }
  return best;
}

export interface Chart {
  positions: Position[]; asc?: number; mc?: number; houses?: { house: number; sign: string; cusp: number }[]; houseSystem?: "placidus" | "whole_sign";
  planetHouse?: Partial<Record<Planet, number>>; moonUncertain: boolean; moonOptions?: string[];
  aspects: { a: Planet; b: Planet; type: AspectKey; orb: number }[];
  points: PointPos[];
  /** Aspects between all bodies incl. points and angles (for the aspect grid). */
  gridAspects: { a: string; b: string; type: AspectKey; orb: number }[];
}

/** Planet-to-planet aspects, closest first. Without a birth time the Moon is skipped (it moves ~13°/day). */
export function planetAspects(positions: Position[], timeKnown: boolean): Chart["aspects"] {
  const aspects: Chart["aspects"] = [];
  for (let i = 0; i < positions.length; i++) for (let j = i + 1; j < positions.length; j++) {
    const [pa, pb] = [positions[i], positions[j]];
    if (!timeKnown && (pa.planet === "moon" || pb.planet === "moon")) continue;
    const asp = aspectBetween(pa.lon, pb.lon);
    if (asp) aspects.push({ a: pa.planet, b: pb.planet, type: asp.key, orb: round(asp.orb, 2) });
  }
  return aspects.sort((x, y) => x.orb - y.orb);
}

/** Aspects between all bodies incl. points and angles (for the aspect grid). */
export function gridAspectsFor(positions: Position[], points: PointPos[], asc: number | undefined, mc: number | undefined, timeKnown: boolean): Chart["gridAspects"] {
  const out: Chart["gridAspects"] = [];
  const bodies: { k: string; lon: number }[] = [
    ...positions.filter((p) => timeKnown || p.planet !== "moon").map((p) => ({ k: p.planet as string, lon: p.lon })),
    ...points.map((p) => ({ k: p.point as string, lon: p.lon })),
    ...(asc !== undefined && mc !== undefined ? [{ k: "asc", lon: asc }, { k: "mc", lon: mc }] : []),
  ];
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
    const pair = [bodies[i].k, bodies[j].k].sort().join();
    if (pair === "north_node,south_node" || pair === "asc,mc") continue;
    const small = /node|lilith|chiron|asc|mc/.test(bodies[i].k) || /node|lilith|chiron|asc|mc/.test(bodies[j].k);
    const asp = aspectBetween(bodies[i].lon, bodies[j].lon, small ? 0.6 : 1);
    if (asp) out.push({ a: bodies[i].k, b: bodies[j].k, type: asp.key, orb: round(asp.orb, 2) });
  }
  return out;
}

export function computeChart(r: Resolved): Chart {
  const positions = PLANETS.map((p) => position(p, r.utc));
  let moonUncertain = false; let moonOptions: string[] | undefined;
  if (!r.timeKnown) {
    // Without a time we used local noon; check the Moon from 00:00 to 23:59 local. Without a known
    // time zone the local day can run from UTC+14 to UTC-12, so widen the window to cover all of them.
    const before = r.tzKnown === false ? 26 : 12, after = r.tzKnown === false ? 24 : 12;
    const start = new Date(r.utc.getTime() - before * 3600_000), end = new Date(r.utc.getTime() + after * 3600_000 - 60_000);
    const a = signOf(longitude("moon", start)).key, b = signOf(longitude("moon", end)).key;
    if (a !== b) { moonUncertain = true; moonOptions = [a, b]; }
  }
  const aspects = planetAspects(positions, r.timeKnown);
  const chart: Chart = { positions, moonUncertain, moonOptions, aspects, points: extraPoints(r.utc), gridAspects: [] };
  if (r.timeKnown && r.place) {
    const { asc, mc } = angles(r.utc, r.place.lat, r.place.lon);
    chart.asc = asc; chart.mc = mc;
    const pl = placidusCusps(r.utc, r.place.lat, r.place.lon);
    if (pl) {
      // Placidus (like astro.com); Whole Sign fallback above the polar circles.
      chart.houseSystem = "placidus";
      chart.houses = pl.map((c, i) => ({ house: i + 1, sign: signOf(c).key, cusp: round(c, 3) }));
      const houseOf = (lon: number) => { for (let i = 0; i < 12; i++) { const a = pl[i], b = pl[(i + 1) % 12]; if (norm360(lon - a) < norm360(b - a)) return i + 1; } return 1; };
      chart.planetHouse = Object.fromEntries(positions.map((p) => [p.planet, houseOf(p.lon)]));
    } else {
      chart.houseSystem = "whole_sign";
      const first = Math.floor(asc / 30);
      chart.houses = Array.from({ length: 12 }, (_, i) => ({ house: i + 1, sign: ZODIAC[(first + i) % 12].key, cusp: ((first + i) % 12) * 30 }));
      chart.planetHouse = Object.fromEntries(positions.map((p) => [p.planet, ((Math.floor(p.lon / 30) - first + 12) % 12) + 1]));
    }
  }
  chart.gridAspects = gridAspectsFor(positions, chart.points, chart.asc, chart.mc, r.timeKnown);
  return chart;
}

/** Finds the moment (UTC) when transiting planet t makes exact aspect `angle` to fixed longitude natalLon, near `around`. */
export function exactTime(t: Planet, natalLon: number, angle: number, around: Date, days = 30): Date | undefined {
  const f = (ms: number) => { const s = sep(longitude(t, new Date(ms)), natalLon); return Math.abs(s - angle); };
  const step = (t === "moon" ? 1 : 12) * 3600_000;
  let bestMs = around.getTime(), best = f(bestMs);
  for (let ms = around.getTime() - days * 86400_000; ms <= around.getTime() + days * 86400_000; ms += step) {
    const v = f(ms); if (v < best) { best = v; bestMs = ms; }
  }
  // golden-section refine within ±step
  let lo = bestMs - step, hi = bestMs + step;
  for (let i = 0; i < 40; i++) {
    const m1 = lo + (hi - lo) * 0.382, m2 = lo + (hi - lo) * 0.618;
    if (f(m1) < f(m2)) hi = m2; else lo = m1;
  }
  const ms = (lo + hi) / 2;
  return f(ms) < 0.02 ? new Date(ms) : undefined;
}

/** Placidus house cusps (degrees, index 0 = house 1). Undefined above the polar circles where Placidus fails. */
export function placidusCusps(date: Date, lat: number, lon: number): number[] | undefined {
  if (Math.abs(lat) >= 66) return undefined;
  const t = A.MakeTime(date);
  const ramc = norm360(A.SiderealTime(t) * 15 + lon);
  const eps = A.e_tilt(t).tobl * rad, phi = lat * rad;
  const { asc, mc } = angles(date, lat, lon);
  const lonFromRA = (ra: number) => norm360(Math.atan2(Math.sin(ra * rad), Math.cos(ra * rad) * Math.cos(eps)) / rad);
  const ad = (l: number) => { const d = Math.asin(Math.sin(eps) * Math.sin(l * rad)); const x = Math.tan(phi) * Math.tan(d); return Math.abs(x) >= 1 ? NaN : Math.asin(x) / rad; };
  const solve = (above: boolean, f: number) => {
    let ra = above ? ramc + 90 * f : ramc + 180 - 90 * f;
    for (let i = 0; i < 60; i++) {
      const a = ad(lonFromRA(ra)); if (Number.isNaN(a)) return NaN;
      const next = above ? ramc + f * (90 + a) : ramc + 180 - f * (90 - a);
      if (Math.abs(next - ra) < 1e-7) { ra = next; break; } ra = next;
    }
    return lonFromRA(ra);
  };
  const c11 = solve(true, 1 / 3), c12 = solve(true, 2 / 3), c2 = solve(false, 2 / 3), c3 = solve(false, 1 / 3);
  if ([c11, c12, c2, c3].some(Number.isNaN)) return undefined;
  const cusps = [asc, c2, c3, norm360(mc + 180), norm360(c11 + 180), norm360(c12 + 180), norm360(asc + 180), norm360(c2 + 180), norm360(c3 + 180), mc, c11, c12];
  return cusps;
}

// ---------- extra points: mean lunar nodes, mean Lilith (Black Moon), Chiron ----------
export const POINTS = ["north_node", "south_node", "lilith", "chiron"] as const;
export type PointKey = (typeof POINTS)[number];
const Tcent = (date: Date) => A.MakeTime(date).tt / 36525;
/** Mean ascending node of the Moon (Meeus, Astronomical Algorithms ch. 47). */
export function meanNode(date: Date) { const T = Tcent(date); return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T ** 3 / 467441 - T ** 4 / 60616000); }
/** Mean lunar apogee = mean Black Moon Lilith (Meeus: mean perigee + 180). */
export function meanLilith(date: Date) { const T = Tcent(date); return norm360(83.3532465 + 4069.0137287 * T - 0.01032 * T * T - T ** 3 / 80053 + T ** 4 / 18999000 + 180); }
let chironTable: { start: number; step: number; lon: number[] } | undefined;
/** Chiron from a JPL Horizons table (1900-2100, 2-day steps), linearly interpolated. Undefined outside the table. */
export function chironLon(date: Date): number | undefined {
  if (!chironTable) {
    const j = JSON.parse(gunzipSync(readFileSync(path.join(dataDir, "chiron.json.gz"))).toString("utf8"));
    chironTable = { start: Date.parse(j.start), step: j.step_days * 86400_000, lon: j.lon };
  }
  const x = (date.getTime() - chironTable.start) / chironTable.step, i = Math.floor(x);
  if (i < 0 || i + 1 >= chironTable.lon.length) return undefined;
  const a = chironTable.lon[i], b = chironTable.lon[i + 1];
  let d = b - a; if (d > 180) d -= 360; if (d < -180) d += 360;
  return norm360(a + d * (x - i));
}
export interface PointPos { point: PointKey; lon: number; sign: string; degree: number; retrograde: boolean }
export function extraPoints(date: Date): PointPos[] {
  const n = meanNode(date), l = meanLilith(date), c = chironLon(date);
  const ch2 = chironLon(new Date(date.getTime() + 86400_000));
  const mk = (point: PointKey, lon: number, retro: boolean): PointPos => ({ point, lon: round(lon, 3), sign: signOf(lon).key, degree: round(lon % 30, 2), retrograde: retro });
  const out = [mk("north_node", n, true), mk("south_node", norm360(n + 180), true), mk("lilith", l, false)];
  if (c !== undefined && ch2 !== undefined) out.push(mk("chiron", c, norm360(ch2 - c) > 180));
  return out;
}
