"use client";

import { HubTrackedLink } from "@/components/analytics/hub-tracked-link";
import { PracticeHubCardHeader } from "@/components/practice/practice-hub-card-header";
import { getWrittenQuestions } from "@/lib/questions";
import { Card } from "@/components/ui/card";

type PracticeWrittenHubCardProps = {
  count: number;
};

export function PracticeWrittenHubCard({ count }: PracticeWrittenHubCardProps) {
  const questions = getWrittenQuestions();

  return (
    <HubTrackedLink
      href="/practice/written/"
      hubType="practice"
      label="Written questions"
    >
      <Card className="mb-6 transition-colors hover:bg-muted/50">
        <PracticeHubCardHeader
          title="Written questions"
          description={
            count === 1
              ? "1 coding question"
              : `${count} coding questions`
          }
          questions={questions}
          scopeId="written"
        />
      </Card>
    </HubTrackedLink>
  );
}
