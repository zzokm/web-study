"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { LectureMeta } from "@/types/question";

const LectureViewerInner = dynamic(
  () => import("./lecture-viewer").then((m) => m.LectureViewer),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[min(80vh,900px)] w-full" />,
  }
);

export function LectureViewerDynamic(props: {
  lecture: LectureMeta;
  lectures: LectureMeta[];
  initialPage?: number;
  routeBase?: string;
  pageLabel?: string;
}) {
  return <LectureViewerInner {...props} />;
}
