"use client";

import { useCallback, useEffect, useState } from "react";
import type { Question } from "@/types/question";
import { getQuestionByKey } from "@/lib/questions";
import { getSavedQuestions } from "@/lib/saved-questions";
import { HubTrackedLink } from "@/components/analytics/hub-tracked-link";
import { PracticeHubCardHeader } from "@/components/practice/practice-hub-card-header";
import { Card } from "@/components/ui/card";

function resolveSavedQuestions(): Question[] {
  return getSavedQuestions()
    .map((item) => getQuestionByKey(item.questionKey))
    .filter((q): q is Question => q != null);
}

export function PracticeSavedSetCard() {
  const [questions, setQuestions] = useState<Question[]>(() =>
    resolveSavedQuestions()
  );

  const refresh = useCallback(() => {
    setQuestions(resolveSavedQuestions());
  }, []);

  useEffect(() => {
    window.addEventListener("webstudy-saved-changed", refresh);
    return () => window.removeEventListener("webstudy-saved-changed", refresh);
  }, [refresh]);

  if (questions.length === 0) return null;

  return (
    <HubTrackedLink
      href="/practice/saved/"
      hubType="practice"
      label="Practice saved set"
    >
      <Card className="transition-colors hover:bg-muted/50">
        <PracticeHubCardHeader
          title="Practice saved set"
          description={`${questions.length} question${
            questions.length === 1 ? "" : "s"
          }`}
          questions={questions}
          scopeId="saved"
        />
      </Card>
    </HubTrackedLink>
  );
}
