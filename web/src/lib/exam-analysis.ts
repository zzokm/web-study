import type { Question } from "@/types/question";
import {
  countUniqueQuestionsInPools,
  getAllQuestions,
  getCatalog,
  getExamYears,
  getQuestionsByExamYear,
  getQuestionsByLectureSlug,
  getQuestionsByLectureSlugRaw,
  getRepetitiveFileQuestions,
  getRepetitiveStats,
  getStats,
  slugFromLectureFile,
} from "@/lib/questions";

export interface ExamYearRow {
  year: string;
  count: number;
}

export interface TypeMixRow {
  type: "mcq" | "true_false" | "other";
  label: string;
  count: number;
  share: number;
}

export interface LectureYieldRow {
  rank: number;
  lecture: string;
  slug: string;
  count: number;
  share: number;
}

export interface PoolByYearRow {
  lecture: string;
  slug: string;
  total: number;
  byYear: Record<string, number>;
}

export interface RepeatedStemRow {
  instanceCount: number;
  origins: string[];
  correctAnswerId: string;
  questionType: string;
  topic: string;
  chapterNumber: number | null;
  lectureSlug: string;
  questionText: string;
  questionKey: string;
}

export function chapterNumberFromTopic(topic: string): number | null {
  const match = topic.match(/Chapter\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/** Hash target for /repetitive/ deep-link (expand + scroll). */
export function repetitiveQuestionHash(questionKey: string): string {
  return encodeURIComponent(questionKey);
}

export function repetitiveQuestionHref(questionKey: string): string {
  return `/repetitive/#${repetitiveQuestionHash(questionKey)}`;
}

export interface YearLectureRow {
  lecture: string;
  count: number;
  trueFalse: number;
  mcq: number;
}

export interface YearFormatRow {
  year: string;
  trueFalse: number;
  mcq: number;
  trueFalseShare: number;
}

export interface ThemeRow {
  theme: string;
  total: number;
  byYear: Record<string, number>;
}

export interface CorrectAnswerCountRow {
  label: string;
  count: number;
  share: number;
}

export interface CorrectAnswerDistribution {
  trueFalse: {
    total: number;
    answers: CorrectAnswerCountRow[];
  };
  mcq: {
    total: number;
    answers: CorrectAnswerCountRow[];
  };
}

export interface ExamAnalysisData {
  generatedAt: string;
  stats: ReturnType<typeof getStats>;
  uniqueRepeatedStems: number;
  examYears: ExamYearRow[];
  typeMix: TypeMixRow[];
  lectureYield: LectureYieldRow[];
  lectureYieldAll: LectureYieldRow[];
  lectureYieldTotals: { unique: number; all: number };
  poolByLecture: PoolByYearRow[];
  repeatedStems: RepeatedStemRow[];
  fourExamHighlight: RepeatedStemRow | null;
  yearLectureBreakdown: Record<string, YearLectureRow[]>;
  yearFormat: YearFormatRow[];
  itemPatterns: {
    trueFalse: number;
    mcq: number;
    fillInBlank: number;
    trueFalseNegation: number;
    trueFalseShare: number;
  };
  themes: ThemeRow[];
  correctAnswerDistributionByYear: Record<string, CorrectAnswerDistribution>;
}

const THEME_RULES: Array<{ theme: string; test: (text: string) => boolean }> = [
  {
    theme: "Management functions",
    test: (t) =>
      /planning|organizing|influencing|controlling|management function/i.test(t),
  },
  {
    theme: "Groups & teams",
    test: (t) => /group|team|groupthink/i.test(t),
  },
  {
    theme: "Decision making",
    test: (t) => /decision|problem solving|alternative/i.test(t),
  },
  {
    theme: "Controlling",
    test: (t) => /controlling|standard|deviation/i.test(t),
  },
  {
    theme: "Communication",
    test: (t) => /communication|communicat/i.test(t),
  },
  {
    theme: "Organizing & structure",
    test: (t) => /organiz|span of|bureaucracy|division of labor|scalar/i.test(t),
  },
  { theme: "Ethics", test: (t) => /ethic|moral/i.test(t) },
  {
    theme: "Power & politics",
    test: (t) => /power|politic|authority/i.test(t),
  },
  {
    theme: "Skills",
    test: (t) => /technical skill|human skill|conceptual skill/i.test(t),
  },
  { theme: "HR & staffing", test: (t) => /human resource|staffing|recruit/i.test(t) },
  { theme: "Classical management", test: (t) => /fayol|mintzberg|bureaucracy/i.test(t) },
];

function normalizeType(q: Question): "mcq" | "true_false" | "other" {
  if (q.questionType === "mcq" || q.questionType === "true_false") {
    return q.questionType;
  }
  return "other";
}

function isFillInBlank(text: string): boolean {
  return /_{2,}/.test(text);
}

function isTrueFalseNegation(text: string): boolean {
  return /\b(not|never|only|unlike|avoid)\b/i.test(text);
}

function trueFalseCorrectLabel(q: Question): "True" | "False" | null {
  const correctId = q.correctAnswerId.trim().toLowerCase();
  const option = q.options.find((o) => o.id.toLowerCase() === correctId);
  if (!option) return null;
  const content = option.content.trim().toLowerCase();
  if (content === "true") return "True";
  if (content === "false") return "False";
  return null;
}

function mcqCorrectLetter(q: Question): "A" | "B" | "C" | "D" | "E" | null {
  const correctId = q.correctAnswerId.trim().toLowerCase();
  const index = q.options.findIndex((o) => o.id.toLowerCase() === correctId);
  if (index < 0 || index > 4) return null;
  return String.fromCharCode(65 + index) as "A" | "B" | "C" | "D" | "E";
}

function buildCorrectAnswerRows(
  questions: Question[],
  type: "true_false" | "mcq",
  labels: readonly string[]
): { total: number; answers: CorrectAnswerCountRow[] } {
  const counts = Object.fromEntries(labels.map((l) => [l, 0])) as Record<
    string,
    number
  >;
  let total = 0;

  for (const q of questions) {
    if (normalizeType(q) !== type) continue;
    const label =
      type === "true_false" ? trueFalseCorrectLabel(q) : mcqCorrectLetter(q);
    if (!label || !(label in counts)) continue;
    total++;
    counts[label]++;
  }

  return {
    total,
    answers: labels.map((label) => ({
      label,
      count: counts[label] ?? 0,
      share: total > 0 ? Math.round((counts[label] / total) * 1000) / 10 : 0,
    })),
  };
}

function buildCorrectAnswerDistribution(
  questions: Question[]
): CorrectAnswerDistribution {
  return {
    trueFalse: buildCorrectAnswerRows(questions, "true_false", ["True", "False"]),
    mcq: buildCorrectAnswerRows(questions, "mcq", ["A", "B", "C", "D", "E"]),
  };
}

function buildLectureYield(
  getCount: (slug: string) => number,
  poolTotal: number
): LectureYieldRow[] {
  const catalog = getCatalog();
  const total = poolTotal || 1;

  return catalog.poolIndex.lectureFiles
    .map((f) => {
      const slug = slugFromLectureFile(f.file);
      const count = getCount(slug);
      return {
        lecture: f.lecture,
        slug,
        count,
        share: Math.round((count / total) * 1000) / 10,
      };
    })
    .sort((a, b) => b.count - a.count)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

export function buildExamAnalysis(): ExamAnalysisData {
  const catalog = getCatalog();
  const stats = getStats();
  const questions = getAllQuestions();
  const total = questions.length || 1;
  const years = getExamYears();

  const examYears: ExamYearRow[] = years.map((year) => ({
    year,
    count: getQuestionsByExamYear(year).length,
  }));

  const typeCounts = { mcq: 0, true_false: 0, other: 0 };
  let fillInBlank = 0;
  let trueFalseNegation = 0;

  for (const q of questions) {
    const t = normalizeType(q);
    typeCounts[t]++;
    if (isFillInBlank(q.questionText)) fillInBlank++;
    if (t === "true_false" && isTrueFalseNegation(q.questionText)) {
      trueFalseNegation++;
    }
  }

  const typeMix: TypeMixRow[] = (
    [
      ["mcq", "Multiple choice"],
      ["true_false", "True / false"],
      ["other", "Other"],
    ] as const
  )
    .map(([type, label]) => ({
      type,
      label,
      count: typeCounts[type],
      share: Math.round((typeCounts[type] / total) * 1000) / 10,
    }))
    .filter((r) => r.count > 0);

  const lectureYieldTotals = {
    unique: countUniqueQuestionsInPools(),
    all: catalog.stats.totalQuestions,
  };

  const lectureYield = buildLectureYield(
    (slug) => getQuestionsByLectureSlug(slug).length,
    lectureYieldTotals.unique
  );

  const lectureYieldAll = buildLectureYield(
    (slug) => getQuestionsByLectureSlugRaw(slug).length,
    lectureYieldTotals.all
  );

  const poolByLecture: PoolByYearRow[] = catalog.poolIndex.lectureFiles.map(
    (f) => {
      const slug = slugFromLectureFile(f.file);
      return {
        lecture: f.lecture,
        slug,
        total: getQuestionsByLectureSlug(slug).length,
        byYear: { ...f.origins },
      };
    }
  );

  const repetitive = getRepetitiveFileQuestions();
  const repeatedStems: RepeatedStemRow[] = repetitive
    .map((q) => ({
      instanceCount: q.instanceCount ?? q.origins?.length ?? 2,
      origins: q.origins ?? [q.origin],
      correctAnswerId: q.correctAnswerId,
      questionType: q.questionType,
      topic: q.topic,
      chapterNumber: chapterNumberFromTopic(q.topic),
      lectureSlug: q.lectureSlug,
      questionText: q.questionText,
      questionKey: q.questionKey,
    }))
    .sort((a, b) => b.instanceCount - a.instanceCount);

  const fourExamHighlight =
    repeatedStems.find((r) => r.instanceCount >= 4) ?? null;

  const yearLectureBreakdown: Record<string, YearLectureRow[]> = {};
  for (const year of years) {
    const byLecture = new Map<string, YearLectureRow>();
    for (const q of getQuestionsByExamYear(year)) {
      const existing = byLecture.get(q.topic) ?? {
        lecture: q.topic,
        count: 0,
        trueFalse: 0,
        mcq: 0,
      };
      existing.count++;
      if (normalizeType(q) === "true_false") existing.trueFalse++;
      else if (normalizeType(q) === "mcq") existing.mcq++;
      byLecture.set(q.topic, existing);
    }
    yearLectureBreakdown[year] = [...byLecture.values()].sort(
      (a, b) => b.count - a.count
    );
  }

  const yearFormat: YearFormatRow[] = years.map((year) => {
    const qs = getQuestionsByExamYear(year);
    const n = qs.length || 1;
    let tf = 0;
    let mcq = 0;
    for (const q of qs) {
      const t = normalizeType(q);
      if (t === "true_false") tf++;
      else if (t === "mcq") mcq++;
    }
    return {
      year,
      trueFalse: tf,
      mcq,
      trueFalseShare: Math.round((tf / n) * 100),
    };
  });

  const themes: ThemeRow[] = THEME_RULES.map(({ theme, test }) => {
    const byYear: Record<string, number> = Object.fromEntries(
      years.map((y) => [y, 0])
    );
    let themeTotal = 0;
    for (const q of questions) {
      const hay = `${q.questionText} ${q.topic}`;
      if (!test(hay)) continue;
      themeTotal++;
      byYear[q.origin] = (byYear[q.origin] ?? 0) + 1;
    }
    return { theme, total: themeTotal, byYear };
  })
    .filter((t) => t.total > 0)
    .sort((a, b) => b.total - a.total);

  const correctAnswerDistributionByYear: Record<string, CorrectAnswerDistribution> =
    {
      all: buildCorrectAnswerDistribution(questions),
    };
  for (const year of years) {
    correctAnswerDistributionByYear[year] = buildCorrectAnswerDistribution(
      getQuestionsByExamYear(year)
    );
  }

  return {
    generatedAt: catalog.generatedAt,
    stats,
    uniqueRepeatedStems: getRepetitiveStats(),
    examYears,
    typeMix,
    lectureYield,
    lectureYieldAll,
    lectureYieldTotals,
    poolByLecture,
    repeatedStems,
    fourExamHighlight,
    yearLectureBreakdown,
    yearFormat,
    itemPatterns: {
      trueFalse: typeCounts.true_false,
      mcq: typeCounts.mcq,
      fillInBlank,
      trueFalseNegation,
      trueFalseShare:
        typeCounts.true_false > 0
          ? Math.round((trueFalseNegation / typeCounts.true_false) * 100)
          : 0,
    },
    themes,
    correctAnswerDistributionByYear,
  };
}
