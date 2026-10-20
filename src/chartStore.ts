// Server-side store for chart images. chart_image_url carries only a random 128-bit id, so the URL
// cannot be reversed to birth data or positions. The value is the computed render data (WheelToken),
// never a birth date, time, place or name.
// Storage: in-memory LRU with TTL (default 30 days, max 20,000 entries). Optional disk persistence when
// CHART_STORE_DIR points to a writable directory (e.g. a Railway volume). Memory-only means links
// stop working after a restart or redeploy.
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { WheelToken } from "./chartToken.js";

const TTL_MS = Number(process.env.CHART_STORE_TTL_DAYS ?? 30) * 86400_000;
const MAX = Number(process.env.CHART_STORE_MAX ?? 20_000);
const ID_RE = /^[A-Za-z0-9_-]{22}$/; // 16 random bytes, base64url

type Entry = { data: WheelToken; exp: number };
const mem = new Map<string, Entry>();

function diskDir(): string | null {
  const d = process.env.CHART_STORE_DIR;
  if (!d) return null;
  try { fs.mkdirSync(d, { recursive: true }); fs.accessSync(d, fs.constants.W_OK); return d; } catch { return null; }
}

function remember(id: string, e: Entry) {
  mem.delete(id); mem.set(id, e);
  while (mem.size > MAX) mem.delete(mem.keys().next().value!);
}

export function putChart(data: WheelToken, now = Date.now()): string {
  const id = randomBytes(16).toString("base64url");
  const e = { data, exp: now + TTL_MS };
  remember(id, e);
  const d = diskDir();
  if (d) { try { fs.writeFileSync(path.join(d, `${id}.json`), JSON.stringify(e)); } catch { /* memory still works */ } }
  return id;
}

export function getChart(id: string | undefined, now = Date.now()): WheelToken | null {
  if (!id || !ID_RE.test(id)) return null;
  let e = mem.get(id);
  if (!e) {
    const d = diskDir();
    if (d) { try { e = JSON.parse(fs.readFileSync(path.join(d, `${id}.json`), "utf8")) as Entry; } catch { e = undefined; } }
  }
  if (!e) return null;
  if (e.exp <= now) {
    mem.delete(id);
    const d = diskDir(); if (d) { try { fs.unlinkSync(path.join(d, `${id}.json`)); } catch { /* ignore */ } }
    return null;
  }
  remember(id, e); // LRU touch
  return e.data;
}

/** For tests. */
export function _storeSize() { return mem.size; }
