// Handwritten copy for the chart tools. Same rules as copy.ts: no predictions, no em-dashes,
// no "magic", "cosmic", "destiny", "soulmate" or "manifest". Character and reflection only.
import type { Lang } from "./astro.js";
type T = Record<Lang, string>;

export const PLANET_NAME: Record<string, T> = {
  sun: { en: "Sun", nl: "Zon" }, moon: { en: "Moon", nl: "Maan" }, mercury: { en: "Mercury", nl: "Mercurius" },
  venus: { en: "Venus", nl: "Venus" }, mars: { en: "Mars", nl: "Mars" }, jupiter: { en: "Jupiter", nl: "Jupiter" },
  saturn: { en: "Saturn", nl: "Saturnus" }, uranus: { en: "Uranus", nl: "Uranus" }, neptune: { en: "Neptune", nl: "Neptunus" },
  pluto: { en: "Pluto", nl: "Pluto" },
};
/** What each planet describes, used as "{theme} {style}". */
export const PLANET_THEME: Record<string, T> = {
  sun: { en: "You show yourself", nl: "Je laat jezelf zien" },
  moon: { en: "You feel and look for safety", nl: "Je voelt en zoekt veiligheid" },
  mercury: { en: "You think and talk", nl: "Je denkt en praat" },
  venus: { en: "You love and enjoy", nl: "Je hebt lief en geniet" },
  mars: { en: "You go after what you want", nl: "Je gaat ergens voor" },
};
/** Short style per sign (works after PLANET_THEME). */
export const SIGN_STYLE: Record<string, T> = {
  aries: { en: "directly and fast, happiest at the start of something", nl: "direct en snel, het liefst aan het begin van iets" },
  taurus: { en: "steadily and through the senses, in your own good time", nl: "rustig en via de zintuigen, in je eigen tempo" },
  gemini: { en: "curiously and lightly, through words, questions and ideas", nl: "nieuwsgierig en licht, via woorden, vragen en ideeën" },
  cancer: { en: "protectively and with feeling, closest to the people you trust", nl: "beschermend en met gevoel, het meest bij mensen die je vertrouwt" },
  leo: { en: "warmly and generously, and you want it to be noticed", nl: "warm en gul, en je wilt dat het gezien wordt" },
  virgo: { en: "carefully and helpfully, catching the details others skip", nl: "zorgvuldig en behulpzaam, met oog voor details die anderen missen" },
  libra: { en: "fairly and gracefully, always weighing both sides", nl: "eerlijk en met stijl, altijd beide kanten afwegend" },
  scorpio: { en: "deeply and loyally, more than you show on the surface", nl: "diep en trouw, meer dan je aan de buitenkant laat zien" },
  sagittarius: { en: "openly and optimistically, always asking what it means", nl: "open en optimistisch, altijd op zoek naar wat het betekent" },
  capricorn: { en: "patiently and responsibly, in a way that is built to last", nl: "geduldig en verantwoordelijk, op een manier die blijft" },
  aquarius: { en: "independently and a little sideways, led by your ideals", nl: "onafhankelijk en een beetje dwars, op je eigen idealen" },
  pisces: { en: "softly and imaginatively, feeling a lot of what others feel", nl: "zacht en met verbeelding, en je voelt veel mee met anderen" },
};
export const ASPECT_NAME: Record<string, T> = {
  conjunction: { en: "conjunction", nl: "conjunctie" }, opposition: { en: "opposition", nl: "oppositie" },
  trine: { en: "trine", nl: "driehoek" }, square: { en: "square", nl: "vierkant" }, sextile: { en: "sextile", nl: "sextiel" },
};
export const ASPECT_MEANING: Record<string, T> = {
  conjunction: { en: "blend into one strong theme you will probably recognize", nl: "smelten samen tot één sterk thema dat je waarschijnlijk herkent" },
  opposition: { en: "pull in two directions, and finding the balance is the work", nl: "trekken twee kanten op, en de balans vinden is het werk" },
  trine: { en: "work together so easily you may not even notice it", nl: "werken zo makkelijk samen dat je het misschien niet eens merkt" },
  square: { en: "rub against each other, and that friction often builds strength", nl: "schuren, en juist dat bouwt vaak kracht op" },
  sextile: { en: "support each other once you start using them", nl: "steunen elkaar zodra je ze gebruikt" },
};
export const ELEMENT: Record<string, T> = {
  fire: { en: "fire (enthusiasm, action)", nl: "vuur (enthousiasme, actie)" },
  earth: { en: "earth (practical, steady)", nl: "aarde (praktisch, stevig)" },
  air: { en: "air (ideas, contact)", nl: "lucht (ideeën, contact)" },
  water: { en: "water (feeling, intuition)", nl: "water (gevoel, intuïtie)" },
};
export const SIGN_ELEMENT = ["fire", "earth", "air", "water"];

