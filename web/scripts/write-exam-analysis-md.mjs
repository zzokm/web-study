/**
 * Write data/analysis/exam-question-analysis.md from synced catalog + repetitive data.
 * Exam-only metrics — no psychology or management framing.
 */
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(WEB_ROOT, "..");

const THEME_RULES = [
  { theme: "HTML & DOM", test: (t) => /html|dom|element|attribute|tag|anchor/i.test(t) },
  { theme: "CSS", test: (t) => /css|stylesheet|selector|margin|padding|font/i.test(t) },
  {
    theme: "JavaScript",
    test: (t) => /javascript|js\b|typeof|function|variable|array|object|ajax/i.test(t),
  },
  { theme: "HTTP & URLs", test: (t) => /http|url|status code|request|response|method|cookie/i.test(t) },
  { theme: "Django", test: (t) => /django|mvt|model|view|template|admin|migration/i.test(t) },
  { theme: "Python", test: (t) => /python|oop|class|tuple|import\b/i.test(t) },
  { theme: "Networking", test: (t) => /protocol|tcp|ip\b|dns|internet|smtp/i.test(t) },
];

function isFillInBlank(text) {
  return /_{2,}/.test(text);
}

function isTrueFalseNegation(text) {
  return /\b(not|never|only|unlike|avoid|false)\b/i.test(text);
}

function truncate(text, max = 100) {
  const line = text.split("\n")[0];
  if (line.length <= max) return line;
  return `${line.slice(0, max).trim()}…`;
}

function uniqueStemCount(questions, repetitiveGroups) {
  const duplicates = repetitiveGroups.reduce(
    (sum, q) => sum + Math.max(0, (q.instanceCount ?? 2) - 1),
    0
  );
  return questions.length - duplicates;
}

