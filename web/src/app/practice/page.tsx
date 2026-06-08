import type { Metadata } from "next";
import { HubTrackedLink } from "@/components/analytics/hub-tracked-link";
import { metadataTitle } from "@/lib/analytics-page-titles";
import {
  countWrittenQuestions,
  getExamYears,
  getRepetitiveFileQuestions,
  getRepetitiveStats,
} from "@/lib/questions";
import { LectureQuestionLinkList } from "@/components/questions/lecture-question-link-list";
import { ExamYearLinkGrid } from "@/components/questions/exam-year-link-grid";
import { PracticeRepetitiveSetCard } from "@/components/practice/practice-repetitive-set-card";
import { PracticeWrittenHubCard } from "@/components/practice/practice-written-hub-card";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: metadataTitle("/practice/"),
};

export default function PracticeIndexPage() {
  const years = getExamYears();
  const repetitiveCount = getRepetitiveStats();
  const writtenCount = countWrittenQuestions();
  const repetitiveQuestions = getRepetitiveFileQuestions();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
        <p className="text-muted-foreground">
          One question at a time — check your answer, then see the explanation.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Mock exam</h2>
        <HubTrackedLink
          href="/practice/mock-exam/"
          hubType="practice"
          label="Mock exam"
        >
          <Card className="mb-6 border-primary/30 bg-primary/5 transition-colors hover:bg-primary/10">
            <CardHeader>
              <CardTitle className="text-base">Mock exam</CardTitle>
              <CardDescription>
                Generate a new exam from historical lecture mix with custom size
                and frontend/backend allocation.
              </CardDescription>
            </CardHeader>
          </Card>
        </HubTrackedLink>
      </div>

      {writtenCount > 0 ? <PracticeWrittenHubCard count={writtenCount} /> : null}

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">By exam year</h2>
        <ExamYearLinkGrid
          years={years}
          hrefPrefix="/practice/exam/"
          hubType="practice"
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">By lecture</h2>
        <LectureQuestionLinkList
          hrefPrefix="/practice/lecture/"
          hubType="practice"
          compact
        />
      </div>

      <PracticeRepetitiveSetCard
        questions={repetitiveQuestions}
        count={repetitiveCount}
      />
    </div>
  );
}
