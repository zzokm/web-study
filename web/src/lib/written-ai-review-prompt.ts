import type { Question, QuestionContext } from "@/types/question";
import { inferWrittenEditorLanguage } from "@/lib/written-question-utils";

const LANGUAGE_LABELS: Record<string, string> = {
  html: "HTML",
  javascript: "JavaScript",
  css: "CSS",
  python: "Python",
};

export function formatWrittenAnswerLanguageLabel(language: string): string {
  const normalized = language.trim().toLowerCase();
  if (LANGUAGE_LABELS[normalized]) return LANGUAGE_LABELS[normalized];
  if (!normalized) return "Code";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function fenceLanguage(language: string): string {
  const normalized = language.trim().toLowerCase();
  if (normalized === "html") return "html";
  if (normalized === "css") return "css";
  if (normalized === "python") return "python";
  return "javascript";
}

function fencedCode(code: string, language: string): string {
  const fence = fenceLanguage(language);
  return `\`\`\`${fence}\n${code.trim()}\n\`\`\``;
}

function formatContextSection(context: QuestionContext): string {
  const parts: string[] = ["## Context"];
  if (context.text?.trim()) {
    parts.push(context.text.trim());
  }
  if (context.code?.trim()) {
    const lang = context.codeLanguage?.trim() || "html";
    parts.push(fencedCode(context.code, lang));
  }
  return parts.join("\n\n");
}

const REVIEW_INSTRUCTIONS = `## Your task

Please review my answer against the question requirements, the model answer, and the official explanation. Provide:

1. Whether my solution is correct, and what is missing or incorrect if not
2. Syntax mistakes or typos
3. Logical or structural issues
4. Shorter or better alternative approaches where applicable
5. Concrete suggestions to improve the code

Be specific and reference line-level details where helpful.`;

export function buildWrittenAiReviewPrompt(
  question: Question,
  userAnswer: string
): string {
  const language = inferWrittenEditorLanguage(question);
  const languageLabel = formatWrittenAnswerLanguageLabel(language);
  const sections: string[] = [
    "You are reviewing a student's coding answer for a web technology exam practice question.",
    "",
    `## Topic`,
    question.topic,
    "",
    `## Language`,
    languageLabel,
    "",
    "## Question",
    question.questionText.trim(),
  ];

  if (question.context?.text || question.context?.code) {
    sections.push("", formatContextSection(question.context));
  }

  sections.push(
    "",
    "## My answer",
    fencedCode(userAnswer, language),
    "",
    "## Model answer",
    fencedCode(question.expectedAnswer ?? "", language)
  );

  if (question.explanation?.trim()) {
    sections.push("", "## Official explanation", question.explanation.trim());
  }

  sections.push("", REVIEW_INSTRUCTIONS);

  return sections.join("\n");
}

export async function copyWrittenAiReviewPrompt(
  question: Question,
  userAnswer: string
): Promise<void> {
  const prompt = buildWrittenAiReviewPrompt(question, userAnswer);
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Clipboard is not available in this browser.");
  }
  await navigator.clipboard.writeText(prompt);
}
