import {
  questionHasPositionDependentMcqOptions,
  shuffleMcqOptionOrder,
} from "@/lib/mcq-options";
import { isWrittenQuestion } from "@/lib/questions";
import {
  seededFisherYates,
  type SeededRandom,
} from "@/lib/seeded-random";
import type { PracticeSetupConfigParams } from "@/lib/analytics-event-schemas";
import type { Question } from "@/types/question";
import type { WrittenPracticeTrack } from "@/lib/written-practice-filter";

export type PracticeSessionConfig = {
  shuffleQuestions: boolean;
  shuffleMcqOptions: boolean;
  showSessionTimer: boolean;
  examSimulation: boolean;
  /** Written practice only: filter by frontend / backend lecture topics. */
  writtenTrack?: WrittenPracticeTrack;
};

export const DEFAULT_PRACTICE_SESSION_CONFIG: PracticeSessionConfig = {
  shuffleQuestions: false,
  shuffleMcqOptions: false,
  showSessionTimer: true,
  examSimulation: false,
};

/** Default options for written-question practice setup. */
export const DEFAULT_WRITTEN_PRACTICE_SESSION_CONFIG: PracticeSessionConfig = {
  shuffleQuestions: false,
  shuffleMcqOptions: false,
  showSessionTimer: false,
  examSimulation: false,
  writtenTrack: "both",
};

/** @deprecated Use DEFAULT_WRITTEN_PRACTICE_SESSION_CONFIG */
export const WRITTEN_PRACTICE_SESSION_CONFIG =
  DEFAULT_WRITTEN_PRACTICE_SESSION_CONFIG;

export function configFromSessionKey(
  sessionKey: string,
  canonicalKey: string
): PracticeSessionConfig | null {
  if (sessionKey === canonicalKey) {
    return { ...DEFAULT_PRACTICE_SESSION_CONFIG };
  }
  if (!sessionKey.startsWith(`${canonicalKey}:s`)) return null;
  const rest = sessionKey.slice(canonicalKey.length + 2);
  const match = rest.match(/^([01]{4})(?::w([fbe]))?$/);
  if (!match) return null;
  const flags = match[1];
  const trackCode = match[2];
  const writtenTrack: WrittenPracticeTrack =
    trackCode === "f"
      ? "frontend"
      : trackCode === "b"
        ? "backend"
        : "both";
  return {
    shuffleQuestions: flags[0] === "1",
    shuffleMcqOptions: flags[1] === "1",
    showSessionTimer: flags[2] === "1",
    examSimulation: flags[3] === "1",
    writtenTrack,
  };
}

/** Stable suffix for localStorage keyed by config flags. */
export function configStorageSuffix(config: PracticeSessionConfig): string {
  const flags = [
    config.shuffleQuestions ? "1" : "0",
    config.shuffleMcqOptions ? "1" : "0",
    config.showSessionTimer ? "1" : "0",
    config.examSimulation ? "1" : "0",
  ].join("");
  let suffix = `:s${flags}`;
  const track = config.writtenTrack ?? "both";
  if (track === "frontend") suffix += ":wf";
  else if (track === "backend") suffix += ":wb";
  return suffix;
}

function fisherYates<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function cloneQuestion(question: Question): Question {
  return {
    ...question,
    options: question.options.map((o) => ({ ...o })),
    questionSegments: question.questionSegments.map((s) => ({ ...s })),
    context: question.context
      ? { ...question.context }
      : question.context,
    appearances: question.appearances
      ? question.appearances.map((a) => ({ ...a }))
      : question.appearances,
    origins: question.origins ? [...question.origins] : question.origins,
    relatedTopics: question.relatedTopics
      ? [...question.relatedTopics]
      : question.relatedTopics,
  };
}

function shuffleMcqOptions(
  question: Question,
  random?: SeededRandom
): Question {
  if (question.questionType === "true_false") return question;
  if (questionHasPositionDependentMcqOptions(question.options)) {
    return cloneQuestion(question);
  }
  return {
    ...question,
    options: shuffleMcqOptionOrder(question.options, random),
  };
}

