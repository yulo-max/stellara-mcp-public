# AGENTS.md — stellara-mcp
Free Stellara MCP server (TypeScript, Express, Streamable HTTP at /mcp). Deployed by Railway from `main`; a cleaned copy goes to stellara-mcp-public.

## Commands
- `npm ci` — install
- `npx tsc --noEmit` — typecheck
- `npm test` — node:test via tsx (test/*.test.ts)
- `npm run license-check` / `npm run validate-plugin`
- `npm run dev` — local server (PORT, default from src/index.ts)

## Prove it works
Use `.cursor/skills/verify-stellara-mcp/SKILL.md` (`scripts/verify-mcp.sh`) after any src change. CI (.github/workflows/ci.yml) runs tsc, tests, license check, plugin validation and gitleaks.

## Hard invariants (enforced in test/invariants.test.ts)
1. Never log birth dates (or time/place). No console output with user input.
2. No link to mystellara.com in tool output (no exceptions). URLs on mcp.mystellara.com are allowed:
   that is the MCP's own host (chart images, share pages).
5. No birth data in any URL. chart_image_url is /chart.png?id=<random 128-bit id>&lang=..; the computed
   render data lives server-side (src/chartStore.ts). Share links (/s/...) carry only signs/degrees (src/share.ts).
   Tradeoff: the store is an in-memory LRU (30-day TTL, 20k entries). Without CHART_STORE_DIR pointing at a
   writable volume, chart image links stop working (404) after a restart or redeploy. Set CHART_STORE_DIR
   (e.g. a Railway volume mount) to keep them; files hold computed positions only, no birth data.
3. Only MIT/BSD/Apache/ISC-style deps (license-check). Ask before adding anything else.
4. Only fictional people in tests and examples (Sarah Mitchell, the Rotterdammer 1985-11-03).
5. Never touch payments/Stripe, secrets, .env or Railway config. Work on a branch + PR, never push to main.
