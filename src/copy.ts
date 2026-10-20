// Handwritten copy. Rules: no predictions, no em-dashes, no "magic", "cosmic",
// "destiny", "soulmate" or "manifest". Character and reflection only.
import type { Lang } from "./astro.js";

type T = Record<Lang, string>;

export const SIGN_TEXT: Record<string, T> = {
  aries: {
    nl: "Astrologen koppelen de Ram aan beginnen: eerst doen, dan bijsturen. Met deze zon zeg je meestal gewoon wat je denkt, durf je eerder dan anderen, en ben je snel boos maar ook snel weer klaar.",
    en: "Astrologers link Aries with beginnings: act first, adjust later. With this sun you tend to say what you think, move before others do, and flare up fast but let it go just as fast.",
  },
  taurus: {
    nl: "De Stier draait om rust, je zintuigen en dingen die blijven. Met deze zon ben je geduldig en trouw, en wat anderen koppig noemen is vaak gewoon dat je iets goed wilt doen.",
    en: "Taurus is about steadiness, the senses and things that last. With this sun you are patient and loyal, and what others call stubborn is often just you caring about doing it right.",
  },
  gemini: {
    nl: "De Tweelingen draaien op nieuwsgierigheid. Met deze zon leg je verbanden die anderen missen, praat je graag, en zie je twee kanten van een zaak tegelijk.",
    en: "Gemini runs on curiosity. With this sun you connect ideas other people miss, you enjoy a good conversation, and you can hold two sides of a question at once.",
  },
  cancer: {
    nl: "De Kreeft gaat over thuis en over je mensen. Met deze zon ben je beschermend en gevoelig, en voel je de sfeer in een kamer al voordat iemand iets zegt.",
    en: "Cancer is about home and the people who belong to it. With this sun you are protective and sensitive, and you pick up the mood in a room before anyone says a word.",
  },
  leo: {
    nl: "De Leeuw wordt geregeerd door de Zon zelf. Met deze zon ben je warm, trots en gul, en wil je iets maken waar je echt achter kunt staan.",
    en: "Leo is ruled by the Sun itself. With this sun you are warm, proud and generous, and you want to make something you can stand behind.",
  },
  virgo: {
    nl: "De Maagd let op details omdat details ertoe doen. Met deze zon ben je behulpzaam, kritisch en praktisch, en zie je meteen hoe iets beter kan.",
    en: "Virgo notices details because details matter. With this sun you are helpful, discerning and practical, and you spot right away how something could work better.",
  },
  libra: {
    nl: "De Weegschaal zoekt evenwicht, in relaties en in oordelen. Met deze zon heb je gevoel voor stijl en eerlijkheid, en breng je mensen liever samen dan dat je kiest tussen ze.",
    en: "Libra looks for balance, in relationships and in judgment. With this sun you have a feel for style and fairness, and you would rather bring people together than pick a side.",
  },
  scorpio: {
    nl: "De Schorpioen gaat de diepte in. Met deze zon ben je intens en loyaal, en zie je vaak precies wat er onder de oppervlakte speelt.",
    en: "Scorpio goes deep. With this sun you are intense and loyal, and you often see exactly what is going on below the surface.",
  },
  sagittarius: {
    nl: "De Boogschutter wil verder kijken, letterlijk en figuurlijk. Met deze zon ben je optimistisch en eerlijk, en heb je honger naar betekenis en ruimte om te bewegen.",
    en: "Sagittarius wants to see further, literally and figuratively. With this sun you are optimistic and honest, hungry for meaning and room to move.",
  },
  capricorn: {
    nl: "De Steenbok bouwt voor de lange termijn. Met deze zon neem je verantwoordelijkheid, zet je door, en heb je een droge humor die mensen pas later doorhebben.",
    en: "Capricorn builds for the long run. With this sun you take responsibility, you keep going, and your dry humor is the kind people only catch later.",
  },
  aquarius: {
    nl: "De Waterman denkt vooruit en een beetje dwars. Met deze zon ben je onafhankelijk en idealistisch, en hangen je vriendschappen niet af van wat gebruikelijk is.",
    en: "Aquarius thinks ahead and slightly sideways. With this sun you are independent and idealistic, and your friendships do not depend on what is usual.",
  },
  pisces: {
    nl: "De Vissen nemen de wereld in zich op. Met deze zon voel je goed aan wat anderen voelen, heb je veel verbeelding, en is je zachtheid vaak sterker dan mensen denken.",
    en: "Pisces takes the world in. With this sun you feel what others feel, you have a big imagination, and your gentleness is often stronger than people expect.",
  },
};

