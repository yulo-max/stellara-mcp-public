// Share cards (1200x675, X summary_large_image) and share pages. Stateless: the URL token holds only
// computed results (sign indexes, rounded planet degrees, score, a public name) – never a birth date,
// time or place. Nothing is stored or logged.
import { ZODIAC, norm360 } from "./chart.js";
import { SIGN_GLYPH, PLANET_GLYPH } from "./wheel.js";
import { escapeXml } from "./tools.js";
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL ?? "https://mcp.mystellara.com").replace(/\/$/, "");

type Lang = "en" | "nl";
const VS = "\uFE0E";
const W = 1200, H = 675;
const BG = "#14122b", BG2 = "#2b2457", GOLD = "#e9c46a", INK = "#f4f1ea", MUTED = "#b9b3d6";
const EL = ["#e76f51", "#d4a373", "#8ecae6", "#6fa8dc"];
const SIGN_NAME: Record<Lang, string[]> = {
  en: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
  nl: ["Ram", "Stier", "Tweelingen", "Kreeft", "Leeuw", "Maagd", "Weegschaal", "Schorpioen", "Boogschutter", "Steenbok", "Waterman", "Vissen"],
};
export const SITE = "https://mystellara.com";

export interface MatchToken { k: "m"; l: Lang; n: string; s: number; b: number; u: number[]; c: number[] } // u/c = [sun, moon, rising] (-1 unknown)
export interface ChartToken { k: "c"; l: Lang; t: number[]; p: number[] } // t = [sun, moon, rising]; p = planet longitudes (deg, Sun..Pluto)
export type ShareToken = MatchToken | ChartToken;

export const signIndex = (key?: string | null) => (key ? ZODIAC.findIndex((z: { key: string }) => z.key === key) : -1);
export function encodeToken(t: ShareToken): string { return Buffer.from(JSON.stringify(t)).toString("base64url"); }
const isIdx = (x: unknown) => Number.isInteger(x) && (x as number) >= -1 && (x as number) < 12;
export function decodeToken(s: string | undefined, kind: "m" | "c"): ShareToken | null {
  if (!s || s.length > 600 || !/^[A-Za-z0-9_-]+$/.test(s)) return null;
  try {
    const t = JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
    if (t?.k !== kind || (t.l !== "en" && t.l !== "nl")) return null;
    if (kind === "m") {
      if (typeof t.n !== "string" || t.n.length > 60 || !Number.isInteger(t.s) || t.s < 0 || t.s > 100 || !Number.isInteger(t.b) || t.b < 0 || t.b > 3) return null;
      if (!Array.isArray(t.u) || !Array.isArray(t.c) || t.u.length !== 3 || t.c.length !== 3 || ![...t.u, ...t.c].every(isIdx)) return null;
      return { k: "m", l: t.l, n: t.n, s: t.s, b: t.b, u: t.u, c: t.c };
    }
    if (!Array.isArray(t.t) || t.t.length !== 3 || !t.t.every(isIdx) || !Array.isArray(t.p) || t.p.length > 10 || !t.p.every((x: unknown) => Number.isInteger(x) && (x as number) >= 0 && (x as number) < 360)) return null;
    return { k: "c", l: t.l, t: t.t, p: t.p };
  } catch { return null; }
}

const COPY = {
  you: { en: "You", nl: "Jij" },
  match: { en: "star match", nl: "sterrenmatch" },
  band: { en: ["Opposites who keep each other on their toes.", "A fun mix that never gets boring.", "You two just click.", "Practically star twins!"], nl: ["Tegenpolen die elkaar scherp houden.", "Een leuke mix.", "Het klikt gewoon.", "Bijna sterrentweelingen!"] },
  moonUnknown: { en: "Moon: unknown without time", nl: "Maan: onbekend zonder tijd" },
  sun: { en: "Sun", nl: "Zon" }, moon: { en: "Moon", nl: "Maan" }, rising: { en: "Rising", nl: "Rijzend" },
  chartHead: { en: "My birth chart", nl: "Mijn geboortehoroscoop" },
  chartLine: { en: "Sun, moon and rising: the short version of me.", nl: "Zon, maan en rijzend teken: de korte versie van mij." },
  cta: { en: "Get your own chart", nl: "Maak je eigen kaart" },
  ctaSub: { en: "Take the free quiz or get the full report ($37)", nl: "Doe de gratis quiz of haal het volledige rapport ($37)" },
  footer: { en: "For self-reflection, not predictions.", nl: "Voor zelfreflectie, geen voorspellingen." },
  matchTitle: { en: "{you} and {name}: {score}% star match", nl: "{you} en {name}: {score}% sterrenmatch" },
  chartTitle: { en: "My birth chart: {sun} sun, {moon} moon, {rising} rising", nl: "Mijn horoscoop: zon {sun}, maan {moon}, rijzend {rising}" },
  tweetMatch: { en: "My stars are a {score}% match with {name} ✨ Who's yours?", nl: "Mijn sterren matchen voor {score}% met {name} ✨ Wie is jouw match?" },
  tweetChart: { en: "My stars: {sun} sun, {moon} moon, {rising} rising ✨ What are yours?", nl: "Mijn sterren: zon {sun}, maan {moon}, rijzend {rising} ✨ En die van jou?" },
};
const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
const sn = (i: number, l: Lang) => (i >= 0 ? SIGN_NAME[l][i] : "?");
const isElon = (n: string) => /elon\s+musk/i.test(n);

