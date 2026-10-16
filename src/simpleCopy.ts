// Plain-language copy for the chart and transit readings (for people new to astrology).
// No jargon in the reading: no degrees, no aspect names, no "ascendant". Technical data lives in structuredContent.
import type { Lang } from "./astro.js";
type T = Record<Lang, string>;

/** Two everyday traits per sign. */
export const TRAITS: Record<string, T> = {
  aries: { en: "brave, and you say what you mean", nl: "moedig en direct" }, taurus: { en: "calm, steady and loyal to your people", nl: "rustig en trouw" },
  gemini: { en: "curious, chatty and always asking why", nl: "nieuwsgierig en spraakzaam" }, cancer: { en: "caring, and you notice how others feel", nl: "zorgzaam en gevoelig" },
  leo: { en: "warm, proud and big-hearted", nl: "warm en trots" }, virgo: { en: "careful, helpful and quick to spot what needs fixing", nl: "zorgvuldig en behulpzaam" },
  libra: { en: "fair, friendly and good at keeping the peace", nl: "eerlijk en sociaal" }, scorpio: { en: "deep, loyal and hard to fool", nl: "diep en loyaal" },
  sagittarius: { en: "open, honest and hungry for new places", nl: "open en avontuurlijk" }, capricorn: { en: "serious, and you do not give up", nl: "serieus en volhardend" },
  aquarius: { en: "independent, and happy to do things your own way", nl: "eigenzinnig en vrij" }, pisces: { en: "gentle, and you often know things without being told", nl: "zacht en invoelend" },
};
export const ELEMENT_SIMPLE: Record<string, T> = {
  fire: { en: "There is a lot of fire in your chart: you have plenty of energy and enthusiasm.", nl: "Er zit veel vuur in je kaart: je hebt veel energie en enthousiasme." },
  earth: { en: "There is a lot of earth in your chart: you are practical and down to earth.", nl: "Er zit veel aarde in je kaart: je bent praktisch en nuchter." },
  air: { en: "There is a lot of air in your chart: you love ideas and good conversations.", nl: "Er zit veel lucht in je kaart: je houdt van ideeën en goede gesprekken." },
  water: { en: "There is a lot of water in your chart: you are sensitive and pick up a lot.", nl: "Er zit veel water in je kaart: je bent gevoelig en pikt veel op." },
};
export const S = {
  sun: { en: "Your sun is in {sign}. This is the part of you that stays the same, deep down: {traits}.", nl: "Je zon staat in {sign}. Dat zegt iets over wie je ten diepste bent: {traits}." } as T,
  moon: { en: "Your moon is in {sign}. When it comes to feelings, {traits}.", nl: "Je maan staat in {sign}. Met gevoelens geldt: {traits}." } as T,
  moonUnsure: { en: "Your moon is in {a} or {b}. Your birth time tells us which one.", nl: "Je maan staat in {a} of {b}. Dat hangt af van je geboortetijd." } as T,
  rising: { en: "Your rising sign is {sign}. When people first meet you, you come across as {traits}.", nl: "Je rijzend teken is {sign}. Bij een eerste ontmoeting kom je over als {traits}." } as T,
  noRising: { en: "Add your birth time and place, and we can also show you how people see you when they first meet you.", nl: "Met je geboortetijd en -plaats kunnen we ook laten zien hoe anderen je eerst zien." } as T,
  loveDrive: { en: "In love you are {venus}. When you really want something, {mars}.", nl: "In de liefde ben je {venus}. Als je iets wilt, {mars}." } as T,
  loveDriveSame: { en: "In love, and when you really want something, you are {venus}.", nl: "In de liefde, en als je iets wilt, ben je {venus}." } as T,
  imageNote: { en: "Your chart as a picture: {url}", nl: "Afbeelding van je kaart: {url}" } as T,
  // transits
  headToday: { en: "What is going on for you on {date}:", nl: "Dit speelt er voor jou op {date}:" } as T,
  headWeek: { en: "What is going on for you from {from} to {to}:", nl: "Dit speelt er voor jou van {from} t/m {to}:" } as T,
  brings: { en: "{planet} brings {influence}.", nl: "{planet} brengt {influence}." } as T,
  quiet: { en: "Nothing big is touching your chart right now. A calm stretch, so take the chance to rest.", nl: "Er speelt nu niets groots in je kaart. Een rustige tijd, fijn om even op adem te komen." } as T,
  reflect: { en: "Use it as a mirror to think about your life, not as a forecast.", nl: "Zie het als spiegel, niet als voorspelling." } as T,
  tInWindow: { en: "It is strongest on {date}.", nl: "Het is het sterkst op {date}." } as T,
  tSeparating: { en: "It peaked on {date} and is fading now.", nl: "Het hoogtepunt was op {date}, het zwakt nu af." } as T,
  tApplying: { en: "It keeps growing until {date}.", nl: "Het groeit nog tot {date}." } as T,
  tNear: { en: "You may notice this right now.", nl: "Dit speelt nu volop." } as T,
};
export const PLANET_PLAIN: Record<string, T> = {
  sun: { en: "The Sun", nl: "De zon" }, mercury: { en: "Mercury", nl: "Mercurius" }, venus: { en: "Venus", nl: "Venus" },
  mars: { en: "Mars", nl: "Mars" }, jupiter: { en: "Jupiter", nl: "Jupiter" }, saturn: { en: "Saturn", nl: "Saturnus" },
  uranus: { en: "Uranus", nl: "Uranus" }, neptune: { en: "Neptune", nl: "Neptunus" }, pluto: { en: "Pluto", nl: "Pluto" },
};
export const INFLUENCE_PLAIN: Record<string, T> = {
  sun: { en: "extra attention", nl: "extra aandacht" }, mercury: { en: "fresh ideas", nl: "nieuwe ideeën" },
  venus: { en: "warmth", nl: "warmte" }, mars: { en: "energy", nl: "energie" }, jupiter: { en: "growth", nl: "groei" },
  saturn: { en: "discipline", nl: "discipline" }, uranus: { en: "renewal", nl: "vernieuwing" },
  neptune: { en: "imagination", nl: "verbeelding" }, pluto: { en: "deep change", nl: "diepe verandering" },
};
/** Second sentence by kind of contact: easy (trine/sextile), strong (conjunction), tense (square/opposition). */
export const CONTACT: Record<string, T> = {
  easy: { en: "That gives {noun} a gentle push.", nl: "Dat geeft {noun} een zetje." },
  strong: { en: "That puts the spotlight on {noun}.", nl: "Dat komt precies op {noun}." },
  tense: { en: "That pushes against {noun} a little.", nl: "Dat schuurt met {noun}." },
};
export const NOUN_PLAIN: Record<string, T> = {
  sun: { en: "your sense of self", nl: "je zelfbeeld" }, moon: { en: "your feelings", nl: "je gevoel" },
  mercury: { en: "your thinking", nl: "je denken" }, venus: { en: "your relationships", nl: "je relaties" },
  mars: { en: "your willpower", nl: "je wilskracht" }, jupiter: { en: "your optimism", nl: "je optimisme" },
  saturn: { en: "your sense of duty", nl: "je plichtsgevoel" }, uranus: { en: "your need for freedom", nl: "je behoefte aan vrijheid" },
  neptune: { en: "your dreams", nl: "je dromen" }, pluto: { en: "your deepest drives", nl: "je diepste drijfveren" },
  asc: { en: "the way you come across", nl: "je uitstraling" }, mc: { en: "your work and direction", nl: "je werk en richting" },
};

