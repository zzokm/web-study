"use client";

import type { PracticeSessionConfig } from "@/lib/practice-session-config";
import {
  configFromSessionKey,
  DEFAULT_PRACTICE_SESSION_CONFIG,
} from "@/lib/practice-session-config";
import {
  canonicalPracticeSessionKey,
  isQuestionPracticed,
  loadPracticeProgress,
  parseQuestionKeysFromSessionKey,
  practicedQuestionCount,
  type PracticeProgress,
} from "@/lib/practice-progress";
import {
  innerKeyFromScopedStorageKey,
  type PracticeScopeId,
  resultMatchesPracticeScope,
  scopeIdFromStorageKey,
  scopeStorageKey,
} from "@/lib/practice-scope";
import {
  loadPracticeResult,
  resultStorageId,
  type StoredPracticeResult,
} from "@/lib/practice-results";
import { isWrittenQuestion } from "@/lib/questions";
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
const RESULT_PREFIX = "webstudy:practice-result-v1:";

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

function scopedPointerKey(scopeId: string, canonicalKey: string): string {
  return POINTER_PREFIX + scopeStorageKey(scopeId, canonicalKey);
}

function legacyPointerKey(canonicalKey: string): string {
  return POINTER_PREFIX + canonicalKey;
}

function statusCacheKey(scopeId: string, canonicalKey: string): string {
  return `${scopeId}:${canonicalKey}`;
}

function parsePointerStorageKey(
  storageKey: string
): { scopeId: string | null; canonicalKey: string } {
  const scopedScopeId = scopeIdFromStorageKey(storageKey);
  if (scopedScopeId) {
    const inner = innerKeyFromScopedStorageKey(storageKey);
    return { scopeId: scopedScopeId, canonicalKey: inner ?? storageKey };
  }
  return { scopeId: null, canonicalKey: storageKey };
}

function pointerMatchesScope(
  scopeId: PracticeScopeId,
  storageCanonicalKey: string,
  pointer: PracticeSessionPointer
): boolean {
  const parsed = parsePointerStorageKey(storageCanonicalKey);
  if (parsed.scopeId === scopeId) return true;
  if (parsed.scopeId != null) return false;

  if (pointer.status !== "completed" || !pointer.resultId) return false;
  const result = loadPracticeResult(pointer.resultId);
  return resultMatchesPracticeScope(result?.returnHref, scopeId);
}

export function loadPracticeSessionPointer(
  scopeId: PracticeScopeId,
  canonicalKey: string
): PracticeSessionPointer | null {
  if (typeof window === "undefined") return null;
  try {
    const scopedRaw = localStorage.getItem(scopedPointerKey(scopeId, canonicalKey));
    if (scopedRaw) {
      const parsed = JSON.parse(scopedRaw) as PracticeSessionPointer;
      if (parsed?.sessionKey && parsed.config) return parsed;
    }

    const legacyRaw = localStorage.getItem(legacyPointerKey(canonicalKey));
    if (!legacyRaw) return null;
    const legacy = JSON.parse(legacyRaw) as PracticeSessionPointer;
    if (!legacy?.sessionKey || !legacy.config) return null;
    if (!pointerMatchesScope(scopeId, canonicalKey, legacy)) return null;
    return legacy;
  } catch {
    return null;
  }
}

export function savePracticeSessionPointer(
  scopeId: PracticeScopeId,
  canonicalKey: string,
  pointer: PracticeSessionPointer
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      scopedPointerKey(scopeId, canonicalKey),
      JSON.stringify(pointer)
    );
  } catch {
    // ignore
  }
}

export function clearPracticeSessionPointer(
  scopeId: PracticeScopeId,
  canonicalKey: string
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(scopedPointerKey(scopeId, canonicalKey));
    const legacyRaw = localStorage.getItem(legacyPointerKey(canonicalKey));
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as PracticeSessionPointer;
      if (pointerMatchesScope(scopeId, canonicalKey, legacy)) {
        localStorage.removeItem(legacyPointerKey(canonicalKey));
      }
    }
  } catch {
    // ignore
  }
}

