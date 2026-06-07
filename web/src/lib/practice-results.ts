"use client";

import type { MockExamSpec } from "@/lib/mock-exam";
import type { PracticeSessionConfig } from "@/lib/practice-session-config";
import { DEFAULT_PRACTICE_SESSION_CONFIG } from "@/lib/practice-session-config";
import type { PracticeProgress } from "@/lib/practice-progress";

export interface StoredPracticeResult {
  sessionKey: string;
  title: string;
  finishedAt: string;
  /** ISO timestamp when the practice session started. */
  sessionStartedAt?: string;
  questionKeys: string[];
  progress: PracticeProgress;
  config?: PracticeSessionConfig;
  mockExamSpec?: MockExamSpec;
}

const RESULT_PREFIX = "webstudy:practice-result-v1:";

export function resultStorageId(sessionKey: string): string {
  let h = 5381;
  for (let i = 0; i < sessionKey.length; i++) {
    h = (h * 33) ^ sessionKey.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}

export function savePracticeResult(result: StoredPracticeResult): string {
  const id = resultStorageId(result.sessionKey);
  if (typeof window === "undefined") return id;
  try {
    localStorage.setItem(RESULT_PREFIX + id, JSON.stringify(result));
  } catch {
    // ignore
  }
  return id;
}

export function loadPracticeResult(id: string): StoredPracticeResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RESULT_PREFIX + id);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPracticeResult;
    if (
      !parsed?.sessionKey ||
      !Array.isArray(parsed.questionKeys) ||
      !parsed.progress
    ) {
      return null;
    }
    return {
      ...parsed,
      config: parsed.config ?? DEFAULT_PRACTICE_SESSION_CONFIG,
    };
  } catch {
    return null;
  }
}
