import type { Metadata } from "next";
import { HubTrackedLink } from "@/components/analytics/hub-tracked-link";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getExamMeta, getExamYears } from "@/lib/questions";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: metadataTitle("/exams/"),
};

export default function ExamsPage() {
  const years = getExamYears();
  const examMeta = getExamMeta();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Exam files</h1>
        <p className="text-muted-foreground">
          Original final exam papers from previous years.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {years.map((year) => {
          const exam = examMeta[year];
          if (!exam) return null;
          return (
            <HubTrackedLink
              key={year}
              href={`/exams/${year}/`}
              hubType="exams"
              label={exam.title}
            >
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">{exam.title}</CardTitle>
                  <CardDescription>{exam.pageCount} pages</CardDescription>
                </CardHeader>
              </Card>
            </HubTrackedLink>
          );
        })}
      </div>
    </div>
  );
}
