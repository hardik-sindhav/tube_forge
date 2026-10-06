"use client";

import { Brain, History, ThumbsDown, ThumbsUp, Trash2, CircleCheck } from "lucide-react";
import { channelKey, channelStats, type MemoryStore } from "@/lib/memory";
import type { ChannelProfile } from "@/lib/types";
import { SectionTitle } from "./ui";

function timeAgo(at: number) {
  const m = Math.round((Date.now() - at) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

export function MemoryPanel({
  store,
  profile,
  enabled,
  onToggle,
  onForget,
  onLoadHistory,
}: {
  store: MemoryStore;
  profile: ChannelProfile;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  onForget: () => void;
  onLoadHistory: (id: string) => void;
}) {
  const s = channelStats(store, profile);
  const key = channelKey(profile);
  const history = store.history.filter((h) => h.channel === key).slice(0, 5);

  return (
    <div className="card p-5">
      <SectionTitle
        icon={<Brain className="size-4" />}
        title="Channel memory"
        action={
          <button
            role="switch"
            aria-checked={enabled}
            onClick={() => onToggle(!enabled)}
            className={`relative h-5 w-9 rounded-full transition ${enabled ? "bg-groq" : "bg-panel-2 ring-1 ring-line"}`}
            title={enabled ? "Memory on" : "Memory off"}
          >
            <span
              className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${enabled ? "left-[18px]" : "left-0.5"}`}
            />
          </button>
        }
      />

      <p className="mb-3 text-xs leading-relaxed text-zinc-500">
        {enabled
          ? "The AI remembers past ideas for this channel: it won't repeat them and learns from your likes."
          : "Memory is off. Each plan starts from scratch."}
      </p>

      <div className="grid grid-cols-4 gap-1.5">
        <Stat icon={<Brain className="size-3" />} value={s.remembered} label="Ideas" />
        <Stat icon={<ThumbsUp className="size-3" />} value={s.liked} label="Liked" />
        <Stat icon={<CircleCheck className="size-3" />} value={s.used} label="Used" />
        <Stat icon={<ThumbsDown className="size-3" />} value={s.disliked} label="Nope" />
      </div>


      {history.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <History className="size-3.5" /> Recent plans <span className="text-zinc-600">· tap to reopen</span>
          </p>
          <div className="space-y-1">
            {history.map((h) => (
              <button
                key={h.id}
                onClick={() => onLoadHistory(h.id)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-zinc-300 transition hover:bg-white/5"
              >
                <span className="truncate">{h.result.plan.videos[0]?.title ?? h.label}</span>
                <span className="shrink-0 text-[10px] text-zinc-600">{timeAgo(h.at)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {s.remembered > 0 && (
        <button
          onClick={onForget}
          className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-600 transition hover:text-red-400"
        >
          <Trash2 className="size-3" /> Forget this channel
        </button>
      )}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-lg bg-panel-2 px-2 py-1.5 text-center">
      <p className="font-display text-base font-semibold leading-tight">{value}</p>
      <p className="flex items-center justify-center gap-1 text-[10px] text-zinc-500">
        {icon}
        {label}
      </p>
    </div>
  );
}
