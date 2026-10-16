import { describe, it } from "node:test";
import { expect } from "./expect.js";
import { computeChart as cc2, PLANETS, longitude, angles, resolveBirth, sep, exactTime } from "../src/chart.js";
import { birthChart as bc2, birthChart, transits, compareCharts, exactHits, celebrityMatch } from "../src/chartTools.js";
import { findCity, lookupPlace } from "../src/cities.js";

// Reference: JPL Horizons, apparent geocentric ecliptic longitude of date (quantity 31), fetched 2026-10-16.
const HORIZONS: [string, number[]][] = [
  ["1990-06-01T12:00:00Z", [70.7399637, 174.1105489, 46.3465508, 32.4081899, 0.8795059, 102.9195426, 294.7419442, 278.6795684, 284.0432806, 225.7172848]],
  ["1879-03-14T10:50:00Z", [353.5076639, 254.5258322, 3.1438015, 16.9849261, 296.9141385, 327.4840206, 4.1897343, 151.2883841, 37.8719007, 54.7254747]],
];
const NOW = new Date("2026-10-16T12:00:00Z");

describe("accuracy", () => {
  for (const [iso, ref] of HORIZONS) it(`planets within 0.01° of JPL Horizons at ${iso}`, () => {
    PLANETS.forEach((p, i) => { const d = sep(longitude(p, new Date(iso)), ref[i]); expect(d < 0.01).toBe(true); });
  });
  it("Einstein (Ulm, 1879-03-14 10:50 UT): Asc 11°38' Cancer, MC 12°50' Pisces as on astro.com", () => {
    const { asc, mc } = angles(new Date("1879-03-14T10:50:00Z"), 48.4011, 9.9876);
    expect(sep(asc, 90 + 11 + 38 / 60) < 0.5).toBe(true);
    expect(sep(mc, 330 + 12 + 50 / 60) < 0.5).toBe(true);
  });
});

describe("houses", () => {
  it("Placidus cusps match astrotheme/astro.com for Einstein within 0.05°", async () => {
    const { placidusCusps } = await import("../src/chart.js");
    const ref = [101 + 38 / 60, 118 + 36.6 / 60, 137 + 48 / 60, 162 + 50 / 60, 198 + 19.5 / 60, 243 + 6 / 60];
    const c = placidusCusps(new Date("1879-03-14T10:50:00Z"), 48.4011, 9.9876)!;
    ref.forEach((v, i) => expect(sep(c[i], v) < 0.05).toBe(true));
    expect(placidusCusps(new Date(), 70, 20)).toBe(undefined);
  });
});

