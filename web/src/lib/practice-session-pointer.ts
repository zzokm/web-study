"use client";

import type { PracticeSessionConfig } from "@/lib/practice-session-config";
import {
  configFromSessionKey,
  DEFAULT_PRACTICE_SESSION_CONFIG,
} from "@/lib/practice-session-config";
import {
  answeredQuestionCount,
  canonicalPracticeSessionKey,
  hasPracticeProgress,
  loadPracticeProgress,
  type PracticeProgress,
} from "@/lib/practice-progress";
import { loadPracticeResult } from "@/lib/practice-results";
import type { Question } from "@/types/question";

export type PracticeSessionPointer = {
  sessionKey: string;
  config: PracticeSessionConfig;
  status: "in_progress" | "completed";
  resultId?: string;
  updatedAt: string;
};

const POINTER_PREFIX = "webstudy:practice-pointer-v1:";
const PROGRESS_PREFIX = "webstudy:practice-v1:";

let statusStoreVersion = 0;
const statusStoreListeners = new Set<() => void>();

export function subscribePracticeStatus(listener: () => void): () => void {
  statusStoreListeners.add(listener);
  return () => statusStoreListeners.delete(listener);
}

export function bumpPracticeStatusStore(): void {
  statusStoreVersion += 1;
  statusStoreListeners.forEach((listener) => listener());
}

export function getPracticeStatusStoreVersion(): number {
  return statusStoreVersion;
}

function pointerKey(canonicalKey: string): string {
  return POINTER_PREFIX + canonicalKey;
}

export function loadPracticeSessionPointer(
  canonicalKey: string
): PracticeSessionPointer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(pointerKey(canonicalKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PracticeSessionPointer;
    if (!parsed?.sessionKey || !parsed.config) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePracticeSessionPointer(
  canonicalKey: string,
  pointer: PracticeSessionPointer
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(pointerKey(canonicalKey), JSON.stringify(pointer));
  } catch {
    // ignore
  }
}

export function clearPracticeSessionPointer(canonicalKey: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(pointerKey(canonicalKey));
  } catch {
    // ignore
  }
}

function findLegacySessionKey(canonicalKey: string): string | null {
  if (typeof window === "undefined") return null;
  let match: string | null = null;
  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (!storageKey?.startsWith(PROGRESS_PREFIX)) continue;
    const sessionKey = storageKey.slice(PROGRESS_PREFIX.length);
    if (
      sessionKey !== canonicalKey &&
      !sessionKey.startsWith(`${canonicalKey}:s`)
    ) {
      continue;
    }
    const progress = loadPracticeProgress(sessionKey);
    if (hasPracticeProgress(progress)) {
      match = sessionKey;
    }
  }
  return match;
}

export type PracticeSessionStatus =
  | {
      kind: "in_progress";
      sessionKey: string;
      config: PracticeSessionConfig;
      progress: PracticeProgress;
      answered: number;
      total: number;
      percent: number;
    }
  | {
      kind: "completed";
      sessionKey: string;
      config: PracticeSessionConfig;
      resultId: string;
      percent: 100;
    };

export function resolvePracticeSessionStatus(
  questions: Question[]
): PracticeSessionStatus | null {
  if (questions.length === 0) return null;

  const canonicalKey = canonicalPracticeSessionKey(questions);
  let pointer = loadPracticeSessionPointer(canonicalKey);

  if (!pointer) {
    const legacySessionKey = findLegacySessionKey(canonicalKey);
    if (!legacySessionKey) return null;
    pointer = {
      sessionKey: legacySessionKey,
      config:
        configFromSessionKey(legacySessionKey, canonicalKey) ??
        DEFAULT_PRACTICE_SESSION_CONFIG,
      status: "in_progress",
      updatedAt: new Date().toISOString(),
    };
    savePracticeSessionPointer(canonicalKey, pointer);
  }

  if (pointer.status === "completed" && pointer.resultId) {
    const result = loadPracticeResult(pointer.resultId);
    if (!result) {
      clearPracticeSessionPointer(canonicalKey);
      return null;
    }
    return {
      kind: "completed",
      sessionKey: pointer.sessionKey,
      config: pointer.config,
      resultId: pointer.resultId,
      percent: 100,
    };
  }

  const progress = loadPracticeProgress(pointer.sessionKey);
  if (!hasPracticeProgress(progress)) {
    clearPracticeSessionPointer(canonicalKey);
    return null;
  }

  const answered = answeredQuestionCount(questions, progress);
  const total = questions.length;
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;

  return {
    kind: "in_progress",
    sessionKey: pointer.sessionKey,
    config: pointer.config,
    progress,
    answered,
    total,
    percent,
  };
}

export function touchPracticeSessionPointer(args: {
  questions: Question[];
  sessionKey: string;
  config: PracticeSessionConfig;
  status?: "in_progress" | "completed";
  resultId?: string;
}): void {
  const canonicalKey = canonicalPracticeSessionKey(args.questions);
  savePracticeSessionPointer(canonicalKey, {
    sessionKey: args.sessionKey,
    config: args.config,
    status: args.status ?? "in_progress",
    resultId: args.resultId,
    updatedAt: new Date().toISOString(),
  });
}
