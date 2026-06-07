"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { LectureMeta } from "@/types/question";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackEvent } from "@/lib/analytics";
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
    trackEvent(AnalyticsEvents.lectureSlideView, {
      lecture_id: lecture.lectureId,
      slide_page: initialPage,
      page_count: lecture.pageCount,
      topic: lecture.topic,
    });
  }, [initialPage, lecture.lectureId, lecture.pageCount, lecture.topic]);

  const lectures = useMemo(
    () =>
      Object.values(getLectureMeta()).sort(
        (a, b) => a.chapterNumber - b.chapterNumber
      ),
    []
  );

  return (
    <LectureViewer
      lecture={lecture}
      lectures={lectures}
      initialPage={initialPage}
    />
  );
}
