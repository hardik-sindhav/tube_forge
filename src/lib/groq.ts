import { cacheGet, cacheKey, cacheSet } from "./cache";
import type {
  ChannelProfile,
  ContentPlan,
  GenerateResponse,
  MemoryDigest,
  Trend,
  Usage,
  VideoIdea,
} from "./types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = () => process.env.GROQ_MODEL || "openai/gpt-oss-120b";

/*
 * Token strategy
 * 1. The system prompt is 100% static (rules + schema) and always sent first,
 *    so Groq's prompt caching can reuse that prefix across every request.
 * 2. Schema is written as a terse type sketch instead of a verbose JSON example.
 * 3. Dynamic context is compressed: short key:value lines, trends capped and
 *    truncated, memory sent as a small digest (titles only).
 * 4. Output budget scales with the number of videos requested.
 * 5. Identical requests are served from the response cache (0 tokens).
 * 6. Single-video regeneration avoids re-generating a whole plan.
 */

const VIDEO_T = `{"title":s<70,"altTitles":[s,s],"hook":s(first 5s script),"description":s(120-180 words,\\n breaks,hook first 2 lines,chapters,CTA),"tags":[12-16 s, no #],"hashtags":[3-5 "#s"],"thumbnailText":s(2-4 words),"imagePrompt":s(AI image prompt: subject,emotion,composition,lighting,colors,style,16:9,no text),"format":"Long-form"|"Short","duration":s,"outline":[4-7 s],"trendUsed":s|"Evergreen","viralityScore":0-100,"difficulty":"Easy"|"Medium"|"Hard","schedule":{"week":n,"day":"Mon".."Sun","time":s}}`;

const SYSTEM = `You are an elite YouTube growth strategist. Turn live Google trends into channel-specific video plans.
Rules: use only trends that truly fit the channel (creative bridge allowed, else Evergreen). Honest curiosity titles. Write in the requested language. Never repeat or closely paraphrase titles listed under MEMORY.done. MEMORY.liked = themes that worked: build NEW angles on them, never reuse those titles. Avoid MEMORY.disliked styles. Output ONLY minified JSON.
VIDEO=${VIDEO_T}
PLAN={"strategy":{"summary":s(2 sentences),"pillars":[3-4 {"name":s,"description":s}],"bestPostingTimes":[2-4 s],"growthTips":[4-6 s],"kpis":[3-4 s]},"trendInsights":[5-8 {"trend":s,"relevance":0-100,"angle":s}],"videos":[VIDEO]}
ONE={"video":VIDEO}`;

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

function contextBlock(
  p: ChannelProfile,
  trends: Trend[],
  topics: string[],
  memory?: MemoryDigest,
) {
  const fmt = { long: "long-form only", shorts: "Shorts only (<60s)", mixed: "mix of long-form + Shorts" }[p.format];
  const lines = [
    `CHANNEL name:${p.channelName || "-"}|cat:${p.category}|niche:${p.niche || "general"}|aud:${p.audience || "general"}|lang:${p.language}|region:${p.region}|tone:${p.tone}|goal:${p.goal}|format:${fmt}`,
    `TRENDS ${trends.length ? trends.slice(0, 15).map((t) => `${clip(t.title, 40)}(${t.traffic})`).join("; ") : "none, use evergreen/seasonal"}`,
  ];
  if (topics.length) lines.push(`MUST_COVER ${topics.map((t) => clip(t, 60)).join("; ")}`);
  if (memory) {
    if (memory.done.length) lines.push(`MEMORY.done ${memory.done.join(" | ")}`);
    if (memory.liked.length) lines.push(`MEMORY.liked ${memory.liked.join(" | ")}`);
    if (memory.disliked.length) lines.push(`MEMORY.disliked ${memory.disliked.join(" | ")}`);
    if (memory.pillars.length) lines.push(`MEMORY.pillars ${memory.pillars.join("; ")}`);
  }
  return lines.join("\n");
}

