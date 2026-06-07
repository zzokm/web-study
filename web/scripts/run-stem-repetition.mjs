/**
 * Report repeated stems across the generated catalog (no tsx — plain Node).
 * Usage: node scripts/run-stem-repetition.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { groupByRepetitionKey } from "./stem-match.mjs";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(WEB_ROOT, "src/data/generated/catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

const started = performance.now();
const groups = groupByRepetitionKey(catalog.questions);
const elapsedMs = performance.now() - started;

groups.sort((a, b) => b.length - a.length);

const uniqueStems = catalog.questions.length - groups.reduce((n, g) => n + g.length - 1, 0);

console.log(`Questions: ${catalog.questions.length}`);
console.log(`Repeated stem groups: ${groups.length} (${elapsedMs.toFixed(1)} ms)`);
console.log(`Unique stems (deduped): ${uniqueStems}`);
console.log("");

for (const group of groups.slice(0, 20)) {
  const origins = [...new Set(group.map((q) => q.origin))].join(",");
  const preview = group[0].questionText.slice(0, 80).replace(/\n/g, " ");
  console.log(`${group.length}\t${origins}\t${preview}`);
}
