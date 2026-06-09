import { describe, expect, it } from "vitest";
import { isAnswerCorrect } from "@/lib/questions";

describe("isAnswerCorrect", () => {
  it("matches option ids case-insensitively", () => {
    expect(isAnswerCorrect("d", "d")).toBe(true);
    expect(isAnswerCorrect("D", "d")).toBe(true);
    expect(isAnswerCorrect("c", "d")).toBe(false);
  });
});
