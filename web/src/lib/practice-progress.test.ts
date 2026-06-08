import { describe, expect, it } from "vitest";
import type { Question } from "@/types/question";
import {
  isQuestionPracticed,
  practicedQuestionCount,
  type PracticeProgress,
} from "@/lib/practice-progress";

const mcq = {
  questionKey: "mcq-1",
  questionType: "mcq",
  correctAnswerId: "a",
  options: [
    { id: "a", content: "A", type: "text" },
    { id: "b", content: "B", type: "text" },
  ],
} as unknown as Question;

const written = {
  questionKey: "written-1",
  questionType: "written",
  correctAnswerId: "",
  options: [],
} as unknown as Question;

describe("practicedQuestionCount", () => {
  it("counts revealed MCQ answers in normal mode", () => {
    const progress: PracticeProgress = {
      "mcq-1": { selectedId: "a", revealed: true },
    };
    expect(practicedQuestionCount([mcq], progress, false)).toBe(1);
  });

  it("ignores unrevealed MCQ selections in normal mode", () => {
    const progress: PracticeProgress = {
      "mcq-1": { selectedId: "a", revealed: false },
    };
    expect(practicedQuestionCount([mcq], progress, false)).toBe(0);
  });

  it("counts selected MCQ answers in exam simulation", () => {
    const progress: PracticeProgress = {
      "mcq-1": { selectedId: "a", revealed: false },
    };
    expect(practicedQuestionCount([mcq], progress, true)).toBe(1);
  });

  it("counts checked written answers only after reveal", () => {
    const progress: PracticeProgress = {
      "written-1": {
        selectedId: "correct",
        revealed: true,
        writtenAnswer: "<p>hi</p>",
        writtenCorrect: true,
      },
    };
    expect(
      isQuestionPracticed(
        written,
        progress["written-1"],
        false
      )
    ).toBe(true);
    expect(
      practicedQuestionCount([written], { "written-1": { selectedId: null, revealed: false, writtenAnswer: "<p>hi</p>" } }, false)
    ).toBe(0);
  });
});
