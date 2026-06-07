import type { Catalog, LectureMeta, Question } from "@/types/question";
import { mcqOptionDisplayLabelForId } from "@/lib/mcq-options";
import { formatLectureBadgeLabel } from "@/lib/lecture-label";
import { sortExamAppearances } from "@/lib/question-appearances";
import { clusterByRepetitionKey, groupByRepetitionKey } from "@/lib/stem-match";
import catalogJson from "@/data/generated/catalog.json";
import repetitiveJson from "../../public/data/repetitive-questions.json";

const catalog = catalogJson as Catalog;

export function getCatalog(): Catalog {
  return catalog;
}

export function getAllQuestions(): Question[] {
  return catalog.questions;
}

export function getQuestionByKey(key: string): Question | undefined {
  return catalog.questionByKey[key];
}

export function getQuestionsByExamYear(year: string): Question[] {
  const keys = catalog.byExamYear[year] ?? [];
  return keys.map((k) => catalog.questionByKey[k]).filter(Boolean);
}

export function getQuestionsByLectureSlugRaw(slug: string): Question[] {
  const keys = catalog.byLectureSlug[slug] ?? [];
  return keys.map((k) => catalog.questionByKey[k]).filter(Boolean);
}

export { normQuestionText, repetitionKey } from "@/lib/stem-match";

function appearanceKey(origin: string, sourceQuestionId: string): string {
  return `${origin}:${sourceQuestionId}`;
}

function mergeDuplicateStemGroup(group: Question[]): Question {
  if (group.length === 1) return group[0];

  const primary = group[0];
  const appearanceMap = new Map<
    string,
    NonNullable<Question["appearances"]>[number]
  >();

  for (const q of group) {
    for (const a of q.appearances ?? []) {
      appearanceMap.set(
        appearanceKey(a.origin, a.sourceQuestionId),
        a
      );
    }
    const key = appearanceKey(q.origin, q.sourceQuestionId);
    if (!appearanceMap.has(key)) {
      appearanceMap.set(key, {
        origin: q.origin,
        sourceFile: q.sourceFile,
        sourceQuestionId: q.sourceQuestionId,
      });
    }
  }

  const appearances = sortExamAppearances([...appearanceMap.values()]);
  const origins = [
    ...new Set(group.flatMap((q) => q.origins ?? [q.origin])),
  ];

  return {
    ...primary,
    instanceCount: group.length,
    origins,
    appearances,
  };
}

export function dedupeQuestionsByStem(questions: Question[]): Question[] {
  return clusterByRepetitionKey(questions).map((group) =>
    mergeDuplicateStemGroup(group)
  );
}

export function getQuestionsByLectureSlug(slug: string): Question[] {
  return dedupeQuestionsByStem(getQuestionsByLectureSlugRaw(slug));
}

export function getQuestionsForLecturePractice(slug: string): Question[] {
  return getQuestionsByLectureSlug(slug);
}

export function countUniqueQuestions(): number {
  return dedupeQuestionsByStem(catalog.questions).length;
}

export type LectureSlugEntry = {
  slug: string;
  lecture: string;
  count: number;
  track: string;
  trackLabel: string;
  lectureNumber: number;
};

export function getLectureSlugs(): LectureSlugEntry[] {
  const tracks = getTracks();

  return Object.values(getLectureMeta())
    .sort((a, b) => {
      if (a.track !== b.track) {
        return a.track === "frontend" ? -1 : 1;
      }
      return a.lectureNumber - b.lectureNumber;
    })
    .map((lec) => ({
      slug: lec.lectureId,
      lecture: formatLectureBadgeLabel(lec),
      count: getQuestionsByLectureSlug(lec.lectureId).length,
      track: lec.track,
      trackLabel: tracks[lec.track]?.label ?? lec.track,
      lectureNumber: lec.lectureNumber,
    }))
    .filter((entry) => entry.count > 0);
}

export function getLectureMeta() {
  return catalog.lectureMeta;
}

export function getExamMeta() {
  return catalog.examMeta ?? {};
}

export function getTracks() {
  return catalog.tracks ?? {};
}

export function getLecturesByTrack(trackId: string): LectureMeta[] {
  return Object.values(getLectureMeta())
    .filter((lec) => lec.track === trackId)
    .sort((a, b) => a.lectureNumber - b.lectureNumber);
}

export function getExamYears() {
  return catalog.examYears;
}

export function getStats() {
  return {
    ...catalog.stats,
    totalQuestions: countUniqueQuestions(),
    totalExamInstances: catalog.stats.totalQuestions,
  };
}

export function isAnswerCorrect(
  selectedId: string,
  correctAnswerId: string
): boolean {
  return selectedId.trim().toLowerCase() === correctAnswerId.trim().toLowerCase();
}

export function getCorrectAnswerDisplay(question: Question): {
  id: string;
  label: string;
} {
  const opt = question.options.find(
    (o) => o.id.toLowerCase() === question.correctAnswerId.toLowerCase()
  );
  const content = opt?.content ?? question.correctAnswerId;
  return {
    id: mcqOptionDisplayLabelForId(question.options, question.correctAnswerId),
    label: content,
  };
}

export function getRepeatedStemQuestions(): Question[] {
  const fromKeys = catalog.repetitiveKeys
    .map((k) => catalog.questionByKey[k])
    .filter(Boolean);

  if (fromKeys.length > 0) {
    return fromKeys.map((q) => {
      const fileQ = repetitiveJson as {
        questions: Array<Record<string, unknown>>;
      };
      const raw = fileQ.questions.find(
        (r) => (r as unknown as Question).questionKey === q.questionKey
      );
      if (!raw) return q;
      return { ...q, ...repetitiveMetaFromRaw(raw) };
    });
  }

  return groupByRepetitionKey(catalog.questions)
    .map((group) => mergeDuplicateStemGroup(group))
    .sort((a, b) => (b.instanceCount ?? 0) - (a.instanceCount ?? 0));
}

export function getRepetitiveQuestions(): Question[] {
  return getRepeatedStemQuestions();
}

function repetitiveMetaFromRaw(raw: Record<string, unknown>) {
  return {
    appearances: raw.appearances as Question["appearances"],
    instanceCount: raw.instanceCount as number | undefined,
    origins: raw.origins as string[] | undefined,
    repetitionGroupRank: raw.repetitionGroupRank as number | undefined,
  };
}

export function getRepetitiveFileQuestions(): Question[] {
  return getRepeatedStemQuestions();
}

export function getRepetitiveStats() {
  if (catalog.stats.repetitive != null) {
    return catalog.stats.repetitive;
  }
  const data = repetitiveJson as { uniqueRepeatedStems?: number };
  return data.uniqueRepeatedStems ?? getRepeatedStemQuestions().length;
}

export function getLectureIdList(): string[] {
  return Object.keys(catalog.lectureMeta);
}

export function examAsLectureMeta(exam: {
  year: string;
  title: string;
  pageCount: number;
  publicPdfUrl: string;
}): LectureMeta {
  return {
    lectureId: exam.year,
    track: "exams",
    chapterNumber: parseInt(exam.year, 10),
    lectureNumber: parseInt(exam.year, 10),
    topic: exam.title,
    lectureFile: `${exam.year}.pdf`,
    pdfPath: `data/exams/originals/${exam.year}.pdf`,
    pageCount: exam.pageCount,
    publicPdfUrl: exam.publicPdfUrl,
  };
}
