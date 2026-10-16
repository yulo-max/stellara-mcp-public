# compare_charts

## Sub-features
- person_a vs person_b; person_a vs celebrity (1000 from X); share card

## How to get to it (user POV)
An assistant with the Stellara MCP connected calls the tool when the user asks for it.

## Driving it with curl (JSON-RPC)
Args {"person_a":{"birth_date":"1985-11-03"},"celebrity":"Elon Musk"}. Proof: score in structuredContent, share_page_url opens /s/match HTML.

## Gotchas
Celebrities have no birth time: Moon may be unknown.
