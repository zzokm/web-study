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
import type { InteractionSource } from "@/lib/analytics-event-schemas";
import {
  interactionSource,
  practiceContextFromPath,
  questionAnalyticsParams,
  setUserProperties,
  trackAnalyticsEvent,
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
  getPracticeElapsedMs,
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
  const prevPausedRef = useRef<boolean | null>(null);
  const viewedQuestionsRef = useRef(new Set<string>());
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
    const questionKey = question.questionKey;
    // Record when each question becomes visible for thinking-time measurement.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync progress with visible question
    patchProgress((prev) => patchQuestionShown(prev, questionKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on questionKey only
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

  const practiceBase = useCallback(
    (source?: InteractionSource) => ({
      ...practiceContextFromPath(pathname, title),
      question_index: index + 1,
      ...(source ? interactionSource(source) : {}),
    }),
    [pathname, title, index]
  );

  useEffect(() => {
    if (startedRef.current || questions.length === 0) return;
    startedRef.current = true;
    trackAnalyticsEvent(AnalyticsEvents.practiceStart, {
      ...practiceContextFromPath(pathname, title),
      question_count: questions.length,
    });
    setUserProperties({
      last_practice_mode: practiceMode,
      last_exam_year: examYear,
      last_lecture_slug: lectureSlug,
    });
  }, [questions.length, practiceMode, examYear, lectureSlug, title, pathname]);

  useEffect(() => {
    if (!question || !practiceMode) return;
    if (viewedQuestionsRef.current.has(question.questionKey)) return;
    viewedQuestionsRef.current.add(question.questionKey);
    trackAnalyticsEvent(AnalyticsEvents.practiceQuestionView, {
      ...practiceContextFromPath(pathname, title),
      question_index: index + 1,
      ...questionAnalyticsParams(question),
    });
  }, [question, practiceMode, pathname, title, index]);

  useEffect(() => {
    if (!practiceHeaderState || !practiceMode) return;
    const wasPaused = prevPausedRef.current;
    const isPaused = practiceHeaderState.paused;
    if (wasPaused === isPaused) return;
    prevPausedRef.current = isPaused;

    const elapsed = getPracticeElapsedMs(practiceHeaderState);
    const base = practiceContextFromPath(pathname, title);

    if (isPaused) {
      trackAnalyticsEvent(AnalyticsEvents.practicePause, {
        ...base,
        question_index: index + 1,
        elapsed_ms: elapsed,
      });
    } else if (wasPaused === true && pauseStartedAtRef.current != null) {
      trackAnalyticsEvent(AnalyticsEvents.practiceResume, {
        ...base,
        question_index: index + 1,
        elapsed_ms: elapsed,
        pause_duration_ms: Date.now() - pauseStartedAtRef.current,
      });
    }
  }, [practiceHeaderState, practiceMode, pathname, title, index]);

  const handleSelect = useCallback(
    (id: string, source: InteractionSource = "click") => {
      if (!question) return;
      updateCurrentAttempt({ selectedId: id });
      trackAnalyticsEvent(AnalyticsEvents.practiceSelectAnswer, {
        ...practiceBase(source),
        ...questionAnalyticsParams(question),
        selected_option_id: id,
      });
    },
    [question, updateCurrentAttempt, practiceBase]
  );

  const handleCheck = useCallback(
    (source: InteractionSource = "click") => {
      if (!selectedId || !question || revealed) return;
      const isCorrect = isAnswerCorrect(selectedId, question.correctAnswerId);
      const now = Date.now();
      patchProgress((prev) => {
        const next = patchQuestionChecked(prev, question.questionKey, now);
        const attempt = getAttempt(next, question.questionKey);
        trackAnalyticsEvent(AnalyticsEvents.practiceCheckAnswer, {
          ...practiceBase(source),
          ...questionAnalyticsParams(question),
          selected_option_id: selectedId,
          correct: isCorrect,
          thinking_ms: attempt.thinkingMs,
        });
        return next;
      });
    },
    [selectedId, question, revealed, patchProgress, practiceBase]
  );

  const handleNext = useCallback(
    (source: InteractionSource = "click") => {
      if (index < questions.length - 1 && revealed && question) {
        trackAnalyticsEvent(AnalyticsEvents.practiceNext, {
          ...practiceBase(source),
          ...questionAnalyticsParams(question),
        });
        setIndex((i) => i + 1);
      }
    },
    [index, questions.length, revealed, question, practiceBase]
  );

  const handlePrevious = useCallback(
    (source: InteractionSource = "click") => {
      if (index > 0 && question) {
        if (!revealed) {
          patchProgress((prev) =>
            patchQuestionShownCleared(prev, question.questionKey)
          );
        }
        trackAnalyticsEvent(AnalyticsEvents.practicePrevious, {
          ...practiceBase(source),
          ...questionAnalyticsParams(question),
        });
        setIndex((i) => i - 1);
      }
    },
    [index, question, revealed, patchProgress, practiceBase]
  );

  const handleSave = useCallback(
    (source: InteractionSource = "click") => {
      if (!question) return;
      const saved = toggleSavedQuestion(question);
      trackAnalyticsEvent(
        saved ? AnalyticsEvents.questionSave : AnalyticsEvents.questionUnsave,
        {
          ...practiceBase(source),
          ...questionAnalyticsParams(question),
        }
      );
      setUserProperties({ has_saved_questions: saved });
    },
    [question, practiceBase]
  );

  usePracticeKeyboard({
    question,
    revealed,
    selectedId,
    disabled: paused,
    onSelect: (id) => handleSelect(id, "keyboard"),
    onCheck: () => handleCheck("keyboard"),
    onPrevious: () => handlePrevious("keyboard"),
    onNext: () => handleNext("keyboard"),
    onSave: () => handleSave("keyboard"),
  });

  const handleFinish = useCallback(() => {
    const finishedAt = new Date().toISOString();
    const score = computePracticeScore(questions, progress);
    const timing = computePracticeTimingStats(questions, progress, {
      sessionStartedAt: sessionStartedAtRef.current ?? undefined,
      finishedAt,
    });
    trackAnalyticsEvent(AnalyticsEvents.practiceFinish, {
      ...practiceContextFromPath(pathname, title),
      question_count: questions.length,
      score_percent: score.percent,
      correct: score.correct,
      incorrect: score.incorrect,
      skipped: score.skipped,
      total_thinking_ms:
        timing.recordedCount > 0 ? timing.totalThinkingMs : undefined,
      session_wall_ms: timing.sessionWallMs ?? undefined,
    });
    setUserProperties({
      last_score_percent: score.percent,
      last_finish_at: finishedAt,
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
  }, [sessionKey, title, questions, progress, router, pathname]);

  const handleResetProgress = useCallback(() => {
    const savedCount = practiceProgressCount(progress);
    trackAnalyticsEvent(AnalyticsEvents.practiceResetConfirm, {
      ...practiceContextFromPath(pathname, title),
      saved_answers_count: savedCount,
    });
    trackAnalyticsEvent(AnalyticsEvents.practiceReset, {
      ...practiceContextFromPath(pathname, title),
      saved_answers_count: savedCount,
    });
    clearPracticeProgress(sessionKey);
    setProgress({});
    setIndex(0);
    viewedQuestionsRef.current = new Set();
  }, [sessionKey, pathname, title, progress]);

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
        onPrevious={() => handlePrevious("click")}
        onNext={() => handleNext("click")}
        onCheck={() => handleCheck("click")}
        onFinish={handleFinish}
      />
    </>
  );
}

