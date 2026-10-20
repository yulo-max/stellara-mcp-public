import { parseBirthDate, sunSign, lifePath, type Lang } from "./astro.js";
import { SIGN_TEXT, LIFE_PATH_TEXT, UI, CARD, CARD_SIGN_TEXT, CARD_LIFE_PATH_MEANING, fill } from "./copy.js";

function signName(s: { nl: string; en: string }, l: Lang) { return l === "nl" ? s.nl : s.en; }

export type Voice = "third_person" | "second_person";

/** Short reading. Default voice is third person (brand rule: no "you are"); second_person keeps the old "With this sun you ..." copy. */
export function korteLezing(geboortedatum: string, taal: Lang = "en", today?: Date, voice: Voice = "third_person") {
  const b = parseBirthDate(geboortedatum, today);
  const sun = sunSign(b);
  const lp = lifePath(b);
  const s = sun.sign;
  const third = voice === "third_person";
  const sign = signName(s, taal);
  const lines: string[] = [];
  lines.push(`${UI.sun[taal]} ${sign}. ${UI.lifePath[taal]} ${lp}.`);
  if (sun.cusp && sun.other) {
    lines.push(fill((third ? CARD.cuspNoName : UI.cusp)[taal], { a: sign, b: signName(sun.other, taal) }));
  }
  // Third person reuses the card copy with the neutral subject ("Someone born under Scorpio is ...").
  const signText = third ? fill(CARD_SIGN_TEXT[s.key][taal], { wie: fill(CARD.subjectNoName[taal], { sign }) }) : SIGN_TEXT[s.key][taal];
  lines.push(
    fill(UI.rules[taal], {
      sign,
      element: taal === "nl" ? s.elementNl : s.elementEn,
      ruler: taal === "nl" ? s.rulerNl : s.rulerEn,
    }) + " " + signText,
  );
  lines.push(third
    ? fill((lp > 9 ? CARD.lifePathMasterNoName : CARD.lifePathNoName)[taal], { n: String(lp), meaning: CARD_LIFE_PATH_MEANING[lp][taal] })
    : LIFE_PATH_TEXT[lp][taal]);
  return {
    text: [...lines, UI.footer[taal]].join("\n\n"),
    data: { sun_sign: sign, sun_sign_key: s.key, sign_change_day: sun.cusp, life_path_number: lp, reading: lines.slice(1).join("\n\n"), disclaimer: UI.footer[taal] },
  };
}

export function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);
}

