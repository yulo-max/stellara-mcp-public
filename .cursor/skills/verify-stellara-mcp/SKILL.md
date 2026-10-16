---
name: verify-stellara-mcp
description: Prove a change to the Stellara MCP server (Streamable HTTP at /mcp) works by starting it locally and driving real MCP tool calls, Origin check, rate limit and the no-birth-date-in-logs invariant. Use after any change in src/.
---
# Verify stellara-mcp

## Launch
`npm ci` once, then `scripts/verify-mcp.sh [port]` (default 3917). It runs `PORT=<port> RATE_LIMIT_PER_MINUTE=5 npx tsx src/index.ts`,
waits until `GET /health` answers `{"status":"ok"}` (log line `stellara-mcp listening on :<port>`), drives it and kills the PID it started (trap on exit).
No DB, no secrets, no env needed. Two instances can run side by side on different ports; the script refuses a port already in use.

## Doctor
`curl -s http://127.0.0.1:<port>/health` -> `{"status":"ok","version":"<package.json version>"}`. Wrong version = stale process, not ours.

## Drive
JSON-RPC over HTTP, headers `content-type: application/json` and `accept: application/json, text/event-stream`:
`{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_sun_sign_reading","arguments":{"birth_date":"1985-11-03"}}}`.
Tools: get_sun_sign_reading, create_christmas_star_card, get_birth_chart, get_transits, compare_charts, list_celebrities (`tools/list`).
Checks in the script: structuredContent present, invalid date -> `isError: true`, `origin: https://evil.example` -> 403 "Origin not allowed",
6th call within a minute -> 429, server.log contains no birth date. Use only fictional people (Sarah Mitchell, the Rotterdammer 1985-11-03).

## Evidence
`$EVIDENCE_DIR` (default /tmp/stellara-verify)/<timestamp>/: health.json, reading.json, card.json, invalid.json, origin.json, ratelimit.code, server.log,
plus PASS/FAIL lines on stdout (exit 0 = all pass). Exercise /mcp itself, never call src functions directly for a proof.

## Cleanup
The script kills only its own PID. Evidence dirs are kept; delete old ones by hand if wanted.

## Also
`npm test` covers the same invariants in test/invariants.test.ts. Feature map: features/README.md.
