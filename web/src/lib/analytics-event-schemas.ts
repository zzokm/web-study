/**
 * Typed GA4 event registry — source of truth for event names and parameters.
 * Docs: web/docs/GA4_EVENTS_GUIDE.md
 */

import type { BrowseContext, PracticeMode } from "@/lib/analytics-events";

export type InteractionSource = "keyboard" | "click";

export type PdfViewerType = "lecture" | "exam";

export type PdfPageSource = "url" | "viewer_scroll";

export type HubType =
  | "practice"
  | "exams"
  | "lectures"
  | "lectures_frontend"
  | "lectures_backend";

export type ResultsSortMode = "order" | "slowest_first";

/** Auto-attached to every custom event via trackAnalyticsEvent. */
export type PageContextParams = {
  page_path?: string;
  page_title?: string;
};

export type QuestionParams = {
  question_key?: string;
  question_type?: string;
  topic?: string;
  lecture_slug?: string;
  origin?: string;
  source_question_id?: string;
};

export type PracticeContextParams = {
  practice_mode?: PracticeMode;
  exam_year?: string;
  lecture_slug?: string;
  session_title?: string;
  question_index?: number;
  interaction_source?: InteractionSource;
};

export type PracticeSetupConfigParams = {
  shuffle_questions?: boolean;
  shuffle_mcq_options?: boolean;
  show_session_timer?: boolean;
  exam_simulation?: boolean;
  written_track?: "frontend" | "backend";
};

export type PracticeSetupStartMode = "start" | "resume" | "fresh";

export type MockExamEventParams = {
  frontend_share?: number;
  mock_exam_seed?: number;
  previous_session_key?: string;
};

