import { describe, it, before as beforeAll, after as afterAll } from "node:test";
import assert from "node:assert/strict";
import { expect } from "./expect.js";
import type { Server } from "node:http";
import { buildApp, VERSION } from "../src/server.js";
import { christmasStarsKaart, korteLezing, validateName } from "../src/tools.js";
import { CARD, CARD_SIGN_TEXT, CARD_LIFE_PATH_MEANING, LIFE_PATH_TEXT, UI } from "../src/copy.js";

const today = new Date("2026-10-15T00:00:00Z");
const card = (date: string, name?: string, lang: "en" | "nl" = "en") => christmasStarsKaart(date, name, lang, today);
/** Visible text of the SVG (contents of <text> elements). */
const svgText = (svg: string) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join("\n");

// One date per sign, plus cusp days and dates for every life path number (incl. master numbers 11, 22, 33).
const SIGN_DATES = ["1990-04-01", "1990-05-01", "1990-06-01", "1990-07-04", "1990-08-10", "1990-09-01", "1990-10-01", "1990-11-01", "1990-12-01", "1990-12-30", "1990-02-01", "1990-03-01"];
// life path 1, 2, 3 … 9, 11, 22, 33
const LP_DATES = ["1990-01-08", "1988-01-11", "1990-01-01", "1990-01-02", "1990-01-03", "1990-01-04", "1990-01-05", "1990-01-06", "1990-01-07", "2000-02-07", "2000-11-09", "1901-11-11"];
const CUSP_DATES = ["1990-03-21", "1990-03-20", "1990-12-22"];
const ALL_DATES = [...SIGN_DATES, ...LP_DATES, ...CUSP_DATES];

// Second-person words that must not appear on the card.
const YOU_EN = /\b(you|your|yours|yourself)\b/i;
const YOU_NL = /\b(je|jij|jou|jouw|jezelf|u|uw)\b/i;

