"use client";

import type { PracticeSessionConfig } from "@/lib/practice-session-config";
import {
  configFromSessionKey,
  DEFAULT_PRACTICE_SESSION_CONFIG,
} from "@/lib/practice-session-config";
import {
  canonicalPracticeSessionKey,
  loadPracticeProgress,
  practicedQuestionCount,
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
const statusSnapshotCache = new Map<
  string,
  { version: number; status: PracticeSessionStatus | null }
>();

export function subscribePracticeStatus(listener: () => void): () => void {
  statusStoreListeners.add(listener);
  return () => statusStoreListeners.delete(listener);
}

export function bumpPracticeStatusStore(): void {
  statusStoreVersion += 1;
  statusSnapshotCache.clear();
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

function enumeratePoolSessionKeys(canonicalKey: string): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();

  const add = (sessionKey: string) => {
    if (seen.has(sessionKey)) return;
    seen.add(sessionKey);
    keys.push(sessionKey);
  };

  add(canonicalKey);

  if (typeof window === "undefined") return keys;

  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (!storageKey?.startsWith(PROGRESS_PREFIX)) continue;
    const sessionKey = storageKey.slice(PROGRESS_PREFIX.length);
    if (
      sessionKey === canonicalKey ||
      sessionKey.startsWith(`${canonicalKey}:s`)
    ) {
      add(sessionKey);
    }
  }

  return keys;
}

type InProgressCandidate = {
  sessionKey: string;
  config: PracticeSessionConfig;
  progress: PracticeProgress;
  practiced: number;
};

function findBestInProgressSession(
  questions: Question[],
  canonicalKey: string,
  preferredSessionKey?: string
): InProgressCandidate | null {
  let best: InProgressCandidate | null = null;

  for (const sessionKey of enumeratePoolSessionKeys(canonicalKey)) {
    const progress = loadPracticeProgress(sessionKey);
    const config =
      configFromSessionKey(sessionKey, canonicalKey) ??
      DEFAULT_PRACTICE_SESSION_CONFIG;
    const practiced = practicedQuestionCount(
      questions,
      progress,
      config.examSimulation
    );
    if (practiced === 0) continue;

    const candidate: InProgressCandidate = {
      sessionKey,
      config,
      progress,
      practiced,
    };

    if (!best) {
      best = candidate;
      continue;
    }

    if (candidate.practiced > best.practiced) {
      best = candidate;
      continue;
    }

    if (
      candidate.practiced === best.practiced &&
      preferredSessionKey === candidate.sessionKey
    ) {
      best = candidate;
    }
  }

  return best;
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

/** Read-only status resolution for UI subscriptions (no localStorage writes). */
function readPracticeSessionStatus(
  questions: Question[]
): PracticeSessionStatus | null {
  if (questions.length === 0) return null;

  const canonicalKey = canonicalPracticeSessionKey(questions);
  const pointer = loadPracticeSessionPointer(canonicalKey);

  if (pointer?.status === "completed" && pointer.resultId) {
    const result = loadPracticeResult(pointer.resultId);
    if (result) {
      return {
        kind: "completed",
        sessionKey: pointer.sessionKey,
        config: pointer.config,
        resultId: pointer.resultId,
        percent: 100,
      };
    }
  }

  const best = findBestInProgressSession(
    questions,
    canonicalKey,
    pointer?.status === "in_progress" ? pointer.sessionKey : undefined
  );

  if (!best) return null;

  const total = questions.length;
  const percent = total > 0 ? Math.round((best.practiced / total) * 100) : 0;

  return {
    kind: "in_progress",
    sessionKey: best.sessionKey,
    config: best.config,
    progress: best.progress,
    answered: best.practiced,
    total,
    percent,
  };
}

/** Cached snapshot for useSyncExternalStore (stable reference per store version). */
export function getPracticeSessionStatusSnapshot(
  questions: Question[]
): PracticeSessionStatus | null {
  if (questions.length === 0) return null;

  const canonicalKey = canonicalPracticeSessionKey(questions);
  const cached = statusSnapshotCache.get(canonicalKey);
  if (cached && cached.version === statusStoreVersion) {
    return cached.status;
  }

  const status = readPracticeSessionStatus(questions);
  statusSnapshotCache.set(canonicalKey, { version: statusStoreVersion, status });
  return status;
}

export function resolvePracticeSessionStatus(
  questions: Question[]
): PracticeSessionStatus | null {
  return getPracticeSessionStatusSnapshot(questions);
}

/** Sync pointer storage with the best in-progress session (explicit side effects). */
export function reconcilePracticeSessionPointer(questions: Question[]): void {
  if (questions.length === 0) return;

  const canonicalKey = canonicalPracticeSessionKey(questions);
  const status = readPracticeSessionStatus(questions);

  if (!status) {
    clearPracticeSessionPointer(canonicalKey);
    return;
  }

  if (status.kind === "completed") return;

  const pointer = loadPracticeSessionPointer(canonicalKey);
  if (
    pointer?.status === "completed" ||
    pointer?.sessionKey === status.sessionKey
  ) {
    return;
  }

  savePracticeSessionPointer(canonicalKey, {
    sessionKey: status.sessionKey,
    config: status.config,
    status: "in_progress",
    updatedAt: new Date().toISOString(),
  });
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
