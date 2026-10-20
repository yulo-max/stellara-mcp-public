// Free birth chart image for email (portrait 1080 x 1350, Stellara brand: navy, cream, champagne,
// Cormorant headings). Wheel with signs, planets and, with a known birth time, houses and As/Mc.
// No aspect lines, no degree tables. Shows no birth date, time, place or name.
import type { Chart } from "./chart.js";
import { ZODIAC, norm360 } from "./chart.js";
import { SIGN_GLYPH, PLANET_GLYPH } from "./wheel.js";
import { escapeXml } from "./tools.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const NAVY = "#0a0f1a", NAVY2 = "#111827", CREAM = "#f4efe6", CHAMP = "#e7d2b1", TAUPE = "#a39a8d";
const VS = "\uFE0E";
const SERIF = "Cormorant Garamond", SANS = "Inter", GLYPH = "DejaVu Sans";
const MAIN = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

export interface BigThree { sun: string; moon: string; moonAlt?: string; rising?: string }

const signName = (key: string) => ZODIAC.find((z) => z.key === key)?.en ?? key;
const signIdxOf = (lon: number) => Math.floor(norm360(lon) / 30);

export function bigThree(c: Chart): BigThree {
  const sun = c.positions.find((p) => p.planet === "sun")!.sign;
  const moon = c.positions.find((p) => p.planet === "moon")!.sign;
  const out: BigThree = { sun, moon };
  if (c.moonUncertain && c.moonOptions && c.moonOptions.length === 2) { out.moon = c.moonOptions[0]; out.moonAlt = c.moonOptions[1]; }
  if (c.asc !== undefined) out.rising = ZODIAC[signIdxOf(c.asc)].key;
  return out;
}

