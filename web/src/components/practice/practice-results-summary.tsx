"use client";

import { useState } from "react";
import { ChevronDownIcon, ClockIcon, InfoIcon } from "lucide-react";
import type { PracticeTimingStats } from "@/lib/practice-timing";
import {
  formatThinkingDuration,
  formatThinkingDurationLong,
  hasTimingData,
} from "@/lib/practice-timing";
import type { PracticeProgress } from "@/lib/practice-progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface PracticeScore {
  total: number;
  correct: number;
  answered: number;
  incorrect: number;
  skipped: number;
  percent: number;
}

interface PracticeResultsSummaryProps {
  score: PracticeScore;
  timing: PracticeTimingStats;
  progress: PracticeProgress;
}

function StatCard({
  label,
  value,
  detail,
  className,
}: {
  label: string;
  value: string;
  detail?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-muted/20 px-3 py-2.5",
        className
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold tracking-tight tabular-nums">{value}</p>
      {detail ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      ) : null}
    </div>
  );
}

function TimingSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: "Multiple choice",
  true_false: "True / false",
  other: "Other",
};

export function PracticeResultsSummary({
  score,
  timing,
  progress,
}: PracticeResultsSummaryProps) {
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const timingAvailable =
    hasTimingData(progress) && timing.recordedCount > 0;

  const hasSessionOverview =
    timingAvailable &&
    timing.sessionWallMs != null &&
    timing.reviewGapMs != null;

  const hasOutcomeBreakdown =
    timingAvailable &&
    (timing.byOutcome.correct.count > 0 ||
      timing.byOutcome.incorrect.count > 0);

  const hasTypeBreakdown =
    timingAvailable && Object.keys(timing.byType).length > 1;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Final score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tracking-tight tabular-nums">
            {score.correct}/{score.total}{" "}
            <span className="text-2xl font-semibold text-muted-foreground">
              ({score.percent}%)
            </span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {score.answered} checked · {score.incorrect} incorrect
            {score.skipped > 0 ? ` · ${score.skipped} not answered` : ""}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timing</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {!timingAvailable ? (
            <p className="text-sm text-muted-foreground">
              Per-question timing is unavailable for this session.
            </p>
          ) : (
            <>
              {hasSessionOverview ? (
                <TimingSection
                  title="Session overview"
                  description="How your total session time breaks down"
                >
                  <div className="grid gap-2 sm:grid-cols-3">
                    <StatCard
                      label="Session wall time"
                      value={formatThinkingDuration(timing.sessionWallMs!)}
                      detail="Start to finish"
                    />
                    <StatCard
                      label="Active thinking"
                      value={formatThinkingDuration(timing.totalThinkingMs)}
                      detail={`${timing.recordedCount} questions`}
                    />
                    <StatCard
                      label="Review & navigation"
                      value={formatThinkingDuration(timing.reviewGapMs!)}
                      detail="Not counted per question"
                    />
                  </div>
                </TimingSection>
              ) : null}

              <TimingSection
                title="Per-question thinking"
                description="Time from question shown until check answer"
              >
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label="Total"
                    value={formatThinkingDuration(timing.totalThinkingMs)}
                  />
                  <StatCard
                    label="Average"
                    value={formatThinkingDuration(timing.averageMs)}
                    detail={`Median ${formatThinkingDuration(timing.medianMs)}`}
                  />
                  <StatCard
                    label="Fastest"
                    value={
                      timing.fastest
                        ? formatThinkingDuration(timing.fastest.ms)
                        : "—"
                    }
                    detail={
                      timing.fastest
                        ? `Question ${timing.fastest.questionIndex}`
                        : undefined
                    }
                  />
                  <StatCard
                    label="Slowest"
                    value={
                      timing.slowest
                        ? formatThinkingDuration(timing.slowest.ms)
                        : "—"
                    }
                    detail={
                      timing.slowest
                        ? `Question ${timing.slowest.questionIndex}`
                        : undefined
                    }
                  />
                </div>
              </TimingSection>

              {hasOutcomeBreakdown ? (
                <TimingSection
                  title="By result"
                  description="Average thinking time on correct vs incorrect answers"
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    {timing.byOutcome.correct.count > 0 ? (
                      <StatCard
                        label="Correct answers"
                        value={formatThinkingDuration(
                          timing.byOutcome.correct.averageMs
                        )}
                        detail={`${timing.byOutcome.correct.count} questions`}
                      />
                    ) : null}
                    {timing.byOutcome.incorrect.count > 0 ? (
                      <StatCard
                        label="Incorrect answers"
                        value={formatThinkingDuration(
                          timing.byOutcome.incorrect.averageMs
                        )}
                        detail={`${timing.byOutcome.incorrect.count} questions`}
                      />
                    ) : null}
                  </div>
                </TimingSection>
              ) : null}

              {hasTypeBreakdown ? (
                <TimingSection
                  title="By question type"
                  description="Average thinking time per format"
                >
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(timing.byType).map(([type, bucket]) =>
                      bucket && bucket.count > 0 ? (
                        <StatCard
                          key={type}
                          label={QUESTION_TYPE_LABELS[type] ?? type}
                          value={formatThinkingDuration(bucket.averageMs)}
                          detail={`${bucket.count} questions`}
                        />
                      ) : null
                    )}
                  </div>
                </TimingSection>
              ) : null}
            </>
          )}

          <Collapsible
            open={methodologyOpen}
            onOpenChange={(open) => {
              setMethodologyOpen(open);
              trackAnalyticsEvent(
                AnalyticsEvents.practiceResultsMethodologyToggle,
                { open }
              );
            }}
          >
            <div className="overflow-hidden rounded-lg border">
              <CollapsibleTrigger
                data-analytics-zone="results"
                data-analytics-id="methodology_toggle"
                data-analytics-skip
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-3 text-left",
                  "cursor-pointer transition-colors hover:bg-muted/30"
                )}
              >
                <div className="flex items-center gap-2">
                  <InfoIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    How timing is measured
                  </span>
                </div>
                <ChevronDownIcon
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    methodologyOpen && "rotate-180"
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="border-t px-4 py-3">
                <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  <li>
                    The timer starts when a question is shown — on the first
                    question when practice loads, or after you click{" "}
                    <strong>Next</strong>.
                  </li>
                  <li>
                    The timer stops when you click <strong>Check answer</strong>.
                  </li>
                  <li>
                    Time spent reading the explanation, reviewing feedback, or
                    navigating between questions afterward is{" "}
                    <strong>not</strong> included in per-question thinking time.
                  </li>
                  <li>
                    If you go back without checking, the partial window is
                    discarded; timing restarts when that question is shown again.
                  </li>
                  {!timingAvailable ? (
                    <li>
                      This session has no timing data (e.g. an older result saved
                      before timing was recorded).
                    </li>
                  ) : null}
                </ul>
                <p className="mt-3 flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 font-mono text-xs text-muted-foreground">
                  <ClockIcon className="size-3.5 shrink-0" />
                  thinking time = check answer time − question shown time
                </p>
                {hasSessionOverview ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Session wall time (
                    {formatThinkingDurationLong(timing.sessionWallMs!)}) minus
                    active thinking (
                    {formatThinkingDurationLong(timing.totalThinkingMs)}) equals
                    review &amp; navigation (
                    {formatThinkingDurationLong(timing.reviewGapMs!)}).
                  </p>
                ) : null}
              </CollapsibleContent>
            </div>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}
