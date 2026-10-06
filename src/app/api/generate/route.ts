import { NextResponse } from "next/server";
import { generateOneVideo, generatePlan } from "@/lib/groq";
import type { ChannelProfile, MemoryDigest, Trend, VideoIdea } from "@/lib/types";

export const maxDuration = 60;

type Body = {
  mode?: "plan" | "video";
  profile: ChannelProfile;
  trends?: Trend[];
  customTopics?: string[];
  memory?: MemoryDigest;
  fresh?: boolean;
  slot?: VideoIdea["schedule"];
  avoid?: string[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.profile?.category) {
      return NextResponse.json({ error: "Channel category is required" }, { status: 400 });
    }
    // Only send the fields the prompt uses, so the trends list stays small.
    const trends = (Array.isArray(body.trends) ? body.trends : [])
      .slice(0, 15)
      .map((t) => ({ title: String(t.title), traffic: String(t.traffic ?? ""), pubDate: "", news: [] }));
    const customTopics = (body.customTopics ?? []).map((t) => String(t).trim()).filter(Boolean).slice(0, 10);

    if (body.mode === "video") {
      if (!body.slot) return NextResponse.json({ error: "slot is required" }, { status: 400 });
      const result = await generateOneVideo({
        profile: body.profile,
        trends,
        customTopics,
        memory: body.memory,
        slot: body.slot,
        avoid: (body.avoid ?? []).slice(0, 12),
      });
      return NextResponse.json(result);
    }

    const result = await generatePlan({
      profile: body.profile,
      trends,
      customTopics,
      memory: body.memory,
      fresh: body.fresh,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 500 },
    );
  }
}
