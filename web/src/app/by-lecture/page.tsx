import type { Metadata } from "next";
import Link from "next/link";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getLectureSlugs } from "@/lib/questions";

export const metadata: Metadata = {
  title: metadataTitle("/by-lecture/"),
};
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ByLecturePage() {
  const lectures = getLectureSlugs();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">By lecture</h1>
        <p className="text-muted-foreground">All questions grouped by textbook chapter.</p>
      </div>
      <div className="flex flex-col gap-3">
        {lectures.map((lec) => (
          <Link key={lec.slug} href={`/by-lecture/${lec.slug}/`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">{lec.lecture}</CardTitle>
                <CardDescription>{lec.count} questions</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
