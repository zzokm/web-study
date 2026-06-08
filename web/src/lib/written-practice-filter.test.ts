import { describe, expect, it } from "vitest";
import { getWrittenQuestions } from "@/lib/questions";
import { filterWrittenQuestionsByTrack } from "@/lib/written-practice-filter";

describe("filterWrittenQuestionsByTrack", () => {
  const questions = getWrittenQuestions();

  it("returns all questions for both", () => {
    expect(filterWrittenQuestionsByTrack(questions, "both")).toHaveLength(
      questions.length
    );
  });

  it("filters frontend questions by fe-* related topics", () => {
    const frontend = filterWrittenQuestionsByTrack(questions, "frontend");
    expect(frontend.length).toBeGreaterThan(0);
    expect(frontend.every((q) => q.relatedTopics?.some((t) => t.startsWith("fe-")))).toBe(
      true
    );
    expect(frontend.some((q) => q.relatedTopics?.some((t) => t.startsWith("be-")))).toBe(
      false
    );
  });

  it("filters backend questions by be-* related topics", () => {
    const backend = filterWrittenQuestionsByTrack(questions, "backend");
    expect(backend.length).toBeGreaterThan(0);
    expect(backend.every((q) => q.relatedTopics?.some((t) => t.startsWith("be-")))).toBe(
      true
    );
    expect(backend.some((q) => q.relatedTopics?.some((t) => t.startsWith("fe-")))).toBe(
      false
    );
  });
});
