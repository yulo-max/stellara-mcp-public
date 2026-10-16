// Hard invariants from AGENTS.md, enforced in code:
//  (a) a birth date never ends up in a log line (console / stdout / stderr);
//  (b) "mystellara.com" never appears in tool output (only the MCP's own host mcp.mystellara.com);
//  (c) no URL in tool output carries birth data (date, time, place, coordinates), not even inside a token.
import { describe, it, before, after } from "node:test";
import { expect } from "./expect.js";
import type { Server } from "node:http";
import { buildApp } from "../src/server.js";

const DATE = "1985-11-03", DATE_B = "1988-03-14";
const CALLS: [string, Record<string, unknown>][] = [
  ["get_sun_sign_reading", { birth_date: DATE }],
  ["get_sun_sign_reading", { birth_date: "1985-13-45" }], // error path must not log it either
  ["create_christmas_star_card", { birth_date: DATE, recipient_name: "Sarah Mitchell", language: "nl" }],
  ["get_birth_chart", { birth_date: DATE, birth_time: "07:10", birth_place: "Rotterdam" }],
  ["get_birth_chart", { birth_date: DATE, birth_time: "07:10", birth_place: "Rotterdam", language: "nl" }],
  ["get_transits", { birth_date: DATE, period: "week" }],
  ["compare_charts", { person_a: { birth_date: DATE }, person_b: { birth_date: DATE_B } }],
  ["compare_charts", { person_a: { birth_date: DATE }, celebrity: "Elon Musk", language: "nl" }],
  ["list_celebrities", { query: "Musk" }],
];

let srv: Server; let base = "";
const logs: string[] = [];
const restore: (() => void)[] = [];
function capture() {
  for (const k of ["log", "info", "warn", "error", "debug"] as const) {
    const orig = console[k];
    console[k] = (...a: unknown[]) => { logs.push(a.map(String).join(" ")); };
    restore.push(() => { console[k] = orig; });
  }
  for (const s of [process.stdout, process.stderr]) {
    const orig = s.write.bind(s);
    (s as any).write = (chunk: unknown, ...rest: unknown[]) => { logs.push(String(chunk)); return (orig as any)(chunk, ...rest); };
    restore.push(() => { (s as any).write = orig; });
  }
}
const call = async (name: string, args: unknown) => (await (await fetch(`${base}/mcp`, {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
})).json()).result;

const outputs: { name: string; text: string }[] = [];
before(async () => {
  srv = buildApp({ rateLimitPerMinute: 1000 }).listen(0);
  await new Promise((r) => srv.once("listening", r));
  base = `http://127.0.0.1:${(srv.address() as any).port}`;
  capture();
  try {
    for (const [name, args] of CALLS) {
      const r = await call(name, args);
      const text = r.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n")
        + "\n" + JSON.stringify(r.structuredContent ?? {});
      outputs.push({ name, text });
    }
    // HTTP image routes also receive birth data in the query string.
    await fetch(`${base}/chart.svg?date=${DATE}&time=07:10&place=Rotterdam`);
    await fetch(`${base}/chart.svg?date=${DATE}&place=Springfield`);
  } finally { restore.splice(0).reverse().forEach((f) => f()); }
});
after(() => srv.close());

describe("invariant: no birth dates in logs", () => {
  it("captured at least the calls", () => expect(outputs.length).toBe(CALLS.length));
  it("no log line contains a birth date", () => {
    const bad = logs.filter((l) => [DATE, DATE_B, "1985-13-45", "03-11-1985"].some((d) => l.includes(d)));
    expect(bad).toEqual([]);
  });
});

// ---- no bare mystellara.com ----------------------------------------------------------------
// Decision 16-10: the two earlier exceptions (report line, celebrity share text) are gone. Only URLs on the
// MCP's own host mcp.mystellara.com (chart image, share page/image, X intent) are allowed.
const stripOwnHost = (t: string) => t.replace(/https?:\/\/mcp\.mystellara\.com[^\s"]*/g, "").replace(/https?%3A%2F%2Fmcp\.mystellara\.com[^\s"&]*/gi, "");

describe("invariant: no mystellara.com in tool output", () => {
  it("no mention outside the own MCP host", () => {
    const bad: string[] = [];
    for (const { name, text } of outputs) {
      for (const m of stripOwnHost(text).matchAll(/[^\n"]{0,60}mystellara\.com[^\s"&]{0,30}/gi)) bad.push(`${name}: ${m[0]}`);
    }
    expect(bad).toEqual([]);
  });
  it("own-host links are actually present (the strip above is not hiding everything)", () => {
    expect(outputs.some((o) => o.name === "get_birth_chart" && o.text.includes("https://mcp.mystellara.com/chart.png?id="))).toBe(true);
  });
});

