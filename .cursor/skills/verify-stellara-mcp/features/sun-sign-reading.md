# get_sun_sign_reading

## Sub-features
- reading in en/nl; isError on invalid date

## How to get to it (user POV)
An assistant with the Stellara MCP connected calls the tool when the user asks for it.

## Driving it with curl (JSON-RPC)
Covered by scripts/verify-mcp.sh. Args: {"birth_date":"1985-11-03","language":"nl"}. Proof: structuredContent.sun_sign_key.

## Gotchas
Cusp days set sign_change_day=true.
