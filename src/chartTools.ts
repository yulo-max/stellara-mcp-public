import type { Lang } from "./astro.js";
import { UI, fill } from "./copy.js";
import { PLANET_NAME, PLANET_THEME, SIGN_STYLE, ASPECT_NAME, ASPECT_MEANING, ELEMENT, SIGN_ELEMENT, CU, PLANET_NOUN, TRANSIT_INFLUENCE, TRANSIT_VERB, NATAL_NOUN, POINT_NAME, TR } from "./chartCopy.js";
import {
  PLANETS, type Planet, type BirthInput, resolveBirth, computeChart, ZODIAC, signOf, round, position, aspectBetween,
  exactTime, InputError, sep, longitude, speed, type Resolved,
} from "./chart.js";
import { DateTime } from "luxon";
import { GAZETTEER_ATTRIBUTION } from "./cities.js";
import { shareLinks, signIndex } from "./share.js";
import { MOON_WORDS, RISING_WORDS, LOVE_WORDS, DRIVE_WORDS, CELEB, EL_NAME, BARE_NOUN, LINK_VERB, TRAITS, ELEMENT_SIMPLE, S, PLANET_PLAIN, INFLUENCE_PLAIN, CONTACT, NOUN_PLAIN } from "./simpleCopy.js";
import { chartWheelSvg } from "./wheel.js";
import { chartToData } from "./chartToken.js";
import { putChart } from "./chartStore.js";
import { allCelebrities, type Celebrity } from "./celebrities.js";
import { norm } from "./cities.js";

export const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL ?? "https://mcp.mystellara.com").replace(/\/$/, "");
/** Image link for the wheel: only a random server-side id (chartStore.ts) and the language. */
export function chartImageUrl(id: string, l: Lang) {
  return `${PUBLIC_BASE_URL}/chart.png?${new URLSearchParams({ id, lang: l }).toString()}`;
}
export function birthChartSvg(input: BirthInput, l: Lang = "en") { return birthChart(input, l).svg; }

const signName = (key: string, l: Lang) => { const s = ZODIAC.find((z) => z.key === key)!; return l === "nl" ? s.nl : s.en; };
const pn = (p: string, l: Lang) => PLANET_NAME[p][l];
/** 14.53 -> 14°32' */
export const dm = (deg: number) => { let d = Math.floor(deg), m = Math.round((deg - d) * 60); if (m === 60) { d += 1; m = 0; } return `${d}°${String(m).padStart(2, "0")}'`; };
const fmtLon = (lon: number, l: Lang) => `${dm(lon % 30)} ${signName(signOf(lon).key, l)}`;

function placeData(r: Resolved) {
  return r.place ? { name: r.place.name, latitude: round(r.place.lat, 4), longitude: round(r.place.lon, 4), timezone: r.place.tz, source: r.place.fromGazetteer ? GAZETTEER_ATTRIBUTION : "user coordinates" } : null;
}

