import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Two-level response cache: in-memory LRU, backed by JSON files in .cache/
 * so results survive dev-server restarts. File writes are best-effort
 * (read-only hosts like Vercel just fall back to memory).
 */

const TTL_MS = 6 * 60 * 60 * 1000; // trends move fast; 6h is a good balance
const MAX_ENTRIES = 200;
const DIR = path.join(process.cwd(), ".cache");

type Entry<T> = { at: number; value: T };

const g = globalThis as unknown as { __tfCache?: Map<string, Entry<unknown>> };
const mem = (g.__tfCache ??= new Map());

export function cacheKey(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex").slice(0, 32);
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  let hit = mem.get(key) as Entry<T> | undefined;
  if (!hit) {
    try {
      hit = JSON.parse(await fs.readFile(path.join(DIR, `${key}.json`), "utf8"));
    } catch {
      return null;
    }
  }
  if (!hit || Date.now() - hit.at > TTL_MS) {
    mem.delete(key);
    return null;
  }
  // refresh LRU position
  mem.delete(key);
  mem.set(key, hit);
  return hit.value;
}

export async function cacheSet<T>(key: string, value: T) {
  const entry: Entry<T> = { at: Date.now(), value };
  mem.set(key, entry);
  while (mem.size > MAX_ENTRIES) mem.delete(mem.keys().next().value!);
  try {
    await fs.mkdir(DIR, { recursive: true });
    await fs.writeFile(path.join(DIR, `${key}.json`), JSON.stringify(entry));
  } catch {}
}
