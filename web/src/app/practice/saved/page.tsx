"use client";

import { useEffect, useState } from "react";
import type { Question } from "@/types/question";
import { getQuestionByKey } from "@/lib/questions";
import { getSavedQuestions } from "@/lib/saved-questions";
import { PracticeSessionHydrated } from "@/components/practice/practice-session-hydrated";
import { LinkButton } from "@/components/ui/link-button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

function resolveSavedQuestions(): Question[] {
  return getSavedQuestions()
    .map((item) => getQuestionByKey(item.questionKey))
    .filter((q): q is Question => q != null);
}

export default function PracticeSavedPage() {
  const [questions, setQuestions] = useState<Question[]>(() =>
    resolveSavedQuestions()
  );

  useEffect(() => {
    const handler = () => setQuestions(resolveSavedQuestions());
    window.addEventListener("mgmt-saved-changed", handler);
    return () => window.removeEventListener("mgmt-saved-changed", handler);
  }, []);

  if (questions.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No saved questions to practice</EmptyTitle>
            <EmptyDescription>
              Bookmark questions during practice, then come back here.
            </EmptyDescription>
          </EmptyHeader>
          <LinkButton href="/saved/" variant="outline">
            View saved
          </LinkButton>
        </Empty>
      </div>
    );
  }

  return (
    <PracticeSessionHydrated questions={questions} title="Saved questions — Practice" />
  );
}