export function birthChart(input: BirthInput, l: Lang = "en", now = new Date()) {
  const r = resolveBirth(input, "", now);
  const c = computeChart(r);
  const lines: string[] = [];
  const posLines = c.positions.map((p) => {
    let s = `${pn(p.planet, l)}: ${fmtLon(p.lon, l)}${p.retrograde ? " R" : ""}`;
    if (c.planetHouse) s += `, ${l === "nl" ? "huis" : "house"} ${c.planetHouse[p.planet]}`;
    if (p.planet === "moon" && c.moonUncertain) s += " (?)";
    return s;
  });
  lines.push(`${CU.positionsHead[l]}:\n${posLines.join("\n")}`);
  const notes = [...r.notes];
  if (r.place?.fromGazetteer) notes.push(GAZETTEER_ATTRIBUTION);
  if (!r.timeKnown) notes.push(CU.noTime[l]);
  if (c.moonUncertain && c.moonOptions) notes.push(fill(CU.moonUncertain[l], { a: signName(c.moonOptions[0], l), b: signName(c.moonOptions[1], l) }));
  if (c.asc !== undefined) lines.push(fill(CU.asc[l], { deg: dm(c.asc % 30), sign: signName(signOf(c.asc).key, l), mc: dm(c.mc! % 30), mcsign: signName(signOf(c.mc!).key, l) }));
  else notes.push(CU.noAsc[l]);
  const top = c.aspects.slice(0, 10);
  if (top.length) lines.push(`${CU.aspectsHead[l]}:\n${top.map((a) => `${pn(a.a, l)} ${ASPECT_NAME[a.type][l]} ${pn(a.b, l)} (${dm(a.orb)})`).join("\n")}`);
  // Interpretation: Sun, Moon (if certain), Ascendant, element balance, closest aspect.
  const pos = Object.fromEntries(c.positions.map((p) => [p.planet, p]));
  const reading: string[] = [];
  for (const p of ["sun", "moon", "mercury", "venus", "mars"] as Planet[]) {
    if (p === "moon" && c.moonUncertain) continue;
    reading.push(`${pn(p, l)} ${l === "nl" ? "in" : "in"} ${signName(pos[p].sign, l)}. ${PLANET_THEME[p][l]} ${SIGN_STYLE[pos[p].sign][l]}.`);
  }
  if (c.asc !== undefined) { const k = signOf(c.asc).key; reading.push(fill(CU.ascLine[l], { sign: signName(k, l), style: SIGN_STYLE[k][l] })); }
  const count: Record<string, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  for (const p of c.positions.slice(0, 7)) count[SIGN_ELEMENT[ZODIAC.findIndex((z) => z.key === p.sign) % 4]] += p.planet === "sun" || p.planet === "moon" ? 2 : 1;
  // Transparent rule: Sun..Saturn (outer planets are generational), Sun and Moon weigh 2. Ties are all named.
  const max = Math.max(...Object.values(count));
  const strongest = Object.keys(count).filter((k) => count[k] === max);
  reading.push(fill(CU.elementLine[l], { el: strongest.map((k) => ELEMENT[k][l]).join(CU.and[l]) }));
  const firstAsp = c.aspects.find((a) => PLANETS.indexOf(a.b) <= 6);
  if (firstAsp) reading.push(fill(CU.aspectLine[l], { a: pn(firstAsp.a, l), asp: ASPECT_NAME[firstAsp.type][l], b: pn(firstAsp.b, l), meaning: ASPECT_MEANING[firstAsp.type][l] }));
  // Plain-language reading (no jargon); the technical lines above stay available in structured data.
  const simple: string[] = [];
  const tr = (k: string) => TRAITS[k][l];
  simple.push(fill(S.sun[l], { sign: signName(pos.sun.sign, l), traits: tr(pos.sun.sign) }));
  if (c.moonUncertain && c.moonOptions) simple.push(fill(S.moonUnsure[l], { a: signName(c.moonOptions[0], l), b: signName(c.moonOptions[1], l) }));
  else simple.push(fill(S.moon[l], { sign: signName(pos.moon.sign, l), traits: MOON_WORDS[pos.moon.sign][l] }));
  if (c.asc !== undefined) { const k = signOf(c.asc).key; simple.push(fill(S.rising[l], { sign: signName(k, l), traits: RISING_WORDS[k][l] })); }
  simple.push(fill(S.loveDrive[l], { venus: LOVE_WORDS[pos.venus.sign][l], mars: DRIVE_WORDS[pos.mars.sign][l] }));
  simple.push(ELEMENT_SIMPLE[strongest[0]][l]);
  if (c.asc === undefined) simple.push(S.noRising[l]);
  const imageUrl = chartImageUrl(putChart(chartToData(c, r.timeKnown, !!r.place?.fromGazetteer)), l);
  const share = shareLinks({ k: "c", l, t: [signIndex(c.positions[0].sign), c.moonUncertain ? -1 : signIndex(c.positions[1].sign), c.asc !== undefined ? signIndex(signOf(c.asc).key) : -1], p: c.positions.map((p) => Math.floor(((p.lon % 360) + 360) % 360) % 360) });
  const text = [
    CU.title[l] + (r.place ? `, ${r.place.name}` : ""),
    simple.join("\n"),
    [fill(S.imageNote[l], { url: imageUrl }), fill(CELEB.share[l], { url: share.share_url }), r.place?.fromGazetteer ? GAZETTEER_ATTRIBUTION : ""].filter(Boolean).join("\n"),
    UI.footer[l],
  ].join("\n\n");
  const nlL = l === "nl";
  const meta = {
    lang: l,
    title: `${nlL ? "Geboortehoroscoop" : "Birth Chart"}`,
    lines: [
      nlL ? "Plaats:" : "Location:",
      r.place ? r.place.name : (nlL ? "onbekend" : "unknown"),
      ...(r.place ? [`${nlL ? "Breedte" : "Latitude"}: ${r.place.lat.toFixed(4)}`, `${nlL ? "Lengte" : "Longitude"}: ${r.place.lon.toFixed(4)}`] : []),
      `${input.birth_date}${r.timeKnown ? ` ${input.birth_time} [${r.utcOffset}]` : nlL ? " (geen tijd)" : " (no time)"}`,
    ],
    footer: [
      nlL ? "Dierenriem: tropisch" : "Zodiac: Tropical",
      c.houseSystem ? `${nlL ? "Huizen" : "Houses"}: ${c.houseSystem === "placidus" ? "Placidus" : "Whole Sign"}` : (nlL ? "Huizen: alleen met tijd en plaats" : "Houses: need time and place"),
      ...(r.place?.fromGazetteer ? [GAZETTEER_ATTRIBUTION] : []),
    ],
  } as const;
  const svg = chartWheelSvg(c, { ...meta, lines: [...meta.lines], footer: [...meta.footer] });
  const data = {
    utc_time: r.utc.toISOString(), time_known: r.timeKnown, place: placeData(r),
    house_system: c.houseSystem ?? null,
    planets: c.positions.map((p) => ({ planet: p.planet, sign: p.sign, degree_in_sign: p.degree, longitude: p.lon, retrograde: p.retrograde, house: c.planetHouse?.[p.planet] ?? null, uncertain: p.planet === "moon" && c.moonUncertain })),
    points: c.points.map((p) => ({ point: p.point, sign: p.sign, degree_in_sign: p.degree, longitude: p.lon, retrograde: p.retrograde, method: p.point === "chiron" ? "JPL Horizons table" : "mean (Meeus)" })),
    grid_aspects: c.gridAspects,
    moon_sign_uncertain: c.moonUncertain, moon_sign_options: c.moonOptions ?? null,
    ascendant: c.asc !== undefined ? { sign: signOf(c.asc).key, degree_in_sign: round(c.asc % 30), longitude: round(c.asc, 3) } : null,
    midheaven: c.mc !== undefined ? { sign: signOf(c.mc).key, degree_in_sign: round(c.mc % 30), longitude: round(c.mc, 3) } : null,
    houses: c.houses ?? null,
    aspects: c.aspects.map((a) => ({ planet_a: a.a, planet_b: a.b, aspect: a.type, orb: a.orb })),
    element_counts: { rule: "Sun to Saturn, Sun and Moon count 2", ...count, strongest },
    notes, interpretation: simple.join(" "), technical_interpretation: reading.join(" "), chart_image_url: imageUrl, disclaimer: UI.footer[l],
    ...share,
  };
  return { text, data, svg };
}

