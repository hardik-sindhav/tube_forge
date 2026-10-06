"use client";

import {
  AlignLeft,
  CalendarDays,
  Clock,
  Hash,
  ImageIcon,
  ListOrdered,
  Mic,
  RefreshCw,
  Tag,
  Type,
  X,
} from "lucide-react";
import { useEffect } from "react";
import type { VideoIdea } from "@/lib/types";
import { videoToMarkdown } from "@/lib/export";
import { ThumbnailToolsCard } from "./Promo";
import { CopyButton, FeedbackBar, type FeedbackValue, Pill, ScoreRing } from "./ui";

function Block({
  icon,
  title,
  copy,
  copyLabel,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  copy?: string;
  copyLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-panel/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <span className="text-groq">{icon}</span>
          {title}
        </h4>
        {copy !== undefined && <CopyButton text={copy} label={copyLabel} />}
      </div>
      {children}
    </section>
  );
}

export function ThumbnailPreview({ video, index }: { video: VideoIdea; index: number }) {
  const gradients = [
    "from-[#f55036] via-[#b0234f] to-[#2b1055]",
    "from-[#0ea5e9] via-[#6366f1] to-[#1e1b4b]",
    "from-[#f59e0b] via-[#ef4444] to-[#450a0a]",
    "from-[#10b981] via-[#0e7490] to-[#082f49]",
    "from-[#ec4899] via-[#8b5cf6] to-[#1e1b4b]",
  ];
  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br ${gradients[index % gradients.length]}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_40%,rgba(255,255,255,0.25),transparent_45%)]" />
      <div className="absolute inset-0 flex items-end p-4">
        <p
          className="font-display text-2xl font-black uppercase leading-[0.95] text-white sm:text-3xl"
          style={{ textShadow: "0 3px 0 rgba(0,0,0,0.45), 0 0 24px rgba(0,0,0,0.4)" }}
        >
          {video.thumbnailText || video.title}
        </p>
      </div>
      <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
        {video.duration || "10:00"}
      </span>
    </div>
  );
}

export function VideoDrawer({
  video,
  index,
  onClose,
  feedback,
  onFeedback,
  onRegenerate,
  regenerating,
}: {
  video: VideoIdea | null;
  index: number;
  onClose: () => void;
  feedback?: FeedbackValue;
  onFeedback: (v: FeedbackValue | null) => void;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  useEffect(() => {
    if (!video) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [video, onClose]);

  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="animate-slide-in scroll-thin absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-line bg-bg shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start gap-4 border-b border-line bg-bg/90 px-6 py-4 backdrop-blur">
          <ScoreRing value={video.viralityScore} size={48} />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <Pill tone="groq">
                <CalendarDays className="size-3" /> Week {video.schedule.week} · {video.schedule.day} · {video.schedule.time}
              </Pill>
              <Pill tone={video.format?.toLowerCase().includes("short") ? "blue" : "default"}>{video.format}</Pill>
              <Pill>
                <Clock className="size-3" /> {video.duration}
              </Pill>
              {video.difficulty && <Pill tone="amber">{video.difficulty}</Pill>}
            </div>
            <h2 className="font-display text-lg font-semibold leading-snug">{video.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <CopyButton text={videoToMarkdown(video)} label="Copy all" toast="Full video plan copied" />
            <button
              onClick={onClose}
              className="grid size-8 place-items-center rounded-lg border border-line text-zinc-400 hover:text-white"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel/60 px-4 py-3">
            <div className="flex items-center gap-3">
              <FeedbackBar value={feedback} onChange={onFeedback} size="md" />
              <span className="hidden text-xs text-zinc-500 sm:inline">Teach the AI your taste</span>
            </div>
            <button
              onClick={onRegenerate}
              disabled={regenerating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-groq/40 bg-groq/10 px-3 py-1.5 text-xs font-medium text-groq-soft transition hover:bg-groq/20 disabled:opacity-60"
              title="Get a fresh idea for this upload slot. The rest of your plan stays the same."
            >
              <RefreshCw className={`size-3.5 ${regenerating ? "animate-spin" : ""}`} />
              {regenerating ? "Regenerating…" : "New idea for this slot"}
            </button>
          </div>

          <div className={regenerating ? "pointer-events-none animate-pulse opacity-50" : ""}>
            <ThumbnailPreview video={video} index={index} />
          </div>

          <Block icon={<Type className="size-3.5" />} title="Titles" copy={video.title} copyLabel="Copy main">
            <p className="font-medium text-zinc-100">{video.title}</p>
            {video.altTitles.length > 0 && (
              <ul className="mt-3 space-y-2">
                {video.altTitles.map((t) => (
                  <li key={t} className="flex items-center justify-between gap-3 rounded-lg bg-panel-2 px-3 py-2 text-sm text-zinc-300">
                    <span>{t}</span>
                    <CopyButton text={t} label="" className="!px-2" />
                  </li>
                ))}
              </ul>
            )}
          </Block>

          {video.hook && (
            <Block icon={<Mic className="size-3.5" />} title="Opening hook" copy={video.hook}>
              <p className="border-l-2 border-groq pl-3 text-sm italic leading-relaxed text-zinc-300">“{video.hook}”</p>
            </Block>
          )}

          <Block icon={<AlignLeft className="size-3.5" />} title="Description" copy={video.description}>
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">{video.description}</p>
          </Block>

          <div className="grid gap-4 sm:grid-cols-2">
            <Block icon={<Tag className="size-3.5" />} title={`Tags (${video.tags.length})`} copy={video.tags.join(", ")}>
              <div className="flex flex-wrap gap-1.5">
                {video.tags.map((t) => (
                  <span key={t} className="rounded-md bg-panel-2 px-2 py-1 text-xs text-zinc-300">
                    {t}
                  </span>
                ))}
              </div>
            </Block>
            <Block icon={<Hash className="size-3.5" />} title="Hashtags" copy={video.hashtags.join(" ")}>
              <div className="flex flex-wrap gap-1.5">
                {video.hashtags.map((h) => (
                  <span key={h} className="rounded-md bg-sky-500/10 px-2 py-1 text-xs font-medium text-sky-300">
                    {h}
                  </span>
                ))}
              </div>
            </Block>
          </div>

          <Block icon={<ImageIcon className="size-3.5" />} title="Thumbnail image prompt" copy={video.imagePrompt}>
            <p className="rounded-lg bg-panel-2 p-3 font-mono text-xs leading-relaxed text-zinc-300">{video.imagePrompt}</p>
            {video.thumbnailText && (
              <p className="mt-2 text-xs text-zinc-500">
                Overlay text: <span className="font-semibold text-zinc-200">{video.thumbnailText}</span>
              </p>
            )}
          </Block>

          <ThumbnailToolsCard />

          {video.outline.length > 0 && (
            <Block icon={<ListOrdered className="size-3.5" />} title="Video outline" copy={video.outline.map((s, i) => `${i + 1}. ${s}`).join("\n")}>
              <ol className="space-y-2">
                {video.outline.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-zinc-300">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-groq/15 text-[10px] font-bold text-groq">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </Block>
          )}

          <p className="pb-4 text-center text-xs text-zinc-600">
            Inspired by: <span className="text-zinc-400">{video.trendUsed || "Evergreen"}</span>
          </p>
        </div>
      </aside>
    </div>
  );
}
