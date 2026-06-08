"use client";

import type {
  PracticeDisplaySnapshot,
  PracticeSessionConfig,
} from "@/lib/practice-session-config";
import { configStorageSuffix } from "@/lib/practice-session-config";
import { isAnswerCorrect, isWrittenQuestion } from "@/lib/questions";
import type { Question } from "@/types/question";

/** Per-question practice state (selection + whether answer was checked). */
export interface QuestionAttempt {
  selectedId: string | null;
  revealed: boolean;
  writtenAnswer?: string | null;
  writtenCorrect?: boolean | null;
  /** Epoch ms when the current thinking window started. */
  shownAt?: number;
  /** Epoch ms when Check answer was clicked. */
  checkedAt?: number;
  /** Frozen at check: checkedAt - shownAt. */
  thinkingMs?: number;
}

export type PracticeProgress = Record<string, QuestionAttempt>;

const STORAGE_PREFIX = "webstudy:practice-v1:";

const EMPTY_ATTEMPT: QuestionAttempt = { selectedId: null, revealed: false };

export function hasWrittenResponse(attempt: QuestionAttempt): boolean {
  return Boolean(attempt.writtenAnswer?.trim());
}

export function isQuestionAnswered(
  question: Question,
  attempt: QuestionAttempt
): boolean {
  if (isWrittenQuestion(question)) return hasWrittenResponse(attempt);
  return Boolean(attempt.selectedId);
}

export function getAttempt(
  progress: PracticeProgress,
  questionKey: string
): QuestionAttempt {
  return progress[questionKey] ?? EMPTY_ATTEMPT;
}

export function getQuestionThinkingMs(attempt: QuestionAttempt): number | null {
  return typeof attempt.thinkingMs === "number" ? attempt.thinkingMs : null;
}

/** Start or refresh the thinking window when an unrevealed question is shown. */
export function patchQuestionShown(
  progress: PracticeProgress,
  questionKey: string,
  now = Date.now()
): PracticeProgress {
  const attempt = getAttempt(progress, questionKey);
  if (attempt.revealed) return progress;
  return {
    ...progress,
    [questionKey]: {
      ...attempt,
      shownAt: now,
    },
  };
}

/** Discard a partial thinking window when leaving an unrevealed question. */
export function patchQuestionShownCleared(
  progress: PracticeProgress,
  questionKey: string
): PracticeProgress {
  const attempt = getAttempt(progress, questionKey);
  if (attempt.revealed || attempt.shownAt == null) return progress;
  const { shownAt: _removed, ...rest } = attempt;
  return {
    ...progress,
    [questionKey]: rest,
  };
}

function patchQuestionThinkingAt(
  progress: PracticeProgress,
  questionKey: string,
  now: number,
  revealed: boolean
): PracticeProgress {
  const attempt = getAttempt(progress, questionKey);
  const shownAt = attempt.shownAt ?? now;
  return {
    ...progress,
    [questionKey]: {
      ...attempt,
      revealed,
      checkedAt: now,
      thinkingMs: Math.max(0, now - shownAt),
    },
  };
}

/** Freeze thinking time when Check answer is clicked. */
export function patchQuestionChecked(
  progress: PracticeProgress,
  questionKey: string,
  now = Date.now()
): PracticeProgress {
  return patchQuestionThinkingAt(progress, questionKey, now, true);
}

/** Exam mode: freeze thinking time on Next without revealing yet. */
export function patchQuestionThinkingFrozen(
  progress: PracticeProgress,
  questionKey: string,
  now = Date.now()
): PracticeProgress {
  const attempt = getAttempt(progress, questionKey);
  if (attempt.thinkingMs != null) return progress;
  return patchQuestionThinkingAt(progress, questionKey, now, false);
}

/** Exam mode submit: reveal all answered questions. */
export function patchAllQuestionsRevealed(
  progress: PracticeProgress,
  questions: Question[],
  now = Date.now()
): PracticeProgress {
  let next = progress;
  for (const q of questions) {
    const attempt = getAttempt(next, q.questionKey);
    if (!isQuestionAnswered(q, attempt)) continue;
    if (attempt.revealed) continue;
    if (isWrittenQuestion(q)) continue;
    next = patchQuestionThinkingAt(
      next,
      q.questionKey,
      attempt.checkedAt ?? now,
      true
    );
  }
  return next;
}

export function patchQuestionWrittenChecked(
  progress: PracticeProgress,
  questionKey: string,
  writtenAnswer: string,
  writtenCorrect: boolean,
  now = Date.now()
): PracticeProgress {
  const attempt = getAttempt(progress, questionKey);
  const shownAt = attempt.shownAt ?? now;
  return {
    ...progress,
    [questionKey]: {
      ...attempt,
      writtenAnswer,
      writtenCorrect,
      selectedId: writtenCorrect ? "correct" : "incorrect",
      revealed: true,
      checkedAt: now,
      thinkingMs: Math.max(0, now - shownAt),
    },
  };
}

/** Sorted question keys — identifies the pool regardless of display order. */
export function canonicalPracticeSessionKey(
  questions: { questionKey: string }[]
): string {
  return [...questions]
    .map((q) => q.questionKey)
    .sort()
    .join("\0");
}