const TRANSIT_ORB: Record<string, number> = { sun: 2, mercury: 2, venus: 2, mars: 2, jupiter: 1.5, saturn: 1.5, uranus: 1.5, neptune: 1.5, pluto: 1.5 };
const FAST = new Set(["sun", "mercury", "venus", "mars"]);
const ASPECT_ANGLES: [string, number][] = [["conjunction", 0], ["sextile", 60], ["square", 90], ["trine", 120], ["opposition", 180]];
const norm180 = (x: number) => ((x % 360) + 540) % 360 - 180;

/**
 * All exact moments (UTC ms) when transiting planet t makes `angle` to fixedLon between from..to.
 * Uses signed differences for both sides of the aspect (±angle), so retrograde loops give several hits.
 */
export function exactHits(t: Planet, fixedLon: number, angle: number, from: number, to: number): number[] {
  const step = (FAST.has(t) ? 6 : 24) * 3600_000;
  const targets = angle === 0 || angle === 180 ? [fixedLon + angle] : [fixedLon + angle, fixedLon - angle];
  const hits: number[] = [];
  for (const target of targets) {
    const g = (ms: number) => norm180(longitude(t, new Date(ms)) - target);
    let pm = from, pv = g(pm);
    for (let ms = from + step; ms <= to + step; ms += step) {
      const v = g(ms);
      if (Math.sign(v) !== Math.sign(pv) && Math.abs(v - pv) < 90) { // real crossing, not the ±180 wrap
        let lo = pm, hi = ms, lv = pv;
        for (let i = 0; i < 50 && hi - lo > 30_000; i++) { const mid = (lo + hi) / 2, mv = g(mid); if (Math.sign(mv) === Math.sign(lv)) { lo = mid; lv = mv; } else hi = mid; }
        const hit = (lo + hi) / 2; if (hit >= from && hit <= to) hits.push(hit);
      }
      pm = ms; pv = v;
    }
  }
  return hits.sort((x, y) => x - y);
}

