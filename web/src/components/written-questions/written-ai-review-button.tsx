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
import { Button } from "@/components/ui/button";
import { BrainIcon } from "lucide-react";
import { toast } from "sonner";

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
      toast.success("Review prompt copied — paste it into your AI assistant");
    } catch {
      toast.error("Could not copy the review prompt. Try again.");
    } finally {
      setCopying(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void handleCopy()}
      disabled={copying}
      className="w-full gap-2 sm:w-auto"
    >
      <BrainIcon className="size-4 shrink-0" aria-hidden />
      {copying ? "Copying…" : "Review with AI"}
    </Button>
  );
}
