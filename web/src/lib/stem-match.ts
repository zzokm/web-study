import type { Question } from "@/types/question";
import { isExamYearOrigin } from "@/lib/question-appearances";

/** Must stay in sync with stem_match.py */
export const FUZZY_STEM_RATIO = 0.97;

/** Lowercase stem; blanks/underscores and punctuation do not differentiate. */
export function normQuestionText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/_+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normCorrectAnswerContent(question: Question): string {
  const correctId = question.correctAnswerId.trim().toLowerCase();
  const option = question.options.find(
    (o) => o.id.trim().toLowerCase() === correctId
  );
  return normQuestionText(option?.content ?? correctId);
}

/** Repetitive drill sets include exam MCQ/T-F only — not written or hub entries. */
export function isRepetitionEligible(question: Question): boolean {
  return question.questionType !== "written" && isExamYearOrigin(question.origin);
}

/** Stem + answer — same stem with different keyed answers stay separate. */
export function repetitionKey(question: Question): string {
  const stem = normQuestionText(question.questionText);
  if (!stem) return "";
  return `${stem}|${normCorrectAnswerContent(question)}`;
}

function stemSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const maxLen = Math.max(a.length, b.length);
  const minLen = Math.min(a.length, b.length);
  if (minLen / maxLen < FUZZY_STEM_RATIO) return 0;
  const longer = a.length >= b.length ? a : b;
  const shorter = a.length < b.length ? a : b;
  if (longer.includes(shorter) && shorter.length / longer.length >= FUZZY_STEM_RATIO) {
    return FUZZY_STEM_RATIO;
  }
  let matches = 0;
  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / maxLen;
}

function stemsEquivalent(stemA: string, stemB: string): boolean {
  return stemA === stemB || stemSimilarity(stemA, stemB) >= FUZZY_STEM_RATIO;
}

function mergeFuzzyStemGroups<T extends Question>(
  buckets: Map<string, T[]>,
  keys: string[]
): T[][] {
  const used = new Set<string>();
  const groups: T[][] = [];

  for (let i = 0; i < keys.length; i++) {
    const keyI = keys[i];
    if (used.has(keyI)) continue;
    const [stemI] = splitRepetitionKey(keyI);
    const group = [...(buckets.get(keyI) ?? [])];
    used.add(keyI);

    for (let j = i + 1; j < keys.length; j++) {
      const keyJ = keys[j];
      if (used.has(keyJ)) continue;
      const [stemJ] = splitRepetitionKey(keyJ);
      if (stemsEquivalent(stemI, stemJ)) {
        group.push(...(buckets.get(keyJ) ?? []));
        used.add(keyJ);
      }
    }

    groups.push(group);
  }

  return groups;
}

/** Group questions sharing answer + equivalent stem (exact or light fuzzy). */
export function groupByRepetitionKey(questions: Question[]): Question[][] {
  return groupByRepetitionKeyForPool(questions.filter(isRepetitionEligible));
}

function groupByRepetitionKeyForPool(questions: Question[]): Question[][] {
  const buckets = new Map<string, Question[]>();
  const keysByAnswer = new Map<string, string[]>();

  for (const q of questions) {
    const key = repetitionKey(q);
    if (!key) continue;
    const list = buckets.get(key) ?? [];
    list.push(q);
    buckets.set(key, list);

    const [, answer] = splitRepetitionKey(key);
    const answerKeys = keysByAnswer.get(answer) ?? [];
    if (!answerKeys.includes(key)) answerKeys.push(key);
    keysByAnswer.set(answer, answerKeys);
  }

  const groups: Question[][] = [];
  for (const answerKeys of keysByAnswer.values()) {
    for (const group of mergeFuzzyStemGroups(buckets, answerKeys)) {
      if (group.length >= 2) groups.push(group);
    }
  }

  return groups;
}

function splitRepetitionKey(key: string): [string, string] {
  const idx = key.lastIndexOf("|");
  if (idx <= 0) return [key, ""];
  return [key.slice(0, idx), key.slice(idx + 1)];
}

/** Cluster by equivalent stem + answer (exact or light fuzzy). */
export function clusterByRepetitionKey<T extends Question>(questions: T[]): T[][] {
  const written = questions.filter((q) => q.questionType === "written");
  const pool = questions.filter((q) => q.questionType !== "written");

  const buckets = new Map<string, T[]>();
  const keysByAnswer = new Map<string, string[]>();

  for (const q of pool) {
    const key = repetitionKey(q);
    if (!key) continue;
    if (!buckets.has(key)) {
      buckets.set(key, []);
      const [, answer] = splitRepetitionKey(key);
      const answerKeys = keysByAnswer.get(answer) ?? [];
      answerKeys.push(key);
      keysByAnswer.set(answer, answerKeys);
    }
    buckets.get(key)!.push(q);
  }

  const clusters: T[][] = [];
  for (const answerKeys of keysByAnswer.values()) {
    clusters.push(...mergeFuzzyStemGroups(buckets, answerKeys));
  }
  return [...clusters, ...written.map((q) => [q])];
}
