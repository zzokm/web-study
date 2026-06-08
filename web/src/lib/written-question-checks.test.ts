import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import {
  codeContainsString,
  runWrittenRubricChecks,
  runWrittenTextRubricChecks,
} from "@/lib/written-question-checks";
import type { WrittenRubric } from "@/types/question";

const Q81_RUBRIC: WrittenRubric = {
  version: 1,
  checks: [
    {
      id: "paragraph_text",
      type: "element_text_includes",
      selector: "p",
      text: "My favorite subject is",
    },
    {
      id: "english_struck",
      type: "text_has_decoration",
      text: "English",
      decoration: "strikethrough",
    },
    {
      id: "arabic_underlined",
      type: "text_has_decoration",
      text: "Arabic",
      decoration: "underline",
    },
    {
      id: "style_button",
      type: "control_labeled",
      role: "button",
      label: "Style",
    },
    {
      id: "click_styles",
      type: "click_applies_computed_styles",
      triggerLabel: "Style",
      targetSelector: "p",
      styles: {
        color: ["green", "rgb(0, 128, 0)", "#008000"],
        fontSize: ["14px"],
        fontFamily: ["arial"],
      },
    },
  ],
};

const MODEL_ANSWER = `<p id="myPara">My favorite subject is <s>English</s> <u>Arabic</u></p>
<button onclick="changeStyle()">Style</button>
<script>
function changeStyle() {
  let p = document.getElementById("myPara");
  p.style.color = "green";
  p.style.fontSize = "14px";
  p.style.fontFamily = "Arial";
}
</script>`;

const ALT_ANSWER = `<p id="para">My favorite subject is <del>English</del> <u>Arabic</u></p>
<button id="btn">Style</button>
<script>
document.getElementById("btn").addEventListener("click", () => {
  const p = document.getElementById("para");
  p.style.color = "rgb(0, 128, 0)";
  p.style.fontSize = "14px";
  p.style.fontFamily = "Arial, sans-serif";
});
</script>`;

function judgeHtml(source: string, rubric: WrittenRubric = Q81_RUBRIC) {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${source}</body></html>`,
    {
      runScripts: "dangerously",
      resources: "usable",
    }
  );
  return runWrittenRubricChecks(
    dom.window.document,
    dom.window as unknown as Window,
    rubric
  );
}

describe("written-question-checks", () => {
  it("passes the model answer", () => {
    const result = judgeHtml(MODEL_ANSWER);
    expect(result.passed).toBe(true);
  });

  it("passes an alternate valid implementation", () => {
    const result = judgeHtml(ALT_ANSWER);
    expect(result.passed).toBe(true);
  });

  it("fails when strike-through is missing", () => {
    const bad = `<p>My favorite subject is English <u>Arabic</u></p>
<button onclick="document.querySelector('p').style.color='green'">Style</button>`;
    const result = judgeHtml(bad);
    expect(result.passed).toBe(false);
    expect(result.results.some((r) => r.id === "english_struck" && !r.passed)).toBe(
      true
    );
  });

  it("matches required Python snippets with whitespace leniency", () => {
    const source = `def get_grade(name):
    grades = {"Ahmed": "A"}
    if name in grades:
        return grades[name]
    return "Not Found"`;

    const result = runWrittenTextRubricChecks(source, {
      version: 1,
      checks: [
        { id: "dict_lookup", type: "code_contains_string", text: "in grades" },
      ],
    });
    expect(result.passed).toBe(true);
  });

  it("accepts alternate quote styles in Django paths", () => {
    const source = `urlpatterns = [
  path("contact/", views.contact_view, name="contact"),
]`;
    expect(
      codeContainsString(
        source,
        "path('contact/', views.contact_view, name='contact')"
      )
    ).toBe(true);
  });
});
