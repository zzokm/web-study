import type { SeededRandom } from "@/lib/seeded-random";
import { seededFisherYates } from "@/lib/seeded-random";
import type { QuestionOption } from "@/types/question";

/** Strip HTML and normalize whitespace for option text matching. */
export function optionPlainText(content: string): string {
  return content
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const PINNED_MCQ_PATTERNS: RegExp[] = [
  /^all(\s+of|\s+the|\s+of\s+the|\s+the)?\s+above\.?$/,
  /^none(\s+of)?(\s+the)?\s+above\.?$/,
  /^none\s+of\s+above\.?$/,
  /^none(\s+of)?(\s+the)?\s+(answers?|previous)(!|\.)?$/,
  /^none(\s+of)?\s+(them|these)\.?$/,
  /^all\s+the\s+mentioned\.?$/,
];

/** Options that refer to other choices by number or letter (e.g. "Both 1&2", "Both a and b"). */
const POSITION_DEPENDENT_MCQ_PATTERNS: RegExp[] = [
  /^both\s+[12]\s*(?:&|and)\s*[12]\b/,
  /^both\s+[ab]\s+and\s+[ab]\b/,
  /^[12]\s*(?:&|and)\s*[12]\s*(?:only)?\.?$/,
  /^[ab]\s*(?:&|and)\s*[ab]\s*(?:only)?\.?$/,
  /^[ab]\.\s+and\s+[ab]\.?$/,
];

function normalizedOptionText(content: string): string {
  return optionPlainText(content).replace(/\/$/, "");
}

/** Catch-all answers that should stay at their original slot when shuffling. */
export function isPinnedMcqOption(option: QuestionOption): boolean {
  const text = normalizedOptionText(option.content);
  if (!text) return false;
  return PINNED_MCQ_PATTERNS.some((re) => re.test(text));
}

/** Options that reference other choices by exam position (1/2 or a/b). */
export function isPositionDependentMcqOption(option: QuestionOption): boolean {
  const text = normalizedOptionText(option.content);
  if (!text) return false;
  return POSITION_DEPENDENT_MCQ_PATTERNS.some((re) => re.test(text));
}

/** When true, MCQ option order must not be shuffled for the whole question. */
export function questionHasPositionDependentMcqOptions(
  options: QuestionOption[]
): boolean {
  return options.some(isPositionDependentMcqOption);
}

export function mcqOptionDisplayLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

export function mcqOptionDisplayLabelForId(
  options: QuestionOption[],
  optionId: string
): string {
  const index = options.findIndex(
    (o) => o.id.toLowerCase() === optionId.trim().toLowerCase()
  );
  return index >= 0 ? mcqOptionDisplayLabel(index) : optionId.toUpperCase();
}

function fisherYates<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Shuffle regular options only; pinned catch-all answers keep their index. */
export function shuffleMcqOptionOrder(
  options: QuestionOption[],
  random?: SeededRandom
): QuestionOption[] {
  const pinnedIndices = new Set<number>();
  const shuffleable: QuestionOption[] = [];

  for (let i = 0; i < options.length; i++) {
    if (isPinnedMcqOption(options[i])) {
      pinnedIndices.add(i);
    } else {
      shuffleable.push(options[i]);
    }
  }

  if (shuffleable.length <= 1) return [...options];

  const shuffled = random
    ? seededFisherYates(shuffleable, random)
    : fisherYates(shuffleable);
  const result = [...options];
  let shuffleIndex = 0;

  for (let i = 0; i < options.length; i++) {
    if (!pinnedIndices.has(i)) {
      result[i] = shuffled[shuffleIndex++];
    }
  }

  return result;
}
