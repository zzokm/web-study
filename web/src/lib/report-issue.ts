import type { MockExamSpec } from "@/lib/mock-exam";
import type { Question } from "@/types/question";
import { formatLectureBadgeLabel } from "@/lib/lecture-label";
import { examQuestionNumberFromId } from "@/lib/question-appearances";
import { getExamMeta, getLectureMeta } from "@/lib/questions";

export const REPORT_FORM_ID =
  "1FAIpQLSc_xJ6zuD2eGeWSraN0TCq4WYBRJAVsaseA9e_DtfQOod8QaA";

export const REPORT_FORM_BASE = `https://docs.google.com/forms/d/e/${REPORT_FORM_ID}/viewform`;

/**
 * Google Form prefill entry IDs — the `entry.NNNNN` keys in the viewform URL.
 * These are the inner IDs from FB_PUBLIC_LOAD_DATA (`field[4][0][0]`), not the
 * outer question wrapper IDs (`field[0]`). Prefill also requires `usp=pp_url`.
 */
export const REPORT_FORM_ENTRIES = {
  issueType: "924018450",
  description: "142573693",
  contactEmail: "1247312475",
  expectedAnswer: "283859182",
  steps: "864977798",
  pageUrl: "254584609",
  issueScope: "1178971734",
  reportContext: "1904904607",
  questionKey: "619076863",
  examYear: "698876340",
  lectureSlug: "2037647722",
  deviceInfo: "2064139030",
  timestamp: "1035001243",
  codeExampleId: "382395630",
  codeExampleFile: "358580894",
  mockExamDetails: "51481666",
} as const;

export const ISSUE_TYPES = [
  "Wrong Answer Key/Incorrect Data",
  "Confusing/Incorrect Explanation",
  "Typo/Grammar Error",
  "Broken PDF/External Link",
  "Incorrect Code Example Explanation",
  "Code Example Preview/Run Issue",
  "Mock Exam Generation Issue",
  "Practice Mode Bug (Scoring/Skipping)",
  "User Interface (UI) or Layout Issue",
  "Other Technical Bug or Feedback",
] as const;

export type IssueType = (typeof ISSUE_TYPES)[number];

export const ISSUE_TYPE_WRONG_ANSWER: IssueType = ISSUE_TYPES[0];

export const BUG_ISSUE_TYPES: ReadonlySet<IssueType> = new Set([
  "Code Example Preview/Run Issue",
  "Mock Exam Generation Issue",
  "Practice Mode Bug (Scoring/Skipping)",
  "User Interface (UI) or Layout Issue",
  "Other Technical Bug or Feedback",
]);

export const CODE_EXAMPLE_ISSUE_TYPES: ReadonlySet<IssueType> = new Set([
  "Incorrect Code Example Explanation",
  "Code Example Preview/Run Issue",
]);

export const MOCK_EXAM_ISSUE_TYPES: ReadonlySet<IssueType> = new Set([
  "Mock Exam Generation Issue",
]);

export const CODE_EXAMPLES_LECTURE_IDS = ["fe-4", "fe-5", "fe-6"] as const;

export type CodeExamplesScope = "general" | (typeof CODE_EXAMPLES_LECTURE_IDS)[number];

export type IssueScope = "general" | "specific";

export type ReportLocationId =
  | "this_page"
  | "home"
  | "practice"
  | "analysis"
  | "exams"
  | "lectures_fe"
  | "lectures_be"
  | "code_examples"
  | "mock_exam"
  | "repetitive"
  | "saved"
  | "written"
  | "by_exam"
  | "by_lecture";

export const REPORT_HUB_LOCATIONS: ReadonlyArray<{
  id: Exclude<ReportLocationId, "this_page" | "by_exam" | "by_lecture">;
  label: string;
  pageUrl: string;
}> = [
  { id: "home", label: "Home", pageUrl: "/" },
  { id: "practice", label: "Practice", pageUrl: "/practice/" },
  { id: "analysis", label: "Analysis", pageUrl: "/analysis/" },
  { id: "exams", label: "Exam PDFs", pageUrl: "/exams/" },
  { id: "lectures_fe", label: "Frontend lectures", pageUrl: "/lectures/frontend/" },
  { id: "lectures_be", label: "Backend lectures", pageUrl: "/lectures/backend/" },
  { id: "repetitive", label: "Repetitive questions", pageUrl: "/repetitive/" },
  { id: "saved", label: "Saved questions", pageUrl: "/saved/" },
  { id: "written", label: "Written questions", pageUrl: "/written/" },
];

