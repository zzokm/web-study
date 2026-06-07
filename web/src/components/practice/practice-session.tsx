"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { cn } from "@/lib/utils";
import type { MockExamSpec } from "@/lib/mock-exam";
import {
  practiceConfigAnalyticsParams,
  type PracticeSessionConfig,
} from "@/lib/practice-session-config";
import { RegenerateMockExamButton } from "@/components/practice/regenerate-mock-exam-button";
import {
  allQuestionsAnswered,
  clearPracticeProgress,
  computePracticeScore,
  getAttempt,
  loadPracticeProgress,
  patchAllQuestionsRevealed,
  patchQuestionChecked,
  patchQuestionShown,
  patchQuestionShownCleared,
  patchQuestionThinkingFrozen,
  practiceProgressCount,
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
import { ReportIssueButton } from "@/components/report/report-issue-button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PRACTICE_FOOTER_HEIGHT,
  PracticeSessionFooter,
} from "@/components/practice/practice-session-footer";
import { PracticeFloatingTimer } from "@/components/layout/practice-header-extras";
import { PracticePauseOverlay } from "@/components/practice/practice-pause-overlay";
import {
  getPracticeElapsedMs,
  usePracticeHeader,
  usePracticeHeaderState,
} from "@/components/practice/practice-header-context";

interface PracticeSessionProps {
  questions: Question[];
  title: string;
  config: PracticeSessionConfig;
  sessionKey: string;
  initialIndex?: number;
  startFresh?: boolean;
  mockExamSpec?: MockExamSpec;
  onReturnToSetup?: () => void;
  onRegenerateExam?: () => void;
}

export function PracticeSession({
  questions,
  title,
  config,
  sessionKey,
  initialIndex = 0,
  mockExamSpec,
  onReturnToSetup,
  onRegenerateExam,
}: PracticeSessionProps) {
  return (
    <PracticeSessionInner
      key={sessionKey}
      sessionKey={sessionKey}
      questions={questions}
      title={title}
      config={config}
      initialIndex={initialIndex}
      mockExamSpec={mockExamSpec}
      onReturnToSetup={onReturnToSetup}
      onRegenerateExam={onRegenerateExam}
    />
  );
}

