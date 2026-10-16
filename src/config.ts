// CENTRAL CONFIG: tool names, titles, descriptions and field descriptions.
// Output texts/templates live in src/copy.ts. Change names here only.
export const DEFAULT_LANGUAGE = "en" as const;

export const TOOLS = {
  reading: {
    name: "get_sun_sign_reading",
    title: "Stellara Sun Sign Reading",
    description:
      "Returns a short, free reading based only on a birth date: sun sign (simple date table) and Pythagorean life path number, with a few sentences about character. No predictions, no personal data stored.",
  },
  card: {
    name: "create_christmas_star_card",
    title: "Stellara Christmas Star Card",
    description:
      "Creates a festive Christmas card (text plus SVG image) about someone, from their birth date and optional first name: sun sign and life path number, described as character, not prediction. The card text talks about the recipient in the third person (by name, or neutrally without a name). No personal data stored.",
  },
  chart: {
    name: "get_birth_chart",
    title: "Stellara Birth Chart",
    description:
      "Computes a real birth chart from astronomical positions (tropical zodiac): Sun to Pluto with sign, degree and retrograde flag, major aspects with orbs, and a short character-focused interpretation. Ascendant, Midheaven and Whole Sign houses only when birth time and place are both given. Without a time the Moon is flagged as approximate. No predictions, nothing stored.",
  },
  transits: {
    name: "get_transits",
    title: "Stellara Transits",
    description:
      "Shows where the planets are now (or on a given UTC date) and which major transits they make to a person's birth chart, with orbs and exact dates, for one day or a 7-day week. Short reflective interpretation, no predictions, nothing stored.",
  },
  synastry: {
    name: "compare_charts",
    title: "Stellara Chart Comparison (Synastry)",
    description:
      "Compares two birth charts (synastry): the closest aspects between person A's and person B's planets, with orbs and a short, balanced summary. Birth times and places are optional. Instead of person_b you can pass `celebrity` (name or X handle, see list_celebrities) for a playful star match with a score and a share text for X. No predictions, nothing stored.",
  },
  celebs: {
    name: "list_celebrities",
    title: "Stellara Famous People",
    description:
      "Lists the famous people you can compare charts with in compare_charts (about 1000 most-followed real people on X, birth dates from Wikidata cross-checked with Grokipedia). Optional search query (name, handle or description such as 'singer'); returns up to 25, most followed first. Most are date-only.",
  },
} as const;

export const FIELDS = {
  birth_date: "Birth date in YYYY-MM-DD format, for example 1988-03-14. Birth time and place are not needed.",
  language: "Language of the text: 'en' (default) or 'nl'.",
  recipient_name: "Optional first name of the person the card is for. Letters, spaces, hyphens and apostrophes only, max 40 characters. The card is written about this person in the third person. Leave empty for a card without a name.",
  birth_date_chart: "Birth date in YYYY-MM-DD format, for example 1988-03-14.",
  birth_time: "Optional local birth time, HH:MM 24-hour, for example 07:45. Needed for Ascendant, houses and an exact Moon.",
  birth_place: "Optional birth place: any town worldwide with 1000+ inhabitants (offline GeoNames list, CC BY 4.0), Dutch names like 'Den Haag' or 'Keulen' work. Add region or country when a name is common, e.g. 'Springfield, Illinois' or 'Hengelo, Gelderland'. Alternatively give latitude, longitude and timezone.",
  latitude: "Optional birth latitude in decimal degrees (north positive), used instead of birth_place.",
  longitude: "Optional birth longitude in decimal degrees (east positive), used instead of birth_place.",
  timezone: "IANA timezone of the birth place, for example Europe/Amsterdam. Required with latitude/longitude; historical daylight saving time is handled automatically.",
  date: "Optional UTC date YYYY-MM-DD to look at. Default: today (UTC).",
  period: "'today' (default) or 'week' (7 days starting at date).",
  person: "Birth data of one person.",
  celebrity: "Optional: name or X handle of a famous person from list_celebrities (for example 'Elon Musk' or '@elonmusk'). Use instead of person_b.",
  celeb_query: "Optional search text, for example 'singer' or 'Taylor'.",
} as const;

/** Browser Origins allowed to call /mcp. Requests without Origin (server-to-server clients) are allowed. */
export function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}
