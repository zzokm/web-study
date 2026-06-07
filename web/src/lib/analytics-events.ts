/** GA4 custom event names (keep in sync with web/docs/GA4_SETUP.md). */
export const AnalyticsEvents = {
  pageView: "page_view",
  scrollDepth: "scroll_depth",
  uiClick: "ui_click",
  practiceStart: "practice_start",
  practiceSelectAnswer: "practice_select_answer",
  practiceCheckAnswer: "practice_check_answer",
  practiceNext: "practice_next",
  practicePrevious: "practice_previous",
  practiceFinish: "practice_finish",
  practiceReset: "practice_reset",
  questionExpand: "question_expand",
  questionCollapse: "question_collapse",
  questionSave: "question_save",
  questionUnsave: "question_unsave",
  practiceResultsView: "practice_results_view",
  practiceResultsFilter: "practice_results_filter",
  lectureSlideView: "lecture_slide_view",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export type BrowseContext =
  | "by_lecture"
  | "by_exam"
  | "repetitive"
  | "saved"
  | "practice_results";

export type PracticeMode = "lecture" | "exam" | "repetitive" | "saved";