function PracticeSessionInner({
  sessionKey,
  questions,
  title,
  config,
  initialIndex = 0,
  mockExamSpec,
  onReturnToSetup,
  onRegenerateExam,
}: PracticeSessionProps) {
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
  const examSimulation = config.examSimulation;
  const showTimer = config.showSessionTimer;
  const [index, setIndex] = useState(initialIndex);
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
    if (showTimer) {
      setPracticeHeader({
        mode: "elapsed",
        startedAt,
        paused: false,
        totalPausedMs: 0,
      });
    } else {
      setPracticeHeader(null);
    }
    return () => setPracticeHeader(null);
  }, [practiceMode, setPracticeHeader, showTimer]);

  useEffect(() => {
    if (!question) return;
    const questionKey = question.questionKey;
    // Record when each question becomes visible for thinking-time measurement.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync progress with visible question
    patchProgress((prev) => {
      const attempt = getAttempt(prev, questionKey);
      if (examSimulation && attempt.thinkingMs != null) return prev;
      return patchQuestionShown(prev, questionKey);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on questionKey only
  }, [question?.questionKey, patchProgress, examSimulation]);

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
      ...practiceConfigAnalyticsParams(config),
    });
    setUserProperties({
      last_practice_mode: practiceMode,
      last_exam_year: examYear,
      last_lecture_slug: lectureSlug,
    });
  }, [
    questions.length,
    practiceMode,
    examYear,
    lectureSlug,
    title,
    pathname,
    config,
  ]);

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
      if (!question || index >= questions.length - 1) return;

      if (examSimulation) {
        if (!selectedId) return;
        patchProgress((prev) =>
          patchQuestionThinkingFrozen(prev, question.questionKey)
        );
        trackAnalyticsEvent(AnalyticsEvents.practiceNext, {
          ...practiceBase(source),
          ...questionAnalyticsParams(question),
        });
        setIndex((i) => i + 1);
        return;
      }

      if (revealed) {
        trackAnalyticsEvent(AnalyticsEvents.practiceNext, {
          ...practiceBase(source),
          ...questionAnalyticsParams(question),
        });
        setIndex((i) => i + 1);
      }
    },
    [
      index,
      questions.length,
      revealed,
      question,
      practiceBase,
      examSimulation,
      selectedId,
      patchProgress,
    ]
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
    examSimulation,
    onSelect: (id) => handleSelect(id, "keyboard"),
    onCheck: () => handleCheck("keyboard"),
    onPrevious: () => handlePrevious("keyboard"),
    onNext: () => handleNext("keyboard"),
    onSave: () => handleSave("keyboard"),
  });

  const finishSession = useCallback(
    (finalProgress: PracticeProgress) => {
      const finishedAt = new Date().toISOString();
      const score = computePracticeScore(questions, finalProgress);
      const includeWallClock = config.showSessionTimer;
      const timing = computePracticeTimingStats(questions, finalProgress, {
        sessionStartedAt: includeWallClock
          ? sessionStartedAtRef.current ?? undefined
          : undefined,
        finishedAt: includeWallClock ? finishedAt : undefined,
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
        session_wall_ms: includeWallClock
          ? timing.sessionWallMs ?? undefined
          : undefined,
        ...practiceConfigAnalyticsParams(config),
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
        progress: finalProgress,
        config,
        mockExamSpec,
      });
      clearPracticeProgress(sessionKey);
      router.push(`/practice/results/?id=${id}`);
    },
    [sessionKey, title, questions, router, pathname, config, mockExamSpec]
  );

  const handleFinish = useCallback(() => {
    finishSession(progress);
  }, [finishSession, progress]);

  const handleSubmitExam = useCallback(() => {
    if (!allQuestionsAnswered(questions, progress)) return;
    const next = patchAllQuestionsRevealed(progress, questions);
    patchProgress(() => next);
    finishSession(next);
  }, [questions, progress, patchProgress, finishSession]);

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

    const startedAt = Date.now();
    sessionStartedAtRef.current = new Date(startedAt).toISOString();
    pauseStartedAtRef.current = null;
    prevPausedRef.current = false;

    if (showTimer) {
      setPracticeHeader({
        mode: "elapsed",
        startedAt,
        paused: false,
        totalPausedMs: 0,
      });
    }
  }, [sessionKey, pathname, title, progress, showTimer, setPracticeHeader]);

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
  const everyQuestionAnswered = allQuestionsAnswered(questions, progress);

  return (
    <>
      <PracticePauseOverlay open={paused && showTimer} />
      {showTimer ? <PracticeFloatingTimer /> : null}
      <div
        className={cn(
          "mx-auto flex max-w-3xl flex-col gap-6",
          showTimer ? "pt-12 md:pt-14" : "pt-2"
        )}
        aria-hidden={paused}
        style={{
          paddingBottom: `calc(${PRACTICE_FOOTER_HEIGHT} + 1.5rem)`,
        }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <div className="flex shrink-0 items-center gap-2">
              {onRegenerateExam ? (
                <RegenerateMockExamButton
                  onConfirm={() => {
                    onRegenerateExam();
                    onReturnToSetup?.();
                  }}
                />
              ) : null}
              <ResetPracticeProgressButton
                savedCount={savedCount}
                onConfirm={handleResetProgress}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Question {index + 1} of {questions.length}
          </p>
          <Progress value={progressPct} className="h-2" />
        </div>

        <Card className="relative">
          {!examSimulation ? (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-0.5">
              <ReportIssueButton question={question} corner />
              <SaveButton key={question.questionKey} question={question} corner />
            </div>
          ) : null}
          <CardHeader className={examSimulation ? undefined : "pr-40"}>
            <CardTitle className="text-base font-medium text-muted-foreground">
              {examSimulation
                ? "Select your answer"
                : revealed
                  ? correct
                    ? "Correct"
                    : "Incorrect"
                  : "Answer the question"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <QuestionCard
              question={question}
              selectedId={selectedId}
              onSelect={handleSelect}
              revealed={examSimulation ? false : revealed}
              disabled={examSimulation ? false : revealed}
              hideMeta={examSimulation}
            />

            {!examSimulation && revealed ? (
              <AnswerReveal question={question} />
            ) : null}
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
        mode={examSimulation ? "exam" : "standard"}
        allAnswered={everyQuestionAnswered}
        onPrevious={() => handlePrevious("click")}
        onNext={() => handleNext("click")}
        onCheck={() => handleCheck("click")}
        onFinish={handleFinish}
        onSubmitExam={handleSubmitExam}
      />
    </>
  );
}

