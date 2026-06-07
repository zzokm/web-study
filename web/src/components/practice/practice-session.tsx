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
  patchQuestionChecked,
  patchQuestionShown,
  patchQuestionShownCleared,
  practiceProgressCount,
  practiceSessionKey,
  savePracticeProgress,
  type PracticeProgress,
  type QuestionAttempt,
} from "@/lib/practice-progress";
import { computePracticeTimingStats } from "@/lib/practice-timing";
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
import { PracticePauseOverlay } from "@/components/practice/practice-pause-overlay";
import {
  usePracticeHeader,
  usePracticeHeaderState,
} from "@/components/practice/practice-header-context";

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
  const { setPracticeHeader } = usePracticeHeader();
  const practiceHeaderState = usePracticeHeaderState();
  const paused = practiceHeaderState?.paused ?? false;
  const startedRef = useRef(false);
  const sessionStartedAtRef = useRef<string | null>(null);
  const pauseStartedAtRef = useRef<number | null>(null);
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
    const startedAt = Date.now();
    sessionStartedAtRef.current = new Date(startedAt).toISOString();
    setPracticeHeader({
      mode: "elapsed",
      startedAt,
      paused: false,
      totalPausedMs: 0,
    });
    return () => setPracticeHeader(null);
  }, [practiceMode, setPracticeHeader]);

  useEffect(() => {
    if (!question) return;
    patchProgress((prev) => patchQuestionShown(prev, question.questionKey));
  }, [question?.questionKey, patchProgress]);

  useEffect(() => {
    if (!practiceHeaderState) return;

    if (practiceHeaderState.paused) {
      if (pauseStartedAtRef.current == null) {
        pauseStartedAtRef.current = practiceHeaderState.pausedAt ?? Date.now();
      }
      return;
    }

    if (pauseStartedAtRef.current == null) return;

    const pauseMs = Date.now() - pauseStartedAtRef.current;
    pauseStartedAtRef.current = null;

    if (!question || revealed || pauseMs <= 0) return;

    patchProgress((prev) => {
      const attempt = getAttempt(prev, question.questionKey);
      if (attempt.revealed || attempt.shownAt == null) return prev;
      return {
        ...prev,
        [question.questionKey]: {
          ...attempt,
          shownAt: attempt.shownAt + pauseMs,
        },
      };
    });
  }, [
    practiceHeaderState?.paused,
    practiceHeaderState?.pausedAt,
    question,
    revealed,
    patchProgress,
    practiceHeaderState,
  ]);

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
    patchProgress((prev) => patchQuestionChecked(prev, question.questionKey));
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
    patchProgress,
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
      if (!revealed) {
        patchProgress((prev) =>
          patchQuestionShownCleared(prev, question.questionKey)
        );
      }
      trackEvent(AnalyticsEvents.practicePrevious, {
        ...questionAnalyticsParams(question),
        practice_mode: practiceMode,
        question_index: index + 1,
      });
      setIndex((i) => i - 1);
    }
  }, [index, question, revealed, patchProgress, practiceMode]);

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
    disabled: paused,
    onSelect: handleSelect,
    onCheck: handleCheck,
    onPrevious: handlePrevious,
    onNext: handleNext,
    onSave: handleSave,
  });

  const handleFinish = useCallback(() => {
    const finishedAt = new Date().toISOString();
    const score = computePracticeScore(questions, progress);
    const timing = computePracticeTimingStats(questions, progress, {
      sessionStartedAt: sessionStartedAtRef.current ?? undefined,
      finishedAt,
    });
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
      total_thinking_ms:
        timing.recordedCount > 0 ? timing.totalThinkingMs : undefined,
      session_wall_ms: timing.sessionWallMs ?? undefined,
    });
    const id = savePracticeResult({
      sessionKey,
      title,
      finishedAt,
      sessionStartedAt: sessionStartedAtRef.current ?? undefined,
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
      {paused ? <PracticePauseOverlay /> : null}
      <div
        className="mx-auto flex max-w-3xl flex-col gap-6"
        aria-hidden={paused}
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
        paused={paused}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onCheck={handleCheck}
        onFinish={handleFinish}
      />
    </>
  );
}

