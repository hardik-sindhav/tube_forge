"use client";

import { AlertTriangle, RotateCcw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ChannelForm } from "@/components/ChannelForm";
import { MemoryPanel } from "@/components/MemoryPanel";
import { PromoBar, PromoFooter } from "@/components/Promo";
import { Results } from "@/components/Results";
import { EmptyState, LoadingState } from "@/components/States";
import { TrendsPanel } from "@/components/TrendsPanel";
import { type FeedbackValue, PlayLogo, ToastProvider } from "@/components/ui";
import { DEFAULT_PROFILE } from "@/lib/constants";
import {
  digest,
  emptyStore,
  feedbackOf,
  forgetChannel,
  loadStore,
  type MemoryStore,
  rememberPlan,
  rememberTitle,
  saveStore,
  setFeedback,
} from "@/lib/memory";
import { REGIONS } from "@/lib/trends";
import type { ChannelProfile, GenerateResponse, Trend, VideoIdea } from "@/lib/types";

const STORAGE_KEY = "tubeforge:v1";

export default function Home() {
  const [profile, setProfile] = useState<ChannelProfile>(DEFAULT_PROFILE);
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [store, setStore] = useState<MemoryStore>(emptyStore);
  const [useMemory, setUseMemory] = useState(true);
  const [regenerating, setRegenerating] = useState<number | null>(null);

  // Restore saved session
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.profile) setProfile({ ...DEFAULT_PROFILE, ...saved.profile });
      if (saved?.customTopics) setCustomTopics(saved.customTopics);
      if (saved?.result?.plan?.videos?.length) setResult(saved.result);
      if (typeof saved?.useMemory === "boolean") setUseMemory(saved.useMemory);
    } catch {}
    setStore(loadStore());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, customTopics, result, useMemory }));
    } catch {}
  }, [profile, customTopics, result, useMemory, hydrated]);

  useEffect(() => {
    if (hydrated) saveStore(store);
  }, [store, hydrated]);

  const loadTrends = useCallback(async (geo: string) => {
    setTrendsLoading(true);
    setTrendsError(null);
    try {
      const res = await fetch(`/api/trends?geo=${geo}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load trends");
      setTrends(data.trends);
    } catch (e) {
      setTrends([]);
      setTrendsError(e instanceof Error ? e.message : "Could not load trends");
    } finally {
      setTrendsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSelected(new Set());
    loadTrends(profile.region);
  }, [profile.region, hydrated, loadTrends]);

  const toggle = (title: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(title)) n.delete(title);
      else n.add(title);
      return n;
    });

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          trends: chosenTrends(),
          customTopics,
          memory: useMemory ? digest(store, profile) : undefined,
          fresh: Boolean(result),
        }),
      });
      const data: GenerateResponse & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResult(data);
      setStore((st) => {
        const next = rememberPlan(st, profile, data);
        return data.meta.cacheHit ? { ...next, tokensSaved: next.tokensSaved + data.meta.totalTokens } : next;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const chosenTrends = () =>
    (selected.size ? trends.filter((t) => selected.has(t.title)) : trends).map((t) => ({
      title: t.title,
      traffic: t.traffic,
    }));

  const regenerateVideo = async (index: number) => {
    if (!result) return;
    setRegenerating(index);
    setError(null);
    try {
      const target = result.plan.videos[index];
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "video",
          profile,
          trends: chosenTrends(),
          customTopics,
          memory: useMemory ? digest(store, profile) : undefined,
          slot: target.schedule,
          avoid: result.plan.videos.map((v) => v.title),
        }),
      });
      const data: { video: VideoIdea; error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || "Regeneration failed");
      setResult((r) =>
        r ? { ...r, plan: { ...r.plan, videos: r.plan.videos.map((v, i) => (i === index ? data.video : v)) } } : r,
      );
      // The replaced idea counts as a soft "no", so remember it as done.
      setStore((st) => rememberTitle(st, profile, data.video.title));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Regeneration failed");
    } finally {
      setRegenerating(null);
    }
  };

  const loadHistory = (id: string) => {
    const h = store.history.find((x) => x.id === id);
    if (!h) return;
    setProfile(h.profile);
    setResult(h.result);
    setStore((st) => ({ ...st, tokensSaved: st.tokensSaved + h.result.meta.totalTokens }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const regionName = REGIONS.find((r) => r.code === profile.region)?.name ?? profile.region;

  return (
    <ToastProvider>
      <div className="relative min-h-screen">
        <div className="bg-grid pointer-events-none fixed inset-x-0 top-0 h-[520px]" />
        <div className="glow pointer-events-none fixed inset-x-0 top-0 h-[520px]" />

        <PromoBar />

        {/* Nav */}
        <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/70 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <PlayLogo />
              <div>
                <p className="font-display text-[17px] font-bold leading-none tracking-tight">TubeForge</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">AI YouTube Planner</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {result && (
                <span className="hidden items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1 text-xs text-zinc-400 md:inline-flex">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  {result.plan.videos.length} videos planned
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="relative mx-auto max-w-[1500px] px-4 pb-16 pt-8 sm:px-6">
          {/* Hero */}
          <section className="mb-8 max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-panel/80 px-3 py-1 text-xs text-zinc-400">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              Live trends · {regionName}
            </p>
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Turn today&apos;s trends into your <span className="text-gradient">next viral video.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-zinc-400 sm:text-base">
              A full YouTube plan in seconds: titles, descriptions, tags, hashtags, thumbnail prompts and an upload
              calendar, tailored to your channel.
            </p>
          </section>

          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            {/* Sidebar */}
            <aside className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pb-2 scroll-thin">
              <ChannelForm profile={profile} onChange={setProfile} />
              <TrendsPanel
                trends={trends}
                loading={trendsLoading}
                error={trendsError}
                selected={selected}
                onToggle={toggle}
                onSetSelected={(t) => setSelected(new Set(t))}
                onRefresh={() => loadTrends(profile.region)}
                customTopics={customTopics}
                onCustomTopics={setCustomTopics}
              />
              <MemoryPanel
                store={store}
                profile={profile}
                enabled={useMemory}
                onToggle={setUseMemory}
                onForget={() => setStore((st) => forgetChannel(st, profile))}
                onLoadHistory={loadHistory}
              />
              <div className="sticky bottom-0 bg-gradient-to-t from-bg via-bg to-transparent pt-3">
                <button
                  onClick={generate}
                  disabled={generating}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-groq px-4 py-3.5 font-semibold text-white shadow-xl shadow-groq/25 transition hover:bg-[#ff5f45] active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition duration-700 group-hover:translate-x-full" />
                  {generating ? (
                    <>
                      <RotateCcw className="size-4 animate-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" /> {result ? "Regenerate plan" : "Generate plan"}
                    </>
                  )}
                </button>
              </div>
            </aside>

            {/* Main */}
            <section className="min-w-0">
              {error && (
                <div className="animate-fade-up mb-5 flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/[0.06] p-4 text-sm text-red-200">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-400" />
                  <div>
                    <p className="font-semibold">Something went wrong</p>
                    <p className="text-red-300/80">{error}</p>
                  </div>
                </div>
              )}
              {generating ? (
                <LoadingState />
              ) : result ? (
                <Results
                  result={result}
                  profile={profile}
                  feedbackOf={(t) => feedbackOf(store, profile, t)}
                  onFeedback={(t, fb: FeedbackValue | null) => setStore((st) => setFeedback(st, profile, t, fb))}
                  onRegenerate={regenerateVideo}
                  regenerating={regenerating}
                />
              ) : (
                <EmptyState />
              )}
            </section>
          </div>
        </main>

        <PromoFooter />
      </div>
    </ToastProvider>
  );
}
