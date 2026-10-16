// Computed render data for the chart wheel (stored server-side under a random id, see chartStore.ts). It holds ONLY computed chart data:
// planet/point longitudes and house cusps (rounded to 0.1°), retrograde flags, house system and a
// few booleans. It never contains a birth date, time, place, coordinates, time zone or name, and the
// rendered wheel from a token shows no birth details either. Stateless: nothing is stored or logged.
import { PLANETS, POINTS, signOf, round, norm360, planetAspects, gridAspectsFor, type Chart, type Position, type PointPos } from "./chart.js";
import { chartWheelSvg } from "./wheel.js";
import { GAZETTEER_ATTRIBUTION } from "./cities.js";

type Lang = "en" | "nl";
export interface WheelToken {
  v: 1;
  p: number[]; pr: number;   // planet longitudes ×10 (Sun..Pluto), retrograde bitmask
  q: number[]; qr: number;   // point longitudes ×10 (nodes, Lilith, Chiron), retrograde bitmask
  a: number; m: number;      // ascendant / midheaven ×10, -1 = unknown
  h: number[]; s: 0 | 1 | 2; // house cusps ×10; 0 none, 1 Placidus, 2 Whole Sign
  t: 0 | 1; u: 0 | 1; g: 0 | 1; // time known, moon sign uncertain, gazetteer attribution needed
}

const d10 = (x: number) => Math.round(norm360(x) * 10) % 3600;
const bits = (xs: boolean[]) => xs.reduce((acc, b, i) => acc | (b ? 1 << i : 0), 0);

export function chartToData(c: Chart, timeKnown: boolean, gazetteer: boolean): WheelToken {
  return {
    v: 1,
    p: c.positions.map((x) => d10(x.lon)), pr: bits(c.positions.map((x) => x.retrograde)),
    q: c.points.map((x) => d10(x.lon)), qr: bits(c.points.map((x) => x.retrograde)),
    a: c.asc !== undefined ? d10(c.asc) : -1, m: c.mc !== undefined ? d10(c.mc) : -1,
    h: c.houses ? c.houses.map((x) => d10(x.cusp)) : [], s: c.houseSystem === "placidus" ? 1 : c.houseSystem === "whole_sign" ? 2 : 0,
    t: timeKnown ? 1 : 0, u: c.moonUncertain ? 1 : 0, g: gazetteer ? 1 : 0,
  };
}

export function tokenToChart(t: WheelToken): Chart {
  const lon = (x: number) => x / 10;
  const positions: Position[] = PLANETS.map((planet, i) => ({ planet, lon: lon(t.p[i]), sign: signOf(lon(t.p[i])).key, degree: round(lon(t.p[i]) % 30, 2), retrograde: !!(t.pr & (1 << i)) }));
  const points: PointPos[] = POINTS.map((point, i) => ({ point, lon: lon(t.q[i]), sign: signOf(lon(t.q[i])).key, degree: round(lon(t.q[i]) % 30, 2), retrograde: !!(t.qr & (1 << i)) }));
  const asc = t.a >= 0 ? lon(t.a) : undefined, mc = t.m >= 0 ? lon(t.m) : undefined;
  const c: Chart = { positions, points, moonUncertain: !!t.u, aspects: planetAspects(positions, !!t.t), gridAspects: gridAspectsFor(positions, points, asc, mc, !!t.t) };
  if (asc !== undefined) { c.asc = asc; c.mc = mc; }
  if (t.s) { c.houseSystem = t.s === 1 ? "placidus" : "whole_sign"; c.houses = t.h.map((x, i) => ({ house: i + 1, sign: signOf(lon(x)).key, cusp: lon(x) })); }
  return c;
}

/** Wheel image from a token: same wheel, but no birth date, time or place anywhere in the picture. */
export function wheelSvgFromToken(t: WheelToken, l: Lang): string {
  const nl = l === "nl";
  return chartWheelSvg(tokenToChart(t), {
    lang: l,
    title: nl ? "Geboortehoroscoop" : "Birth Chart",
    lines: [],
    footer: [
      nl ? "Dierenriem: tropisch" : "Zodiac: Tropical",
      t.s ? `${nl ? "Huizen" : "Houses"}: ${t.s === 1 ? "Placidus" : "Whole Sign"}` : (nl ? "Huizen: alleen met tijd en plaats" : "Houses: need time and place"),
      ...(t.g ? [GAZETTEER_ATTRIBUTION] : []),
    ],
  });
}
