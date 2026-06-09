import { describe, expect, it } from "vitest";
import { parseQuestionInlines } from "@/lib/parse-question-inlines";

describe("parseQuestionInlines", () => {
  it("parses strike and underline tags in question stems", () => {
    expect(
      parseQuestionInlines(
        "display <del>Hello</del> <u>Hi</u> in a paragraph"
      )
    ).toEqual([
      { kind: "text", text: "display " },
      { kind: "strike", text: "Hello" },
      { kind: "text", text: " " },
      { kind: "underline", text: "Hi" },
      { kind: "text", text: " in a paragraph" },
    ]);
  });

  it("still parses inline code in backticks", () => {
    expect(parseQuestionInlines("use `innerHTML` here")).toEqual([
      { kind: "text", text: "use " },
      { kind: "code", text: "innerHTML" },
      { kind: "text", text: " here" },
    ]);
  });
});
