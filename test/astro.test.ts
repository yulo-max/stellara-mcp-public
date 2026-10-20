import { describe, it } from "node:test";
import { expect } from "./expect.js";
import { parseBirthDate, sunSign, lifePath } from "../src/astro.js";
import { SIGN_TEXT, LIFE_PATH_TEXT, UI } from "../src/copy.js";

const today = new Date("2026-10-15T00:00:00Z");
const p = (s: string) => parseBirthDate(s, today);

describe("parseBirthDate", () => {
  it("accepts ISO and dd-mm-yyyy", () => {
    expect(p("1988-03-14")).toEqual({ year: 1988, month: 3, day: 14 });
    expect(p("14-03-1988")).toEqual({ year: 1988, month: 3, day: 14 });
  });
  it("rejects nonsense, impossible and future dates", () => {
    expect(() => p("gisteren")).toThrow();
    expect(() => p("2023-02-29")).toThrow();
    expect(() => p("2030-01-01")).toThrow();
    expect(() => p("1850-01-01")).toThrow();
  });
});

describe("sunSign", () => {
  const cases: [string, string, boolean][] = [
    ["1988-03-14", "pisces", false],
    ["1990-01-05", "capricorn", false],
    ["1990-12-31", "capricorn", false],
    ["1990-07-04", "cancer", false],
    ["1990-08-10", "leo", false],
    ["1990-03-21", "aries", true],
    ["1990-03-20", "pisces", true],
    ["1990-12-22", "capricorn", true],
    ["1990-01-19", "capricorn", true],
    ["1990-11-01", "scorpio", false],
  ];
  for (const [d, key, cusp] of cases)
    it(`${d} -> ${key}${cusp ? " (cusp)" : ""}`, () => {
      const r = sunSign(p(d));
      expect(r.sign.key).toBe(key);
      expect(r.cusp).toBe(cusp);
    });
  it("every day of a leap year maps to a sign", () => {
    for (let t = Date.UTC(2000, 0, 1); t < Date.UTC(2001, 0, 1); t += 86400000) {
      const d = new Date(t);
      expect(sunSign({ year: 2000, month: d.getUTCMonth() + 1, day: d.getUTCDate() }).sign).toBeTruthy();
    }
  });
});

describe("lifePath", () => {
  it("reduces month, day, year separately", () => {
    expect(lifePath(p("1988-03-14"))).toBe(7); // 3 + 5 + (1988->26->8) = 16 -> 7
  });
  it("keeps master numbers", () => {
    expect(lifePath(p("2000-02-07"))).toBe(11); // 2 + 7 + 2
    expect(lifePath(p("2000-11-09"))).toBe(22); // 11 + 9 + 2
  });
});

describe("copy", () => {
  it("has text for every sign and life path in both languages, no em-dashes or banned words", () => {
    const all = [...Object.values(SIGN_TEXT), ...Object.values(LIFE_PATH_TEXT), ...Object.values(UI)].flatMap((t) => [t.nl, t.en]);
    expect(Object.keys(SIGN_TEXT)).toHaveLength(12);
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]) expect(LIFE_PATH_TEXT[n]).toBeTruthy();
    for (const s of all) {
      expect(s).not.toMatch(/—/);
      expect(s.toLowerCase()).not.toMatch(/magic|magisch|cosmic|kosmisch|destiny|soulmate|manifest|will happen|gaat gebeuren/);
    }
  });
});