// ---- Celebrity match (playful, plain, nothing about private life)
export const CELEB = {
  head: { en: "You and {name}: a {score}% star match ✨", nl: "Jij en {name}: {score}% sterrenmatch ✨" } as T,
  band: {
    en: ["Opposites who keep each other on their toes.", "A fun mix that never gets boring.", "You two just click.", "Practically star twins!"],
    nl: ["Tegenpolen die elkaar scherp houden.", "Een leuke mix.", "Een sterke klik.", "Sterrentweeling!"],
  } as Record<Lang, string[]>,
  suns: { en: "Your sun is in {a}, and {name}'s is in {b}.", nl: "Jouw zon staat in {a}, die van {name} in {b}." } as T,
  sameEl: { en: "You are both {el} signs, so you often get each other without saying a word.", nl: "Allebei {el}tekens: jullie snappen elkaar vaak zonder woorden." } as T,
  goodEl: { en: "{a} and {b} go well together: you fill in what the other one is missing.", nl: "{a} en {b} gaan goed samen: jullie vullen elkaar aan." } as T,
  diffEl: { en: "{a} and {b} are very different, which means you can learn a lot from each other.", nl: "{a} en {b} zijn heel verschillend: jullie kunnen veel van elkaar leren." } as T,
  link: { en: "Your {a} and {name}'s {b} {verb}.", nl: "Jouw {a} en {b} van {name} {verb}." } as T,
  dateOnly: { en: "We only know the day {name} was born, not the time, so we leave out first impressions and the finer details.", nl: "We kennen alleen de geboortedatum van {name}, dus het rijzend teken en de huizen laten we weg." } as T,
  lowConf: { en: "Sources disagree about when {name} was born, so take this with a pinch of salt.", nl: "Bronnen zijn het niet eens over de geboortedatum van {name}, dus neem dit met een korrel zout." } as T,
  privacy: { en: "Just for fun: this is about your stars, not anyone's private life.", nl: "Gewoon voor de lol: dit gaat over jullie sterren, niet over iemands privéleven." } as T,
  share: { en: "Share it on X: {url}", nl: "Deel het op X: {url}" } as T,
  shareText: { en: "My stars are a {score}% match with {name} ✨ Who's yours?", nl: "Mijn sterren matchen voor {score}% met {name} ✨ Wat is jouw match?" } as T,
};
export const EL_NAME: Record<string, T> = {
  fire: { en: "fire", nl: "vuur" }, earth: { en: "earth", nl: "aarde" }, air: { en: "air", nl: "lucht" }, water: { en: "water", nl: "water" },
};
// nl values carry their article (de/het); the user's side strips it ("jouw kern").
export const BARE_NOUN: Record<string, T> = {
  sun: { en: "core", nl: "de kern" }, moon: { en: "feelings", nl: "het gevoel" }, mercury: { en: "way of thinking", nl: "de manier van denken" },
  venus: { en: "love style", nl: "de liefdesstijl" }, mars: { en: "drive", nl: "de drive" }, jupiter: { en: "optimism", nl: "het optimisme" },
  saturn: { en: "sense of duty", nl: "het plichtsgevoel" }, uranus: { en: "need for freedom", nl: "de vrijheidsdrang" },
  neptune: { en: "dreams", nl: "de dromen" }, pluto: { en: "deepest drives", nl: "de diepste drijfveren" },
};
export const LINK_VERB: Record<string, T> = {
  easy: { en: "go together easily", nl: "gaan makkelijk samen" },
  strong: { en: "are completely in sync", nl: "zitten helemaal op één lijn" },
  tense: { en: "rub a little, which keeps it interesting", nl: "schuren een beetje, en dat houdt het spannend" },
};

