"use client";

import { useEffect, useState } from "react";
import { ClockIcon, KeyboardIcon, PauseIcon, PlayIcon } from "lucide-react";
import {
  usePracticeHeader,
  usePracticeHeaderState,
} from "@/components/practice/practice-header-context";
import { PRACTICE_KEYBOARD_HINTS } from "@/lib/practice-keyboard";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatTimer(ms: number, includeHours: boolean): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (includeHours || hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${minutes}:${pad(seconds)}`;
}

function getElapsedMs(
  state: NonNullable<ReturnType<typeof usePracticeHeaderState>>,
  now: number
): number {
  const effectiveNow =
    state.paused && state.pausedAt != null ? state.pausedAt : now;
  return Math.max(0, effectiveNow - state.startedAt - state.totalPausedMs);
}

function PracticeTimer({ className }: { className?: string }) {
  const state = usePracticeHeaderState();
  const { togglePracticePause } = usePracticeHeader();
  const [now, setNow] = useState(() => Date.now());
  const paused = state?.paused ?? false;

  useEffect(() => {
    if (!state || paused) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [state, paused]);

  if (!state) return null;

  const elapsed = getElapsedMs(state, now);
  const timeLabel = formatTimer(elapsed, elapsed >= 3600000);

  return (
    <div
      className={cn(
        "flex h-10 shrink-0 items-center rounded-full border border-border bg-background shadow-sm transition-all duration-300 ease-out",
        state.paused
          ? "scale-[0.98] border-muted-foreground/30 bg-muted/40 shadow-md"
          : "scale-100",
        className
      )}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center"
        aria-hidden
      >
        <ClockIcon
          className={cn(
            "size-4 text-muted-foreground",
            state.paused && "text-muted-foreground"
          )}
          strokeWidth={2}
        />
      </div>
      <span
        className={cn(
          "flex min-w-[5.75rem] flex-1 items-center justify-center font-mono text-base font-semibold tracking-tight tabular-nums transition-colors duration-300",
          state.paused && "text-muted-foreground"
        )}
      >
        {timeLabel}
      </span>
      <button
        type="button"
        onClick={togglePracticePause}
        data-analytics-zone="practice_timer"
        data-analytics-id="practice_timer_pause"
        data-analytics-skip
        className="flex size-10 shrink-0 items-center justify-center text-muted-foreground transition-colors duration-200 hover:text-foreground active:scale-95"
        aria-label={state.paused ? "Resume timer" : "Pause timer"}
      >
        <span className="relative flex size-4 items-center justify-center">
          <PlayIcon
            className={cn(
              "absolute size-4 fill-current stroke-none transition-all duration-200 ease-out",
              state.paused
                ? "scale-100 opacity-100"
                : "scale-75 opacity-0"
            )}
          />
          <PauseIcon
            className={cn(
              "absolute size-4 fill-current stroke-none transition-all duration-200 ease-out",
              state.paused
                ? "scale-75 opacity-0"
                : "scale-100 opacity-100"
            )}
          />
        </span>
      </button>
    </div>
  );
}

function KeyboardHints() {
  const state = usePracticeHeaderState();
  if (!state) return null;

  return (
    <>
      <div className="hidden items-center gap-1 lg:flex">
        {PRACTICE_KEYBOARD_HINTS.map((hint) => (
          <Badge
            key={hint.keys}
            variant="secondary"
            className="h-6 gap-1 px-2 text-[10px] font-normal tabular-nums"
          >
            <span className="font-medium text-foreground">{hint.keys}</span>
            <span className="text-muted-foreground">{hint.label}</span>
          </Badge>
        ))}
      </div>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Keyboard shortcuts"
            />
          }
        >
          <KeyboardIcon className="size-4 shrink-0" />
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <ul className="space-y-1 text-xs">
            {PRACTICE_KEYBOARD_HINTS.map((hint) => (
              <li key={hint.keys} className="flex justify-between gap-4">
                <span className="font-medium tabular-nums">{hint.keys}</span>
                <span className="text-muted-foreground">{hint.label}</span>
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </>
  );
}

export function PracticeFloatingTimer() {
  const state = usePracticeHeaderState();
  if (!state) return null;

  return (
    <div
      className="pointer-events-none fixed z-[50] top-[calc(var(--app-shell-header-height)+0.75rem)] left-3 transition-[left] duration-200 ease-linear md:left-[calc(var(--sidebar-inset-left)+0.75rem)]"
      aria-hidden={false}
    >
      <div className="pointer-events-auto">
        <PracticeTimer className="shadow-md ring-1 ring-foreground/5" />
      </div>
    </div>
  );
}

export function PracticeHeaderShortcuts() {
  const state = usePracticeHeaderState();
  if (!state) return null;

  return (
    <div className="flex shrink-0 items-center gap-2">
      <KeyboardHints />
    </div>
  );
}
