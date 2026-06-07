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
} as const;

export const ISSUE_TYPES = [
  "Wrong Answer Key/Incorrect Data",
  "Confusing/Incorrect Explanation",
  "Typo/Grammar Error",
  "Broken PDF/External Link",
  "Practice Mode Bug (Scoring/Skipping)",
  "User Interface (UI) or Layout Issue",
  "Other Technical Bug or Feedback",
] as const;

export type IssueType = (typeof ISSUE_TYPES)[number];

export const ISSUE_TYPE_WRONG_ANSWER: IssueType = ISSUE_TYPES[0];

export const BUG_ISSUE_TYPES: ReadonlySet<IssueType> = new Set([
  "Practice Mode Bug (Scoring/Skipping)",
  "User Interface (UI) or Layout Issue",
  "Other Technical Bug or Feedback",
]);

export type IssueScope = "general" | "specific";

export type ReportLocationId =
  | "this_page"
  | "home"
  | "practice"
  | "analysis"
  | "exams"
  | "lectures_fe"
  | "lectures_be"
  | "repetitive"
  | "saved"
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
];

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
  deviceInfo: string;
  timestamp: string;
};

export type OpenReportIssueOptions = {
  question?: Question;
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
    if (segments[1] === "repetitive") return "practice_repetitive";
    if (segments[1] === "saved") return "practice_saved";
    if (segments[1] === "results") return "practice_results";
    return "practice_hub";
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
  if (segments[0] === "lectures" && segments[2]) {
    return { issueScope: "specific", lectureSlug: segments[2] };
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
  entryId: string,
  value: string | undefined
) {
  if (value?.trim()) {
    params.set(`entry.${entryId}`, value.trim());
  }
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

  const hub = REPORT_HUB_LOCATIONS.find((h) => h.id === locationId);
  if (hub) {
    return { pageUrl: hub.pageUrl, issueScope: "general" };
  }

  return { pageUrl: currentPageUrl, issueScope: "general" };
}

export function formatReportQuestionSummary(question: Question): {
  headline: string;
  subtitle: string;
} {
  const qNum = examQuestionNumberFromId(question.sourceQuestionId);
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
