"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Question } from "@/types/question";
import { PracticeWrittenSetCard } from "@/components/practice/practice-written-set-card";
import { QuestionBrowseAccordion } from "@/components/questions/question-browse-accordion";
import { WrittenAiGeneratedNotice } from "@/components/written-questions/written-ai-generated-notice";
import { isWrittenExamQ81 } from "@/lib/written-question-keys";

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

export function WrittenPageClient({
  questions,
  count,
}: {
  questions: Question[];
  count: number;
}) {
  const { browseQuestions, generatedQuestions } = useMemo(() => {
    const exam = questions.find((q) => isWrittenExamQ81(q.questionKey));
    const generated = questions.filter((q) => !isWrittenExamQ81(q.questionKey));
    const ordered = exam ? [exam, ...generated] : generated;
    return { browseQuestions: ordered, generatedQuestions: generated };
  }, [questions]);

  const generatedIndexByKey = useMemo(
    () =>
      new Map(
        generatedQuestions.map((q, index) => [q.questionKey, index + 1])
      ),
    [generatedQuestions]
  );

  const [openValues, setOpenValues] = useState<string[]>(() =>
    initialOpenFromHash(browseQuestions)
  );

  const scrollToQuestion = useCallback((questionKey: string) => {
    const id = `written-${questionKey}`;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, []);

  useEffect(() => {
    const key = hashQuestionKey();
    if (!key || !browseQuestions.some((q) => q.questionKey === key)) return;
    const timer = window.setTimeout(() => scrollToQuestion(key), 350);
    return () => window.clearTimeout(timer);
  }, [browseQuestions, scrollToQuestion]);

  useEffect(() => {
    const onHashChange = () => {
      const key = hashQuestionKey();
      if (!key || !browseQuestions.some((q) => q.questionKey === key)) return;
      setOpenValues([key]);
      window.setTimeout(() => scrollToQuestion(key), 350);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [browseQuestions, scrollToQuestion]);

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Written questions
        </h1>
        <p className="text-muted-foreground">
          {count} HTML, JavaScript, CSS, Python, and Django coding tasks —
          expand any question to read the model answer and explanation.
        </p>
      </div>

      <PracticeWrittenSetCard questions={questions} count={count} />

      <QuestionBrowseAccordion
        questions={browseQuestions}
        browseContext="written"
        openValues={openValues}
        onOpenValuesChange={setOpenValues}
        scrollIdPrefix="written"
        getDisplayNumber={(q) => {
          if (isWrittenExamQ81(q.questionKey)) return "81";
          return String(generatedIndexByKey.get(q.questionKey) ?? "");
        }}
        renderAfterItem={(q) =>
          isWrittenExamQ81(q.questionKey) ? <WrittenAiGeneratedNotice /> : null
        }
      />
    </>
  );
}
