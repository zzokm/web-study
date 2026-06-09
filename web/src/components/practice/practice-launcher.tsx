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
  DEFAULT_LECTURE_PRACTICE_SESSION_CONFIG,
  DEFAULT_PRACTICE_SESSION_CONFIG,
  DEFAULT_WRITTEN_PRACTICE_SESSION_CONFIG,
  preparePracticeQuestions,
  practiceConfigAnalyticsParams,
  type PracticeSessionConfig,
} from "@/lib/practice-session-config";
import { excludeWrittenQuestions } from "@/lib/questions";
import { filterWrittenQuestionsByTrack } from "@/lib/written-practice-filter";
import { clearActivePracticeSession } from "@/lib/practice-active-session";
import { practiceScopeIdFromPathname } from "@/lib/practice-scope";
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
  variant?: "default" | "written" | "lecture";
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
  const isLecture = variant === "lecture";
  const defaultConfig = isWritten
    ? DEFAULT_WRITTEN_PRACTICE_SESSION_CONFIG
    : isLecture
      ? DEFAULT_LECTURE_PRACTICE_SESSION_CONFIG
      : DEFAULT_PRACTICE_SESSION_CONFIG;

  const [phase, setPhase] = useState<LauncherPhase>("setup");
  const [config, setConfig] = useState<PracticeSessionConfig>(defaultConfig);

  const sessionQuestions = useMemo(() => {
    if (isWritten) {
      return filterWrittenQuestionsByTrack(
        baseQuestions,
        config.writtenTrack ?? "both"
      );
    }
    if (isLecture && !config.includeWrittenQuestions) {
      return excludeWrittenQuestions(baseQuestions);
    }
    return baseQuestions;
  }, [
    baseQuestions,
    config.includeWrittenQuestions,
    config.writtenTrack,
    isLecture,
    isWritten,
  ]);

  /** Set when a session starts; only read while `phase === "session"`. */
  const [activeSessionKey, setActiveSessionKey] = useState("");
  const [preparedSessionQuestions, setPreparedSessionQuestions] = useState<
    Question[]
  >([]);
  const [initialIndex, setInitialIndex] = useState(0);
  const [startFresh, setStartFresh] = useState(false);
  const setupViewedRef = useRef(false);

  const practiceScopeId = useMemo(
    () => practiceScopeIdFromPathname(pathname),
    [pathname]
  );

  const canonicalKey = useMemo(
    () => canonicalPracticeSessionKey(sessionQuestions),
    [sessionQuestions]
  );

  const sessionStatus = useSyncExternalStore(
    subscribePracticeStatus,
    (): PracticeSessionStatus | null => {
      void getPracticeStatusStoreVersion();
      if (phase !== "setup") return null;
      return getPracticeSessionStatusSnapshot(sessionQuestions, practiceScopeId);
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
    reconcilePracticeSessionPointer(sessionQuestions, practiceScopeId);
    bumpPracticeStatusStore();
  }, [phase, canonicalKey, practiceScopeId, sessionQuestions]);

  const beginSession = useCallback(
    (
      mode: "start" | "continue" | "fresh",
      options?: {
        sessionKey?: string;
        config?: PracticeSessionConfig;
        resumeIndex?: number;
      }
    ) => {
      const sessionConfig = options?.config ?? config;
      const key =
        options?.sessionKey ??
        practiceSessionKey(sessionQuestions, sessionConfig);
      const fresh = mode === "fresh";

      if (fresh) {
        clearActivePracticeSession();
        clearPracticeProgress(practiceScopeId, key, canonicalKey);
      }

      let prepared: Question[];
      const savedDisplay = loadPracticeDisplaySnapshot(practiceScopeId, key);

      if (!fresh && savedDisplay?.questionKeys.length) {
        prepared = applyDisplaySnapshot(sessionQuestions, savedDisplay);
      } else {
        prepared = preparePracticeQuestions(sessionQuestions, sessionConfig);
        savePracticeDisplaySnapshot(
          practiceScopeId,
          key,
          buildDisplaySnapshot(prepared)
        );
      }

      const progress = fresh
        ? {}
        : loadPracticeProgress(practiceScopeId, key);
      const index =
        typeof options?.resumeIndex === "number"
          ? Math.min(
              Math.max(0, options.resumeIndex),
              Math.max(0, prepared.length - 1)
            )
          : mode === "continue"
            ? resumeQuestionIndex(
                prepared,
                progress,
                sessionConfig.examSimulation
              )
            : 0;

      touchPracticeSessionPointer({
        scopeId: practiceScopeId,
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
    [canonicalKey, config, pathname, practiceScopeId, sessionQuestions, title]
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
      clearPracticeProgress(
        practiceScopeId,
        sessionStatus.sessionKey,
        canonicalKey
      );
      bumpPracticeStatusStore();
    }
    beginSession("fresh");
  }, [beginSession, canonicalKey, practiceScopeId, sessionStatus]);

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
        practiceScopeId={practiceScopeId}
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