function resolveSessionConfig(
  scopeId: PracticeScopeId,
  sessionKey: string,
  poolCanonicalKey: string
): PracticeSessionConfig {
  const sessionCanonical = canonicalPracticeSessionKey(
    parseQuestionKeysFromSessionKey(sessionKey).map((questionKey) => ({
      questionKey,
    }))
  );
  return (
    configFromSessionKey(sessionKey, poolCanonicalKey) ??
    configFromSessionKey(sessionKey, sessionCanonical) ??
    DEFAULT_PRACTICE_SESSION_CONFIG
  );
}

function poolKeysAreSupersetOf(
  poolKeys: string[],
  subsetKeys: Iterable<string>
): boolean {
  if (poolKeys.length === 0) return false;
  const superset = new Set(poolKeys);
  for (const key of subsetKeys) {
    if (!superset.has(key)) return false;
  }
  return true;
}

function sessionKeyBelongsToPool(
  scopeId: PracticeScopeId,
  sessionKey: string,
  canonicalKey: string,
  currentQuestionKeys: Set<string>
): boolean {
  if (sessionKey === canonicalKey || sessionKey.startsWith(`${canonicalKey}:s`)) {
    return true;
  }

  const poolKeys = parseQuestionKeysFromSessionKey(sessionKey);
  if (poolKeys.length === 0) return false;

  if (
    poolKeys.length >= currentQuestionKeys.size &&
    poolKeysAreSupersetOf(poolKeys, currentQuestionKeys)
  ) {
    return true;
  }

  const legacyCanonical = canonicalPracticeSessionKey(
    poolKeys.map((questionKey) => ({ questionKey }))
  );
  return (
    legacyCanonical === canonicalKey ||
    legacyCanonical.startsWith(`${canonicalKey}:s`)
  );
}

function progressOverlapsCurrentPool(
  progress: PracticeProgress,
  currentQuestionKeys: Set<string>
): boolean {
  return Object.keys(progress).some((key) => currentQuestionKeys.has(key));
}

function legacyProgressBelongsToPool(
  sessionKey: string,
  progress: PracticeProgress,
  questions: Question[],
  currentQuestionKeys: Set<string>
): boolean {
  if (!progressOverlapsCurrentPool(progress, currentQuestionKeys)) return false;

  const attemptedKeys = Object.keys(progress).filter(
    (key) => progress[key]?.selectedId != null || progress[key]?.revealed
  );
  if (
    attemptedKeys.length > 0 &&
    !attemptedKeys.every((key) => currentQuestionKeys.has(key))
  ) {
    return false;
  }

  const poolKeys = parseQuestionKeysFromSessionKey(sessionKey);
  if (poolKeys.length === 0) return true;
  if (
    poolKeys.length >= currentQuestionKeys.size &&
    poolKeysAreSupersetOf(poolKeys, currentQuestionKeys)
  ) {
    return true;
  }
  if (!poolKeys.every((key) => currentQuestionKeys.has(key))) return false;
  if (poolKeys.length > questions.length) return false;

  const legacyCanonical = canonicalPracticeSessionKey(
    poolKeys.map((questionKey) => ({ questionKey }))
  );
  return (
    legacyCanonical === canonicalPracticeSessionKey(questions) ||
    poolKeys.length <= questions.length
  );
}

