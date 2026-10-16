# Stellara MCP (free)

Free, read-only MCP server for Stellara. No login, no payment, no database. Variant B: output ends with "Made by Stellara. For self-reflection, not predictions." (Dutch: "Gemaakt door Stellara. ...") and contains no links to mystellara.com. Image and share links use the MCP's own host (mcp.mystellara.com) and carry only computed chart data, never birth data.

Names, descriptions and field descriptions live in `src/config.ts`; all output texts in `src/copy.ts`.

This repo is also a Cursor plugin: `.cursor-plugin/plugin.json`, `mcp.json` (points to `https://mcp.mystellara.com/mcp`), `skills/stellara-reading/SKILL.md`, `assets/logo.svg`. Check it with `npm run validate-plugin`.

## Endpoints

| Method | Path | What |
|---|---|---|
| POST | `/mcp` | MCP over Streamable HTTP (stateless, JSON responses) |
| GET | `/health` | `{"status":"ok","version":"..."}` |
| GET | `/` | Short plain-text info |

GET/DELETE `/mcp` return 405 (no sessions, no SSE stream).

## Chart image

`GET /chart.png` and `GET /chart.svg` with `?id=<id>` (optional `lang=nl`) return a full natal chart image (1400x1000): cream background, zodiac ring with coloured sign glyphs and degree ticks, Placidus house segments with numbers and cusp degrees, As/Ds/Mc/Ic, planet glyphs with degrees, aspect lines (green harmonious, red tense), element and quality percentages, and a side table of positions and cusps. PNG is rendered with resvg-js (MPL-2.0, used unmodified) and the bundled DejaVu Sans font (`fonts/`, free licence), so glyphs look the same everywhere. Same rate limit as `/mcp`, computed per request, nothing stored. The id is random (128 bits); the computed render data is kept server-side in an in-memory LRU (30 days, max 20,000; optional disk copy when `CHART_STORE_DIR` is a writable volume). Nothing personal is in the URL or in the image. Unknown or expired ids return 404; memory-only links stop working after a restart. The old `?date=` form is refused (400). `get_birth_chart` returns this URL as `chart_image_url` and the SVG as an image content block.

## Sharing on X

`get_birth_chart` and `compare_charts` (with `celebrity`) return `share_url` (an X post intent with text + share page, never an @tag), `share_page_url` and `share_image_url`.

- `GET /s/match?t=…`, `GET /s/chart?t=…`: share page with `og:*` and `twitter:card=summary_large_image`, short text and a button to mystellara.com.
- `GET /match.png?t=…`, `GET /chart-card.png?t=…`: 1200x675 cards.
- The token `t` is base64url JSON with only computed results (sign indexes, whole-degree planet longitudes, score, public celebrity name). No birth date, time or place. Nothing is stored or logged.

## Famous people

`compare_charts` accepts `celebrity` (name, X handle or a typo of it) instead of `person_b` and returns a playful match: score (40 to 98), one-liner, plain sentences, a share text for X linking mystellara.com, and a note that it says nothing about anyone's private life. `list_celebrities(query?)` lists who is available.

`data/celebrities.json` holds the 1000 most-followed real people on X, built by `scripts/build_celebrities.py`: ranking from Wikidata follower counts (P8687 with X user-id qualifier, humans only), birth date P569 (day precision), birthplace P19 with coordinates, cross-checked with Grokipedia. Each entry records the source per field and a confidence (high = both agree, medium = one source, low = conflict, flagged in the output). Birth times only where a birth certificate is published (Obama, Trump); everyone else is date-only (no rising sign or houses, said plainly). Wikidata is CC0.

## Reading style

The chart and transit texts are written for people new to astrology: no degrees, no aspect names, no "ascendant", short sentences, main reading at most 6 lines. All technical data (positions, degrees, houses, aspects with orbs, exact transit dates) is in `structuredContent`.

## Tools

- `get_sun_sign_reading(birth_date, language?)`: sun sign from a simple date table plus Pythagorean life path number, with short handwritten text. On the day the sun changes sign (and the day before) it says the sign depends on birth time.
- `create_christmas_star_card(birth_date, recipient_name?, language?)`: festive card as text plus an SVG image (1080x1350) in Stellara colours.
- `get_birth_chart(birth_date, birth_time?, birth_place? | latitude+longitude+timezone, language?)`: real positions of Sun to Pluto (tropical, sign, degree, retrograde), major aspects with orbs (conjunction/opposition 8°, trine/square 7°, sextile 5°), and a short character interpretation. Ascendant, Midheaven and **Placidus houses** (Whole Sign above the polar circles; cusps match astro.com/astrotheme for Einstein) only when both time and place are given. Without a time, 12:00 local is used, Moon aspects are skipped and the Moon is flagged if it changed sign that day. `chart_image_url` holds only a random id and the language. Ends with the footer.
- `get_transits(birth data, date?, period? = today|week, language?)`: planet positions at the middle of the UTC window (today or 7 days from `date`), transits (Sun to Pluto, Moon excluded) to natal planets within 2° (personal) / 1.5° (outer) or exact inside the window, with exact UTC dates when within ±10/45 days.
- `compare_charts(person_a, person_b, language?)`: synastry; inter-aspects involving at least one personal planet (orbs at 75%), ranked personal-to-personal first, plus counts and a short summary.

