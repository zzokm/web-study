"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { AnalyticsEvents } from "@/lib/analytics-events";
import {
  practiceContextFromPath,
  trackAnalyticsEvent,
} from "@/lib/analytics";
import {
  createDefaultMockExamSpec,
  generateMockExam,
  isPlaceholderMockExamSpec,
  mockExamTitle,
  normalizeMockExamSpec,
  resolveMockExamSpecOnLoad,
  type MockExamSpec,
} from "@/lib/mock-exam";
import { clearActivePracticeSession } from "@/lib/practice-active-session";
import {
  clearMockExamProgress,
  loadActiveMockExamSpec,
  MOCK_EXAM_SCOPE_ID,
  mockExamSessionKey,
  saveActiveMockExamSpec,
} from "@/lib/mock-exam-storage";
import {
  applyDisplaySnapshot,
  buildDisplaySnapshot,
  practiceConfigAnalyticsParams,
} from "@/lib/practice-session-config";
import {
  answeredQuestionCount,
  hasPracticeProgress,
  loadPracticeDisplaySnapshot,
  loadPracticeProgress,
  resumeQuestionIndex,
  savePracticeDisplaySnapshot,
} from "@/lib/practice-progress";
import { randomUint32 } from "@/lib/seeded-random";
import { MockExamSetup } from "@/components/practice/mock-exam-setup";

const PracticeSession = dynamic(
  () => import("./practice-session").then((m) => m.PracticeSession),
  { ssr: false }
);

type LauncherPhase = "setup" | "session";