describe("time and place", () => {
  it("handles summer time in Amsterdam (CEST = UTC+2)", () => {
    expect(resolveBirth({ birth_date: "1990-06-01", birth_time: "14:00", birth_place: "Amsterdam" }, "", NOW).utc.toISOString()).toBe("1990-06-01T12:00:00.000Z");
  });
  it("handles winter time and the Dutch alias Den Haag", () => {
    expect(resolveBirth({ birth_date: "1975-01-15", birth_time: "14:00", birth_place: "Den Haag, Nederland" }, "", NOW).utc.toISOString()).toBe("1975-01-15T13:00:00.000Z");
  });
  it("NL had no DST in 1975 summer (historical rules)", () => {
    expect(resolveBirth({ birth_date: "1975-07-01", birth_time: "14:00", birth_place: "Utrecht" }, "", NOW).utc.toISOString()).toBe("1975-07-01T13:00:00.000Z");
  });
  it("accepts lat/lon + timezone", () => {
    const r = resolveBirth({ birth_date: "2000-01-01", birth_time: "00:00", latitude: -33.87, longitude: 151.21, timezone: "Australia/Sydney" }, "", NOW);
    expect(r.utc.toISOString()).toBe("1999-12-31T13:00:00.000Z");
  });
  it("finds cities case/accents-insensitive", () => {
    expect(findCity("munchen")?.tz).toBe("Europe/Berlin");
    expect(findCity("Zurich")?.name).toBe("Zürich");
    expect(findCity("ZÜRICH")?.name).toBe("Zürich");
  });
  it("finds small Dutch villages", () => {
    for (const v of ["Ootmarsum", "Giethoorn", "Ootmarsum, Nederland"]) { const c = findCity(v)!; expect(c.country).toBe("NL"); expect(c.tz).toBe("Europe/Amsterdam"); }
    expect(Math.abs(findCity("Giethoorn")!.lat - 52.74) < 0.05).toBe(true);
  });
  it("knows Dutch exonyms", () => {
    expect(findCity("Den Haag")?.name).toBe("The Hague");
    expect(findCity("Den Bosch")?.name).toBe("'s-Hertogenbosch");
    expect(findCity("Keulen")?.name).toBe("Köln");
    expect(findCity("Luik")?.name).toBe("Liège");
    expect(findCity("Cologne")?.name).toBe("Köln");
  });
  it("uses country/region hints and reports ambiguity", () => {
    const r = lookupPlace("Springfield");
    expect("ambiguous" in r).toBe(true);
    expect((r as any).ambiguous.length).toBe(5);
    expect(findCity("Springfield, Illinois")?.tz).toBe("America/Chicago");
    expect(findCity("Hengelo, Gelderland")?.region).toBe("Gelderland");
    expect(() => resolveBirth({ birth_date: "1988-03-14", birth_place: "Springfield" })).toThrow();
  });
  it("unknown place gives a clear error", () => {
    expect("notFound" in lookupPlace("Xyzzyville")).toBe(true);
    try { resolveBirth({ birth_date: "1988-03-14", birth_place: "Xyzzyville" }); } catch (e) { expect((e as Error).message).toContain("unknown place"); }
  });
  it("gives clear errors", () => {
    expect(() => resolveBirth({ birth_date: "14-03-1988" })).toThrow();
    expect(() => resolveBirth({ birth_date: "1988-02-30" })).toThrow();
    expect(() => resolveBirth({ birth_date: "1988-03-14", birth_time: "25:00" })).toThrow();
    expect(() => resolveBirth({ birth_date: "1988-03-14", birth_place: "Xyzzyville" })).toThrow();
    expect(() => resolveBirth({ birth_date: "1988-03-14", latitude: 52 })).toThrow();
    expect(() => resolveBirth({ birth_date: "1988-03-14", latitude: 52, longitude: 4, timezone: "Mars/Olympus" })).toThrow();
  });
});

describe("birth chart", () => {
  it("element balance follows the stated rule (1992-07-21 14:35 Utrecht)", () => {
    const r = birthChart({ birth_date: "1992-07-21", birth_time: "14:35", birth_place: "Utrecht" }, "en", NOW);
    const W = ["fire", "earth", "air", "water"]; const exp: Record<string, number> = { fire: 0, earth: 0, air: 0, water: 0 };
    for (const p of r.data.planets.slice(0, 7)) exp[W[["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"].indexOf(p.sign) % 4]] += p.planet === "sun" || p.planet === "moon" ? 2 : 1;
    const ec = r.data.element_counts as any;
    for (const k of W) expect(ec[k]).toBe(exp[k]);
    const max = Math.max(...W.map((k) => exp[k]));
    expect(ec.strongest).toEqual(W.filter((k) => exp[k] === max));
  });
  it("no ascendant/houses without time+place, Moon flagged when it changes sign", () => {
    const r = birthChart({ birth_date: "1990-06-01" }, "en", NOW);
    expect(r.data.ascendant).toBe(null);
    expect(r.data.moon_sign_uncertain).toBe(true);
    expect(r.text).toContain("how people see you when they first meet you");
  });
  it("whole sign houses, no site link, anonymous image url, footer last", () => {
    const r = birthChart({ birth_date: "1990-06-01", birth_time: "14:00", birth_place: "Amsterdam" }, "nl", NOW);
    expect(r.data.house_system).toBe("placidus");
    expect(r.data.houses!.length).toBe(12);
    expect(/(?<!mcp\.)mystellara\.com/.test(r.text)).toBe(false);
    expect(r.data.chart_image_url).toMatch(/^https:\/\/mcp\.mystellara\.com\/chart\.png\?id=[A-Za-z0-9_-]{22}&lang=nl$/);
    const again = birthChart({ birth_date: "1990-06-01", birth_time: "14:00", birth_place: "Amsterdam" }, "nl", NOW);
    expect(again.data.chart_image_url === r.data.chart_image_url).toBe(false); // random id, not derived from input
    expect(/1990|14%3A00|14:00|Amsterdam|52\.3|4\.9/.test(r.data.chart_image_url)).toBe(false);
    expect(r.svg.startsWith("<svg")).toBe(true);
    expect(r.text.trim().endsWith("Gemaakt door Stellara. Voor zelfreflectie, geen voorspellingen.")).toBe(true);
  });
});

