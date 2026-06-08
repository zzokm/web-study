"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { Question } from "@/types/question";
import { usePracticeSessionStatus } from "@/hooks/use-practice-session-status";
import {
  derivePracticeHubProgressDisplay,
  practiceHubProgressAriaLabel,
} from "@/lib/practice-hub-progress";
import { CircularProgress } from "@/components/practice/circular-progress";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PracticeHubCardHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  questions: Question[];
  compact?: boolean;
  titleClassName?: string;
};

export function PracticeHubCardHeader({
  title,
  description,
  questions,
  compact = false,
  titleClassName,
}: PracticeHubCardHeaderProps) {
  const sessionStatus = usePracticeSessionStatus(questions);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const progress = derivePracticeHubProgressDisplay(
    sessionStatus,
    questions.length,
    hydrated
  );
  const ariaLabel = practiceHubProgressAriaLabel(progress);

  return (
    <CardHeader
      className={cn(
        "flex flex-row items-start justify-between gap-3 space-y-0",
        compact && "py-4"
      )}
    >
      <div className="min-w-0 flex-1 pr-1">
        <CardTitle
          className={cn(
            compact ? "text-sm font-medium" : "text-base",
            titleClassName
          )}
        >
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </div>
      <CircularProgress
        value={progress.percent}
        size={40}
        strokeWidth={4}
        centerLabel={progress.centerLabel}
        label={ariaLabel}
        title={ariaLabel}
        className="shrink-0"
      />
    </CardHeader>
  );
}
