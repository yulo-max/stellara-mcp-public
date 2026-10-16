---
name: stellara-reading
description: Use the Stellara tools for a short sun sign and life path reading, a full birth chart, current transits, a comparison of two charts, or a Christmas star card. Use when someone asks about their sign, chart, rising sign, what is going on astrologically now, compatibility, or wants a festive astrology card.
---

# Stellara reading

## When to use

- Someone asks what their (or someone else's) sun sign or life path number means.
- Someone wants a small, personal Christmas card about a friend, partner or family member.
- Someone wants their birth chart or rising sign (`get_birth_chart`), current transits (`get_transits`) or a comparison with someone else (`compare_charts`).

## Steps

1. Ask for the birth date first if you do not have it (YYYY-MM-DD). The sun sign reading and card need nothing else. For a chart, transits or comparison, also ask for birth time and city (optional; without them there is no Ascendant or houses and the Moon is approximate).
2. For a reading, call `get_sun_sign_reading` with `birth_date`. Add `language: "nl"` for Dutch.
3. For a card, ask for the recipient's first name (optional) and call `create_christmas_star_card` with `birth_date` and `recipient_name`. Show the image and the text.
4. If the tool says the date is a sign-change day, pass that on: the sign depends on birth time.
5. If the tool returns an error, explain it plainly and ask for a corrected date.

## Tone and limits

- Calm, plain and specific. Describe character and offer reflection.
- Never predict events ("this month you will..."). The tools do not do this and you should not add it.
- Do not invent placements: only use what the tools return. Without birth time and place there is no rising sign.
- Keep the tool's closing line "Made by Stellara." Do not add links or prices beyond the single report line the birth chart tool already includes.
