export type Trend = {
  title: string;
  traffic: string;
  pubDate: string;
  picture?: string;
  news: { title: string; url: string; source: string }[];
};

export type ChannelProfile = {
  channelName: string;
  category: string;
  niche: string;
  audience: string;
  language: string;
  region: string;
  format: "long" | "shorts" | "mixed";
  videosPerWeek: number;
  weeks: number;
  tone: string;
  goal: string;
};

export type VideoIdea = {
  title: string;
  altTitles: string[];
  hook: string;
  description: string;
  tags: string[];
  hashtags: string[];
  thumbnailText: string;
  imagePrompt: string;
  format: string;
  duration: string;
  outline: string[];
  trendUsed: string;
  viralityScore: number;
  difficulty: "Easy" | "Medium" | "Hard";
  schedule: { week: number; day: string; time: string };
};

export type ContentPlan = {
  strategy: {
    summary: string;
    pillars: { name: string; description: string }[];
    bestPostingTimes: string[];
    growthTips: string[];
    kpis: string[];
  };
  trendInsights: { trend: string; relevance: number; angle: string }[];
  videos: VideoIdea[];
};

export type Usage = {
  model: string;
  promptTokens: number;
  cachedPromptTokens: number;
  completionTokens: number;
  totalTokens: number;
  seconds: number;
  tokensPerSecond: number;
  /** true when served from the server response cache (0 tokens spent) */
  cacheHit: boolean;
};

export type GenerateResponse = {
  plan: ContentPlan;
  meta: Usage;
};

export type Feedback = "up" | "down" | "used";

/** Compact memory digest sent to the server. Kept tiny on purpose. */
export type MemoryDigest = {
  done: string[];
  liked: string[];
  disliked: string[];
  pillars: string[];
};