export function practiceSessionKey(
  questions: { questionKey: string }[],
  config?: PracticeSessionConfig
): string {
  const canonical = canonicalPracticeSessionKey(questions);
  if (!config) return canonical;
  return canonical + configStorageSuffix(config);
}

/** @deprecated Use canonicalPracticeSessionKey + config suffix. */
export function orderedPracticeSessionKey(
  questions: { questionKey: string }[]
): string {
  return questions.map((q) => q.questionKey).join("\0");
}

function storageKey(sessionKey: string): string {
  return STORAGE_PREFIX + sessionKey;
}

export function loadPracticeProgress(sessionKey: string): PracticeProgress {
  if (typeof window === "undefined") return {};
  const key = storageKey(sessionKey);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PracticeProgress;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function savePracticeProgress(
  sessionKey: string,
  progress: PracticeProgress
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(sessionKey), JSON.stringify(progress));
  } catch {
    // quota / private mode — in-memory state still works
  }
}

export function hasPracticeProgress(progress: PracticeProgress): boolean {
  return Object.values(progress).some(
    (attempt) =>
      attempt.selectedId != null ||
      attempt.revealed ||
      hasWrittenResponse(attempt)
  );
}

export function practiceProgressCount(progress: PracticeProgress): number {
  return Object.values(progress).filter(
    (attempt) =>
      attempt.selectedId != null ||
      attempt.revealed ||
      hasWrittenResponse(attempt)
  ).length;
}

export function clearPracticeProgress(sessionKey: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(sessionKey));
    localStorage.removeItem(displayStorageKey(sessionKey));
  } catch {
    // ignore
  }
}

const DISPLAY_PREFIX = "webstudy:practice-display-v1:";

function displayStorageKey(sessionKey: string): string {
  return DISPLAY_PREFIX + sessionKey;
}

export function savePracticeDisplaySnapshot(
  sessionKey: string,
  snapshot: PracticeDisplaySnapshot
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(displayStorageKey(sessionKey), JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}

export function loadPracticeDisplaySnapshot(
  sessionKey: string
): PracticeDisplaySnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(displayStorageKey(sessionKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PracticeDisplaySnapshot;
    if (!parsed?.questionKeys || !parsed.optionOrderByKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** @deprecated Use savePracticeDisplaySnapshot */
export function savePracticeQuestionOrder(
  sessionKey: string,
  questionKeys: string[]
): void {
  savePracticeDisplaySnapshot(sessionKey, {
    questionKeys,
    optionOrderByKey: {},
  });
}

/** @deprecated Use loadPracticeDisplaySnapshot */
export function loadPracticeQuestionOrder(sessionKey: string): string[] | null {
  return loadPracticeDisplaySnapshot(sessionKey)?.questionKeys ?? null;
}

export function resumeQuestionIndex(
  questions: Question[],
  progress: PracticeProgress,
  examSimulation: boolean
): number {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const attempt = getAttempt(progress, q.questionKey);
    if (examSimulation) {
      if (!isQuestionAnswered(q, attempt)) return i;
      if (!attempt.revealed) return i;
    } else if (!attempt.revealed) {
      return i;
    }
  }
  return Math.max(0, questions.length - 1);
}

export function allQuestionsAnswered(
  questions: Question[],
  progress: PracticeProgress
): boolean {
  return questions.every((q) =>
    isQuestionAnswered(q, getAttempt(progress, q.questionKey))
  );
}

export function answeredQuestionCount(
  questions: Question[],
  progress: PracticeProgress
): number {
  return questions.filter((q) =>
    isQuestionAnswered(q, getAttempt(progress, q.questionKey))
  ).length;
}

export function isAttemptCorrect(
  question: Question,
  attempt: QuestionAttempt
): boolean {
  if (!attempt.revealed) return false;
  if (isWrittenQuestion(question)) return attempt.writtenCorrect === true;
  if (!attempt.selectedId) return false;
  return isAnswerCorrect(attempt.selectedId, question.correctAnswerId);
}

export function isAttemptWrong(
  question: Question,
  attempt: QuestionAttempt
): boolean {
  if (!attempt.revealed) return false;
  if (isWrittenQuestion(question)) return attempt.writtenCorrect === false;
  if (!attempt.selectedId) return false;
  return !isAnswerCorrect(attempt.selectedId, question.correctAnswerId);
}

export function computePracticeScore(
  questions: Question[],
  progress: PracticeProgress
) {
  const total = questions.length;
  let correct = 0;
  let answered = 0;

  for (const q of questions) {
    const attempt = getAttempt(progress, q.questionKey);
    if (!attempt.revealed) continue;
    if (isWrittenQuestion(q)) {
      if (!hasWrittenResponse(attempt)) continue;
    } else if (!attempt.selectedId) {
      continue;
    }
    answered++;
    if (isAttemptCorrect(q, attempt)) correct++;
  }

  const incorrect = answered - correct;
  const skipped = total - answered;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  return { total, correct, answered, incorrect, skipped, percent };
}
