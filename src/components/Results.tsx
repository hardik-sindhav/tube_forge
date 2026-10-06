"use client";

import {
  CalendarDays,
  ChevronRight,
  Clock,
  Download,
  FileJson,
  Flame,
  LayoutGrid,
  Lightbulb,
  Rocket,
  Target,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { DAYS } from "@/lib/constants";
import { download, planToMarkdown } from "@/lib/export";
import type { ChannelProfile, GenerateResponse, VideoIdea } from "@/lib/types";
import { CopyButton, FeedbackBar, type FeedbackValue, Pill, ScoreRing, SectionTitle } from "./ui";
import { ThumbnailPreview, VideoDrawer } from "./VideoDrawer";

type Tab = "videos" | "strategy" | "calendar" | "trends";

export function Results({
  result,
  profile,
  feedbackOf,
  onFeedback,
  onRegenerate,
  regenerating,
}: {
  result: GenerateResponse;
  profile: ChannelProfile;
  feedbackOf: (title: string) => FeedbackValue | undefined;
  onFeedback: (title: string, v: FeedbackValue | null) => void;
  onRegenerate: (index: number) => void;
  regenerating: number | null;
}) {
  const [tab, setTab] = useState<Tab>("videos");
  const [open, setOpen] = useState<number | null>(null);
  const { plan } = result;

  const avg = plan.videos.length
    ? Math.round(plan.videos.reduce((a, v) => a + v.viralityScore, 0) / plan.videos.length)
    : 0;

  const trendPowered = plan.videos.filter((v) => v.trendUsed && !/evergreen/i.test(v.trendUsed)).length;

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "videos", label: "Video ideas", icon: LayoutGrid, count: plan.videos.length },
    { id: "strategy", label: "Strategy", icon: Target },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "trends", label: "Trend fit", icon: TrendingUp, count: plan.trendInsights.length },
  ];

  const md = planToMarkdown(plan, profile);
  const slug = (profile.channelName || "youtube-plan").toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div className="animate-fade-up space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat icon={<LayoutGrid className="size-4" />} label="Videos planned" value={plan.videos.length} />
        <Stat icon={<Flame className="size-4" />} label="Avg. virality" value={`${avg}/100`} />
        <Stat
          icon={<TrendingUp className="size-4" />}
          label="Powered by live trends"
          value={`${trendPowered} of ${plan.videos.length}`}
          accent
        />
      </div>

      {/* Tabs + export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="scroll-thin flex gap-1 overflow-x-auto rounded-xl border border-line bg-panel p-1">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                tab === id ? "bg-white/10 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className="size-3.5" />
              {label}
              {count !== undefined && (
                <span className={`rounded-full px-1.5 text-[10px] ${tab === id ? "bg-groq text-white" : "bg-panel-2"}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <CopyButton text={md} label="Copy Markdown" toast="Full plan copied as Markdown" />
          <button
            onClick={() => download(`${slug}.md`, md, "text/markdown")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-groq/60 hover:text-white"
          >
            <Download className="size-3.5" /> .md
          </button>
          <button
            onClick={() => download(`${slug}.json`, JSON.stringify(plan, null, 2), "application/json")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-groq/60 hover:text-white"
          >
            <FileJson className="size-3.5" /> .json
          </button>
        </div>
      </div>

      {tab === "videos" && (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {plan.videos.map((v, i) => (
            <VideoCard
              key={i}
              video={v}
              index={i}
              onOpen={() => setOpen(i)}
              feedback={feedbackOf(v.title)}
              onFeedback={(fb) => onFeedback(v.title, fb)}
              loading={regenerating === i}
            />
          ))}
        </div>
      )}

      {tab === "strategy" && <StrategyView result={result} />}
      {tab === "calendar" && <CalendarView videos={plan.videos} weeks={profile.weeks} onOpen={setOpen} />}
      {tab === "trends" && <TrendsView result={result} />}

      <p className="text-center text-[11px] text-zinc-600">
        AI-generated ideas. Review and personalise before publishing.
      </p>

      <VideoDrawer
        video={open !== null ? plan.videos[open] : null}
        index={open ?? 0}
        onClose={() => setOpen(null)}
        feedback={open !== null ? feedbackOf(plan.videos[open].title) : undefined}
        onFeedback={(fb) => open !== null && onFeedback(plan.videos[open].title, fb)}
        onRegenerate={() => open !== null && onRegenerate(open)}
        regenerating={open !== null && regenerating === open}
      />
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`card flex items-center gap-3 p-4 ${accent ? "!border-groq/30" : ""}`}>
      <span className={`grid size-9 place-items-center rounded-xl ${accent ? "bg-groq text-white shadow-lg shadow-groq/30" : "bg-panel-2 text-zinc-300"}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-zinc-500">{label}</p>
        <p className="truncate font-display text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

function VideoCard({
  video,
  index,
  onOpen,
  feedback,
  onFeedback,
  loading,
}: {
  video: VideoIdea;
  index: number;
  onOpen: () => void;
  feedback?: FeedbackValue;
  onFeedback: (v: FeedbackValue | null) => void;
  loading: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      style={{ animationDelay: `${index * 60}ms` }}
      className={`card animate-fade-up group flex cursor-pointer flex-col overflow-hidden text-left transition ${loading ? "animate-pulse opacity-50" : ""} hover:-translate-y-0.5 hover:border-groq/40 hover:shadow-xl hover:shadow-groq/5`}
    >
      <div className="p-3 pb-0">
        <ThumbnailPreview video={video} index={index} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {feedback && (
            <Pill tone={feedback === "up" ? "green" : feedback === "used" ? "blue" : "default"}>
              {feedback === "up" ? "Liked" : feedback === "used" ? "Used" : "Disliked"}
            </Pill>
          )}
          <Pill tone="groq">
            W{video.schedule.week} · {video.schedule.day}
          </Pill>
          <Pill tone={video.format?.toLowerCase().includes("short") ? "blue" : "default"}>{video.format}</Pill>
          <Pill>
            <Clock className="size-3" /> {video.duration}
          </Pill>
        </div>
        <h3 className="mb-1.5 line-clamp-2 font-display font-semibold leading-snug text-zinc-100">{video.title}</h3>
        <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-zinc-500">{video.hook}</p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <ScoreRing value={video.viralityScore} size={34} />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-zinc-600">Trend</p>
              <p className="truncate text-xs text-zinc-300">{video.trendUsed || "Evergreen"}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <FeedbackBar value={feedback} onChange={onFeedback} />
            <ChevronRight className="size-4 text-groq-soft opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StrategyView({ result }: { result: GenerateResponse }) {
  const s = result.plan.strategy;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card relative overflow-hidden p-6 lg:col-span-2">
        <div className="glow pointer-events-none absolute inset-0 opacity-60" />
        <p className="relative mb-2 text-xs font-semibold uppercase tracking-wider text-groq">Game plan</p>
        <p className="relative font-display text-lg leading-relaxed text-zinc-100">{s.summary}</p>
      </div>

      <div className="card p-5">
        <SectionTitle icon={<LayoutGrid className="size-4" />} title="Content pillars" />
        <div className="space-y-2.5">
          {s.pillars.map((p, i) => (
            <div key={i} className="rounded-xl bg-panel-2 p-3">
              <p className="text-sm font-semibold text-zinc-100">{p.name}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{p.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="card p-5">
          <SectionTitle icon={<Clock className="size-4" />} title="Best posting times" />
          <div className="flex flex-wrap gap-2">
            {s.bestPostingTimes.map((t) => (
              <Pill key={t} tone="green" className="!px-3 !py-1 !text-xs">
                {t}
              </Pill>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <SectionTitle icon={<Target className="size-4" />} title="KPIs to track" />
          <ul className="space-y-1.5">
            {s.kpis.map((k) => (
              <li key={k} className="flex gap-2 text-sm text-zinc-300">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-groq" />
                {k}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card p-5 lg:col-span-2">
        <SectionTitle icon={<Rocket className="size-4" />} title="Growth tips" />
        <div className="grid gap-2.5 sm:grid-cols-2">
          {s.growthTips.map((t, i) => (
            <div key={i} className="flex gap-3 rounded-xl bg-panel-2 p-3 text-sm text-zinc-300">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-400" />
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarView({
  videos,
  weeks,
  onOpen,
}: {
  videos: VideoIdea[];
  weeks: number;
  onOpen: (i: number) => void;
}) {
  const totalWeeks = Math.max(weeks, ...videos.map((v) => v.schedule.week));
  const norm = (d: string) => DAYS.find((x) => d.toLowerCase().startsWith(x.toLowerCase())) ?? "Mon";
  return (
    <div className="card scroll-thin overflow-x-auto p-4">
      <div className="min-w-[760px]">
        <div className="mb-2 grid grid-cols-[70px_repeat(7,1fr)] gap-2">
          <div />
          {DAYS.map((d) => (
            <p key={d} className="text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {d}
            </p>
          ))}
        </div>
        {Array.from({ length: totalWeeks }).map((_, w) => (
          <div key={w} className="mb-2 grid grid-cols-[70px_repeat(7,1fr)] gap-2">
            <div className="flex items-center text-xs font-semibold text-zinc-400">Week {w + 1}</div>
            {DAYS.map((d) => {
              const items = videos
                .map((v, i) => ({ v, i }))
                .filter(({ v }) => v.schedule.week === w + 1 && norm(v.schedule.day) === d);
              return (
                <div
                  key={d}
                  className={`min-h-24 rounded-xl border p-1.5 ${items.length ? "border-groq/25 bg-groq/[0.04]" : "border-dashed border-line"}`}
                >
                  {items.map(({ v, i }) => (
                    <button
                      key={i}
                      onClick={() => onOpen(i)}
                      className="mb-1 w-full rounded-lg bg-panel-2 p-2 text-left transition hover:bg-white/10"
                    >
                      <p className="mb-1 text-[10px] font-semibold text-groq-soft">{v.schedule.time}</p>
                      <p className="line-clamp-3 text-[11px] leading-snug text-zinc-200">{v.title}</p>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendsView({ result }: { result: GenerateResponse }) {
  const items = [...result.plan.trendInsights].sort((a, b) => b.relevance - a.relevance);
  if (!items.length) return <p className="py-10 text-center text-sm text-zinc-500">No trend insights returned.</p>;
  return (
    <div className="card divide-y divide-line">
      {items.map((t, i) => (
        <div key={i} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="sm:w-56">
            <p className="font-medium capitalize text-zinc-100">{t.trend}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-groq to-amber-400"
                  style={{ width: `${t.relevance}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs font-semibold text-zinc-300">{t.relevance}</span>
            </div>
          </div>
          <p className="flex-1 text-sm leading-relaxed text-zinc-400">{t.angle}</p>
        </div>
      ))}
    </div>
  );
}
