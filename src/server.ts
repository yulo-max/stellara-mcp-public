import path from "node:path";
import { portraitPng, bigThree } from "./portrait.js";
import { resolveBirth, computeChart } from "./chart.js";
import { timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { decodeToken, matchCardSvg, chartCardSvg, sharePageHtml } from "./share.js";
import { wheelSvgFromToken } from "./chartToken.js";
import { getChart } from "./chartStore.js";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { TOOLS, FIELDS, DEFAULT_LANGUAGE, allowedOrigins } from "./config.js";
import { korteLezing, christmasStarsKaart } from "./tools.js";
import { birthChart, transits, compareCharts, celebrityMatch, listCelebrities } from "./chartTools.js";
import { searchCelebrity } from "./celebrities.js";
import { InputError } from "./chart.js";
import { svgToPng } from "./render.js";
import { UI } from "./copy.js";

export const VERSION = "0.6.3";
const birth_date = z.string().max(20).describe(FIELDS.birth_date);
const language = z.enum(["en", "nl"]).optional().describe(FIELDS.language);
const voice = z.enum(["third_person", "second_person"]).optional().describe(FIELDS.voice);

const base = {
  sun_sign: z.string(), sun_sign_key: z.string(), sign_change_day: z.boolean(),
  life_path_number: z.number().int(), disclaimer: z.string(),
};

const birth = {
  birth_date: z.string().max(20).describe(FIELDS.birth_date_chart),
  birth_time: z.string().max(8).optional().describe(FIELDS.birth_time),
  birth_place: z.string().max(80).optional().describe(FIELDS.birth_place),
  latitude: z.number().min(-90).max(90).optional().describe(FIELDS.latitude),
  longitude: z.number().min(-180).max(180).optional().describe(FIELDS.longitude),
  timezone: z.string().max(60).optional().describe(FIELDS.timezone),
};
const person = z.object(birth).describe(FIELDS.person);
const ro = { readOnlyHint: true, openWorldHint: false, idempotentHint: true };
const ok = (r: { text: string; data: Record<string, unknown> }) =>
  ({ content: [{ type: "text" as const, text: r.text }, { type: "text" as const, text: JSON.stringify(r.data) }], structuredContent: r.data });

// Image blocks are PNG: MCP hosts (e.g. Claude) only accept raster images and fail on SVG
// with "Could not find MIME for Buffer". The SVG stays available via chart_image_url.
const pngImage = (svg: string, width: number) =>
  ({ type: "image" as const, data: svgToPng(svg, width).toString("base64"), mimeType: "image/png" });

function errorResult(e: unknown) {
  const message = e instanceof Error ? e.message : "Unknown error.";
  // No outputSchema-shaped data on error; isError tells the client.
  return { isError: true, content: [{ type: "text" as const, text: message }] };
}

export function buildMcpServer() {
  const server = new McpServer({ name: "stellara", version: VERSION });

  server.registerTool(
    TOOLS.reading.name,
    {
      title: TOOLS.reading.title,
      description: TOOLS.reading.description,
      inputSchema: { birth_date, language, voice },
      outputSchema: { ...base, reading: z.string() },
      annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true },
    },
    async ({ birth_date, language, voice }) => {
      try {
        const r = korteLezing(birth_date, language ?? DEFAULT_LANGUAGE, undefined, voice ?? "third_person");
        return { content: [{ type: "text", text: r.text }, { type: "text", text: JSON.stringify(r.data) }], structuredContent: r.data };
      } catch (e) { return errorResult(e); }
    },
  );

  server.registerTool(
    TOOLS.card.name,
    {
      title: TOOLS.card.title,
      description: TOOLS.card.description,
      inputSchema: { birth_date, recipient_name: z.string().max(40, `${UI.badName.nl} / ${UI.badName.en}`).optional().describe(FIELDS.recipient_name), language },
      outputSchema: { ...base, recipient_name: z.string().nullable(), card_text: z.string() },
      annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true },
    },
    async ({ birth_date, recipient_name, language }) => {
      try {
        const r = christmasStarsKaart(birth_date, recipient_name, language ?? DEFAULT_LANGUAGE);
        return {
          content: [
            { type: "text", text: r.text },
            pngImage(r.svg, 1080),
            { type: "text", text: JSON.stringify(r.data) },
          ],
          structuredContent: r.data,
        };
      } catch (e) { return errorResult(e); }
    },
  );
  server.registerTool(
    TOOLS.chart.name,
    { title: TOOLS.chart.title, description: TOOLS.chart.description, inputSchema: { ...birth, language }, annotations: { ...ro, idempotentHint: true } },
    async ({ language, ...b }) => {
      try {
        const r = birthChart(b, language ?? DEFAULT_LANGUAGE);
        return {
          content: [
            { type: "text" as const, text: r.text },
            pngImage(r.svg, 1000),
            { type: "text" as const, text: JSON.stringify(r.data) },
          ],
          structuredContent: r.data,
        };
      } catch (e) { return errorResult(e); }
    },
  );
  server.registerTool(
    TOOLS.transits.name,
    {
      title: TOOLS.transits.title, description: TOOLS.transits.description,
      inputSchema: { ...birth, date: z.string().max(12).optional().describe(FIELDS.date), period: z.enum(["today", "week"]).optional().describe(FIELDS.period), language },
      annotations: { ...ro, idempotentHint: false },
    },
    async ({ language, ...b }) => { try { return ok(transits(b, language ?? DEFAULT_LANGUAGE)); } catch (e) { return errorResult(e); } },
  );
  server.registerTool(
    TOOLS.synastry.name,
    { title: TOOLS.synastry.title, description: TOOLS.synastry.description, inputSchema: { person_a: person, person_b: person.optional(), celebrity: z.string().max(60).optional().describe(FIELDS.celebrity), language }, annotations: ro },
    async ({ person_a, person_b, celebrity, language }) => {
      try {
        const l = language ?? DEFAULT_LANGUAGE;
        if (celebrity) {
          const f = searchCelebrity(celebrity);
          if ("candidates" in f) {
            if (!f.candidates.length) throw new InputError(`"${celebrity.slice(0, 60)}" is not in the famous people list (about 1000 most-followed people on X). Call list_celebrities with a search word.`);
            throw new InputError(`"${celebrity.slice(0, 60)}" matches several people. Ask which one is meant: ${f.candidates.map((c) => `${c.name} (${c.x_handle})`).join("; ")}.`);
          }
          return ok(celebrityMatch(person_a, f.celeb, l));
        }
        if (!person_b) throw new InputError("Give person_b (birth data) or celebrity (a name from list_celebrities).");
        return ok(compareCharts(person_a, person_b, l));
      } catch (e) { return errorResult(e); }
    },
  );
  server.registerTool(
    TOOLS.celebs.name,
    { title: TOOLS.celebs.title, description: TOOLS.celebs.description, inputSchema: { query: z.string().max(60).optional().describe(FIELDS.celeb_query) }, annotations: ro },
    async ({ query }) => {
      const list = listCelebrities(query);
      const text = list.length ? list.map((c) => `${c.name} (${c.x_handle})${c.description ? `, ${c.description}` : ""}, born ${c.birth_date}${c.time_known ? ", birth time known" : ""}`).join("\n") : "No match. Try another search word.";
      return { content: [{ type: "text" as const, text }, { type: "text" as const, text: JSON.stringify({ celebrities: list }) }], structuredContent: { celebrities: list } };
    },
  );
  return server;
}

