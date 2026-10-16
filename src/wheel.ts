// Professional natal chart image (astro-seek style) as SVG; PNG via resvg with the bundled DejaVu Sans font.
// Ascendant on the left. Placidus house segments, aspect lines (green harmonious, red tense), side table.
import type { Chart } from "./chart.js";
import { ZODIAC, norm360 } from "./chart.js";
import { escapeXml } from "./tools.js";

const VS = "\uFE0E";
export const SIGN_GLYPH = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
export const PLANET_GLYPH: Record<string, string> = { north_node: "☊", south_node: "☋", lilith: "⚸", chiron: "⚷", asc: "As", mc: "Mc", sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂", jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇" };
const EL_COLOR = ["#c0504d", "#c08a3e", "#5f9a6e", "#4a78a8"]; // fire, earth, air, water
const BG = "#ebe6de", INK = "#2a2f3a", MUTED = "#6b6560", LINE = "#8a847c", SHADE = ["#e2ddd5", "#cfc9c1"];
const FONT = "DejaVu Sans";
const PNAME: Record<string, string> = { north_node: "N. Node", south_node: "S. Node", lilith: "Lilith", chiron: "Chiron", sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus", mars: "Mars", jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus", neptune: "Neptune", pluto: "Pluto" };
const PNAME_NL: Record<string, string> = { north_node: "Noordknoop", south_node: "Zuidknoop", lilith: "Lilith", chiron: "Chiron", sun: "Zon", moon: "Maan", mercury: "Mercurius", venus: "Venus", mars: "Mars", jupiter: "Jupiter", saturn: "Saturnus", uranus: "Uranus", neptune: "Neptunus", pluto: "Pluto" };

export interface WheelMeta { title: string; lines: string[]; footer: string[]; lang: "en" | "nl" }

const dms = (lon: number) => { const d = lon % 30; let deg = Math.floor(d), m = Math.round((d - deg) * 60); if (m === 60) { deg++; m = 0; } return `${deg}°${String(m).padStart(2, "0")}'`; };
const signIdx = (lon: number) => Math.floor(norm360(lon) / 30);

