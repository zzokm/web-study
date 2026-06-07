"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Question } from "@/types/question";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { questionAnalyticsParams, trackAnalyticsEvent } from "@/lib/analytics";
import {
  getAttempt,
  getQuestionThinkingMs,
  isAttemptCorrect,
  isAttemptWrong,
  type PracticeProgress,
} from "@/lib/practice-progress";
import {
  formatThinkingDuration,
  formatThinkingDurationLong,
} from "@/lib/practice-timing";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuestionAccordionDetails } from "@/components/questions/question-accordion-details";
import { QuestionMeta } from "@/components/questions/question-meta";
import { QuestionStem } from "@/components/questions/question-stem";
import { cn } from "@/lib/utils";
import {
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  MinusCircleIcon,
} from "lucide-react";

interface PracticeResultsAccordionProps {
  questions: Question[];
  progress: PracticeProgress;
  mistakesOnly: boolean;
}

function statusFor(question: Question, progress: PracticeProgress) {
  const attempt = getAttempt(progress, question.questionKey);
  if (!attempt.revealed || !attempt.selectedId) {
    return "skipped" as const;
  }
  if (isAttemptCorrect(question, attempt)) return "correct" as const;
  return "wrong" as const;
}

export function PracticeResultsAccordion({
  questions,
  progress,
  mistakesOnly,
}: PracticeResultsAccordionProps) {
  const visible = mistakesOnly
    ? questions.filter((q) => isAttemptWrong(q, getAttempt(progress, q.questionKey)))
    : questions;

  const [openValues, setOpenValues] = useState<string[]>([]);
  const prevOpenRef = useRef<string[]>([]);
  const visibleKeys = useMemo(
    () => visible.map((q) => q.questionKey),
    [visible]
  );
  const questionsByKey = useMemo(
    () => new Map(visible.map((q) => [q.questionKey, q])),
    [visible]
  );

  const handleOpenChange = useCallback((value: string | string[]) => {
    const next = Array.isArray(value) ? value : [];
    const prev = prevOpenRef.current;
    for (const key of next) {
      if (!prev.includes(key)) {
        const q = questionsByKey.get(key);
        if (q) {
          trackAnalyticsEvent(AnalyticsEvents.questionExpand, {
            ...questionAnalyticsParams(q),
            browse_context: "practice_results",
          });
          const attempt = getAttempt(progress, q.questionKey);
          const thinkingMs = getQuestionThinkingMs(attempt);
          if (thinkingMs != null) {
            trackAnalyticsEvent(AnalyticsEvents.practiceResultsTimingView, {
              ...questionAnalyticsParams(q),
              thinking_ms: thinkingMs,
            });
          }
        }
      }
    }
    for (const key of prev) {
      if (!next.includes(key)) {
        const q = questionsByKey.get(key);
        if (q) {
          trackAnalyticsEvent(AnalyticsEvents.questionCollapse, {
            ...questionAnalyticsParams(q),
            browse_context: "practice_results",
          });
        }
      }
    }
    prevOpenRef.current = next;
    setOpenValues(next);
  }, [questionsByKey, progress]);

  const allExpanded =
    visibleKeys.length > 0 && visibleKeys.every((key) => openValues.includes(key));

  useEffect(() => {
    setOpenValues((prev) => {
      const next = prev.filter((key) => visibleKeys.includes(key));
      prevOpenRef.current = next;
      return next;
    });
  }, [visibleKeys]);

  if (visible.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {mistakesOnly
          ? "No incorrect answers — great job!"
          : "No questions in this result."}
      </p>
    );
  }

  const itemClassName =
    "rounded-xl border bg-card shadow-sm overflow-hidden not-last:border-b-0";
  const triggerClassName =
    "px-4 py-4 w-full cursor-pointer hover:bg-muted/40 hover:no-underline";
  const contentClassName = "border-t bg-muted/20 pb-0";

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleOpenChange(visibleKeys)}
          disabled={allExpanded}
        >
          Expand all
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleOpenChange([])}
          disabled={openValues.length === 0}
        >
          Collapse all
        </Button>
      </div>
      <Accordion
        multiple
        className="flex w-full flex-col gap-3"
        value={openValues}
        onValueChange={handleOpenChange}
      >
      {visible.map((q) => {
        const attempt = getAttempt(progress, q.questionKey);
        const status = statusFor(q, progress);
        const selectedLabel =
          q.options.find((o) => o.id === attempt.selectedId)?.content ??
          attempt.selectedId ??
          "—";
        const thinkingMs = getQuestionThinkingMs(attempt);

        return (
          <AccordionItem key={q.questionKey} value={q.questionKey} className={itemClassName}>
            <AccordionTrigger className={triggerClassName}>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {status === "correct" ? (
                      <Badge className="gap-1 border-green-600/30 bg-green-500/15 text-green-800 dark:text-green-300">
                        <CircleCheckIcon className="size-3.5" />
                        Correct
                      </Badge>
                    ) : status === "wrong" ? (
                      <Badge
                        variant="destructive"
                        className="gap-1 bg-red-500/15 text-red-800 dark:text-red-300"
                      >
                        <CircleXIcon className="size-3.5" />
                        Incorrect
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <MinusCircleIcon className="size-3.5" />
                        Not answered
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Your answer:{" "}
                      <span
                        className={cn(
                          "font-medium",
                          status === "correct" && "text-green-700 dark:text-green-400",
                          status === "wrong" && "text-red-700 dark:text-red-400"
                        )}
                      >
                        {selectedLabel}
                      </span>
                    </span>
                    {thinkingMs != null ? (
                      <Badge variant="outline" className="gap-1 font-mono tabular-nums">
                        <ClockIcon className="size-3" />
                        {formatThinkingDuration(thinkingMs)}
                      </Badge>
                    ) : null}
                  </div>
                  <QuestionMeta question={q} />
                  <QuestionStem question={q} variant="browse" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className={contentClassName}>
              <div className="flex flex-col gap-4 p-4">
                {thinkingMs != null ? (
                  <p className="text-sm text-muted-foreground">
                    Thinking time:{" "}
                    <span className="font-medium text-foreground">
                      {formatThinkingDurationLong(thinkingMs)}
                    </span>
                  </p>
                ) : null}
                <QuestionAccordionDetails
                  question={q}
                  showStem={false}
                  showExamAppearances={false}
                  variant="browse"
                  showReportButton
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
      </Accordion>
    </div>
  );
}