export type CodeExampleReportTarget = {
  id: string;
  file: string;
  title: string;
  lectureId: string;
};

export type ReportFormPayload = {
  issueType: IssueType;
  description: string;
  contactEmail?: string;
  expectedAnswer?: string;
  steps?: string;
  pageUrl: string;
  issueScope: IssueScope;
  reportContext: string;
  questionKey?: string;
  examYear?: string;
  lectureSlug?: string;
  codeExampleId?: string;
  codeExampleFile?: string;
  mockExamDetails?: string;
  deviceInfo: string;
  timestamp: string;
};

export type ReportDescriptionContext = {
  codeExample?: CodeExampleReportTarget;
  mockExamSpec?: MockExamSpec;
};

export type OpenReportIssueOptions = {
  question?: Question;
  codeExample?: CodeExampleReportTarget;
  mockExamSpec?: MockExamSpec;
  pageUrl?: string;
  issueType?: IssueType;
};

export function deriveReportContext(pathname: string): string {
  const path = pathname.replace(/\/$/, "") || "/";
  const segments = path.split("/").filter(Boolean);

  if (path === "/") return "home";

  if (segments[0] === "practice") {
    if (segments[1] === "lecture" && segments[2]) return "practice_lecture";
    if (segments[1] === "exam" && segments[2]) return "practice_exam";
    if (segments[1] === "mock-exam") return "practice_mock_exam";
    if (segments[1] === "repetitive") return "practice_repetitive";
    if (segments[1] === "saved") return "practice_saved";
    if (segments[1] === "results") return "practice_results";
    return "practice_hub";
  }

  if (segments[0] === "code-examples") {
    if (segments[1]) return `code_examples_${segments[1]}`;
    return "code_examples";
  }

  if (segments[0] === "by-lecture") {
    return segments[1] ? "browse_by_lecture" : "browse_by_lecture_hub";
  }

  if (segments[0] === "by-exam") {
    return segments[1] ? "browse_by_exam" : "browse_by_exam_hub";
  }

  if (segments[0] === "repetitive") return "repetitive";
  if (segments[0] === "saved") return "saved";
  if (segments[0] === "analysis") return "analysis";
  if (segments[0] === "lectures") return "pdf_lecture";
  if (segments[0] === "exams") return "pdf_exam";

  return "other";
}

export function deriveScopeFromPathname(pathname: string): {
  issueScope: IssueScope;
  examYear?: string;
  lectureSlug?: string;
} {
  const path = pathname.replace(/\/$/, "") || "/";
  const segments = path.split("/").filter(Boolean);

  if (segments[0] === "by-exam" && segments[1]) {
    return { issueScope: "specific", examYear: segments[1] };
  }
  if (segments[0] === "by-lecture" && segments[1]) {
    return { issueScope: "specific", lectureSlug: segments[1] };
  }
  if (segments[0] === "practice" && segments[1] === "exam" && segments[2]) {
    return { issueScope: "specific", examYear: segments[2] };
  }
  if (segments[0] === "practice" && segments[1] === "lecture" && segments[2]) {
    return { issueScope: "specific", lectureSlug: segments[2] };
  }
  if (segments[0] === "exams" && segments[1]) {
    return { issueScope: "specific", examYear: segments[1] };
  }
  if (segments[0] === "lectures" && segments[1] && segments[1] !== "frontend" && segments[1] !== "backend") {
    return { issueScope: "specific", lectureSlug: segments[1] };
  }
  if (segments[0] === "code-examples" && segments[1]) {
    return { issueScope: "specific", lectureSlug: segments[1] };
  }

  return { issueScope: "general" };
}

