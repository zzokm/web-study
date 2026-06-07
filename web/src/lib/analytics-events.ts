import { AnalyticsEventNames } from "@/lib/analytics-event-schemas";

/** GA4 custom event names — re-exported from analytics-event-schemas. */
export const AnalyticsEvents = {
  pageView: "page_view",
  ...AnalyticsEventNames,
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
