"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  CircleXIcon,
} from "lucide-react";

/** Control strip height (excludes safe-area inset below). */
export const PRACTICE_FOOTER_BAR_HEIGHT = "4rem";

/** Total fixed footer footprint for main content padding. */
export const PRACTICE_FOOTER_HEIGHT =
  "calc(4rem + max(0.5rem, env(safe-area-inset-bottom)))";

const FOOTER_CONTROL_H = "h-9";

/** Shared practice footer control sizing. */
export const PRACTICE_FOOTER_BTN_CLASS = cn(
  FOOTER_CONTROL_H,
  "min-w-0 max-w-full shrink-0 gap-1.5 px-3 text-sm font-semibold sm:gap-2 sm:px-4"
);

interface PracticeSessionFooterProps {
  index: number;
  total: number;
  revealed: boolean;
  correct: boolean;
  selectedId: string | null;
  isWritten?: boolean;
  canCheck?: boolean;
  hasAnswered?: boolean;
  checking?: boolean;
  paused?: boolean;
  mode?: "standard" | "exam";
  allAnswered?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSkip?: () => void;
  onCheck: () => void;
  onFinish?: () => void;
  onSubmitExam?: () => void;
}

export function PracticeSessionFooter({
  index,
  total,
  revealed,
  correct,
  selectedId,
  isWritten = false,
  canCheck = Boolean(selectedId),
  hasAnswered = Boolean(selectedId),
  checking = false,
  paused = false,
  mode = "standard",
  allAnswered = false,
  onPrevious,
  onNext,
  onSkip,
  onCheck,
  onFinish,
  onSubmitExam,
}: PracticeSessionFooterProps) {
  const isFirst = index === 0;
  const isLast = index >= total - 1;
  const examMode = mode === "exam";

  return (
    <footer
      data-analytics-zone="practice_footer"
      data-analytics-skip
      className={cn(
        "fixed bottom-0 z-50 bg-background/95 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.12)] backdrop-blur supports-[backdrop-filter]:bg-background/85",
        "left-0 right-0 max-w-[100vw] overflow-hidden transition-[left] duration-200 ease-linear md:left-[var(--sidebar-inset-left)]",
        paused && "pointer-events-none opacity-50"
      )}
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
      aria-label="Practice controls"
    >
      <div
        className="flex w-full items-center border-t bg-background/95"
        style={{ height: PRACTICE_FOOTER_BAR_HEIGHT }}
      >
        <div
          className={cn(
            "mx-auto flex h-full w-full max-w-3xl items-stretch gap-2",
            "px-3 sm:gap-3 sm:px-4 md:px-6",
            "pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]"
          )}
        >
          <div className="flex min-w-0 flex-1 items-center justify-start">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onPrevious}
              disabled={isFirst}
              className={PRACTICE_FOOTER_BTN_CLASS}
              aria-label="Previous question"
            >
              <ChevronLeftIcon className="size-4 shrink-0" />
              <span className="hidden min-[380px]:inline">Prev</span>
            </Button>
          </div>

          <div className="flex min-w-0 flex-[1.35] items-center justify-center">
            {examMode ? (
              isLast ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={onSubmitExam}
                  disabled={!allAnswered}
                  className={cn(PRACTICE_FOOTER_BTN_CLASS, "w-full")}
                  title={
                    allAnswered
                      ? undefined
                      : "Answer all questions to submit the exam"
                  }
                >
                  <span className="truncate">Submit exam</span>
                </Button>
              ) : (
                <span className="px-2 text-center text-xs text-muted-foreground sm:text-sm">
                  {hasAnswered
                    ? "Next to continue"
                    : isWritten
                      ? "Write your answer"
                      : "Select an answer"}
                </span>
              )
            ) : !revealed ? (
              <Button
                type="button"
                size="lg"
                onClick={onCheck}
                disabled={!canCheck || checking}
                className={cn(PRACTICE_FOOTER_BTN_CLASS, "w-full")}
              >
                <span className="truncate sm:hidden">
                  {checking ? "Checking…" : "Check"}
                </span>
                <span className="hidden truncate sm:inline">
                  {checking ? "Checking…" : "Check answer"}
                </span>
              </Button>
            ) : (
              <span
                className={cn(
                  PRACTICE_FOOTER_BTN_CLASS,
                  "inline-flex w-full items-center justify-center rounded-lg border bg-muted/30",
                  correct
                    ? "border-green-600/30 text-green-700 dark:text-green-400"
                    : "border-red-600/30 text-red-700 dark:text-red-400"
                )}
              >
                {correct ? (
                  <CircleCheckIcon className="size-4 shrink-0" />
                ) : (
                  <CircleXIcon className="size-4 shrink-0" />
                )}
                <span className="truncate">
                  {correct ? "Correct" : "Incorrect"}
                </span>
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end">
            {examMode ? (
              !isLast ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={onNext}
                  disabled={!hasAnswered}
                  className={PRACTICE_FOOTER_BTN_CLASS}
                  aria-label="Next question"
                >
                  <span className="hidden min-[380px]:inline">Next</span>
                  <ChevronRightIcon className="size-4 shrink-0" />
                </Button>
              ) : null
            ) : isLast && !revealed && isWritten && onFinish ? (
              <Button
                type="button"
                size="lg"
                onClick={onFinish}
                className={PRACTICE_FOOTER_BTN_CLASS}
                aria-label="Finish and view results"
              >
                <span className="truncate sm:hidden">Finish</span>
                <span className="hidden truncate sm:inline">
                  Finish &amp; results
                </span>
              </Button>
            ) : isWritten && !revealed && onSkip ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onSkip}
                className={PRACTICE_FOOTER_BTN_CLASS}
                aria-label="Skip question"
              >
                <span className="hidden min-[380px]:inline">Skip</span>
                <ChevronRightIcon className="size-4 shrink-0" />
              </Button>
            ) : isLast && revealed ? (
              <Button
                type="button"
                size="lg"
                onClick={onFinish}
                className={PRACTICE_FOOTER_BTN_CLASS}
                aria-label="Finish and view results"
              >
                <span className="truncate sm:hidden">Finish</span>
                <span className="hidden truncate sm:inline">
                  Finish &amp; results
                </span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onNext}
                disabled={!revealed}
                className={PRACTICE_FOOTER_BTN_CLASS}
                aria-label="Next question"
              >
                <span className="hidden min-[380px]:inline">Next</span>
                <ChevronRightIcon className="size-4 shrink-0" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
