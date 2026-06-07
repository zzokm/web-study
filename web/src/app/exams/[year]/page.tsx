import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { examAsLectureMeta, getExamMeta, getExamYears } from "@/lib/questions";
import { Skeleton } from "@/components/ui/skeleton";
import { ExamPageClient } from "./exam-page-client";

export function generateStaticParams() {
  return getExamYears().map((year) => ({ year }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  return { title: metadataTitle(`/exams/${year}/`) };
}

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const exam = getExamMeta()[year];
  if (!exam) notFound();

  const lecture = examAsLectureMeta(exam);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-1 sm:px-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{exam.title}</h1>
        <p className="text-muted-foreground">{exam.pageCount} pages</p>
      </div>
      <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
        <ExamPageClient exam={lecture} />
      </Suspense>
    </div>
  );
}