export function collectDeviceInfo(): string {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return "unknown";
  }
  const { userAgent, platform } = navigator;
  const viewport = `${window.innerWidth}×${window.innerHeight}`;
  return `${userAgent} | ${viewport} | ${platform}`;
}

function appendEntry(
  params: URLSearchParams,
  entryId: string | undefined,
  value: string | undefined
) {
  if (entryId?.trim() && value?.trim()) {
    params.set(`entry.${entryId.trim()}`, value.trim());
  }
}

export function buildCodeExampleReportContext(
  target: CodeExampleReportTarget
): string {
  return `code_examples:${target.lectureId}:${target.id}`;
}

export function formatMockExamDetails(spec: MockExamSpec): string {
  const { config } = spec;
  return [
    `seed=${spec.seed}`,
    `questions=${spec.questionCount}`,
    `frontend=${spec.frontendShare}%`,
    `backend=${spec.backendShare}%`,
    `shuffleQuestions=${config.shuffleQuestions}`,
    `shuffleMcqOptions=${config.shuffleMcqOptions}`,
    `examSimulation=${config.examSimulation}`,
    `showSessionTimer=${config.showSessionTimer}`,
    `version=${spec.version}`,
  ].join(", ");
}

export function buildMockExamReportContext(spec: MockExamSpec): string {
  return `mock_exam:${spec.seed}:${spec.questionCount}:${spec.frontendShare}`;
}

export function enrichReportDescription(
  description: string,
  context?: ReportDescriptionContext
): string {
  const headers: string[] = [];
  if (context?.codeExample) {
    const ex = context.codeExample;
    headers.push(
      `[Code example: ${ex.title} (${ex.file}), id: ${ex.id}, lecture: ${ex.lectureId}]`
    );
  }
  if (context?.mockExamSpec) {
    headers.push(`[Mock exam: ${formatMockExamDetails(context.mockExamSpec)}]`);
  }
  if (headers.length === 0) {
    return description;
  }
  return `${headers.join("\n")}\n\n${description}`;
}

export function buildReportFormUrl(payload: ReportFormPayload): string {
  const params = new URLSearchParams();
  params.set("usp", "pp_url");

  appendEntry(params, REPORT_FORM_ENTRIES.issueType, payload.issueType);
  appendEntry(params, REPORT_FORM_ENTRIES.description, payload.description);
  appendEntry(params, REPORT_FORM_ENTRIES.contactEmail, payload.contactEmail);
  appendEntry(params, REPORT_FORM_ENTRIES.expectedAnswer, payload.expectedAnswer);
  appendEntry(params, REPORT_FORM_ENTRIES.steps, payload.steps);
  appendEntry(params, REPORT_FORM_ENTRIES.pageUrl, payload.pageUrl);
  appendEntry(params, REPORT_FORM_ENTRIES.issueScope, payload.issueScope);
  appendEntry(params, REPORT_FORM_ENTRIES.reportContext, payload.reportContext);
  appendEntry(params, REPORT_FORM_ENTRIES.questionKey, payload.questionKey);
  appendEntry(params, REPORT_FORM_ENTRIES.examYear, payload.examYear);
  appendEntry(params, REPORT_FORM_ENTRIES.lectureSlug, payload.lectureSlug);
  appendEntry(params, REPORT_FORM_ENTRIES.codeExampleId, payload.codeExampleId);
  appendEntry(
    params,
    REPORT_FORM_ENTRIES.codeExampleFile,
    payload.codeExampleFile
  );
  appendEntry(params, REPORT_FORM_ENTRIES.mockExamDetails, payload.mockExamDetails);
  appendEntry(params, REPORT_FORM_ENTRIES.deviceInfo, payload.deviceInfo);
  appendEntry(params, REPORT_FORM_ENTRIES.timestamp, payload.timestamp);

  const query = params.toString();
  return query ? `${REPORT_FORM_BASE}?${query}` : REPORT_FORM_BASE;
}