export interface TransitHit {
  transit: Planet; natal: string; aspect: string; orb: number; status: "exact_in_period" | "separating" | "applying" | "near";
  exact_utc: string | null; exact_dates_utc: string[];
}

export function transits(input: BirthInput & { date?: string; period?: "today" | "week" }, l: Lang = "en", now = new Date()) {
  const r = resolveBirth(input, "", now);
  const natal = computeChart(r);
  let start: DateTime;
  if (input.date) {
    start = DateTime.fromISO(input.date.trim(), { zone: "UTC" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date.trim()) || !start.isValid) throw new InputError("date must be YYYY-MM-DD, for example 2026-10-16.");
    if (start.year < 1900 || start.year > 2100) throw new InputError("date must be between 1900 and 2100.");
  } else start = DateTime.fromJSDate(now, { zone: "UTC" }).startOf("day");
  const period = input.period ?? "today";
  const days = period === "week" ? 7 : 1;
  const winStart = start.toJSDate(), winEnd = start.plus({ days }).toJSDate();
  const ref = new Date((winStart.getTime() + winEnd.getTime()) / 2);
  const now_ = PLANETS.map((p) => position(p, ref));
  const targets: { key: string; lon: number }[] = natal.positions.filter((p) => r.timeKnown || p.planet !== "moon").map((p) => ({ key: p.planet, lon: p.lon }));
  if (natal.asc !== undefined) targets.push({ key: "asc", lon: natal.asc }, { key: "mc", lon: natal.mc! });
  const found: TransitHit[] = [];
  const ws = winStart.getTime(), we = winEnd.getTime();
  for (const t of PLANETS) {
    if (t === "moon") continue; // too fast to be meaningful as a transit here
    const span = (FAST.has(t) ? 30 : 200) * 86400_000;
    const tl = longitude(t, ref);
    for (const n of targets) for (const [key, angle] of ASPECT_ANGLES) {
      const orb = Math.abs(sep(tl, n.lon) - angle);
      // Only candidates that are in orb now or can reach exact inside the period need a hit search.
      if (orb > TRANSIT_ORB[t] && orb > Math.abs(speed(t, ref)) * days / 2 + 0.5) continue;
      const hits = exactHits(t, n.lon, angle, ws - span, we + span);
      const inWin = hits.filter((h) => h >= ws && h < we);
      if (!inWin.length && orb > TRANSIT_ORB[t]) continue;
      let status: TransitHit["status"] = "near"; let exact: number | undefined;
      if (inWin.length) { status = "exact_in_period"; exact = inWin[0]; }
      else if (hits.length) {
        exact = hits.reduce((b, h) => (Math.abs(h - ref.getTime()) < Math.abs(b - ref.getTime()) ? h : b));
        status = exact < ws ? "separating" : "applying";
      }
      found.push({ transit: t, natal: n.key, aspect: key, orb: round(orb), status, exact_utc: exact ? new Date(exact).toISOString() : null, exact_dates_utc: hits.map((h) => new Date(h).toISOString()) });
    }
  }
  found.sort((x, y) => x.orb - y.orb);
  const PERSONAL_POINTS = new Set(["sun", "moon", "mercury", "venus", "mars", "asc", "mc"]);
  const weight = (f: TransitHit) => f.orb - (FAST.has(f.transit) ? 0 : 1) - (PERSONAL_POINTS.has(f.natal) ? 0.5 : 0) - (f.status === "exact_in_period" ? 0.5 : 0);
  const top = [...found].sort((x, y) => weight(x) - weight(y)).slice(0, 3);
  const date = (iso: string) => DateTime.fromISO(iso, { zone: "UTC" }).setLocale(l === "nl" ? "nl" : "en-GB").toFormat("d LLL").replace(".", "");
  const statusText = (f: TransitHit) =>
    f.status === "exact_in_period" ? fill(TR.inWindow[l], { date: date(f.exact_utc!) })
    : f.status === "separating" ? fill(TR.wasExact[l], { date: date(f.exact_utc!) })
    : f.status === "applying" ? fill(TR.willBeExact[l], { date: date(f.exact_utc!) })
    : TR.close[l];
  const nName = (k: string) => POINT_NAME[k]?.[l] ?? pn(k, l);
  const periodLabel = period === "week"
    ? `${start.toISODate()}${l === "nl" ? " t/m " : " to "}${start.plus({ days: 6 }).toISODate()}`
    : start.toISODate()!;
  const lines: string[] = [period === "week"
    ? fill(S.headWeek[l], { from: date(winStart.toISOString()), to: date(new Date(winEnd.getTime() - 1).toISOString()) })
    : fill(S.headToday[l], { date: date(winStart.toISOString()) })];
  const timing = (f: TransitHit) =>
    f.status === "exact_in_period" ? fill(S.tInWindow[l], { date: date(f.exact_utc!) })
    : f.status === "separating" ? fill(S.tSeparating[l], { date: date(f.exact_utc!) })
    : f.status === "applying" ? fill(S.tApplying[l], { date: date(f.exact_utc!) })
    : S.tNear[l];
  if (top.length) {
    const kind = (a: string) => (a === "conjunction" ? "strong" : a === "square" || a === "opposition" ? "tense" : "easy");
    lines.push(top.map((f) => [
      fill(S.brings[l], { planet: PLANET_PLAIN[f.transit][l], influence: INFLUENCE_PLAIN[f.transit][l] }),
      fill(CONTACT[kind(f.aspect)][l], { noun: NOUN_PLAIN[f.natal][l] }),
      timing(f),
    ].join(" ")).join("\n"));
    lines.push(S.reflect[l]);
  } else lines.push(S.quiet[l]);
  void statusText; void nName;
  const notes = [...r.notes];
  if (!r.timeKnown) notes.push(CU.noTime[l]);
  lines.push(UI.footer[l]);
  return {
    text: lines.join("\n\n"),
    data: {
      period, window_start_utc: winStart.toISOString(), window_end_utc: winEnd.toISOString(), reference_utc: ref.toISOString(),
      current_planets: now_.map((p) => ({ planet: p.planet, sign: p.sign, degree_in_sign: p.degree, longitude: p.lon, retrograde: p.retrograde })),
      transit_list_text: found.slice(0, 12).map((f) => `${pn(f.transit, l)} ${ASPECT_NAME[f.aspect][l]} ${nName(f.natal)} (${dm(f.orb)}, ${statusText(f)})`), transits: found, highlights: top.map((f) => `${f.transit}-${f.aspect}-${f.natal}`), notes, disclaimer: UI.footer[l],
    },
  };
}

