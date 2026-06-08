"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
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
  DEFAULT_WRITTEN_PRACTICE_SESSION_CONFIG,
  preparePracticeQuestions,
  practiceConfigAnalyticsParams,
  type PracticeSessionConfig,
} from "@/lib/practice-session-config";
import { filterWrittenQuestionsByTrack } from "@/lib/written-practice-filter";
import {
  canonicalPracticeSessionKey,
  clearPracticeProgress,
  loadPracticeDisplaySnapshot,
  loadPracticeProgress,
  practiceSessionKey,
  resumeQuestionIndex,
  savePracticeDisplaySnapshot,
} from "@/lib/practice-progress";
import {
  bumpPracticeStatusStore,
  getPracticeStatusStoreVersion,
  getPracticeSessionStatusSnapshot,
  reconcilePracticeSessionPointer,
  subscribePracticeStatus,
  touchPracticeSessionPointer,
  type PracticeSessionStatus,
} from "@/lib/practice-session-pointer";
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
  variant?: "default" | "written";
};

export function PracticeLauncher({
  questions: baseQuestions,
  title,
  backHref,
  variant = "default",
}: PracticeLauncherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isWritten = variant === "written";
  const defaultConfig = isWritten
    ? DEFAULT_WRITTEN_PRACTICE_SESSION_CONFIG
    : DEFAULT_PRACTICE_SESSION_CONFIG;

  const [phase, setPhase] = useState<LauncherPhase>("setup");
  const [config, setConfig] = useState<PracticeSessionConfig>(defaultConfig);

  const sessionQuestions = useMemo(() => {
    if (!isWritten) return baseQuestions;
    return filterWrittenQuestionsByTrack(
      baseQuestions,
      config.writtenTrack ?? "both"
    );
  }, [baseQuestions, config.writtenTrack, isWritten]);

  const [activeSessionKey, setActiveSessionKey] = useState(() =>
    practiceSessionKey(
      isWritten
        ? filterWrittenQuestionsByTrack(
            baseQuestions,
            defaultConfig.writtenTrack ?? "both"
          )
        : baseQuestions,
      defaultConfig
    )
  );
  const [preparedSessionQuestions, setPreparedSessionQuestions] = useState<
    Question[]
  >([]);
  const [initialIndex, setInitialIndex] = useState(0);
  const [startFresh, setStartFresh] = useState(false);
  const setupViewedRef = useRef(false);

  const canonicalKey = useMemo(
    () => canonicalPracticeSessionKey(sessionQuestions),
    [sessionQuestions]
  );

  useEffect(() => {
    if (phase !== "setup" || !isWritten) return;
    setActiveSessionKey(practiceSessionKey(sessionQuestions, config));
  }, [phase, isWritten, sessionQuestions, config]);

  const sessionStatus = useSyncExternalStore(
    subscribePracticeStatus,
    (): PracticeSessionStatus | null => {
      void getPracticeStatusStoreVersion();
      if (phase !== "setup") return null;
      return getPracticeSessionStatusSnapshot(sessionQuestions);
    },
    (): PracticeSessionStatus | null => null
  );

  const statusHydrated = useSyncExternalStore(
    subscribePracticeStatus,
    () => true,
    () => false
  );

  const bumpSessionStatus = useCallback(() => {
    bumpPracticeStatusStore();
  }, []);

  useEffect(() => {
    if (setupViewedRef.current || sessionQuestions.length === 0) return;
    setupViewedRef.current = true;
    trackAnalyticsEvent(AnalyticsEvents.practiceSetupView, {
      ...practiceContextFromPath(pathname, title),
      question_count: sessionQuestions.length,
    });
  }, [sessionQuestions.length, pathname, title]);

  useEffect(() => {
    if (phase !== "setup" || sessionQuestions.length === 0) return;
    reconcilePracticeSessionPointer(sessionQuestions);
    bumpPracticeStatusStore();
  }, [phase, canonicalKey, sessionQuestions]);

  const beginSession = useCallback(
    (
      mode: "start" | "continue" | "fresh",
      options?: { sessionKey?: string; config?: PracticeSessionConfig }
    ) => {
      const sessionConfig = options?.config ?? config;
      const key =
        options?.sessionKey ??
        practiceSessionKey(sessionQuestions, sessionConfig);
      const fresh = mode === "fresh";

      if (fresh) {
        clearPracticeProgress(key, canonicalKey);
      }

      let prepared: Question[];
      const savedDisplay = loadPracticeDisplaySnapshot(key);

      if (!fresh && savedDisplay?.questionKeys.length) {
        prepared = applyDisplaySnapshot(sessionQuestions, savedDisplay);
      } else {
        prepared = preparePracticeQuestions(sessionQuestions, sessionConfig);
        savePracticeDisplaySnapshot(key, buildDisplaySnapshot(prepared));
      }

      const progress = fresh ? {} : loadPracticeProgress(key);
      const index =
        mode === "continue"
          ? resumeQuestionIndex(
              prepared,
              progress,
              sessionConfig.examSimulation
            )
          : 0;

      touchPracticeSessionPointer({
        questions: sessionQuestions,
        sessionKey: key,
        config: sessionConfig,
        status: "in_progress",
      });
      bumpPracticeStatusStore();

      trackAnalyticsEvent(AnalyticsEvents.practiceSetupStart, {
        ...practiceContextFromPath(pathname, title),
        question_count: sessionQuestions.length,
        start_mode: mode === "continue" ? "resume" : mode === "fresh" ? "fresh" : "start",
        ...practiceConfigAnalyticsParams(sessionConfig),
      });

      setConfig(sessionConfig);
      setActiveSessionKey(key);
      setStartFresh(fresh);
      setPreparedSessionQuestions(prepared);
      setInitialIndex(index);
      setPhase("session");
    },
    [canonicalKey, config, pathname, sessionQuestions, title]
  );

  const handleContinue = useCallback(() => {
    if (!sessionStatus || sessionStatus.kind !== "in_progress") return;
    beginSession("continue", {
      sessionKey: sessionStatus.sessionKey,
      config: sessionStatus.config,
    });
  }, [beginSession, sessionStatus]);

  const handleViewResults = useCallback(() => {
    if (!sessionStatus || sessionStatus.kind !== "completed") return;
    router.push(`/practice/results/?id=${sessionStatus.resultId}`);
  }, [router, sessionStatus]);

  const handleStartFresh = useCallback(() => {
    if (sessionStatus?.kind === "in_progress") {
      beginSession("fresh", {
        sessionKey: sessionStatus.sessionKey,
        config: sessionStatus.config,
      });
      return;
    }
    if (sessionStatus?.kind === "completed") {
      clearPracticeProgress(sessionStatus.sessionKey, canonicalKey);
      bumpPracticeStatusStore();
    }
    beginSession("fresh");
  }, [beginSession, canonicalKey, sessionStatus]);

  if (baseQuestions.length === 0) {
    return null;
  }

  if (phase === "session" && preparedSessionQuestions.length > 0) {
    return (
      <PracticeSession
        key={`${activeSessionKey}:${startFresh ? "fresh" : "cont"}`}
        questions={preparedSessionQuestions}
        title={title}
        config={config}
        sessionKey={activeSessionKey}
        initialIndex={initialIndex}
        startFresh={startFresh}
        canonicalKey={canonicalKey}
        onSessionFinished={bumpSessionStatus}
      />
    );
  }

  return (
    <PracticeSetup
      title={title}
      questionCount={sessionQuestions.length}
      config={config}
      onConfigChange={setConfig}
      sessionStatus={sessionStatus}
      statusHydrated={statusHydrated}
      onContinue={handleContinue}
      onViewResults={handleViewResults}
      onStart={() => beginSession("start")}
      onStartFresh={handleStartFresh}
      backHref={backHref}
      variant={variant}
    />
  );
}
