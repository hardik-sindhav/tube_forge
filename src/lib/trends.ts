import type { Trend } from "./types";

export const REGIONS: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "IN", name: "India" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "ID", name: "Indonesia" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "PH", name: "Philippines" },
  { code: "NG", name: "Nigeria" },
  { code: "ZA", name: "South Africa" },
  { code: "AE", name: "UAE" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "TR", name: "Turkey" },
];

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();

const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : "";
};

export async function fetchTrends(geo: string): Promise<Trend[]> {
  const res = await fetch(
    `https://trends.google.com/trending/rss?geo=${encodeURIComponent(geo)}`,
    {
      headers: { "User-Agent": "Mozilla/5.0 (TrendForge)" },
      next: { revalidate: 1800 },
    },
  );
  if (!res.ok) throw new Error(`Google Trends responded ${res.status}`);
  const xml = await res.text();

  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return items.map((item) => {
    const news = (item.match(/<ht:news_item>[\s\S]*?<\/ht:news_item>/g) ?? [])
      .slice(0, 3)
      .map((n) => ({
        title: tag(n, "ht:news_item_title"),
        url: tag(n, "ht:news_item_url"),
        source: tag(n, "ht:news_item_source"),
      }));
    return {
      title: tag(item, "title"),
      traffic: tag(item, "ht:approx_traffic"),
      pubDate: tag(item, "pubDate"),
      picture: tag(item, "ht:picture") || undefined,
      news,
    };
  });
}
