import type { Metadata } from "next";
import Link from "next/link";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getLectureMeta } from "@/lib/questions";

export const metadata: Metadata = {
  title: metadataTitle("/lectures/"),
};
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LecturesPage() {
  const lectures = Object.values(getLectureMeta()).sort(
    (a, b) => a.chapterNumber - b.chapterNumber
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lecture slides</h1>
        <p className="text-muted-foreground">
          Full PDF decks — slide numbers match question references.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {lectures.map((lec) => (
          <Link key={lec.lectureId} href={`/lectures/${lec.lectureId}/`}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">{lec.topic}</CardTitle>
                <CardDescription>{lec.pageCount} slides</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
