import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getLectureIdList, getLectureMeta } from "@/lib/questions";
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{meta.topic}</h1>
        <p className="text-muted-foreground">{meta.pageCount} slides</p>
      </div>
      <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
        <LecturePageClient lecture={meta} />
      </Suspense>
    </div>
  );
}
