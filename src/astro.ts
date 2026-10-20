export type Lang = "nl" | "en";

export interface SignInfo {
  key: string;
  nl: string;
  en: string;
  /** first day (month, day) on which the sun usually is in this sign */
  start: [number, number];
  elementNl: string;
  elementEn: string;
  rulerNl: string;
  rulerEn: string;
}

// Simple date table. Boundary days shift by a day between years, so the start
// day and the day before it are reported as "cusp" (depends on birth time).
export const SIGNS: SignInfo[] = [
  { key: "aries", nl: "Ram", en: "Aries", start: [3, 21], elementNl: "vuurteken", elementEn: "a fire sign", rulerNl: "Mars", rulerEn: "Mars" },
  { key: "taurus", nl: "Stier", en: "Taurus", start: [4, 20], elementNl: "aardeteken", elementEn: "an earth sign", rulerNl: "Venus", rulerEn: "Venus" },
  { key: "gemini", nl: "Tweelingen", en: "Gemini", start: [5, 21], elementNl: "luchtteken", elementEn: "an air sign", rulerNl: "Mercurius", rulerEn: "Mercury" },
  { key: "cancer", nl: "Kreeft", en: "Cancer", start: [6, 21], elementNl: "waterteken", elementEn: "a water sign", rulerNl: "de Maan", rulerEn: "the Moon" },
  { key: "leo", nl: "Leeuw", en: "Leo", start: [7, 23], elementNl: "vuurteken", elementEn: "a fire sign", rulerNl: "de Zon", rulerEn: "the Sun" },
  { key: "virgo", nl: "Maagd", en: "Virgo", start: [8, 23], elementNl: "aardeteken", elementEn: "an earth sign", rulerNl: "Mercurius", rulerEn: "Mercury" },
  { key: "libra", nl: "Weegschaal", en: "Libra", start: [9, 23], elementNl: "luchtteken", elementEn: "an air sign", rulerNl: "Venus", rulerEn: "Venus" },
  { key: "scorpio", nl: "Schorpioen", en: "Scorpio", start: [10, 23], elementNl: "waterteken", elementEn: "a water sign", rulerNl: "Mars en Pluto", rulerEn: "Mars and Pluto" },
  { key: "sagittarius", nl: "Boogschutter", en: "Sagittarius", start: [11, 22], elementNl: "vuurteken", elementEn: "a fire sign", rulerNl: "Jupiter", rulerEn: "Jupiter" },
  { key: "capricorn", nl: "Steenbok", en: "Capricorn", start: [12, 22], elementNl: "aardeteken", elementEn: "an earth sign", rulerNl: "Saturnus", rulerEn: "Saturn" },
  { key: "aquarius", nl: "Waterman", en: "Aquarius", start: [1, 20], elementNl: "luchtteken", elementEn: "an air sign", rulerNl: "Saturnus en Uranus", rulerEn: "Saturn and Uranus" },
  { key: "pisces", nl: "Vissen", en: "Pisces", start: [2, 19], elementNl: "waterteken", elementEn: "a water sign", rulerNl: "Jupiter en Neptunus", rulerEn: "Jupiter and Neptune" },
];

export interface BirthDate { year: number; month: number; day: number; }

export function parseBirthDate(input: string, today = new Date()): BirthDate {
  const s = input.trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  let y: number, mo: number, d: number;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else if ((m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s))) { d = +m[1]; mo = +m[2]; y = +m[3]; }
  else throw new Error("Gebruik het formaat JJJJ-MM-DD, bijvoorbeeld 1988-03-14. / Use YYYY-MM-DD, e.g. 1988-03-14.");
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d)
    throw new Error("Deze datum bestaat niet. / This date does not exist.");
  if (y < 1900 || dt.getTime() > today.getTime())
    throw new Error("Kies een geboortedatum tussen 1900 en vandaag. / Pick a birth date between 1900 and today.");
  return { year: y, month: mo, day: d };
}

export interface SunResult { sign: SignInfo; cusp: boolean; other?: SignInfo; }

function ord(month: number, day: number) { return month * 100 + day; }

export function sunSign(b: BirthDate): SunResult {
  const o = ord(b.month, b.day);
  // find sign whose start is the latest start <= date (wrapping around the year)
  const sorted = [...SIGNS].sort((a, c) => ord(...a.start) - ord(...c.start));
  let sign = sorted[sorted.length - 1]; // capricorn wraps into early January
  for (const s of sorted) if (ord(...s.start) <= o) sign = s;
  const idx = SIGNS.indexOf(sign);
  const next = SIGNS[(idx + 1) % 12];
  const prev = SIGNS[(idx + 11) % 12];
  if (o === ord(...sign.start)) return { sign, cusp: true, other: prev };
  const [nm, nd] = next.start;
  const dayBefore = new Date(Date.UTC(2001, nm - 1, nd - 1));
  if (b.month === dayBefore.getUTCMonth() + 1 && b.day === dayBefore.getUTCDate())
    return { sign, cusp: true, other: next };
  return { sign, cusp: false };
}

function reduce(n: number, keepMaster: boolean): number {
  while (n > 9 && !(keepMaster && (n === 11 || n === 22 || n === 33)))
    n = String(n).split("").reduce((a, c) => a + +c, 0);
  return n;
}

/** Pythagorean life path: reduce month, day and year separately, then the sum. */
export function lifePath(b: BirthDate): number {
  return reduce(reduce(b.month, true) + reduce(b.day, true) + reduce(b.year, true), true);
}
