"use client";

import Link from "next/link";
import type { HubType } from "@/lib/analytics-event-schemas";
import { HubTrackedLink } from "@/components/analytics/hub-tracked-link";
import { PracticeHubCardHeader } from "@/components/practice/practice-hub-card-header";
import { getQuestionsByExamYear } from "@/lib/questions";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ExamYearLinkGridProps = {
  years: string[];
  hrefPrefix: "/practice/exam/" | "/by-exam/";
  hubType?: HubType;
  description?: (year: string, count: number) => string;
  className?: string;
  cardClassName?: string;
};

export function ExamYearLinkGrid({
  years,
  hrefPrefix,
  hubType,
  description,
  className,
  cardClassName,
}: ExamYearLinkGridProps) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {years.map((year) => {
        const questions = getQuestionsByExamYear(year);
        const count = questions.length;
        const card = (
          <Card
            className={cn(
              "transition-colors hover:bg-muted/50",
              cardClassName
            )}
          >
            <PracticeHubCardHeader
              title={`${year} Final`}
              description={
                description?.(year, count) ??
                (hrefPrefix.startsWith("/practice")
                  ? "Full exam flow"
                  : `${count} question${count === 1 ? "" : "s"}`)
              }
              questions={questions}
            />
          </Card>
        );

        if (hubType) {
          return (
            <HubTrackedLink
              key={year}
              href={`${hrefPrefix}${year}/`}
              hubType={hubType}
              label={`${year} Final`}
            >
              {card}
            </HubTrackedLink>
          );
        }

        return (
          <Link key={year} href={`${hrefPrefix}${year}/`}>
            {card}
          </Link>
        );
      })}
    </div>
  );
}
