import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseQuestionText,
  stripEmbeddedOptionsFromQuestionText,
} from "./parse-question-content.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data", "exams");
const failures = [];

function proseInCode(content) {
  const last = content.split("\n").at(-1)?.trim() ?? "";
  return (
    /^(The|What|Which|How|When|Where|Identify|Consider|Above|Below)\b/i.test(
      last
    ) || /\b(will be|will return|removed item|output will be)\b/i.test(last)
  );
}

for (const year of ["2021", "2024", "2025"]) {
  const blocks = JSON.parse(readFileSync(join(root, `${year}.json`), "utf8"));
  for (const block of blocks) {
    for (const q of block.questions ?? []) {
      if (!q.questionText?.includes("\n")) continue;
      const segments = parseQuestionText(
        stripEmbeddedOptionsFromQuestionText(q.questionText)
      );
      const code = segments.find((segment) => segment.type === "code");
      if (!code) continue;
      if (proseInCode(code.content)) {
        failures.push(`${year}:${q.id}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error(
    `validate-question-segments: ${failures.length} question(s) still have prose in code blocks:`
  );
  for (const id of failures) console.error(`  - ${id}`);
  process.exit(1);
}

console.log("validate-question-segments: passed");