// ---- no birth data in URLs ------------------------------------------------------------------
const BIRTH = [DATE, DATE_B, "1985", "1988", "03-11", "07:10", "07%3A10", "Rotterdam"]; // celebrity names are public and may appear in match links
const DATE_RE = /\b\d{4}-\d{1,2}-\d{1,2}\b|\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\b/;
const TIME_RE = /\b\d{1,2}(:|%3A)\d{2}\b/i;
const COORD_RE = /-?\b\d{1,3}\.\d{2,}\b/;
const BANNED_KEYS = /^(date|birth_?date|time|birth_?time|place|birth_?place|lat|latitude|lon|lng|longitude|tz|timezone)$/i;
function urlsIn(text: string): URL[] {
  const out: URL[] = [];
  for (const m of text.replace(/\\u0026/g, "&").matchAll(/https?:\/\/[^\s"\\)]+/g)) {
    try { out.push(new URL(m[0])); } catch { /* ignore */ }
    // X intent links embed the share URL encoded in ?url=
  }
  for (const u of [...out]) for (const v of u.searchParams.values()) if (/^https?:\/\//.test(v)) { try { out.push(new URL(v)); } catch { /* ignore */ } }
  return out;
}
function decoded(v: string): string {
  if (!/^[A-Za-z0-9_-]{8,}$/.test(v)) return "";
  try { return Buffer.from(v, "base64url").toString("utf8"); } catch { return ""; }
}

describe("invariant: no birth data in any URL in tool output", () => {
  const all = () => outputs.flatMap((o) => urlsIn(o.text).map((u) => ({ name: o.name, u })));
  it("found the image and share URLs to check", () => {
    const paths = new Set(all().map((x) => x.u.pathname));
    for (const p of ["/chart.png", "/s/chart", "/chart-card.png", "/s/match", "/match.png"]) expect(`${p}:${paths.has(p)}`).toBe(`${p}:true`);
  });
  it("no birth-data query keys", () => {
    const bad = all().flatMap(({ name, u }) => [...u.searchParams.keys()].filter((k) => BANNED_KEYS.test(k)).map((k) => `${name}: ${k} in ${u}`));
    expect(bad).toEqual([]);
  });
  it("no date, time, coordinate or birth value in the URL or in any decoded token", () => {
    const bad: string[] = [];
    for (const { name, u } of all()) {
      const raw = u.pathname + "?" + [...u.searchParams.entries()].filter(([k]) => k !== "t" && k !== "url" && k !== "id").map(([k, v]) => `${k}=${v}`).join("&");
      const toks = [...u.searchParams.entries()].filter(([k]) => k === "t").map(([, v]) => decoded(v));
      for (const s of [raw, ...toks]) {
        if (DATE_RE.test(s) || TIME_RE.test(s) || COORD_RE.test(s) || BIRTH.some((b) => s.includes(b))) bad.push(`${name}: ${s.slice(0, 120)}`);
      }
    }
    expect(bad).toEqual([]);
  });
  it("chart image URLs carry only a random id and lang: no data, no positions", () => {
    const imgs = all().filter((x) => x.u.pathname === "/chart.png");
    expect(imgs.length > 0).toBe(true);
    const ids = new Set<string>();
    for (const { u } of imgs) {
      expect([...u.searchParams.keys()].sort()).toEqual(["id", "lang"]);
      const id = u.searchParams.get("id")!;
      expect(id).toMatch(/^[A-Za-z0-9_-]{22}$/); // 128 random bits
      ids.add(id);
    }
    expect(ids.size).toBe(outputs.filter((o) => o.name === "get_birth_chart").length); // same Rotterdam input twice (en + nl) -> two different ids
  });
});

describe("chart store", () => {
  it("random ids, unknown/expired ids are not found", async () => {
    const { putChart, getChart } = await import("../src/chartStore.js");
    const data = { v: 1, p: [], pr: 0, q: [], qr: 0, a: -1, m: -1, h: [], s: 0, t: 0, u: 0, g: 0 } as any;
    const a = putChart(data, 0), b = putChart(data, 0);
    expect(a === b).toBe(false);
    expect(getChart(a, 1) !== null).toBe(true);
    expect(getChart("AAAAAAAAAAAAAAAAAAAAAA")).toBe(null);
    expect(getChart(b, 31 * 86400_000)).toBe(null); // past 30-day TTL
  });
});
