"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Question } from "@/types/question";
import { AnalyticsEvents } from "@/lib/analytics-events";
import {
  examYearFromPathname,
  lectureSlugFromPathname,
  practiceModeFromPathname,
} from "@/lib/analytics-practice";
import {
  questionAnalyticsParams,
  setUserProperties,
  trackEvent,
} from "@/lib/analytics";
import { isAnswerCorrect } from "@/lib/questions";
import {
  clearPracticeProgress,
  computePracticeScore,
  getAttempt,
  loadPracticeProgress,
  practiceProgressCount,
  practiceSessionKey,
  savePracticeProgress,
  type PracticeProgress,
  type QuestionAttempt,
} from "@/lib/practice-progress";
import { ResetPracticeProgressButton } from "@/components/practice/reset-practice-progress-button";
import { savePracticeResult } from "@/lib/practice-results";
import { toggleSavedQuestion } from "@/lib/saved-questions";
import { usePracticeKeyboard } from "@/hooks/use-practice-keyboard";
import { QuestionCard } from "@/components/questions/question-card";
import { AnswerReveal } from "@/components/questions/answer-reveal";
import { SaveButton } from "@/components/questions/save-button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PRACTICE_FOOTER_HEIGHT,
  PracticeSessionFooter,
} from "@/components/practice/practice-session-footer";

interface PracticeSessionProps {
  questions: Question[];
  title: string;
}

export function PracticeSession({ questions, title }: PracticeSessionProps) {
  const sessionKey = useMemo(() => practiceSessionKey(questions), [questions]);

  return (
    <PracticeSessionInner
      key={sessionKey}
      sessionKey={sessionKey}
      questions={questions}
      title={title}
    />
  );
}

