import type { Metadata } from "next";
import Link from "next/link";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getExamYears, getLectureSlugs } from "@/lib/questions";

export const metadata: Metadata = {
  title: metadataTitle("/practice/"),
};
import { FeedbackPromoCard } from "@/components/layout/feedback-promo-card";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PracticeIndexPage() {
  const years = getExamYears();
  const lectures = getLectureSlugs();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
        <p className="text-muted-foreground">
          One question at a time — check your answer, then see explanation, reference, and
          slides.
        </p>
      </div>

      <FeedbackPromoCard />

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">By exam year</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {years.map((year) => (
            <Link key={year} href={`/practice/exam/${year}/`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">{year} Final</CardTitle>
                  <CardDescription>Full exam flow</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">By lecture</h2>
        <div className="flex flex-col gap-2">
          {lectures.map((lec) => (
            <Link key={lec.slug} href={`/practice/lecture/${lec.slug}/`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="py-4">
                  <CardTitle className="text-sm font-medium">{lec.lecture}</CardTitle>
                  <CardDescription>{lec.count} questions</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Link href="/practice/repetitive/">
        <Card className="transition-colors hover:bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Repetitive questions only</CardTitle>
            <CardDescription>25 high-yield repeated stems</CardDescription>
          </CardHeader>
        </Card>
      </Link>
    </div>
  );
}
