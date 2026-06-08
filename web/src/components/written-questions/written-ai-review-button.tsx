"use client";

import { useState } from "react";
import type { Question } from "@/types/question";
import { AnalyticsEvents } from "@/lib/analytics-events";
import {
  questionAnalyticsParams,
  trackAnalyticsEvent,
} from "@/lib/analytics";
import {
  copyWrittenAiReviewPrompt,
  formatWrittenAnswerLanguageLabel,
} from "@/lib/written-ai-review-prompt";
import { inferWrittenEditorLanguage } from "@/lib/written-question-utils";
import { ShinyButton } from "@/components/ui/shiny-button";
import { PRACTICE_FOOTER_HEIGHT } from "@/components/practice/practice-session-footer";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

/** Extra scroll clearance when the floating AI review button is visible. */
export const WRITTEN_AI_REVIEW_FLOAT_CLEARANCE = "3.75rem";

type WrittenAiReviewButtonProps = {
  question: Question;
  userAnswer: string;
};

export function WrittenAiReviewButton({
  question,
  userAnswer,
}: WrittenAiReviewButtonProps) {
  const [copying, setCopying] = useState(false);

  async function handleCopy() {
    if (copying) return;
    setCopying(true);
    try {
      await copyWrittenAiReviewPrompt(question, userAnswer);
      trackAnalyticsEvent(AnalyticsEvents.writtenAiReviewCopy, {
        ...questionAnalyticsParams(question),
        answer_language: formatWrittenAnswerLanguageLabel(
          inferWrittenEditorLanguage(question)
        ),
      });
      toast.success(
        "Review prompt copied — paste into your AI assistant (e.g. Claude, ChatGPT, Gemini)"
      );
    } catch {
      toast.error("Could not copy the review prompt. Try again.");
    } finally {
      setCopying(false);
    }
  }

  return (
    <div
      className="pointer-events-none fixed z-[49]"
      style={{
        bottom: `calc(${PRACTICE_FOOTER_HEIGHT} + 0.75rem)`,
        right: "max(1rem, env(safe-area-inset-right))",
        left: "auto",
      }}
    >
      <div className="pointer-events-auto rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.32),0_0_28px_rgba(124,58,237,0.28)]">
        <ShinyButton
          type="button"
          size="compact"
          disabled={copying}
          onClick={() => void handleCopy()}
          aria-label="Review with AI — copy prompt to clipboard"
          className="min-w-[11.5rem]"
        >
          <div className="grid w-full grid-cols-[1.125rem_1fr_1.125rem] items-center gap-x-3">
            <Sparkles
              className="col-start-1 size-3.5 shrink-0 self-center"
              aria-hidden
            />
            <span className="col-start-2 flex flex-col items-center gap-0.5 text-center leading-tight">
              <span className="text-xs font-semibold">
                {copying ? "Copying…" : "Review with AI"}
              </span>
              <span className="text-[10px] font-normal text-violet-100/85">
                Copies AI prompt
              </span>
            </span>
            <span className="col-start-3 size-3.5 shrink-0" aria-hidden />
          </div>
        </ShinyButton>
      </div>
    </div>
  );
}