const rpcError = (res: Response, status: number, message: string) =>
  res.status(status).json({ jsonrpc: "2.0", error: { code: -32000, message }, id: null });

/** DNS-rebinding protection: browser requests must come from an allowed Origin. */
export function originCheck(extra: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (!origin) return next(); // non-browser MCP clients send no Origin
    let host = "";
    try { host = new URL(origin).hostname; } catch { return rpcError(res, 403, "Origin not allowed."); }
    const ok = host === "localhost" || host === "127.0.0.1" || [...allowedOrigins(), ...extra].includes(origin);
    return ok ? next() : rpcError(res, 403, "Origin not allowed.");
  };
}

export function buildApp(opts: { rateLimitPerMinute?: number; allowedOrigins?: string[] } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1); // Railway sits behind one proxy
  app.use(express.json({ limit: "32kb" }));

  app.get("/health", (_req, res) => { res.json({ status: "ok", version: VERSION }); });
  // Public logo for marketplace listings (static, no user data).
  const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
  for (const f of ["logo.png", "logo.svg"]) {
    app.get(`/${f}`, (_req, res) => {
      res.set("Cache-Control", "public, max-age=86400");
      res.sendFile(path.join(publicDir, f));
    });
  }
  app.get("/", (_req, res) => {
    res.type("text/plain").send("Stellara MCP. MCP endpoint: POST /mcp (Streamable HTTP). Health: GET /health. No data is stored.");
  });

  // In-memory limiter: IPs live only in RAM for the window, never written or logged.
  const limiter = rateLimit({
    windowMs: 60_000,
    limit: opts.rateLimitPerMinute ?? Number(process.env.RATE_LIMIT_PER_MINUTE ?? 30),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { jsonrpc: "2.0", error: { code: -32000, message: "Too many requests, try again in a minute." }, id: null },
  });

  const guard = [originCheck(opts.allowedOrigins), limiter];
  // Server-to-server from stellara-reports: one caller IP, so a higher ceiling than the public routes.
  const renderLimiter = rateLimit({ windowMs: 60_000, limit: Number(process.env.RENDER_RATE_LIMIT_PER_MINUTE ?? 120), standardHeaders: "draft-7", legacyHeaders: false, message: { error: "rate_limited" } });
  // Chart wheel image by random server-side id (chartStore.ts). No birth data or positions in the URL.
  // Unknown/expired ids -> 404. The old ?date=&time=&place= form is refused on purpose.
  for (const ext of ["svg", "png"] as const) app.get(`/chart.${ext}`, limiter, (req: Request, res: Response) => {
    const v = req.query.id, lang = req.query.lang === "nl" ? "nl" : "en";
    if (typeof v !== "string") { res.status(400).type("text/plain").send("Invalid chart link."); return; }
    const t = getChart(v);
    if (!t) { res.status(404).type("text/plain").send(lang === "nl" ? "Deze kaartlink is verlopen of bestaat niet. Vraag je horoscoop opnieuw aan." : "This chart link has expired or does not exist. Ask for your chart again."); return; }
    const svg = wheelSvgFromToken(t, lang);
    res.set("Cache-Control", "public, max-age=86400");
    if (ext === "svg") res.type("image/svg+xml").send(svg);
    else res.type("image/png").send(svgToPng(svg));
  });

  // Share cards and pages for X. The token only holds computed results (signs, score, public name); nothing is stored or logged.
  const tok = (req: Request) => { const v = req.query.t; return typeof v === "string" ? v : undefined; };
  for (const [route, kind] of [["/match.png", "m"], ["/chart-card.png", "c"]] as const) app.get(route, limiter, (req: Request, res: Response) => {
    const t = decodeToken(tok(req), kind);
    if (!t) { res.status(400).type("text/plain").send("Invalid share link."); return; }
    res.set("Cache-Control", "public, max-age=604800, immutable").type("image/png").send(svgToPng(t.k === "m" ? matchCardSvg(t) : chartCardSvg(t), 1200));
  });
  for (const [route, kind] of [["/s/match", "m"], ["/s/chart", "c"]] as const) app.get(route, limiter, (req: Request, res: Response) => {
    const t = decodeToken(tok(req), kind);
    if (!t) { res.status(404).type("text/plain").send("This share link is not valid."); return; }
    res.set("Cache-Control", "public, max-age=86400").type("text/html").send(sharePageHtml(t));
  });

  // Internal: portrait free birth chart PNG for stellara-reports (POST /api/free-chart there).
  // Shared secret in X-Render-Secret (FREE_CHART_RENDER_SECRET); without it set, the route does not exist.
  // Birth data only in the POST body, never in a URL, never logged or stored. Returns the PNG (base64)
  // and the big three signs.
  app.post("/render/free-chart", renderLimiter, (req: Request, res: Response) => {
    const secret = process.env.FREE_CHART_RENDER_SECRET || "";
    const given = String(req.get("x-render-secret") || "");
    const ok = secret.length >= 16 && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
    if (!ok) { res.status(404).type("text/plain").send("Not found."); return; }
    const b = (req.body || {}) as Record<string, unknown>;
    const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN);
    const lat = num(b.latitude), lon = num(b.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || typeof b.timezone !== "string" || !b.timezone) {
      res.status(400).json({ error: "invalid_place" }); return;
    }
    try {
      const r = resolveBirth({ birth_date: String(b.birth_date || ""), birth_time: b.birth_time ? String(b.birth_time) : undefined, latitude: lat, longitude: lon, timezone: b.timezone });
      const c = computeChart(r);
      const big = bigThree(c);
      res.set("Cache-Control", "no-store").json({ png: portraitPng(c).toString("base64"), sun: big.sun, moon: big.moon, moon_alt: big.moonAlt ?? "", rising: big.rising ?? "", time_known: r.timeKnown });
    } catch (e) {
      if (e instanceof InputError) { res.status(400).json({ error: "invalid_input" }); return; }
      res.status(500).json({ error: "render_failed" });
    }
  });

  // Stateless: a fresh server and transport per request, no sessions. Bodies are never logged.
  app.post("/mcp", ...guard, async (req: Request, res: Response) => {
    const server = buildMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => { transport.close(); server.close(); });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch {
      if (!res.headersSent) res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal error." }, id: null });
    }
  });
  const notAllowed = (_req: Request, res: Response) => { res.set("Allow", "POST"); rpcError(res, 405, "Method not allowed."); };
  app.get("/mcp", ...guard, notAllowed);
  app.delete("/mcp", ...guard, notAllowed);
  // Malformed JSON: generic error, never echo the body.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    rpcError(res, 400, "Invalid request.");
  });
  return app;
}