Birth place: an offline gazetteer of about 171,000 places worldwide (every town with 1000+ inhabitants, from GeoNames `cities1000`), or `latitude`, `longitude` and an IANA `timezone`. Matching is case- and accent-insensitive (Zurich = Zürich), knows alternate and Dutch names (Den Haag, Den Bosch, Keulen, Luik), and accepts hints: `"Hengelo, Gelderland"`, `"Springfield, Illinois"`, `"Ootmarsum, Nederland"`. Official names are preferred, then population. When a name is ambiguous (for example Springfield) the tool returns an error listing the top 5 candidates with region and country, so the assistant can ask. No external geocoder is called, so places never leave the server.

The gazetteer is preprocessed by `scripts/build-gazetteer.mjs` into `data/gazetteer.tsv.gz` (4.5 MB: name, alternate names, country, region, lat, lon, timezone, population). It loads in about 1 second right after start-up (about 210 MB RSS in total).

**Place data: [GeoNames](https://www.geonames.org/), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).** See `data/NOTICE.md`. Chart output names the source in `place.source` and in the notes. Local time is converted with luxon and the IANA database, so historical daylight saving time is handled (for example no Dutch summer time in 1975).

### Accuracy

Positions come from [astronomy-engine](https://github.com/cosinekitty/astronomy) (MIT, VSOP87 / ELP based): apparent geocentric ecliptic longitude of date. Tests compare all ten bodies against JPL Horizons (quantity 31) for 1990-06-01 12:00 UT and 1879-03-14 10:50 UT: max difference 0.0016°. Ascendant/MC for Einstein (Ulm, 1879-03-14 11:30 LMT) come out at 11°38' Cancer / 12°50' Pisces, same as astro.com.

For the first two tools `birth_date` (`YYYY-MM-DD`, also `DD-MM-YYYY`) is the only required input. `language`: `en` (default) or `nl`. All tools return `structuredContent` matching their `outputSchema` (`sun_sign`, `life_path_number`, `reading`/`card_text`, `disclaimer`, ...) and the same JSON as a text block. An invalid date returns a tool result with `isError: true`, not a protocol error. Character and reflection only, no predictions. Only `get_birth_chart` mentions mystellara.com, once. All text is fixed and handwritten; there are no LLM calls.

## Data handling

Nothing is stored. No database, no files, no request logging, no analytics. Birth dates and names are used only to build the response and are discarded when the request ends. The rate limiter keeps the client IP in memory for at most one minute to count requests; it is never written or logged. The only log line is the startup message.

## Security

- No authentication, on purpose: the server has no accounts, no secrets and no user data, so per-IP rate limiting is the protection. This is a conscious deviation from the MCP "SHOULD authenticate" guidance.
- Origin check on `/mcp` (DNS-rebinding protection): requests without an `Origin` header (normal MCP clients) are allowed; browser requests are allowed only from localhost or origins listed in `ALLOWED_ORIGINS` (comma separated). Others get 403.
- Inputs are validated (zod, max lengths); names are XML-escaped in the SVG.

## Rate limiting

30 requests per minute per IP on `/mcp` (env `RATE_LIMIT_PER_MINUTE`). Over the limit returns HTTP 429.

## Run

```bash
npm ci && npm run build && npm start        # PORT defaults to 8080
npm test                                    # node:test, no extra framework
npm run license-check                       # fails on non MIT/BSD/Apache/ISC deps
npx @modelcontextprotocol/inspector --cli http://localhost:8080/mcp --transport http --method tools/list
```

## Deploy (Railway)

`Dockerfile` (healthcheck `/health`). The platform sets `PORT`. No secrets or env vars are required.

## License

MIT. Dependencies are limited to MIT, BSD, Apache-2.0, ISC and MPL-2.0 (resvg-js only, unmodified). No kerykeion, Swiss Ephemeris or other (A)GPL code. The sun sign reading uses a date table; the chart tools use astronomy-engine (MIT) and luxon (MIT). Place data from GeoNames (CC BY 4.0).
