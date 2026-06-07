"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { Question } from "@/types/question";
import { AnalyticsEvents } from "@/lib/analytics-events";
import {
  practiceContextFromPath,
  trackAnalyticsEvent,
} from "@/lib/analytics";
import {
  applyDisplaySnapshot,
  buildDisplaySnapshot,
  DEFAULT_PRACTICE_SESSION_CONFIG,
  preparePracticeQuestions,
  practiceConfigAnalyticsParams,
  type PracticeSessionConfig,
} from "@/lib/practice-session-config";
import {
  answeredQuestionCount,
  clearPracticeProgress,
  hasPracticeProgress,
  loadPracticeDisplaySnapshot,
  loadPracticeProgress,
  practiceSessionKey,
  resumeQuestionIndex,
  savePracticeDisplaySnapshot,
} from "@/lib/practice-progress";
import { PracticeSetup } from "@/components/practice/practice-setup";

const PracticeSession = dynamic(
  () => import("./practice-session").then((m) => m.PracticeSession),
  { ssr: false }
);

type LauncherPhase = "setup" | "session";

export type PracticeLauncherProps = {
  questions: Question[];
  title: string;
  backHref?: string;
};

export function PracticeLauncher({
  questions: baseQuestions,
  title,
  backHref,
}: PracticeLauncherProps) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<LauncherPhase>("setup");
  const [config, setConfig] = useState<PracticeSessionConfig>(
    DEFAULT_PRACTICE_SESSION_CONFIG
  );
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [initialIndex, setInitialIndex] = useState(0);
  const [startFresh, setStartFresh] = useState(false);
  const setupViewedRef = useRef(false);

  const sessionKey = useMemo(
    () => practiceSessionKey(baseQuestions, config),
    [baseQuestions, config]
  );

  const savedProgress = useMemo(
    () => loadPracticeProgress(sessionKey),
    [sessionKey]
  );

  const canResume = hasPracticeProgress(savedProgress);
  const resumeAnswered = answeredQuestionCount(baseQuestions, savedProgress);

  useEffect(() => {
    if (setupViewedRef.current || baseQuestions.length === 0) return;
    setupViewedRef.current = true;
    trackAnalyticsEvent(AnalyticsEvents.practiceSetupView, {
      ...practiceContextFromPath(pathname, title),
      question_count: baseQuestions.length,
    });
  }, [baseQuestions.length, pathname, title]);

  const beginSession = useCallback(
    (mode: "start" | "resume" | "fresh") => {
      const fresh = mode === "fresh";
      if (fresh) {
        clearPracticeProgress(sessionKey);
      }

      let prepared: Question[];
      const savedDisplay = loadPracticeDisplaySnapshot(sessionKey);

      if (!fresh && savedDisplay?.questionKeys.length) {
        prepared = applyDisplaySnapshot(baseQuestions, savedDisplay);
      } else {
        prepared = preparePracticeQuestions(baseQuestions, config);
        savePracticeDisplaySnapshot(sessionKey, buildDisplaySnapshot(prepared));
      }

      const progress = fresh ? {} : loadPracticeProgress(sessionKey);
      const index =
        mode === "resume"
          ? resumeQuestionIndex(prepared, progress, config.examSimulation)
          : 0;

      trackAnalyticsEvent(AnalyticsEvents.practiceSetupStart, {
        ...practiceContextFromPath(pathname, title),
        question_count: baseQuestions.length,
        start_mode: mode,
        ...practiceConfigAnalyticsParams(config),
      });

      setStartFresh(fresh);
      setSessionQuestions(prepared);
      setInitialIndex(index);
      setPhase("session");
    },
    [baseQuestions, config, pathname, sessionKey, title]
  );

  if (baseQuestions.length === 0) {
    return null;
  }

  if (phase === "session" && sessionQuestions.length > 0) {
    return (
      <PracticeSession
        key={`${sessionKey}:${startFresh ? "fresh" : "cont"}`}
        questions={sessionQuestions}
        title={title}
        config={config}
        sessionKey={sessionKey}
        initialIndex={initialIndex}
        startFresh={startFresh}
      />
    );
  }

  return (
    <PracticeSetup
      title={title}
      questionCount={baseQuestions.length}
      config={config}
      onConfigChange={setConfig}
      canResume={canResume}
      resumeAnswered={resumeAnswered}
      onStart={() => beginSession("start")}
      onResume={() => beginSession("resume")}
      onStartFresh={() => beginSession("fresh")}
      backHref={backHref}
    />
  );
}
