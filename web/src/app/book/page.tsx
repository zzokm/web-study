import type { Metadata } from "next";
import Link from "next/link";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getBookChapterIdList, getBookChapterMeta, getBookTitle } from "@/lib/book-chapters";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: metadataTitle("/book/"),
};

export default function BookChaptersPage() {
  const chapters = getBookChapterIdList().map((id) => getBookChapterMeta()[id]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Textbook chapters</h1>
        <p className="text-muted-foreground">
          {getBookTitle()} — selected chapters with answer sheet at the end of
          each PDF (not the full book).
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {chapters.map((ch) => (
          <Link key={ch.chapterId} href={`/book/${ch.chapterId}/`}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">{ch.topic}</CardTitle>
                <CardDescription>
                  {ch.pageCount} pages · book pp. {ch.bookPageRange[0]}–
                  {ch.bookPageRange[1]}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
