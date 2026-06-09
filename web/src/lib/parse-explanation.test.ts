import { describe, expect, it } from "vitest";
import { parseExplanationInlines } from "./parse-explanation";

describe("parseExplanationInlines", () => {
  it("renders backtick code without treating single quotes as code", () => {
    const nodes = parseExplanationInlines(
      "Output is `{'name': 'Ahmed', 'id': '1'}` from dict."
    );
    expect(nodes).toEqual([
      { kind: "text", text: "Output is " },
      { kind: "code", text: "{'name': 'Ahmed', 'id': '1'}" },
      { kind: "text", text: " from dict." },
    ]);
  });

  it("parses section headers as strong text", () => {
    const nodes = parseExplanationInlines("**Answer**\n\nOption B is correct.");
    expect(nodes.some((n) => n.kind === "strong" && n.text === "Answer")).toBe(
      true
    );
  });

  it("leaves apostrophes in prose as plain text", () => {
    const nodes = parseExplanationInlines("Python's dict string representation.");
    expect(nodes).toEqual([
      { kind: "text", text: "Python's dict string representation." },
    ]);
  });
});
