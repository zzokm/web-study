import type { Question } from "@/types/question";
import { formatLectureBadgeLabel } from "@/lib/lecture-label";
import {
  countUniqueQuestions,
  getAllQuestions,
  getCatalog,
  getExamYears,
  getLectureMeta,
  getLectureSlugs,
  getQuestionsByExamYear,
  getQuestionsByLectureSlug,
  getQuestionsByLectureSlugRaw,
  getRepeatedStemQuestions,
  getRepetitiveStats,
  getStats,
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
  track: string;
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
  lectureIds: string[];
  lectureLabels: string[];
  questionText: string;
  questionKey: string;
}

export function repetitiveQuestionHash(questionKey: string): string {
  return encodeURIComponent(questionKey);
}

export function repetitiveQuestionHref(questionKey: string): string {
  return `/repetitive/#${repetitiveQuestionHash(questionKey)}`;
}

export interface YearLectureRow {
  lecture: string;
  slug: string;
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

/** Frontend vs backend share from lecture topic allocation hits. */
export interface TrackAllocationRow {
  /** `all`, `average`, or an exam year. */
  key: string;
  label: string;
  frontendShare: number;
  backendShare: number;
  frontendHits: number;
  backendHits: number;
  questionCount: number;
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
  allExamsHighlight: RepeatedStemRow | null;
  yearLectureBreakdown: Record<string, YearLectureRow[]>;
  yearFormat: YearFormatRow[];
  itemPatterns: {
    trueFalse: number;
    mcq: number;
    fillInBlank: number;
    trueFalseNegation: number;
    trueFalseShare: number;
    codeContext: number;
    codeOptions: number;
  };
  themes: ThemeRow[];
  correctAnswerDistributionByYear: Record<string, CorrectAnswerDistribution>;
  trackAllocation: TrackAllocationRow[];
}

const THEME_RULES: Array<{ theme: string; test: (text: string) => boolean }> = [
  { theme: "HTML & DOM", test: (t) => /html|dom|element|attribute|tag|anchor/i.test(t) },
  { theme: "CSS", test: (t) => /css|stylesheet|selector|margin|padding|font/i.test(t) },
  {
    theme: "JavaScript",
    test: (t) => /javascript|js\b|typeof|function|variable|array|object|ajax/i.test(t),
  },
  { theme: "HTTP & URLs", test: (t) => /http|url|status code|request|response|method|cookie/i.test(t) },
  { theme: "Django", test: (t) => /django|mvt|model|view|template|admin|migration/i.test(t) },
  { theme: "Python", test: (t) => /python|oop|class|tuple|import\b/i.test(t) },
  {
    theme: "Networking",
    test: (t) => /protocol|tcp|ip\b|dns|internet|smtp/i.test(t),
  },
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
  return /\b(not|never|only|unlike|avoid|false)\b/i.test(text);
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

function countTrackAllocationHits(questions: Question[]): {
  frontendHits: number;
  backendHits: number;
} {
  const lectureMeta = getLectureMeta();
  let frontendHits = 0;
  let backendHits = 0;

  for (const q of questions) {
    const topics = q.relatedTopics?.filter(Boolean) ?? [];
    for (const slug of topics) {
      const track = lectureMeta[slug]?.track;
      if (track === "frontend") frontendHits++;
      else if (track === "backend") backendHits++;
    }
  }

  return { frontendHits, backendHits };
}

function trackSharesFromHits(
  frontendHits: number,
  backendHits: number
): { frontendShare: number; backendShare: number } {
  const total = frontendHits + backendHits;
  if (total === 0) {
    return { frontendShare: 0, backendShare: 0 };
  }
  const frontendShare = Math.round((frontendHits / total) * 1000) / 10;
  return {
    frontendShare,
    backendShare: Math.round((100 - frontendShare) * 10) / 10,
  };
}

function buildTrackAllocationRow(
  key: string,
  label: string,
  questions: Question[]
): TrackAllocationRow {
  const { frontendHits, backendHits } = countTrackAllocationHits(questions);
  const shares = trackSharesFromHits(frontendHits, backendHits);
  return {
    key,
    label,
    ...shares,
    frontendHits,
    backendHits,
    questionCount: questions.length,
  };
}

export function buildTrackAllocation(years: string[]): TrackAllocationRow[] {
  const yearRows = years.map((year) =>
    buildTrackAllocationRow(year, year, getQuestionsByExamYear(year))
  );

  const allQuestions = getAllQuestions();
  const allRow = buildTrackAllocationRow("all", "All exams", allQuestions);

  const averageFrontendShare =
    yearRows.length > 0
      ? Math.round(
          (yearRows.reduce((sum, row) => sum + row.frontendShare, 0) /
            yearRows.length) *
            10
        ) / 10
      : 0;

  const averageRow: TrackAllocationRow = {
    key: "average",
    label: "Year average",
    frontendShare: averageFrontendShare,
    backendShare: Math.round((100 - averageFrontendShare) * 10) / 10,
    frontendHits: Math.round(
      yearRows.reduce((sum, row) => sum + row.frontendHits, 0) / yearRows.length
    ),
    backendHits: Math.round(
      yearRows.reduce((sum, row) => sum + row.backendHits, 0) / yearRows.length
    ),
    questionCount: Math.round(
      yearRows.reduce((sum, row) => sum + row.questionCount, 0) / yearRows.length
    ),
  };

  return [allRow, averageRow, ...yearRows];
}

function buildLectureYield(
  getCount: (slug: string) => number,
  poolTotal: number
): LectureYieldRow[] {
  const total = poolTotal || 1;

  return getLectureSlugs()
    .map((f) => {
      const count = getCount(f.slug);
      return {
        lecture: f.lecture,
        slug: f.slug,
        count,
        share: Math.round((count / total) * 1000) / 10,
        track: f.track,
      };
    })
    .sort((a, b) => b.count - a.count)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

function lectureLabelsForQuestion(
  question: Question,
  lectureMeta: ReturnType<typeof getLectureMeta>
): { ids: string[]; labels: string[] } {
  const ids = [...new Set(question.relatedTopics ?? [])];
  const labels = ids.map((id) => {
    const lec = lectureMeta[id];
    return lec ? formatLectureBadgeLabel(lec) : id;
  });
  return { ids, labels };
}

function mapRepeatedStem(
  q: Question,
  lectureMeta: ReturnType<typeof getLectureMeta>
): RepeatedStemRow {
  const { ids, labels } = lectureLabelsForQuestion(q, lectureMeta);
  return {
    instanceCount: q.instanceCount ?? q.origins?.length ?? 2,
    origins: q.origins ?? [q.origin],
    correctAnswerId: q.correctAnswerId,
    questionType: q.questionType,
    topic: q.topic,
    lectureIds: ids,
    lectureLabels: labels,
    questionText: q.questionText,
    questionKey: q.questionKey,
  };
}

export function buildExamAnalysis(): ExamAnalysisData {
  const catalog = getCatalog();
  const stats = getStats();
  const questions = getAllQuestions();
  const total = questions.length || 1;
  const years = getExamYears();
  const lectureMeta = getLectureMeta();
  const examCount = years.length;

  const examYears: ExamYearRow[] = years.map((year) => ({
    year,
    count: getQuestionsByExamYear(year).length,
  }));

  const typeCounts = { mcq: 0, true_false: 0, other: 0 };
  let fillInBlank = 0;
  let trueFalseNegation = 0;
  let codeContext = 0;
  let codeOptions = 0;

  for (const q of questions) {
    const t = normalizeType(q);
    typeCounts[t]++;
    if (isFillInBlank(q.questionText)) fillInBlank++;
    if (t === "true_false" && isTrueFalseNegation(q.questionText)) {
      trueFalseNegation++;
    }
    if (q.context?.code) codeContext++;
    if (q.options.some((o) => o.type === "code")) codeOptions++;
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
    unique: countUniqueQuestions(),
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

  const poolByLecture: PoolByYearRow[] = getLectureSlugs().map((f) => {
    const byYear: Record<string, number> = {};
    for (const q of getQuestionsByLectureSlugRaw(f.slug)) {
      byYear[q.origin] = (byYear[q.origin] ?? 0) + 1;
    }
    return {
      lecture: f.lecture,
      slug: f.slug,
      total: f.count,
      byYear,
    };
  });

  const repetitive = getRepeatedStemQuestions();
  const repeatedStems: RepeatedStemRow[] = repetitive
    .map((q) => mapRepeatedStem(q, lectureMeta))
    .sort((a, b) => b.instanceCount - a.instanceCount);

  const allExamsHighlight =
    repeatedStems.find((r) => r.origins.length >= examCount) ?? null;

  const yearLectureBreakdown: Record<string, YearLectureRow[]> = {};
  for (const year of years) {
    const byLecture = new Map<string, YearLectureRow>();
    for (const q of getQuestionsByExamYear(year)) {
      const lectureIds = q.relatedTopics?.length
        ? q.relatedTopics
        : ["unmapped"];
      for (const lectureId of lectureIds) {
        const lec = lectureMeta[lectureId];
        const label = lec ? formatLectureBadgeLabel(lec) : lectureId;
        const existing = byLecture.get(lectureId) ?? {
          lecture: label,
          slug: lectureId,
          count: 0,
          trueFalse: 0,
          mcq: 0,
        };
        existing.count++;
        if (normalizeType(q) === "true_false") existing.trueFalse++;
        else if (normalizeType(q) === "mcq") existing.mcq++;
        byLecture.set(lectureId, existing);
      }
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
      const hay = `${q.questionText} ${q.topic} ${q.explanation}`;
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
    allExamsHighlight,
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
      codeContext,
      codeOptions,
    },
    themes,
    correctAnswerDistributionByYear,
    trackAllocation: buildTrackAllocation(years),
  };
}