export type AnalyticsEventMap = {
  scroll_depth: PageContextParams & {
    scroll_percent: number;
  };
  ui_click: PageContextParams & {
    element_tag: string;
    link_text: string;
    link_url?: string;
    click_zone?: string;
    analytics_id?: string;
  };
  nav_click: PageContextParams & {
    nav_section: string;
    nav_label: string;
    nav_href: string;
  };
  breadcrumb_switch: PageContextParams & {
    switcher_type: "exam" | "lecture";
    from_value: string;
    to_value: string;
  };
  sidebar_toggle: PageContextParams & {
    sidebar_state: "open" | "closed";
  };
  hub_card_click: PageContextParams & {
    hub_type: HubType;
    target_href: string;
    target_label: string;
  };
  outbound_click: PageContextParams & {
    outbound_url: string;
    outbound_label: string;
  };
  analysis_filter_change: PageContextParams & {
    filter_type: string;
    filter_value: string;
  };
  practice_setup_view: PageContextParams &
    PracticeContextParams & {
      question_count: number;
    };
  practice_setup_start: PageContextParams &
    PracticeContextParams &
    PracticeSetupConfigParams &
    MockExamEventParams & {
      question_count: number;
      start_mode: PracticeSetupStartMode;
    };
  practice_start: PageContextParams &
    PracticeContextParams &
    PracticeSetupConfigParams &
    MockExamEventParams & {
      question_count: number;
    };
  mock_exam_generate: PageContextParams &
    PracticeContextParams &
    MockExamEventParams & {
      question_count: number;
    };
  mock_exam_regenerate: PageContextParams &
    PracticeContextParams &
    MockExamEventParams & {
      question_count: number;
    };
  practice_question_view: PageContextParams &
    PracticeContextParams &
    QuestionParams;
  practice_select_answer: PageContextParams &
    PracticeContextParams &
    QuestionParams & {
      selected_option_id: string;
    };
  practice_check_answer: PageContextParams &
    PracticeContextParams &
    QuestionParams & {
      selected_option_id: string;
      correct: boolean;
      thinking_ms?: number;
    };
  practice_next: PageContextParams &
    PracticeContextParams &
    QuestionParams & {
      skipped?: boolean;
    };
  practice_previous: PageContextParams & PracticeContextParams & QuestionParams;
  practice_pause: PageContextParams &
    PracticeContextParams & {
      elapsed_ms: number;
    };
  practice_resume: PageContextParams &
    PracticeContextParams & {
      elapsed_ms: number;
      pause_duration_ms: number;
    };
  practice_finish: PageContextParams &
    PracticeContextParams &
    PracticeSetupConfigParams & {
      question_count: number;
      score_percent: number;
      correct: number;
      incorrect: number;
      skipped: number;
      total_thinking_ms?: number;
      session_wall_ms?: number;
    };
  practice_reset: PageContextParams &
    PracticeContextParams & {
      saved_answers_count: number;
    };
  practice_reset_confirm: PageContextParams &
    PracticeContextParams & {
      saved_answers_count: number;
    };
  question_expand: PageContextParams &
    QuestionParams & {
      browse_context: BrowseContext;
    };
  question_collapse: PageContextParams &
    QuestionParams & {
      browse_context: BrowseContext;
    };
  question_save: PageContextParams & QuestionParams & PracticeContextParams;
  question_unsave: PageContextParams & QuestionParams & PracticeContextParams;
  practice_results_view: PageContextParams & {
    session_title: string;
    score_percent: number;
    correct: number;
    incorrect: number;
    skipped: number;
    question_count: number;
    total_thinking_ms?: number;
    session_wall_ms?: number;
    average_thinking_ms?: number;
    median_thinking_ms?: number;
    review_gap_ms?: number;
  };
  practice_results_filter: PageContextParams & {
    mistakes_only: boolean;
  };
  practice_results_breakdown_sort: PageContextParams & {
    sort_mode: ResultsSortMode;
  };
  practice_results_methodology_toggle: PageContextParams & {
    open: boolean;
  };
  practice_results_timing_view: PageContextParams &
    QuestionParams & {
      thinking_ms: number;
    };
  pdf_page_view: PageContextParams & {
    viewer_type: PdfViewerType;
    document_id: string;
    page_number: number;
    page_count: number;
    topic: string;
    source: PdfPageSource;
  };
  pdf_document_switch: PageContextParams & {
    viewer_type: PdfViewerType;
    from_document_id: string;
    to_document_id: string;
  };
  /** @deprecated Use pdf_page_view — kept for one release of backward compatibility */
  lecture_slide_view: PageContextParams & {
    lecture_id: string;
    slide_page: number;
    page_count: number;
    topic: string;
  };
  issue_report_open: PageContextParams & {
    has_question_key: boolean;
    report_context: string;
  };
  issue_report_submit: PageContextParams & {
    issue_type: string;
    issue_scope: "general" | "specific";
    report_context: string;
    has_question_key: boolean;
  };
  feedback_prompt_open: PageContextParams & {
    practice_title: string;
    score_percent: number;
  };
  feedback_prompt_submit: PageContextParams & {
    practice_title: string;
    score_percent: number;
    overall_rating?: number;
    rated_count: number;
  };
  feedback_prompt_skip: PageContextParams & {
    practice_title: string;
    score_percent: number;
    skip_reason: "countdown" | "skip";
    overall_rated: boolean;
  };
  feedback_prompt_dismiss: PageContextParams & {
    practice_title: string;
    score_percent: number;
    overall_rated: boolean;
  };
  written_ai_review_copy: PageContextParams &
    QuestionParams & {
      answer_language: string;
    };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

export const AnalyticsEventNames = {
  scrollDepth: "scroll_depth",
  uiClick: "ui_click",
  navClick: "nav_click",
  breadcrumbSwitch: "breadcrumb_switch",
  sidebarToggle: "sidebar_toggle",
  hubCardClick: "hub_card_click",
  outboundClick: "outbound_click",
  analysisFilterChange: "analysis_filter_change",
  practiceSetupView: "practice_setup_view",
  practiceSetupStart: "practice_setup_start",
  mockExamGenerate: "mock_exam_generate",
  mockExamRegenerate: "mock_exam_regenerate",
  practiceStart: "practice_start",
  practiceQuestionView: "practice_question_view",
  practiceSelectAnswer: "practice_select_answer",
  practiceCheckAnswer: "practice_check_answer",
  practiceNext: "practice_next",
  practicePrevious: "practice_previous",
  practicePause: "practice_pause",
  practiceResume: "practice_resume",
  practiceFinish: "practice_finish",
  practiceReset: "practice_reset",
  practiceResetConfirm: "practice_reset_confirm",
  questionExpand: "question_expand",
  questionCollapse: "question_collapse",
  questionSave: "question_save",
  questionUnsave: "question_unsave",
  practiceResultsView: "practice_results_view",
  practiceResultsFilter: "practice_results_filter",
  practiceResultsBreakdownSort: "practice_results_breakdown_sort",
  practiceResultsMethodologyToggle: "practice_results_methodology_toggle",
  practiceResultsTimingView: "practice_results_timing_view",
  pdfPageView: "pdf_page_view",
  pdfDocumentSwitch: "pdf_document_switch",
  lectureSlideView: "lecture_slide_view",
  issueReportOpen: "issue_report_open",
  issueReportSubmit: "issue_report_submit",
  feedbackPromptOpen: "feedback_prompt_open",
  feedbackPromptSubmit: "feedback_prompt_submit",
  feedbackPromptSkip: "feedback_prompt_skip",
  feedbackPromptDismiss: "feedback_prompt_dismiss",
  writtenAiReviewCopy: "written_ai_review_copy",
} as const satisfies Record<string, AnalyticsEventName>;
