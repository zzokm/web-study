/**
 * Sync exam JSON, lecture PDFs, and exam PDFs from parent data/ into web/public and catalog.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import {
  cleanExamCode,
  normalizeCodeLanguage,
  normalizeOption,
  parseBlockContext,
  parseQuestionText,
  normalizeExamQuestionText,
  parseWrittenQuestionText,
} from "./parse-question-content.mjs";
import { buildRepetitiveCatalog } from "./stem-match.mjs";
import { writeExamAnalysisMarkdown } from "./write-exam-analysis-md.mjs";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(WEB_ROOT, "..");

const EXAM_MAP = {
  "data/exams/2021.json": "2021",
  "data/exams/2024.json": "2024",
  "data/exams/2025.json": "2025",
};

const OptionSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "code"]),
  content: z.string(),
  codeLanguage: z.string().nullable().optional(),
});

const ContextSchema = z
  .object({
    text: z.string().nullable(),
    code: z.string().nullable(),
    codeLanguage: z.string().nullable(),
  })
  .nullable();

const SegmentSchema = z.object({
  type: z.enum(["text", "code"]),
  content: z.string(),
  codeLanguage: z.string().nullable().optional(),
});

const QuestionSchema = z.object({
  id: z.string(),
  topic: z.string(),
  questionText: z.string(),
  context: ContextSchema,
  questionSegments: z.array(SegmentSchema),
  options: z.array(OptionSchema),
  correctAnswerId: z.string(),
  explanation: z.string(),
  questionKey: z.string(),
  origin: z.string(),
  sourceFile: z.string(),
  sourceQuestionId: z.string(),
  questionType: z.enum(["true_false", "mcq", "written", "other"]),
  lectureSlug: z.string(),
  examOrder: z.number(),
  blockId: z.string().optional(),
  relatedTopics: z.array(z.string()).optional(),
  expectedAnswer: z.string().nullable().optional(),
  answerLanguage: z.string().nullable().optional(),
  appearances: z
    .array(
      z.object({
        origin: z.string(),
        sourceFile: z.string(),
        sourceQuestionId: z.string(),
      })
    )
    .optional(),
  writtenRubric: z
    .object({
      version: z.literal(1),
      checks: z.array(z.record(z.string(), z.unknown())),
    })
    .nullable()
    .optional(),
});

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function copy(src, dest) {
  ensureDir(dirname(dest));
  copyFileSync(src, dest);
}

function slugFromTopic(topic) {
  return topic
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function classifyQuestionType(q) {
  if (q.type === "written") return "written";
  const opts = q.options || [];
  if (
    opts.length === 2 &&
    opts.every((o) => ["True", "False"].includes(o.content?.trim()))
  ) {
    return "true_false";
  }
  if (opts.length > 2) return "mcq";
  return "other";
}

function isPreviewAvailable(source) {
  // Any non-empty example can run in the sandboxed iframe (scripts, alerts,
  // prompts, and console output all execute on Run).
  return source.trim().length > 0;
}

function wrapHtmlIfNeeded(source) {
  const trimmed = source.trim();
  if (/<!DOCTYPE\s+html/i.test(trimmed) || /<html[\s>]/i.test(trimmed)) {
    return source;
  }
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
${source}
</body>
</html>
`;
}

function syncCodeExamples(publicCodeExamples) {
  const manifestPath = join(
    REPO_ROOT,
    "data",
    "manifests",
    "code-examples.json"
  );
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const explanationsPath = join(
    REPO_ROOT,
    "data",
    "manifests",
    "code-example-explanations.json"
  );
  const explanations = existsSync(explanationsPath)
    ? JSON.parse(readFileSync(explanationsPath, "utf8"))
    : {};
  copy(manifestPath, join(WEB_ROOT, "public", "data", "code_examples_manifest.json"));

  const lectureSettings = manifest.lectureSettings ?? {};
  const codeExamples = {};

  for (const example of manifest.examples ?? []) {
    const { lectureId, file, id, title, order, language } = example;
    const settings = lectureSettings[lectureId] ?? {};
    const srcPath = join(REPO_ROOT, "data", "code-examples", lectureId, file);
    if (!existsSync(srcPath)) {
      throw new Error(`Missing code example file: ${srcPath}`);
    }

    const rawSource = readFileSync(srcPath, "utf8");
    const publicDir = join(publicCodeExamples, lectureId);
    const destPath = join(publicDir, file);
    ensureDir(publicDir);
    writeFileSync(destPath, wrapHtmlIfNeeded(rawSource), "utf8");

    const explanation =
      example.explanation ?? explanations[id] ?? "";

    if (!explanation.trim()) {
      throw new Error(
        `Missing explanation for code example ${id} (${lectureId}/${file}). Add it to data/manifests/code-example-explanations.json.`
      );
    }

    const entry = {
      id,
      lectureId,
      order,
      title,
      file,
      language: language ?? "html",
      explanation,
      source: rawSource,
      previewUrl: `/code-examples/${lectureId}/${file}`,
      previewAvailable:
        typeof example.previewAvailable === "boolean"
          ? example.previewAvailable
          : isPreviewAvailable(rawSource),
      previewAutoRun:
        typeof example.previewAutoRun === "boolean"
          ? example.previewAutoRun
          : Boolean(settings.previewAutoRun),
      showConsoleTab:
        typeof example.showConsoleTab === "boolean"
          ? example.showConsoleTab
          : settings.showConsoleTab !== false,
    };

    if (!codeExamples[lectureId]) {
      codeExamples[lectureId] = [];
    }
    codeExamples[lectureId].push(entry);
  }

  for (const [lectureId, assets] of Object.entries(manifest.assets ?? {})) {
    for (const asset of assets) {
      const srcPath = join(REPO_ROOT, "data", "code-examples", lectureId, asset);
      if (!existsSync(srcPath)) {
        throw new Error(`Missing code example asset: ${srcPath}`);
      }
      copy(srcPath, join(publicCodeExamples, lectureId, asset));
    }
  }

  for (const lectureId of Object.keys(codeExamples)) {
    codeExamples[lectureId].sort((a, b) => a.order - b.order);
  }

  return {
    version: manifest.version ?? 1,
    lectureGroups: manifest.lectureGroups ?? [],
    lecturesWithExamples: manifest.lecturesWithExamples ?? [],
    examplesByLecture: codeExamples,
  };
}

function flattenExamBlocks(raw, year, sourceFile) {
  const questions = [];
  let order = 0;

  for (const block of raw) {
    const topic = block.topic ?? "General";
    const slug = slugFromTopic(topic);
    const blockContext = parseBlockContext(block.context);

    for (const q of block.questions ?? []) {
      order += 1;
      const sourceQuestionId = `${block.id}:${q.id}`;
      const questionText = normalizeExamQuestionText(q.questionText);
      const entry = {
        id: sourceQuestionId,
        topic,
        questionText,
        context: blockContext,
        questionSegments: parseQuestionText(questionText),
        options: (q.options ?? []).map((o) => normalizeOption(o)),
        correctAnswerId: q.correctAnswerId ?? "",
        explanation: q.explanation ?? "",
        questionKey: `${year}:${sourceQuestionId}`,
        origin: year,
        sourceFile,
        sourceQuestionId,
        questionType: classifyQuestionType(q),
        lectureSlug: slug,
        examOrder: order,
        blockId: block.id,
        relatedTopics: q.relatedTopics ?? [],
        expectedAnswer: q.expectedAnswer ?? null,
        writtenRubric: q.writtenRubric ?? null,
      };
      QuestionSchema.parse(entry);
      questions.push(entry);
    }
  }

  return questions;
}

const WrittenSourceSchema = z.object({
  id: z.string(),
  type: z.literal("written"),
  topic: z.string(),
  questionText: z.string(),
  context: ContextSchema,
  expectedAnswer: z.string(),
  writtenRubric: z.object({
    version: z.literal(1),
    checks: z.array(z.record(z.string(), z.unknown())),
  }),
  explanation: z.string(),
  relatedTopics: z.array(z.string()).min(1),
  answerLanguage: z.string().optional(),
});

const WrittenExamPlacementSchema = z.object({
  year: z.string(),
  blockId: z.string(),
  questionId: z.string(),
  questionNumber: z.number(),
  topic: z.string().optional(),
});

const WrittenQuestionEntrySchema = WrittenSourceSchema.extend({
  order: z.number().int().positive().optional(),
  examPlacement: WrittenExamPlacementSchema.optional(),
});

const WRITTEN_MANIFEST_PATH = join(
  REPO_ROOT,
  "data",
  "manifests",
  "written-questions.json"
);

const WRITTEN_QUESTIONS_DIR = join(REPO_ROOT, "data", "written-questions");

function loadWrittenQuestionBundle() {
  if (!existsSync(WRITTEN_MANIFEST_PATH)) {
    return { manifest: null, entries: [] };
  }

  const manifest = JSON.parse(readFileSync(WRITTEN_MANIFEST_PATH, "utf8"));
  const questionsFile = manifest.file ?? "questions.json";
  const srcPath = join(WRITTEN_QUESTIONS_DIR, questionsFile);
  if (!existsSync(srcPath)) {
    throw new Error(`Missing written questions file: ${srcPath}`);
  }

  const bundle = JSON.parse(readFileSync(srcPath, "utf8"));
  const sourceFile = `data/written-questions/${questionsFile}`;
  const entries = [];
  const seenIds = new Set();

  for (const [index, entry] of (bundle.questions ?? []).entries()) {
    WrittenQuestionEntrySchema.parse(entry);
    if (seenIds.has(entry.id)) {
      throw new Error(`Duplicate written question id in ${questionsFile}: ${entry.id}`);
    }
    seenIds.add(entry.id);

    const manifestEntry = {
      id: entry.id,
      order: entry.order ?? index + 1,
      examPlacement: entry.examPlacement,
      file: questionsFile,
    };
    const { order: _order, examPlacement: _placement, ...raw } = entry;
    entries.push({ manifestEntry, raw, sourceFile });
  }

  return { manifest, entries };
}

function formatExpectedAnswer(raw) {
  const answer = raw.expectedAnswer;
  if (!answer?.trim()) return answer ?? null;
  const lang = normalizeCodeLanguage(raw.answerLanguage) ?? "html";
  return cleanExamCode(answer, lang);
}

function examStemWithNumber(questionText, questionNumber) {
  const prefix = `${questionNumber}. `;
  const numbered = new RegExp(`^${questionNumber}\\.\\s`);
  if (numbered.test(questionText)) return questionText;
  return prefix + questionText;
}

function buildWrittenHubCatalogEntry(raw, manifestEntry, sourceFile) {
  const topic = raw.topic ?? "Written";
  const slug = slugFromTopic(topic);
  const catalogEntry = {
    id: raw.id,
    topic,
    questionText: raw.questionText,
    context: parseBlockContext(raw.context),
    questionSegments: parseWrittenQuestionText(raw.questionText),
    options: [],
    correctAnswerId: "",
    explanation: raw.explanation ?? "",
    questionKey: `written:${raw.id}`,
    origin: "written",
    sourceFile,
    sourceQuestionId: raw.id,
    questionType: "written",
    lectureSlug: slug,
    examOrder: manifestEntry.order ?? 1,
    blockId: "written",
    relatedTopics: raw.relatedTopics ?? [],
    expectedAnswer: formatExpectedAnswer(raw),
    writtenRubric: raw.writtenRubric,
    answerLanguage: raw.answerLanguage ?? null,
  };
  const placement = manifestEntry.examPlacement;
  if (placement) {
    catalogEntry.appearances = [
      {
        origin: placement.year,
        sourceFile,
        sourceQuestionId: `${placement.blockId}:${placement.questionId}`,
      },
    ];
  }
  QuestionSchema.parse(catalogEntry);
  return catalogEntry;
}

function buildWrittenExamCatalogEntry(
  raw,
  placement,
  year,
  examOrder,
  sourceFile
) {
  const topic = placement.topic ?? raw.topic ?? "Written";
  const slug = slugFromTopic(topic);
  const sourceQuestionId = `${placement.blockId}:${placement.questionId}`;
  const questionText = examStemWithNumber(
    raw.questionText,
    placement.questionNumber
  );
  const catalogEntry = {
    id: sourceQuestionId,
    topic,
    questionText,
    context: parseBlockContext(raw.context),
    questionSegments: parseWrittenQuestionText(questionText),
    options: [],
    correctAnswerId: "",
    explanation: raw.explanation ?? "",
    questionKey: `${year}:${sourceQuestionId}`,
    origin: year,
    sourceFile,
    sourceQuestionId,
    questionType: "written",
    lectureSlug: slug,
    examOrder,
    blockId: placement.blockId,
    relatedTopics: raw.relatedTopics ?? [],
    expectedAnswer: formatExpectedAnswer(raw),
    writtenRubric: raw.writtenRubric,
    answerLanguage: raw.answerLanguage ?? null,
  };
  QuestionSchema.parse(catalogEntry);
  return catalogEntry;
}

function appendWrittenExamPlacements(flattened, year, bundle) {
  const appended = [];
  for (const { manifestEntry, raw, sourceFile } of bundle.entries) {
    const placement = manifestEntry.examPlacement;
    if (!placement || placement.year !== year) continue;
    const examOrder = flattened.length + appended.length + 1;
    const entry = buildWrittenExamCatalogEntry(
      raw,
      placement,
      year,
      examOrder,
      sourceFile
    );
    appended.push(entry);
  }
  return appended;
}

function syncWrittenQuestions(bundle) {
  if (!bundle.manifest) {
    return { questions: [], manifest: null };
  }

  copy(
    WRITTEN_MANIFEST_PATH,
    join(WEB_ROOT, "public", "data", "written_questions_manifest.json")
  );

  const questions = bundle.entries.map(({ manifestEntry, raw, sourceFile }) =>
    buildWrittenHubCatalogEntry(raw, manifestEntry, sourceFile)
  );

  return { questions, manifest: bundle.manifest };
}

function main() {
  const publicData = join(WEB_ROOT, "public", "data");
  const publicLectures = join(WEB_ROOT, "public", "lectures");
  const publicExams = join(WEB_ROOT, "public", "exams");
  const publicCodeExamples = join(WEB_ROOT, "public", "code-examples");
  const generatedDir = join(WEB_ROOT, "src", "data", "generated");

  ensureDir(publicData);
  ensureDir(publicLectures);
  ensureDir(publicExams);
  ensureDir(publicCodeExamples);
  ensureDir(generatedDir);

  const manifestPath = join(REPO_ROOT, "data", "manifests", "lectures.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  copy(manifestPath, join(publicData, "lectures_manifest.json"));

  const lectureMeta = {};
  for (const [lid, lec] of Object.entries(manifest.lectures)) {
    const srcPdf = join(REPO_ROOT, lec.pdfPath);
    const destPdf = join(publicLectures, `${lid}.pdf`);
    copy(srcPdf, destPdf);
    lectureMeta[lid] = {
      ...lec,
      chapterNumber: lec.lectureNumber,
      publicPdfUrl: `/lectures/${lid}.pdf`,
    };
  }

  const examsManifestPath = join(REPO_ROOT, "data", "manifests", "exams.json");
  const examsManifest = JSON.parse(readFileSync(examsManifestPath, "utf8"));
  copy(examsManifestPath, join(publicData, "exams_manifest.json"));

  const examMeta = {};
  for (const [year, exam] of Object.entries(examsManifest.exams)) {
    const srcPdf = join(REPO_ROOT, exam.pdfPath);
    const destPdf = join(publicExams, `${year}.pdf`);
    copy(srcPdf, destPdf);
    examMeta[year] = {
      ...exam,
      publicPdfUrl: `/exams/${year}.pdf`,
    };
  }

  const writtenBundle = loadWrittenQuestionBundle();
  const questions = [];
  const byExamYear = { 2021: [], 2024: [], 2025: [] };
  const byLectureSlug = Object.fromEntries(
    Object.keys(lectureMeta).map((lectureId) => [lectureId, []])
  );
  const questionByKey = {};

  function indexQuestion(entry) {
    questions.push(entry);
    questionByKey[entry.questionKey] = entry;
    for (const lectureId of entry.relatedTopics ?? []) {
      if (!byLectureSlug[lectureId]) {
        byLectureSlug[lectureId] = [];
      }
      byLectureSlug[lectureId].push(entry.questionKey);
    }
  }

  for (const [file, year] of Object.entries(EXAM_MAP)) {
    const src = join(REPO_ROOT, file);
    const dest = join(publicData, "exams", `${year}.json`);
    const raw = JSON.parse(readFileSync(src, "utf8"));
    const flattened = flattenExamBlocks(raw, year, file);
    const examWritten = appendWrittenExamPlacements(
      flattened,
      year,
      writtenBundle
    );
    const yearQuestions = [...flattened, ...examWritten];

    for (const entry of flattened) {
      byExamYear[year].push(entry.questionKey);
      indexQuestion(entry);
    }

    for (const entry of examWritten) {
      byExamYear[year].push(entry.questionKey);
      indexQuestion(entry);
    }

    ensureDir(dirname(dest));
    writeFileSync(dest, JSON.stringify(yearQuestions, null, 2), "utf8");
  }

  const writtenCatalog = syncWrittenQuestions(writtenBundle);
  for (const entry of writtenCatalog.questions) {
    questions.push(entry);
    questionByKey[entry.questionKey] = entry;
    for (const lectureId of entry.relatedTopics ?? []) {
      if (!byLectureSlug[lectureId]) {
        byLectureSlug[lectureId] = [];
      }
      byLectureSlug[lectureId].push(entry.questionKey);
    }
  }

  const repetitive = buildRepetitiveCatalog(questions);
  writeFileSync(
    join(publicData, "repetitive-questions.json"),
    JSON.stringify(
      {
        title: "Repetitive questions",
        description:
          "Stems that appear in more than one final with the same keyed answer.",
        uniqueRepeatedStems: repetitive.uniqueRepeatedStems,
        questions: repetitive.questions,
      },
      null,
      2
    ),
    "utf8"
  );

  const codeExamplesCatalog = syncCodeExamples(publicCodeExamples);
  const codeExampleCount = Object.values(
    codeExamplesCatalog.examplesByLecture
  ).reduce((sum, list) => sum + list.length, 0);

  const generatedAt = new Date().toISOString();

  const catalog = {
    generatedAt,
    stats: {
      totalQuestions: questions.length,
      lectures: Object.keys(lectureMeta).length,
      exams: Object.keys(examMeta).length,
      repetitive: repetitive.uniqueRepeatedStems,
      codeExamples: codeExampleCount,
    },
    examYears: ["2021", "2024", "2025"],
    tracks: manifest.tracks,
    lectureMeta,
    examMeta,
    codeExamples: codeExamplesCatalog,
    questions,
    byExamYear,
    byLectureSlug,
    repetitiveKeys: repetitive.repetitiveKeys,
    questionByKey,
  };

  writeFileSync(
    join(generatedDir, "catalog.json"),
    JSON.stringify(catalog, null, 2),
    "utf8"
  );
  writeFileSync(
    join(publicData, "catalog.json"),
    JSON.stringify(catalog, null, 2),
    "utf8"
  );

  writeExamAnalysisMarkdown({
    catalog,
    repetitive: {
      questions: repetitive.questions,
      uniqueRepeatedStems: repetitive.uniqueRepeatedStems,
    },
    generatedAt,
  });

  const writtenCount = writtenCatalog.questions.length;
  console.log(
    `Synced ${questions.length} questions (${writtenCount} written), ${Object.keys(lectureMeta).length} lectures, ${Object.keys(examMeta).length} exam PDFs, ${codeExampleCount} code examples.`
  );
}

main();
