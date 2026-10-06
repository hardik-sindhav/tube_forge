import type { ChannelProfile } from "./types";

export const CATEGORIES = [
  "Tech & Gadgets",
  "Gaming",
  "Education",
  "Finance & Investing",
  "Business & Marketing",
  "Health & Fitness",
  "Food & Cooking",
  "Travel",
  "Beauty & Fashion",
  "Entertainment & Comedy",
  "Music",
  "Vlogs & Lifestyle",
  "News & Politics",
  "Science",
  "Sports",
  "Automotive",
  "DIY & Crafts",
  "Kids & Family",
  "Movies & TV",
  "Motivation & Self-help",
  "AI & Programming",
  "Spirituality",
];

export const LANGUAGES = [
  "English",
  "Hindi",
  "Hinglish",
  "Urdu",
  "Spanish",
  "Portuguese",
  "French",
  "German",
  "Arabic",
  "Indonesian",
  "Bengali",
  "Japanese",
  "Korean",
  "Turkish",
];

export const TONES = ["Energetic", "Educational", "Funny", "Calm & Cozy", "Bold & Edgy", "Professional", "Storytelling"];

export const GOALS = ["Grow subscribers", "Maximise views", "Increase watch time", "Drive sales / leads", "Build community"];

export const DEFAULT_PROFILE: ChannelProfile = {
  channelName: "",
  category: "Tech & Gadgets",
  niche: "",
  audience: "",
  language: "English",
  region: "US",
  format: "mixed",
  videosPerWeek: 3,
  weeks: 2,
  tone: "Energetic",
  goal: "Grow subscribers",
};

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