function enumeratePoolSessionKeys(
  scopeId: PracticeScopeId,
  canonicalKey: string,
  questions: Question[]
): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  const currentQuestionKeys = new Set(questions.map((q) => q.questionKey));

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
    const rawKey = storageKey.slice(PROGRESS_PREFIX.length);
    const scopedInner = innerKeyFromScopedStorageKey(rawKey);
    const scopedScopeId = scopeIdFromStorageKey(rawKey);

    if (scopedScopeId === scopeId && scopedInner) {
      if (
        scopedInner === canonicalKey ||
        scopedInner.startsWith(`${canonicalKey}:s`) ||
        sessionKeyBelongsToPool(
          scopeId,
          scopedInner,
          canonicalKey,
          currentQuestionKeys
        )
      ) {
        add(scopedInner);
        continue;
      }

      const progress = loadPracticeProgress(scopeId, scopedInner);
      if (
        legacyProgressBelongsToPool(
          scopedInner,
          progress,
          questions,
          currentQuestionKeys
        )
      ) {
        add(scopedInner);
      }
      continue;
    }

    if (scopedScopeId != null) continue;

    if (
      rawKey === canonicalKey ||
      rawKey.startsWith(`${canonicalKey}:s`) ||
      sessionKeyBelongsToPool(scopeId, rawKey, canonicalKey, currentQuestionKeys)
    ) {
      add(rawKey);
      continue;
    }

    const progress = loadPracticeProgress(scopeId, rawKey);
    if (
      legacyProgressBelongsToPool(
        rawKey,
        progress,
        questions,
        currentQuestionKeys
      )
    ) {
      add(rawKey);
    }
  }

  return keys;
}

function enumerateStoredPracticePointers(
  scopeId: PracticeScopeId
): Array<{
  storageCanonicalKey: string;
  pointer: PracticeSessionPointer;
}> {
  const entries: Array<{
    storageCanonicalKey: string;
    pointer: PracticeSessionPointer;
  }> = [];
  if (typeof window === "undefined") return entries;

  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (!storageKey?.startsWith(POINTER_PREFIX)) continue;
    const storageCanonicalKey = storageKey.slice(POINTER_PREFIX.length);
    const parsed = parsePointerStorageKey(storageCanonicalKey);
    const pointer = loadPracticeSessionPointer(
      scopeId,
      parsed.canonicalKey
    );
    if (pointer && pointerMatchesScope(scopeId, storageCanonicalKey, pointer)) {
      entries.push({ storageCanonicalKey: parsed.canonicalKey, pointer });
    }
  }

  return entries;
}

function enumerateStoredPracticeResults(
  scopeId: PracticeScopeId
): StoredPracticeResult[] {
  const results: StoredPracticeResult[] = [];
  if (typeof window === "undefined") return results;

  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (!storageKey?.startsWith(RESULT_PREFIX)) continue;
    const result = loadPracticeResult(storageKey.slice(RESULT_PREFIX.length));
    if (
      result &&
      resultMatchesPracticeScope(result.returnHref, scopeId)
    ) {
      results.push(result);
    }
  }

  return results;
}

function isCompletedResultForPool(
  result: StoredPracticeResult,
  questions: Question[],
  currentQuestionKeys: Set<string>
): boolean {
  if (!result.questionKeys?.length || !result.progress) return false;

  const examSimulation = result.config?.examSimulation ?? false;
  const questionByKey = new Map(
    questions.map((question) => [question.questionKey, question])
  );

  const isPracticed = (key: string): boolean => {
    const question = questionByKey.get(key);
    const attempt = result.progress[key];
    if (!question || !attempt) return false;
    return isQuestionPracticed(question, attempt, examSimulation);
  };

  if (result.questionKeys.every((key) => currentQuestionKeys.has(key))) {
    return result.questionKeys.every(isPracticed);
  }

  // Current pool is narrower than the saved result (e.g. MCQ-only lecture view).
  return questions.every((question) => isPracticed(question.questionKey));
}

function completedStatusFromPointer(
  pointer: PracticeSessionPointer
): PracticeSessionStatus | null {
  if (pointer.status !== "completed" || !pointer.resultId) return null;
  const result = loadPracticeResult(pointer.resultId);
  if (!result) return null;
  return {
    kind: "completed",
    sessionKey: pointer.sessionKey,
    config: pointer.config,
    resultId: pointer.resultId,
    percent: 100,
  };
}

