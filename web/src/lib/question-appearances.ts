import type { Question } from "@/types/question";

export const EXAM_YEAR_ORDER = ["2021", "2024", "2025"] as const;

export type ExamAppearance = NonNullable<Question["appearances"]>[number];

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

export function formatExamAppearanceLabel(appearance: ExamAppearance): string {
  return `${appearance.origin} Final — ${appearance.sourceQuestionId}`;
}

export function hasMultipleExamAppearances(question: Question): boolean {
  return (question.appearances?.length ?? 0) > 1;
}

export function getSortedExamAppearances(
  question: Question
): ExamAppearance[] | null {
  if (!question.appearances?.length) return null;
  return sortExamAppearances(question.appearances);
}