describe("transits and synastry", () => {
  it("finds exact dates that are really exact", () => {
    const t = exactTime("sun", 0, 0, new Date("2026-03-20T00:00:00Z"), 5)!; // March equinox 2026-03-20 14:46 UT
    expect(Math.abs(t.getTime() - Date.parse("2026-03-20T14:46:00Z")) < 10 * 60_000).toBe(true);
  });
  it("week transits list positions and stay reflective", () => {
    const r = transits({ birth_date: "1990-06-01", birth_time: "14:00", birth_place: "Amsterdam", date: "2026-10-15", period: "week" }, "en", NOW);
    expect(r.data.current_planets.length).toBe(10);
    expect(r.data.transits.length > 0).toBe(true);
    expect(r.text).not.toMatch(/mystellara/);
    expect(r.text.trim().endsWith("For self-reflection, not predictions.")).toBe(true);
  });
  it("compares two charts", () => {
    const r = compareCharts({ birth_date: "1990-06-01", birth_time: "14:00", birth_place: "Amsterdam" }, { birth_date: "1988-03-14" }, "en", NOW);
    expect(r.data.inter_aspects.length > 0).toBe(true);
    expect(r.text).not.toMatch(/mystellara/);
    expect(() => compareCharts({ birth_date: "1990-06-01" }, { birth_date: "bad" })).toThrow();
  });
});

describe("transit exact dates (1985-11-03 07:10 Rotterdam)", () => {
  const B = { birth_date: "1985-11-03", birth_time: "07:10", birth_place: "Rotterdam" };
  const natal = (p: string) => birthChart(B, "en", NOW).data.planets.find((x) => x.planet === p)!.longitude;
  it("natal Venus matches JPL Horizons (202.0336°)", () => { expect(Math.abs(natal("venus") - 202.0336) < 0.01).toBe(true); });
  it("Sun conjunct natal Venus is exact 2026-10-15 ~09:00 UT (Horizons: Sun 201.657° on 15 Oct 0h, +0.991°/day)", () => {
    const h = exactHits("sun", natal("venus"), 0, Date.parse("2026-09-15"), Date.parse("2026-11-15"));
    expect(h.length).toBe(1);
    expect(Math.abs(h[0] - Date.parse("2026-10-15T09:05:00Z")) < 3600_000).toBe(true);
  });
  it("retrograde Saturn gives three exact hits to the natal Moon", () => {
    expect(exactHits("saturn", natal("moon"), 90, Date.parse("2026-01-01"), Date.parse("2027-12-31")).length).toBe(3);
  });
  it("week of 16 Oct: Sun–Venus (exact before the period, now >2°) is not listed; statuses are right", () => {
    const r = transits({ ...B, date: "2026-10-16", period: "week" }, "nl", NOW);
    const T = r.data.transits;
    expect(T.some((x) => x.transit === "sun" && x.natal === "venus")).toBe(false);
    const sat = T.find((x) => x.transit === "saturn" && x.natal === "moon" && x.aspect === "square")!;
    expect(sat.status).toBe("separating");
    expect(sat.exact_utc!.slice(0, 10)).toBe("2026-10-09");
    expect(r.text).toContain("Saturnus brengt discipline. Dat schuurt met je gevoel. Het hoogtepunt was op 9 okt, het zwakt nu af.");
    for (const x of T) if (x.status === "exact_in_period") expect(x.exact_utc! >= r.data.window_start_utc && x.exact_utc! < r.data.window_end_utc).toBe(true);
    for (const x of T) if (x.status === "separating") expect(x.exact_utc! < r.data.window_start_utc).toBe(true);
    for (const x of T) if (x.status === "applying") expect(x.exact_utc! >= r.data.window_end_utc).toBe(true);
  });
  it("explains the top 3 in clean sentences, no report mention, in both languages", () => {
    for (const l of ["nl", "en"] as const) {
      const r = transits({ ...B, date: "2026-10-16", period: "week" }, l, NOW);
      expect(r.data.highlights.length).toBe(3);
      expect(r.text).not.toMatch(/mystellara|rapport|report/i);
      expect(r.text).not.toMatch(/ en [a-z]+ en [a-z]+ en | and [a-z]+ and [a-z]+ and /);
    }
    const en = transits({ ...B, date: "2026-10-16", period: "week" }, "en", NOW).text;
    expect(en).toContain("Saturn brings discipline. That pushes against your feelings a little. It peaked on 9 Oct and is fading now.");
  });
  it("today period works", () => {
    const r = transits({ ...B, date: "2026-10-17" }, "en", NOW);
    expect(r.data.period).toBe("today");
  });
});

