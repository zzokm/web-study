"use client";

import { configStorageSuffix } from "@/lib/practice-session-config";
import type { MockExamSpec } from "@/lib/mock-exam";
import { clearPracticeProgress } from "@/lib/practice-progress";

const ACTIVE_SPEC_KEY = "webstudy:mock-exam-active-v1";
export const MOCK_EXAM_SCOPE_ID = "mock-exam" as const;

export function mockExamSessionKey(spec: MockExamSpec): string {
  const payload = [
    spec.version,
    spec.seed,
    spec.questionCount,
    spec.frontendShare,
    spec.backendShare,
    configStorageSuffix(spec.config),
  ].join("|");

  let h = 5381;
  for (let i = 0; i < payload.length; i++) {
    h = (h * 33) ^ payload.charCodeAt(i);
  }
  return `mock-exam-v1:${(h >>> 0).toString(16)}`;
}

export function saveActiveMockExamSpec(spec: MockExamSpec): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_SPEC_KEY, JSON.stringify(spec));
  } catch {
    // ignore
  }
}

export function loadActiveMockExamSpec(): MockExamSpec | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_SPEC_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockExamSpec;
    if (
      parsed?.version == null ||
      parsed.seed == null ||
      parsed.questionCount == null
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearMockExamProgress(spec: MockExamSpec): void {
  clearPracticeProgress(MOCK_EXAM_SCOPE_ID, mockExamSessionKey(spec));
}
