import type { TripCategory } from "@/types";

/** Format a number as USD currency string, e.g. 2500 → "$2,500.00" */
export function formatCurrency(amount: number): string {
  return `USD ${new Intl.NumberFormat("en-US").format(amount)}`;
}

/** Tailwind classes for each trip category badge */
export const categoryStyles: Record<
  TripCategory,
  { bg: string; text: string }
> = {
  Backpacker: { bg: "bg-emerald-100", text: "text-emerald-700" },
  Standard:   { bg: "bg-blue-100",    text: "text-blue-700"    },
  Luxury:     { bg: "bg-purple-100",  text: "text-purple-700"  },
};

/** Returns the combined Tailwind class string for a category badge */
export function getCategoryClass(category: TripCategory | string): string {
  const style = categoryStyles[category as TripCategory];
  if (!style) return "bg-slate-100 text-slate-700";
  return `${style.bg} ${style.text}`;
}

/** Truncate a string to a max length, appending "…" if cut */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "…";
}

/** Returns the base URL for API calls */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Returns an emoji icon based on destination string */
export function getDestinationIcon(destination: string): string {
  const lower = (destination || "").toLowerCase();
  if (lower.includes("japan") || lower.includes("tokyo") || lower.includes("kyoto")) return "🇯🇵";
  if (lower.includes("france") || lower.includes("paris")) return "🇫🇷";
  if (lower.includes("italy") || lower.includes("rome")) return "🇮🇹";
  if (lower.includes("usa") || lower.includes("new york") || lower.includes("america")) return "🇺🇸";
  if (lower.includes("uk") || lower.includes("london") || lower.includes("england")) return "🇬🇧";
  if (lower.includes("indonesia") || lower.includes("bali") || lower.includes("jakarta")) return "🇮🇩";
  if (lower.includes("australia") || lower.includes("sydney")) return "🇦🇺";
  if (lower.includes("thailand") || lower.includes("bangkok")) return "🇹🇭";
  return "📍";
}

/** Returns an icon based on travel style */
export function getTravelStyleIcon(style: string): string {
  const lower = (style || "").toLowerCase();
  if (lower.includes("family")) return "👨‍👩‍👧‍👦";
  if (lower.includes("solo")) return "🧑";
  if (lower.includes("couple")) return "👩‍❤️‍👨";
  if (lower.includes("friends")) return "👯";
  if (lower.includes("business")) return "💼";
  return "🎒";
}
