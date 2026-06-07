"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { LectureMeta } from "@/types/question";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { getExamMeta, examAsLectureMeta } from "@/lib/questions";
import { LectureViewerDynamic as LectureViewer } from "@/components/pdf/lecture-viewer-dynamic";

export function ExamPageClient({ exam }: { exam: LectureMeta }) {
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const initialPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const lastTrackedPage = useRef<number | null>(null);

  useEffect(() => {
    if (lastTrackedPage.current === initialPage) return;
    lastTrackedPage.current = initialPage;
    trackAnalyticsEvent(AnalyticsEvents.pdfPageView, {
      viewer_type: "exam",
      document_id: exam.lectureId,
      page_number: initialPage,
      page_count: exam.pageCount,
      topic: exam.topic,
      source: "url",
    });
  }, [initialPage, exam.lectureId, exam.pageCount, exam.topic]);

  const exams = useMemo(
    () =>
      Object.values(getExamMeta())
        .map(examAsLectureMeta)
        .sort((a, b) => a.chapterNumber - b.chapterNumber),
    []
  );

  return (
    <LectureViewer
      lecture={exam}
      lectures={exams}
      initialPage={initialPage}
      routeBase="/exams"
      pageLabel="page"
    />
  );
}
