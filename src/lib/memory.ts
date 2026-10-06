import type { ChannelProfile, Feedback, GenerateResponse, MemoryDigest } from "./types";

/**
 * Per-channel memory, persisted in localStorage.
 * Stores every generated title (+ your feedback) and recent plans, and turns
 * them into a tiny digest so the AI never repeats itself and learns your taste.
 */

const KEY = "tubeforge:memory:v1";
const MAX_TITLES = 150;
const MAX_HISTORY = 10;

export type MemoryItem = { title: string; at: number; fb?: Feedback };

export type ChannelMemory = {
  items: MemoryItem[];
  pillars: string[];
  plans: number;
};

export type HistoryEntry = {
  id: string;
  at: number;
  channel: string;
  label: string;
  profile: ChannelProfile;
  result: GenerateResponse;
};

export type MemoryStore = {
  channels: Record<string, ChannelMemory>;
  history: HistoryEntry[];
  tokensSaved: number;
};

export const emptyStore = (): MemoryStore => ({ channels: {}, history: [], tokensSaved: 0 });

export const channelKey = (p: ChannelProfile) =>
  `${(p.channelName || "untitled").trim().toLowerCase()}::${p.category.toLowerCase()}`;

export function loadStore(): MemoryStore {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    return s ? { ...emptyStore(), ...s } : emptyStore();
  } catch {
    return emptyStore();
  }
}

export function saveStore(s: MemoryStore) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // quota exceeded: drop oldest history and retry once
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...s, history: s.history.slice(0, 3) }));
    } catch {}
  }
}

const getChannel = (s: MemoryStore, key: string): ChannelMemory =>
  s.channels[key] ?? { items: [], pillars: [], plans: 0 };

const norm = (t: string) => t.trim().toLowerCase();

/** Record a newly generated plan into memory + history. */
export function rememberPlan(s: MemoryStore, profile: ChannelProfile, result: GenerateResponse): MemoryStore {
  const key = channelKey(profile);
  const ch = getChannel(s, key);
  const known = new Set(ch.items.map((i) => norm(i.title)));
  const fresh = result.plan.videos
    .filter((v) => !known.has(norm(v.title)))
    .map((v) => ({ title: v.title, at: Date.now() }));

  const pillars = [...new Set([...result.plan.strategy.pillars.map((p) => p.name), ...ch.pillars])].slice(0, 6);

  const entry: HistoryEntry = {
    id: `${Date.now()}`,
    at: Date.now(),
    channel: key,
    label: `${profile.channelName || "Untitled"} · ${result.plan.videos.length} videos`,
    profile,
    result,
  };

  return {
    ...s,
    tokensSaved: s.tokensSaved,
    channels: {
      ...s.channels,
      [key]: {
        items: [...fresh, ...ch.items].slice(0, MAX_TITLES),
        pillars,
        plans: result.meta.cacheHit ? ch.plans : ch.plans + 1,
      },
    },
    history: result.meta.cacheHit ? s.history : [entry, ...s.history].slice(0, MAX_HISTORY),
  };
}

/** Add a single (regenerated) video title to memory. */
export function rememberTitle(s: MemoryStore, profile: ChannelProfile, title: string): MemoryStore {
  const key = channelKey(profile);
  const ch = getChannel(s, key);
  if (ch.items.some((i) => norm(i.title) === norm(title))) return s;
  return {
    ...s,
    channels: { ...s.channels, [key]: { ...ch, items: [{ title, at: Date.now() }, ...ch.items].slice(0, MAX_TITLES) } },
  };
}

export function setFeedback(s: MemoryStore, profile: ChannelProfile, title: string, fb: Feedback | null): MemoryStore {
  const key = channelKey(profile);
  const ch = getChannel(s, key);
  const exists = ch.items.some((i) => norm(i.title) === norm(title));
  const items = exists
    ? ch.items.map((i) => (norm(i.title) === norm(title) ? { ...i, fb: fb ?? undefined } : i))
    : [{ title, at: Date.now(), fb: fb ?? undefined }, ...ch.items];
  return { ...s, channels: { ...s.channels, [key]: { ...ch, items } } };
}

export function feedbackOf(s: MemoryStore, profile: ChannelProfile, title: string): Feedback | undefined {
  return getChannel(s, channelKey(profile)).items.find((i) => norm(i.title) === norm(title))?.fb;
}

export function forgetChannel(s: MemoryStore, profile: ChannelProfile): MemoryStore {
  const key = channelKey(profile);
  const { [key]: _, ...rest } = s.channels;
  return { ...s, channels: rest, history: s.history.filter((h) => h.channel !== key) };
}

/**
 * Compress memory into the smallest useful signal:
 * liked/used titles (what works), disliked (what to avoid),
 * and the most recent titles (what not to repeat).
 */
export function digest(s: MemoryStore, profile: ChannelProfile): MemoryDigest | undefined {
  const ch = s.channels[channelKey(profile)];
  if (!ch) return undefined;
  const liked = ch.items.filter((i) => i.fb === "up" || i.fb === "used").map((i) => i.title).slice(0, 8);
  const disliked = ch.items.filter((i) => i.fb === "down").map((i) => i.title).slice(0, 6);
  const skip = new Set([...liked, ...disliked]);
  const done = ch.items.filter((i) => !skip.has(i.title)).map((i) => i.title).slice(0, 30);
  if (!done.length && !liked.length && !disliked.length) return undefined;
  return { done, liked, disliked, pillars: ch.pillars.slice(0, 5) };
}

export function channelStats(s: MemoryStore, profile: ChannelProfile) {
  const ch = s.channels[channelKey(profile)];
  return {
    remembered: ch?.items.length ?? 0,
    liked: ch?.items.filter((i) => i.fb === "up").length ?? 0,
    used: ch?.items.filter((i) => i.fb === "used").length ?? 0,
    disliked: ch?.items.filter((i) => i.fb === "down").length ?? 0,
    plans: ch?.plans ?? 0,
  };
}