/** Hard caps so a huge memory or trend list can never blow up the prompt. */
function sanitizeMemory(m?: MemoryDigest): MemoryDigest | undefined {
  if (!m) return undefined;
  const list = (a: unknown, n: number, len: number) =>
    (Array.isArray(a) ? a : []).map((s) => clip(String(s), len)).slice(0, n);
  const out = {
    done: list(m.done, 30, 60),
    liked: list(m.liked, 8, 60),
    disliked: list(m.disliked, 6, 60),
    pillars: list(m.pillars, 5, 30),
  };
  return out.done.length || out.liked.length || out.disliked.length || out.pillars.length ? out : undefined;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callGroq(user: string, maxTokens: number, attempt = 0): Promise<{ json: unknown; usage: Usage }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("The AI isn't set up yet: add GROQ_API_KEY to your .env file and restart the server.");
  const model = MODEL();

  const started = Date.now();
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_completion_tokens: maxTokens,
      ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    let msg = err;
    try {
      msg = JSON.parse(err).error?.message ?? err;
    } catch {}
    console.error(`[groq] ${res.status}: ${msg}`);

    if (res.status === 429) {
      // Free tier has a tokens-per-minute cap. Wait it out once if it's short.
      const wait = Math.ceil(Number(msg.match(/try again in ([d.]+)s/)?.[1] ?? 30));
      if (attempt === 0 && wait <= 25) {
        await sleep(wait * 1000 + 500);
        return callGroq(user, maxTokens, 1);
      }
      throw new Error(`The AI is busy right now (usage limit reached). Please try again in about ${wait} seconds.`);
    }
    if (res.status === 401) throw new Error("The AI key is invalid. Check GROQ_API_KEY in your .env file.");
    if (res.status >= 500 && attempt === 0) {
      await sleep(1500);
      return callGroq(user, maxTokens, 1);
    }
    throw new Error("The AI couldn't create your plan this time. Please try again.");
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";
  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("The AI couldn't create your plan this time. Please try again.");
    json = JSON.parse(m[0]);
  }

  const u = data.usage ?? {};
  const completionTokens: number = u.completion_tokens ?? 0;
  const completionTime: number = u.completion_time ?? (Date.now() - started) / 1000;
  return {
    json,
    usage: {
      model: data.model ?? model,
      promptTokens: u.prompt_tokens ?? 0,
      cachedPromptTokens: u.prompt_tokens_details?.cached_tokens ?? 0,
      completionTokens,
      totalTokens: u.total_tokens ?? 0,
      seconds: Number(((Date.now() - started) / 1000).toFixed(2)),
      tokensPerSecond: completionTime ? Math.round(completionTokens / completionTime) : 0,
      cacheHit: false,
    },
  };
}

export async function generatePlan(opts: {
  profile: ChannelProfile;
  trends: Trend[];
  customTopics: string[];
  memory?: MemoryDigest;
  fresh?: boolean;
}): Promise<GenerateResponse> {
  const { profile, trends, customTopics } = opts;
  const memory = sanitizeMemory(opts.memory);
  const count = Math.min(Math.max(profile.videosPerWeek * profile.weeks, 1), 12);

  const user = `${contextBlock(profile, trends, customTopics, memory)}
TASK Return PLAN as one object with ALL 3 top-level keys: strategy, trendInsights, videos. videos = exactly ${count} items across ${profile.weeks} week(s), ${profile.videosPerWeek}/week.`;

  const key = cacheKey({ v: 2, m: MODEL(), user });
  if (!opts.fresh) {
    const hit = await cacheGet<GenerateResponse>(key);
    if (hit) return { ...hit, meta: { ...hit.meta, cacheHit: true, seconds: 0 } };
  }

  // ~650 output tokens per video + ~900 for strategy/insights + reasoning headroom
  const budget = Math.min(1500 + count * 900, 16000);
  let { json, usage } = await callGroq(user, budget);
  let plan = normalizePlan(extractPlan(json));

  // The model occasionally returns a partial object (e.g. strategy only). Retry once.
  if (!plan.videos.length) {
    console.warn("[groq] plan had no videos, retrying");
    ({ json, usage } = await callGroq(user, budget));
    plan = normalizePlan(extractPlan(json));
    if (!plan.videos.length) throw new Error("The AI returned an incomplete plan. Please try again.");
  }

  const result = { plan, meta: usage };
  if (plan.strategy.summary) await cacheSet(key, result); // never cache incomplete answers
  return result;
}