export function portraitSvg(c: Chart): string {
  const W = 1080, H = 1350, cx = 540, cy = 600;
  const R0 = 440, R1 = 372, R3 = 210; // outer, inner edge of sign ring, inner circle
  const left = c.asc ?? 0;
  const pt = (lon: number, r: number) => { const a = ((180 + (lon - left)) * Math.PI) / 180; return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const; };
  const f = (n: number) => n.toFixed(1);
  const txt = (x: number, y: number, s: string, o: { size?: number; fill?: string; anchor?: string; family?: string; weight?: string; spacing?: number } = {}) =>
    `<text x="${f(x)}" y="${f(y)}" font-family="${o.family ?? SANS}" font-size="${o.size ?? 20}" fill="${o.fill ?? CREAM}" text-anchor="${o.anchor ?? "middle"}"${o.weight ? ` font-weight="${o.weight}"` : ""}${o.spacing ? ` letter-spacing="${o.spacing}"` : ""} dominant-baseline="central">${s}</text>`;
  const line = (a: readonly [number, number], b: readonly [number, number], stroke: string, w: number, op = 1) =>
    `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${stroke}" stroke-width="${w}" stroke-opacity="${op}"/>`;
  const o: string[] = [`<rect width="${W}" height="${H}" fill="${NAVY}"/>`];
  o.push(txt(cx, 62, "STELLARA", { size: 22, fill: CHAMP, spacing: 9 }));
  o.push(txt(cx, 112, "Your birth chart", { size: 54, family: SERIF, weight: "500" }));

  // wheel
  o.push(`<circle cx="${cx}" cy="${cy}" r="${R0}" fill="${NAVY2}" stroke="${CHAMP}" stroke-width="2"/>`);
  o.push(`<circle cx="${cx}" cy="${cy}" r="${R1}" fill="${NAVY}" stroke="${CHAMP}" stroke-width="1.5"/>`);
  for (let i = 0; i < 12; i++) {
    o.push(line(pt(i * 30, R0), pt(i * 30, R1), CHAMP, 1.2, 0.7));
    const [gx, gy] = pt(i * 30 + 15, (R0 + R1) / 2);
    o.push(txt(gx, gy, SIGN_GLYPH[i] + VS, { size: 38, fill: CHAMP, family: GLYPH }));
  }
  const cusps = c.houses?.map((h) => h.cusp);
  if (cusps) {
    for (let i = 0; i < 12; i++) {
      const angle = i % 3 === 0;
      o.push(line(pt(cusps[i], R1), pt(cusps[i], R3), angle ? CHAMP : TAUPE, angle ? 2.2 : 1, angle ? 0.95 : 0.55));
      const span = norm360(cusps[(i + 1) % 12] - cusps[i]);
      const [nx, ny] = pt(cusps[i] + span / 2, R3 + 22);
      o.push(txt(nx, ny, String(i + 1), { size: 17, fill: TAUPE }));
    }
    for (const [lon, s] of [[cusps[0], "As"], [cusps[9], "Mc"]] as const) {
      const [x, y] = pt(lon + 7, R3 - 26);
      o.push(txt(x, y, s, { size: 24, fill: CHAMP, family: SERIF, weight: "600" }));
    }
  }
  o.push(`<circle cx="${cx}" cy="${cy}" r="${R3}" fill="${NAVY2}" stroke="${CHAMP}" stroke-width="1.2" stroke-opacity="0.8"/>`);
  // planets on a ring, spread so glyphs never overlap
  const bodies = c.positions.filter((p) => MAIN.includes(p.planet)).map((p) => ({ key: p.planet as string, lon: p.lon }));
  const sorted = [...bodies].sort((a, b) => a.lon - b.lon);
  const disp = sorted.map((p) => p.lon);
  for (let pass = 0; pass < 6; pass++) for (let i = 0; i < disp.length; i++) {
    const j = (i + 1) % disp.length, gap = norm360(disp[j] - disp[i]);
    if (gap < 9 && disp.length > 1) { const push = (9 - gap) / 2; disp[i] -= push; disp[j] += push; }
  }
  sorted.forEach((p, i) => {
    o.push(line(pt(p.lon, R1), pt(p.lon, R1 - 14), CREAM, 2));
    const [gx, gy] = pt(disp[i], R1 - 48);
    const big = p.key === "sun" || p.key === "moon";
    o.push(txt(gx, gy, PLANET_GLYPH[p.key] + VS, { size: big ? 40 : 32, fill: big ? CHAMP : CREAM, family: GLYPH }));
  });
  // centre: a quiet star mark
  o.push(`<path d="M${cx} ${cy - 30} L${cx + 7} ${cy - 7} L${cx + 30} ${cy} L${cx + 7} ${cy + 7} L${cx} ${cy + 30} L${cx - 7} ${cy + 7} L${cx - 30} ${cy} L${cx - 7} ${cy - 7} Z" fill="${CHAMP}" fill-opacity="0.85"/>`);

  // big three
  const b = bigThree(c);
  const cols: [string, string, string][] = [
    ["SUN", PLANET_GLYPH.sun, signName(b.sun)],
    ["MOON", PLANET_GLYPH.moon, b.moonAlt ? `${signName(b.moon)} or ${signName(b.moonAlt)}` : signName(b.moon)],
    ["RISING", "As", b.rising ? signName(b.rising) : "Needs birth time"],
  ];
  const y0 = 1128;
  o.push(line([90, y0 - 52], [W - 90, y0 - 52], CHAMP, 1, 0.5));
  cols.forEach(([label, g, name], i) => {
    const x = 180 + i * 360;
    o.push(txt(x, y0, label, { size: 20, fill: CHAMP, spacing: 6 }));
    const long = name.length > 12;
    o.push(txt(x, y0 + 58, escapeXml(name), { size: long ? (name.length > 18 ? 30 : 38) : 52, family: SERIF, weight: "600", fill: b.rising || i < 2 ? CREAM : TAUPE }));
    void g;
  });
  o.push(txt(cx, H - 48, "STELLARA · mystellara.com", { size: 20, fill: CHAMP, spacing: 3 }));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${o.join("")}</svg>`;
}

const fontDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "fonts");
const FONTS = ["CormorantGaramond-500.ttf", "CormorantGaramond-600.ttf", "Inter-400.ttf", "DejaVuSans.ttf"].map((f) => path.join(fontDir, f));
export function portraitPng(c: Chart): Buffer {
  return new Resvg(portraitSvg(c), { font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: SANS }, fitTo: { mode: "width", value: 1080 } }).render().asPng();
}
