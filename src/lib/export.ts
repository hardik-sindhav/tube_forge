import type { ChannelProfile, ContentPlan, VideoIdea } from "./types";

export function videoToMarkdown(v: VideoIdea, n?: number) {
  return [
    `## ${n ? `${n}. ` : ""}${v.title}`,
    `**When:** Week ${v.schedule.week}, ${v.schedule.day} at ${v.schedule.time} · **Format:** ${v.format} (${v.duration}) · **Virality:** ${v.viralityScore}/100 · **Trend:** ${v.trendUsed}`,
    v.altTitles.length ? `\n**Alternative titles**\n${v.altTitles.map((t) => `- ${t}`).join("\n")}` : "",
    v.hook ? `\n**Hook**\n> ${v.hook}` : "",
    `\n**Description**\n${v.description}`,
    `\n**Tags**\n${v.tags.join(", ")}`,
    `\n**Hashtags**\n${v.hashtags.join(" ")}`,
    `\n**Thumbnail text:** ${v.thumbnailText}`,
    `\n**Thumbnail image prompt**\n${v.imagePrompt}`,
    v.outline.length ? `\n**Outline**\n${v.outline.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function planToMarkdown(plan: ContentPlan, profile: ChannelProfile) {
  const s = plan.strategy;
  return [
    `# ${profile.channelName || "My channel"}: YouTube content plan`,
    `_${profile.category} · ${profile.weeks} week(s) · ${profile.videosPerWeek}/week · generated with TubeForge (Groq)_`,
    `\n## Strategy\n${s.summary}`,
    s.pillars.length ? `\n### Content pillars\n${s.pillars.map((p) => `- **${p.name}**: ${p.description}`).join("\n")}` : "",
    s.bestPostingTimes.length ? `\n### Best posting times\n${s.bestPostingTimes.map((t) => `- ${t}`).join("\n")}` : "",
    s.growthTips.length ? `\n### Growth tips\n${s.growthTips.map((t) => `- ${t}`).join("\n")}` : "",
    plan.trendInsights.length
      ? `\n## Trend insights\n${plan.trendInsights.map((t) => `- **${t.trend}** (${t.relevance}/100): ${t.angle}`).join("\n")}`
      : "",
    `\n# Videos\n`,
    plan.videos.map((v, i) => videoToMarkdown(v, i + 1)).join("\n\n---\n\n"),
  ]
    .filter(Boolean)
    .join("\n");
}

export function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
