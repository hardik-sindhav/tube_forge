"use client";

import { Check, CircleCheck, Copy, ThumbsDown, ThumbsUp } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

/* ---------- Toast ---------- */

const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const push = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-fade-up flex items-center gap-2 rounded-full border border-line bg-panel-2/95 px-4 py-2 text-sm shadow-2xl shadow-black/50 backdrop-blur"
          >
            <Check className="size-4 text-emerald-400" />
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Copy button ---------- */

export function CopyButton({
  text,
  label = "Copy",
  toast = "Copied to clipboard",
  className = "",
}: {
  text: string;
  label?: string;
  toast?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);
  const notify = useToast();
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        notify(toast);
        setTimeout(() => setDone(false), 1500);
      }}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-groq/60 hover:text-white active:scale-95 ${className}`}
    >
      {done ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
      {done ? "Copied" : label}
    </button>
  );
}

/* ---------- Score ring ---------- */

export function ScoreRing({ value, size = 44 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const color = value >= 75 ? "#34d399" : value >= 50 ? "#f5a524" : "#f55036";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#26262d" strokeWidth="4" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold">{value}</span>
    </div>
  );
}

/* ---------- Misc ---------- */

export function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-zinc-400">
      <span>{children}</span>
      {hint && <span className="font-normal text-zinc-600">{hint}</span>}
    </label>
  );
}

export function Pill({
  children,
  tone = "default",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "default" | "groq" | "green" | "amber" | "blue";
  className?: string;
}) {
  const tones = {
    default: "border-line bg-panel-2 text-zinc-300",
    groq: "border-groq/30 bg-groq/10 text-groq-soft",
    green: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    blue: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
        <span className="grid size-7 place-items-center rounded-lg bg-groq/10 text-groq">{icon}</span>
        {title}
      </h3>
      {action}
    </div>
  );
}

export function GroqMark({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  );
}

export function PlayLogo() {
  return (
    <div className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-groq to-[#ff8a4c] shadow-lg shadow-groq/30">
      <svg viewBox="0 0 24 24" className="size-4 translate-x-[1px] text-white" fill="currentColor">
        <path d="M7 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5Z" />
      </svg>
      <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-bg ring-1 ring-groq/50">
        <GroqMark className="size-2.5 text-groq" />
      </span>
    </div>
  );
}

/* ---------- Feedback (feeds channel memory) ---------- */

export type FeedbackValue = "up" | "down" | "used";

export function FeedbackBar({
  value,
  onChange,
  size = "sm",
}: {
  value?: FeedbackValue;
  onChange: (v: FeedbackValue | null) => void;
  size?: "sm" | "md";
}) {
  const opts: { v: FeedbackValue; icon: React.ElementType; title: string; on: string }[] = [
    { v: "up", icon: ThumbsUp, title: "Like: more ideas like this", on: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
    { v: "used", icon: CircleCheck, title: "Used: I made this video", on: "bg-sky-500/15 text-sky-300 border-sky-500/40" },
    { v: "down", icon: ThumbsDown, title: "Dislike: avoid this style", on: "bg-red-500/15 text-red-300 border-red-500/40" },
  ];
  const box = size === "md" ? "size-8" : "size-7";
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {opts.map(({ v, icon: Icon, title, on }) => (
        <span
          key={v}
          role="button"
          tabIndex={0}
          title={title}
          aria-pressed={value === v}
          onClick={() => onChange(value === v ? null : v)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onChange(value === v ? null : v))}
          className={`grid ${box} cursor-pointer place-items-center rounded-lg border transition active:scale-90 ${
            value === v ? on : "border-line text-zinc-500 hover:border-zinc-500 hover:text-zinc-200"
          }`}
        >
          <Icon className="size-3.5" />
        </span>
      ))}
    </div>
  );
}
