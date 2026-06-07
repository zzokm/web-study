import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { formatLectureHeading, formatLectureTag } from "@/lib/lecture-label";
import { getLectureIdList, getLectureMeta } from "@/lib/questions";
import { LectureInfoDialog } from "@/components/lectures/lecture-info-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { LecturePageClient } from "./lecture-page-client";

export function generateStaticParams() {
  return getLectureIdList().map((lectureId) => ({ lectureId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lectureId: string }>;
}): Promise<Metadata> {
  const { lectureId } = await params;
  return { title: metadataTitle(`/lectures/${lectureId}/`) };
}

export default async function LectureDetailPage({
  params,
}: {
  params: Promise<{ lectureId: string }>;
}) {
  const { lectureId } = await params;
  const meta = getLectureMeta()[lectureId];
  if (!meta) notFound();

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-1 sm:px-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {formatLectureHeading(meta)}
          </h1>
          <p className="text-muted-foreground">
            {formatLectureTag(meta)} ·{" "}
            {meta.track === "frontend" ? "Frontend" : "Backend"} ·{" "}
            {meta.pageCount} slides
          </p>
        </div>
        <LectureInfoDialog lecture={meta} />
      </div>
      <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
        <LecturePageClient lecture={meta} />
      </Suspense>
    </div>
  );
}