export function chartWheelSvg(c: Chart, meta: WheelMeta): string {
  const W = 1500, H = 1000, cx = 600, cy = 540;
  const R0 = 400, R1 = 345, R2 = 300, R3 = 190; // outer, sign ring inner, house numbers ring inner, aspect circle
  const left = c.asc ?? 0;
  const pt = (lon: number, r: number) => { const a = ((180 + (lon - left)) * Math.PI) / 180; return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const; };
  const f = (n: number) => n.toFixed(1);
  const txt = (x: number, y: number, s: string, o: { size?: number; fill?: string; anchor?: string; weight?: string } = {}) =>
    `<text x="${f(x)}" y="${f(y)}" font-family="${FONT}" font-size="${o.size ?? 16}" fill="${o.fill ?? INK}" text-anchor="${o.anchor ?? "start"}"${o.weight ? ` font-weight="${o.weight}"` : ""} dominant-baseline="central">${s}</text>`;
  const sector = (a0: number, a1: number, ra: number, rb: number, fill: string) => {
    const span = norm360(a1 - a0), large = span > 180 ? 1 : 0;
    const [x0, y0] = pt(a0, ra), [x1, y1] = pt(a1, ra), [x2, y2] = pt(a1, rb), [x3, y3] = pt(a0, rb);
    return `<path d="M${f(x0)} ${f(y0)} A${ra} ${ra} 0 ${large} 0 ${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A${rb} ${rb} 0 ${large} 1 ${f(x3)} ${f(y3)} Z" fill="${fill}"/>`;
  };
  const o: string[] = [`<rect width="${W}" height="${H}" fill="${BG}"/>`];
  // header + left info
  o.push(txt(40, 50, escapeXml(meta.title), { size: 34 }));
  meta.lines.forEach((l, i) => o.push(txt(40, 110 + i * 24, escapeXml(l), { size: 16, fill: i === 0 || l.endsWith(":") ? INK : MUTED })));
  meta.footer.forEach((l, i) => o.push(txt(40, H - 40 - (meta.footer.length - 1 - i) * 24, escapeXml(l), { size: 15, fill: MUTED })));
  // element & quality percentages (Sun..Pluto + Asc/MC weighting kept simple: each planet 1, Sun/Moon 2)
  const el = [0, 0, 0, 0], q = [0, 0, 0];
  for (const p of c.positions) { const w = p.planet === "sun" || p.planet === "moon" ? 2 : 1; const s = signIdx(p.lon); el[s % 4] += w; q[s % 3] += w; }
  const tot = el.reduce((a, b) => a + b, 0);
  const nl = meta.lang === "nl";
  const elNames = nl ? ["Vuur", "Aarde", "Lucht", "Water"] : ["Fire", "Earth", "Air", "Water"];
  const qNames = nl ? ["Hoofd", "Vast", "Beweeglijk"] : ["Cardinal", "Fixed", "Mutable"];
  let y = 110 + meta.lines.length * 24 + 24;
  o.push(txt(40, y, nl ? "Elementen:" : "Elements:", { size: 16 })); y += 24;
  elNames.forEach((n, i) => { o.push(txt(40, y, `${n} ${Math.round((el[i] / tot) * 100)}%`, { size: 16, fill: EL_COLOR[i] })); y += 22; });
  y += 14; o.push(txt(40, y, nl ? "Kwaliteiten:" : "Qualities:", { size: 16 })); y += 24;
  qNames.forEach((n, i) => { o.push(txt(40, y, `${n} ${Math.round((q[i] / tot) * 100)}%`, { size: 16, fill: ["#5f9a6e", "#c08a3e", "#c0504d"][i] })); y += 22; });

  // outer zodiac ring
  o.push(`<circle cx="${cx}" cy="${cy}" r="${R0}" fill="#f3efe8" stroke="${LINE}" stroke-width="1.5"/>`);
  for (let i = 0; i < 12; i++) {
    o.push(sector(i * 30, i * 30 + 30, R0, R1, i % 2 ? "#f3efe8" : "#ece7df"));
    const [x0, y0] = pt(i * 30, R0), [x1, y1] = pt(i * 30, R1);
    o.push(`<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${LINE}" stroke-width="1"/>`);
    const [gx, gy] = pt(i * 30 + 15, (R0 + R1) / 2 + 4);
    o.push(txt(gx, gy, SIGN_GLYPH[i] + VS, { size: 34, fill: EL_COLOR[i % 4], anchor: "middle" }));
  }
  for (let d = 0; d < 360; d++) {
    const len = d % 10 === 0 ? 12 : d % 5 === 0 ? 8 : 4;
    const [x0, y0] = pt(d, R1), [x1, y1] = pt(d, R1 + len);
    o.push(`<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${LINE}" stroke-width="0.8"/>`);
  }
  // houses
  const cusps = c.houses?.map((h) => h.cusp);
  if (cusps) {
    for (let i = 0; i < 12; i++) {
      const a = cusps[i], b = cusps[(i + 1) % 12];
      o.push(sector(a, a + norm360(b - a), R1, R3, SHADE[i % 2]));
      const [nx, ny] = pt(a + norm360(b - a) / 2, R3 + 22);
      o.push(txt(nx, ny, String(i + 1), { size: 18, fill: MUTED, anchor: "middle" }));
      const [x0, y0] = pt(a, R1), [x1, y1] = pt(a, R3);
      const angle = i % 3 === 0;
      o.push(`<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${angle ? INK : LINE}" stroke-width="${angle ? 2 : 1}"/>`);
      const [dx, dy] = pt(a, R0 + 18);
      o.push(txt(dx, dy, `${Math.floor(a % 30)}°`, { size: 13, fill: EL_COLOR[signIdx(a) % 4], anchor: "middle" }));
    }
    const lab: [number, string][] = [[cusps[0], "As"], [cusps[6], "Ds"], [cusps[9], "Mc"], [cusps[3], "Ic"]];
    for (const [lon, s] of lab) { const [x, y2] = pt(lon + 5, R1 - 22); o.push(txt(x, y2, s, { size: 22, fill: "#c08a3e", anchor: "middle" })); }
  } else {
    o.push(`<circle cx="${cx}" cy="${cy}" r="${R1}" fill="${SHADE[0]}" stroke="${LINE}"/>`);
  }
  o.push(`<circle cx="${cx}" cy="${cy}" r="${R1}" fill="none" stroke="${LINE}" stroke-width="1.2"/>`);
  o.push(`<circle cx="${cx}" cy="${cy}" r="${R3}" fill="${BG}" stroke="${INK}" stroke-width="1.5"/>`);
  // aspects
  const lonOf = Object.fromEntries(c.positions.map((p) => [p.planet, p.lon]));
  for (const a of c.aspects) {
    if (a.type === "conjunction") continue;
    const [x1, y1] = pt(lonOf[a.a], R3), [x2, y2] = pt(lonOf[a.b], R3);
    const tense = a.type === "square" || a.type === "opposition";
    o.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${tense ? "#b5524a" : "#4f9a6a"}" stroke-width="${a.orb < 2 ? 2 : 1.2}" stroke-opacity="0.85"/>`);
  }
  // planets (spread to avoid overlap)
  const bodies = [...c.positions.map((p) => ({ key: p.planet as string, lon: p.lon, retrograde: p.retrograde })), ...c.points.map((p) => ({ key: p.point as string, lon: p.lon, retrograde: false }))];
  const sorted = [...bodies].sort((a, b) => a.lon - b.lon);
  const disp = sorted.map((p) => p.lon);
  for (let pass = 0; pass < 4; pass++) for (let i = 0; i < disp.length; i++) {
    const j = (i + 1) % disp.length; const gap = norm360(disp[j] - disp[i]);
    if (gap < 7 && disp.length > 1) { const push = (7 - gap) / 2; disp[i] -= push; disp[j] += push; }
  }
  sorted.forEach((p, i) => {
    const color = EL_COLOR[signIdx(p.lon) % 4];
    const [tx, ty] = pt(p.lon, R3), [tx2, ty2] = pt(p.lon, R3 + 10);
    o.push(`<line x1="${f(tx)}" y1="${f(ty)}" x2="${f(tx2)}" y2="${f(ty2)}" stroke="${INK}" stroke-width="1.5"/>`);
    const [gx, gy] = pt(disp[i], 262);
    const small = !(p.key in PNAME) || /node|lilith|chiron/.test(p.key);
    o.push(txt(gx, gy, PLANET_GLYPH[p.key] + VS, { size: small ? 24 : 30, fill: small ? MUTED : color, anchor: "middle" }));
    const [lx, ly] = pt(disp[i], 230);
    o.push(txt(lx, ly, `${Math.floor(p.lon % 30)}°${p.retrograde ? "R" : ""}`, { size: 12, fill: MUTED, anchor: "middle" }));
  });
  // right table
  let ty = 110; const tx = 1060;
  for (const p of bodies) {
    const s = signIdx(p.lon);
    o.push(txt(tx, ty, (nl ? PNAME_NL : PNAME)[p.key], { size: 16, anchor: "end" }));
    o.push(txt(tx + 12, ty, PLANET_GLYPH[p.key] + VS, { size: 18, fill: EL_COLOR[s % 4] }));
    o.push(txt(tx + 40, ty, `${dms(p.lon)}`, { size: 16 }));
    o.push(txt(tx + 108, ty, SIGN_GLYPH[s] + VS, { size: 18, fill: EL_COLOR[s % 4] }));
    if (p.retrograde) o.push(txt(tx + 132, ty, "R", { size: 14, fill: "#b5524a" }));
    ty += 24;
  }
  if (c.asc !== undefined && c.mc !== undefined) {
    for (const [n, lon] of [["Asc", c.asc], ["Mc", c.mc]] as const) {
      const s = signIdx(lon);
      o.push(txt(tx, ty, n, { size: 16, anchor: "end" }));
      o.push(txt(tx + 40, ty, dms(lon), { size: 16 }));
      o.push(txt(tx + 108, ty, SIGN_GLYPH[s] + VS, { size: 18, fill: EL_COLOR[s % 4] }));
      ty += 24;
    }
  }
  if (cusps) {
    ty = 110; const tx = 1300;
    cusps.forEach((cu, i) => {
      const s = signIdx(cu);
      o.push(txt(tx, ty, `${nl ? "Huis" : "Cusp"} ${i + 1}`, { size: 15, anchor: "end", fill: MUTED }));
      o.push(txt(tx + 12, ty, dms(cu), { size: 15 }));
      o.push(txt(tx + 80, ty, SIGN_GLYPH[s] + VS, { size: 17, fill: EL_COLOR[s % 4] }));
      ty += 24;
    });
  }
  // triangular aspect grid (like astro-seek): rows/cols = bodies incl. points and angles
  const gk = [...c.positions.filter((p) => !(c.moonUncertain && p.planet === "moon")).map((p) => p.planet as string), "north_node", "lilith", ...(c.points.some((p) => p.point === "chiron") ? ["chiron"] : []), ...(c.asc !== undefined ? ["asc", "mc"] : [])];
  const AG: Record<string, [string, string]> = { conjunction: ["☌", "#c08a3e"], opposition: ["☍", "#b5524a"], square: ["□", "#b5524a"], trine: ["△", "#4f9a6a"], sextile: ["✱", "#4f9a6a"] };
  const cell = 24, gx0 = W - 40 - cell * gk.length, gy0 = H - 70 - cell * gk.length;
  const ga = new Map(c.gridAspects.map((a) => [[a.a, a.b].sort().join(), a]));
  gk.forEach((k, i) => {
    const y0 = gy0 + i * cell;
    o.push(`<rect x="${gx0 + i * cell}" y="${y0}" width="${cell}" height="${cell}" fill="#f3efe8" stroke="${INK}" stroke-width="0.8"/>`);
    o.push(txt(gx0 + i * cell + cell / 2, y0 + cell / 2 + 1, PLANET_GLYPH[k] + VS, { size: k === "asc" || k === "mc" ? 11 : 15, fill: INK, anchor: "middle" }));
    for (let j = 0; j < i; j++) {
      const x0 = gx0 + j * cell;
      o.push(`<rect x="${x0}" y="${y0}" width="${cell}" height="${cell}" fill="none" stroke="${INK}" stroke-width="0.8"/>`);
      const a = ga.get([k, gk[j]].sort().join());
      if (a) o.push(txt(x0 + cell / 2, y0 + cell / 2 + 1, AG[a.type][0] + VS, { size: 15, fill: AG[a.type][1], anchor: "middle" }));
    }
  });
  o.push(txt(W - 40, H - 30, "STELLARA · mystellara.com", { size: 15, fill: "#c08a3e", anchor: "end" }));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${o.join("")}</svg>`;
}
void ZODIAC;
