"use client";

import type { PracticeSessionConfig } from "@/lib/practice-session-config";

export type ActivePracticeSession = {
  version: 1;
  returnPath: string;
  sessionKey: string;
  canonicalKey: string;
  config: PracticeSessionConfig;
  currentIndex: number;
  updatedAt: string;
};

const STORAGE_KEY = "webstudy:practice-active-v1";

export function saveActivePracticeSession(session: ActivePracticeSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore quota / private mode
  }
}

export function loadActivePracticeSession(): ActivePracticeSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActivePracticeSession;
    if (
      parsed?.version !== 1 ||
      !parsed.returnPath ||
      !parsed.sessionKey ||
      !parsed.canonicalKey ||
      !parsed.config ||
      typeof parsed.currentIndex !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearActivePracticeSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
