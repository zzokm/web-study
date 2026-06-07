"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { trackEvent } from "@/lib/analytics";
import { getQuestionByKey } from "@/lib/questions";
import { computePracticeScore } from "@/lib/practice-progress";
import { loadPracticeResult } from "@/lib/practice-results";
import { computePracticeTimingStats } from "@/lib/practice-timing";
import { PracticeResultsAccordion } from "@/components/practice/practice-results-accordion";
import { PracticeResultsBreakdown } from "@/components/practice/practice-results-breakdown";
import { PracticeResultsSummary } from "@/components/practice/practice-results-summary";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import type { Question } from "@/types/question";

export function PracticeResultsPageClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const [mistakesOnly, setMistakesOnly] = useState(false);

  const stored = useMemo(
    () => (id ? loadPracticeResult(id) : null),
    [id]
  );

  const questions = useMemo(() => {
    if (!stored) return [] as Question[];
    return stored.questionKeys
      .map((key) => getQuestionByKey(key))
      .filter((q): q is Question => q != null);
  }, [stored]);

  const score = useMemo(
    () =>
      stored
        ? computePracticeScore(questions, stored.progress)
        : { percent: 0, correct: 0, incorrect: 0, skipped: 0, total: 0, answered: 0 },
    [stored, questions]
  );

  const timing = useMemo(
    () =>
      stored
        ? computePracticeTimingStats(questions, stored.progress, {
            sessionStartedAt: stored.sessionStartedAt,
            finishedAt: stored.finishedAt,
          })
        : {
            totalThinkingMs: 0,
            averageMs: 0,
            medianMs: 0,
            recordedCount: 0,
            total: 0,
            fastest: null,
            slowest: null,
            byOutcome: {
              correct: { count: 0, averageMs: 0 },
              incorrect: { count: 0, averageMs: 0 },
            },
            byType: {},
            sessionWallMs: null,
            reviewGapMs: null,
          },
    [stored, questions]
  );

  const viewedRef = useRef(false);

  useEffect(() => {
    if (!stored || viewedRef.current) return;
    viewedRef.current = true;
    trackEvent(AnalyticsEvents.practiceResultsView, {
      session_title: stored.title,
      score_percent: score.percent,
      correct: score.correct,
      incorrect: score.incorrect,
      skipped: score.skipped,
      question_count: questions.length,
      total_thinking_ms:
        timing.recordedCount > 0 ? timing.totalThinkingMs : undefined,
      session_wall_ms: timing.sessionWallMs ?? undefined,
    });
  }, [stored, score, questions.length, timing]);

  if (!id || !stored) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Results not found</EmptyTitle>
          <EmptyDescription>
            Finish a practice session to see your score here.
          </EmptyDescription>
        </EmptyHeader>
        <LinkButton href="/practice/">Start practicing</LinkButton>
      </Empty>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Practice results</h1>
        <p className="text-muted-foreground">{stored.title}</p>
        <p className="text-xs text-muted-foreground">
          Finished {new Date(stored.finishedAt).toLocaleString()}
        </p>
      </div>

      <PracticeResultsSummary
        score={score}
        timing={timing}
        progress={stored.progress}
      />

      <PracticeResultsBreakdown
        questions={questions}
        progress={stored.progress}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Review</h2>
        <Button
          type="button"
          variant={mistakesOnly ? "default" : "outline"}
          onClick={() => {
            setMistakesOnly((v) => {
              const next = !v;
              trackEvent(AnalyticsEvents.practiceResultsFilter, {
                mistakes_only: next,
              });
              return next;
            });
          }}
        >
          {mistakesOnly ? "Show all questions" : "Show mistakes only"}
        </Button>
      </div>

      <PracticeResultsAccordion
        questions={questions}
        progress={stored.progress}
        mistakesOnly={mistakesOnly}
      />

      <div className="flex flex-wrap gap-3 pb-8">
        <LinkButton href="/practice/">Practice again</LinkButton>
        <LinkButton href="/" variant="outline">
          Home
        </LinkButton>
      </div>
    </div>
  );
}
