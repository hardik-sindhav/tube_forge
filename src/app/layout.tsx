import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });

export const metadata: Metadata = {
  title: "TubeForge · AI YouTube Planner",
  description:
    "Turn live Google Trends into a ready-to-shoot YouTube plan: titles, descriptions, tags, hashtags and thumbnail prompts, generated in seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
