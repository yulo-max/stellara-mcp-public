import { describe, it, before as beforeAll, after as afterAll } from "node:test";
import { expect } from "./expect.js";
import type { Server } from "node:http";
import { buildApp } from "../src/server.js";
import { birthChart } from "../src/chartTools.js";
import { christmasStarsKaart, korteLezing } from "../src/tools.js";

let srv: Server; let base = "";
beforeAll(async () => {
  srv = buildApp({ rateLimitPerMinute: 40 }).listen(0);
  await new Promise((r) => srv.once("listening", r));
  base = `http://127.0.0.1:${(srv.address() as any).port}`;
});
afterAll(() => srv.close());

const rpc = (method: string, params: unknown, id = 1) =>
  fetch(`${base}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });

describe("http", () => {
  it("serves the logo files", async () => {
    const png = await fetch(`${base}/logo.png`);
    expect(png.status).toBe(200);
    expect(png.headers.get("content-type")).toBe("image/png");
    const svg = await fetch(`${base}/logo.svg`);
    expect(svg.status).toBe(200);
    expect(svg.headers.get("content-type")?.startsWith("image/svg+xml")).toBe(true);
  });
  it("serves the chart wheel SVG", async () => {
    const url = new URL(birthChart({ birth_date: "1985-11-03", birth_time: "07:10", birth_place: "Rotterdam" }, "nl").data.chart_image_url);
    const r = await fetch(`${base}/chart.svg${url.search}`);
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")?.startsWith("image/svg+xml")).toBe(true);
    const body = await r.text();
    expect(body).toContain("STELLARA");
    expect(body).toContain("Geboortehoroscoop");
    expect(/1985|Rotterdam|07:10|51\.9|Breedte|Lengte/.test(body)).toBe(false);
    expect([...url.searchParams.keys()].sort()).toEqual(["id", "lang"]);
    const en = await (await fetch(`${base}/chart.svg?id=${url.searchParams.get("id")}&lang=en`)).text();
    expect(en.includes("Birth Chart") && !en.includes("Geboortehoroscoop")).toBe(true);
    // The old birth-data query form is refused; unknown or malformed ids give 404.
    expect((await fetch(`${base}/chart.svg?date=1985-11-03&time=07:10&place=Rotterdam`)).status).toBe(400);
    expect((await fetch(`${base}/chart.svg?id=AAAAAAAAAAAAAAAAAAAAAA`)).status).toBe(404);
    expect((await fetch(`${base}/chart.png?id=AAAAAAAAAAAAAAAAAAAAAA&lang=nl`)).status).toBe(404);
    expect((await fetch(`${base}/chart.svg?id=abc`)).status).toBe(404);
    const png = await fetch(`${base}/chart.png${url.search}`);
    expect(png.headers.get("content-type")).toBe("image/png");
    expect(Buffer.from(await png.arrayBuffer()).subarray(1, 4).toString()).toBe("PNG");
    expect((await fetch(`${base}/chart.svg`)).status).toBe(400);
  });
  it("GET /health", async () => {
    const r = await fetch(`${base}/health`);
    expect(r.status).toBe(200);
    expect((await r.json()).status).toBe("ok");
  });
  it("lists all tools, all read-only with titles", async () => {
    const r = await rpc("tools/list", {});
    const j = await r.json();
    expect(j.result.tools.map((t: any) => t.name).sort()).toEqual(["compare_charts", "create_christmas_star_card", "get_birth_chart", "get_sun_sign_reading", "get_transits", "list_celebrities"]);
    for (const t of j.result.tools) { expect(t.annotations.readOnlyHint).toBe(true); expect(!!t.title).toBe(true); }
  });
  it("calls the chart tools over MCP", async () => {
    const c = await (await rpc("tools/call", { name: "get_birth_chart", arguments: { birth_date: "1879-03-14", birth_time: "11:30", latitude: 48.4011, longitude: 9.9876, timezone: "Etc/GMT-1" } })).json();
    expect(c.result.structuredContent.ascendant.sign).toBe("cancer");
    expect(c.result.content.find((x: any) => x.type === "image").mimeType).toBe("image/png");
    const t = await (await rpc("tools/call", { name: "get_transits", arguments: { birth_date: "1990-06-01", period: "week" } })).json();
    expect(t.result.isError).toBe(undefined);
    const s = await (await rpc("tools/call", { name: "compare_charts", arguments: { person_a: { birth_date: "1990-06-01" }, person_b: { birth_date: "1988-03-14" }, language: "nl" } })).json();
    expect(s.result.content[0].text).toContain("Horoscopen vergeleken");
    const m = await (await rpc("tools/call", { name: "compare_charts", arguments: { person_a: { birth_date: "1985-11-03" }, celebrity: "@elonmusk" } })).json();
    expect(typeof m.result.structuredContent.match_score).toBe("number");
    const lc = await (await rpc("tools/call", { name: "list_celebrities", arguments: { query: "singer" } })).json();
    expect(lc.result.structuredContent.celebrities.length > 0).toBe(true);
    const e = await (await rpc("tools/call", { name: "get_birth_chart", arguments: { birth_date: "1990-06-01", birth_place: "Xyzzyville" } })).json();
    expect(e.result.isError).toBe(true);
  });
  it("calls korte_lezing", async () => {
    const j = await (await rpc("tools/call", { name: "get_sun_sign_reading", arguments: { birth_date: "1988-03-14", language: "nl" } })).json();
    expect(j.result.content[0].text).toContain("Zon in Vissen");
    expect(j.result.structuredContent.life_path_number).toBe(7);
    expect(j.result.structuredContent.sun_sign).toBe("Vissen");
  });
  it("calls christmas_stars_kaart with a PNG image", async () => {
    const j = await (await rpc("tools/call", { name: "create_christmas_star_card", arguments: { birth_date: "1990-12-30", recipient_name: "Anna" } })).json();
    const img = j.result.content.find((c: any) => c.type === "image");
    expect(img.mimeType).toBe("image/png");
    expect(Buffer.from(img.data, "base64").subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(j.result.structuredContent.card_text).toContain("For Anna");
  });
  // Regression: an SVG image block made MCP hosts fail every get_birth_chart call with
  // "Could not find MIME for Buffer" (their image decoder reads raster formats only).
  for (const [label, args] of [
    ["date, time and place", { birth_date: "1985-11-03", birth_time: "07:10", birth_place: "Rotterdam" }],
    ["date only", { birth_date: "1985-11-03" }],
    // Leonardo DiCaprio (public birth data, also in data/celebrities.json): the case reported from a host.
    ["DiCaprio: date, time and place", { birth_date: "1974-11-11", birth_time: "02:47", birth_place: "Los Angeles" }],
    ["DiCaprio: date only", { birth_date: "1974-11-11" }],
  ] as const) it(`get_birth_chart returns a raster PNG image block (${label})`, async () => {
    const j = await (await rpc("tools/call", { name: "get_birth_chart", arguments: args })).json();
    expect(j.result.isError ?? false).toBe(false);
    const imgs = j.result.content.filter((c: any) => c.type === "image");
    expect(imgs.length).toBe(1);
    expect(imgs[0].mimeType).toBe("image/png");
    const png = Buffer.from(imgs[0].data, "base64");
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(png.readUInt32BE(16)).toBe(1000); // IHDR width
    for (const c of j.result.content) expect(c.mimeType ?? "").not.toContain("svg");
  });
  it("get_sun_sign_reading takes voice, third person by default", async () => {
    const call = async (a: object) => (await (await rpc("tools/call", { name: "get_sun_sign_reading", arguments: { birth_date: "1985-11-03", ...a } })).json()).result;
    const d = await call({});
    expect(d.content[0].text).toContain("Someone born under Scorpio is intense");
    expect(d.content[0].text).not.toMatch(/\byou\b/i);
    expect((await call({ voice: "second_person" })).content[0].text).toContain("you are intense");
    expect((await call({ voice: "first_person" })).isError).toBe(true);
  });
  it("returns a tool error for a bad date", async () => {
    const j = await (await rpc("tools/call", { name: "get_sun_sign_reading", arguments: { birth_date: "31-02-1990" } })).json();
    expect(j.result.isError).toBe(true);
  });
  it("defaults to English and only needs birth_date", async () => {
    const j = await (await rpc("tools/call", { name: "get_sun_sign_reading", arguments: { birth_date: "1990-06-01" } })).json();
    expect(j.result.structuredContent.sun_sign).toBe("Gemini");
  });
  it("rejects a foreign Origin, allows localhost", async () => {
    const h = { "content-type": "application/json", accept: "application/json, text/event-stream" };
    const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
    expect((await fetch(`${base}/mcp`, { method: "POST", headers: { ...h, origin: "https://evil.example" }, body })).status).toBe(403);
    expect((await fetch(`${base}/mcp`, { method: "POST", headers: { ...h, origin: "http://localhost:6274" }, body })).status).toBe(200);
  });
  it("GET /mcp is 405", async () => {
    expect((await fetch(`${base}/mcp`)).status).toBe(405);
  });
  it("rate limits", async () => {
    let last = 0;
    for (let i = 0; i < 45; i++) last = (await rpc("tools/list", {}, i)).status;
    expect(last).toBe(429);
  });
});

describe("tools", () => {
  it("rejects markup in names, escapes allowed apostrophes in SVG", () => {
    expect(() => christmasStarsKaart("1990-12-30", "<script>x</script>", "nl")).toThrow();
    const r = christmasStarsKaart("1990-12-30", "O'Brien", "nl");
    expect(r.svg).toContain("O&apos;Brien");
  });
  it("mentions cusp days", () => {
    expect(korteLezing("1990-03-21", "nl").text).toContain("geboortetijd");
  });
  it("ends with the variant B footer and no links", () => {
    const t = korteLezing("1990-06-01", "en").text;
    expect(JSON.stringify(christmasStarsKaart("1990-06-01", "A"))).not.toMatch(/https?:\/\/(?!www\.w3\.org)|mystellara/);
    expect(t.trim().endsWith("Made by Stellara. For self-reflection, not predictions.")).toBe(true);
    expect(t).not.toMatch(/https?:|mystellara/);
  });
});

describe("share on X", () => {
  it("match + chart share links: page with og/twitter tags, PNG cards, no birth data, no tags", async () => {
    const { celebrityMatch, birthChart } = await import("../src/chartTools.js");
    const { findCelebrity } = await import("../src/celebrities.js");
    const s2 = buildApp({ rateLimitPerMinute: 100 }).listen(0);
    await new Promise((r) => s2.once("listening", r));
    const b2 = `http://127.0.0.1:${(s2.address() as { port: number }).port}`;
    try {
      const B = { birth_date: "1985-11-03", birth_time: "07:10", birth_place: "Rotterdam" };
      const m = celebrityMatch(B, findCelebrity("Elon Musk")!, "en").data as any;
      const c = birthChart(B, "nl").data as any;
      for (const d of [m, c]) {
        expect(d.share_url.startsWith("https://x.com/intent/post?text=")).toBe(true);
        expect(decodeURIComponent(d.share_url).includes("@")).toBe(false);
        for (const bad of ["1985", "07:10", "Rotterdam"]) expect(decodeURIComponent(d.share_url).includes(bad) || Buffer.from(d.share_page_url.split("t=")[1], "base64url").toString().includes(bad)).toBe(false);
        const page = new URL(d.share_page_url);
        const html = await (await fetch(`${b2}${page.pathname}${page.search}`)).text();
        expect(html.includes('name="twitter:card" content="summary_large_image"')).toBe(true);
        expect(html.includes('property="og:image"') && html.includes("https://mystellara.com/")).toBe(true);
        const img = new URL(d.share_image_url);
        const png = await fetch(`${b2}${img.pathname}${img.search}`);
        expect(png.headers.get("content-type")).toBe("image/png");
        const buf = Buffer.from(await png.arrayBuffer());
        expect(buf.readUInt32BE(16)).toBe(1200);
        expect(buf.readUInt32BE(20)).toBe(675);
      }
      expect(m.share_text.includes("Elon Musk")).toBe(true);
      expect((await fetch(`${b2}/s/match?t=nope`)).status).toBe(404);
      expect((await fetch(`${b2}/match.png?t=e30`)).status).toBe(400);
    } finally { s2.close(); }
  });
});