export const CU = {
  title: { en: "Birth chart", nl: "Geboortehoroscoop" } as T,
  positionsHead: { en: "Planets (tropical zodiac)", nl: "Planeten (tropische dierenriem)" } as T,
  asc: { en: "Ascendant {deg} {sign}, Midheaven {mc} {mcsign}. Houses: Whole Sign.", nl: "Ascendant {deg} {sign}, Medium Coeli {mc} {mcsign}. Huizen: Whole Sign (hele tekens)." } as T,
  noAsc: { en: "Ascendant and houses need both a birth time and a birth place.", nl: "Voor ascendant en huizen zijn zowel geboortetijd als geboorteplaats nodig." } as T,
  noTime: { en: "No birth time given, so positions are for 12:00 local time. The Moon moves about 13 degrees a day, so its degree is approximate.", nl: "Geen geboortetijd, dus de posities gelden voor 12:00 lokale tijd. De Maan beweegt ongeveer 13 graden per dag, dus haar graad is een schatting." } as T,
  moonUncertain: { en: "The Moon changed sign that day: {a} or {b}, depending on the birth time.", nl: "De Maan wisselde die dag van teken: {a} of {b}, afhankelijk van het geboortetijdstip." } as T,
  aspectsHead: { en: "Major aspects (orb)", nl: "Belangrijkste aspecten (orb)" } as T,
  readingHead: { en: "In short", nl: "In het kort" } as T,
  ascLine: { en: "With {sign} rising, this is often the version of you people meet first: {style}.", nl: "Met {sign} als ascendant is dit vaak de kant van jou die mensen als eerste zien: {style}." } as T,
  elementLine: { en: "Counting Sun to Saturn, with Sun and Moon counted double, your strongest element is {el}.", nl: "Als je Zon tot en met Saturnus telt, met Zon en Maan dubbel, is je sterkste element {el}." } as T,
  and: { en: " and ", nl: " en " } as T,
  aspectLine: { en: "Your closest aspect is {a} {asp} {b}: these two {meaning}.", nl: "Je nauwste aspect is {a} {asp} {b}: deze twee {meaning}." } as T,
  retro: { en: "R", nl: "R" } as T,
  transitsHead: { en: "Transits for {period}", nl: "Transits voor {period}" } as T,
  nowHead: { en: "Planets now", nl: "Planeten nu" } as T,
  transitList: { en: "Transits to your birth chart (orb, exact)", nl: "Transits naar je geboortehoroscoop (orb, exact)" } as T,
  noTransits: { en: "No tight transits to your birth chart in this period. A quiet stretch, which can be a good time to catch your breath.", nl: "Geen nauwe transits naar je geboortehoroscoop in deze periode. Een rustige tijd, en dat kan juist fijn zijn om even op adem te komen." } as T,
  transitLine: { en: "Transiting {t} {asp} your {n}: a good time to notice where {nTheme} and {tTheme} meet in your days.", nl: "Transit {t} {asp} je {n}: een goed moment om te merken waar {nTheme} en {tTheme} elkaar raken in je dagen." } as T,
  transitReflect: { en: "Use this as a mirror to think with, not as a forecast.", nl: "Gebruik dit als spiegel om mee na te denken, niet als voorspelling." } as T,
  synHead: { en: "Chart comparison", nl: "Horoscopen vergeleken" } as T,
  synList: { en: "Key connections (person A to person B, orb)", nl: "Belangrijkste verbindingen (persoon A naar persoon B, orb)" } as T,
  synNone: { en: "No close connections between the personal planets. That says nothing about how real your bond is, only that it does not show up in tight aspects.", nl: "Geen nauwe verbindingen tussen de persoonlijke planeten. Dat zegt niets over hoe echt jullie band is, alleen dat hij niet in nauwe aspecten zichtbaar is." } as T,
  synEasy: { en: "{n} flowing connections (trines, sextiles) and {h} tense ones (squares, oppositions), plus {c} conjunctions.", nl: "{n} soepele verbindingen (driehoeken, sextielen) en {h} spannende (vierkanten, opposities), plus {c} conjuncties." } as T,
  synElements: { en: "Sun signs: {a} and {b}.", nl: "Zonnetekens: {a} en {b}." } as T,
  synTop: { en: "The strongest link between you is A's {a} {asp} B's {b}: these {meaning}.", nl: "De sterkste link tussen jullie is {a} van A {asp} {b} van B: die {meaning}." } as T,
};
// Short theme nouns for transits/synastry.
export const PLANET_NOUN: Record<string, T> = {
  sun: { en: "your sense of self", nl: "je gevoel van wie je bent" }, moon: { en: "your feelings", nl: "je gevoel" },
  mercury: { en: "thinking and talking", nl: "denken en praten" }, venus: { en: "love and enjoyment", nl: "liefde en genieten" },
  mars: { en: "drive and action", nl: "drive en actie" }, jupiter: { en: "growth and trust", nl: "groei en vertrouwen" },
  saturn: { en: "structure and responsibility", nl: "structuur en verantwoordelijkheid" }, uranus: { en: "change and freedom", nl: "verandering en vrijheid" },
  neptune: { en: "imagination and sensitivity", nl: "verbeelding en gevoeligheid" }, pluto: { en: "depth and transformation", nl: "diepgang en verandering van binnenuit" },
};