function PracticeSessionInner({
  sessionKey,
  questions,
  title,
}: PracticeSessionProps & { sessionKey: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const practiceMode = practiceModeFromPathname(pathname);
  const examYear = examYearFromPathname(pathname);
  const lectureSlug = lectureSlugFromPathname(pathname);
  const startedRef = useRef(false);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState<PracticeProgress>(() =>
    loadPracticeProgress(sessionKey)
  );

  const patchProgress = useCallback(
    (updater: (prev: PracticeProgress) => PracticeProgress) => {
      setProgress((prev) => {
        const next = updater(prev);
        savePracticeProgress(sessionKey, next);
        return next;
      });
    },
    [sessionKey]
  );

  const question = questions[index];
  const attempt = question
    ? getAttempt(progress, question.questionKey)
    : { selectedId: null, revealed: false };
  const { selectedId, revealed } = attempt;

  const updateCurrentAttempt = useCallback(
    (patch: Partial<QuestionAttempt>) => {
      if (!question) return;
      patchProgress((prev) => ({
        ...prev,
        [question.questionKey]: {
          ...getAttempt(prev, question.questionKey),
          ...patch,
        },
      }));
    },
    [question, patchProgress]
  );

  useEffect(() => {
    if (startedRef.current || questions.length === 0) return;
    startedRef.current = true;
    trackEvent(AnalyticsEvents.practiceStart, {
      practice_mode: practiceMode,
      question_count: questions.length,
      exam_year: examYear,
      lecture_slug: lectureSlug,
      session_title: title,
    });
    setUserProperties({
      last_practice_mode: practiceMode,
      last_exam_year: examYear,
      last_lecture_slug: lectureSlug,
    });
  }, [questions.length, practiceMode, examYear, lectureSlug, title]);

  const handleSelect = useCallback(
    (id: string) => {
      if (!question) return;
      updateCurrentAttempt({ selectedId: id });
      trackEvent(AnalyticsEvents.practiceSelectAnswer, {
        ...questionAnalyticsParams(question),
        practice_mode: practiceMode,
        question_index: index + 1,
        selected_option_id: id,
      });
    },
    [question, updateCurrentAttempt, practiceMode, index]
  );

  const handleCheck = useCallback(() => {
    if (!selectedId || !question || revealed) return;
    const isCorrect = isAnswerCorrect(selectedId, question.correctAnswerId);
    updateCurrentAttempt({ revealed: true });
    trackEvent(AnalyticsEvents.practiceCheckAnswer, {
      ...questionAnalyticsParams(question),
      practice_mode: practiceMode,
      question_index: index + 1,
      selected_option_id: selectedId,
      correct: isCorrect,
    });
  }, [
    selectedId,
    question,
    revealed,
    updateCurrentAttempt,
    practiceMode,
    index,
  ]);

  const handleNext = useCallback(() => {
    if (index < questions.length - 1 && revealed && question) {
      trackEvent(AnalyticsEvents.practiceNext, {
        ...questionAnalyticsParams(question),
        practice_mode: practiceMode,
        question_index: index + 1,
      });
      setIndex((i) => i + 1);
    }
  }, [index, questions.length, revealed, question, practiceMode]);

  const handlePrevious = useCallback(() => {
    if (index > 0 && question) {
      trackEvent(AnalyticsEvents.practicePrevious, {
        ...questionAnalyticsParams(question),
        practice_mode: practiceMode,
        question_index: index + 1,
      });
      setIndex((i) => i - 1);
    }
  }, [index, question, practiceMode]);

  const handleSave = useCallback(() => {
    if (!question) return;
    const saved = toggleSavedQuestion(question);
    trackEvent(
      saved ? AnalyticsEvents.questionSave : AnalyticsEvents.questionUnsave,
      questionAnalyticsParams(question)
    );
  }, [question]);

  usePracticeKeyboard({
    question,
    revealed,
    selectedId,
    onSelect: handleSelect,
    onCheck: handleCheck,
    onPrevious: handlePrevious,
    onNext: handleNext,
    onSave: handleSave,
  });

  const handleFinish = useCallback(() => {
    const score = computePracticeScore(questions, progress);
    trackEvent(AnalyticsEvents.practiceFinish, {
      practice_mode: practiceMode,
      question_count: questions.length,
      exam_year: examYear,
      lecture_slug: lectureSlug,
      session_title: title,
      score_percent: score.percent,
      correct: score.correct,
      incorrect: score.incorrect,
      skipped: score.skipped,
    });
    const id = savePracticeResult({
      sessionKey,
      title,
      finishedAt: new Date().toISOString(),
      questionKeys: questions.map((q) => q.questionKey),
      progress,
    });
    router.push(`/practice/results/?id=${id}`);
  }, [
    sessionKey,
    title,
    questions,
    progress,
    router,
    practiceMode,
    examYear,
    lectureSlug,
  ]);

  const handleResetProgress = useCallback(() => {
    trackEvent(AnalyticsEvents.practiceReset, {
      practice_mode: practiceMode,
      saved_answers_count: practiceProgressCount(progress),
    });
    clearPracticeProgress(sessionKey);
    setProgress({});
    setIndex(0);
  }, [sessionKey, practiceMode, progress]);

  const savedCount = practiceProgressCount(progress);

  if (!question) {
    return (
      <Alert>
        <AlertDescription>No questions in this set.</AlertDescription>
      </Alert>
    );
  }

  const correct = selectedId
    ? isAnswerCorrect(selectedId, question.correctAnswerId)
    : false;

  const progressPct =
    questions.length > 0 ? ((index + 1) / questions.length) * 100 : 0;

  return (
    <>
      <div
        className="mx-auto flex max-w-3xl flex-col gap-6"
        style={{
          paddingBottom: `calc(${PRACTICE_FOOTER_HEIGHT} + 1.5rem)`,
        }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <ResetPracticeProgressButton
              savedCount={savedCount}
              onConfirm={handleResetProgress}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Question {index + 1} of {questions.length}
          </p>
          <Progress value={progressPct} className="h-2" />
        </div>

        <Card className="relative">
          <div className="absolute top-3 right-3 z-10">
            <SaveButton key={question.questionKey} question={question} corner />
          </div>
          <CardHeader className="pr-28">
            <CardTitle className="text-base font-medium text-muted-foreground">
              {revealed ? (correct ? "Correct" : "Incorrect") : "Answer the question"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <QuestionCard
              question={question}
              selectedId={selectedId}
              onSelect={handleSelect}
              revealed={revealed}
              disabled={revealed}
            />

            {revealed && <AnswerReveal question={question} />}
          </CardContent>
        </Card>
      </div>

      <PracticeSessionFooter
        index={index}
        total={questions.length}
        revealed={revealed}
        correct={correct}
        selectedId={selectedId}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onCheck={handleCheck}
        onFinish={handleFinish}
      />
    </>
  );
}

