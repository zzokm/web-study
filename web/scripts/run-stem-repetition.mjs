/**
 * Report repeated stems across the generated catalog (no tsx — plain Node).
 * Usage:
 *   node scripts/run-stem-repetition.mjs
 *   node scripts/run-stem-repetition.mjs --detail
 *   node scripts/run-stem-repetition.mjs --pair 2021:block_10:q45 2025:block_2:q36
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  groupByRepetitionKey,
  normCorrectAnswerContent,
  questionMatchScore,
  questionsEquivalent,
} from "./stem-match.mjs";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(WEB_ROOT, "src/data/generated/catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

const args = process.argv.slice(2);
const detail = args.includes("--detail");
const pairIndex = args.indexOf("--pair");

function formatOptions(question) {
  const correctId = question.correctAnswerId.trim().toLowerCase();
  return question.options
    .map((option) => {
      const marker =
        option.id.trim().toLowerCase() === correctId ? " [correct]" : "";
      return `    ${option.id.toUpperCase()}. ${option.content}${marker}`;
    })
    .join("\n");
}

function printQuestion(question) {
  console.log(`  - ${question.origin} / ${question.sourceQuestionId}`);
  console.log(`    ${question.questionText.replace(/\n/g, " ")}`);
  console.log(formatOptions(question));
  console.log(
    `    Answer key: ${question.correctAnswerId.toUpperCase()} (${normCorrectAnswerContent(question)})`
  );
}

if (pairIndex >= 0) {
  const leftId = args[pairIndex + 1];
  const rightId = args[pairIndex + 2];
  const findQuestion = (id) =>
    catalog.questions.find(
      (q) => q.questionKey === id || q.sourceQuestionId === id
    );
  const left = findQuestion(leftId);
  const right = findQuestion(rightId);

  if (!left || !right) {
    console.error("Could not find one or both questions in catalog.");
    process.exit(1);
  }

  const score = questionMatchScore(left, right);
  console.log(`Pair match score: ${(score * 100).toFixed(1)}%`);
  console.log(`Equivalent: ${questionsEquivalent(left, right) ? "yes" : "no"}`);
  console.log("");
  console.log("Left:");
  printQuestion(left);
  console.log("");
  console.log("Right:");
  printQuestion(right);
  process.exit(0);
}

const started = performance.now();
const groups = groupByRepetitionKey(catalog.questions);
const elapsedMs = performance.now() - started;

groups.sort((a, b) => b.length - a.length);

const duplicateInstances = groups.reduce((sum, group) => sum + group.length - 1, 0);
const uniqueStems = catalog.questions.length - duplicateInstances;

console.log(`Questions: ${catalog.questions.length}`);
console.log(`Repeated groups: ${groups.length} (${elapsedMs.toFixed(1)} ms)`);
console.log(`Duplicate instances absorbed: ${duplicateInstances}`);
console.log(`Unique stems (deduped): ${uniqueStems}`);
console.log("");

for (const [index, group] of groups.entries()) {
  const origins = [...new Set(group.map((q) => q.origin))].sort().join(", ");
  const preview = group[0].questionText.slice(0, 90).replace(/\n/g, " ");
  console.log(
    `${String(index + 1).padStart(2, " ")}. ${group.length}× [${origins}] ${preview}`
  );

  if (!detail) continue;

  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const score = questionMatchScore(group[i], group[j]);
      console.log(
        `    match ${group[i].origin}/${group[i].sourceQuestionId} ↔ ${group[j].origin}/${group[j].sourceQuestionId}: ${(score * 100).toFixed(1)}%`
      );
    }
  }

  for (const question of group) {
    printQuestion(question);
  }
  console.log("");
}
