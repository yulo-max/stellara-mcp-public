# get_birth_chart

## Sub-features
- planets, houses with time+place; chart_image_url (random server-side id); share_url

## How to get to it (user POV)
An assistant with the Stellara MCP connected calls the tool when the user asks for it.

## Driving it with curl (JSON-RPC)
Args {"birth_date":"1985-11-03","birth_time":"07:10","birth_place":"Rotterdam"}; then GET the returned chart_image_url (/chart.png?id=<random id>&lang=..; unknown id -> 404) -> PNG. The old ?date= form returns 400.

## Gotchas
Unknown places (Springfield) -> 400. Chiron only 1900-2100. Output contains mcp.mystellara.com links (own host; bare mystellara.com is forbidden, see test/invariants.test.ts).
