import {
  getAttempt,
  getQuestionThinkingMs,
  isAttemptCorrect,
  type PracticeProgress,
} from "@/lib/practice-progress";
import type { Question, QuestionType } from "@/types/question";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Compact duration for badges, e.g. 1:24 or 1:02:15. */
export function formatThinkingDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

/** Longer label for detail rows, e.g. 1m 24s or 1h 2m 5s. */
export function formatThinkingDurationLong(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export type TimingExtreme = {
  questionKey: string;
  questionIndex: number;
  ms: number;
};

export type PracticeTimingStats = {
  totalThinkingMs: number;
  averageMs: number;
  medianMs: number;
  recordedCount: number;
  total: number;
  fastest: TimingExtreme | null;
  slowest: TimingExtreme | null;
  byOutcome: {
    correct: { count: number; averageMs: number };
    incorrect: { count: number; averageMs: number };
  };
  byType: Partial<
    Record<QuestionType, { count: number; averageMs: number }>
  >;
  sessionWallMs: number | null;
  reviewGapMs: number | null;
};

export function computePracticeTimingStats(
  questions: Question[],
  progress: PracticeProgress,
  options?: {
    sessionStartedAt?: string;
    finishedAt?: string;
  }
): PracticeTimingStats {
  const entries: Array<{
    question: Question;
    index: number;
    ms: number;
    correct: boolean;
  }> = [];

  questions.forEach((question, index) => {
    const attempt = getAttempt(progress, question.questionKey);
    const ms = getQuestionThinkingMs(attempt);
    if (ms == null) return;
    entries.push({
      question,
      index,
      ms,
      correct: isAttemptCorrect(question, attempt),
    });
  });

  const values = entries.map((e) => e.ms);
  const totalThinkingMs = values.reduce((sum, v) => sum + v, 0);

  let fastest: TimingExtreme | null = null;
  let slowest: TimingExtreme | null = null;
  for (const entry of entries) {
    if (!fastest || entry.ms < fastest.ms) {
      fastest = {
        questionKey: entry.question.questionKey,
        questionIndex: entry.index + 1,
        ms: entry.ms,
      };
    }
    if (!slowest || entry.ms > slowest.ms) {
      slowest = {
        questionKey: entry.question.questionKey,
        questionIndex: entry.index + 1,
        ms: entry.ms,
      };
    }
  }

  const correctTimes = entries.filter((e) => e.correct).map((e) => e.ms);
  const incorrectTimes = entries.filter((e) => !e.correct).map((e) => e.ms);

  const byType: PracticeTimingStats["byType"] = {};
  for (const entry of entries) {
    const type = entry.question.questionType;
    const bucket = byType[type] ?? { count: 0, averageMs: 0 };
    bucket.count += 1;
    byType[type] = bucket;
  }
  for (const type of Object.keys(byType) as QuestionType[]) {
    const bucket = byType[type];
    if (!bucket) continue;
    const typeTimes = entries
      .filter((e) => e.question.questionType === type)
      .map((e) => e.ms);
    bucket.averageMs = average(typeTimes);
  }

  let sessionWallMs: number | null = null;
  let reviewGapMs: number | null = null;
  if (options?.sessionStartedAt && options?.finishedAt) {
    const started = Date.parse(options.sessionStartedAt);
    const finished = Date.parse(options.finishedAt);
    if (!Number.isNaN(started) && !Number.isNaN(finished) && finished >= started) {
      sessionWallMs = finished - started;
      reviewGapMs = Math.max(0, sessionWallMs - totalThinkingMs);
    }
  }

  return {
    totalThinkingMs,
    averageMs: average(values),
    medianMs: median(values),
    recordedCount: entries.length,
    total: questions.length,
    fastest,
    slowest,
    byOutcome: {
      correct: {
        count: correctTimes.length,
        averageMs: average(correctTimes),
      },
      incorrect: {
        count: incorrectTimes.length,
        averageMs: average(incorrectTimes),
      },
    },
    byType,
    sessionWallMs,
    reviewGapMs,
  };
}

export function hasTimingData(progress: PracticeProgress): boolean {
  return Object.values(progress).some(
    (attempt) => getQuestionThinkingMs(attempt) != null
  );
}
