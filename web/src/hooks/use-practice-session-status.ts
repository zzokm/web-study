"use client";

import { useSyncExternalStore } from "react";
import {
  getPracticeSessionStatusSnapshot,
  getPracticeStatusStoreVersion,
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
      return getPracticeSessionStatusSnapshot(questions);
    },
    () => null
  );
}