export const LIFE_PATH_TEXT: Record<number, T> = {
  1: { nl: "Levenspad 1 staat in de numerologie voor zelfstandigheid en het lef om je eigen weg te kiezen.", en: "Life path 1 stands for independence and the nerve to choose your own way." },
  2: { nl: "Levenspad 2 staat voor samenwerken, tact en een fijn gevoel voor wat anderen nodig hebben, vaak nog voor ze het zelf weten.", en: "Life path 2 stands for cooperation, tact and a fine sense of what others need, often before they know it themselves." },
  3: { nl: "Levenspad 3 staat voor expressie: praten, schrijven, maken en anderen aan het lachen krijgen.", en: "Life path 3 stands for expression: talking, writing, making things and making people laugh." },
  4: { nl: "Levenspad 4 staat voor structuur, betrouwbaarheid en de voldoening van iets stevigs neerzetten.", en: "Life path 4 stands for structure, reliability and the satisfaction of building something solid." },
  5: { nl: "Levenspad 5 staat voor vrijheid, verandering en leren door het zelf mee te maken.", en: "Life path 5 stands for freedom, change and learning by doing it yourself." },
  6: { nl: "Levenspad 6 staat voor zorg, verantwoordelijkheid en een sterk gevoel voor thuis.", en: "Life path 6 stands for care, responsibility and a strong sense of home." },
  7: { nl: "Levenspad 7 staat voor onderzoek, rust en de behoefte om dingen echt te snappen.", en: "Life path 7 stands for study, quiet and the need to really understand things." },
  8: { nl: "Levenspad 8 staat voor ambitie, organiseren en goed omgaan met verantwoordelijkheid.", en: "Life path 8 stands for ambition, organization and handling responsibility well." },
  9: { nl: "Levenspad 9 staat voor ruimhartigheid, idealisme en oog voor het grotere geheel.", en: "Life path 9 stands for generosity, idealism and an eye for the bigger picture." },
  11: { nl: "Levenspad 11 is een meestergetal en staat voor intuïtie, gevoeligheid en anderen inspireren.", en: "Life path 11 is a master number and stands for intuition, sensitivity and inspiring others." },
  22: { nl: "Levenspad 22 is een meestergetal en staat voor grote ideeën echt handen en voeten geven.", en: "Life path 22 is a master number and stands for turning big ideas into practical work." },
  33: { nl: "Levenspad 33 is een meestergetal en staat voor zorgen en lesgeven op een grotere schaal.", en: "Life path 33 is a master number and stands for care and teaching on a wider scale." },
};

export const UI = {
  sun: { nl: "Zon in", en: "Sun in" } as T,
  lifePath: { nl: "Levenspad", en: "Life path" } as T,
  cusp: {
    nl: "Op deze dag wisselt de zon van teken. Of je {a} of {b} bent, hangt af van je geboortetijd en het jaar.",
    en: "The sun changes sign on this day. Whether you are {a} or {b} depends on your birth time and year.",
  } as T,
  rules: { nl: "{sign} is een {element}, geregeerd door {ruler}.", en: "{sign} is {element} ruled by {ruler}." } as T,
  footer: { nl: "Gemaakt door Stellara. Voor zelfreflectie, geen voorspellingen.", en: "Made by Stellara. For self-reflection, not predictions." } as T,
  cardTitle: { nl: "Christmas Stars", en: "Christmas Stars" } as T,
  cardFor: { nl: "Voor {naam}", en: "For {naam}" } as T,
  cardNoName: { nl: "Een kerstkaart van Stellara", en: "A Christmas card from Stellara" } as T,
  cardClose: {
    nl: "Fijne feestdagen, en een goed nieuw jaar met de mensen die het meest dierbaar zijn.",
    en: "Warm wishes for the holidays, and a good new year with the people who matter most.",
  } as T,
  badName: {
    nl: "Gebruik voor de naam alleen letters, spaties, koppeltekens en apostroffen, maximaal 40 tekens.",
    en: "Use only letters, spaces, hyphens and apostrophes in the name, max 40 characters.",
  } as T,
};

