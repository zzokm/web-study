"use client";

import { clearActivePracticeSession } from "@/lib/practice-active-session";
import { bumpPracticeStatusStore } from "@/lib/practice-session-pointer";

const PRACTICE_STORAGE_PREFIXES = [
  "webstudy:practice-v1:",
  "webstudy:practice-display-v1:",
  "webstudy:practice-pointer-v1:",
  "webstudy:practice-result-v1:",
] as const;

/** Clears all practice session progress and results. Does not touch saved questions. */
export function clearAllPracticeProgress(): void {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        PRACTICE_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))
      ) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    clearActivePracticeSession();
    bumpPracticeStatusStore();
  } catch {
    // ignore
  }
}