function partitionWrittenQuestions(questions: Question[]): {
  nonWritten: Question[];
  written: Question[];
} {
  const nonWritten: Question[] = [];
  const written: Question[] = [];
  for (const question of questions) {
    if (isWrittenQuestion(question)) written.push(question);
    else nonWritten.push(question);
  }
  return { nonWritten, written };
}

/** Written questions always appear after MCQ / true-false items. */
function pinWrittenQuestionsToEnd(questions: Question[]): Question[] {
  const { nonWritten, written } = partitionWrittenQuestions(questions);
  return [...nonWritten, ...written];
}

/** Apply question-order and MCQ option shuffles (clones input). */
export function preparePracticeQuestions(
  questions: Question[],
  config: PracticeSessionConfig,
  random?: SeededRandom
): Question[] {
  let prepared = questions.map(cloneQuestion);
  const { nonWritten, written } = partitionWrittenQuestions(prepared);

  if (config.shuffleQuestions) {
    if (nonWritten.length === 0) {
      prepared = random
        ? seededFisherYates(prepared, random)
        : fisherYates(prepared);
    } else if (written.length === 0) {
      prepared = random
        ? seededFisherYates(nonWritten, random)
        : fisherYates(nonWritten);
    } else {
      prepared = [
        ...(random
          ? seededFisherYates(nonWritten, random)
          : fisherYates(nonWritten)),
        ...written,
      ];
    }
  } else {
    prepared = [...nonWritten, ...written];
  }

  if (config.shuffleMcqOptions) {
    prepared = prepared.map((q) => shuffleMcqOptions(q, random));
  }

  return prepared;
}

/** Reorder questions to match a saved key list; append any missing keys at end. */
export function orderQuestionsByKeys(
  questions: Question[],
  orderedKeys: string[]
): Question[] {
  const byKey = new Map(questions.map((q) => [q.questionKey, q]));
  const ordered: Question[] = [];
  for (const key of orderedKeys) {
    const q = byKey.get(key);
    if (q) {
      ordered.push(q);
      byKey.delete(key);
    }
  }
  for (const q of byKey.values()) {
    ordered.push(q);
  }
  return ordered;
}

export type PracticeDisplaySnapshot = {
  questionKeys: string[];
  optionOrderByKey: Record<string, string[]>;
};

export function buildDisplaySnapshot(questions: Question[]): PracticeDisplaySnapshot {
  const optionOrderByKey: Record<string, string[]> = {};
  for (const q of questions) {
    optionOrderByKey[q.questionKey] = q.options.map((o) => o.id);
  }
  return {
    questionKeys: questions.map((q) => q.questionKey),
    optionOrderByKey,
  };
}

export function applyDisplaySnapshot(
  questions: Question[],
  snapshot: PracticeDisplaySnapshot
): Question[] {
  const ordered = orderQuestionsByKeys(questions, snapshot.questionKeys);
  const withOptions = ordered.map((q) => {
    const order = snapshot.optionOrderByKey[q.questionKey];
    if (!order?.length) return cloneQuestion(q);
    const optsById = new Map(q.options.map((o) => [o.id, o]));
    const reordered = order
      .map((id) => optsById.get(id))
      .filter((o): o is Question["options"][number] => o != null);
    if (reordered.length !== q.options.length) return cloneQuestion(q);
    return { ...cloneQuestion(q), options: reordered };
  });
  return pinWrittenQuestionsToEnd(withOptions);
}

export function practiceConfigAnalyticsParams(
  config: PracticeSessionConfig
): PracticeSetupConfigParams {
  return {
    shuffle_questions: config.shuffleQuestions,
    shuffle_mcq_options: config.shuffleMcqOptions,
    show_session_timer: config.showSessionTimer,
    exam_simulation: config.examSimulation,
    ...(config.writtenTrack && config.writtenTrack !== "both"
      ? { written_track: config.writtenTrack }
      : {}),
  };
}
