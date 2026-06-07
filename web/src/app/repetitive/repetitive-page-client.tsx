"use client";

import { useCallback, useEffect, useState } from "react";
import type { Question } from "@/types/question";
import { LinkButton } from "@/components/ui/link-button";
import { QuestionBrowseAccordion } from "@/components/questions/question-browse-accordion";

function hashQuestionKey(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function initialOpenFromHash(questions: Question[]): string[] {
  const key = hashQuestionKey();
  if (!key) return [];
  return questions.some((q) => q.questionKey === key) ? [key] : [];
}

export function RepetitivePageClient({
  questions,
  count,
}: {
  questions: Question[];
  count: number;
}) {
  const [openValues, setOpenValues] = useState<string[]>(() =>
    initialOpenFromHash(questions)
  );

  const scrollToQuestion = useCallback((questionKey: string) => {
    const id = `repetitive-${questionKey}`;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, []);

  useEffect(() => {
    const key = hashQuestionKey();
    if (!key || !questions.some((q) => q.questionKey === key)) return;
    const timer = window.setTimeout(() => scrollToQuestion(key), 350);
    return () => window.clearTimeout(timer);
  }, [questions, scrollToQuestion]);

  useEffect(() => {
    const onHashChange = () => {
      const key = hashQuestionKey();
      if (!key || !questions.some((q) => q.questionKey === key)) return;
      setOpenValues([key]);
      window.setTimeout(() => scrollToQuestion(key), 350);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [questions, scrollToQuestion]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Repetitive questions
          </h1>
          <p className="text-muted-foreground">
            {count} stems that appeared in multiple exams — highest yield for
            review.
          </p>
        </div>
        <LinkButton href="/practice/repetitive/">Practice repetitive set</LinkButton>
      </div>

      <QuestionBrowseAccordion
        questions={questions}
        browseContext="repetitive"
        openValues={openValues}
        onOpenValuesChange={setOpenValues}
        scrollIdPrefix="repetitive"
      />
    </div>
  );
}
