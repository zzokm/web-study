import type { Question } from "@/types/question";

export const EXAM_YEAR_ORDER = ["2021", "2024", "2025"] as const;

export type ExamAppearance = NonNullable<Question["appearances"]>[number];

export function isExamYearOrigin(origin: string): boolean {
  return (EXAM_YEAR_ORDER as readonly string[]).includes(origin);
}

export function filterExamAppearances(
  appearances: ExamAppearance[]
): ExamAppearance[] {
  return appearances.filter((a) => isExamYearOrigin(a.origin));
}

export function sortExamAppearances(
  appearances: ExamAppearance[]
): ExamAppearance[] {
  return [...appearances].sort(
    (a, b) =>
      EXAM_YEAR_ORDER.indexOf(a.origin as (typeof EXAM_YEAR_ORDER)[number]) -
      EXAM_YEAR_ORDER.indexOf(b.origin as (typeof EXAM_YEAR_ORDER)[number]) ||
      a.sourceQuestionId.localeCompare(b.sourceQuestionId, undefined, {
        numeric: true,
      })
  );
}

export function examQuestionNumberFromId(
  sourceQuestionId: string,
  questionText?: string
): string {
  const idMatch =
    sourceQuestionId.match(/:q(\d+)/i) ??
    sourceQuestionId.match(/(?:^|:)q(\d+)/i);
  if (idMatch?.[1]) return idMatch[1];

  const textMatch = questionText?.match(/^\s*(\d+)\.\s+/);
  if (textMatch?.[1]) return textMatch[1];

  return sourceQuestionId;
}

export function formatExamAppearanceLabel(appearance: ExamAppearance): string {
  const number = examQuestionNumberFromId(
    appearance.sourceQuestionId,
    undefined
  );
  return `${appearance.origin} Final Q${number}`;
}

export function collectExamAppearances(question: Question): ExamAppearance[] {
  const fromList = filterExamAppearances(question.appearances ?? []);
  if (fromList.length > 0) return sortExamAppearances(fromList);

  if (isExamYearOrigin(question.origin)) {
    return [
      {
        origin: question.origin,
        sourceFile: question.sourceFile,
        sourceQuestionId: question.sourceQuestionId,
      },
    ];
  }

  return [];
}

export function hasMultipleExamAppearances(question: Question): boolean {
  return collectExamAppearances(question).length > 1;
}

export function getSortedExamAppearances(
  question: Question
): ExamAppearance[] | null {
  const appearances = collectExamAppearances(question);
  if (!appearances.length) return null;
  return appearances;
}
