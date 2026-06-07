"use client";

import { useCallback, useEffect, useState } from "react";
import type { Question } from "@/types/question";
import { getQuestionByKey } from "@/lib/questions";
import { getSavedQuestions } from "@/lib/saved-questions";
import { QuestionBrowseAccordion } from "@/components/questions/question-browse-accordion";
import { LinkButton } from "@/components/ui/link-button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

function resolveSavedQuestions(): Question[] {
  return getSavedQuestions()
    .map((item) => getQuestionByKey(item.questionKey))
    .filter((q): q is Question => q != null);
}

export function SavedPageClient() {
  const [questions, setQuestions] = useState<Question[]>(() => resolveSavedQuestions());

  const refresh = useCallback(() => {
    setQuestions(resolveSavedQuestions());
  }, []);

  useEffect(() => {
    window.addEventListener("mgmt-saved-changed", refresh);
    return () => window.removeEventListener("mgmt-saved-changed", refresh);
  }, [refresh]);

  const count = questions.length;

  const savedAtByKey = new Map(
    getSavedQuestions().map((item) => [item.questionKey, item.savedAt])
  );

  if (count === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No saved questions</EmptyTitle>
          <EmptyDescription>
            Save questions during practice to review them here.
          </EmptyDescription>
        </EmptyHeader>
        <LinkButton href="/practice/" variant="outline">
          Start practicing
        </LinkButton>
      </Empty>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Saved for later</h1>
          <p className="text-muted-foreground">
            {count} question{count === 1 ? "" : "s"} bookmarked in this browser
          </p>
        </div>
        <LinkButton href="/practice/saved/">Practice saved set</LinkButton>
      </div>

      <QuestionBrowseAccordion
        questions={questions}
        browseContext="saved"
        showSaveButton
        renderTriggerPrefix={(q) => {
          const savedAt = savedAtByKey.get(q.questionKey);
          if (!savedAt) return null;
          return (
            <p className="text-xs text-muted-foreground">
              Saved {new Date(savedAt).toLocaleDateString()}
            </p>
          );
        }}
      />
    </>
  );
}