function findLegacyCompletedStatus(
  questions: Question[],
  scopeId: PracticeScopeId,
  canonicalKey: string,
  currentQuestionKeys: Set<string>
): { status: PracticeSessionStatus; pointer: PracticeSessionPointer } | null {
  let best:
    | { status: PracticeSessionStatus; pointer: PracticeSessionPointer }
    | null = null;

  for (const { storageCanonicalKey, pointer } of enumerateStoredPracticePointers(
    scopeId
  )) {
    if (storageCanonicalKey === canonicalKey) continue;
    const status = completedStatusFromPointer(pointer);
    if (!status || status.kind !== "completed") continue;

    const result = loadPracticeResult(status.resultId);
    if (
      !result ||
      !isCompletedResultForPool(result, questions, currentQuestionKeys)
    ) {
      continue;
    }

    const candidate = { status, pointer };
    if (!best || pointer.updatedAt > best.pointer.updatedAt) {
      best = candidate;
    }
  }

  if (best) return best;

  let bestResult: {
    status: PracticeSessionStatus;
    pointer: PracticeSessionPointer;
    finishedAt: string;
  } | null = null;

  for (const result of enumerateStoredPracticeResults(scopeId)) {
    if (!isCompletedResultForPool(result, questions, currentQuestionKeys)) {
      continue;
    }

    const sessionCanonical = canonicalPracticeSessionKey(
      result.questionKeys.map((questionKey) => ({ questionKey }))
    );
    if (sessionCanonical === canonicalKey) continue;

    const resultId = resultStorageId(result.sessionKey);
    if (!loadPracticeResult(resultId)) continue;

    const pointer: PracticeSessionPointer = {
      sessionKey: result.sessionKey,
      config: result.config ?? DEFAULT_PRACTICE_SESSION_CONFIG,
      status: "completed",
      resultId,
      updatedAt: result.finishedAt,
    };

    const status: PracticeSessionStatus = {
      kind: "completed",
      sessionKey: result.sessionKey,
      config: pointer.config,
      resultId,
      percent: 100,
    };

    if (!bestResult || result.finishedAt > bestResult.finishedAt) {
      bestResult = { status, pointer, finishedAt: result.finishedAt };
    }
  }

  return bestResult
    ? { status: bestResult.status, pointer: bestResult.pointer }
    : null;
}

type InProgressCandidate = {
  sessionKey: string;
  config: PracticeSessionConfig;
  progress: PracticeProgress;
  practiced: number;
};

