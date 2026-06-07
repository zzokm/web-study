"use client";

import { isAnswerCorrect } from "@/lib/questions";
import type { Question } from "@/types/question";

/** Per-question practice state (selection + whether answer was checked). */
export interface QuestionAttempt {
  selectedId: string | null;
  revealed: boolean;
}

export type PracticeProgress = Record<string, QuestionAttempt>;

const STORAGE_PREFIX = "mgmt:practice-v1:";
const LEGACY_SESSION_PREFIX = "mgmt:practice-v1:";

const EMPTY_ATTEMPT: QuestionAttempt = { selectedId: null, revealed: false };

export function getAttempt(
  progress: PracticeProgress,
  questionKey: string
): QuestionAttempt {
  return progress[questionKey] ?? EMPTY_ATTEMPT;
}

export function practiceSessionKey(questions: { questionKey: string }[]): string {
  return questions.map((q) => q.questionKey).join("\0");
}

function storageKey(sessionKey: string): string {
  return STORAGE_PREFIX + sessionKey;
}

export function loadPracticeProgress(sessionKey: string): PracticeProgress {
  if (typeof window === "undefined") return {};
  const key = storageKey(sessionKey);
  try {
    let raw = localStorage.getItem(key);
    if (!raw) {
      raw = sessionStorage.getItem(LEGACY_SESSION_PREFIX + sessionKey);
      if (raw) {
        localStorage.setItem(key, raw);
        sessionStorage.removeItem(LEGACY_SESSION_PREFIX + sessionKey);
      }
    }
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
    (attempt) => attempt.selectedId != null || attempt.revealed
  );
}

export function practiceProgressCount(progress: PracticeProgress): number {
  return Object.values(progress).filter(
    (attempt) => attempt.selectedId != null || attempt.revealed
  ).length;
}

export function clearPracticeProgress(sessionKey: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(sessionKey));
    sessionStorage.removeItem(LEGACY_SESSION_PREFIX + sessionKey);
  } catch {
    // ignore
  }
}

export function isAttemptCorrect(
  question: Question,
  attempt: QuestionAttempt
): boolean {
  if (!attempt.revealed || !attempt.selectedId) return false;
  return isAnswerCorrect(attempt.selectedId, question.correctAnswerId);
}

export function isAttemptWrong(
  question: Question,
  attempt: QuestionAttempt
): boolean {
  if (!attempt.revealed || !attempt.selectedId) return false;
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
    if (!attempt.revealed || !attempt.selectedId) continue;
    answered++;
    if (isAttemptCorrect(q, attempt)) correct++;
  }

  const incorrect = answered - correct;
  const skipped = total - answered;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  return { total, correct, answered, incorrect, skipped, percent };
}
