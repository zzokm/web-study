import { describe, expect, it } from "vitest";
import { getWrittenQuestions } from "@/lib/questions";
import {
  buildWrittenAiReviewPrompt,
  formatWrittenAnswerLanguageLabel,
} from "@/lib/written-ai-review-prompt";
import type { Question } from "@/types/question";

describe("formatWrittenAnswerLanguageLabel", () => {
  it("maps known editor languages", () => {
    expect(formatWrittenAnswerLanguageLabel("javascript")).toBe("JavaScript");
    expect(formatWrittenAnswerLanguageLabel("python")).toBe("Python");
    expect(formatWrittenAnswerLanguageLabel("html")).toBe("HTML");
  });
});

describe("buildWrittenAiReviewPrompt", () => {
  const frontend = getWrittenQuestions().find((q) => q.id === "wq-js-dom-change");
  const python = getWrittenQuestions().find((q) => q.id === "wq-python-dict-lookup");

  it("includes topic, language, question, answers, explanation, and instructions", () => {
    expect(frontend).toBeDefined();
    const userAnswer = "<div id=\"status\">Pending</div>";
    const prompt = buildWrittenAiReviewPrompt(frontend!, userAnswer);

    expect(prompt).toContain(frontend!.topic);
    expect(prompt).toContain("JavaScript");
    expect(prompt).toContain(frontend!.questionText);
    expect(prompt).toContain(userAnswer);
    expect(prompt).toContain(frontend!.expectedAnswer ?? "");
    expect(prompt).toContain(frontend!.explanation);
    expect(prompt).toContain("Syntax mistakes");
    expect(prompt).toContain("alternative approaches");
  });

  it("uses python fences for backend questions", () => {
    expect(python).toBeDefined();
    const prompt = buildWrittenAiReviewPrompt(python!, "def get_grade(name):\n    pass");
    expect(prompt).toContain("## Language");
    expect(prompt).toContain("Python");
    expect(prompt).toContain("```python");
    expect(prompt).toContain("def get_grade(name):");
  });

  it("includes context when present", () => {
    const withContext: Question = {
      ...frontend!,
      context: {
        text: "Use the snippet below.",
        code: "<div id=\"demo\">Hi</div>",
        codeLanguage: "html",
      },
    };
    const prompt = buildWrittenAiReviewPrompt(withContext, "<p>test</p>");
    expect(prompt).toContain("## Context");
    expect(prompt).toContain("Use the snippet below.");
    expect(prompt).toContain("<div id=\"demo\">Hi</div>");
  });
});
