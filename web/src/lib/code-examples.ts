import type {
  CodeExample,
  CodeExamplesCatalog,
  CodeExamplesLectureGroup,
  LectureMeta,
} from "@/types/question";
import { getCatalog, getLectureMeta } from "@/lib/questions";

export const CODE_EXAMPLES_SOURCE_LABEL = "the course Google Drive";

export function codeExamplesEntryDescription(lectureTopic: string): string {
  return `Code examples from ${CODE_EXAMPLES_SOURCE_LABEL} for the ${lectureTopic} lecture.`;
}

export function codeExamplesPageDescription(lectureTopic: string): string {
  return `Code examples from ${CODE_EXAMPLES_SOURCE_LABEL} for the ${lectureTopic} lecture. View the source and run live previews where available.`;
}

export function getCodeExamplesCatalog(): CodeExamplesCatalog | undefined {
  return getCatalog().codeExamples;
}

export function getCodeExamplesForLecture(lectureId: string): CodeExample[] {
  const catalog = getCodeExamplesCatalog();
  return catalog?.examplesByLecture[lectureId] ?? [];
}

export function getCodeExampleLectureGroups(): CodeExamplesLectureGroup[] {
  return getCodeExamplesCatalog()?.lectureGroups ?? [];
}

export function getLecturesWithCodeExamples(): string[] {
  return getCodeExamplesCatalog()?.lecturesWithExamples ?? [];
}

export function isCodeExamplesLectureId(lectureId: string): boolean {
  return getLecturesWithCodeExamples().includes(lectureId);
}

export type CodeExamplesSection = {
  group: CodeExamplesLectureGroup | null;
  lectures: LectureMeta[];
  examples: CodeExample[];
};

export function getFrontendCodeExampleSections(): CodeExamplesSection[] {
  const catalog = getCodeExamplesCatalog();
  const lectureMeta = getLectureMeta();
  if (!catalog) return [];

  const sections: CodeExamplesSection[] = [];

  for (const group of catalog.lectureGroups) {
    const lectures = group.lectureIds
      .map((id) => lectureMeta[id])
      .filter((lec): lec is LectureMeta => lec != null);
    sections.push({ group, lectures, examples: [] });
  }

  for (const lectureId of catalog.lecturesWithExamples) {
    const lecture = lectureMeta[lectureId];
    if (!lecture) continue;
    sections.push({
      group: null,
      lectures: [lecture],
      examples: getCodeExamplesForLecture(lectureId),
    });
  }

  return sections;
}