export function MockExamLauncher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromByExam = searchParams.get("from") === "by-exam";
  const backHref = fromByExam ? "/by-exam/" : "/practice/";

  const [ready, setReady] = useState(false);
  const [spec, setSpec] = useState<MockExamSpec>(() =>
    createDefaultMockExamSpec()
  );
  const [phase, setPhase] = useState<LauncherPhase>("setup");
  const [sessionQuestions, setSessionQuestions] = useState<
    import("@/types/question").Question[]
  >([]);
  const [initialIndex, setInitialIndex] = useState(0);
  const [startFresh, setStartFresh] = useState(false);
  const setupViewedRef = useRef(false);

  useEffect(() => {
    const nextSpec = resolveMockExamSpecOnLoad(loadActiveMockExamSpec());
    queueMicrotask(() => {
      setSpec(nextSpec);
      setReady(true);
    });
  }, []);

  const preview = useMemo(
    () => (ready ? generateMockExam(spec) : null),
    [spec, ready]
  );
  const sessionKey = useMemo(
    () => (ready ? mockExamSessionKey(spec) : ""),
    [spec, ready]
  );
  const savedProgress = useMemo(
    () =>
      ready ? loadPracticeProgress(MOCK_EXAM_SCOPE_ID, sessionKey) : {},
    [sessionKey, ready]
  );
  const canResume = ready && hasPracticeProgress(savedProgress);
  const resumeAnswered = preview
    ? answeredQuestionCount(preview.questions, savedProgress)
    : 0;

  useEffect(() => {
    if (!ready || isPlaceholderMockExamSpec(spec)) return;
    saveActiveMockExamSpec(spec);
  }, [spec, ready]);

  useEffect(() => {
    if (!ready || !preview || setupViewedRef.current) return;
    setupViewedRef.current = true;
    trackAnalyticsEvent(AnalyticsEvents.practiceSetupView, {
      ...practiceContextFromPath(pathname, "Mock exam"),
      question_count: preview.questions.length,
      practice_mode: "mock_exam",
    });
  }, [pathname, preview, ready]);

  const beginSession = useCallback(
    (
      mode: "start" | "resume" | "fresh",
      options?: { resumeIndex?: number }
    ) => {
      const fresh = mode === "fresh";
      const normalized = normalizeMockExamSpec(spec);

      if (fresh) {
        clearActivePracticeSession();
        clearMockExamProgress(normalized);
      }

      const generated = generateMockExam(normalized);
      let prepared = generated.questions;
      const savedDisplay = loadPracticeDisplaySnapshot(
        MOCK_EXAM_SCOPE_ID,
        sessionKey
      );

      if (!fresh && savedDisplay?.questionKeys.length) {
        prepared = applyDisplaySnapshot(generated.questions, savedDisplay);
      } else {
        savePracticeDisplaySnapshot(
          MOCK_EXAM_SCOPE_ID,
          sessionKey,
          buildDisplaySnapshot(prepared)
        );
      }

      const progress = fresh
        ? {}
        : loadPracticeProgress(MOCK_EXAM_SCOPE_ID, sessionKey);
      const index =
        typeof options?.resumeIndex === "number"
          ? Math.min(
              Math.max(0, options.resumeIndex),
              Math.max(0, prepared.length - 1)
            )
          : mode === "resume"
            ? resumeQuestionIndex(
                prepared,
                progress,
                normalized.config.examSimulation
              )
            : 0;

      trackAnalyticsEvent(AnalyticsEvents.practiceSetupStart, {
        ...practiceContextFromPath(pathname, mockExamTitle(prepared.length)),
        question_count: prepared.length,
        start_mode: mode,
        practice_mode: "mock_exam",
        frontend_share: normalized.frontendShare,
        mock_exam_seed: normalized.seed,
        ...practiceConfigAnalyticsParams(normalized.config),
      });

      if (mode === "start" || fresh) {
        trackAnalyticsEvent(AnalyticsEvents.mockExamGenerate, {
          ...practiceContextFromPath(pathname, mockExamTitle(prepared.length)),
          question_count: prepared.length,
          frontend_share: normalized.frontendShare,
          mock_exam_seed: normalized.seed,
        });
      }

      setStartFresh(fresh);
      setSessionQuestions(prepared);
      setInitialIndex(index);
      setPhase("session");
    },
    [spec, pathname, sessionKey]
  );

  const handleRegenerate = useCallback(() => {
    const prevKey = mockExamSessionKey(spec);
    clearMockExamProgress(spec);

    const nextSpec = normalizeMockExamSpec({
      ...spec,
      seed: randomUint32(),
    });
    setSpec(nextSpec);

    trackAnalyticsEvent(AnalyticsEvents.mockExamRegenerate, {
      ...practiceContextFromPath(pathname, "Mock exam"),
      question_count: nextSpec.questionCount,
      frontend_share: nextSpec.frontendShare,
      mock_exam_seed: nextSpec.seed,
      previous_session_key: prevKey,
    });
  }, [spec, pathname]);

  const handleReturnToSetup = useCallback(() => {
    clearActivePracticeSession();
    setPhase("setup");
    setSessionQuestions([]);
  }, []);

  if (!ready) {
    return null;
  }

  if (phase === "session" && sessionQuestions.length > 0) {
    return (
      <PracticeSession
        key={`${sessionKey}:${startFresh ? "fresh" : "cont"}`}
        questions={sessionQuestions}
        title={mockExamTitle(sessionQuestions.length)}
        config={spec.config}
        sessionKey={sessionKey}
        initialIndex={initialIndex}
        startFresh={startFresh}
        mockExamSpec={spec}
        onReturnToSetup={handleReturnToSetup}
        onRegenerateExam={handleRegenerate}
        practiceScopeId={MOCK_EXAM_SCOPE_ID}
      />
    );
  }

  return (
    <MockExamSetup
      spec={spec}
      onSpecChange={setSpec}
      canResume={canResume}
      resumeAnswered={resumeAnswered}
      generatedCount={preview?.questions.length ?? spec.questionCount}
      onStart={() => beginSession("start")}
      onResume={() => beginSession("resume")}
      onStartFresh={() => beginSession("fresh")}
      onRegenerate={handleRegenerate}
      backHref={backHref}
    />
  );
}
