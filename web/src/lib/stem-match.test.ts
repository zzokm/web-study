import { describe, expect, it } from "vitest";
import {
  groupByRepetitionKey,
  normQuestionText,
  questionMatchScore,
  questionsEquivalent,
  stripQuestionNumber,
} from "@/lib/stem-match";
import type { Question } from "@/types/question";

function makeQuestion(
  origin: string,
  sourceQuestionId: string,
  questionText: string,
  options: Array<{ id: string; content: string }>,
  correctAnswerId: string
): Question {
  return {
    questionKey: `${origin}:${sourceQuestionId}`,
    sourceQuestionId,
    sourceFile: `${origin}.json`,
    origin,
    examOrder: 1,
    questionType: "mcq",
    questionText,
    options: options.map((o) => ({
      id: o.id,
      type: "text" as const,
      content: o.content,
      codeLanguage: null,
    })),
    correctAnswerId,
    explanation: "",
    relatedTopics: ["fe-1", "be-4"],
  };
}

const q2021Auth = makeQuestion(
  "2021",
  "block_10:q45",
  "45. Using authorization, have a response of status 200 means that",
  [
    { id: "a", content: "User is not authorized to see the response." },
    { id: "b", content: "content cannot be displayed after authorization." },
    { id: "c", content: "User is authorized to see the response." },
    { id: "d", content: "None of the answers." },
  ],
  "c"
);

const q2025Auth = makeQuestion(
  "2025",
  "block_2:q36",
  "36. Using authorization, having a response of status 200 means that",
  [
    { id: "a", content: "User is not authorized to see the response" },
    { id: "b", content: "User is authorized to see the response" },
    { id: "c", content: "Content cannot be displayed after authorization" },
    { id: "d", content: "None of the answers!" },
  ],
  "b"
);

describe("stem-match", () => {
  it("strips leading question numbers before normalization", () => {
    expect(stripQuestionNumber("45. Using authorization")).toBe(
      "Using authorization"
    );
    expect(normQuestionText("36) HTTP status 200")).toBe("http status 200");
  });

  it("matches 2021 q45 and 2025 q36 authorization questions", () => {
    const score = questionMatchScore(q2021Auth, q2025Auth);
    expect(score).toBeGreaterThanOrEqual(0.85);
    expect(questionsEquivalent(q2021Auth, q2025Auth)).toBe(true);
  });

  it("groups cross-year near-duplicates into repetitive sets", () => {
    const unrelated = makeQuestion(
      "2024",
      "block_1:q1",
      "1. Django models map to database tables",
      [
        { id: "a", content: "True" },
        { id: "b", content: "False" },
      ],
      "a"
    );

    const groups = groupByRepetitionKey([q2021Auth, q2025Auth, unrelated]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(2);
    expect(groups[0].map((q) => q.origin).sort()).toEqual(["2021", "2025"]);
  });

  it("keeps different answers separate even with similar stems", () => {
    const variant = makeQuestion(
      "2024",
      "block_3:q10",
      "10. Using authorization, have a response of status 200 means that",
      [
        { id: "a", content: "User is not authorized to see the response." },
        { id: "b", content: "content cannot be displayed after authorization." },
        { id: "c", content: "User is authorized to see the response." },
        { id: "d", content: "None of the answers." },
      ],
      "a"
    );

    expect(questionsEquivalent(q2021Auth, variant)).toBe(false);
  });
});
