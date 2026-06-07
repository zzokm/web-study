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
  normalizeOption,
  parseBlockContext,
  parseQuestionText,
} from "./parse-question-content.mjs";

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
  questionType: z.enum(["true_false", "mcq", "other"]),
  lectureSlug: z.string(),
  examOrder: z.number(),
  blockId: z.string().optional(),
  relatedTopics: z.array(z.string()).optional(),
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
      const entry = {
        id: sourceQuestionId,
        topic,
        questionText: q.questionText,
        context: blockContext,
        questionSegments: parseQuestionText(q.questionText),
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
      };
      QuestionSchema.parse(entry);
      questions.push(entry);
    }
  }

  return questions;
}

function main() {
  const publicData = join(WEB_ROOT, "public", "data");
  const publicLectures = join(WEB_ROOT, "public", "lectures");
  const publicExams = join(WEB_ROOT, "public", "exams");
  const generatedDir = join(WEB_ROOT, "src", "data", "generated");

  ensureDir(publicData);
  ensureDir(publicLectures);
  ensureDir(publicExams);
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

  const questions = [];
  const byExamYear = { 2021: [], 2024: [], 2025: [] };
  const byLectureSlug = Object.fromEntries(
    Object.keys(lectureMeta).map((lectureId) => [lectureId, []])
  );
  const questionByKey = {};

  for (const [file, year] of Object.entries(EXAM_MAP)) {
    const src = join(REPO_ROOT, file);
    const dest = join(publicData, "exams", `${year}.json`);
    const raw = JSON.parse(readFileSync(src, "utf8"));
    const flattened = flattenExamBlocks(raw, year, file);

    for (const entry of flattened) {
      questions.push(entry);
      byExamYear[year].push(entry.questionKey);
      questionByKey[entry.questionKey] = entry;

      for (const lectureId of entry.relatedTopics ?? []) {
        if (!byLectureSlug[lectureId]) {
          byLectureSlug[lectureId] = [];
        }
        byLectureSlug[lectureId].push(entry.questionKey);
      }
    }

    ensureDir(dirname(dest));
    writeFileSync(dest, JSON.stringify(flattened, null, 2), "utf8");
  }

  const repetitive = {
    questions: [],
    uniqueRepeatedStems: 0,
  };
  writeFileSync(
    join(publicData, "repetitive-questions.json"),
    JSON.stringify(repetitive, null, 2),
    "utf8"
  );

  const analysisSrc = join(REPO_ROOT, "data", "analysis", "exam-question-analysis.md");
  if (existsSync(analysisSrc)) {
    copy(analysisSrc, join(publicData, "analysis.md"));
  }

  const catalog = {
    generatedAt: new Date().toISOString(),
    stats: {
      totalQuestions: questions.length,
      lectures: Object.keys(lectureMeta).length,
      exams: Object.keys(examMeta).length,
      repetitive: 0,
    },
    examYears: ["2021", "2024", "2025"],
    tracks: manifest.tracks,
    lectureMeta,
    examMeta,
    questions,
    byExamYear,
    byLectureSlug,
    repetitiveKeys: [],
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

  console.log(
    `Synced ${questions.length} questions, ${Object.keys(lectureMeta).length} lectures, ${Object.keys(examMeta).length} exam PDFs.`
  );
}

main();