describe("card: third person", () => {
  it("covers every sign and every life path number in the test dates", () => {
    expect(new Set(SIGN_DATES.map((d) => card(d).data.sun_sign_key)).size).toBe(12);
    expect([...new Set(LP_DATES.map((d) => card(d).data.life_path_number))].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]);
  });

  it("uses the recipient's name: 'Anna takes…' / 'Anna neemt…'", () => {
    const en = card("1990-12-30", "Anna", "en");
    expect(en.text).toContain("Anna takes responsibility, keeps going");
    expect(en.text).toContain("Anna has life path");
    const nl = card("1990-12-30", "Anna", "nl");
    expect(nl.text).toContain("Anna neemt verantwoordelijkheid, zet door");
    expect(nl.text).toContain("Anna heeft levenspad");
    expect(card("1990-07-04", "Anna", "en").text).toContain("Anna is protective and sensitive");
    expect(card("1990-07-04", "Anna", "nl").text).toContain("Anna is beschermend en gevoelig");
  });

  it("is neutral third person without a name", () => {
    const en = card("1990-12-30", undefined, "en");
    expect(en.text).toContain("Someone born under Capricorn takes responsibility");
    expect(en.text).toContain("Life path 7 stands for");
    const nl = card("1990-12-30", "   ", "nl");
    expect(nl.text).toContain("Wie onder Steenbok geboren is, neemt verantwoordelijkheid");
    expect(nl.text).toContain("Levenspad 7 staat in de numerologie voor");
    expect(nl.data.recipient_name).toBe(null);
  });

  it("uses the name on cusp days, and a neutral subject without one", () => {
    expect(card("1990-03-21", "Anna", "en").text).toContain("Whether Anna is Aries or Pisces depends on the birth time");
    expect(card("1990-03-21", "Anna", "nl").text).toContain("Of Anna Ram of Vissen is, hangt af van de geboortetijd");
    expect(card("1990-03-21", undefined, "en").text).toContain("Whether someone born on it is Aries or Pisces");
    expect(card("1990-03-21", undefined, "nl").text).toContain("Of iemand die dan geboren is Ram of Vissen is");
  });

  it("names master numbers as such", () => {
    expect(card("2000-02-07", "Anna", "en").text).toContain("Anna has life path 11, a master number");
    expect(card("2000-11-09", undefined, "nl").text).toContain("Levenspad 22 is een meestergetal");
  });

  it("has no second person anywhere on the card (text and SVG), both languages, with and without name", () => {
    for (const d of ALL_DATES) for (const name of ["Anna", undefined]) {
      const en = card(d, name, "en");
      for (const s of [en.text, en.data.card_text, svgText(en.svg)]) assert.doesNotMatch(s, YOU_EN, `${d} ${name} en: ${s}`);
      const nl = card(d, name, "nl");
      for (const s of [nl.text, nl.data.card_text, svgText(nl.svg)]) assert.doesNotMatch(s, YOU_NL, `${d} ${name} nl: ${s}`);
    }
  });

  it("shows the third-person text in the SVG too", () => {
    const en = svgText(card("1990-12-30", "Anna", "en").svg).replace(/\n/g, " ");
    expect(en).toContain("Anna takes responsibility");
    const nl = svgText(card("1990-12-30", undefined, "nl").svg).replace(/\n/g, " ");
    expect(nl).toContain("Wie onder Steenbok geboren is, neemt");
  });

  it("card copy: every sentence template starts with the subject, no banned words, no predictions", () => {
    for (const t of Object.values(CARD_SIGN_TEXT)) for (const s of [t.en, t.nl]) expect(s).toContain(". {wie} ");
    const all = [...Object.values(CARD_SIGN_TEXT), ...Object.values(CARD_LIFE_PATH_MEANING), ...Object.values(CARD)].flatMap((t) => [t.nl, t.en]);
    expect(Object.keys(CARD_SIGN_TEXT)).toHaveLength(12);
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]) expect(CARD_LIFE_PATH_MEANING[n]).toBeTruthy();
    for (const s of all) {
      expect(s).not.toMatch(/—/);
      expect(s.toLowerCase()).not.toMatch(/magic|magisch|cosmic|kosmisch|destiny|soulmate|manifest|will happen|gaat gebeuren|zal |will /);
    }
  });

  it("get_sun_sign_reading with voice second_person keeps the 'you' copy", () => {
    expect(korteLezing("1990-12-30", "en", today, "second_person").text).toContain("With this sun you take responsibility");
    expect(korteLezing("1990-12-30", "nl", today, "second_person").text).toContain("Met deze zon neem je verantwoordelijkheid");
    expect(korteLezing("1990-03-21", "en", today, "second_person").text).toContain("Whether you are Aries or Pisces");
  });

  it("get_sun_sign_reading is third person by default: no 'you are', for all signs, life paths and cusp days", () => {
    expect(korteLezing("1990-12-30", "en", today).text).toContain("Someone born under Capricorn takes responsibility");
    expect(korteLezing("1990-12-30", "nl", today).text).toContain("Wie onder Steenbok geboren is, neemt verantwoordelijkheid");
    expect(korteLezing("1990-03-21", "en", today).text).toContain("Whether someone born on it is Aries or Pisces");
    expect(korteLezing("2000-02-07", "en", today).text).toContain("Life path 11 is a master number");
    for (const d of ALL_DATES) {
      const en = korteLezing(d, "en", today), nl = korteLezing(d, "nl", today, "third_person");
      for (const t of [en.text, en.data.reading]) expect(t).not.toMatch(/\byou(r|rs|rself)?\b|\byou're\b/i);
      for (const t of [nl.text, nl.data.reading]) expect(t).not.toMatch(/\b(je|jij|jou|jouw|u|uw)\b/i);
    }
  });
});