export function resolveLocationPageUrl(
  locationId: ReportLocationId,
  currentPageUrl: string,
  options?: {
    byExamScope?: "general" | "year";
    examYear?: string;
    byLectureScope?: "general" | "lecture";
    lectureSlug?: string;
    codeExamplesScope?: CodeExamplesScope;
  }
): { pageUrl: string; issueScope: IssueScope; examYear?: string; lectureSlug?: string } {
  if (locationId === "this_page") {
    const pathname = currentPageUrl.split("?")[0] ?? currentPageUrl;
    const scope = deriveScopeFromPathname(pathname);
    return { pageUrl: currentPageUrl, ...scope };
  }

  if (locationId === "by_exam") {
    if (options?.byExamScope === "year" && options.examYear) {
      return {
        pageUrl: `/by-exam/${options.examYear}/`,
        issueScope: "specific",
        examYear: options.examYear,
      };
    }
    return { pageUrl: "/by-exam/", issueScope: "general" };
  }

  if (locationId === "by_lecture") {
    if (options?.byLectureScope === "lecture" && options.lectureSlug) {
      return {
        pageUrl: `/by-lecture/${options.lectureSlug}/`,
        issueScope: "specific",
        lectureSlug: options.lectureSlug,
      };
    }
    return { pageUrl: "/by-lecture/", issueScope: "general" };
  }

  if (locationId === "code_examples") {
    const scope = options?.codeExamplesScope ?? "general";
    if (scope === "fe-4" || scope === "fe-5" || scope === "fe-6") {
      return {
        pageUrl: `/code-examples/${scope}/`,
        issueScope: "specific",
        lectureSlug: scope,
      };
    }
    return { pageUrl: "/lectures/frontend/", issueScope: "general" };
  }

  if (locationId === "mock_exam") {
    return { pageUrl: "/practice/mock-exam/", issueScope: "general" };
  }

  const hub = REPORT_HUB_LOCATIONS.find((h) => h.id === locationId);
  if (hub) {
    return { pageUrl: hub.pageUrl, issueScope: "general" };
  }

  return { pageUrl: currentPageUrl, issueScope: "general" };
}

export function formatReportMockExamSummary(spec: MockExamSpec): {
  headline: string;
  subtitle: string;
} {
  return {
    headline: `Mock exam · ${spec.questionCount} questions`,
    subtitle: `${spec.frontendShare}% frontend / ${spec.backendShare}% backend · seed ${spec.seed}`,
  };
}

export function formatReportCodeExampleSummary(
  target: CodeExampleReportTarget
): {
  headline: string;
  subtitle: string;
} {
  const lecture = getLectureMeta()[target.lectureId];
  const lectureLabel = lecture
    ? formatLectureBadgeLabel(lecture)
    : target.lectureId;

  return {
    headline: target.title,
    subtitle: `${target.file} · ${lectureLabel}`,
  };
}

export function deriveCodeExamplesScopeFromPathname(
  pathname: string
): CodeExamplesScope {
  const segments = pathname.replace(/\/$/, "").split("/").filter(Boolean);
  if (
    segments[0] === "code-examples" &&
    (segments[1] === "fe-4" ||
      segments[1] === "fe-5" ||
      segments[1] === "fe-6")
  ) {
    return segments[1] as CodeExamplesScope;
  }
  return "general";
}

export function formatReportQuestionSummary(question: Question): {
  headline: string;
  subtitle: string;
} {
  const qNum = examQuestionNumberFromId(
    question.sourceQuestionId,
    question.questionText
  );
  const examMeta = question.origin ? getExamMeta()[question.origin] : undefined;
  const examLabel =
    examMeta?.title ??
    (question.origin ? `${question.origin} Final Exam` : "Practice question");

  const lecture = question.lectureSlug
    ? getLectureMeta()[question.lectureSlug]
    : undefined;
  const topicLabel = lecture
    ? formatLectureBadgeLabel(lecture)
    : question.topic;

  const typeLabel =
    question.questionType === "true_false" ? "True/False" : "Multiple choice";

  return {
    headline: `Question ${qNum} · ${examLabel}`,
    subtitle: `${typeLabel} · ${topicLabel}`,
  };
}