/** For text that may end up in HTML (card_text, JSON output). */
export function escapeHtml(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const NAME_RE = /^[\p{L}\p{M} '’-]+$/u;

/** Empty or whitespace = no name. Otherwise letters, combining marks, spaces, hyphens and apostrophes, max 40 characters after trimming. */
export function validateName(naam?: string): string | undefined {
  const n = (naam ?? "").trim();
  if (!n) return undefined;
  if (!NAME_RE.test(n) || !/\p{L}/u.test(n) || [...n].length > 40) throw new Error(`${UI.badName.nl} / ${UI.badName.en}`);
  return n.replace(/ {2,}/g, " ");
}

function wrap(text: string, max: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    if ((line + " " + w).trim().length > max) { out.push(line); line = w; }
    else line = (line + " " + w).trim();
  }
  if (line) out.push(line);
  return out;
}

export function christmasStarsKaart(geboortedatum: string, naam?: string, taal: Lang = "en", today?: Date) {
  const b = parseBirthDate(geboortedatum, today);
  const sun = sunSign(b);
  const lp = lifePath(b);
  const s = sun.sign;
  const name = validateName(naam);
  const sign = signName(s, taal);
  const signLine = fill(UI.rules[taal], {
    sign,
    element: taal === "nl" ? s.elementNl : s.elementEn,
    ruler: taal === "nl" ? s.rulerNl : s.rulerEn,
  });
  const master = lp > 9;
  // Third person about the recipient. `n` is the name as it should appear (HTML-escaped for card_text, raw for the SVG).
  const parts = (n?: string) => {
    const wie = n ?? fill(CARD.subjectNoName[taal], { sign });
    const meaning = CARD_LIFE_PATH_MEANING[lp][taal];
    return {
      heading: n ? fill(UI.cardFor[taal], { naam: n }) : UI.cardNoName[taal],
      body: `${signLine} ${fill(CARD_SIGN_TEXT[s.key][taal], { wie })}`,
      lpLine: n
        ? fill((master ? CARD.lifePathMaster : CARD.lifePath)[taal], { naam: n, n: String(lp), meaning })
        : fill((master ? CARD.lifePathMasterNoName : CARD.lifePathNoName)[taal], { n: String(lp), meaning }),
      cuspLine: sun.cusp && sun.other
        ? fill((n ? CARD.cusp : CARD.cuspNoName)[taal], { naam: n ?? "", a: sign, b: signName(sun.other, taal) })
        : "",
    };
  };
  const safeName = name === undefined ? undefined : escapeHtml(name);
  const p = parts(safeName);
  const text = [p.heading, `${UI.sun[taal]} ${sign}. ${UI.lifePath[taal]} ${lp}.`, p.cuspLine, p.body, p.lpLine, UI.cardClose[taal], UI.footer[taal]]
    .filter(Boolean).join("\n\n");
  const { heading, body, lpLine } = parts(name);

  // SVG card, 1080x1350 (portrait, shareable). Brand colours from the Stellara style.
  const W = 1080, H = 1350;
  const NAVY = "#0a0f1a", GOLD = "#e7d2b1", TEXT = "#EAE5DC", MUTED = "#a39a8c";
  let y = 600;
  const tspans = (lines: string[], size: number, color: string, gap: number, font: string) =>
    lines.map((l) => { const t = `<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="${font}" font-size="${size}" fill="${color}">${escapeXml(l)}</text>`; y += gap; return t; }).join("\n  ");
  const serif = "'Cormorant Garamond', Georgia, serif", sans = "Inter, Helvetica, Arial, sans-serif";
  const bodyLines = tspans(wrap(body, 46), 34, TEXT, 50, serif);
  y += 20;
  const lpLines = tspans(wrap(lpLine, 52), 28, MUTED, 42, sans);
  const stars = [[160, 180, 3], [920, 240, 2], [840, 120, 2.5], [240, 1180, 2], [880, 1120, 3], [120, 760, 1.8], [980, 820, 1.8]]
    .map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${GOLD}" opacity="0.7"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${NAVY}"/>
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="${GOLD}" stroke-opacity="0.45" stroke-width="2" rx="8"/>
  ${stars}
  <path d="M540 170 L556 238 L624 254 L556 270 L540 338 L524 270 L456 254 L524 238 Z" fill="${GOLD}"/>
  <text x="540" y="400" text-anchor="middle" font-family="${sans}" font-size="24" letter-spacing="8" fill="${GOLD}">${escapeXml(UI.cardTitle[taal].toUpperCase())}</text>
  <text x="540" y="480" text-anchor="middle" font-family="${serif}" font-size="60" fill="${TEXT}">${escapeXml(heading)}</text>
  <text x="540" y="540" text-anchor="middle" font-family="${sans}" font-size="26" letter-spacing="3" fill="${GOLD}">${escapeXml(`${UI.sun[taal].toUpperCase()} ${sign.toUpperCase()} · ${UI.lifePath[taal].toUpperCase()} ${lp}`)}</text>
  ${bodyLines}
  ${lpLines}
  <text x="540" y="1190" text-anchor="middle" font-family="${serif}" font-style="italic" font-size="34" fill="${TEXT}">${escapeXml(UI.cardClose[taal])}</text>
  <text x="540" y="1260" text-anchor="middle" font-family="${sans}" font-size="22" letter-spacing="6" fill="${GOLD}">STELLARA</text>
</svg>`;
  return { text, svg, data: { sun_sign: sign, sun_sign_key: s.key, sign_change_day: sun.cusp, life_path_number: lp, recipient_name: safeName ?? null, card_text: text, disclaimer: UI.footer[taal] } };
}