// ---- Transit sentences: "{Influence} {verb} {natal noun}." All influences are singular nouns so verbs agree.
export const TRANSIT_INFLUENCE: Record<string, T> = {
  sun: { en: "extra attention", nl: "extra aandacht" }, mercury: { en: "fresh thinking", nl: "nieuw denkwerk" },
  venus: { en: "warmth", nl: "warmte" }, mars: { en: "drive", nl: "daadkracht" }, jupiter: { en: "growth", nl: "groei" },
  saturn: { en: "discipline", nl: "discipline" }, uranus: { en: "the urge to renew", nl: "de drang tot vernieuwing" },
  neptune: { en: "imagination", nl: "verbeelding" }, pluto: { en: "deep change", nl: "diepe verandering" },
};
export const TRANSIT_VERB: Record<string, T> = {
  conjunction: { en: "lands right on", nl: "komt precies op" }, sextile: { en: "gives a nudge to", nl: "geeft een zetje aan" },
  trine: { en: "quietly supports", nl: "ondersteunt rustig" }, square: { en: "rubs against", nl: "schuurt met" },
  opposition: { en: "pulls against", nl: "trekt aan" },
};
export const NATAL_NOUN: Record<string, T> = {
  sun: { en: "your sense of self", nl: "je zelfbeeld" }, moon: { en: "your feelings", nl: "je gevoel" },
  mercury: { en: "your thinking", nl: "je denken" }, venus: { en: "your relationships", nl: "je relaties" },
  mars: { en: "your willpower", nl: "je wilskracht" }, jupiter: { en: "your optimism", nl: "je optimisme" },
  saturn: { en: "your sense of responsibility", nl: "je verantwoordelijkheidsgevoel" }, uranus: { en: "your need for freedom", nl: "je behoefte aan vrijheid" },
  neptune: { en: "your dreams", nl: "je dromen" }, pluto: { en: "your deepest drives", nl: "je diepste drijfveren" },
  asc: { en: "the way you come across", nl: "hoe je overkomt" }, mc: { en: "your work and direction", nl: "je werk en richting" },
};
export const POINT_NAME: Record<string, T> = { asc: { en: "Ascendant", nl: "Ascendant" }, mc: { en: "Midheaven", nl: "MC" } };
export const TR = {
  sentence: { en: "{T} {asp} your {N} ({status}): {influence} {verb} {noun}.", nl: "{T} {asp} je {N} ({status}): {influence} {verb} {noun}." } as T,
  inWindow: { en: "exact on {date}", nl: "exact op {date}" } as T,
  wasExact: { en: "was exact on {date}, now separating", nl: "was exact op {date}, nu afnemend" } as T,
  willBeExact: { en: "building, exact on {date}", nl: "groeiend, exact op {date}" } as T,
  close: { en: "close to exact", nl: "dicht bij exact" } as T,
  intro: { en: "What stands out most:", nl: "Wat er het meest uitspringt:" } as T,
};
