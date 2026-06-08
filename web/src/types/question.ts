export type QuestionType = "true_false" | "mcq" | "other";

export interface QuestionContext {
  text: string | null;
  code: string | null;
  codeLanguage: string | null;
}

export type QuestionContentSegment = {
  type: "text" | "code";
  content: string;
  codeLanguage?: string | null;
};

export interface QuestionOption {
  id: string;
  type: "text" | "code";
  content: string;
  codeLanguage?: string | null;
}

export interface Question {
  id: string;
  topic: string;
  questionText: string;
  context: QuestionContext | null;
  questionSegments: QuestionContentSegment[];
  options: QuestionOption[];
  correctAnswerId: string;
  explanation: string;
  questionKey: string;
  origin: string;
  sourceFile: string;
  sourceQuestionId: string;
  questionType: QuestionType;
  lectureSlug: string;
  examOrder: number;
  blockId?: string;
  /** Lecture IDs from topic allocation (e.g. fe-1, be-4). */
  relatedTopics?: string[];
  instanceCount?: number;
  appearances?: Array<{
    origin: string;
    sourceFile: string;
    sourceQuestionId: string;
  }>;
  origins?: string[];
  repetitionGroupRank?: number;
}

export interface TrackMeta {
  trackId: string;
  label: string;
  description: string;
}

export interface LectureTopicGroup {
  title: string;
  summary: string;
}

export interface LectureMeta {
  lectureId: string;
  track: string;
  chapterNumber: number;
  lectureNumber: number;
  topic: string;
  lectureFile: string;
  pdfPath: string;
  pageCount: number;
  publicPdfUrl: string;
  description?: string;
  extent?: string;
  coveredTopics?: LectureTopicGroup[];
}

export interface CodeExample {
  id: string;
  lectureId: string;
  order: number;
  title: string;
  file: string;
  language: string;
  explanation: string;
  source: string;
  previewUrl: string;
  previewAvailable: boolean;
  previewAutoRun: boolean;
  showConsoleTab: boolean;
}

export interface CodeExamplesLectureGroup {
  id: string;
  label: string;
  lectureIds: string[];
}

export interface CodeExamplesCatalog {
  version: number;
  lectureGroups: CodeExamplesLectureGroup[];
  lecturesWithExamples: string[];
  examplesByLecture: Record<string, CodeExample[]>;
}

export interface ExamMeta {
  year: string;
  title: string;
  examFile: string;
  pdfPath: string;
  pageCount: number;
  publicPdfUrl: string;
}

export interface Catalog {
  generatedAt: string;
  stats: {
    totalQuestions: number;
    totalExamInstances?: number;
    lectures: number;
    exams: number;
    repetitive: number;
    codeExamples?: number;
  };
  examYears: string[];
  tracks: Record<string, TrackMeta>;
  lectureMeta: Record<string, LectureMeta>;
  examMeta: Record<string, ExamMeta>;
  codeExamples?: CodeExamplesCatalog;
  questions: Question[];
  byExamYear: Record<string, string[]>;
  byLectureSlug: Record<string, string[]>;
  repetitiveKeys: string[];
  questionByKey: Record<string, Question>;
}

export interface RepetitiveFile {
  title: string;
  description: string;
  uniqueRepeatedStems: number;
  questions: Question[];
}
