import { describe, expect, it } from "vitest";
import { isAnswerCorrect } from "@/lib/questions";

describe("isAnswerCorrect", () => {
  it("accepts both c and d for 2024 Q63 inline background-color", () => {
    const key = "2024:block_3:q63";
    expect(isAnswerCorrect("c", "c", key)).toBe(true);
    expect(isAnswerCorrect("d", "c", key)).toBe(true);
    expect(isAnswerCorrect("a", "c", key)).toBe(false);
  });

  it("uses only the primary key when no alternates are defined", () => {
    expect(isAnswerCorrect("b", "b")).toBe(true);
    expect(isAnswerCorrect("c", "b")).toBe(false);
  });
});
