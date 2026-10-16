#!/usr/bin/env bash
# Verification helper for stellara-mcp (see .cursor/skills/verify-stellara-mcp/SKILL.md).
# Usage: scripts/verify-mcp.sh [port]   -> starts the server, drives it, writes evidence, stops it.
set -euo pipefail
PORT="${1:-3917}"; BASE="http://127.0.0.1:$PORT"
EVID="${EVIDENCE_DIR:-/tmp/stellara-verify}/$(date +%Y%m%d-%H%M%S)"; mkdir -p "$EVID"
cd "$(dirname "$0")/.."
if curl -s "$BASE/health" >/dev/null 2>&1; then echo "port $PORT already in use, pick another" >&2; exit 2; fi
PORT=$PORT RATE_LIMIT_PER_MINUTE=5 npx tsx src/index.ts >"$EVID/server.log" 2>&1 & PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT
for i in $(seq 1 60); do curl -s "$BASE/health" >/dev/null 2>&1 && break; sleep 0.5; done
curl -s "$BASE/health" | tee "$EVID/health.json"; echo
rpc() { curl -s -X POST "$BASE/mcp" -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' ${3:+-H "origin: $3"} -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"$1\",\"arguments\":$2}}"; }
fail=0; check() { if eval "$2"; then echo "PASS $1"; else echo "FAIL $1"; fail=1; fi; }
rpc get_sun_sign_reading '{"birth_date":"1985-11-03"}' >"$EVID/reading.json"
rpc create_christmas_star_card '{"birth_date":"1985-11-03","recipient_name":"Sarah Mitchell"}' >"$EVID/card.json"
rpc get_sun_sign_reading '{"birth_date":"1985-13-45"}' >"$EVID/invalid.json"
rpc get_sun_sign_reading '{"birth_date":"1985-11-03"}' https://evil.example >"$EVID/origin.json"
for i in 1 2 3 4; do rpc get_sun_sign_reading '{"birth_date":"1985-11-03"}' >/dev/null; done
curl -s -o "$EVID/ratelimit.json" -w '%{http_code}' -X POST "$BASE/mcp" -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' >"$EVID/ratelimit.code"
check "reading structuredContent.sun_sign_key=scorpio" "grep -q '\"sun_sign_key\":\"scorpio\"' $EVID/reading.json"
check "card returns card_text + svg image" "grep -q '\"card_text\"' $EVID/card.json && grep -q 'image/svg+xml' $EVID/card.json"
check "invalid date -> isError true" "grep -q '\"isError\":true' $EVID/invalid.json"
check "foreign Origin -> rejected" "grep -q 'Origin not allowed' $EVID/origin.json"
check "rate limit -> 429" "[ \"\$(cat $EVID/ratelimit.code)\" = 429 ]"
check "birth date not in server log" "! grep -q '1985-11-03\|1985-13-45' $EVID/server.log"
echo "evidence: $EVID"; exit $fail
