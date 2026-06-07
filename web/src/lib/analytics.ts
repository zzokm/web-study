"use client";

import type { LectureMeta } from "@/types/question";
import type { Question } from "@/types/question";
import type {
  AnalyticsEventMap,
  AnalyticsEventName,
  InteractionSource,
  PdfViewerType,
} from "@/lib/analytics-event-schemas";
import {
  examYearFromPathname,
  lectureSlugFromPathname,
  practiceModeFromPathname,
} from "@/lib/analytics-practice";
import { getPageTitle, type PageTitleSearchParams } from "@/lib/analytics-page-titles";
import { absolutePublicUrl } from "@/lib/public-origin";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;
export const GA_DEBUG = process.env.NEXT_PUBLIC_GA_DEBUG === "true";

export function isAnalyticsEnabled(): boolean {
  return Boolean(GA_MEASUREMENT_ID);
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function gtag(...args: unknown[]) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag(...args);
}

function currentPageContext(): { page_path: string; page_title: string } {
  if (typeof window === "undefined") {
    return { page_path: "/", page_title: "Web Study" };
  }
  const page_path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const searchParams: PageTitleSearchParams = {};
  params.forEach((value, key) => {
    searchParams[key] = value;
  });
  return {
    page_path,
    page_title: getPageTitle(page_path, searchParams),
  };
}

export type AnalyticsParams = Record<
  string,
  string | number | boolean | undefined | null
>;

function cleanParams(
  params: AnalyticsParams
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    out[key] = value;
  }
  return out;
}

export function trackAnalyticsEvent<K extends AnalyticsEventName>(
  name: K,
  params: AnalyticsEventMap[K]
): void {
  if (!isAnalyticsEnabled()) return;
  const ctx = currentPageContext();
  gtag("event", name, cleanParams({ ...ctx, ...params }));
}

/** @deprecated Prefer trackAnalyticsEvent for typed events. */
export function trackEvent(name: string, params: AnalyticsParams = {}) {
  if (!isAnalyticsEnabled()) return;
  const ctx = currentPageContext();
  gtag("event", name, cleanParams({ ...ctx, ...params }));
}

let lastTrackedPath = "";

export function trackPageView(options: {
  path: string;
  title: string;
  search?: string;
}) {
  if (!isAnalyticsEnabled()) return;
  const page_path = options.path;
  const page_location =
    typeof window !== "undefined"
      ? absolutePublicUrl(
          `${page_path}${options.search ?? window.location.search}`
        )
      : page_path;
  const page_title = options.title;

  if (typeof document !== "undefined") {
    document.title = page_title;
  }

  const trackKey = `${page_path}${options.search ?? ""}`;
  if (lastTrackedPath === trackKey) return;
  lastTrackedPath = trackKey;

  gtag("event", "page_view", {
    page_title,
    page_location,
    page_path,
  });
}

export function setUserProperties(props: AnalyticsParams) {
  if (!isAnalyticsEnabled()) return;
  gtag("set", "user_properties", cleanParams(props));
}

export function questionAnalyticsParams(question: Question): AnalyticsParams {
  return {
    question_key: question.questionKey,
    question_type: question.questionType,
    topic: question.topic,
    lecture_slug: question.lectureSlug,
    origin: question.origin,
    source_question_id: question.sourceQuestionId,
  };
}

export function practiceContextFromPath(
  pathname: string,
  sessionTitle?: string
): AnalyticsParams {
  return cleanParams({
    practice_mode: practiceModeFromPathname(pathname),
    exam_year: examYearFromPathname(pathname),
    lecture_slug: lectureSlugFromPathname(pathname),
    session_title: sessionTitle,
  });
}

export function pdfContextFromMeta(
  meta: LectureMeta,
  viewerType: PdfViewerType,
  pageNumber: number
): AnalyticsParams {
  return {
    viewer_type: viewerType,
    document_id: meta.lectureId,
    page_number: pageNumber,
    page_count: meta.pageCount,
    topic: meta.topic,
  };
}

export function interactionSource(source: InteractionSource): AnalyticsParams {
  return { interaction_source: source };
}

export function truncateText(text: string, max = 100): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export function getGaInitConfig(): Record<string, unknown> {
  return {
    send_page_view: false,
    ...(GA_DEBUG ? { debug_mode: true } : {}),
  };
}
