"use client";

import type { LectureMeta } from "@/types/question";
import { formatLectureBadgeLabel } from "@/lib/lecture-label";
import { LectureViewerFull } from "./lecture-viewer-full";

interface LectureViewerProps {
  lecture: LectureMeta;
  lectures: LectureMeta[];
  initialPage?: number;
  routeBase?: string;
  pageLabel?: string;
}

export function LectureViewer({
  lecture,
  lectures,
  initialPage = 1,
  routeBase = "/lectures",
  pageLabel = "slide",
}: LectureViewerProps) {
  const startPage = Math.max(
    1,
    Math.min(initialPage, Math.max(lecture.pageCount, 1))
  );
  const pageIndex = startPage - 1;

  return (
    <div className="lecture-pdf-viewer flex flex-col gap-3">
      <div
        className="overflow-hidden rounded-lg border bg-card"
        style={{ height: "min(80vh, 900px)" }}
      >
        <LectureViewerFull
          lectures={lectures}
          activeLectureId={lecture.lectureId}
          pageIndex={pageIndex}
          routeBase={routeBase}
        />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {formatLectureBadgeLabel(lecture)} · {pageLabel} {startPage} of{" "}
        {lecture.pageCount} · switch lecture via tabs above · use{" "}
        <code className="text-[0.7rem]">?page=N</code> to deep-link
      </p>
    </div>
  );
}