describe("Dutch: no English leftovers", () => {
  // English words that showed up (or could show up) in NL output. Brand name STELLARA is allowed.
  const ENGLISH = /\b(life path|christmas|stars?|sun in|for|with|and|the|you|your|card|happy|holidays|merry|made by|not predictions)\b/i;

  it("card says 'Levenspad', not 'Life path', in text and SVG", () => {
    const r = card("1990-12-30", "Anna", "nl");
    expect(r.text).toContain("Zon in Steenbok. Levenspad 7.");
    expect(r.svg).toContain("ZON IN STEENBOK · LEVENSPAD 7");
    expect(r.svg).toContain("CHRISTMAS STARS");
    expect(r.svg).not.toContain("LIFE PATH");
    expect(r.svg).not.toContain("CHRISTMAS STARS ·");
    expect(r.text).not.toContain("Life path");
  });

  it("reading says 'Levenspad' in the header line and the life path text", () => {
    const r = korteLezing("1988-03-14", "nl", today);
    expect(r.text).toContain("Zon in Vissen. Levenspad 7.");
    expect(r.text).toContain("Levenspad 7 staat in de numerologie voor");
    expect(korteLezing("1988-03-14", "nl", today, "second_person").text).toContain("Levenspad 7 staat voor");
    expect(r.text).not.toContain("Life path");
    for (const t of Object.values(LIFE_PATH_TEXT)) expect(t.nl.startsWith("Levenspad ")).toBe(true);
  });

  it("no English words in any NL card or reading (text, SVG, JSON), for all signs, life paths and cusp days", () => {
    for (const d of ALL_DATES) {
      for (const name of ["Anna", undefined]) {
        const c = card(d, name, "nl");
        const visible = svgText(c.svg).replace(/STELLARA/g, "");
        for (const s of [c.text, visible, JSON.stringify(c.data).replace(/"[a-z_]+":/g, "").replace(/Stellara|Christmas Stars|CHRISTMAS STARS/g, "")]) assert.doesNotMatch(s.replace(/Stellara|Christmas Stars|CHRISTMAS STARS/g, ""), ENGLISH, `${d} ${name}: ${s}`);
      }
      for (const r of [korteLezing(d, "nl", today), korteLezing(d, "nl", today, "second_person")]) for (const s of [r.text, JSON.stringify(r.data).replace(/"[a-z_]+":/g, "")]) assert.doesNotMatch(s.replace(/Stellara|Christmas Stars|CHRISTMAS STARS/g, ""), ENGLISH, `${d}: ${s}`);
    }
  });

  it("all NL UI strings (labels, disclaimer, errors) are Dutch", () => {
    for (const t of Object.values(UI)) assert.doesNotMatch(t.nl.replace(/Stellara|Christmas Stars|CHRISTMAS STARS/g, ""), ENGLISH, t.nl);
    for (const t of Object.values(CARD)) assert.doesNotMatch(t.nl.replace(/Christmas Stars/g, ""), ENGLISH, t.nl);
  });

  it("date errors are bilingual (NL / EN)", () => {
    for (const bad of ["gisteren", "2023-02-29", "1850-01-01"]) {
      assert.throws(() => card(bad, undefined, "nl"), (e: Error) => / \/ /.test(e.message) && /datum|formaat|JJJJ/i.test(e.message) && /date|YYYY/i.test(e.message));
    }
  });
});

describe("recipient_name validation and escaping", () => {
  it("accepts letters, combining marks, spaces, hyphens and both apostrophes", () => {
    for (const ok of ["Anna", "José", "Zoë", "Anne-Marie", "O'Brien", "D’Angelo", "Jan Willem", "Ἀλέξανδρος", "Łukasz", "مريم", "李小龍", "a".repeat(40)]) expect(validateName(ok)).toBe(ok);
  });

  it("trims, and treats empty or whitespace as no name", () => {
    expect(validateName("  Anna  ")).toBe("Anna");
    expect(validateName("")).toBe(undefined);
    expect(validateName("   ")).toBe(undefined);
    expect(validateName(undefined)).toBe(undefined);
    expect(validateName(` ${"b".repeat(40)} `)).toBe("b".repeat(40));
  });

  it("rejects anything else with a bilingual message", () => {
    const bad = ["Anna1", "<script>x</script>", "Anna & Bob", "a\nb", "tab\there", "😀", "Anna!", "x@y", '"Anna"', "Anna;", "---", "'", "a".repeat(41), "Zoë".repeat(14)];
    for (const b of bad) assert.throws(() => validateName(b), (e: Error) => e.message === `${UI.badName.nl} / ${UI.badName.en}`, JSON.stringify(b));
    expect(UI.badName.nl).toContain("maximaal 40 tekens");
    expect(UI.badName.en).toContain("max 40 characters");
  });

  it("HTML-escapes the name in card_text and the JSON output, XML-escapes it in the SVG", () => {
    const r = card("1990-12-30", "O'Brien", "en");
    expect(r.text).toContain("For O&#39;Brien");
    expect(r.text).toContain("O&#39;Brien takes responsibility");
    expect(r.text).not.toContain("O'Brien");
    expect(r.data.card_text).toBe(r.text);
    expect(r.data.recipient_name).toBe("O&#39;Brien");
    expect(JSON.stringify(r.data)).not.toContain("O'Brien");
    expect(r.svg).toContain("For O&apos;Brien");
    expect(r.svg).not.toContain("O&amp;");
    expect(r.svg).not.toContain("O'Brien");
    // the curly apostrophe is not an HTML special char and stays as is
    expect(card("1990-12-30", "D’Angelo", "nl").data.recipient_name).toBe("D’Angelo");
  });
});

