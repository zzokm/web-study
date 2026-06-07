"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  CircleXIcon,
} from "lucide-react";

/** Shared practice footer control sizing (allows shrink on narrow screens). */
export const PRACTICE_FOOTER_BTN_CLASS =
  "inline-flex h-11 min-h-11 min-w-0 max-w-full items-center justify-center gap-1.5 px-3 text-sm font-semibold sm:gap-2 sm:px-4 sm:text-base";

export const PRACTICE_FOOTER_HEIGHT = "5.25rem";

interface PracticeSessionFooterProps {
  index: number;
  total: number;
  revealed: boolean;
  correct: boolean;
  selectedId: string | null;
  onPrevious: () => void;
  onNext: () => void;
  onCheck: () => void;
  onFinish?: () => void;
}

export function PracticeSessionFooter({
  index,
  total,
  revealed,
  correct,
  selectedId,
  onPrevious,
  onNext,
  onCheck,
  onFinish,
}: PracticeSessionFooterProps) {
  const isFirst = index === 0;
  const isLast = index >= total - 1;

  return (
    <footer
      className={cn(
        "fixed bottom-0 z-50 border-t bg-background/95 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.12)] backdrop-blur supports-[backdrop-filter]:bg-background/85",
        "left-0 right-0 max-w-[100vw] overflow-hidden transition-[left] duration-200 ease-linear md:left-[var(--sidebar-inset-left)]",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]"
      )}
      style={{ minHeight: PRACTICE_FOOTER_HEIGHT }}
      aria-label="Practice controls"
    >
      <div
        className={cn(
          "mx-auto grid w-full max-w-3xl items-center gap-2 py-3",
          "grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)]",
          "px-3 sm:gap-3 sm:px-4 md:px-6"
        )}
      >
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isFirst}
          className={cn(PRACTICE_FOOTER_BTN_CLASS, "justify-self-start")}
          aria-label="Previous question"
        >
          <ChevronLeftIcon className="size-4 shrink-0" />
          <span className="hidden min-[380px]:inline">Prev</span>
        </Button>

        <div className="flex min-w-0 items-center justify-center justify-self-center">
          {!revealed ? (
            <Button
              type="button"
              onClick={onCheck}
              disabled={!selectedId}
              className={cn(PRACTICE_FOOTER_BTN_CLASS, "w-full")}
            >
              <span className="truncate sm:hidden">Check</span>
              <span className="hidden truncate sm:inline">Check answer</span>
            </Button>
          ) : (
            <span
              className={cn(
                PRACTICE_FOOTER_BTN_CLASS,
                "w-full rounded-lg border bg-muted/30",
                correct
                  ? "border-green-600/30 text-green-700 dark:text-green-400"
                  : "border-red-600/30 text-red-700 dark:text-red-400"
              )}
            >
              {correct ? (
                <CircleCheckIcon className="size-5 shrink-0" />
              ) : (
                <CircleXIcon className="size-5 shrink-0" />
              )}
              <span className="truncate">{correct ? "Correct" : "Incorrect"}</span>
            </span>
          )}
        </div>

        {isLast && revealed ? (
          <Button
            type="button"
            onClick={onFinish}
            className={cn(
              PRACTICE_FOOTER_BTN_CLASS,
              "justify-self-end leading-tight"
            )}
            aria-label="Finish and view results"
          >
            <span className="truncate sm:hidden">Finish</span>
            <span className="hidden truncate sm:inline">Finish &amp; results</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onNext}
            disabled={!revealed}
            className={cn(PRACTICE_FOOTER_BTN_CLASS, "justify-self-end")}
            aria-label="Next question"
          >
            <span className="hidden min-[380px]:inline">Next</span>
            <ChevronRightIcon className="size-4 shrink-0" />
          </Button>
        )}
      </div>
    </footer>
  );
}
