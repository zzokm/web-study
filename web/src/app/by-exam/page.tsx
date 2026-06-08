import type { Metadata } from "next";
import Link from "next/link";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getExamYears } from "@/lib/questions";
import { ExamYearLinkGrid } from "@/components/questions/exam-year-link-grid";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: metadataTitle("/by-exam/"),
};

export default function ByExamPage() {
  const years = getExamYears();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">By exam</h1>
        <p className="text-muted-foreground">Questions in original exam order.</p>
      </div>
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Mock exam</h2>
        <Link href="/practice/mock-exam/?from=by-exam">
          <Card className="mb-6 border-primary/30 bg-primary/5 transition-colors hover:bg-primary/10">
            <CardHeader>
              <CardTitle className="text-base">Mock exam</CardTitle>
              <CardDescription>
                Synthetic exam from historical lecture allocation — customize
                size, frontend/backend mix, and session options.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">By exam year</h2>
        <ExamYearLinkGrid
          years={years}
          hrefPrefix="/by-exam/"
          className="gap-4"
        />
      </div>
    </div>
  );
}