describe("plain language", () => {
  const JARGON = /\borb|aspect|ascendant|sextiel|sextile|driehoek|trine|vierkant|square|oppositie|opposition|conjunct|°|graden|degrees|retrograde/i;
  const B = { birth_date: "1985-11-03", birth_time: "07:10", birth_place: "Rotterdam" };
  for (const l of ["nl", "en"] as const) it(`chart and transit texts have no jargon and a short reading (${l})`, () => {
    for (const input of [B, { birth_date: "1990-06-01" }, { birth_date: "1992-07-21", birth_time: "14:35", birth_place: "Utrecht" }]) {
      const c = birthChart(input, l, NOW);
      expect(c.text).not.toMatch(JARGON);
      expect(c.text.split("\n\n")[1].split("\n").length <= 6).toBe(true);
    }
    const t = transits({ ...B, date: "2026-10-16", period: "week" }, l, NOW).text;
    expect(t).not.toMatch(JARGON);
    expect(t.split("\n\n")[1].split("\n").length <= 6).toBe(true);
  });
  it("Venus and Mars in the same sign read naturally", () => {
    const c = birthChart(B, "nl", NOW);
    expect(c.text).toContain("In de liefde ben je lief en op zoek naar balans. Als je iets wilt, zoek je de eerlijke weg.");
  });
});

describe("famous people", () => {
  it("has about 1000 people with full dates and sources", async () => {
    const { allCelebrities } = await import("../src/celebrities.js");
    const all = allCelebrities();
    expect(all.length >= 900).toBe(true);
    for (const c of all) { expect(/^\d{4}-\d{2}-\d{2}$/.test(c.birth_date)).toBe(true); expect(c.qid.startsWith("Q")).toBe(true); }
  });
  it("finds by name, handle, alias and typo; lists candidates when ambiguous", async () => {
    const { findCelebrity, searchCelebrity } = await import("../src/celebrities.js");
    expect(findCelebrity("Elon Musk")!.x_handle).toBe("@elonmusk");
    expect(findCelebrity("@ELONMUSK")!.name).toBe("Elon Musk");
    expect(findCelebrity("elon muskk")!.name).toBe("Elon Musk");
    expect(findCelebrity("@POTUS")!.name).toBe("Donald Trump");
    const r = searchCelebrity("Kardashian");
    expect("candidates" in r && r.candidates.length > 1).toBe(true);
    const n = searchCelebrity("Zzyzx Qwerty");
    expect("candidates" in n && n.candidates.length === 0).toBe(true);
  });
  it("Elon Musk match: date-only, score, share text, no private-life claims, no jargon", async () => {
    const { findCelebrity } = await import("../src/celebrities.js");
    const r = celebrityMatch({ birth_date: "1985-11-03", birth_time: "07:10", birth_place: "Rotterdam" }, findCelebrity("Elon Musk")!, "nl", NOW);
    expect(r.data.match_score >= 40 && r.data.match_score <= 98).toBe(true);
    expect(r.text).toContain("We kennen alleen de geboortedatum van Elon Musk");
    expect(r.text).toContain("niet over iemands privéleven");
    expect(r.data.share_page_url).toContain("https://mcp.mystellara.com/s/match?t=");
    expect(r.data.share_url.startsWith("https://x.com/intent/post?text=")).toBe(true);
    expect(r.text.split("\n\n")[1]).not.toMatch(/orb|aspect|sextiel|driehoek|vierkant|oppositie|conjunctie|°/i);
    expect(r.text).not.toMatch(/Jouw (de|het) /);
  });
  it("Obama has a documented birth time", async () => {
    const { findCelebrity } = await import("../src/celebrities.js");
    expect(findCelebrity("Barack Obama")!.time_known).toBe(true);
  });
});

