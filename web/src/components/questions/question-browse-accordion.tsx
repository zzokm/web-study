"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useRef } from "react";
import type { Question } from "@/types/question";
import type { BrowseContext } from "@/lib/analytics-events";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { questionAnalyticsParams, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { QuestionAccordionDetails } from "./question-accordion-details";
import { Badge } from "@/components/ui/badge";
import { QuestionMeta } from "./question-meta";
import { QuestionStem } from "./question-stem";
import { SaveButton } from "./save-button";

interface QuestionBrowseAccordionProps {
  questions: Question[];
  browseContext: BrowseContext;
  /** Extra badges or labels above the question stem in each row */
  renderTriggerPrefix?: (question: Question) => ReactNode;
  /** Show save control on expanded content (e.g. saved questions page) */
  showSaveButton?: boolean;
  /** Show exam question id badge (by-exam pages) */
  showQuestionIdBadge?: boolean;
  /** Controlled open items (questionKey values) */
  openValues?: string[];
  onOpenValuesChange?: (values: string[]) => void;
  /** DOM id prefix for scroll targets: `{scrollIdPrefix}-{questionKey}` */
  scrollIdPrefix?: string;
}

export function QuestionBrowseAccordion({
  questions,
  browseContext,
  renderTriggerPrefix,
  showSaveButton = false,
  showQuestionIdBadge = false,
  openValues,
  onOpenValuesChange,
  scrollIdPrefix,
}: QuestionBrowseAccordionProps) {
  const controlled =
    openValues !== undefined && onOpenValuesChange !== undefined;
  const prevOpenRef = useRef<string[]>(openValues ?? []);
  const questionsByKey = useMemo(
    () => new Map(questions.map((q) => [q.questionKey, q])),
    [questions]
  );

  const handleOpenChange = useCallback(
    (value: string | string[]) => {
      const next = Array.isArray(value) ? value : [];
      const prev = prevOpenRef.current;

      for (const key of next) {
        if (!prev.includes(key)) {
          const q = questionsByKey.get(key);
          if (q) {
            trackEvent(AnalyticsEvents.questionExpand, {
              ...questionAnalyticsParams(q),
              browse_context: browseContext,
            });
          }
        }
      }
      for (const key of prev) {
        if (!next.includes(key)) {
          const q = questionsByKey.get(key);
          if (q) {
            trackEvent(AnalyticsEvents.questionCollapse, {
              ...questionAnalyticsParams(q),
              browse_context: browseContext,
            });
          }
        }
      }

      prevOpenRef.current = next;
      if (controlled) onOpenValuesChange(next);
    },
    [browseContext, controlled, onOpenValuesChange, questionsByKey]
  );

  const itemClassName =
    "rounded-xl border bg-card shadow-sm overflow-hidden not-last:border-b-0";
  const triggerClassName =
    "px-4 py-4 w-full cursor-pointer hover:bg-muted/40 hover:no-underline";
  const contentClassName = "border-t bg-muted/20";

  return (
    <Accordion
      multiple
      className="flex w-full flex-col gap-3"
      {...(controlled
        ? { value: openValues, onValueChange: handleOpenChange }
        : { onValueChange: handleOpenChange })}
    >
      {questions.map((q) => (
        <AccordionItem
          key={q.questionKey}
          value={q.questionKey}
          id={
            scrollIdPrefix
              ? `${scrollIdPrefix}-${q.questionKey}`
              : undefined
          }
          className={cn(
            itemClassName,
            scrollIdPrefix ? "scroll-mt-24" : undefined
          )}
        >
          <AccordionTrigger className={triggerClassName}>
            <div className="min-w-0 flex-1 text-left">
              <div className="flex flex-col gap-2">
                {showQuestionIdBadge ? (
                  <Badge variant="outline" className="w-fit">
                    {q.id}
                  </Badge>
                ) : null}
                {renderTriggerPrefix?.(q)}
                <QuestionMeta question={q} />
                <QuestionStem question={q} variant="browse" />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className={contentClassName}>
            <div className="flex flex-col gap-4 p-4">
              {showSaveButton ? (
                <div className="flex justify-end">
                  <SaveButton question={q} />
                </div>
              ) : null}
              <QuestionAccordionDetails
                question={q}
                showStem={
                  browseContext !== "by_lecture" && browseContext !== "by_exam"
                }
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