export async function generateOneVideo(opts: {
  profile: ChannelProfile;
  trends: Trend[];
  customTopics: string[];
  memory?: MemoryDigest;
  slot: VideoIdea["schedule"];
  avoid: string[];
}): Promise<{ video: VideoIdea; meta: Usage }> {
  const memory = sanitizeMemory({
    done: [...opts.avoid, ...(opts.memory?.done ?? [])],
    liked: opts.memory?.liked ?? [],
    disliked: opts.memory?.disliked ?? [],
    pillars: opts.memory?.pillars ?? [],
  });
  const s = opts.slot;
  const user = `${contextBlock(opts.profile, opts.trends, opts.customTopics, memory)}
TASK Return ONE as {"video":VIDEO}: a brand-new video for week ${s.week} ${s.day} ${s.time}, different angle from everything in MEMORY.done.`;

  const { json, usage } = await callGroq(user, 2500);
  const raw = findObject(json, (o) => typeof o.title === "string" && ("description" in o || "tags" in o)) as
    | Partial<VideoIdea>
    | undefined;
  if (!raw) throw new Error("The AI couldn't create a new idea this time. Please try again.");
  const video = normalizeVideo(raw, 0);
  video.schedule = s;
  return { video, meta: usage };
}

/* ---------- normalisation ---------- */

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

/** Depth-first search for the first array whose items match a predicate. */
function findArray(node: unknown, test: (item: Obj) => boolean, depth = 0): Obj[] | undefined {
  if (depth > 5) return undefined;
  if (Array.isArray(node)) {
    if (node.length && node.every(isObj) && test(node[0] as Obj)) return node as Obj[];
    for (const n of node) {
      const r = findArray(n, test, depth + 1);
      if (r) return r;
    }
  } else if (isObj(node)) {
    for (const v of Object.values(node)) {
      const r = findArray(v, test, depth + 1);
      if (r) return r;
    }
  }
  return undefined;
}

function findObject(node: unknown, test: (o: Obj) => boolean, depth = 0): Obj | undefined {
  if (depth > 5 || !isObj(node)) return undefined;
  if (test(node)) return node;
  for (const v of Object.values(node)) {
    const r = findObject(v, test, depth + 1);
    if (r) return r;
  }
  return undefined;
}

/** Pull plan parts out of whatever shape the model returned (wrapped, nested, renamed keys). */
function extractPlan(json: unknown): Partial<ContentPlan> {
  return {
    strategy: findObject(json, (o) => "summary" in o || "pillars" in o) as ContentPlan["strategy"] | undefined,
    trendInsights: findArray(json, (o) => "relevance" in o || "angle" in o) as ContentPlan["trendInsights"] | undefined,
    videos: findArray(json, (o) => "title" in o && ("description" in o || "hook" in o || "tags" in o)) as
      | VideoIdea[]
      | undefined,
  };
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function normalizeVideo(v: Partial<VideoIdea>, i: number): VideoIdea {
  return {
    title: v.title ?? `Video ${i + 1}`,
    altTitles: arr(v.altTitles),
    hook: v.hook ?? "",
    description: (v.description ?? "").replace(/\\n/g, "\n"),
    tags: arr<string>(v.tags).map((t) => String(t).replace(/^#/, "")),
    hashtags: arr<string>(v.hashtags).map((h) => (String(h).startsWith("#") ? h : `#${h}`)),
    thumbnailText: v.thumbnailText ?? "",
    imagePrompt: v.imagePrompt ?? "",
    format: v.format ?? "Long-form",
    duration: v.duration ?? "",
    outline: arr(v.outline),
    trendUsed: v.trendUsed ?? "Evergreen",
    viralityScore: Math.max(0, Math.min(100, Number(v.viralityScore) || 0)),
    difficulty: v.difficulty ?? "Medium",
    schedule: {
      week: Number(v.schedule?.week) || 1,
      day: v.schedule?.day ?? "Mon",
      time: v.schedule?.time ?? "6:00 PM",
    },
  };
}

function normalizePlan(p: Partial<ContentPlan>): ContentPlan {
  const s = (p.strategy ?? {}) as Partial<ContentPlan["strategy"]>;
  return {
    strategy: {
      summary: s.summary ?? "",
      pillars: arr(s.pillars),
      bestPostingTimes: arr(s.bestPostingTimes),
      growthTips: arr(s.growthTips),
      kpis: arr(s.kpis),
    },
    trendInsights: arr<ContentPlan["trendInsights"][number]>(p.trendInsights).map((t) => ({
      ...t,
      relevance: Math.max(0, Math.min(100, Number(t.relevance) || 0)),
    })),
    videos: arr<Partial<VideoIdea>>(p.videos).map(normalizeVideo),
  };
}
