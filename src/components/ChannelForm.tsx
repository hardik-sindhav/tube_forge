"use client";

import { Clapperboard, Film, Layers, Smartphone } from "lucide-react";
import { CATEGORIES, GOALS, LANGUAGES, TONES } from "@/lib/constants";
import { REGIONS } from "@/lib/trends";
import type { ChannelProfile } from "@/lib/types";
import { Label, SectionTitle } from "./ui";

export function ChannelForm({
  profile,
  onChange,
}: {
  profile: ChannelProfile;
  onChange: (p: ChannelProfile) => void;
}) {
  const set = <K extends keyof ChannelProfile>(k: K, v: ChannelProfile[K]) =>
    onChange({ ...profile, [k]: v });

  const total = profile.videosPerWeek * profile.weeks;

  return (
    <div className="card p-5">
      <SectionTitle icon={<Clapperboard className="size-4" />} title="Your channel" />

      <div className="space-y-3.5">
        <div>
          <Label>Channel name</Label>
          <input
            className="input"
            placeholder="e.g. Pixel Pulse"
            value={profile.channelName}
            onChange={(e) => set("channelName", e.target.value)}
          />
        </div>

        <div>
          <Label>Category</Label>
          <select className="input" value={profile.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <Label hint="optional">Niche / focus</Label>
          <input
            className="input"
            placeholder="e.g. budget smartphones & honest reviews"
            value={profile.niche}
            onChange={(e) => set("niche", e.target.value)}
          />
        </div>

        <div>
          <Label hint="optional">Target audience</Label>
          <input
            className="input"
            placeholder="e.g. students 16-24 who love tech"
            value={profile.audience}
            onChange={(e) => set("audience", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Trends region</Label>
            <select className="input" value={profile.region} onChange={(e) => set("region", e.target.value)}>
              {REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Language</Label>
            <select className="input" value={profile.language} onChange={(e) => set("language", e.target.value)}>
              {LANGUAGES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Tone</Label>
            <select className="input" value={profile.tone} onChange={(e) => set("tone", e.target.value)}>
              {TONES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Goal</Label>
            <select className="input" value={profile.goal} onChange={(e) => set("goal", e.target.value)}>
              {GOALS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Label>Video format</Label>
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-panel-2 p-1">
            {(
              [
                { v: "long", label: "Long", icon: Film },
                { v: "shorts", label: "Shorts", icon: Smartphone },
                { v: "mixed", label: "Mixed", icon: Layers },
              ] as const
            ).map(({ v, label, icon: Icon }) => (
              <button
                key={v}
                type="button"
                onClick={() => set("format", v)}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition ${
                  profile.format === v
                    ? "bg-groq text-white shadow-md shadow-groq/30"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label hint={`${profile.videosPerWeek} / week`}>Upload frequency</Label>
          <input
            type="range"
            min={1}
            max={7}
            value={profile.videosPerWeek}
            onChange={(e) => set("videosPerWeek", Number(e.target.value))}
            className="w-full accent-[#f55036]"
          />
        </div>

        <div>
          <Label hint={total > 12 ? "max 12 videos per plan" : `${total} videos total`}>Plan length</Label>
          <div className="grid grid-cols-4 gap-1 rounded-xl border border-line bg-panel-2 p-1">
            {[1, 2, 3, 4].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => set("weeks", w)}
                className={`rounded-lg py-1.5 text-xs font-medium transition ${
                  profile.weeks === w
                    ? "bg-white/10 text-white ring-1 ring-white/10"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                {w} wk
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
