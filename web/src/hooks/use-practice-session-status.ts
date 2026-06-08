"use client";

import { useSyncExternalStore } from "react";
import {
  getPracticeStatusStoreVersion,
  resolvePracticeSessionStatus,
  subscribePracticeStatus,
  type PracticeSessionStatus,
} from "@/lib/practice-session-pointer";
import type { Question } from "@/types/question";

export function usePracticeSessionStatus(
  questions: Question[]
): PracticeSessionStatus | null {
  return useSyncExternalStore(
    subscribePracticeStatus,
    () => {
      void getPracticeStatusStoreVersion();
      if (questions.length === 0) return null;
      return resolvePracticeSessionStatus(questions);
    },
    () => null
  );
}