function findBestInProgressSession(
  scopeId: PracticeScopeId,
  questions: Question[],
  canonicalKey: string,
  preferredSessionKey?: string
): InProgressCandidate | null {
  let best: InProgressCandidate | null = null;

  for (const sessionKey of enumeratePoolSessionKeys(
    scopeId,
    canonicalKey,
    questions
  )) {
    const progress = loadPracticeProgress(scopeId, sessionKey);
    const config = resolveSessionConfig(scopeId, sessionKey, canonicalKey);
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

function migratePracticeSessionPointer(
  scopeId: PracticeScopeId,
  canonicalKey: string,
  pointer: PracticeSessionPointer
): void {
  const existing = loadPracticeSessionPointer(scopeId, canonicalKey);
  if (existing?.updatedAt && existing.updatedAt >= pointer.updatedAt) return;
  savePracticeSessionPointer(scopeId, canonicalKey, pointer);
}

/** Read-only status resolution for UI subscriptions (no localStorage writes). */
function readPracticeSessionStatus(
  questions: Question[],
  scopeId: PracticeScopeId
): PracticeSessionStatus | null {
  if (questions.length === 0) return null;

  const canonicalKey = canonicalPracticeSessionKey(questions);
  const currentQuestionKeys = new Set(questions.map((q) => q.questionKey));
  const pointer = loadPracticeSessionPointer(scopeId, canonicalKey);

  if (pointer?.status === "completed" && pointer.resultId) {
    const result = loadPracticeResult(pointer.resultId);
    if (
      result &&
      isCompletedResultForPool(result, questions, currentQuestionKeys)
    ) {
      return {
        kind: "completed",
        sessionKey: pointer.sessionKey,
        config: pointer.config,
        resultId: pointer.resultId,
        percent: 100,
      };
    }
  }

  const legacyCompleted = findLegacyCompletedStatus(
    questions,
    scopeId,
    canonicalKey,
    currentQuestionKeys
  );
  if (legacyCompleted) {
    migratePracticeSessionPointer(
      scopeId,
      canonicalKey,
      legacyCompleted.pointer
    );
    return legacyCompleted.status;
  }

  const best = findBestInProgressSession(
    scopeId,
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
  questions: Question[],
  scopeId: PracticeScopeId
): PracticeSessionStatus | null {
  if (questions.length === 0) return null;

  const canonicalKey = canonicalPracticeSessionKey(questions);
  const cacheKey = statusCacheKey(scopeId, canonicalKey);
  const cached = statusSnapshotCache.get(cacheKey);
  if (cached && cached.version === statusStoreVersion) {
    return cached.status;
  }

  const status = readPracticeSessionStatus(questions, scopeId);
  statusSnapshotCache.set(cacheKey, { version: statusStoreVersion, status });
  return status;
}

export function resolvePracticeSessionStatus(
  questions: Question[],
  scopeId: PracticeScopeId
): PracticeSessionStatus | null {
  return getPracticeSessionStatusSnapshot(questions, scopeId);
}

/** Sync pointer storage with the best in-progress session (explicit side effects). */
export function reconcilePracticeSessionPointer(
  questions: Question[],
  scopeId: PracticeScopeId
): void {
  if (questions.length === 0) return;

  const canonicalKey = canonicalPracticeSessionKey(questions);
  const status = readPracticeSessionStatus(questions, scopeId);

  if (!status) {
    clearPracticeSessionPointer(scopeId, canonicalKey);
    return;
  }

  if (status.kind === "completed") {
    const pointer = loadPracticeSessionPointer(scopeId, canonicalKey);
    if (!pointer || pointer.status !== "completed") {
      const legacy = findLegacyCompletedStatus(
        questions,
        scopeId,
        canonicalKey,
        new Set(questions.map((q) => q.questionKey))
      );
      if (legacy) {
        savePracticeSessionPointer(scopeId, canonicalKey, legacy.pointer);
      }
    }
    return;
  }

  const pointer = loadPracticeSessionPointer(scopeId, canonicalKey);
  if (
    pointer?.status === "completed" ||
    pointer?.sessionKey === status.sessionKey
  ) {
    return;
  }

  savePracticeSessionPointer(scopeId, canonicalKey, {
    sessionKey: status.sessionKey,
    config: status.config,
    status: "in_progress",
    updatedAt: new Date().toISOString(),
  });
}

/** Infer lecture written toggle from a legacy session pool that included written keys. */
export function resolveLectureIncludeWrittenQuestions(
  config: PracticeSessionConfig,
  sessionKey: string,
  allQuestions: Question[]
): boolean {
  if (config.includeWrittenQuestions) return true;

  const poolKeys = parseQuestionKeysFromSessionKey(sessionKey);
  if (poolKeys.length === 0) return false;

  const mcqKeys = new Set(
    allQuestions
      .filter((question) => !isWrittenQuestion(question))
      .map((question) => question.questionKey)
  );

  if (poolKeys.length <= mcqKeys.size) return false;

  return poolKeys.some((key) => !mcqKeys.has(key));
}

export function touchPracticeSessionPointer(args: {
  scopeId: PracticeScopeId;
  questions: Question[];
  sessionKey: string;
  config: PracticeSessionConfig;
  status?: "in_progress" | "completed";
  resultId?: string;
}): void {
  const canonicalKey = canonicalPracticeSessionKey(args.questions);
  savePracticeSessionPointer(args.scopeId, canonicalKey, {
    sessionKey: args.sessionKey,
    config: args.config,
    status: args.status ?? "in_progress",
    resultId: args.resultId,
    updatedAt: new Date().toISOString(),
  });
}
