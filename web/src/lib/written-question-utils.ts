import type { Question, WrittenRubric } from "@/types/question";

export function writtenQuestionUsesHtmlRuntime(
  rubric: WrittenRubric | null | undefined
): boolean {
  if (!rubric) return false;
  return rubric.checks.some((check) => check.type !== "code_contains_string");
}

export function inferWrittenEditorLanguage(question: Question): string {
  if (question.answerLanguage) return question.answerLanguage;
  const topic = question.topic.toLowerCase();
  if (topic.includes("python")) return "python";
  if (topic.includes("django")) return "html";
  if (topic.includes("css")) return "css";
  if (writtenQuestionUsesHtmlRuntime(question.writtenRubric)) return "html";
  return "javascript";
}

export function writtenQuestionShowsPreviewTabs(question: Question): boolean {
  return writtenQuestionUsesHtmlRuntime(question.writtenRubric);
}