const txt = (x: number, y: number, s: string, o: { size: number; fill?: string; anchor?: string; weight?: string; family?: string }) =>
  `<text x="${x}" y="${y}" font-family="${o.family ?? "DejaVu Sans"}" font-size="${o.size}" fill="${o.fill ?? INK}" text-anchor="${o.anchor ?? "start"}"${o.weight ? ` font-weight="${o.weight}"` : ""} dominant-baseline="central">${escapeXml(s)}</text>`;

function frame(inner: string[], l: Lang): string {
  const stars: string[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 70; i++) stars.push(`<circle cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * H).toFixed(0)}" r="${(0.6 + rnd() * 1.6).toFixed(1)}" fill="#fff" opacity="${(0.25 + rnd() * 0.5).toFixed(2)}"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
    + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BG}"/><stop offset="1" stop-color="${BG2}"/></linearGradient></defs>`
    + `<rect width="${W}" height="${H}" fill="url(#g)"/>${stars.join("")}`
    + inner.join("")
    + txt(60, H - 45, "STELLARA", { size: 26, fill: GOLD, weight: "bold" })
    + txt(W - 60, H - 45, "mystellara.com", { size: 24, fill: INK, anchor: "end" })
    + txt(W / 2, H - 45, COPY.footer[l], { size: 17, fill: MUTED, anchor: "middle" })
    + `</svg>`;
}

function badge(cx: number, cy: number, label: string, trio: number[], l: Lang): string[] {
  const o = [txt(cx, cy - 150, label, { size: 40, weight: "bold", anchor: "middle" })];
  o.push(`<circle cx="${cx}" cy="${cy}" r="92" fill="none" stroke="${GOLD}" stroke-width="3"/>`);
  const s = trio[0];
  o.push(txt(cx, cy + 4, s >= 0 ? SIGN_GLYPH[s] + VS : "?", { size: 96, fill: s >= 0 ? EL[s % 4] : MUTED, anchor: "middle" }));
  const parts: string[] = [];
  if (trio[0] >= 0) parts.push(`${COPY.sun[l]} ${SIGN_GLYPH[trio[0]]}${VS} ${sn(trio[0], l)}`);
  parts.push(trio[1] >= 0 ? `${COPY.moon[l]} ${SIGN_GLYPH[trio[1]]}${VS} ${sn(trio[1], l)}` : COPY.moonUnknown[l]);
  if (trio[2] >= 0) parts.push(`${COPY.rising[l]} ${SIGN_GLYPH[trio[2]]}${VS} ${sn(trio[2], l)}`);
  parts.forEach((p, k) => o.push(txt(cx, cy + 125 + k * 30, p, { size: 22, fill: MUTED, anchor: "middle" })));
  return o;
}

function rocket(x: number, y: number): string {
  // A small line-art rocket with a trail of stars: a light nod, no logo.
  return `<g transform="translate(${x} ${y}) rotate(35)" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linejoin="round">`
    + `<path d="M0,-38 C12,-24 14,-4 10,18 L-10,18 C-14,-4 -12,-24 0,-38 Z"/><circle cx="0" cy="-10" r="5"/>`
    + `<path d="M-10,8 L-20,24 L-10,20 M10,8 L20,24 L10,20"/><path d="M-5,22 L0,36 L5,22" stroke="#e76f51"/></g>`
    + [[-40, 52, 3], [-62, 80, 2], [-30, 92, 2.4]].map(([dx, dy, r]) => `<circle cx="${x + dx}" cy="${y + dy}" r="${r}" fill="${GOLD}"/>`).join("");
}

export function matchCardSvg(t: MatchToken): string {
  const l = t.l, o: string[] = [];
  o.push(txt(W / 2, 70, `${t.s}%`, { size: 92, fill: GOLD, weight: "bold", anchor: "middle" }));
  o.push(txt(W / 2, 140, COPY.match[l], { size: 28, fill: MUTED, anchor: "middle" }));
  o.push(...badge(270, 330, COPY.you[l], t.u, l), ...badge(W - 270, 330, t.n, t.c, l));
  o.push(txt(W / 2, 330, "✦", { size: 54, fill: GOLD, anchor: "middle" }));
  o.push(txt(W / 2, 560, COPY.band[l][t.b], { size: 32, anchor: "middle" }));
  if (isElon(t.n)) o.push(rocket(W - 80, 90));
  return frame(o, l);
}

export function chartCardSvg(t: ChartToken): string {
  const l = t.l, o: string[] = [];
  // mini wheel on the left
  const cx = 330, cy = 310, R = 220, r0 = 170;
  o.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="#1d1a3d" stroke="${GOLD}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${r0}" fill="none" stroke="${MUTED}" stroke-width="1"/>`);
  const asc = t.t[2] >= 0 ? t.t[2] * 30 + 15 : 0; // rough: rising sign centre on the left
  const pt = (lon: number, rad: number) => { const a = Math.PI - ((lon - asc) * Math.PI) / 180; return [cx + rad * Math.cos(a), cy - rad * Math.sin(a)]; };
  for (let i = 0; i < 12; i++) {
    const [x1, y1] = pt(i * 30, r0), [x2, y2] = pt(i * 30, R);
    o.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${MUTED}" stroke-width="1"/>`);
    const [gx, gy] = pt(i * 30 + 15, (R + r0) / 2);
    o.push(txt(gx, gy, SIGN_GLYPH[i] + VS, { size: 26, fill: EL[i % 4], anchor: "middle" }));
  }
  const keys = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
  const placed: number[] = [];
  t.p.forEach((lon, i) => {
    let d = lon;
    for (const q of placed) if (Math.abs(norm360(d - q + 180) - 180) < 9) d = q + 9;
    placed.push(d);
    const [x, y] = pt(d, r0 - 32);
    o.push(txt(x, y, PLANET_GLYPH[keys[i]] + VS, { size: i < 2 ? 30 : 24, fill: i < 2 ? GOLD : INK, anchor: "middle" }));
  });
  // text on the right
  o.push(txt(640, 120, COPY.chartHead[l], { size: 44, weight: "bold" }));
  const rows: [string, number][] = [[COPY.sun[l], t.t[0]], [COPY.moon[l], t.t[1]], [COPY.rising[l], t.t[2]]];
  rows.filter(([n, i]) => i >= 0 || n === COPY.moon[l]).forEach(([name, i], k) => {
    o.push(txt(640, 230 + k * 85, i >= 0 ? SIGN_GLYPH[i] + VS : "?", { size: 56, fill: i >= 0 ? EL[i % 4] : MUTED }));
    o.push(txt(720, 215 + k * 85, name, { size: 22, fill: MUTED }));
    o.push(txt(720, 247 + k * 85, i >= 0 ? sn(i, l) : (l === "nl" ? "onbekend zonder tijd" : "unknown without time"), { size: i >= 0 ? 34 : 26, weight: "bold" }));
  });
  o.push(txt(640, 520, COPY.chartLine[l], { size: 20, fill: MUTED }));
  return frame(o, l);
}