// ---- Christmas card: third person about the recipient ({wie} = name, or a neutral subject without a name).
// Every sentence starts with {wie}, so the same template works for "Anna" and "Someone born under Capricorn".
export const CARD = {
  subjectNoName: { nl: "Wie onder {sign} geboren is,", en: "Someone born under {sign}" } as T,
  cusp: {
    nl: "Op deze dag wisselt de zon van teken. Of {naam} {a} of {b} is, hangt af van de geboortetijd en het jaar.",
    en: "The sun changes sign on this day. Whether {naam} is {a} or {b} depends on the birth time and year.",
  } as T,
  cuspNoName: {
    nl: "Op deze dag wisselt de zon van teken. Of iemand die dan geboren is {a} of {b} is, hangt af van de geboortetijd en het jaar.",
    en: "The sun changes sign on this day. Whether someone born on it is {a} or {b} depends on the birth time and year.",
  } as T,
  lifePath: { nl: "{naam} heeft levenspad {n}. In de numerologie staat dat voor {meaning}.", en: "{naam} has life path {n}, which stands for {meaning}." } as T,
  lifePathMaster: { nl: "{naam} heeft levenspad {n}, een meestergetal dat staat voor {meaning}.", en: "{naam} has life path {n}, a master number that stands for {meaning}." } as T,
  lifePathNoName: { nl: "Levenspad {n} staat in de numerologie voor {meaning}.", en: "Life path {n} stands for {meaning}." } as T,
  lifePathMasterNoName: { nl: "Levenspad {n} is een meestergetal en staat voor {meaning}.", en: "Life path {n} is a master number and stands for {meaning}." } as T,
};