const PERSONAL: Planet[] = ["sun", "moon", "mercury", "venus", "mars"];

export function compareCharts(a: BirthInput, b: BirthInput, l: Lang = "en", now = new Date()) {
  const ra = resolveBirth(a, "person_a", now), rb = resolveBirth(b, "person_b", now);
  const ca = computeChart(ra), cb = computeChart(rb);
  const links: { a: Planet; b: Planet; aspect: string; orb: number }[] = [];
  for (const pa of ca.positions) for (const pb of cb.positions) {
    if (!PERSONAL.includes(pa.planet) && !PERSONAL.includes(pb.planet)) continue; // outer-outer is generational
    if ((pa.planet === "moon" && !ra.timeKnown) || (pb.planet === "moon" && !rb.timeKnown)) continue;
    const asp = aspectBetween(pa.lon, pb.lon, 0.75);
    if (asp) links.push({ a: pa.planet, b: pb.planet, aspect: asp.key, orb: round(asp.orb) });
  }
  // rank: personal-personal first, then orb
  const w = (x: { a: Planet; b: Planet; orb: number }) => x.orb - (PERSONAL.includes(x.a) && PERSONAL.includes(x.b) ? 3 : 0);
  links.sort((x, y) => w(x) - w(y));
  const top = links.slice(0, 12);
  const easy = links.filter((x) => x.aspect === "trine" || x.aspect === "sextile").length;
  const hard = links.filter((x) => x.aspect === "square" || x.aspect === "opposition").length;
  const conj = links.filter((x) => x.aspect === "conjunction").length;
  const sunA = ca.positions[0].sign, sunB = cb.positions[0].sign;
  const lines = [CU.synHead[l], fill(CU.synElements[l], { a: signName(sunA, l), b: signName(sunB, l) })];
  if (top.length) {
    lines.push(`${CU.synList[l]}:\n${top.map((x) => `A ${pn(x.a, l)} ${ASPECT_NAME[x.aspect][l]} B ${pn(x.b, l)} (${dm(x.orb)})`).join("\n")}`);
    lines.push(`${fill(CU.synEasy[l], { n: String(easy), h: String(hard), c: String(conj) })} ${fill(CU.synTop[l], { a: pn(top[0].a, l), asp: ASPECT_NAME[top[0].aspect][l], b: pn(top[0].b, l), meaning: ASPECT_MEANING[top[0].aspect][l] })}`);
  } else lines.push(CU.synNone[l]);
  const notes = [...ra.notes.map((n) => `A: ${n}`), ...rb.notes.map((n) => `B: ${n}`)];
  if (!ra.timeKnown || !rb.timeKnown) notes.push(CU.noTime[l]);
  if (notes.length) lines.push(notes.join(" "));
  lines.push(UI.footer[l]);
  return {
    text: lines.join("\n\n"),
    data: {
      person_a: { sun_sign: sunA, time_known: ra.timeKnown }, person_b: { sun_sign: sunB, time_known: rb.timeKnown },
      inter_aspects: links.map((x) => ({ planet_a: x.a, planet_b: x.b, aspect: x.aspect, orb: x.orb })),
      counts: { flowing: easy, tense: hard, conjunctions: conj }, notes, disclaimer: UI.footer[l],
    },
  };
}