export function titleFor(t: ShareToken): string {
  return t.k === "m" ? fill(COPY.matchTitle[t.l], { you: COPY.you[t.l], name: t.n, score: String(t.s) })
    : fill(COPY.chartTitle[t.l], { sun: sn(t.t[0], t.l), moon: sn(t.t[1], t.l), rising: sn(t.t[2], t.l) });
}
export function descFor(t: ShareToken): string { return t.k === "m" ? COPY.band[t.l][t.b] : COPY.chartLine[t.l]; }

export function shareLinks(t: ShareToken) {
  const id = encodeToken(t);
  const page = `${PUBLIC_BASE_URL}/s/${t.k === "m" ? "match" : "chart"}?t=${id}`;
  const image = `${PUBLIC_BASE_URL}/${t.k === "m" ? "match" : "chart-card"}.png?t=${id}`;
  const text = t.k === "m" ? fill(COPY.tweetMatch[t.l], { score: String(t.s), name: t.n })
    : fill(COPY.tweetChart[t.l], { sun: sn(t.t[0], t.l), moon: sn(t.t[1], t.l), rising: sn(t.t[2], t.l) }).replace(/, \? rising|, rijzend \?/, "").replace(/ \? moon,|, maan \?/, "");
  // No @handles: we never tag anyone.
  const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(page)}`;
  return { share_page_url: page, share_image_url: image, share_text: text, share_url: intent };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export function sharePageHtml(t: ShareToken): string {
  const { share_page_url: page, share_image_url: image } = shareLinks(t);
  const l = t.l, title = titleFor(t), desc = descFor(t);
  return `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Stellara</title><meta name="robots" content="noindex">
<meta property="og:type" content="website"><meta property="og:site_name" content="Stellara"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(page)}"><meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="675">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(image)}">
<style>body{margin:0;font-family:system-ui,sans-serif;background:#14122b;color:#f4f1ea;text-align:center}main{max-width:720px;margin:0 auto;padding:32px 20px}img{width:100%;border-radius:14px}h1{font-size:1.5rem}p{color:#b9b3d6}a.cta{display:inline-block;margin-top:12px;padding:14px 26px;border-radius:999px;background:#e9c46a;color:#14122b;font-weight:700;text-decoration:none}small{display:block;margin-top:28px;color:#8a85a8}</style></head>
<body><main><img src="${esc(image)}" alt="${esc(title)}" width="1200" height="675"><h1>${esc(title)}</h1><p>${esc(desc)}</p>
<a class="cta" href="${SITE}/?utm_source=x&amp;utm_medium=share&amp;utm_campaign=${t.k === "m" ? "match" : "chart"}">${esc(COPY.cta[l])}</a><p>${esc(COPY.ctaSub[l])}</p>
<small>${esc(COPY.footer[l])}</small></main></body></html>`;
}
