# TubeForge: AI YouTube Planner (powered by Groq)

Turn live Google Trends into a ready-to-shoot YouTube content plan, with titles, descriptions, tags, hashtags, thumbnail image prompts and an upload calendar, all tailored to your channel's category.

## Setup

```bash
npm install
cp .env.example .env.local   # then paste your key
npm run dev                  # http://localhost:3000
```

`.env.local`:

```
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b   # optional
```

## How it works

1. **Channel setup**: category, niche, audience, language, tone, goal, format (Long / Shorts / Mixed), uploads per week, and plan length.
2. **Live trends**: `/api/trends?geo=US` reads Google's daily trending-searches RSS feed for the chosen region. Pick the trends you like, or leave them unselected and let the AI choose the best fits. You can also add your own topic ideas.
3. **Generate**: `/api/generate` sends your profile and trends to Groq (`openai/gpt-oss-120b`, JSON mode) and gets back:
   - Strategy: summary, content pillars, best posting times, growth tips, KPIs
   - Trend fit: each trend scored 0-100 for your channel, with an angle for using it
   - Per video: title + A/B titles, hook, SEO description, tags, hashtags, thumbnail text, AI image prompt, outline, virality score, schedule
4. **Export**: copy any field, copy the whole plan as Markdown, or download it as `.md` or `.json`. Your last plan and settings are saved in the browser.

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS v4, lucide-react, and the Groq OpenAI-compatible API.

## Memory, cache and token savings

- **Channel memory** (`src/lib/memory.ts`, browser localStorage): remembers every idea generated for a channel (keyed by name + category), plus your 👍 / ✅ used / 👎 feedback. Before each request it's compressed into a small digest (≤30 past titles, ≤8 liked, ≤6 disliked, ≤5 pillars). The AI won't repeat past ideas and builds on what you liked. You can turn it off or "Forget this channel" in the sidebar.
- **History**: the last 10 plans can be reopened with no API call.
- **Response cache** (`src/lib/cache.ts`): identical requests are served from an in-memory LRU backed by `.cache/` files (6 h TTL), at 0 tokens. "Regenerate" bypasses it.
- **Prompt efficiency** (`src/lib/groq.ts`): the static system prompt and terse schema come first so Groq's prompt caching reuses that prefix. Context is sent as compact one-line fields, trends are capped at 15, and the output budget scales with the number of videos.
- **Single-video regenerate**: replaces one slot (about 1k tokens) instead of re-running the whole plan.

Measured: a 2-video plan is about 560 prompt tokens (256 served from Groq's prompt cache) and about 1.8k tokens in total, in about 4 s. A repeat request costs 0 tokens.
