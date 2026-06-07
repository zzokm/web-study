"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { BookChapterMeta } from "@/types/question";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackEvent } from "@/lib/analytics";
import {
  bookChapterAsLectureMeta,
  getBookChaptersForViewer,
} from "@/lib/book-chapters";
import { LectureViewerDynamic as LectureViewer } from "@/components/pdf/lecture-viewer-dynamic";

export function BookChapterPageClient({ chapter }: { chapter: BookChapterMeta }) {
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const initialPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;
  const lastTrackedPage = useRef<number | null>(null);

  const lecture = useMemo(() => bookChapterAsLectureMeta(chapter), [chapter]);
  const chapters = useMemo(() => getBookChaptersForViewer(), []);

  useEffect(() => {
    if (lastTrackedPage.current === initialPage) return;
    lastTrackedPage.current = initialPage;
    trackEvent(AnalyticsEvents.lectureSlideView, {
      lecture_id: chapter.chapterId,
      slide_page: initialPage,
      page_count: chapter.pageCount,
      topic: chapter.topic,
      content_type: "book_chapter",
    });
  }, [chapter.chapterId, chapter.pageCount, chapter.topic, initialPage]);

  return (
    <LectureViewer
      lecture={lecture}
      lectures={chapters}
      initialPage={initialPage}
      routeBase="/book"
      pageLabel="page"
    />
  );
}