export function buildExamAnalysisMarkdown({
  catalog,
  repetitive,
  generatedAt = new Date().toISOString(),
}) {
  const questions = catalog.questions;
  const years = catalog.examYears;
  const lectureMeta = catalog.lectureMeta;
  const repQuestions = repetitive.questions;
  const uniqueStems = uniqueStemCount(questions, repQuestions);
  const total = questions.length;

  const lines = [];
  const w = (s = "") => lines.push(s);

  w("# Web Technology — Exam Question Analysis");
  w("");
  w(`Generated: ${generatedAt.slice(0, 10)}`);
  w("");
  w("## Dataset overview");
  w("");
  w("| Metric | Value |");
  w("| --- | ---: |");
  w(`| Exam finals | ${years.join(", ")} |`);
  w(`| Total question instances | ${total} |`);
  w(`| Unique stems (deduped) | ${uniqueStems} |`);
  w(`| Lectures mapped | ${catalog.stats.lectures} |`);
  w(`| Repeated stems (same answer) | ${repetitive.uniqueRepeatedStems} |`);
  w("");

  w("## Exams at a glance");
  w("");
  w("| Year | Questions | T/F | MCQ | T/F share |");
  w("| --- | ---: | ---: | ---: | ---: |");
  for (const year of years) {
    const qs = questions.filter((q) => q.origin === year);
    const n = qs.length || 1;
    let tf = 0;
    let mcq = 0;
    for (const q of qs) {
      if (q.questionType === "true_false") tf++;
      else mcq++;
    }
    w(`| ${year} | ${qs.length} | ${tf} | ${mcq} | ${Math.round((tf / n) * 100)}% |`);
  }
  w("");
  w(
    "2024 and 2025 are MCQ-heavy. 2021 mixes more true/false with multiple choice and includes shared HTTP/JavaScript blocks."
  );
  w("");

  w("## Lecture yield (allocated instances)");
  w("");
  w("Counts use `relatedTopics` lecture allocation — one question may count toward multiple lectures.");
  w("");
  const lectureCounts = new Map();
  for (const q of questions) {
    for (const id of q.relatedTopics ?? []) {
      lectureCounts.set(id, (lectureCounts.get(id) ?? 0) + 1);
    }
  }
  const lectureRows = [...lectureCounts.entries()]
    .map(([id, count]) => ({
      id,
      count,
      topic: lectureMeta[id]?.topic ?? id,
      track: lectureMeta[id]?.track ?? "",
    }))
    .sort((a, b) => b.count - a.count);

  w("| Rank | Lecture | Track | Instances | Share |");
  w("| ---: | --- | --- | ---: | ---: |");
  lectureRows.forEach((row, i) => {
    const share = Math.round((row.count / total) * 1000) / 10;
    w(`| ${i + 1} | ${row.topic} | ${row.track} | ${row.count} | ${share}% |`);
  });
  w("");

  const topFive = lectureRows.slice(0, 5).map((r) => r.topic);
  w(
    `**Highest-yield lectures:** ${topFive.join(" → ")}. JavaScript and Python essentials dominate the pool.`
  );
  w("");

  w("## Cross-exam repetition");
  w("");
  if (repQuestions.length === 0) {
    w(
      "No stems were found in more than one final with the same keyed answer. Study by lecture yield and thematic clusters instead."
    );
  } else {
    w(
      `${repetitive.uniqueRepeatedStems} stems repeat across finals (or within a final) with the same correct answer. Drill these first.`
    );
    w("");
    w("| Occurrences | Years | Lectures | Question |");
    w("| ---: | --- | --- | --- |");
    for (const q of repQuestions) {
      const labels = (q.relatedTopics ?? [])
        .map((id) => lectureMeta[id]?.topic ?? id)
        .join(", ");
      w(
        `| ${q.instanceCount ?? 2} | ${(q.origins ?? [q.origin]).join(", ")} | ${labels || "—"} | ${truncate(q.questionText)} |`
      );
    }
  }
  w("");

  const crossYear = repQuestions.filter(
    (q) => new Set(q.origins ?? [q.origin]).size >= 2
  );
  if (crossYear.length > 0) {
    w("### Cross-year repeats");
    w("");
    for (const q of crossYear) {
      w(`- **${(q.origins ?? []).join(" + ")}** — ${truncate(q.questionText, 120)}`);
    }
    w("");
  }

  w("## Item patterns");
  w("");
  let tfAll = 0;
  let mcqAll = 0;
  let fillBlank = 0;
  let tfNeg = 0;
  let codeContext = 0;
  let codeOptions = 0;
  for (const q of questions) {
    if (q.questionType === "true_false") {
      tfAll++;
      if (isTrueFalseNegation(q.questionText)) tfNeg++;
    } else {
      mcqAll++;
    }
    if (isFillInBlank(q.questionText)) fillBlank++;
    if (q.context?.code) codeContext++;
    if (q.options?.some((o) => o.type === "code")) codeOptions++;
  }
  w(`- **True / false:** ${tfAll} (${Math.round((tfAll / total) * 1000) / 10}%)`);
  w(`- **Multiple choice:** ${mcqAll}`);
  w(`- **Fill-in-the-blank stems:** ${fillBlank}`);
  w(
    `- **T/F with negation wording:** ${tfNeg} (${tfAll > 0 ? Math.round((tfNeg / tfAll) * 100) : 0}% of T/F)`
  );
  w(`- **Shared code context blocks:** ${codeContext}`);
  w(`- **Code answer choices:** ${codeOptions}`);
  w("");

  w("## Thematic coverage");
  w("");
  w("Keyword hits across stems, topics, and explanations (categories may overlap).");
  w("");
  const themes = THEME_RULES.map(({ theme, test }) => {
    const byYear = Object.fromEntries(years.map((y) => [y, 0]));
    let themeTotal = 0;
    for (const q of questions) {
      const hay = `${q.questionText} ${q.topic} ${q.explanation}`;
      if (!test(hay)) continue;
      themeTotal++;
      byYear[q.origin] = (byYear[q.origin] ?? 0) + 1;
    }
    return { theme, total: themeTotal, byYear };
  })
    .filter((t) => t.total > 0)
    .sort((a, b) => b.total - a.total);

  w("| Theme | Total | 2021 | 2024 | 2025 |");
  w("| --- | ---: | ---: | ---: | ---: |");
  for (const t of themes) {
    w(
      `| ${t.theme} | ${t.total} | ${t.byYear["2021"] ?? 0} | ${t.byYear["2024"] ?? 0} | ${t.byYear["2025"] ?? 0} |`
    );
  }
  w("");

  w("## Lecture focus by exam year");
  w("");
  for (const year of years) {
    w(`### ${year}`);
    w("");
    const byLecture = new Map();
    for (const q of questions.filter((q) => q.origin === year)) {
      const ids = q.relatedTopics?.length ? q.relatedTopics : ["unmapped"];
      for (const id of ids) {
        const label = lectureMeta[id]?.topic ?? id;
        const row = byLecture.get(id) ?? {
          lecture: label,
          count: 0,
          trueFalse: 0,
          mcq: 0,
        };
        row.count++;
        if (q.questionType === "true_false") row.trueFalse++;
        else row.mcq++;
        byLecture.set(id, row);
      }
    }
    w("| Lecture | Total | T/F | MCQ |");
    w("| --- | ---: | ---: | ---: |");
    [...byLecture.values()]
      .sort((a, b) => b.count - a.count)
      .forEach((row) => {
        w(`| ${row.lecture} | ${row.count} | ${row.trueFalse} | ${row.mcq} |`);
      });
    w("");
  }

  w("## Study priorities");
  w("");
  w("1. **Repetitive stems** — drill the cross-exam repeats listed above before broad review.");
  w(`2. **Lecture weighting** — prioritize ${topFive.join(" → ")}.`);
  w(
    "3. **2024–2025 style** — practice JavaScript output tracing, DOM APIs, Django model/migration questions, and Python collection semantics."
  );
  w(
    "4. **2021 style** — review HTTP caching headers, protocol definitions, and true/false traps around negation."
  );
  w(
    "5. **Code blocks** — trace snippets carefully; many items share a context block or use code as answer choices."
  );
  w(
    "6. **Practice flow** — browse by lecture PDF, then simulate a full year with practice-by-exam mode."
  );
  w("");

  w("## Web app changes (analysis page)");
  w("");
  w("The `/analysis` page was rebuilt for Web Technology:");
  w("");
  w("- Stats: unique stems, exam instances, lectures, repeated stems");
  w("- Exam breakdown for 2021, 2024, and 2025 only (2019 removed)");
  w("- Lecture yield tables and charts using frontend/backend lecture tracks");
  w("- Cross-exam repetition table linked to `/repetitive/`");
  w("- Per-year lecture allocation, item patterns, and thematic coverage");
  w("- Study priorities tailored to JavaScript, Python, Django, and HTTP");
  w("- Removed management chapter weighting and psychology-style strategy text");
  w("");

  return lines.join("\n");
}

export function writeExamAnalysisMarkdown({
  catalog,
  repetitive,
  generatedAt,
}) {
  const outDir = join(REPO_ROOT, "data", "analysis");
  const outPath = join(outDir, "exam-question-analysis.md");
  const publicPath = join(WEB_ROOT, "public", "data", "analysis.md");

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const markdown = buildExamAnalysisMarkdown({ catalog, repetitive, generatedAt });
  writeFileSync(outPath, markdown, "utf8");
  writeFileSync(publicPath, markdown, "utf8");
  return outPath;
}
