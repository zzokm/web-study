/**
 * Sync exam JSON, pools, analysis, PDFs from parent mgmt/ into web/public and catalog.
 */
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MGMT_ROOT = join(WEB_ROOT, "..");

const EXAM_MAP = {
  "data/exams/2019.json": "2019",
  "data/exams/2021.json": "2021",
  "data/exams/2024.json": "2024",
  "data/exams/2025.json": "2025",
};

const OptionSchema = z.object({
  id: z.string(),
  content: z.string(),
});

const SlideRefParsedSchema = z.object({
  lectureId: z.string(),
  chapterNumber: z.number(),
  topic: z.string(),
  lectureFile: z.string(),
  pdfPath: z.string(),
  kind: z.enum(["slides", "all", "course", "book"]),
  bookPages: z.array(z.number()).optional(),
  pages: z.array(z.number()),
  pageCount: z.number(),
  syntax: z.string(),
});

const QuestionSchema = z.object({
  id: z.string(),
  topic: z.string(),
  questionText: z.string(),
  context: z.string().nullable().optional(),
  options: z.array(OptionSchema),
  correctAnswerId: z.string(),
  explanation: z.string(),
  reference: z.string(),
  slideRef: z.string(),
  slideRefParsed: SlideRefParsedSchema,
  sourceRefs: z.array(z.string()).optional(),
  sourceRefsParsed: z.array(SlideRefParsedSchema).optional(),
});

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function copy(src, dest) {
  ensureDir(dirname(dest));
  copyFileSync(src, dest);
}

