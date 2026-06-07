"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { LectureMeta } from "@/types/question";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { getLectureMeta } from "@/lib/questions";
import { LectureViewerDynamic as LectureViewer } from "@/components/pdf/lecture-viewer-dynamic";

export function LecturePageClient({ lecture }: { lecture: LectureMeta }) {
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const initialPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const lastTrackedPage = useRef<number | null>(null);

  useEffect(() => {
    if (lastTrackedPage.current === initialPage) return;
    lastTrackedPage.current = initialPage;
    trackAnalyticsEvent(AnalyticsEvents.pdfPageView, {
      viewer_type: "lecture",
      document_id: lecture.lectureId,
      page_number: initialPage,
      page_count: lecture.pageCount,
      topic: lecture.topic,
      source: "url",
    });
  }, [initialPage, lecture.lectureId, lecture.pageCount, lecture.topic]);

  const lectures = useMemo(
    () =>
      Object.values(getLectureMeta())
        .filter((lec) => lec.track === lecture.track)
        .sort((a, b) => a.lectureNumber - b.lectureNumber),
    [lecture.track]
  );

  return (
    <LectureViewer
      lecture={lecture}
      lectures={lectures}
      initialPage={initialPage}
    />
  );
}
