import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getBookChapterIdList, getBookChapterMeta } from "@/lib/book-chapters";
import { Skeleton } from "@/components/ui/skeleton";
import { BookChapterPageClient } from "./book-chapter-page-client";

export function generateStaticParams() {
  return getBookChapterIdList().map((chapterId) => ({ chapterId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}): Promise<Metadata> {
  const { chapterId } = await params;
  return { title: metadataTitle(`/book/${chapterId}/`) };
}

export default async function BookChapterDetailPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  const meta = getBookChapterMeta()[chapterId];
  if (!meta) notFound();

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-1 sm:px-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{meta.topic}</h1>
        <p className="text-muted-foreground">
          {meta.pageCount} pages · textbook pp. {meta.bookPageRange[0]}–
          {meta.bookPageRange[1]} · answer sheet at end (book p. 577)
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
        <BookChapterPageClient chapter={meta} />
      </Suspense>
    </div>
  );
}
