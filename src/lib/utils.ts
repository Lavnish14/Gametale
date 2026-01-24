import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get a date-seeded random number for "Today's Pick" feature
 * Ensures the same game is shown all day (uses UTC for SSR consistency)
 */
export function getDailyIndex(arrayLength: number): number {
  if (arrayLength <= 0) return 0;
  const today = new Date();
  // Use UTC to ensure server/client consistency
  const seed = today.getUTCFullYear() * 10000 + (today.getUTCMonth() + 1) * 100 + today.getUTCDate();
  return seed % arrayLength;
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get rating color class based on score
 */
export function getRatingClass(rating: number): string {
  if (rating >= 80) return "high";
  if (rating >= 60) return "medium";
  return "low";
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

