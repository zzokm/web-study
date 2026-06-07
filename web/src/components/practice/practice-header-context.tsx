"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export const PRACTICE_EXAM_DURATION_MS = 2 * 60 * 60 * 1000;

export type PracticeHeaderTimerMode = "elapsed" | "countdown";

export type PracticeHeaderState = {
  mode: PracticeHeaderTimerMode;
  startedAt: number;
  durationMs?: number;
  paused: boolean;
  /** Epoch ms when the current pause started. */
  pausedAt?: number;
  /** Accumulated pause duration across resume cycles. */
  totalPausedMs: number;
};

type PracticeHeaderContextValue = {
  state: PracticeHeaderState | null;
  setPracticeHeader: (state: PracticeHeaderState | null) => void;
  togglePracticePause: () => void;
};

const PracticeHeaderContext = createContext<PracticeHeaderContextValue | null>(
  null
);

export function PracticeHeaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PracticeHeaderState | null>(null);
  const setPracticeHeader = useCallback((next: PracticeHeaderState | null) => {
    setState(next);
  }, []);

  const togglePracticePause = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev;
      if (prev.paused) {
        const pausedAt = prev.pausedAt ?? Date.now();
        return {
          ...prev,
          paused: false,
          pausedAt: undefined,
          totalPausedMs: prev.totalPausedMs + (Date.now() - pausedAt),
        };
      }
      return {
        ...prev,
        paused: true,
        pausedAt: Date.now(),
      };
    });
  }, []);

  return (
    <PracticeHeaderContext.Provider
      value={{ state, setPracticeHeader, togglePracticePause }}
    >
      {children}
    </PracticeHeaderContext.Provider>
  );
}

export function usePracticeHeader() {
  const context = useContext(PracticeHeaderContext);
  if (!context) {
    throw new Error(
      "usePracticeHeader must be used within PracticeHeaderProvider"
    );
  }
  return context;
}

export function usePracticeHeaderState() {
  return useContext(PracticeHeaderContext)?.state ?? null;
}

export function getPracticeElapsedMs(
  state: PracticeHeaderState,
  now = Date.now()
): number {
  const effectiveNow =
    state.paused && state.pausedAt != null ? state.pausedAt : now;
  return Math.max(0, effectiveNow - state.startedAt - state.totalPausedMs);
}
