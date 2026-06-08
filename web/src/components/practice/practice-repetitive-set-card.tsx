"use client";

import type { Question } from "@/types/question";
import { HubTrackedLink } from "@/components/analytics/hub-tracked-link";
import { PracticeHubCardHeader } from "@/components/practice/practice-hub-card-header";
import { Card } from "@/components/ui/card";

type PracticeRepetitiveSetCardProps = {
  questions: Question[];
  count: number;
};

export function PracticeRepetitiveSetCard({
  questions,
  count,
}: PracticeRepetitiveSetCardProps) {
  return (
    <HubTrackedLink
      href="/practice/repetitive/"
      hubType="practice"
      label="Practice repetitive set"
    >
      <Card className="transition-colors hover:bg-muted/50">
        <PracticeHubCardHeader
          title="Practice repetitive set"
          description={`${count} cross-exam repeated stem${
            count === 1 ? "" : "s"
          }`}
          questions={questions}
        />
      </Card>
    </HubTrackedLink>
  );
}
