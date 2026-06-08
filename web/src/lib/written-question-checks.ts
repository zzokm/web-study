import type {
  WrittenDecoration,
  WrittenRubric,
  WrittenRubricCheck,
} from "@/types/question";

export interface WrittenCheckResult {
  id: string;
  passed: boolean;
  message: string;
}

export interface WrittenJudgeResult {
  passed: boolean;
  results: WrittenCheckResult[];
}

const STRIKE_TAGS = new Set(["S", "DEL", "STRIKE"]);
const UNDERLINE_TAGS = new Set(["U", "INS"]);

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeCodeFragment(value: string, caseSensitive = false): string {
  const normalized = value.replace(/\r\n/g, "\n");
  return caseSensitive ? normalized : normalized.toLowerCase();
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, "");
}

function quoteAgnostic(value: string): string {
  return value.replace(/['"]/g, "'");
}

export function codeContainsString(
  haystack: string,
  needle: string,
  caseSensitive = false
): boolean {
  const h = normalizeCodeFragment(haystack, caseSensitive);
  const n = normalizeCodeFragment(needle, caseSensitive);
  if (!n) return false;

  if (h.includes(n)) return true;

  const compactHay = compactWhitespace(h);
  const compactNeedle = compactWhitespace(n);
  if (compactHay.includes(compactNeedle)) return true;

  return quoteAgnostic(compactHay).includes(quoteAgnostic(compactNeedle));
}

function findElementsContainingText(
  doc: Document,
  text: string
): Element[] {
  const target = normalizeText(text);
  const matches: Element[] = [];
  for (const el of doc.querySelectorAll("*")) {
    if (normalizeText(el.textContent ?? "").includes(target)) {
      matches.push(el);
    }
  }
  if (doc.body && normalizeText(doc.body.textContent ?? "").includes(target)) {
    matches.push(doc.body);
  }
  return matches;
}

function smallestElementContainingText(
  doc: Document,
  text: string
): Element | null {
  const matches = findElementsContainingText(doc, text);
  if (matches.length === 0) return null;
  return matches.reduce((best, el) => {
    const len = (el.textContent ?? "").length;
    const bestLen = (best.textContent ?? "").length;
    return len <= bestLen ? el : best;
  });
}

function hasDecoration(
  el: Element,
  decoration: WrittenDecoration,
  win: Window
): boolean {
  const tags = decoration === "strikethrough" ? STRIKE_TAGS : UNDERLINE_TAGS;
  let current: Element | null = el;
  while (current && current !== el.ownerDocument?.body) {
    if (tags.has(current.tagName)) return true;
    const style = win.getComputedStyle(current);
    const deco = style.textDecorationLine || style.textDecoration || "";
    if (decoration === "strikethrough" && /line-through/.test(deco)) return true;
    if (decoration === "underline" && /underline/.test(deco)) return true;
    current = current.parentElement;
  }
  return false;
}

function controlLabel(el: Element): string {
  if (el.tagName === "INPUT") {
    return (el as HTMLInputElement).value;
  }
  return el.textContent ?? "";
}

function findControlByLabel(
  doc: Document,
  role: "button" | "input",
  label: string
): HTMLElement | null {
  const target = normalizeText(label);
  const selector =
    role === "button" ? "button, input[type='button'], input[type='submit']" : "input";
  for (const el of doc.querySelectorAll(selector)) {
    if (normalizeText(controlLabel(el)) === target) {
      return el as HTMLElement;
    }
  }
  return null;
}

function parseRgb(color: string): [number, number, number] | null {
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function colorMatches(computed: string, accepted: string[]): boolean {
  const norm = computed.trim().toLowerCase();
  for (const candidate of accepted) {
    const c = candidate.trim().toLowerCase();
    if (norm === c) return true;
    if (c === "green" && (norm === "green" || norm === "rgb(0, 128, 0)")) {
      return true;
    }
    const a = parseRgb(norm);
    const b = parseRgb(c);
    if (a && b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2]) return true;
    if (c.startsWith("#") && norm === c) return true;
  }
  return false;
}

function stylePropertyMatches(
  computed: string,
  property: string,
  accepted: string[]
): boolean {
  const norm = computed.trim().toLowerCase();
  if (property === "fontFamily") {
    return accepted.some((a) => norm.includes(a.toLowerCase()));
  }
  if (property === "fontSize") {
    return accepted.some((a) => norm === a.toLowerCase());
  }
  if (property === "color") {
    return colorMatches(norm, accepted);
  }
  return accepted.some((a) => norm === a.toLowerCase());
}

function runTextCheck(
  source: string,
  check: WrittenRubricCheck
): WrittenCheckResult {
  if (check.type !== "code_contains_string") {
    return {
      id: check.id,
      passed: false,
      message: "Text check requires code_contains_string",
    };
  }

  const found = codeContainsString(source, check.text, check.caseSensitive);
  return {
    id: check.id,
    passed: found,
    message: found
      ? `Found required snippet: "${check.text}"`
      : `Missing required snippet: "${check.text}"`,
  };
}

function runDomCheck(
  doc: Document,
  win: Window,
  check: WrittenRubricCheck
): WrittenCheckResult {
  switch (check.type) {
    case "code_contains_string":
      return {
        id: check.id,
        passed: false,
        message: "code_contains_string requires source text, not DOM",
      };
    case "element_text_includes": {
      const els = doc.querySelectorAll(check.selector);
      const found = Array.from(els).some((el) =>
        normalizeText(el.textContent ?? "").includes(normalizeText(check.text))
      );
      return {
        id: check.id,
        passed: found,
        message: found
          ? `Found "${check.text}" in ${check.selector}`
          : `Expected text "${check.text}" inside ${check.selector}`,
      };
    }
    case "text_has_decoration": {
      const el = smallestElementContainingText(doc, check.text);
      if (!el) {
        return {
          id: check.id,
          passed: false,
          message: `Could not find text "${check.text}"`,
        };
      }
      const ok = hasDecoration(el, check.decoration, win);
      return {
        id: check.id,
        passed: ok,
        message: ok
          ? `"${check.text}" has ${check.decoration}`
          : `"${check.text}" is missing ${check.decoration}`,
      };
    }
    case "control_labeled": {
      const control = findControlByLabel(doc, check.role, check.label);
      return {
        id: check.id,
        passed: control != null,
        message:
          control != null
            ? `Found ${check.role} labeled "${check.label}"`
            : `Missing ${check.role} labeled "${check.label}"`,
      };
    }
    case "click_applies_computed_styles": {
      const trigger = findControlByLabel(doc, "button", check.triggerLabel);
      if (!trigger) {
        return {
          id: check.id,
          passed: false,
          message: `Missing button labeled "${check.triggerLabel}"`,
        };
      }
      const target = doc.querySelector(check.targetSelector);
      if (!target) {
        return {
          id: check.id,
          passed: false,
          message: `Missing target ${check.targetSelector}`,
        };
      }
      trigger.click();
      const style = win.getComputedStyle(target);
      const failures: string[] = [];
      for (const [property, accepted] of Object.entries(check.styles)) {
        const str =
          property === "fontFamily"
            ? style.fontFamily
            : property === "fontSize"
              ? style.fontSize
              : style.color;
        if (!stylePropertyMatches(str, property, accepted)) {
          failures.push(`${property}: got "${str}", expected one of ${accepted.join(", ")}`);
        }
      }
      return {
        id: check.id,
        passed: failures.length === 0,
        message:
          failures.length === 0
            ? "Click applies required styles"
            : failures.join("; "),
      };
    }
    default:
      return {
        id: "unknown",
        passed: false,
        message: "Unknown check type",
      };
  }
}

export function runWrittenRubricChecks(
  doc: Document,
  win: Window,
  rubric: WrittenRubric,
  source?: string
): WrittenJudgeResult {
  const results = rubric.checks.map((check) => {
    if (check.type === "code_contains_string") {
      return runTextCheck(source ?? "", check);
    }
    return runDomCheck(doc, win, check);
  });
  return {
    passed: results.every((r) => r.passed),
    results,
  };
}

export function runWrittenTextRubricChecks(
  source: string,
  rubric: WrittenRubric
): WrittenJudgeResult {
  const results = rubric.checks.map((check) => runTextCheck(source, check));
  return {
    passed: results.every((r) => r.passed),
    results,
  };
}