function slugFromTopic(topic) {
  const m = topic.match(/Chapter\s+(\d+):\s*(.+)/i);
  if (!m) return "unknown";
  const num = m[1];
  const name = m[2]
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `chapter-${num}-${name}`;
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

function main() {
  const publicData = join(WEB_ROOT, "public", "data");
  const publicPools = join(publicData, "pools");
  const publicLectures = join(WEB_ROOT, "public", "lectures");
  const publicBook = join(WEB_ROOT, "public", "book");
  const generatedDir = join(WEB_ROOT, "src", "data", "generated");

  ensureDir(publicData);
  ensureDir(publicPools);
  ensureDir(publicLectures);
  ensureDir(publicBook);
  ensureDir(generatedDir);

  // Manifest + lecture PDFs
  const manifestPath = join(MGMT_ROOT, "data", "manifests", "lectures.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  copy(manifestPath, join(publicData, "lectures_manifest.json"));

  const lectureMeta = {};
  for (const [lid, lec] of Object.entries(manifest.lectures)) {
    const srcPdf = join(MGMT_ROOT, "assets", "lectures", lec.lectureFile);
    const destPdf = join(publicLectures, `${lid}.pdf`);
    copy(srcPdf, destPdf);
    lectureMeta[lid] = {
      ...lec,
      publicPdfUrl: `/lectures/${lid}.pdf`,
    };
  }

  // Textbook chapter PDFs (split chapters only — not the full book)
  const bookManifestPath = join(MGMT_ROOT, "data", "manifests", "book.json");
  const bookManifest = JSON.parse(readFileSync(bookManifestPath, "utf8"));
  copy(bookManifestPath, join(publicData, "book_manifest.json"));

  const bookChapterMeta = {};
  for (const [cid, ch] of Object.entries(bookManifest.chapters)) {
    const srcPdf = join(MGMT_ROOT, "assets", "book", ch.sourceFile);
    const destPdf = join(publicBook, `${cid}.pdf`);
    copy(srcPdf, destPdf);
    bookChapterMeta[cid] = {
      chapterId: cid,
      chapterNumber: ch.chapterNumber,
      topic: ch.topic,
      sourceFile: ch.sourceFile,
      bookPageRange: ch.bookPageRange,
      pageCount: ch.pageCount,
      publicPdfUrl: `/book/${cid}.pdf`,
    };
  }

  // Pools
  const poolIndexSrc = join(MGMT_ROOT, "data", "pools", "_index.json");
  copy(poolIndexSrc, join(publicPools, "_index.json"));
  const poolIndex = JSON.parse(readFileSync(poolIndexSrc, "utf8"));

  const byLectureSlug = {};
  for (const entry of poolIndex.lectureFiles) {
    const src = join(MGMT_ROOT, "data", "pools", entry.file);
    copy(src, join(publicPools, entry.file));
    const pool = JSON.parse(readFileSync(src, "utf8"));
    byLectureSlug[pool.slug] = pool.questions.map((q) => {
      const year = q.origin;
      const key = `${year}:${q.sourceQuestionId || q.id}`;
      return key;
    });
  }

  // Repetitive + analysis
  copy(
    join(MGMT_ROOT, "data", "repetitive-questions.json"),
    join(publicData, "repetitive-questions.json")
  );
  const repetitive = JSON.parse(
    readFileSync(join(publicData, "repetitive-questions.json"), "utf8")
  );
  copy(
    join(MGMT_ROOT, "data", "analysis", "exam-question-analysis.md"),
    join(publicData, "analysis.md")
  );

  // Exams -> catalog questions
  const questions = [];
  const byExamYear = { 2019: [], 2021: [], 2024: [], 2025: [] };
  const questionByKey = {};

  for (const [file, year] of Object.entries(EXAM_MAP)) {
    const src = join(MGMT_ROOT, file);
    const dest = join(publicData, "exams", `${year}.json`);
    const raw = JSON.parse(readFileSync(src, "utf8"));

    const enriched = raw.map((q, index) => {
      const questionKey = `${year}:${q.id}`;
      const entry = {
        ...q,
        questionKey,
        origin: year,
        sourceFile: file,
        sourceQuestionId: q.id,
        questionType: classifyQuestionType(q),
        lectureSlug: slugFromTopic(q.topic),
        examOrder: index + 1,
      };
      QuestionSchema.parse(entry);
      questions.push(entry);
      byExamYear[year].push(questionKey);
      questionByKey[questionKey] = entry;
      return entry;
    });

    ensureDir(dirname(dest));
    writeFileSync(dest, JSON.stringify(enriched, null, 2), "utf8");
  }

  const repetitiveKeys = repetitive.questions.map((q) => {
    const year = q.origin;
    return `${year}:${q.sourceQuestionId || q.id}`;
  });

  for (const rq of repetitive.questions) {
    const meta = {
      appearances: rq.appearances,
      instanceCount: rq.instanceCount,
      origins: rq.origins,
      repetitionGroupRank: rq.repetitionGroupRank,
    };
    const keys = new Set([
      `${rq.origin}:${rq.sourceQuestionId || rq.id}`,
      ...(rq.appearances ?? []).map(
        (a) => `${a.origin}:${a.sourceQuestionId}`
      ),
    ]);
    for (const key of keys) {
      if (questionByKey[key]) {
        questionByKey[key] = { ...questionByKey[key], ...meta };
      }
    }
  }

  const catalog = {
    generatedAt: new Date().toISOString(),
    stats: {
      totalQuestions: questions.length,
      lectures: Object.keys(lectureMeta).length,
      bookChapters: Object.keys(bookChapterMeta).length,
      exams: Object.keys(byExamYear).length,
      repetitive: repetitive.uniqueRepeatedStems,
    },
    examYears: ["2019", "2021", "2024", "2025"],
    lectureMeta,
    bookChapterMeta,
    bookTitle: bookManifest.bookTitle,
    poolIndex,
    questions,
    byExamYear,
    byLectureSlug,
    repetitiveKeys,
    questionByKey,
  };

  writeFileSync(join(generatedDir, "catalog.json"), JSON.stringify(catalog, null, 2), "utf8");
  writeFileSync(join(publicData, "catalog.json"), JSON.stringify(catalog, null, 2), "utf8");

  console.log(
    `Synced ${questions.length} questions, ${Object.keys(lectureMeta).length} lectures, ${Object.keys(bookChapterMeta).length} book chapters.`
  );
}

main();
