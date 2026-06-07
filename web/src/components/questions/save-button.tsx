"use client";

import { useEffect, useState } from "react";
import type { Question } from "@/types/question";
import { Button } from "@/components/ui/button";
import { BookmarkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnalyticsEvents } from "@/lib/analytics-events";
import {
  questionAnalyticsParams,
  setUserProperties,
  trackAnalyticsEvent,
} from "@/lib/analytics";
import {
  isQuestionSaved,
  toggleSavedQuestion,
} from "@/lib/saved-questions";

interface SaveButtonProps {
  question: Question;
  /** Compact control for the question card corner */
  corner?: boolean;
}

export function SaveButton({ question, corner = false }: SaveButtonProps) {
  const [saved, setSaved] = useState(() => isQuestionSaved(question.questionKey));

  useEffect(() => {
    const handler = () => setSaved(isQuestionSaved(question.questionKey));
    window.addEventListener("webstudy-saved-changed", handler);
    return () => window.removeEventListener("webstudy-saved-changed", handler);
  }, [question.questionKey]);

  const bookmarkClass = cn(
    "size-5 shrink-0 transition-colors",
    saved && "fill-amber-500 text-amber-500"
  );

  function handleToggle() {
    const next = toggleSavedQuestion(question);
    setSaved(next);
    trackAnalyticsEvent(
      next ? AnalyticsEvents.questionSave : AnalyticsEvents.questionUnsave,
      questionAnalyticsParams(question)
    );
    setUserProperties({ has_saved_questions: next });
  }

  if (corner) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto gap-1.5 px-2 py-1.5 text-muted-foreground hover:text-foreground"
        data-analytics-zone="practice_card"
        data-analytics-id="question_save"
        data-analytics-skip
        onClick={handleToggle}
        aria-pressed={saved}
        aria-label={saved ? "Saved for later" : "Save for later"}
      >
        <span className="text-xs font-medium">
          {saved ? (
            "Saved"
          ) : (
            <>
              <span className="md:hidden">Save</span>
              <span className="hidden md:inline">Save for later</span>
            </>
          )}
        </span>
        <BookmarkIcon className={bookmarkClass} />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={saved ? "secondary" : "outline"}
      size="sm"
      onClick={handleToggle}
      aria-pressed={saved}
    >
      {saved ? "Saved" : "Save for later"}
      <BookmarkIcon className={bookmarkClass} />
    </Button>
  );
}
