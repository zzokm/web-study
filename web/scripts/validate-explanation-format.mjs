/**
 * Validate explanation inline formatting across the catalog.
 * Run: node scripts/validate-explanation-format.mjs
 */
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Keep in sync with src/lib/parse-explanation.ts
const BACKTICK_SPLIT_RE = /(`[^`]*`)/g;
const SINGLE_QUOTE_RE = /'([^']*)'/g;
const EMPHASIS_RE = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;

function parseSingleQuotedInProse(text) {
  const nodes = [];
  let lastIndex = 0;
  for (const match of text.matchAll(SINGLE_QUOTE_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(...parseEmphasisInProse(text.slice(lastIndex, index)));
    }
    nodes.push({ kind: "code", text: match[0] });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(...parseEmphasisInProse(text.slice(lastIndex)));
  }
  return nodes.length > 0 ? nodes : parseEmphasisInProse(text);
}

function parseEmphasisInProse(text) {
  const nodes = [];
  let lastIndex = 0;
  for (const match of text.matchAll(EMPHASIS_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push({ kind: "text", text: text.slice(lastIndex, index) });
    }
    if (match[1] !== undefined) {
      nodes.push({ kind: "strong", text: match[1] });
    } else if (match[2] !== undefined) {
      nodes.push({ kind: "em", text: match[2] });
    }
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push({ kind: "text", text: text.slice(lastIndex) });
  }
  return nodes;
}

function parseExplanationInlines(text) {
  const parts = text.split(BACKTICK_SPLIT_RE).filter((part) => part.length > 0);
  const nodes = [];
  for (const part of parts) {
    if (part.startsWith("`") && part.endsWith("`")) {
      nodes.push({ kind: "code", text: part.slice(1, -1) });
      continue;
    }
    nodes.push(...parseSingleQuotedInProse(part));
  }
  return nodes;
}

function hasUnclosedBackticks(text) {
  const count = (text.match(/`/g) ?? []).length;
  return count % 2 !== 0;
}

const catalog = JSON.parse(
  fs.readFileSync(join(WEB_ROOT, "src/data/generated/catalog.json"), "utf8")
);
const explanations = catalog.questions
  .map((q) => q.explanation)
  .filter((e) => e?.trim());

const issues = [];
const kindCounts = { text: 0, code: 0, em: 0, strong: 0 };

for (const explanation of explanations) {
  if (hasUnclosedBackticks(explanation)) {
    issues.push({ type: "unclosed_backtick", explanation });
    continue;
  }
  const nodes = parseExplanationInlines(explanation);
  if (nodes.length === 0) {
    issues.push({ type: "empty_parse", explanation });
  }
  for (const node of nodes) {
    kindCounts[node.kind] = (kindCounts[node.kind] ?? 0) + 1;
  }
}

// Spot-check known samples
const samples = [
  {
    id: "unindexed",
    text: "Sets are explicitly unordered and *unindexed*. You cannot retrieve set elements by referring to index keys or integers.",
    expect: ["em"],
  },
  {
    id: "eval",
    text: "`eval(writeMe)` processes the string as JavaScript code. The string is literally `console.log('document.writeln(x);')`. Thus, the console merely outputs the nested string 'document.writeln(x);' verbatim. The variable `x=13` is entirely bypassed.",
    expect: ["code"],
    mustInclude: "'document.writeln(x);'",
  },
  {
    id: "kwargs",
    text: "The `**kwargs` syntax `**person` packages the keyword arguments into a dictionary. The print statement successfully queries `person[\"name\"]` to fetch \"Ahmed\".",
    expect: ["code"],
  },
];

for (const sample of samples) {
  const nodes = parseExplanationInlines(sample.text);
  for (const kind of sample.expect) {
    if (!nodes.some((n) => n.kind === kind)) {
      issues.push({ type: "sample_missing_kind", sample: sample.id, kind });
    }
  }
  if (sample.mustInclude) {
    const codeText = nodes
      .filter((n) => n.kind === "code")
      .map((n) => n.text)
      .join("|");
    if (!codeText.includes(sample.mustInclude)) {
      issues.push({
        type: "sample_missing_code",
        sample: sample.id,
        want: sample.mustInclude,
      });
    }
  }
}

// 50 random explanations must parse to non-empty output
const shuffled = [...explanations];
for (let i = shuffled.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
}
for (const explanation of shuffled.slice(0, 50)) {
  if (parseExplanationInlines(explanation).length === 0) {
    issues.push({ type: "random_empty", explanation: explanation.slice(0, 80) });
  }
}

console.log(`Validated ${explanations.length} explanations`);
console.log("node kinds:", kindCounts);
console.log(`issues: ${issues.length}`);
if (issues.length > 0) {
  console.log(issues.slice(0, 5));
  process.exit(1);
}
console.log("validate-explanation-format: passed");
