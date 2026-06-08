"use client";

import { Fragment, type ReactNode } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { Question } from "@/types/question";
import type { BrowseContext } from "@/lib/analytics-events";
import { AnalyticsEvents } from "@/lib/analytics-events";
import { questionAnalyticsParams, trackAnalyticsEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { QuestionAccordionDetails } from "./question-accordion-details";
import { QuestionMeta } from "./question-meta";
import { QuestionStem } from "./question-stem";
import { Button } from "@/components/ui/button";
import { SaveButton } from "./save-button";
import { ReportIssueButton } from "@/components/report/report-issue-button";

interface QuestionBrowseAccordionProps {
  questions: Question[];
  browseContext: BrowseContext;
  /** Extra badges or labels above the question stem in each row */
  renderTriggerPrefix?: (question: Question) => ReactNode;
  /** Show save control on expanded content (e.g. saved questions page) */
  showSaveButton?: boolean;
  /** Controlled open items (questionKey values) */
  openValues?: string[];
  onOpenValuesChange?: (values: string[]) => void;
  /** DOM id prefix for scroll targets: `{scrollIdPrefix}-{questionKey}` */
  scrollIdPrefix?: string;
  /** Expand all / collapse all controls above the list */
  showExpandControls?: boolean;
  /** Report control on the answer card instead of above the details */
  reportButtonInAnswer?: boolean;
  /** Override Q badge number per row */
  getDisplayNumber?: (question: Question, index: number) => string;
  /** Render content after a row (e.g. disclaimer after Q81) */
  renderAfterItem?: (question: Question) => ReactNode;
}

export function QuestionBrowseAccordion({
  questions,
  browseContext,
  renderTriggerPrefix,
  showSaveButton = false,
  openValues,
  onOpenValuesChange,
  scrollIdPrefix,
  showExpandControls = true,
  reportButtonInAnswer = true,
  getDisplayNumber,
  renderAfterItem,
}: QuestionBrowseAccordionProps) {
  const [internalOpenValues, setInternalOpenValues] = useState<string[]>([]);
  const controlled =
    openValues !== undefined && onOpenValuesChange !== undefined;
  const resolvedOpenValues = controlled ? openValues : internalOpenValues;
  const setResolvedOpenValues = controlled ? onOpenValuesChange! : setInternalOpenValues;
  const prevOpenRef = useRef<string[]>(resolvedOpenValues ?? []);
  const allQuestionKeys = useMemo(
    () => questions.map((q) => q.questionKey),
    [questions]
  );
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
            trackAnalyticsEvent(AnalyticsEvents.questionExpand, {
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
            trackAnalyticsEvent(AnalyticsEvents.questionCollapse, {
              ...questionAnalyticsParams(q),
              browse_context: browseContext,
            });
          }
        }
      }

      prevOpenRef.current = next;
      setResolvedOpenValues(next);
    },
    [browseContext, questionsByKey, setResolvedOpenValues]
  );

  const allExpanded =
    allQuestionKeys.length > 0 &&
    allQuestionKeys.every((key) => resolvedOpenValues.includes(key));

  function handleExpandAll() {
    handleOpenChange(allQuestionKeys);
  }

  function handleCollapseAll() {
    handleOpenChange([]);
  }

  const itemClassName =
    "rounded-xl border bg-card shadow-sm overflow-hidden not-last:border-b-0";
  const triggerClassName =
    "px-4 py-4 w-full cursor-pointer hover:bg-muted/40 hover:no-underline";
  const contentClassName = "border-t bg-muted/20 pb-0";

  return (
    <div className="flex w-full flex-col gap-3">
      {showExpandControls ? (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExpandAll}
            disabled={allExpanded}
          >
            Expand all
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCollapseAll}
            disabled={resolvedOpenValues.length === 0}
          >
            Collapse all
          </Button>
        </div>
      ) : null}
      <Accordion
        multiple
        className="flex w-full flex-col gap-3"
        value={resolvedOpenValues}
        onValueChange={handleOpenChange}
      >
      {questions.map((q, index) => (
        <Fragment key={q.questionKey}>
          <AccordionItem
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
                  {renderTriggerPrefix?.(q)}
                  <QuestionMeta
                    question={q}
                    displayNumber={getDisplayNumber?.(q, index)}
                  />
                  <QuestionStem
                    question={q}
                    variant={
                      browseContext === "written" ? "browse-full" : "browse"
                    }
                  />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className={contentClassName}>
              <div className="flex flex-col gap-4 p-4">
                {!reportButtonInAnswer || showSaveButton ? (
                  <div className="flex justify-end gap-2">
                    {!reportButtonInAnswer ? (
                      <ReportIssueButton question={q} />
                    ) : null}
                    {showSaveButton ? <SaveButton question={q} /> : null}
                  </div>
                ) : null}
                <QuestionAccordionDetails
                  question={q}
                  showStem={false}
                  showExamAppearances={false}
                  variant="browse"
                  showReportButton={reportButtonInAnswer}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
          {renderAfterItem?.(q)}
        </Fragment>
      ))}
      </Accordion>
    </div>
  );
}
