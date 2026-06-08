import type { Question } from "@/types/question";

export type WrittenPracticeTrack = "both" | "frontend" | "backend";

export function isFrontendWrittenQuestion(question: Question): boolean {
  return (question.relatedTopics ?? []).some((topic) => topic.startsWith("fe-"));
}

export function isBackendWrittenQuestion(question: Question): boolean {
  return (question.relatedTopics ?? []).some((topic) => topic.startsWith("be-"));
}

export function filterWrittenQuestionsByTrack(
  questions: Question[],
  track: WrittenPracticeTrack
): Question[] {
  if (track === "both") return questions;
  if (track === "frontend") {
    return questions.filter(isFrontendWrittenQuestion);
  }
  return questions.filter(isBackendWrittenQuestion);
}
