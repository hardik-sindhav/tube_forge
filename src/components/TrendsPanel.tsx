"use client";

import { Check, Lightbulb, Plus, RefreshCw, Search, TrendingUp, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Trend } from "@/lib/types";
import { Pill, SectionTitle } from "./ui";

export function TrendsPanel({
  trends,
  loading,
  error,
  selected,
  onToggle,
  onSetSelected,
  onRefresh,
  customTopics,
  onCustomTopics,
}: {
  trends: Trend[];
  loading: boolean;
  error: string | null;
  selected: Set<string>;
  onToggle: (title: string) => void;
  onSetSelected: (titles: string[]) => void;
  onRefresh: () => void;
  customTopics: string[];
  onCustomTopics: (t: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("");

  const filtered = useMemo(
    () => trends.filter((t) => t.title.toLowerCase().includes(q.toLowerCase())),
    [trends, q],
  );

  const addTopic = () => {
    const t = topic.trim();
    if (t && !customTopics.includes(t) && customTopics.length < 10) onCustomTopics([...customTopics, t]);
    setTopic("");
  };

  return (
    <div className="card p-5">
      <SectionTitle
        icon={<TrendingUp className="size-4" />}
        title="Live Google Trends"
        action={
          <button
            onClick={onRefresh}
            disabled={loading}
            className="grid size-8 place-items-center rounded-lg border border-line text-zinc-400 transition hover:text-white disabled:opacity-50"
            title="Refresh trends"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      <div className="relative mb-2.5">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
        <input
          className="input !pl-8"
          placeholder="Filter trends…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="mb-2 flex items-center justify-between text-[11px] text-zinc-500">
        <span>
          {selected.size ? `${selected.size} selected` : "None selected · AI picks the best fits"}
        </span>
        <div className="flex gap-2">
          <button className="hover:text-zinc-200" onClick={() => onSetSelected(trends.slice(0, 10).map((t) => t.title))}>
            Top 10
          </button>
          <span>·</span>
          <button className="hover:text-zinc-200" onClick={() => onSetSelected([])}>
            Clear
          </button>
        </div>
      </div>

      <div className="scroll-thin -mx-1 max-h-72 space-y-1 overflow-y-auto px-1">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-11" />)}

        {!loading && error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300">
            {error}. You can still generate with your own topics.
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="py-6 text-center text-xs text-zinc-500">No trends match.</p>
        )}

        {!loading &&
          filtered.map((t) => {
            const on = selected.has(t.title);
            return (
              <button
                key={t.title}
                onClick={() => onToggle(t.title)}
                className={`group flex w-full items-center gap-3 rounded-xl border px-2.5 py-2 text-left transition ${
                  on
                    ? "border-groq/40 bg-groq/[0.07]"
                    : "border-transparent hover:border-line hover:bg-white/[0.03]"
                }`}
              >
                {t.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.picture} alt="" className="size-8 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-panel-2">
                    <TrendingUp className="size-3.5 text-zinc-500" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium capitalize text-zinc-200">{t.title}</p>
                  {t.news[0] && <p className="truncate text-[11px] text-zinc-500">{t.news[0].source}</p>}
                </div>
                <Pill tone={on ? "groq" : "default"}>{t.traffic}</Pill>
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-md border transition ${
                    on ? "border-groq bg-groq text-white" : "border-line text-transparent group-hover:border-zinc-500"
                  }`}
                >
                  <Check className="size-3" />
                </span>
              </button>
            );
          })}
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
          <Lightbulb className="size-3.5 text-amber-400" /> Your own topic ideas
        </p>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="e.g. iPhone vs Pixel camera test"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
          />
          <button
            onClick={addTopic}
            className="grid size-[38px] shrink-0 place-items-center rounded-xl border border-line bg-panel-2 text-zinc-300 transition hover:border-groq/60 hover:text-white"
            aria-label="Add topic"
          >
            <Plus className="size-4" />
          </button>
        </div>
        {customTopics.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {customTopics.map((t) => (
              <span
                key={t}
                className="animate-fade-up inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 py-0.5 pl-2.5 pr-1 text-[11px] text-amber-200"
              >
                {t}
                <button
                  onClick={() => onCustomTopics(customTopics.filter((x) => x !== t))}
                  className="grid size-4 place-items-center rounded-full hover:bg-white/10"
                  aria-label={`Remove ${t}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
