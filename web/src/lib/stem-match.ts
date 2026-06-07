import type { Question } from "@/types/question";

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

/** Stem + answer — same stem with different keyed answers stay separate. */
export function repetitionKey(question: Question): string {
  const stem = normQuestionText(question.questionText);
  if (!stem) return "";
  return `${stem}|${normCorrectAnswerContent(question)}`;
}

function stemSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const longer = a.length >= b.length ? a : b;
  const shorter = a.length < b.length ? a : b;
  if (longer.includes(shorter) && shorter.length / longer.length >= FUZZY_STEM_RATIO) {
    return FUZZY_STEM_RATIO;
  }
  let matches = 0;
  const limit = Math.min(a.length, b.length);
  for (let i = 0; i < limit; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / Math.max(a.length, b.length);
}

/** Group questions sharing answer + equivalent stem (exact or light fuzzy). */
export function groupByRepetitionKey(questions: Question[]): Question[][] {
  const buckets = new Map<string, Question[]>();
  for (const q of questions) {
    const key = repetitionKey(q);
    if (!key) continue;
    const list = buckets.get(key) ?? [];
    list.push(q);
    buckets.set(key, list);
  }

  const keys = [...buckets.keys()];
  const used = new Set<string>();
  const groups: Question[][] = [];

  for (let i = 0; i < keys.length; i++) {
    const keyI = keys[i];
    if (used.has(keyI)) continue;
    const [stemI, answerI] = splitRepetitionKey(keyI);
    const group = [...(buckets.get(keyI) ?? [])];
    used.add(keyI);

    for (let j = i + 1; j < keys.length; j++) {
      const keyJ = keys[j];
      if (used.has(keyJ)) continue;
      const [stemJ, answerJ] = splitRepetitionKey(keyJ);
      if (answerI !== answerJ) continue;
      if (stemI === stemJ || stemSimilarity(stemI, stemJ) >= FUZZY_STEM_RATIO) {
        group.push(...(buckets.get(keyJ) ?? []));
        used.add(keyJ);
      }
    }

    if (group.length >= 2) groups.push(group);
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
  const buckets = new Map<string, T[]>();
  const keyOrder: string[] = [];
  for (const q of questions) {
    const key = repetitionKey(q);
    if (!key) continue;
    if (!buckets.has(key)) {
      keyOrder.push(key);
      buckets.set(key, []);
    }
    buckets.get(key)!.push(q);
  }

  const used = new Set<string>();
  const clusters: T[][] = [];
  for (let i = 0; i < keyOrder.length; i++) {
    const keyI = keyOrder[i];
    if (used.has(keyI)) continue;
    const [stemI, answerI] = splitRepetitionKey(keyI);
    let group = [...(buckets.get(keyI) ?? [])];
    used.add(keyI);
    for (let j = i + 1; j < keyOrder.length; j++) {
      const keyJ = keyOrder[j];
      if (used.has(keyJ)) continue;
      const [stemJ, answerJ] = splitRepetitionKey(keyJ);
      if (answerI !== answerJ) continue;
      if (stemI === stemJ || stemSimilarity(stemI, stemJ) >= FUZZY_STEM_RATIO) {
        group = group.concat(buckets.get(keyJ) ?? []);
        used.add(keyJ);
      }
    }
    clusters.push(group);
  }
  return clusters;
}
