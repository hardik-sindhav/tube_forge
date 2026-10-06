import { NextResponse } from "next/server";
import { fetchTrends } from "@/lib/trends";

export async function GET(req: Request) {
  const geo = (new URL(req.url).searchParams.get("geo") || "US").toUpperCase();
  if (!/^[A-Z]{2}$/.test(geo)) {
    return NextResponse.json({ error: "Invalid region" }, { status: 400 });
  }
  try {
    const trends = await fetchTrends(geo);
    return NextResponse.json({ geo, trends, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load trends" },
      { status: 502 },
    );
  }
}
