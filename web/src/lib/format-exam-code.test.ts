import { describe, expect, it } from "vitest";
import { formatExamCode, shouldFormatExamCode } from "@/lib/format-exam-code";
import { cleanExamCode } from "@/lib/parse-question-content";

const Q80_ASYNC = `async function f() {
let promise = new Promise((resolve, reject) => {
setTimeout(() => resolve('done!'), 1000);
});
let result = await promise;
console.log(result);
}
f();
console.log('first!');`;

const Q75_PYTHON_TRAP = `if 1 < 2:
print("One is less than Two!")
print("One is less than Two!")`;

const FLAT_HTML = `<html>
<head>
</head>
<body>
<h2 id="id1">Welcome</h2>
<div>
<p>Paragraph 1</p>
</div>
</body>
</html>`;

const FLAT_CSS = `.class { color: blue; font-weight; bold; }`;

describe("formatExamCode", () => {
  it("indents JavaScript brace blocks (2025 Q80 style)", () => {
    const formatted = formatExamCode(Q80_ASYNC, "javascript");
    expect(formatted).toContain("async function f() {");
    expect(formatted).toMatch(/\n {4}let promise/);
    expect(formatted).toMatch(/\n {8}setTimeout/);
  });

  it("indents HTML context blocks", () => {
    const formatted = formatExamCode(FLAT_HTML, "html");
    expect(formatted).toContain("<head>");
    expect(formatted).toMatch(/\n {4}<h2 id="id1">/);
    expect(formatted).toMatch(/\n {8}<p>Paragraph 1<\/p>/);
  });

  it("indents CSS rule declarations", () => {
    const formatted = formatExamCode(FLAT_CSS, "css");
    expect(formatted).toContain("color: blue");
    expect(formatted).toMatch(/\n {4}font-weight/);
  });

  it("preserves Python indentation-trap questions (2024 Q75)", () => {
    expect(shouldFormatExamCode(Q75_PYTHON_TRAP, "python")).toBe(false);
    expect(formatExamCode(Q75_PYTHON_TRAP, "python")).toBe(Q75_PYTHON_TRAP);
    expect(cleanExamCode(Q75_PYTHON_TRAP, "python")).toBe(Q75_PYTHON_TRAP);
  });

  it("is idempotent via cleanExamCode", () => {
    const once = cleanExamCode(Q80_ASYNC, "javascript");
    const twice = cleanExamCode(once, "javascript");
    expect(twice).toBe(once);
  });

  it("leaves already-indented code unchanged", () => {
    const indented = `function changeStyle() {\n    let p = document.getElementById("myPara");\n}`;
    expect(shouldFormatExamCode(indented, "javascript")).toBe(false);
    expect(cleanExamCode(indented, "javascript")).toBe(indented);
  });
});
