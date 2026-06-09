import { describe, expect, it } from "vitest";
import {
  parseQuestionText,
  stripEmbeddedOptionsFromQuestionText,
} from "../../scripts/parse-question-content.mjs";

const Q18 =
  "18. In python, a set is a collection which is unordered and unindexed.\na. True\nb. False";

const Q20 =
  "20. In Python, when using the super () function, the child class will not inherit the methods and properties from the parent class.\na. True\nb. False";

const Q22 =
  "22. In the following statement: myNumbers = [1,2,3]\nx = myNumbers.pop()\nThe removed item will be 3.\na. True\nb. False";

describe("stripEmbeddedOptionsFromQuestionText", () => {
  it("removes trailing True/False option lines", () => {
    expect(stripEmbeddedOptionsFromQuestionText(Q18)).toBe(
      "18. In python, a set is a collection which is unordered and unindexed."
    );
  });

  it("leaves code questions without embedded options unchanged", () => {
    const codeOnly =
      "21. In the following statement:\nmyNumbers = [1,2,3]\nx = myNumbers.pop()";
    expect(stripEmbeddedOptionsFromQuestionText(codeOnly)).toBe(codeOnly);
  });
});

describe("parseQuestionText", () => {
  it("renders T/F stems as plain text without leaking options", () => {
    const segments = parseQuestionText(Q18);
    expect(segments).toEqual([
      {
        type: "text",
        content:
          "18. In python, a set is a collection which is unordered and unindexed.",
      },
    ]);
    expect(JSON.stringify(segments)).not.toContain("True");
  });

  it("does not treat prose mentioning super() as a JavaScript code block", () => {
    const segments = parseQuestionText(Q20);
    expect(segments).toHaveLength(1);
    expect(segments[0]?.type).toBe("text");
    expect(segments[0]?.content).toContain("super ()");
  });

  it("strips options from code+T/F stems without leaking True/False", () => {
    const segments = parseQuestionText(Q22);
    expect(segments.every((s) => s.type === "text")).toBe(true);
    expect(JSON.stringify(segments)).not.toMatch(/a\. True|b\. False/);
  });

  it("still splits multiline code questions without embedded options", () => {
    const codeQuestion =
      "21. In the following statement:\nmyNumbers = [1,2,3]\nx = myNumbers.pop()\nThe removed item will be 1";
    const segments = parseQuestionText(codeQuestion);
    expect(segments.some((s) => s.type === "code")).toBe(true);
  });
});
