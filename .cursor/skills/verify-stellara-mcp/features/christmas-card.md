# create_christmas_star_card

## Sub-features
- card text in third person; SVG image; recipient_name max 40

## How to get to it (user POV)
An assistant with the Stellara MCP connected calls the tool when the user asks for it.

## Driving it with curl (JSON-RPC)
Covered by scripts/verify-mcp.sh. Proof: card_text and an image/png content item (hosts reject SVG image blocks).

## Gotchas
Over-long recipient_name returns a validation error.
