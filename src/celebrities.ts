// ~1000 most-followed real people on X, built by scripts/build_celebrities.py from Wikidata
// (X username P2002, follower count P8687, birth date P569, birthplace P19 + P625) cross-checked with Grokipedia.
// Birth time only with a documented source (otherwise null => date-only comparison).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BirthInput } from "./chart.js";
import { norm } from "./cities.js";

export interface CelebRecord {
  qid: string; name: string; x_handle: string; followers: number; aliases?: string[]; description?: string;
  birth_date: string; birth_date_source: string; birth_date_confidence: "high" | "medium" | "low";
  birth_place: string | null; birth_place_source: string | null; latitude: number | null; longitude: number | null; timezone: string | null;
  birth_time: string | null; birth_time_source: string | null;
}
export interface Celebrity extends CelebRecord { id: string; birth: BirthInput; time_known: boolean; source: string; accuracy: string }

let cache: Celebrity[] | undefined;
export function allCelebrities(): Celebrity[] {
  if (cache) return cache;
  const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "celebrities.json");
  const raw: CelebRecord[] = JSON.parse(readFileSync(file, "utf8")).people;
  cache = raw.map((r) => {
    const timeKnown = !!r.birth_time && r.latitude !== null && r.timezone !== null;
    const birth: BirthInput = timeKnown
      ? { birth_date: r.birth_date, birth_time: r.birth_time!, latitude: r.latitude!, longitude: r.longitude!, timezone: r.timezone!, birth_place: r.birth_place ?? undefined }
      : { birth_date: r.birth_date, ...(r.timezone ? { timezone: r.timezone } : {}) };
    return {
      ...r, id: r.qid, birth, time_known: timeKnown,
      source: `Wikidata ${r.qid}; date: ${r.birth_date_source}${r.birth_time_source ? `; time: ${r.birth_time_source}` : ""}`,
      accuracy: timeKnown ? "Date, time and place documented." : `Date ${r.birth_date_confidence} confidence; birth time not public, so date-only (no rising sign or houses).`,
    };
  });
  return cache;
}

function lev(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

export type CelebLookup = { celeb: Celebrity } | { candidates: Celebrity[] };
/** Exact name/handle/alias first, then fuzzy (substring or small typo), most followed first. */
export function searchCelebrity(q: string): CelebLookup {
  const k = norm(q.replace(/^@/, ""));
  const all = allCelebrities();
  const keys = (c: Celebrity) => [norm(c.name), norm(c.x_handle.replace(/^@/, "")), ...(c.aliases ?? []).map(norm)];
  const exact = all.filter((c) => keys(c).includes(k) || c.qid.toLowerCase() === k);
  if (exact.length === 1) return { celeb: exact[0] };
  if (exact.length > 1) return { candidates: exact.slice(0, 5) };
  const scored = all.map((c) => {
    const ks = keys(c);
    const sub = ks.some((x) => x.includes(k) || (x.split(" ").includes(k)));
    const dist = Math.min(...ks.map((x) => lev(x, k)));
    return { c, score: sub ? 0 : dist };
  }).filter((x) => x.score <= Math.max(1, Math.floor(k.length / 5)));
  scored.sort((a, b) => a.score - b.score || b.c.followers - a.c.followers);
  if (scored.length === 1 || (scored.length && scored[0].score === 0 && scored.filter((x) => x.score === 0).length === 1)) return { celeb: scored[0].c };
  return { candidates: scored.slice(0, 5).map((x) => x.c) };
}
export function findCelebrity(q: string): Celebrity | undefined { const r = searchCelebrity(q); return "celeb" in r ? r.celeb : undefined; }
export const CELEBRITIES_PROXY = { get list() { return allCelebrities(); } };
