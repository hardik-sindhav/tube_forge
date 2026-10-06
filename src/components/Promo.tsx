"use client";

import { ArrowUpRight, Eraser, Maximize2, Minimize2, Scaling, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

/*
 * ProCutOut cross-promotion. All links are intentionally dofollow:
 * no rel="nofollow" / "sponsored" / "ugc". We keep rel="noopener" for safety
 * but omit "noreferrer" so ProCutOut analytics see the referral.
 */

const SITE = "https://procutout.com";
const UTM = "utm_source=tubeforge&utm_medium=referral";
const url = (path: string, campaign: string) => `${SITE}${path}?${UTM}&utm_campaign=${campaign}`;

const TOOLS = [
  { path: "/background-remover", name: "Background Remover", text: "Cut yourself out for the thumbnail", icon: Eraser },
  { path: "/image-upscaler", name: "Image Upscaler", text: "Sharpen AI art to crisp 4K", icon: Maximize2 },
  { path: "/image-resizer", name: "Image Resizer", text: "Exact 1280×720 thumbnail size", icon: Scaling },
  { path: "/image-compressor", name: "Image Compressor", text: "Under YouTube's 2 MB limit", icon: Minimize2 },
];

function Logo({ className = "size-5" }: { className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white ${className}`}>
      <Sparkles className="size-[60%]" />
    </span>
  );
}

/** Slim announcement bar shown above the navigation. */
export function PromoBar() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      setHidden(sessionStorage.getItem("tf:promobar") === "0");
    } catch {}
  }, []);
  if (hidden) return null;

  return (
    <div className="relative z-50 border-b border-violet-500/20 bg-gradient-to-r from-violet-600/20 via-fuchsia-600/15 to-violet-600/20">
      <div className="mx-auto flex max-w-[1500px] items-center justify-center gap-2 px-10 py-2 text-center text-xs text-zinc-200">
        <Logo className="size-4" />
        <span>
          <span className="hidden sm:inline">Need a thumbnail? </span>
          Remove backgrounds, upscale &amp; resize images free with{" "}
          <a
            href={url("/", "topbar")}
            target="_blank"
            rel="noopener"
            className="font-semibold text-white underline decoration-fuchsia-400/60 underline-offset-2 hover:decoration-fuchsia-300"
          >
            ProCutOut
          </a>
        </span>
        <ArrowUpRight className="hidden size-3.5 text-fuchsia-300 sm:block" />
        <button
          onClick={() => {
            setHidden(true);
            try {
              sessionStorage.setItem("tf:promobar", "0");
            } catch {}
          }}
          className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-zinc-400 hover:bg-white/10 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

/** Contextual card inside the video drawer, right where users need it. */
export function ThumbnailToolsCard() {
  return (
    <section className="overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-600/[0.12] to-fuchsia-600/[0.06] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Logo className="size-6" />
          <div>
            <p className="text-sm font-semibold text-zinc-100">Finish your thumbnail</p>
            <p className="text-[11px] text-zinc-400">Free, in-browser, no sign-up</p>
          </div>
        </div>
        <a
          href={url("/tools", "drawer")}
          target="_blank"
          rel="noopener"
          className="shrink-0 text-[11px] font-medium text-fuchsia-300 hover:text-fuchsia-200"
        >
          All tools →
        </a>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {TOOLS.map(({ path, name, icon: Icon }) => (
          <a
            key={path}
            href={url(path, "drawer")}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-violet-400/40 hover:bg-black/30"
          >
            <Icon className="size-3.5 text-violet-300" />
            {name}
          </a>
        ))}
      </div>
    </section>
  );
}

/** Large banner + footer, rendered on every page. */
export function PromoFooter() {
  return (
    <footer className="relative mx-auto max-w-[1500px] px-4 pb-10 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/25 bg-[#0f0b1a] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-fuchsia-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 size-72 rounded-full bg-violet-600/25 blur-3xl" />

        <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[11px] font-medium text-violet-200">
              <Logo className="size-4" /> From the makers of TubeForge
            </p>
            <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">
              Turn your thumbnail prompt into a{" "}
              <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                click-worthy thumbnail
              </span>
            </h2>
            <p className="mt-2 max-w-md text-sm text-zinc-400">
              <a href={url("/", "footer")} target="_blank" rel="noopener" className="font-medium text-zinc-200 hover:text-white">
                ProCutOut
              </a>{" "}
              has 130+ free online tools for images, PDFs and more. They run in your browser, with no watermarks and
              no account needed.
            </p>
            <a
              href={url("/tools", "footer")}
              target="_blank"
              rel="noopener"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110"
            >
              Explore free tools <ArrowUpRight className="size-4" />
            </a>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {TOOLS.map(({ path, name, text, icon: Icon }) => (
              <a
                key={path}
                href={url(path, "footer")}
                target="_blank"
                rel="noopener"
                className="group flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-white/[0.06]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-sm font-semibold text-zinc-100">
                    {name}
                    <ArrowUpRight className="size-3 opacity-0 transition group-hover:opacity-100" />
                  </span>
                  <span className="text-xs text-zinc-500">{text}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-2 text-xs text-zinc-600 sm:flex-row">
        <p>© {new Date().getFullYear()} TubeForge · AI YouTube Planner</p>
        <p>
          A free project by{" "}
          <a href={url("/", "credit")} target="_blank" rel="noopener" className="text-zinc-400 hover:text-white">
            ProCutOut: free online image &amp; PDF tools
          </a>
        </p>
      </div>
    </footer>
  );
}