// Separate word sets per placement so one reading never repeats a phrase (sun uses TRAITS).
const W = (en: string, nl: string): T => ({ en, nl });
/** How you deal with feelings. */
export const MOON_WORDS: Record<string, T> = {
  aries: W("you feel things fast and let them go fast", "snel geraakt, snel weer verder"), taurus: W("you need calm, comfort and a little time", "je hebt rust en comfort nodig"),
  gemini: W("you understand them best by talking them through", "je praat gevoelens uit"), cancer: W("you need a real home and your people close by", "je hebt een thuis en dierbaren nodig"),
  leo: W("you want warmth, and you want to be noticed", "je wilt warmte en gezien worden"), virgo: W("you feel safest when things are in order", "je voelt je veilig als alles op orde is"),
  libra: W("you need peace around you, and fights drain you", "je hebt harmonie om je heen nodig"), scorpio: W("you feel very deeply, but mostly in private", "je voelt intens, vaak in stilte"),
  sagittarius: W("you need freedom and something new to look forward to", "je hebt vrijheid en wat avontuur nodig"), capricorn: W("you keep them under control and show them to only a few", "je houdt je gevoelens in de hand"),
  aquarius: W("you need room to be yourself, without anyone crowding you", "je hebt ruimte nodig om jezelf te zijn"), pisces: W("you soak up what everyone around you is feeling", "je voelt mee met iedereen om je heen"),
};
/** First impression (rising sign). */
export const RISING_WORDS: Record<string, T> = {
  aries: W("full of energy and straight to the point", "energiek en recht voor zijn raap"), taurus: W("calm, friendly and easy to trust", "rustig, vriendelijk en stabiel"),
  gemini: W("lively, funny and quick with words", "levendig en gevat"), cancer: W("soft and easy to open up to", "zacht en benaderbaar"),
  leo: W("bright and sure of yourself", "stralend en zelfverzekerd"), virgo: W("neat, modest and paying close attention", "verzorgd, bescheiden en oplettend"),
  libra: W("charming and easy to talk to", "charmant en makkelijk in de omgang"), scorpio: W("a bit mysterious and a little intense", "mysterieus en een tikje intens"),
  sagittarius: W("cheerful, open and ready for anything", "vrolijk en open"), capricorn: W("serious, grown-up and someone people can count on", "serieus en betrouwbaar"),
  aquarius: W("a bit different, in a good way", "net even anders, op een leuke manier"), pisces: W("dreamy, gentle and kind", "dromerig en zachtaardig"),
};
/** In love. */
export const LOVE_WORDS: Record<string, T> = {
  aries: W("passionate and quick to make the first move", "vurig en neemt snel het initiatief"), taurus: W("loyal, cuddly and in no hurry", "trouw en aanhankelijk"),
  gemini: W("playful, and talking is how you flirt", "speels en praatgraag"), cancer: W("caring and protective of the people you love", "zorgzaam en beschermend"),
  leo: W("generous, romantic and big on gestures", "gul en romantisch"), virgo: W("loving in small, practical ways", "attent in kleine, praktische dingen"),
  libra: W("sweet and happiest when things feel equal", "lief en op zoek naar balans"), scorpio: W("all in, deep and loyal", "helemaal toegewijd, diep en trouw"),
  sagittarius: W("fun, and you need room to breathe", "gezellig en vrijheidslievend"), capricorn: W("faithful and in it for the long run", "trouw en voor de lange termijn"),
  aquarius: W("friends first, then more", "eerst vrienden, dan meer"), pisces: W("romantic, dreamy and very giving", "romantisch en dromerig"),
};
/** When you want something. */
export const DRIVE_WORDS: Record<string, T> = {
  aries: W("you go straight for it", "ga je er recht op af"), taurus: W("you keep going, calmly, until it works", "ga je rustig door tot het lukt"),
  gemini: W("you try a few things at once and see what sticks", "probeer je meerdere dingen tegelijk"), cancer: W("you fight hardest when it is for your people", "ga je ervoor om je mensen te beschermen"),
  leo: W("you go for it with your whole heart, and some style", "ga je ervoor met hart en flair"), virgo: W("you make a careful plan first", "plan je het zorgvuldig"),
  libra: W("you look for a way that is fair to everyone", "zoek je de eerlijke weg"), scorpio: W("you do not let go", "laat je niet meer los"),
  sagittarius: W("you aim high and think big", "mik je hoog"), capricorn: W("you work toward it step by step", "werk je er stap voor stap naartoe"),
  aquarius: W("you do it your own way, not the usual way", "doe je het op je eigen manier"), pisces: W("you follow your gut", "volg je je gevoel"),
};