describe("extra points and wording", () => {
it("Einstein mean node/Lilith match references, Chiron present", () => {
  const c = cc2(resolveBirth({ birth_date: "1879-03-14", birth_time: "11:30", birth_place: "Ulm" }));
  const g = (k: string) => c.points.find((p) => p.point === k)!;
  expect(Math.abs(g("north_node").lon - (300 + 1 + 28.85 / 60)) < 0.1).toBe(true);
  expect(Math.abs(g("lilith").lon - (27 + 58 / 60)) < 0.2).toBe(true);
  expect(Math.abs(((g("south_node").lon - g("north_node").lon + 360) % 360) - 180) < 1e-6).toBe(true);
  expect(g("chiron")).toBe(undefined); // table covers 1900–2100
  const ch = cc2(resolveBirth({ birth_date: "1985-11-03", birth_time: "07:10", birth_place: "Rotterdam" })).points.find((p) => p.point === "chiron")!;
  expect(ch.sign).toBe("gemini");
  expect(c.gridAspects.length > 5).toBe(true);
});
it("rising/sun wording distinct, no repeated phrases, points on wheel", () => {
  for (const l of ["nl", "en"] as const) {
    const r = bc2({ birth_date: "1985-11-03", birth_time: "07:10", birth_place: "Rotterdam" }, l);
    const tails = r.text.split("\n\n")[1].split("\n").map((x) => x.split(/[:.,] /).pop()!.trim());
    expect(new Set(tails).size).toBe(tails.length);
    expect(r.svg.includes("☊") && r.svg.includes("⚷")).toBe(true);
  }
});
});

describe("chart image language", () => {
  it("chart_image_url carries lang and the wheel labels follow it", () => {
    const en = bc2(B2, "en"), nl = bc2(B2, "nl");
    expect(String((en as any).data.chart_image_url).includes("lang=en")).toBe(true);
    expect(String((nl as any).data.chart_image_url).includes("lang=nl")).toBe(true);
    expect(en.svg.includes("Birth Chart") && !en.svg.includes("Geboortehoroscoop")).toBe(true);
    expect(nl.svg.includes("Geboortehoroscoop") && !nl.svg.includes("Birth Chart")).toBe(true);
  });
});
const B2 = { birth_date: "1985-11-03", birth_time: "07:10", birth_place: "Rotterdam" };

describe("date-only Moon", () => {
  it("flags the Moon when it changes sign during the local day; card and score skip it", async () => {
    const { matchCardSvg, decodeToken } = await import("../src/share.js");
    const { celebrityMatch } = await import("../src/chartTools.js");
    const { allCelebrities } = await import("../src/celebrities.js");
    const unsure = allCelebrities().find((c) => !c.time_known && cc2(resolveBirth(c.birth)).moonUncertain)!;
    expect(!!unsure).toBe(true);
    const m = celebrityMatch(B2, unsure, "nl").data as any;
    expect(m.inter_aspects.some((x: any) => x.planet_b === "moon")).toBe(false);
    const t = decodeToken(new URL(m.share_page_url).searchParams.get("t")!, "m") as any;
    expect(t.c[1]).toBe(-1);
    expect(t.c[2]).toBe(-1);
    expect(matchCardSvg(t).includes("Maan: onbekend zonder tijd")).toBe(true);
    // no time zone known: the window widens to UTC+14..UTC-12
    expect(cc2(resolveBirth({ birth_date: "1971-06-28" })).moonUncertain).toBe(true);
    expect(cc2(resolveBirth({ birth_date: "1971-06-28", timezone: "Africa/Johannesburg" })).moonUncertain).toBe(false);
  });
});
