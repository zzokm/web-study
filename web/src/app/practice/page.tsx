import type { Metadata } from "next";
import { HubTrackedLink } from "@/components/analytics/hub-tracked-link";
import { metadataTitle } from "@/lib/analytics-page-titles";
import { getExamYears, getRepetitiveStats } from "@/lib/questions";
import { LectureQuestionLinkList } from "@/components/questions/lecture-question-link-list";

export const metadata: Metadata = {
  title: metadataTitle("/practice/"),
};
import { FeedbackPromoCard } from "@/components/layout/feedback-promo-card";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PracticeIndexPage() {
  const years = getExamYears();
  const repetitiveCount = getRepetitiveStats();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
        <p className="text-muted-foreground">
          One question at a time — check your answer, then see the explanation.
        </p>
      </div>

      <FeedbackPromoCard />

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">By exam year</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {years.map((year) => (
            <HubTrackedLink
              key={year}
              href={`/practice/exam/${year}/`}
              hubType="practice"
              label={`${year} Final`}
            >
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">{year} Final</CardTitle>
                  <CardDescription>Full exam flow</CardDescription>
                </CardHeader>
              </Card>
            </HubTrackedLink>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">By lecture</h2>
        <LectureQuestionLinkList
          hrefPrefix="/practice/lecture/"
          hubType="practice"
          compact
        />
      </div>

      <HubTrackedLink
        href="/practice/repetitive/"
        hubType="practice"
        label="Repetitive questions only"
      >
        <Card className="transition-colors hover:bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Repetitive questions only</CardTitle>
            <CardDescription>
              {repetitiveCount > 0
                ? `${repetitiveCount} cross-exam repeated stems`
                : "Repeated stems across finals"}
            </CardDescription>
          </CardHeader>
        </Card>
      </HubTrackedLink>
    </div>
  );
}
