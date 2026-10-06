"use client";

import { AlignLeft, Hash, ImageIcon, Sparkles, Tag, TrendingUp, Type } from "lucide-react";
import { useEffect, useState } from "react";
import { GroqMark } from "./ui";

const STEPS = [
  "Reading live Google Trends…",
  "Matching trends to your channel…",
  "Writing scroll-stopping titles…",
  "Drafting SEO descriptions & tags…",
  "Designing thumbnail prompts…",
  "Building your upload calendar…",
];

export function LoadingState() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-5">
      <div className="card relative overflow-hidden p-6">
        <div className="glow pointer-events-none absolute inset-0" />
        <div className="relative flex items-center gap-4">
          <div className="relative grid size-12 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-groq/30" />
            <span className="relative grid size-12 place-items-center rounded-full bg-groq text-white shadow-lg shadow-groq/40">
              <GroqMark className="size-5" />
            </span>
          </div>
          <div>
            <p className="font-display text-lg font-semibold">Cooking up your plan</p>
            <p key={step} className="animate-fade-up text-sm text-zinc-400">
              {STEPS[step]}
            </p>
          </div>
        </div>
        <div className="relative mt-5 h-1 overflow-hidden rounded-full bg-panel-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-groq to-amber-400 transition-all duration-700"
            style={{ width: `${((step + 1) / STEPS.length) * 92}%` }}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card space-y-3 p-3">
            <div className="skeleton aspect-video" />
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-5 w-11/12" />
            <div className="skeleton h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState() {
  const features = [
    { icon: TrendingUp, title: "Live trends", text: "Today's Google searches for your region" },
    { icon: Type, title: "Titles", text: "Main title + A/B alternatives" },
    { icon: AlignLeft, title: "Descriptions", text: "SEO-ready, with hooks & CTAs" },
    { icon: Tag, title: "Tags", text: "Broad + long-tail keywords" },
    { icon: Hash, title: "Hashtags", text: "Discoverable, on-topic" },
    { icon: ImageIcon, title: "Thumbnail prompts", text: "For Midjourney, Flux & DALL-E" },
  ];
  return (
    <div className="card relative overflow-hidden p-8 sm:p-10">
      <div className="bg-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-xl text-center">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl border border-groq/30 bg-groq/10 text-groq">
          <Sparkles className="size-6" />
        </div>
        <h2 className="font-display text-2xl font-semibold">Your content plan will appear here</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Set up your channel, pick the trends you like (or let the AI choose), then hit{" "}
          <span className="text-groq-soft">Generate plan</span>. You get a full kit for every video.
        </p>
      </div>
      <div className="relative mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border border-line bg-panel/70 p-4">
            <Icon className="mb-2 size-4 text-groq" />
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-zinc-500">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