describe("over MCP", () => {
  let srv: Server; let base = "";
  beforeAll(async () => {
    srv = buildApp({ rateLimitPerMinute: 100 }).listen(0);
    await new Promise((r) => srv.once("listening", r));
    base = `http://127.0.0.1:${(srv.address() as { port: number }).port}`;
  });
  afterAll(() => srv.close());
  const rpc = async (method: string, params: unknown) => (await fetch(`${base}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  })).json();
  const call = (args: Record<string, unknown>) => rpc("tools/call", { name: "create_christmas_star_card", arguments: { birth_date: "1990-12-30", ...args } });

  it("reports version 0.6.3", async () => {
    expect(VERSION).toBe("0.6.3");
    expect((await (await fetch(`${base}/health`)).json()).version).toBe("0.6.3");
  });

  it("inputSchema caps recipient_name at 40 characters and describes the rules", async () => {
    const j = await rpc("tools/list", {});
    const t = j.result.tools.find((x: { name: string }) => x.name === "create_christmas_star_card");
    expect(t.inputSchema.properties.recipient_name.maxLength).toBe(40);
    expect(t.inputSchema.properties.recipient_name.description).toContain("max 40 characters");
    expect(t.description).toContain("third person");
  });

  it("returns isError with a bilingual message for an invalid name", async () => {
    for (const recipient_name of ["<b>Anna</b>", "Anna1", "😀"]) {
      const j = await call({ recipient_name });
      expect(j.result.isError).toBe(true);
      expect(j.result.content[0].text).toContain(UI.badName.nl);
      expect(j.result.content[0].text).toContain(UI.badName.en);
    }
  });

  it("returns isError with a bilingual message for a name over 40 characters", async () => {
    const j = await call({ recipient_name: "a".repeat(41) });
    const text = j.result?.content?.[0]?.text ?? j.error?.message ?? "";
    expect(j.result?.isError ?? !!j.error).toBe(true);
    expect(text).toContain(UI.badName.nl);
    expect(text).toContain(UI.badName.en);
  });

  it("third person, Dutch labels and escaped name in all outputs", async () => {
    const j = await call({ recipient_name: " O'Brien ", language: "nl" });
    const r = j.result;
    expect(r.isError).toBe(undefined);
    expect(r.structuredContent.recipient_name).toBe("O&#39;Brien");
    expect(r.structuredContent.card_text).toContain("O&#39;Brien neemt verantwoordelijkheid");
    expect(r.content[0].text).toContain("Levenspad 7");
    expect(r.content[2].text).not.toContain("O'Brien");
    const img = r.content.find((c: { type: string }) => c.type === "image");
    expect(img.mimeType).toBe("image/png");
    // The image block is a PNG (hosts reject SVG), so check the escaped name in the SVG it is rendered from.
    const svg = card("1990-12-30", " O'Brien ", "nl").svg;
    expect(svg).toContain("Voor O&apos;Brien");
    expect(svg).toContain("LEVENSPAD 7");
  });

  it("whitespace-only name gives a card without a name", async () => {
    const j = await call({ recipient_name: "   " });
    expect(j.result.structuredContent.recipient_name).toBe(null);
    expect(j.result.structuredContent.card_text).toContain("Someone born under Capricorn");
  });
});