export const CARD_SIGN_TEXT: Record<string, T> = {
  aries: {
    nl: "Astrologen koppelen de Ram aan beginnen: eerst doen, dan bijsturen. {wie} zegt meestal gewoon waar het op staat, durft eerder dan anderen, en is snel boos maar ook snel weer klaar.",
    en: "Astrologers link Aries with beginnings: act first, adjust later. {wie} tends to say things straight, moves before others do, and flares up fast but lets it go just as fast.",
  },
  taurus: {
    nl: "De Stier draait om rust, de zintuigen en dingen die blijven. {wie} is geduldig en trouw, en wat anderen koppig noemen, is vaak gewoon de wens om iets goed te doen.",
    en: "Taurus is about steadiness, the senses and things that last. {wie} is patient and loyal, and what others call stubborn is often just caring about doing it right.",
  },
  gemini: {
    nl: "De Tweelingen draaien op nieuwsgierigheid. {wie} legt verbanden die anderen missen, praat graag, en ziet twee kanten van een zaak tegelijk.",
    en: "Gemini runs on curiosity. {wie} connects ideas other people miss, enjoys a good conversation, and can hold two sides of a question at once.",
  },
  cancer: {
    nl: "De Kreeft gaat over thuis en over de eigen mensen. {wie} is beschermend en gevoelig, en voelt de sfeer in een kamer al voordat iemand iets zegt.",
    en: "Cancer is about home and the people who belong to it. {wie} is protective and sensitive, and picks up the mood in a room before anyone says a word.",
  },
  leo: {
    nl: "De Leeuw wordt geregeerd door de Zon zelf. {wie} is warm, trots en gul, en wil iets neerzetten om echt trots op te zijn.",
    en: "Leo is ruled by the Sun itself. {wie} is warm, proud and generous, and wants to make something worth standing behind.",
  },
  virgo: {
    nl: "De Maagd let op details omdat details ertoe doen. {wie} is behulpzaam, kritisch en praktisch, en ziet meteen hoe iets beter kan.",
    en: "Virgo notices details because details matter. {wie} is helpful, discerning and practical, and spots right away how something could work better.",
  },
  libra: {
    nl: "De Weegschaal zoekt evenwicht, in relaties en in oordelen. {wie} heeft gevoel voor stijl en eerlijkheid, en brengt mensen liever samen dan te kiezen tussen ze.",
    en: "Libra looks for balance, in relationships and in judgment. {wie} has a feel for style and fairness, and would rather bring people together than pick a side.",
  },
  scorpio: {
    nl: "De Schorpioen gaat de diepte in. {wie} is intens en loyaal, en ziet vaak precies wat er onder de oppervlakte speelt.",
    en: "Scorpio goes deep. {wie} is intense and loyal, and often sees exactly what is going on below the surface.",
  },
  sagittarius: {
    nl: "De Boogschutter wil verder kijken, letterlijk en figuurlijk. {wie} is optimistisch en eerlijk, met honger naar betekenis en ruimte om te bewegen.",
    en: "Sagittarius wants to see further, literally and figuratively. {wie} is optimistic and honest, hungry for meaning and room to move.",
  },
  capricorn: {
    nl: "De Steenbok bouwt voor de lange termijn. {wie} neemt verantwoordelijkheid, zet door, en heeft een droge humor die mensen pas later doorhebben.",
    en: "Capricorn builds for the long run. {wie} takes responsibility, keeps going, and has the kind of dry humor people only catch later.",
  },
  aquarius: {
    nl: "De Waterman denkt vooruit en een beetje dwars. {wie} is onafhankelijk en idealistisch, met vriendschappen die niet afhangen van wat gebruikelijk is.",
    en: "Aquarius thinks ahead and slightly sideways. {wie} is independent and idealistic, with friendships that do not depend on what is usual.",
  },
  pisces: {
    nl: "De Vissen nemen de wereld in zich op. {wie} voelt goed aan wat anderen voelen, heeft veel verbeelding, en een zachtheid die vaak sterker is dan mensen denken.",
    en: "Pisces takes the world in. {wie} feels what others feel, has a big imagination, and a gentleness that is often stronger than people expect.",
  },
};

/** Life path meaning as a noun phrase, no "you", for the card. */
export const CARD_LIFE_PATH_MEANING: Record<number, T> = {
  1: { nl: "zelfstandigheid en het lef om een eigen weg te kiezen", en: "independence and the nerve to choose one's own way" },
  2: { nl: "samenwerken, tact en een fijn gevoel voor wat anderen nodig hebben, vaak nog voor ze het zelf weten", en: "cooperation, tact and a fine sense of what others need, often before they know it themselves" },
  3: { nl: "expressie: praten, schrijven, maken en anderen aan het lachen krijgen", en: "expression: talking, writing, making things and making people laugh" },
  4: { nl: "structuur, betrouwbaarheid en de voldoening van iets stevigs neerzetten", en: "structure, reliability and the satisfaction of building something solid" },
  5: { nl: "vrijheid, verandering en leren door ervaring", en: "freedom, change and learning by doing" },
  6: { nl: "zorg, verantwoordelijkheid en een sterk gevoel voor thuis", en: "care, responsibility and a strong sense of home" },
  7: { nl: "onderzoek, rust en de behoefte om dingen echt te snappen", en: "study, quiet and the need to really understand things" },
  8: { nl: "ambitie, organiseren en goed omgaan met verantwoordelijkheid", en: "ambition, organization and handling responsibility well" },
  9: { nl: "ruimhartigheid, idealisme en oog voor het grotere geheel", en: "generosity, idealism and an eye for the bigger picture" },
  11: { nl: "intuïtie, gevoeligheid en anderen inspireren", en: "intuition, sensitivity and inspiring others" },
  22: { nl: "grote ideeën echt handen en voeten geven", en: "turning big ideas into practical work" },
  33: { nl: "zorgen en lesgeven op een grotere schaal", en: "care and teaching on a wider scale" },
};

export function fill(t: string, v: Record<string, string>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
}
