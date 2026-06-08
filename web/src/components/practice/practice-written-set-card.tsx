"use client";

import type { Question } from "@/types/question";
import { HubTrackedLink } from "@/components/analytics/hub-tracked-link";
import { PracticeHubCardHeader } from "@/components/practice/practice-hub-card-header";
import { Card } from "@/components/ui/card";

type PracticeWrittenSetCardProps = {
  questions: Question[];
  count: number;
};

export function PracticeWrittenSetCard({
  questions,
  count,
}: PracticeWrittenSetCardProps) {
  return (
    <HubTrackedLink
      href="/practice/written/"
      hubType="practice"
      label="Practice written set"
    >
      <Card className="transition-colors hover:bg-muted/50">
        <PracticeHubCardHeader
          title="Practice written set"
          description={
            count === 1
              ? "1 coding question"
              : `${count} coding questions`
          }
          questions={questions}
        />
      </Card>
    </HubTrackedLink>
  );
}
