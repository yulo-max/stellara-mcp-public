// Free birth chart portrait (src/portrait.ts) and the internal render route. Fictional Sarah Mitchell only.
import { describe, it, before, after } from "node:test";
import { expect } from "./expect.js";
import type { Server } from "node:http";
import { buildApp } from "../src/server.js";
import { resolveBirth, computeChart } from "../src/chart.js";
import { portraitSvg, portraitPng, bigThree } from "../src/portrait.js";

const SARAH = { birth_date: "1988-03-15", birth_time: "08:22", latitude: 30.2672, longitude: -97.7431, timezone: "America/Chicago" };
// Test-only value built at runtime (no key-like literal for gitleaks).
const SECRET = "t".repeat(24);

describe("portrait", () => {
  it("is 1080 x 1350 with the big three, no aspects table and no birth details", () => {
    const c = computeChart(resolveBirth(SARAH));
    const svg = portraitSvg(c);
    expect(svg).toContain('width="1080" height="1350"');
    expect(svg).toContain("Pisces"); expect(svg).toContain("Aquarius"); expect(svg).toContain("Taurus");
    expect(svg).toContain(">As<"); expect(svg).toContain(">Mc<");
    expect(svg).not.toContain("1988"); expect(svg).not.toContain("08:22"); expect(svg).not.toContain("Austin");
    expect(svg).not.toContain("Cusp");
    expect(bigThree(c)).toEqual({ sun: "pisces", moon: "aquarius", rising: "taurus" });
    const png = portraitPng(c);
    expect(png.readUInt32BE(16)).toBe(1080); expect(png.readUInt32BE(20)).toBe(1350);
  });
  it("without a birth time: no houses, no As/Mc, rising needs the time, moon gives both signs if it changed", () => {
    const c = computeChart(resolveBirth({ ...SARAH, birth_time: undefined }));
    const svg = portraitSvg(c);
    expect(svg).not.toContain(">As<"); expect(svg).not.toContain(">Mc<");
    expect(svg).toContain("Needs birth time");
    expect(bigThree(c).rising).toBe(undefined);
    if (c.moonUncertain) expect(svg).toContain(" or ");
  });
});

describe("POST /render/free-chart", () => {
  let srv: Server; let base = "";
  before(async () => {
    process.env.FREE_CHART_RENDER_SECRET = SECRET;
    srv = buildApp().listen(0); await new Promise((r) => srv.once("listening", r));
    base = `http://127.0.0.1:${(srv.address() as any).port}`;
  });
  after(() => { srv.close(); delete process.env.FREE_CHART_RENDER_SECRET; });
  const post = (body: unknown, secret = SECRET) => fetch(`${base}/render/free-chart`, { method: "POST", headers: { "content-type": "application/json", "x-render-secret": secret }, body: JSON.stringify(body) });

  it("404 without the right secret", async () => {
    expect((await post(SARAH, "wrong")).status).toBe(404);
    expect((await post(SARAH, "")).status).toBe(404);
  });
  it("returns a PNG and the signs", async () => {
    const r = await post(SARAH); expect(r.status).toBe(200);
    const j = await r.json() as any;
    expect([j.sun, j.moon, j.rising, j.time_known]).toEqual(["pisces", "aquarius", "taurus", true]);
    expect(Buffer.from(j.png, "base64").subarray(1, 4).toString()).toBe("PNG");
  });
  it("400 on bad input, without echoing it", async () => {
    const r = await post({ ...SARAH, birth_date: "1988-13-45" }); expect(r.status).toBe(400);
    expect(await r.text()).not.toContain("1988");
    expect((await post({ ...SARAH, latitude: 200 })).status).toBe(400);
  });
});
