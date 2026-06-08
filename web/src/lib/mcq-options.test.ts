import { describe, expect, it } from "vitest";
import { getAllQuestions, getQuestionByKey } from "@/lib/questions";
import {
  isPositionDependentMcqOption,
  questionHasPositionDependentMcqOptions,
  shuffleMcqOptionOrder,
} from "@/lib/mcq-options";
import { preparePracticeQuestions } from "@/lib/practice-session-config";
import type { QuestionOption } from "@/types/question";
import { createSeededRandom } from "@/lib/seeded-random";

function opt(content: string, id = "a"): QuestionOption {
  return { id, type: "text", content };
}

describe("isPositionDependentMcqOption", () => {
  it("detects numeric and letter combo options", () => {
    expect(isPositionDependentMcqOption(opt("Both 1&2"))).toBe(true);
    expect(isPositionDependentMcqOption(opt("Both 1 & 2"))).toBe(true);
    expect(isPositionDependentMcqOption(opt("Both 1&2/"))).toBe(true);
    expect(isPositionDependentMcqOption(opt("a. and b."))).toBe(true);
    expect(isPositionDependentMcqOption(opt("Both a and b"))).toBe(true);
    expect(isPositionDependentMcqOption(opt("Both A and B"))).toBe(true);
  });

  it("ignores unrelated combo wording", () => {
    expect(
      isPositionDependentMcqOption(
        opt("Both name1 and name2 will have references")
      )
    ).toBe(false);
    expect(isPositionDependentMcqOption(opt("both class and tag"))).toBe(false);
    expect(isPositionDependentMcqOption(opt("All of the above"))).toBe(false);
  });
});

describe("catalog position-dependent MCQ questions", () => {
  it("matches the known exam questions that reference option positions", () => {
    const affected = getAllQuestions()
      .filter((q) => questionHasPositionDependentMcqOptions(q.options))
      .map((q) => q.questionKey)
      .sort();

    expect(affected).toEqual([
      "2021:block_8:q28",
      "2024:block_2:q38",
      "2024:block_2:q55",
    ]);
  });

  it("does not leave trailing slashes on position-dependent options", () => {
    for (const question of getAllQuestions()) {
      if (!questionHasPositionDependentMcqOptions(question.options)) continue;
      for (const option of question.options) {
        expect(option.content.trimEnd().endsWith("/")).toBe(false);
      }
    }
  });
});

describe("preparePracticeQuestions", () => {
  it("keeps option order for position-dependent MCQ questions when shuffling", () => {
    const question = getQuestionByKey("2021:block_8:q28");
    expect(question).toBeDefined();
    const [prepared] = preparePracticeQuestions(
      [question!],
      {
        shuffleQuestions: false,
        shuffleMcqOptions: true,
        showSessionTimer: true,
        examSimulation: false,
      },
      createSeededRandom(99)
    );
    expect(prepared.options.map((o) => o.id)).toEqual(["a", "b", "c", "d"]);
    expect(prepared.options[2]?.content).toBe("Both 1 & 2");
  });
});

describe("shuffleMcqOptionOrder", () => {
  it("still shuffles regular questions", () => {
    const options = [
      opt("One", "a"),
      opt("Two", "b"),
      opt("Three", "c"),
      opt("All of the above", "d"),
    ];
    const random = createSeededRandom(123456789);
    const shuffled = shuffleMcqOptionOrder(options, random);
    expect(shuffled.map((o) => o.id).join(",")).not.toBe("a,b,c,d");
    expect(shuffled[3]?.content).toBe("All of the above");
  });
});