const EL_OF = (sign: string) => SIGN_ELEMENT[ZODIAC.findIndex((z) => z.key === sign) % 4];
/** Playful, plain-language match between a user and a curated public figure. */
function trio(b: BirthInput, now: Date): number[] {
  const r = resolveBirth(b, "", now), c = computeChart(r);
  return [signIndex(c.positions[0].sign), c.moonUncertain ? -1 : signIndex(c.positions[1].sign), c.asc !== undefined ? signIndex(signOf(c.asc).key) : -1];
}
export function celebrityMatch(user: BirthInput, celeb: Celebrity, l: Lang = "en", now = new Date()) {
  const cmp = compareCharts(user, celeb.birth, l, now);
  const links = cmp.data.inter_aspects;
  const W = (x: { planet_a: string; planet_b: string }) => (PERSONAL.includes(x.planet_a as Planet) && PERSONAL.includes(x.planet_b as Planet) ? 2 : 1);
  let sum = 0;
  for (const x of links) sum += W(x) * (x.aspect === "trine" || x.aspect === "sextile" ? 3 : x.aspect === "conjunction" ? 2 : -2);
  const score = Math.max(40, Math.min(98, Math.round(60 + sum)));
  const band = score >= 85 ? 3 : score >= 70 ? 2 : score >= 55 ? 1 : 0;
  const sa = cmp.data.person_a.sun_sign, sb = cmp.data.person_b.sun_sign;
  const ea = EL_OF(sa), eb = EL_OF(sb);
  const good = new Set(["fire-air", "air-fire", "earth-water", "water-earth"]);
  const elLine = ea === eb ? fill(CELEB.sameEl[l], { el: EL_NAME[ea][l] })
    : fill((good.has(`${ea}-${eb}`) ? CELEB.goodEl : CELEB.diffEl)[l], { a: cap(EL_NAME[ea][l]), b: EL_NAME[eb][l] });
  const top = links.find((x) => W(x) === 2) ?? links[0];
  const kind = (a: string) => (a === "conjunction" ? "strong" : a === "square" || a === "opposition" ? "tense" : "easy");
  const lines = [
    fill(CELEB.head[l], { name: celeb.name, score: String(score) }),
    [CELEB.band[l][band], fill(CELEB.suns[l], { a: signName(sa, l), b: signName(sb, l), name: celeb.name }), elLine,
      top ? fill(CELEB.link[l], { a: BARE_NOUN[top.planet_a][l].replace(/^(de|het) /, ""), b: BARE_NOUN[top.planet_b][l], name: celeb.name, verb: LINK_VERB[kind(top.aspect)][l] }) : ""]
      .filter(Boolean).join("\n"),
  ];
  const notes = [CELEB.privacy[l]];
  if (!celeb.time_known) notes.unshift(fill(CELEB.dateOnly[l], { name: celeb.name }));
  if (celeb.birth_date_confidence === "low") notes.unshift(fill(CELEB.lowConf[l], { name: celeb.name }));
  lines.push(notes.join("\n"));
  const share = shareLinks({ k: "m", l, n: celeb.name, s: score, b: band, u: trio(user, now), c: trio(celeb.birth, now) });
  lines.push(fill(CELEB.share[l], { url: share.share_url }));
  lines.push(UI.footer[l]);
  return {
    text: lines.join("\n\n"),
    data: {
      ...cmp.data,
      celebrity: { name: celeb.name, x_handle: celeb.x_handle, wikidata: celeb.qid, birth_date: celeb.birth_date, birth_place: celeb.birth_place, time_known: celeb.time_known, source: celeb.source, accuracy: celeb.accuracy },
      match_score: score, one_liner: CELEB.band[l][band],
      ...share,
    },
  };
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export function listCelebrities(query?: string, limit = 25) {
  const q = query ? norm(query) : "";
  return allCelebrities().filter((c) => !q || norm(`${c.name} ${c.x_handle} ${c.description ?? ""} ${(c.aliases ?? []).join(" ")}`).includes(q))
    .slice(0, limit)
    .map((c) => ({ name: c.name, x_handle: c.x_handle, followers: c.followers, description: c.description ?? null, birth_date: c.birth_date, time_known: c.time_known, wikidata: c.qid }));
}
